import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { MetaGraphService } from './meta-graph.service';
import { TenantsModule } from '../tenants/tenants.module';
import { ScoringModule } from '../scoring/scoring.module';

// Ingesta de leads: webhook de Meta Lead Ads + creación desde WhatsApp orgánico.
@Module({
  imports: [TenantsModule, ScoringModule],
  controllers: [LeadsController],
  providers: [LeadsService, MetaGraphService],
  exports: [LeadsService],
})
export class LeadsModule {}
