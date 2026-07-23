import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { GenerarReporteDto } from './dto/generar-reporte.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

const ROLES_ADMIN = ['PLATAFORMA:ADMIN_MASTER', 'CLINICA:ADMIN_MASTER', 'CLINICA:ADMIN'] as const;

@Controller()
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('reportes/health')
  health() {
    return this.reportesService.health();
  }

  @Roles(...ROLES_ADMIN)
  @Post('clinicas/:clinicaSlug/reportes/generar')
  generar(@Param('clinicaSlug') clinicaSlug: string, @Body() dto: GenerarReporteDto) {
    return this.reportesService.generarReporte(clinicaSlug, dto.periodoInicio, dto.periodoFin);
  }

  @Roles(...ROLES_ADMIN, 'PLATAFORMA:SUPERVISOR')
  @Get('clinicas/:clinicaSlug/reportes')
  listar(@Param('clinicaSlug') clinicaSlug: string) {
    return this.reportesService.listarPorClinica(clinicaSlug);
  }

  // Link público quincenal — sin JWT, la seguridad la da el token largo y aleatorio + expiración.
  @Public()
  @Get('reportes/publico/:token')
  obtenerPorToken(@Param('token') token: string) {
    return this.reportesService.obtenerPorToken(token);
  }
}
