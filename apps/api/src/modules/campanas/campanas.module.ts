import { Module } from '@nestjs/common';
import { CampanasController } from './campanas.controller';
import { CampanasService } from './campanas.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  controllers: [CampanasController],
  providers: [CampanasService],
  exports: [CampanasService],
})
export class CampanasModule {}
