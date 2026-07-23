import { IsOptional, IsString } from 'class-validator';

export class EliminarUsuarioDto {
  // Solo requerida cuando el usuario a eliminar es un ADMIN_MASTER (de plataforma o de clínica).
  @IsOptional()
  @IsString()
  claveMaestraEliminacion?: string;
}
