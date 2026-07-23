import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CitasService } from '../citas/citas.service';
import { CrearFichaControlDto } from './dto/crear-ficha-control.dto';
import { ActualizarFichaControlDto } from './dto/actualizar-ficha-control.dto';

// Ficha clínica que se llena en el consultorio post-visita (historia clínica, tratamiento aplicado,
// próximo control) — separada de la Cita (los 6 datos mínimos de agenda), pero ligada a ella 1:1.
// Crearla marca la cita como atendida: es la confirmación real de que el paciente sí llegó.
@Injectable()
export class FichasControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly citasService: CitasService,
  ) {}

  health() {
    return { modulo: 'fichas-control', estado: 'ok' };
  }

  async crear(citaId: string, dto: CrearFichaControlDto) {
    const cita = await this.citasService.findById(citaId);

    const existente = await this.prisma.fichaControl.findUnique({ where: { citaId } });
    if (existente) {
      throw new ConflictException(`La cita "${citaId}" ya tiene una ficha de control registrada`);
    }

    const ficha = await this.prisma.fichaControl.create({
      data: {
        citaId,
        leadId: cita.leadId,
        ...this.mapearDto(dto),
      },
    });

    await this.prisma.cita.update({ where: { id: citaId }, data: { estado: 'ATENDIDA' } });
    await this.prisma.lead.update({ where: { id: cita.leadId }, data: { etapa: 'ATENDIDO' } });

    return ficha;
  }

  async obtenerPorCita(citaId: string) {
    const ficha = await this.prisma.fichaControl.findUnique({ where: { citaId } });
    if (!ficha) {
      throw new NotFoundException(`La cita "${citaId}" no tiene ficha de control registrada`);
    }
    return ficha;
  }

  async actualizar(citaId: string, dto: ActualizarFichaControlDto) {
    const ficha = await this.obtenerPorCita(citaId);
    const cambios = this.mapearDto(dto);

    // Si se reprograma la fecha de control, el recordatorio debe poder volver a dispararse.
    if (dto.fechaProximoControl && cambios.fechaProximoControl?.getTime() !== ficha.fechaProximoControl?.getTime()) {
      (cambios as { recordatorioControlEnviado?: boolean }).recordatorioControlEnviado = false;
    }

    return this.prisma.fichaControl.update({ where: { citaId }, data: cambios });
  }

  async historialPorLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new BadRequestException(`No existe un lead con id "${leadId}"`);
    }
    return this.prisma.fichaControl.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { cita: { include: { servicio: true, doctor: true } } },
    });
  }

  private mapearDto(dto: CrearFichaControlDto | ActualizarFichaControlDto) {
    return {
      ...dto,
      fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      fechaProximoControl: dto.fechaProximoControl ? new Date(dto.fechaProximoControl) : undefined,
      tratamientosPrevios: dto.tratamientosPrevios as object | undefined,
      fotosAntesDespuesUrls: dto.fotosAntesDespuesUrls as object | undefined,
    };
  }
}
