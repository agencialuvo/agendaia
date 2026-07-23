import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Clinica, EtapaLead } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConversacionesService } from '../conversaciones/conversaciones.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CalendarioService } from '../calendario/calendario.service';
import { renderPlantilla } from './plantilla.util';
import { combinarFechaHoraLocal } from './fecha.util';

const HORA_LIBERACION_CUPO_MS = 48 * 60 * 60 * 1000; // 2do intento sin respuesta -> se libera el cupo
const ETAPAS_LEAD_FRIO: EtapaLead[] = ['CREATED', 'PUNTUADO', 'CONTACTADO', 'EN_CONVERSACION', 'EN_RETARGETING'];

interface GuionConfig {
  recordatorios?: { '24h_antes'?: string; manana_del_dia?: string; '2h_antes'?: string };
  retargeting?: {
    dia_15_sin_respuesta?: string;
    dia_30_sin_respuesta?: string;
    no_show_del_dia?: string;
    liberacion_cupo_tras_2do_intento?: string;
  };
  seguimiento_control?: { recordatorio_proximo_control?: string };
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' });
}

// Recordatorios pre-cita, detección de no-show + liberación de cupo, y retargeting de leads
// fríos (día 15/30) — réplica automatizada de lo que el equipo de VELIA hacía a mano.
// Todo el texto sale del guión activo de cada clínica (guionConfig), nunca hardcodeado aquí.
@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversacionesService: ConversacionesService,
    private readonly whatsappService: WhatsappService,
    private readonly calendarioService: CalendarioService,
  ) {}

  private async enviarYRegistrar(clinicaSlug: string, telefono: string, nombre: string | null, texto: string) {
    const { conversacion } = await this.conversacionesService.obtenerOCrearParaTelefono(
      clinicaSlug,
      telefono,
      nombre ?? undefined,
    );
    await this.conversacionesService.agregarMensaje(conversacion.id, 'bot', texto, 'sistema');
    await this.whatsappService.enviarMensaje(telefono, texto);
  }

  async ejecutarTick() {
    const clinicas = await this.prisma.clinica.findMany();
    for (const clinica of clinicas) {
      const guion = (clinica.guionConfig as unknown as GuionConfig) ?? {};
      await this.procesarRecordatoriosPreCita(clinica, guion);
      await this.procesarNoShow(clinica, guion);
      await this.procesarLiberacionCupo(clinica, guion);
      await this.procesarRetargeting(clinica, guion);
      await this.procesarRecordatoriosControl(clinica, guion);
    }
  }

  private async procesarRecordatoriosPreCita(clinica: Clinica, guion: GuionConfig) {
    const textos = guion.recordatorios;
    if (!textos) return;

    const citas = await this.prisma.cita.findMany({
      where: {
        clinicaId: clinica.id,
        estado: { in: ['PROGRAMADA', 'CONFIRMADA'] },
        fecha: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: { lead: true },
    });

    const ahora = Date.now();
    for (const cita of citas) {
      const inicio = combinarFechaHoraLocal(cita.fecha, cita.hora);
      const horasRestantes = (inicio.getTime() - ahora) / (60 * 60 * 1000);
      if (horasRestantes <= 0) continue; // ya pasó, lo maneja procesarNoShow

      const variables = {
        nombre: cita.lead.nombreCompleto ?? 'hola',
        hora: cita.hora,
        fecha: formatearFecha(inicio),
      };

      if (!cita.recordatorio24hEnviado && horasRestantes <= 24 && textos['24h_antes']) {
        await this.enviarYRegistrar(clinica.slug, cita.lead.telefono, cita.lead.nombreCompleto, renderPlantilla(textos['24h_antes'], variables));
        await this.prisma.cita.update({ where: { id: cita.id }, data: { recordatorio24hEnviado: true } });
      }

      const esHoy = inicio.toDateString() === new Date().toDateString();
      if (!cita.recordatorioMananaEnviado && esHoy && new Date().getHours() >= 8 && horasRestantes > 2 && textos.manana_del_dia) {
        await this.enviarYRegistrar(clinica.slug, cita.lead.telefono, cita.lead.nombreCompleto, renderPlantilla(textos.manana_del_dia, variables));
        await this.prisma.cita.update({ where: { id: cita.id }, data: { recordatorioMananaEnviado: true } });
      }

      if (!cita.recordatorio2hEnviado && horasRestantes <= 2 && textos['2h_antes']) {
        await this.enviarYRegistrar(clinica.slug, cita.lead.telefono, cita.lead.nombreCompleto, renderPlantilla(textos['2h_antes'], variables));
        await this.prisma.cita.update({ where: { id: cita.id }, data: { recordatorio2hEnviado: true } });
      }
    }
  }

  private async procesarNoShow(clinica: Clinica, guion: GuionConfig) {
    const texto = guion.retargeting?.no_show_del_dia;
    if (!texto) return;

    const citas = await this.prisma.cita.findMany({
      where: { clinicaId: clinica.id, estado: { in: ['PROGRAMADA', 'CONFIRMADA'] }, noShowMensajeEnviado: false },
      include: { lead: true },
    });

    const ahora = Date.now();
    for (const cita of citas) {
      const inicio = combinarFechaHoraLocal(cita.fecha, cita.hora);
      if (inicio.getTime() >= ahora) continue; // todavía no pasó

      await this.enviarYRegistrar(
        clinica.slug,
        cita.lead.telefono,
        cita.lead.nombreCompleto,
        renderPlantilla(texto, { nombre: cita.lead.nombreCompleto ?? 'hola', hora: cita.hora, fecha: formatearFecha(inicio) }),
      );
      await this.prisma.cita.update({
        where: { id: cita.id },
        data: { estado: 'NO_SHOW', noShowMensajeEnviado: true, noShowMensajeEnviadoEn: new Date() },
      });
      await this.prisma.lead.update({ where: { id: cita.leadId }, data: { etapa: 'NO_SHOW' } });
    }
  }

  private async procesarLiberacionCupo(clinica: Clinica, guion: GuionConfig) {
    const texto = guion.retargeting?.liberacion_cupo_tras_2do_intento;
    if (!texto) return;

    const citas = await this.prisma.cita.findMany({
      where: {
        clinicaId: clinica.id,
        estado: 'NO_SHOW',
        noShowMensajeEnviado: true,
        cupoLiberado: false,
        noShowMensajeEnviadoEn: { lte: new Date(Date.now() - HORA_LIBERACION_CUPO_MS) },
      },
      include: { lead: true },
    });

    for (const cita of citas) {
      await this.enviarYRegistrar(
        clinica.slug,
        cita.lead.telefono,
        cita.lead.nombreCompleto,
        renderPlantilla(texto, { nombre: cita.lead.nombreCompleto ?? 'hola' }),
      );

      if (cita.googleCalendarEventId) {
        try {
          await this.calendarioService.eliminarEvento(cita.googleCalendarEventId);
        } catch (error) {
          if (!(error instanceof ServiceUnavailableException)) throw error;
        }
      }

      await this.prisma.cita.update({ where: { id: cita.id }, data: { estado: 'CANCELADA', cupoLiberado: true } });
    }
  }

  private async procesarRetargeting(clinica: Clinica, guion: GuionConfig) {
    const dia15 = guion.retargeting?.dia_15_sin_respuesta;
    const dia30 = guion.retargeting?.dia_30_sin_respuesta;
    if (!dia15 && !dia30) return;

    const ahora = Date.now();
    const leadsFrios = await this.prisma.lead.findMany({
      where: { clinicaId: clinica.id, etapa: { in: ETAPAS_LEAD_FRIO } },
    });

    for (const lead of leadsFrios) {
      const diasDesdeCreacion = (ahora - lead.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      const variables = { nombre: lead.nombreCompleto ?? 'hola' };

      if (dia30 && !lead.retargetingDia30Enviado && diasDesdeCreacion >= 30) {
        await this.enviarYRegistrar(clinica.slug, lead.telefono, lead.nombreCompleto, renderPlantilla(dia30, variables));
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: { retargetingDia30Enviado: true, etapa: 'EN_RETARGETING' },
        });
      } else if (dia15 && !lead.retargetingDia15Enviado && diasDesdeCreacion >= 15) {
        await this.enviarYRegistrar(clinica.slug, lead.telefono, lead.nombreCompleto, renderPlantilla(dia15, variables));
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: { retargetingDia15Enviado: true, etapa: 'EN_RETARGETING' },
        });
      }
    }
  }

  private async procesarRecordatoriosControl(clinica: Clinica, guion: GuionConfig) {
    const texto = guion.seguimiento_control?.recordatorio_proximo_control;
    if (!texto) return;

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(23, 59, 59, 999);

    const fichas = await this.prisma.fichaControl.findMany({
      where: {
        recordatorioControlEnviado: false,
        fechaProximoControl: { not: null, lte: manana },
        lead: { clinicaId: clinica.id },
      },
      include: { lead: true },
    });

    for (const ficha of fichas) {
      if (!ficha.fechaProximoControl || ficha.fechaProximoControl.getTime() < new Date().setHours(0, 0, 0, 0)) {
        continue; // fecha ya pasó sin ficha actualizada — no perseguir un control vencido indefinidamente
      }

      await this.enviarYRegistrar(
        clinica.slug,
        ficha.lead.telefono,
        ficha.lead.nombreCompleto,
        renderPlantilla(texto, { nombre: ficha.lead.nombreCompleto ?? 'hola' }),
      );
      await this.prisma.fichaControl.update({ where: { id: ficha.id }, data: { recordatorioControlEnviado: true } });
      await this.prisma.lead.update({ where: { id: ficha.leadId }, data: { etapa: 'CONTROL_PROGRAMADO' } });
    }
  }
}
