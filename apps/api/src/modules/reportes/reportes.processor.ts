import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ReportesService } from './reportes.service';

@Processor('reportes')
export class ReportesProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportesProcessor.name);

  constructor(private readonly reportesService: ReportesService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'generar-quincenal') return;
    this.logger.log('Generando reportes quincenales automáticos...');
    await this.reportesService.generarReportesQuincenales();
  }
}
