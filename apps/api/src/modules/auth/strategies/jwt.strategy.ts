import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioAutenticado, RolCanonico } from '../tipos';

interface JwtPayload {
  sub: string;
  correo: string;
  tipoUsuario: UsuarioAutenticado['tipoUsuario'];
  rolPlataforma: UsuarioAutenticado['rolPlataforma'];
  rolClinica: UsuarioAutenticado['rolClinica'];
  clinicaId: UsuarioAutenticado['clinicaId'];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Falta configurar JWT_SECRET en el .env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): UsuarioAutenticado {
    if (!payload.tipoUsuario || (!payload.rolPlataforma && !payload.rolClinica)) {
      throw new UnauthorizedException('Token sin rol válido');
    }
    const rolCanonico = (
      payload.tipoUsuario === 'PLATAFORMA'
        ? `PLATAFORMA:${payload.rolPlataforma}`
        : `CLINICA:${payload.rolClinica}`
    ) as RolCanonico;

    return {
      id: payload.sub,
      correo: payload.correo,
      tipoUsuario: payload.tipoUsuario,
      rolPlataforma: payload.rolPlataforma,
      rolClinica: payload.rolClinica,
      clinicaId: payload.clinicaId,
      rolCanonico,
    };
  }
}
