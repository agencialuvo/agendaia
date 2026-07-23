import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConversacionesService } from '../conversaciones/conversaciones.service';
import { IaService } from '../ia/ia.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('clinicas/:clinicaSlug/webhooks/whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly conversacionesService: ConversacionesService,
    private readonly iaService: IaService,
  ) {}

  // Verificación del webhook (mismo handshake que Meta usa para Lead Ads).
  @Public()
  @Get()
  verificarWebhook(
    @Query('hub.mode') modo: string,
    @Query('hub.verify_token') tokenRecibido: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const tokenEsperado = process.env.META_VERIFY_TOKEN;
    if (modo === 'subscribe' && tokenRecibido === tokenEsperado) {
      return challenge;
    }
    throw new BadRequestException('Token de verificación inválido');
  }

  // Mensaje entrante (real de Meta Cloud API/BSP, o simulado mientras no hay acceso real).
  // Payload simplificado: { telefono, nombre?, texto }
  @Public()
  @Post()
  async recibirMensaje(
    @Param('clinicaSlug') clinicaSlug: string,
    @Body() body: { telefono: string; nombre?: string; texto: string },
  ) {
    const { conversacion } = await this.conversacionesService.obtenerOCrearParaTelefono(
      clinicaSlug,
      body.telefono,
      body.nombre,
    );

    await this.conversacionesService.agregarMensaje(conversacion.id, 'lead', body.texto, 'humano');

    if (conversacion.modo === 'HUMANO') {
      return { estado: 'esperando_agente', conversacionId: conversacion.id };
    }

    const respuesta = await this.iaService.generarRespuesta(conversacion.id);
    if (respuesta.texto) {
      await this.whatsappService.enviarMensaje(body.telefono, respuesta.texto);
    }

    return { estado: 'respondido', conversacionId: conversacion.id, respuesta: respuesta.texto };
  }
}
