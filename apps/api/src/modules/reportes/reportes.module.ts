import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReportesProcessor } from './reportes.processor';
import { TenantsModule } from '../tenants/tenants.module';

// Generación automática de reportes quincenales y calculadora de rentabilidad, con link público tokenizado.
@Module({
  imports: [BullModule.registerQueue({ name: 'reportes' }), TenantsModule],
  controllers: [ReportesController],
  providers: [ReportesService, ReportesProcessor],
  exports: [ReportesService],
})
export class ReportesModule implements OnModuleInit {
  constructor(@InjectQueue('reportes') private readonly cola: Queue) {}

  async onModuleInit() {
    // Corre a las 8am del día 1 y el día 16 de cada mes — cubre el periodo quincenal recién cerrado.
    await this.cola.add(
      'generar-quincenal',
      {},
      { repeat: { pattern: '0 8 1,16 * *' }, jobId: 'reportes-quincenales' },
    );
  }
}
