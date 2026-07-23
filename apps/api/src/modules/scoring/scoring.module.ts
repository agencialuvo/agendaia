import { Module } from '@nestjs/common';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

// Motor de puntaje caliente/tibio/frío, leyendo las reglas desde el guión estructurado de cada clínica.
@Module({
  controllers: [ScoringController],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
