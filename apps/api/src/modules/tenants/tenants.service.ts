import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// Gestión de clínicas (tenants) — configuración, horarios, guión activo por clínica.
@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.clinica.findMany({
      select: { id: true, slug: true, nombre: true, direccion: true, createdAt: true },
    });
  }

  async findBySlug(slug: string) {
    const clinica = await this.prisma.clinica.findUnique({ where: { slug } });
    if (!clinica) {
      throw new NotFoundException(`No existe una clínica con slug "${slug}"`);
    }
    return clinica;
  }
}
