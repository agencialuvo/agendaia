import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import Twilio = require('twilio');

// Integración con WhatsApp Business Platform (envío/recepción de mensajes y plantillas).
// Mientras no haya acceso real (Meta Cloud API o BSP), WHATSAPP_PROVIDER=simulado
// registra el mensaje en el log en vez de enviarlo — el resto del sistema (conversaciones,
// motor de IA) funciona igual, solo cambia esta capa cuando lleguen las credenciales reales.
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Twilio.Twilio | null = null;

  private getClient(): Twilio.Twilio {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !authToken) {
      throw new Error(
        'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN no están configurados. Agrégalos al .env para activar el envío real por Twilio.',
      );
    }
    if (!this.client) {
      this.client = Twilio(sid, authToken);
    }
    return this.client;
  }

  private numeroWhatsapp(telefono: string) {
    return telefono.startsWith('whatsapp:') ? telefono : `whatsapp:${telefono}`;
  }

  async enviarMensaje(telefono: string, texto: string) {
    const provider = process.env.WHATSAPP_PROVIDER ?? 'simulado';

    if (provider === 'simulado') {
      this.logger.log(`[SIMULADO] WhatsApp -> ${telefono}: ${texto}`);
      return { proveedor: 'simulado', telefono, texto, enviado: true };
    }

    if (provider === 'twilio') {
      const numeroOrigen = process.env.TWILIO_WHATSAPP_NUMBER;
      if (!numeroOrigen) {
        throw new Error('TWILIO_WHATSAPP_NUMBER no está configurado (el número de WhatsApp de origen).');
      }
      const mensaje = await this.getClient().messages.create({
        from: this.numeroWhatsapp(numeroOrigen),
        to: this.numeroWhatsapp(telefono),
        body: texto,
      });
      this.logger.log(`WhatsApp (Twilio) -> ${telefono}: sid ${mensaje.sid}, estado ${mensaje.status}`);
      return { proveedor: 'twilio', telefono, texto, enviado: true, sid: mensaje.sid };
    }

    throw new NotImplementedException(
      `Proveedor de WhatsApp "${provider}" aún no está implementado. Usa WHATSAPP_PROVIDER=simulado o WHATSAPP_PROVIDER=twilio.`,
    );
  }
}
