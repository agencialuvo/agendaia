import { Injectable, NotFoundException } from '@nestjs/common';
import { EtapaLead } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { ScoringService } from '../scoring/scoring.service';
import { MetaLeadgenData } from './dto/meta-lead-webhook.dto';

// Campos estándar que Meta Lead Ads usa para datos de contacto (no son preguntas de scoring).
const CAMPO_TELEFONO = 'phone_number';
const CAMPO_NOMBRE = 'full_name';

// Ingesta de leads: webhook de Meta Lead Ads (real o simulado) + creación desde WhatsApp orgánico.
@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
    private readonly scoringService: ScoringService,
  ) {}

  async crearDesdeMetaLeadAds(clinicaSlug: string, leadgenId: string, payload: MetaLeadgenData) {
    // Si Meta reintenta la notificación del webhook (timeout, error nuestro, etc.),
    // no debemos duplicar el lead — el leadgen_id es único por lead real de Meta.
    const existente = await this.prisma.lead.findUnique({ where: { metaLeadgenId: leadgenId } });
    if (existente) {
      return existente;
    }

    const clinica = await this.tenantsService.findBySlug(clinicaSlug);

    const respuestas: Record<string, string> = {};
    for (const campo of payload.field_data) {
      respuestas[campo.name] = campo.values[0] ?? '';
    }

    let campanaId: string | undefined;
    if (payload.campaign_id) {
      const campana = await this.prisma.campana.upsert({
        where: { metaCampaignId: payload.campaign_id },
        update: {
          nombre: payload.campaign_name ?? '',
          adsetId: payload.adset_id,
          adsetNombre: payload.adset_name,
          adId: payload.ad_id,
          adNombre: payload.ad_name,
          plataforma: payload.platform,
        },
        create: {
          clinicaId: clinica.id,
          metaCampaignId: payload.campaign_id,
          nombre: payload.campaign_name ?? '',
          adsetId: payload.adset_id,
          adsetNombre: payload.adset_name,
          adId: payload.ad_id,
          adNombre: payload.ad_name,
          plataforma: payload.platform,
        },
      });
      campanaId = campana.id;
    }

    const lead = await this.prisma.lead.create({
      data: {
        clinicaId: clinica.id,
        campanaId,
        nombreCompleto: respuestas[CAMPO_NOMBRE] ?? null,
        telefono: respuestas[CAMPO_TELEFONO] ?? '',
        respuestasFormulario: respuestas,
        origen: 'meta_lead_ads',
        metaLeadgenId: leadgenId,
      },
    });

    // Puntúa automáticamente si el formulario trae las 3 preguntas de scoring
    // (ver docs/Paso1_Guia_y_Checklist.md — esto reemplaza la demora manual de +12h).
    return this.scoringService.puntuarLead(lead.id);
  }

  findAllByClinica(clinicaSlug: string) {
    return this.tenantsService.findBySlug(clinicaSlug).then((clinica) =>
      this.prisma.lead.findMany({
        where: { clinicaId: clinica.id },
        orderBy: { createdAt: 'desc' },
        include: { campana: true },
      }),
    );
  }

  async findById(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { campana: true },
    });
    if (!lead) {
      throw new NotFoundException(`No existe un lead con id "${leadId}"`);
    }
    return lead;
  }

  // Cambio de etapa manual (arrastrar y soltar en el Kanban) — el cambio automático
  // (scoring, agendamiento) ya lo hacen scoring.service.ts / citas.service.ts.
  async actualizarEtapa(leadId: string, etapa: EtapaLead) {
    await this.findById(leadId);
    return this.prisma.lead.update({ where: { id: leadId }, data: { etapa } });
  }
}
