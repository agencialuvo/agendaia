import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsuarioAutenticado } from '../auth/tipos';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

const RONDAS_BCRYPT = 10;

// Un usuario es "protegido" (borrado solo con CLAVE_MAESTRA_ELIMINACION, y solo por
// PLATAFORMA:ADMIN_MASTER) cuando su rol es ADMIN_MASTER, sea de plataforma o de clínica.
function esAdminMasterProtegido(usuario: { rolPlataforma: string | null; rolClinica: string | null }): boolean {
  return usuario.rolPlataforma === 'ADMIN_MASTER' || usuario.rolClinica === 'ADMIN_MASTER';
}

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearUsuarioDto, solicitante: UsuarioAutenticado) {
    if (dto.tipoUsuario === 'PLATAFORMA') {
      if (solicitante.rolCanonico !== 'PLATAFORMA:ADMIN_MASTER') {
        throw new ForbiddenException('Solo el Admin Master de plataforma puede crear usuarios de plataforma');
      }
    } else {
      if (!dto.clinicaId) {
        throw new BadRequestException('clinicaId es requerido para un usuario de clínica');
      }
      const esPlataformaMaster = solicitante.rolCanonico === 'PLATAFORMA:ADMIN_MASTER';
      const esAdminDeEsaClinica =
        (solicitante.rolCanonico === 'CLINICA:ADMIN_MASTER' || solicitante.rolCanonico === 'CLINICA:ADMIN') &&
        solicitante.clinicaId === dto.clinicaId;

      if (!esPlataformaMaster && !esAdminDeEsaClinica) {
        throw new ForbiddenException('No tienes permiso para crear usuarios en esta clínica');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, RONDAS_BCRYPT);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        correo: dto.correo,
        passwordHash,
        tipoUsuario: dto.tipoUsuario,
        rolPlataforma: dto.tipoUsuario === 'PLATAFORMA' ? dto.rolPlataforma : null,
        rolClinica: dto.tipoUsuario === 'CLINICA' ? dto.rolClinica : null,
        clinicaId: dto.tipoUsuario === 'CLINICA' ? dto.clinicaId : null,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        tipoUsuario: true,
        rolPlataforma: true,
        rolClinica: true,
        clinicaId: true,
        createdAt: true,
      },
    });
  }

  async listar(solicitante: UsuarioAutenticado) {
    const esPlataforma = solicitante.tipoUsuario === 'PLATAFORMA';
    return this.prisma.usuario.findMany({
      where: esPlataforma ? undefined : { clinicaId: solicitante.clinicaId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        tipoUsuario: true,
        rolPlataforma: true,
        rolClinica: true,
        clinicaId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async eliminar(usuarioId: string, solicitante: UsuarioAutenticado, claveMaestraEliminacion?: string) {
    const objetivo = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!objetivo) {
      throw new NotFoundException(`No existe un usuario con id "${usuarioId}"`);
    }

    if (esAdminMasterProtegido(objetivo)) {
      if (solicitante.rolCanonico !== 'PLATAFORMA:ADMIN_MASTER') {
        throw new ForbiddenException('Un Admin Master solo puede ser eliminado por el Admin Master de plataforma');
      }
      const claveEsperada = process.env.CLAVE_MAESTRA_ELIMINACION;
      if (!claveEsperada || claveMaestraEliminacion !== claveEsperada) {
        throw new ForbiddenException('Clave maestra de eliminación inválida o no proporcionada');
      }
    } else {
      const esPlataformaMaster = solicitante.rolCanonico === 'PLATAFORMA:ADMIN_MASTER';
      const esAdminDeEsaClinica =
        (solicitante.rolCanonico === 'CLINICA:ADMIN_MASTER' || solicitante.rolCanonico === 'CLINICA:ADMIN') &&
        solicitante.clinicaId === objetivo.clinicaId;

      if (!esPlataformaMaster && !esAdminDeEsaClinica) {
        throw new ForbiddenException('No tienes permiso para eliminar este usuario');
      }
    }

    await this.prisma.usuario.delete({ where: { id: usuarioId } });
    return { eliminado: true };
  }
}
