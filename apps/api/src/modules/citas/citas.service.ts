import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { ServiciosService } from '../servicios/servicios.service';
import { CalendarioService } from '../calendario/calendario.service';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DURACION_CITA_MINUTOS = Number(process.env.DURACION_CITA_MINUTOS ?? 60);

interface HorarioAtencion {
  dias: string[];
  hora_inicio: string; // "09:00"
  hora_fin: string; // "22:00"
}

// Agenda: los 6 datos mínimos (nombre, motivo, celular, fecha, hora, doctor/a) + estado del ciclo de vida de la cita.
// La disponibilidad se calcula con la regla del guión (próximo día hábil + el siguiente), y las horas
// libres se cruzan contra el calendario real de Google (Service Account) para no ofrecer ni agendar
// un cupo que ya está ocupado. Si las credenciales de Google Calendar aún no están configuradas,
// el sistema sigue funcionando en modo degradado (sin cruce real, sin evento creado) para no bloquear
// el resto del flujo mientras se termina de habilitar el acceso.
@Injectable()
export class CitasService {
  private readonly logger = new Logger(CitasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
    private readonly serviciosService: ServiciosService,
    private readonly calendarioService: CalendarioService,
  ) {}

  private esDiaHabil(fecha: Date, diasHabiles: string[]): boolean {
    return diasHabiles.includes(DIAS_SEMANA[fecha.getDay()]);
  }

  private siguienteDiaHabil(desde: Date, diasHabiles: string[]): Date {
    const fecha = new Date(desde);
    fecha.setDate(fecha.getDate() + 1);
    while (!this.esDiaHabil(fecha, diasHabiles)) {
      fecha.setDate(fecha.getDate() + 1);
    }
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  }

  private horasDelDia(dia: Date, horario: HorarioAtencion): { inicio: Date; fin: Date }[] {
    const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number);
    const [horaFin, minFin] = horario.hora_fin.split(':').map(Number);

    const slots: { inicio: Date; fin: Date }[] = [];
    const cursor = new Date(dia);
    cursor.setHours(horaInicio, minInicio, 0, 0);
    const cierre = new Date(dia);
    cierre.setHours(horaFin, minFin, 0, 0);

    while (cursor.getTime() + DURACION_CITA_MINUTOS * 60000 <= cierre.getTime()) {
      const inicio = new Date(cursor);
      const fin = new Date(cursor.getTime() + DURACION_CITA_MINUTOS * 60000);
      slots.push({ inicio, fin });
      cursor.setMinutes(cursor.getMinutes() + DURACION_CITA_MINUTOS);
    }
    return slots;
  }

  private seSuperponen(a: { inicio: Date; fin: Date }, b: { inicio: Date; fin: Date }): boolean {
    return a.inicio < b.fin && b.inicio < a.fin;
  }

  // Réplica de la regla_horarios del guión: "ofrecer siempre el próximo día hábil
  // disponible más el siguiente" (ej. si hoy es martes, ofrecer miércoles y jueves).
  // Además cruza cada día contra el calendario real para devolver solo horas libres.
  async consultarDisponibilidad(clinicaSlug: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    const horario = clinica.horarioAtencion as unknown as HorarioAtencion;
    const diasHabiles = horario.dias;

    const dia1 = this.siguienteDiaHabil(new Date(), diasHabiles);
    const dia2 = this.siguienteDiaHabil(dia1, diasHabiles);

    const dias = await Promise.all(
      [dia1, dia2].map(async (dia) => {
        const slots = this.horasDelDia(dia, horario);
        let libres = slots;

        try {
          const finDelDia = new Date(dia);
          finDelDia.setHours(23, 59, 59, 999);
          const ocupados = await this.calendarioService.obtenerOcupados(dia, finDelDia);
          libres = slots.filter((slot) => !ocupados.some((ocupado) => this.seSuperponen(slot, ocupado)));
        } catch (error) {
          if (error instanceof ServiceUnavailableException) {
            this.logger.warn(
              `Google Calendar no está configurado todavía — devolviendo horario completo sin cruzar disponibilidad real para ${dia.toISOString().slice(0, 10)}.`,
            );
          } else {
            throw error;
          }
        }

        return {
          fecha: dia.toISOString().slice(0, 10),
          dia_semana: DIAS_SEMANA[dia.getDay()],
          horas_disponibles: libres.map((slot) => slot.inicio.toTimeString().slice(0, 5)),
        };
      }),
    );

    return { slots_disponibles: dias };
  }

  async agendarCita(params: {
    clinicaSlug: string;
    leadId: string;
    servicioNombre: string;
    fecha: string;
    hora: string;
    motivoConsulta: string;
  }) {
    const clinica = await this.tenantsService.findBySlug(params.clinicaSlug);
    const servicio = await this.serviciosService.resolverPorNombre(params.clinicaSlug, params.servicioNombre);

    const [hora, minutos] = params.hora.split(':').map(Number);
    const [anio, mes, dia] = params.fecha.split('-').map(Number);
    // OJO: new Date("YYYY-MM-DD") interpreta la fecha como medianoche UTC, no local —
    // en zonas con offset negativo (ej. Perú, UTC-5) eso cae en el día anterior local.
    // Por eso se construye con el constructor de componentes locales, igual que siguienteDiaHabil().
    const inicio = new Date(anio, mes - 1, dia, hora, minutos, 0, 0);
    const fin = new Date(inicio.getTime() + DURACION_CITA_MINUTOS * 60000);

    let googleCalendarEventId: string | null = null;

    try {
      const ocupados = await this.calendarioService.obtenerOcupados(inicio, fin);
      const hayConflicto = ocupados.some((ocupado) => this.seSuperponen({ inicio, fin }, ocupado));
      if (hayConflicto) {
        throw new ConflictException(
          `El horario ${params.hora} del ${params.fecha} ya está ocupado en el calendario de la clínica.`,
        );
      }

      const evento = await this.calendarioService.crearEvento({
        resumen: `${servicio.nombre} — ${params.motivoConsulta}`,
        descripcion: `Cita agendada por VELIA CRM-IA. Motivo: ${params.motivoConsulta}`,
        inicio,
        fin,
      });
      googleCalendarEventId = evento.id;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        this.logger.warn(
          'Google Calendar no está configurado todavía — la cita se agenda solo en el CRM, sin crear el evento real.',
        );
      } else {
        throw error;
      }
    }

    const cita = await this.prisma.cita.create({
      data: {
        clinicaId: clinica.id,
        leadId: params.leadId,
        servicioId: servicio.id,
        motivoConsulta: params.motivoConsulta,
        fecha: new Date(params.fecha),
        hora: params.hora,
        tipo: servicio.requiereEvaluacionPrevia ? 'EVALUACION' : 'TRATAMIENTO_DIRECTO',
        googleCalendarEventId,
      },
    });

    await this.prisma.lead.update({
      where: { id: params.leadId },
      data: { etapa: 'AGENDADO' },
    });

    return cita;
  }

  async findById(citaId: string) {
    const cita = await this.prisma.cita.findUnique({ where: { id: citaId } });
    if (!cita) {
      throw new NotFoundException(`No existe una cita con id "${citaId}"`);
    }
    return cita;
  }

  async listarPorRango(clinicaSlug: string, desde: string, hasta: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    return this.prisma.cita.findMany({
      where: {
        clinicaId: clinica.id,
        fecha: { gte: new Date(desde), lte: new Date(hasta) },
      },
      include: { lead: true, servicio: true, doctor: true },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    });
  }

  listarPorLead(leadId: string) {
    return this.prisma.cita.findMany({
      where: { leadId },
      include: { servicio: true, doctor: true },
      orderBy: { fecha: 'desc' },
    });
  }
}
