import { RolClinica, RolPlataforma, TipoUsuario } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsEnum(TipoUsuario)
  tipoUsuario: TipoUsuario;

  @ValidateIf((dto) => dto.tipoUsuario === 'PLATAFORMA')
  @IsEnum(RolPlataforma)
  rolPlataforma?: RolPlataforma;

  @ValidateIf((dto) => dto.tipoUsuario === 'CLINICA')
  @IsEnum(RolClinica)
  rolClinica?: RolClinica;

  @ValidateIf((dto) => dto.tipoUsuario === 'CLINICA')
  @IsString()
  clinicaId?: string;
}
