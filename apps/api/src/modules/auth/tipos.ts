import { RolClinica, RolPlataforma, TipoUsuario } from '@prisma/client';

// Rol canónico usado por @Roles()/RolesGuard — combina el tipo de usuario con su rol
// efectivo (de plataforma o de clínica) en un solo string comparable.
export type RolCanonico =
  | `PLATAFORMA:${RolPlataforma}`
  | `CLINICA:${RolClinica}`;

export interface UsuarioAutenticado {
  id: string;
  correo: string;
  tipoUsuario: TipoUsuario;
  rolPlataforma: RolPlataforma | null;
  rolClinica: RolClinica | null;
  clinicaId: string | null;
  rolCanonico: RolCanonico;
}
