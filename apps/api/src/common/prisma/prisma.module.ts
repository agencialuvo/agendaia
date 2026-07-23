import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Módulo global: cualquier módulo de dominio puede inyectar PrismaService
// sin tener que importar este módulo explícitamente cada vez.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
