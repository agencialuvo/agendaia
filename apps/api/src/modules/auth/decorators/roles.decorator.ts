import { SetMetadata } from '@nestjs/common';
import { RolCanonico } from '../tipos';

export const ROLES_KEY = 'roles';

// Restringe una ruta a roles específicos, ej: @Roles('PLATAFORMA:ADMIN_MASTER', 'CLINICA:ADMIN')
// Si no se aplica este decorador, cualquier usuario autenticado puede acceder (solo exige JWT válido).
export const Roles = (...roles: RolCanonico[]) => SetMetadata(ROLES_KEY, roles);
