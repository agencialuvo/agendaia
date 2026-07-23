import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolCanonico, UsuarioAutenticado } from '../tipos';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<RolCanonico[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sin @Roles(...) en la ruta: cualquier usuario autenticado puede entrar.
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

    const usuario: UsuarioAutenticado | undefined = context.switchToHttp().getRequest().user;
    if (!usuario) return false;

    // El ADMIN_MASTER de plataforma tiene acceso total a todo, sin excepción.
    if (usuario.rolCanonico === 'PLATAFORMA:ADMIN_MASTER') return true;

    if (!rolesPermitidos.includes(usuario.rolCanonico)) {
      throw new ForbiddenException('No tienes permiso para realizar esta acción');
    }
    return true;
  }
}
