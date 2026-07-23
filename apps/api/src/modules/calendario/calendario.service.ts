import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';

// Un solo calendario de Google compartido por la clínica (todos los doctores),
// autenticado vía Service Account (sin login humano, sin refresh tokens que expiren).
// El calendario debe estar compartido con GOOGLE_CALENDAR_CLIENT_EMAIL con permiso de edición.
@Injectable()
export class CalendarioService {
  private readonly logger = new Logger(CalendarioService.name);
  private cliente: calendar_v3.Calendar | null = null;

  health() {
    const configurado = Boolean(
      process.env.GOOGLE_CALENDAR_CLIENT_EMAIL &&
        process.env.GOOGLE_CALENDAR_PRIVATE_KEY &&
        process.env.GOOGLE_CALENDAR_ID,
    );
    return { modulo: 'calendario', estado: configurado ? 'configurado' : 'sin_credenciales' };
  }

  private getCalendarId(): string {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new ServiceUnavailableException(
        'GOOGLE_CALENDAR_ID no está configurado. Falta habilitar la integración con Google Calendar.',
      );
    }
    return calendarId;
  }

  private getClient(): calendar_v3.Calendar {
    if (this.cliente) return this.cliente;

    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new ServiceUnavailableException(
        'Faltan las credenciales de Google Calendar (GOOGLE_CALENDAR_CLIENT_EMAIL / GOOGLE_CALENDAR_PRIVATE_KEY). ' +
          'Genera una cuenta de servicio en Google Cloud y comparte el calendario de la clínica con su correo.',
      );
    }

    const auth = new JWT({
      email: clientEmail,
      // El .env guarda los saltos de línea de la private key como "\n" literal — hay que restaurarlos.
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.cliente = google.calendar({ version: 'v3', auth });
    return this.cliente;
  }

  // Franjas ocupadas del calendario de la clínica entre dos instantes — se usa para
  // filtrar horas disponibles y evitar dobles reservas antes de agendar.
  async obtenerOcupados(desde: Date, hasta: Date): Promise<{ inicio: Date; fin: Date }[]> {
    const calendarId = this.getCalendarId();
    const cliente = this.getClient();

    const respuesta = await cliente.freebusy.query({
      requestBody: {
        timeMin: desde.toISOString(),
        timeMax: hasta.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const ocupados = respuesta.data.calendars?.[calendarId]?.busy ?? [];
    return ocupados
      .filter((franja) => franja.start && franja.end)
      .map((franja) => ({ inicio: new Date(franja.start as string), fin: new Date(franja.end as string) }));
  }

  async crearEvento(params: {
    resumen: string;
    descripcion: string;
    inicio: Date;
    fin: Date;
  }): Promise<{ id: string; htmlLink: string | null }> {
    const calendarId = this.getCalendarId();
    const cliente = this.getClient();

    const evento = await cliente.events.insert({
      calendarId,
      requestBody: {
        summary: params.resumen,
        description: params.descripcion,
        start: { dateTime: params.inicio.toISOString() },
        end: { dateTime: params.fin.toISOString() },
      },
    });

    if (!evento.data.id) {
      throw new ServiceUnavailableException('Google Calendar no devolvió un id de evento al crearlo.');
    }

    this.logger.log(`Evento creado en Google Calendar: ${evento.data.id} (${params.resumen})`);
    return { id: evento.data.id, htmlLink: evento.data.htmlLink ?? null };
  }

  async eliminarEvento(eventId: string): Promise<void> {
    const calendarId = this.getCalendarId();
    const cliente = this.getClient();
    await cliente.events.delete({ calendarId, eventId });
  }
}
