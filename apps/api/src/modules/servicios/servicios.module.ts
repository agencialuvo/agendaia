import { Module } from '@nestjs/common';
import { ServiciosController } from './servicios.controller';
import { ServiciosService } from './servicios.service';
import { TenantsModule } from '../tenants/tenants.module';

// Catálogo de servicios por clínica, incluida la lógica de evaluación previa y priorización de marcas (ej. Bótox > Nabota).
@Module({
  imports: [TenantsModule],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule {}
