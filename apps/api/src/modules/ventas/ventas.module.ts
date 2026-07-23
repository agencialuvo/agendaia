import { Module } from '@nestjs/common';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { TenantsModule } from '../tenants/tenants.module';

// Registro de ventas cerradas — alimenta la calculadora de rentabilidad y los reportes.
@Module({
  imports: [TenantsModule],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
