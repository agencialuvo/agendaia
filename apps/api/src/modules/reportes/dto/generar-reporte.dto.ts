import { IsDateString } from 'class-validator';

export class GenerarReporteDto {
  @IsDateString()
  periodoInicio: string;

  @IsDateString()
  periodoFin: string;
}
