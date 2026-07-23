// Seed: carga la clínica piloto (VELIA) y su catálogo de servicios
// a partir del guión estructurado en config/guiones/*.json (fuente de verdad, ver docs/Paso1_Guia_y_Checklist.md).
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface GuionServicio {
  id: string;
  nombre: string;
  servicio_principal?: boolean;
  requiere_evaluacion_previa: boolean;
  precio_evaluacion?: number;
  evaluacion_descontable_del_tratamiento?: boolean;
  marcas_disponibles?: unknown;
  regla_priorizacion_comercial?: unknown;
  alias_coloquiales?: string[];
}

interface GuionJson {
  clinica: {
    id: string;
    nombre: string;
    ubicacion: { direccion: string; referencia?: string };
    horario_atencion: unknown;
    doctores: { nombre: string; especialidades: string[] }[];
  };
  servicios: GuionServicio[];
}

async function main() {
  const guionPath = join(__dirname, '../../../config/guiones/velia.json');
  const guion: GuionJson = JSON.parse(readFileSync(guionPath, 'utf-8'));

  const clinica = await prisma.clinica.upsert({
    where: { slug: guion.clinica.id },
    update: {
      nombre: guion.clinica.nombre,
      direccion: guion.clinica.ubicacion.direccion,
      referenciaDireccion: guion.clinica.ubicacion.referencia ?? null,
      horarioAtencion: guion.clinica.horario_atencion as object,
      guionConfig: guion as unknown as object,
    },
    create: {
      slug: guion.clinica.id,
      nombre: guion.clinica.nombre,
      direccion: guion.clinica.ubicacion.direccion,
      referenciaDireccion: guion.clinica.ubicacion.referencia ?? null,
      horarioAtencion: guion.clinica.horario_atencion as object,
      guionConfig: guion as unknown as object,
    },
  });

  for (const doctor of guion.clinica.doctores) {
    await prisma.doctor.upsert({
      where: { clinicaId_nombre: { clinicaId: clinica.id, nombre: doctor.nombre } },
      update: { especialidades: doctor.especialidades },
      create: {
        clinicaId: clinica.id,
        nombre: doctor.nombre,
        especialidades: doctor.especialidades,
      },
    });
  }

  for (const servicio of guion.servicios) {
    await prisma.servicio.upsert({
      where: { clinicaId_slug: { clinicaId: clinica.id, slug: servicio.id } },
      update: {
        nombre: servicio.nombre,
        servicioPrincipal: servicio.servicio_principal ?? false,
        requiereEvaluacionPrevia: servicio.requiere_evaluacion_previa,
        precioEvaluacion: servicio.precio_evaluacion ?? null,
        evaluacionDescontableDelTratamiento: servicio.evaluacion_descontable_del_tratamiento ?? true,
        marcasDisponibles: (servicio.marcas_disponibles as object) ?? undefined,
        reglaPriorizacionComercial: (servicio.regla_priorizacion_comercial as object) ?? undefined,
        aliasesColoquiales: servicio.alias_coloquiales ?? [],
      },
      create: {
        clinicaId: clinica.id,
        slug: servicio.id,
        nombre: servicio.nombre,
        servicioPrincipal: servicio.servicio_principal ?? false,
        requiereEvaluacionPrevia: servicio.requiere_evaluacion_previa,
        precioEvaluacion: servicio.precio_evaluacion ?? null,
        evaluacionDescontableDelTratamiento: servicio.evaluacion_descontable_del_tratamiento ?? true,
        marcasDisponibles: (servicio.marcas_disponibles as object) ?? undefined,
        reglaPriorizacionComercial: (servicio.regla_priorizacion_comercial as object) ?? undefined,
        aliasesColoquiales: servicio.alias_coloquiales ?? [],
      },
    });
  }

  // Primer usuario de plataforma (tu empresa) — sin esto no hay forma de iniciar sesión la primera vez.
  const correoAdminMaster = process.env.ADMIN_MASTER_EMAIL;
  const passwordAdminMaster = process.env.ADMIN_MASTER_PASSWORD;
  if (correoAdminMaster && passwordAdminMaster) {
    const passwordHash = await bcrypt.hash(passwordAdminMaster, 10);
    await prisma.usuario.upsert({
      where: { correo: correoAdminMaster },
      update: {},
      create: {
        nombre: 'Admin Master',
        correo: correoAdminMaster,
        passwordHash,
        tipoUsuario: 'PLATAFORMA',
        rolPlataforma: 'ADMIN_MASTER',
      },
    });
    console.log(`Usuario Admin Master de plataforma listo: ${correoAdminMaster}`);
  } else {
    console.log(
      'ADMIN_MASTER_EMAIL / ADMIN_MASTER_PASSWORD no están definidos en .env — no se creó el usuario inicial.',
    );
  }

  console.log(`Seed completo: clínica "${clinica.nombre}" con ${guion.servicios.length} servicios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
