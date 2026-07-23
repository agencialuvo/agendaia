import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { TenantsModule } from '../tenants/tenants.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { CalendarioModule } from '../calendario/calendario.module';

// Agenda: los 6 datos mínimos (nombre, motivo, celular, fecha, hora, doctor/a) + estado del ciclo de vida de la cita.
@Module({
  imports: [TenantsModule, ServiciosModule, CalendarioModule],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}
