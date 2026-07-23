import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { CrearVentaDto } from './dto/crear-venta.dto';

// Registro de ventas cerradas — alimenta la calculadora de rentabilidad y los reportes.
@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
  ) {}

  health() {
    return { modulo: 'ventas', estado: 'ok' };
  }

  async crear(leadId: string, dto: CrearVentaDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException(`No existe un lead con id "${leadId}"`);
    }

    const venta = await this.prisma.venta.create({
      data: { leadId, servicioId: dto.servicioId, marca: dto.marca, monto: dto.monto },
    });

    await this.prisma.lead.update({ where: { id: leadId }, data: { etapa: 'GANADO' } });

    return venta;
  }

  listarPorLead(leadId: string) {
    return this.prisma.venta.findMany({ where: { leadId }, include: { servicio: true }, orderBy: { fecha: 'desc' } });
  }

  async listarPorClinica(clinicaSlug: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    return this.prisma.venta.findMany({
      where: { lead: { clinicaId: clinica.id } },
      include: { servicio: true, lead: true },
      orderBy: { fecha: 'desc' },
    });
  }
}
