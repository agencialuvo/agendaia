import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { ConversacionesModule } from '../conversaciones/conversaciones.module';
import { CitasModule } from '../citas/citas.module';

// Motor conversacional: orquesta el contexto, llama a Claude con tool use, y ejecuta las tools
// (consultar_disponibilidad, agendar_cita, escalar_a_humano).
@Module({
  imports: [ConversacionesModule, CitasModule],
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
