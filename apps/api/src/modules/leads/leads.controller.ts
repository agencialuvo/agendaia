import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { EtapaLead } from '@prisma/client';
import { LeadsService } from './leads.service';
import { MetaGraphService } from './meta-graph.service';
import { MetaWebhookNotification } from './dto/meta-lead-webhook.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('clinicas/:clinicaSlug')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly metaGraphService: MetaGraphService,
  ) {}

  // Verificación del webhook de Meta (handshake de suscripción).
  // Meta llama a esto una sola vez al configurar el webhook con los query params hub.*
  // Referencia: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
  @Public()
  @Get('webhooks/meta-leads')
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

  // Notificación real de Meta cuando entra un lead nuevo. Meta solo avisa el leadgen_id
  // aquí — las respuestas del formulario se piden aparte a la Graph API (ver
  // MetaGraphService). Validamos la firma X-Hub-Signature-256 antes de confiar en el body.
  @Public()
  @Post('webhooks/meta-leads')
  async recibirLead(
    @Req() req: RawBodyRequest<Request>,
    @Param('clinicaSlug') clinicaSlug: string,
    @Body() payload: MetaWebhookNotification,
    @Headers('x-hub-signature-256') firma: string,
  ) {
    this.validarFirma(req.rawBody, firma);

    const leadgenChanges = (payload.entry ?? []).flatMap((entry) =>
      entry.changes.filter((cambio) => cambio.field === 'leadgen'),
    );

    const resultados = [];
    for (const cambio of leadgenChanges) {
      const leadgenId = cambio.value.leadgen_id;
      try {
        const datos = await this.metaGraphService.obtenerDatosLeadgen(leadgenId);
        const lead = await this.leadsService.crearDesdeMetaLeadAds(clinicaSlug, leadgenId, datos);
        resultados.push({ leadgenId, leadId: lead.id });
      } catch (error) {
        // No relanzamos: si le devolvemos un error a Meta, reintenta la notificación
        // completa (incluyendo los leadgen_id que sí procesamos bien) y esos ya están
        // deduplicados por metaLeadgenId, pero preferimos loguear y seguir con el resto.
        this.logger.error(`Error procesando leadgen ${leadgenId}: ${error}`);
      }
    }

    return { procesados: resultados.length };
  }

  private validarFirma(rawBody: Buffer | undefined, firmaRecibida: string | undefined) {
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      throw new UnauthorizedException('META_APP_SECRET no configurado');
    }
    if (!rawBody || !firmaRecibida?.startsWith('sha256=')) {
      throw new UnauthorizedException('Firma de Meta ausente o inválida');
    }

    const firmaEsperada = createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const recibida = firmaRecibida.slice('sha256='.length);

    const bufEsperada = Buffer.from(firmaEsperada, 'hex');
    const bufRecibida = Buffer.from(recibida, 'hex');
    if (bufEsperada.length !== bufRecibida.length || !timingSafeEqual(bufEsperada, bufRecibida)) {
      throw new UnauthorizedException('Firma de Meta inválida');
    }
  }

  @Get('leads')
  findAll(@Param('clinicaSlug') clinicaSlug: string) {
    return this.leadsService.findAllByClinica(clinicaSlug);
  }

  @Get('leads/:leadId')
  findOne(@Param('leadId') leadId: string) {
    return this.leadsService.findById(leadId);
  }

  @Patch('leads/:leadId/etapa')
  actualizarEtapa(@Param('leadId') leadId: string, @Body('etapa') etapa: EtapaLead) {
    return this.leadsService.actualizarEtapa(leadId, etapa);
  }
}
