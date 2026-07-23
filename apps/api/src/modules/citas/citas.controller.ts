import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CitasService } from './citas.service';

@Controller()
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get('clinicas/:clinicaSlug/citas/disponibilidad')
  consultarDisponibilidad(@Param('clinicaSlug') clinicaSlug: string) {
    return this.citasService.consultarDisponibilidad(clinicaSlug);
  }

  // Rango de fechas para la vista de calendario, ej. ?desde=2026-07-20&hasta=2026-07-27
  @Get('clinicas/:clinicaSlug/citas')
  listarPorRango(
    @Param('clinicaSlug') clinicaSlug: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.citasService.listarPorRango(clinicaSlug, desde, hasta);
  }

  @Post('clinicas/:clinicaSlug/citas')
  agendar(
    @Param('clinicaSlug') clinicaSlug: string,
    @Body()
    body: {
      leadId: string;
      servicioNombre: string;
      fecha: string;
      hora: string;
      motivoConsulta: string;
    },
  ) {
    return this.citasService.agendarCita({ clinicaSlug, ...body });
  }

  @Get('leads/:leadId/citas')
  listarPorLead(@Param('leadId') leadId: string) {
    return this.citasService.listarPorLead(leadId);
  }
}
