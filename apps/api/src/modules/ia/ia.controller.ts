import { Controller, Param, Post } from '@nestjs/common';
import { IaService } from './ia.service';

@Controller('conversaciones/:conversacionId/ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  // Genera (o regenera) la respuesta del bot para la conversación —
  // útil para probar el motor sin pasar por el webhook de WhatsApp.
  @Post('responder')
  responder(@Param('conversacionId') conversacionId: string) {
    return this.iaService.generarRespuesta(conversacionId);
  }
}
