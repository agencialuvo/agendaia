import { Controller, Get } from '@nestjs/common';
import { CalendarioService } from './calendario.service';

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendarioService: CalendarioService) {}

  @Get('health')
  health() {
    return this.calendarioService.health();
  }
}
