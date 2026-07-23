import { Module } from '@nestjs/common';
import { ConversacionesController } from './conversaciones.controller';
import { ConversacionesService } from './conversaciones.service';
import { TenantsModule } from '../tenants/tenants.module';

// Hilos de conversación y mensajes por lead (reemplaza las columnas de fecha manuales del Excel).
@Module({
  imports: [TenantsModule],
  controllers: [ConversacionesController],
  providers: [ConversacionesService],
  exports: [ConversacionesService],
})
export class ConversacionesModule {}
