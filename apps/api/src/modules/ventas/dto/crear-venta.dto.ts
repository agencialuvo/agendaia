import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearVentaDto {
  @IsString()
  servicioId: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @Type(() => Number)
  @IsNumber()
  monto: number;
}
