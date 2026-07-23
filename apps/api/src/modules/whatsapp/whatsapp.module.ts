import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ConversacionesModule } from '../conversaciones/conversaciones.module';
import { IaModule } from '../ia/ia.module';

// Integración con WhatsApp Business Platform (envío/recepción de mensajes y plantillas).
@Module({
  imports: [ConversacionesModule, IaModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
