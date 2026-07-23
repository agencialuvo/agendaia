import { Controller, Param, Post } from '@nestjs/common';
import { ScoringService } from './scoring.service';

@Controller('leads/:leadId/scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  // Recalcula el puntaje del lead (ej. si llegaron respuestas nuevas por WhatsApp
  // vía la apertura diagnóstica, sección 5 del guión).
  @Post('recalcular')
  recalcular(@Param('leadId') leadId: string) {
    return this.scoringService.puntuarLead(leadId);
  }
}
