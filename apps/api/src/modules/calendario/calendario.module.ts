import { Module } from '@nestjs/common';
import { CalendarioController } from './calendario.controller';
import { CalendarioService } from './calendario.service';

// Integración con Google Calendar: consulta de cupos reales y creación de eventos.
@Module({
  controllers: [CalendarioController],
  providers: [CalendarioService],
  exports: [CalendarioService],
})
export class CalendarioModule {}
