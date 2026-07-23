import { Body, Controller, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import Twilio = require('twilio');
import { WhatsappService } from './whatsapp.service';
import { ConversacionesService } from '../conversaciones/conversaciones.service';
import { IaService } from '../ia/ia.service';
import { Public } from '../auth/decorators/public.decorator';

// Mensaje entrante real de Twilio (WhatsApp). Twilio manda application/x-www-form-urlencoded,
// no JSON, y firma cada request — validamos esa firma antes de confiar en el contenido.
// Nota: al ser un único número de WhatsApp para el piloto, la clínica se resuelve por
// TWILIO_CLINICA_SLUG (por ahora fijo a "velia"); cuando haya más de una clínica con número
// propio, esto debe resolverse buscando a qué clínica pertenece el número "To" recibido.
@Controller('webhooks/twilio')
export class TwilioWebhookController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly conversacionesService: ConversacionesService,
    private readonly iaService: IaService,
  ) {}

  @Public()
  @Post('whatsapp')
  async recibirMensaje(
    @Req() req: Request,
    @Body() body: Record<string, string>,
    @Headers('x-twilio-signature') firma: string,
  ) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      throw new UnauthorizedException('TWILIO_AUTH_TOKEN no configurado');
    }

    const urlCompleta = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const esValido = Twilio.validateRequest(authToken, firma ?? '', urlCompleta, body);
    if (!esValido) {
      throw new UnauthorizedException('Firma de Twilio inválida');
    }

    const clinicaSlug = process.env.TWILIO_CLINICA_SLUG ?? 'velia';
    const telefono = (body.From ?? '').replace(/^whatsapp:/, '');
    const texto = body.Body ?? '';
    const nombre = body.ProfileName;

    const { conversacion } = await this.conversacionesService.obtenerOCrearParaTelefono(
      clinicaSlug,
      telefono,
      nombre,
    );

    await this.conversacionesService.agregarMensaje(conversacion.id, 'lead', texto, 'humano');

    if (conversacion.modo === 'HUMANO') {
      return { estado: 'esperando_agente', conversacionId: conversacion.id };
    }

    const respuesta = await this.iaService.generarRespuesta(conversacion.id);
    if (respuesta.texto) {
      await this.whatsappService.enviarMensaje(telefono, respuesta.texto);
    }

    return { estado: 'respondido', conversacionId: conversacion.id, respuesta: respuesta.texto };
  }
}
