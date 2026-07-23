import { Module } from '@nestjs/common';
import { FichasControlController } from './fichas-control.controller';
import { FichasControlService } from './fichas-control.service';
import { CitasModule } from '../citas/citas.module';

// Ficha clínica que se llena en el consultorio post-visita (historia clínica, tratamiento aplicado, próximo control).
@Module({
  imports: [CitasModule],
  controllers: [FichasControlController],
  providers: [FichasControlService],
  exports: [FichasControlService],
})
export class FichasControlModule {}
