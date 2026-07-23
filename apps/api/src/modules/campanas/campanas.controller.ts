import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CampanasService } from './campanas.service';
import { Roles } from '../auth/decorators/roles.decorator';

const ROLES_ADMIN = ['PLATAFORMA:ADMIN_MASTER', 'CLINICA:ADMIN_MASTER', 'CLINICA:ADMIN'] as const;

@Controller()
export class CampanasController {
  constructor(private readonly campanasService: CampanasService) {}

  @Roles(...ROLES_ADMIN, 'PLATAFORMA:SUPERVISOR')
  @Get('clinicas/:clinicaSlug/campanas')
  listar(@Param('clinicaSlug') clinicaSlug: string) {
    return this.campanasService.listarPorClinica(clinicaSlug);
  }

  @Roles(...ROLES_ADMIN)
  @Patch('campanas/:campanaId/gasto')
  actualizarGasto(@Param('campanaId') campanaId: string, @Body('gastoRealMensual') gastoRealMensual: number) {
    return this.campanasService.actualizarGasto(campanaId, gastoRealMensual);
  }
}
