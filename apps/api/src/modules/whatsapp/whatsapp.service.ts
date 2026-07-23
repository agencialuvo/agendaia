import { Injectable, Logger, NotImplementedException } from '@nestjs/common';

// Integración con WhatsApp Business Platform (envío/recepción de mensajes y plantillas).
// Mientras no haya acceso real (Meta Cloud API o BSP), WHATSAPP_PROVIDER=simulado
// registra el mensaje en el log en vez de enviarlo — el resto del sistema (conversaciones,
// motor de IA) funciona igual, solo cambia esta capa cuando lleguen las credenciales reales.
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async enviarMensaje(telefono: string, texto: string) {
    const provider = process.env.WHATSAPP_PROVIDER ?? 'simulado';

    if (provider === 'simulado') {
      this.logger.log(`[SIMULADO] WhatsApp -> ${telefono}: ${texto}`);
      return { proveedor: 'simulado', telefono, texto, enviado: true };
    }

    throw new NotImplementedException(
      `Proveedor de WhatsApp "${provider}" aún no está implementado. Usa WHATSAPP_PROVIDER=simulado mientras se gestiona el acceso real.`,
    );
  }
}
