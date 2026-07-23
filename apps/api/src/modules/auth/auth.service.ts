import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RolCanonico } from './tipos';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  health() {
    return { modulo: 'auth', estado: 'ok' };
  }

  async login(correo: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const rolCanonico = (
      usuario.tipoUsuario === 'PLATAFORMA'
        ? `PLATAFORMA:${usuario.rolPlataforma}`
        : `CLINICA:${usuario.rolClinica}`
    ) as RolCanonico;

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario,
      rolPlataforma: usuario.rolPlataforma,
      rolClinica: usuario.rolClinica,
      clinicaId: usuario.clinicaId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipoUsuario: usuario.tipoUsuario,
        rolCanonico,
        clinicaId: usuario.clinicaId,
      },
    };
  }
}
