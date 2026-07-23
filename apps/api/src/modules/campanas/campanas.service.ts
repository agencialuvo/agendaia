import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

// Campañas de Meta Lead Ads (se crean solas desde el webhook — ver leads.service.ts).
// El gasto real es manual mientras no haya acceso a Meta Ads API para leerlo automático.
@Injectable()
export class CampanasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
  ) {}

  async listarPorClinica(clinicaSlug: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    return this.prisma.campana.findMany({ where: { clinicaId: clinica.id }, orderBy: { createdAt: 'desc' } });
  }

  async actualizarGasto(campanaId: string, gastoRealMensual: number) {
    const campana = await this.prisma.campana.findUnique({ where: { id: campanaId } });
    if (!campana) {
      throw new NotFoundException(`No existe una campaña con id "${campanaId}"`);
    }
    return this.prisma.campana.update({ where: { id: campanaId }, data: { gastoRealMensual } });
  }
}
