import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FichasControlService } from './fichas-control.service';
import { CrearFichaControlDto } from './dto/crear-ficha-control.dto';
import { ActualizarFichaControlDto } from './dto/actualizar-ficha-control.dto';
import { Roles } from '../auth/decorators/roles.decorator';

const ROLES_CLINICOS = ['CLINICA:DOCTOR', 'CLINICA:ADMIN', 'CLINICA:ADMIN_MASTER'] as const;

@Controller()
export class FichasControlController {
  constructor(private readonly fichasControlService: FichasControlService) {}

  @Get('fichas-control/health')
  health() {
    return this.fichasControlService.health();
  }

  @Roles(...ROLES_CLINICOS)
  @Post('citas/:citaId/ficha-control')
  crear(@Param('citaId') citaId: string, @Body() dto: CrearFichaControlDto) {
    return this.fichasControlService.crear(citaId, dto);
  }

  @Roles(...ROLES_CLINICOS)
  @Get('citas/:citaId/ficha-control')
  obtenerPorCita(@Param('citaId') citaId: string) {
    return this.fichasControlService.obtenerPorCita(citaId);
  }

  @Roles(...ROLES_CLINICOS)
  @Patch('citas/:citaId/ficha-control')
  actualizar(@Param('citaId') citaId: string, @Body() dto: ActualizarFichaControlDto) {
    return this.fichasControlService.actualizar(citaId, dto);
  }

  @Roles(...ROLES_CLINICOS, 'CLINICA:ASESOR')
  @Get('leads/:leadId/fichas-control')
  historialPorLead(@Param('leadId') leadId: string) {
    return this.fichasControlService.historialPorLead(leadId);
  }
}
