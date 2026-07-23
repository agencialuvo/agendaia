import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RecordatoriosService } from './recordatorios.service';
import { RecordatoriosProcessor } from './recordatorios.processor';
import { RecordatoriosController } from './recordatorios.controller';
import { ConversacionesModule } from '../conversaciones/conversaciones.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { CalendarioModule } from '../calendario/calendario.module';

const INTERVALO_TICK_MS = 15 * 60 * 1000; // cada 15 minutos

@Module({
  imports: [
    BullModule.registerQueue({ name: 'recordatorios' }),
    ConversacionesModule,
    WhatsappModule,
    CalendarioModule,
  ],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService, RecordatoriosProcessor],
  exports: [RecordatoriosService],
})
export class RecordatoriosModule implements OnModuleInit {
  constructor(@InjectQueue('recordatorios') private readonly cola: Queue) {}

  async onModuleInit() {
    // Job repetible con id fijo — si el server se reinicia, BullMQ no duplica el programador.
    await this.cola.add(
      'tick',
      {},
      { repeat: { every: INTERVALO_TICK_MS }, jobId: 'tick-recordatorios' },
    );
  }
}
