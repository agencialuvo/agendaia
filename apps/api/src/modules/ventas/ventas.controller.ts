import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { Roles } from '../auth/decorators/roles.decorator';

const ROLES_VENTA = [
  'PLATAFORMA:ADMIN_MASTER',
  'CLINICA:ADMIN_MASTER',
  'CLINICA:ADMIN',
  'CLINICA:ASESOR',
] as const;

@Controller()
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get('ventas/health')
  health() {
    return this.ventasService.health();
  }

  @Roles(...ROLES_VENTA)
  @Post('leads/:leadId/ventas')
  crear(@Param('leadId') leadId: string, @Body() dto: CrearVentaDto) {
    return this.ventasService.crear(leadId, dto);
  }

  @Roles(...ROLES_VENTA, 'PLATAFORMA:SUPERVISOR')
  @Get('leads/:leadId/ventas')
  listarPorLead(@Param('leadId') leadId: string) {
    return this.ventasService.listarPorLead(leadId);
  }

  @Roles(...ROLES_VENTA, 'PLATAFORMA:SUPERVISOR')
  @Get('clinicas/:clinicaSlug/ventas')
  listarPorClinica(@Param('clinicaSlug') clinicaSlug: string) {
    return this.ventasService.listarPorClinica(clinicaSlug);
  }
}
