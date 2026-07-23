import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearFichaControlDto {
  // Identificación
  @IsOptional()
  @IsString()
  documentoIdentidad?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  // Historia clínica (anamnesis)
  @IsOptional()
  @IsString()
  alergias?: string;

  @IsOptional()
  @IsString()
  enfermedadesRelevantes?: string;

  @IsOptional()
  @IsString()
  medicacionActual?: string;

  @IsOptional()
  @IsBoolean()
  embarazoLactancia?: boolean;

  @IsOptional()
  @IsArray()
  tratamientosPrevios?: unknown[];

  // Consentimiento
  @IsOptional()
  @IsBoolean()
  consentimientoInformado?: boolean;

  @IsOptional()
  @IsBoolean()
  autorizaUsoImagenMarketing?: boolean;

  // Tratamiento aplicado
  @IsOptional()
  @IsString()
  productoMarca?: string;

  @IsOptional()
  @IsString()
  numeroLote?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unidadesDosis?: number;

  @IsOptional()
  @IsString()
  zonasTratadas?: string;

  @IsOptional()
  @IsString()
  tecnica?: string;

  // Seguimiento
  @IsOptional()
  @IsString()
  reaccionesAdversas?: string;

  @IsOptional()
  @IsString()
  indicacionesPostTratamiento?: string;

  @IsOptional()
  @IsDateString()
  fechaProximoControl?: string;

  @IsOptional()
  @IsString()
  resultadoControl?: string;

  @IsOptional()
  @IsArray()
  fotosAntesDespuesUrls?: unknown[];

  // Comercial
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  montoCobrado?: number;

  @IsOptional()
  @IsString()
  formaPago?: string;

  @IsOptional()
  @IsString()
  crossSellSugerido?: string;

  @IsOptional()
  @IsBoolean()
  crossSellAceptado?: boolean;
}
