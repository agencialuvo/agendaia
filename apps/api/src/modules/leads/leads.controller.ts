import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EtapaLead } from '@prisma/client';
import { LeadsService } from './leads.service';
import { MetaLeadWebhookPayload } from './dto/meta-lead-webhook.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('clinicas/:clinicaSlug')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

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

  // Recibe un lead nuevo. Mientras no haya acceso real a Meta, se prueba con los
  // payloads de ejemplo en test/fixtures/meta-lead-ads-payloads.json.
  @Public()
  @Post('webhooks/meta-leads')
  recibirLead(
    @Param('clinicaSlug') clinicaSlug: string,
    @Body() payload: MetaLeadWebhookPayload,
  ) {
    return this.leadsService.crearDesdeMetaLeadAds(clinicaSlug, payload);
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
