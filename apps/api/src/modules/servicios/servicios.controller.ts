import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get('clinicas/:clinicaSlug/servicios')
  findActivos(@Param('clinicaSlug') clinicaSlug: string) {
    return this.serviciosService.findActivosPorClinica(clinicaSlug);
  }

  @Get('clinicas/:clinicaSlug/servicios/resolver')
  resolver(@Param('clinicaSlug') clinicaSlug: string, @Query('nombre') nombre: string) {
    return this.serviciosService.resolverPorNombre(clinicaSlug, nombre);
  }

  @Roles('PLATAFORMA:ADMIN_MASTER', 'CLINICA:ADMIN_MASTER', 'CLINICA:ADMIN')
  @Patch('servicios/:servicioId/margen')
  actualizarMargen(@Param('servicioId') servicioId: string, @Body('margenPorcentaje') margenPorcentaje: number) {
    return this.serviciosService.actualizarMargen(servicioId, margenPorcentaje);
  }
}
