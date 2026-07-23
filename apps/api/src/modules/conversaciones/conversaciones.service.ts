import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

// Hilos de conversación y mensajes por lead (reemplaza las columnas de fecha manuales del Excel).
@Injectable()
export class ConversacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
  ) {}

  // Encuentra el lead por teléfono (el más reciente) o lo crea si escribe por WhatsApp
  // orgánico sin haber pasado antes por un formulario de Meta Lead Ads.
  async obtenerOCrearParaTelefono(clinicaSlug: string, telefono: string, nombre?: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);

    let lead = await this.prisma.lead.findFirst({
      where: { clinicaId: clinica.id, telefono },
      orderBy: { createdAt: 'desc' },
    });

    if (!lead) {
      lead = await this.prisma.lead.create({
        data: {
          clinicaId: clinica.id,
          telefono,
          nombreCompleto: nombre ?? null,
          origen: 'whatsapp_organico',
        },
      });
    }

    let conversacion = await this.prisma.conversacion.findFirst({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversacion) {
      conversacion = await this.prisma.conversacion.create({
        data: { leadId: lead.id, canal: 'whatsapp' },
      });
    }

    return { lead, conversacion };
  }

  agregarMensaje(
    conversacionId: string,
    remitente: string,
    texto: string,
    generadoPor: 'ia' | 'humano' | 'sistema',
    toolCallsJson?: unknown,
  ) {
    return this.prisma.mensaje.create({
      data: {
        conversacionId,
        remitente,
        texto,
        generadoPor,
        toolCallsJson: toolCallsJson as object | undefined,
      },
    });
  }

  historial(conversacionId: string) {
    return this.prisma.mensaje.findMany({
      where: { conversacionId },
      orderBy: { timestamp: 'asc' },
    });
  }

  listarPorLead(leadId: string) {
    return this.prisma.conversacion.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { mensajes: { orderBy: { timestamp: 'asc' } } },
    });
  }

  findConversacionConContexto(conversacionId: string) {
    return this.prisma.conversacion.findUniqueOrThrow({
      where: { id: conversacionId },
      include: {
        lead: { include: { clinica: true } },
        mensajes: { orderBy: { timestamp: 'asc' } },
      },
    });
  }

  // Handoff a humano: pausa el bot para este lead (sección 4.2 de la arquitectura —
  // el bot no vuelve a escribir hasta que un agente lo reactive).
  async escalarAHumano(conversacionId: string) {
    const conversacion = await this.prisma.conversacion.update({
      where: { id: conversacionId },
      data: { modo: 'HUMANO' },
    });
    await this.prisma.lead.update({
      where: { id: conversacion.leadId },
      data: { etapa: 'REQUIERE_HUMANO' },
    });
    return conversacion;
  }
}
