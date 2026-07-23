import { PartialType } from '@nestjs/mapped-types';
import { CrearFichaControlDto } from './crear-ficha-control.dto';

export class ActualizarFichaControlDto extends PartialType(CrearFichaControlDto) {}
