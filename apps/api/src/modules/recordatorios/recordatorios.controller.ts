import { Controller, Post } from '@nestjs/common';
import { RecordatoriosService } from './recordatorios.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly recordatoriosService: RecordatoriosService) {}

  // Dispara el tick manualmente — útil para probar sin esperar los 15 minutos del cron real.
  @Roles('PLATAFORMA:ADMIN_MASTER', 'PLATAFORMA:SUPERVISOR')
  @Post('ejecutar-tick')
  async ejecutarTick() {
    await this.recordatoriosService.ejecutarTick();
    return { ejecutado: true };
  }
}
