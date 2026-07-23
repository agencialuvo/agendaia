import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './common/prisma/prisma.module';

import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { ConversacionesModule } from './modules/conversaciones/conversaciones.module';
import { CitasModule } from './modules/citas/citas.module';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { FichasControlModule } from './modules/fichas-control/fichas-control.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { IaModule } from './modules/ia/ia.module';
import { CalendarioModule } from './modules/calendario/calendario.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { RecordatoriosModule } from './modules/recordatorios/recordatorios.module';
import { CampanasModule } from './modules/campanas/campanas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } }),

    // Módulos de dominio — orden sugerido de implementación real:
    // ver docs/Plan_de_Implementacion_Paso_a_Paso.md
    TenantsModule,
    AuthModule,
    UsuariosModule,
    ServiciosModule, // paso 2 (parte 1): catálogo desde config/guiones/*.json
    LeadsModule, // paso 2 (parte 2): webhook de Meta Lead Ads
    ScoringModule, // paso 2 (parte 3): motor de puntaje
    WhatsappModule, // paso 3
    IaModule, // paso 3
    ConversacionesModule, // paso 3
    CitasModule, // paso 4
    CalendarioModule, // paso 4
    FichasControlModule, // paso 5 (nuevo, agregado por feedback del cliente)
    RecordatoriosModule, // paso 4 (punto 16): recordatorios pre-cita + no-show + retargeting
    VentasModule, // paso 5
    CampanasModule, // paso 5: gasto real manual por campaña (insumo del CPL)
    ReportesModule, // paso 5
  ],
  providers: [
    // Orden importa: primero exige JWT válido (o @Public()), luego evalúa @Roles(...).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
