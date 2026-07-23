import { Controller, Get, Param } from '@nestjs/common';
import { ConversacionesService } from './conversaciones.service';

@Controller()
export class ConversacionesController {
  constructor(private readonly conversacionesService: ConversacionesService) {}

  @Get('conversaciones/:conversacionId/mensajes')
  historial(@Param('conversacionId') conversacionId: string) {
    return this.conversacionesService.historial(conversacionId);
  }

  @Get('leads/:leadId/conversaciones')
  listarPorLead(@Param('leadId') leadId: string) {
    return this.conversacionesService.listarPorLead(leadId);
  }
}
