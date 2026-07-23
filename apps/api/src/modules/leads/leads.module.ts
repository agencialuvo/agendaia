import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TenantsModule } from '../tenants/tenants.module';
import { ScoringModule } from '../scoring/scoring.module';

// Ingesta de leads: webhook de Meta Lead Ads + creación desde WhatsApp orgánico.
@Module({
  imports: [TenantsModule, ScoringModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
