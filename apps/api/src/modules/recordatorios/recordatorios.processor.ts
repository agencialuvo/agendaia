import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RecordatoriosService } from './recordatorios.service';

@Processor('recordatorios')
export class RecordatoriosProcessor extends WorkerHost {
  private readonly logger = new Logger(RecordatoriosProcessor.name);

  constructor(private readonly recordatoriosService: RecordatoriosService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'tick') return;
    this.logger.log('Ejecutando tick de recordatorios/retargeting...');
    await this.recordatoriosService.ejecutarTick();
  }
}
