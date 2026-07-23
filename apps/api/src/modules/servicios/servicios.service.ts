import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';

// Catálogo de servicios por clínica, incluida la lógica de evaluación previa y priorización de marcas (ej. Bótox > Nabota).
@Injectable()
export class ServiciosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
  ) {}

  async findActivosPorClinica(clinicaSlug: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    return this.prisma.servicio.findMany({
      where: { clinicaId: clinica.id, activo: true },
      orderBy: { servicioPrincipal: 'desc' },
    });
  }

  // Resuelve el servicio que el paciente pide, incluyendo alias coloquiales
  // (ej. "full face" no es un servicio aparte, es como los pacientes llaman al Bótox — ver config/guiones/velia.json).
  async resolverPorNombre(clinicaSlug: string, nombreConsultado: string) {
    const clinica = await this.tenantsService.findBySlug(clinicaSlug);
    const nombreNormalizado = nombreConsultado.trim().toLowerCase();

    const servicios = await this.prisma.servicio.findMany({
      where: { clinicaId: clinica.id, activo: true },
    });

    const encontrado = servicios.find(
      (s) =>
        s.nombre.toLowerCase().includes(nombreNormalizado) ||
        s.aliasesColoquiales.some((alias) => alias.toLowerCase() === nombreNormalizado),
    );

    if (!encontrado) {
      throw new NotFoundException(
        `No se encontró un servicio activo que coincida con "${nombreConsultado}" para la clínica "${clinicaSlug}"`,
      );
    }
    return encontrado;
  }

  // Input manual del margen (%) para la calculadora de rentabilidad — ver reportes.service.ts.
  async actualizarMargen(servicioId: string, margenPorcentaje: number) {
    const servicio = await this.prisma.servicio.findUnique({ where: { id: servicioId } });
    if (!servicio) {
      throw new NotFoundException(`No existe un servicio con id "${servicioId}"`);
    }
    return this.prisma.servicio.update({ where: { id: servicioId }, data: { margenPorcentaje } });
  }
}
