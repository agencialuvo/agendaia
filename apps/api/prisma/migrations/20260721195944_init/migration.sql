-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN_AGENCIA', 'AGENTE', 'DUENO_CLINICA');

-- CreateEnum
CREATE TYPE "CategoriaScore" AS ENUM ('CALIENTE', 'TIBIO', 'FRIO');

-- CreateEnum
CREATE TYPE "EtapaLead" AS ENUM ('CREATED', 'PUNTUADO', 'CONTACTADO', 'EN_CONVERSACION', 'AGENDADO', 'CONFIRMADO', 'ATENDIDO', 'NO_SHOW', 'CONTROL_PROGRAMADO', 'GANADO', 'PERDIDO', 'EN_RETARGETING', 'REQUIERE_HUMANO');

-- CreateEnum
CREATE TYPE "ModoConversacion" AS ENUM ('BOT', 'HUMANO');

-- CreateEnum
CREATE TYPE "TipoCita" AS ENUM ('EVALUACION', 'TRATAMIENTO_DIRECTO', 'CONTROL');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PROGRAMADA', 'REPROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'NO_SHOW', 'CANCELADA');

-- CreateTable
CREATE TABLE "Clinica" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "referenciaDireccion" TEXT,
    "horarioAtencion" JSONB NOT NULL,
    "guionConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "clinicaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidades" TEXT[],
    "clinicaId" TEXT NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "servicioPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "requiereEvaluacionPrevia" BOOLEAN NOT NULL DEFAULT true,
    "precioEvaluacion" DECIMAL(10,2),
    "evaluacionDescontableDelTratamiento" BOOLEAN NOT NULL DEFAULT true,
    "marcasDisponibles" JSONB,
    "reglaPriorizacionComercial" JSONB,
    "aliasesColoquiales" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campana" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "metaCampaignId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "adsetId" TEXT,
    "adsetNombre" TEXT,
    "adId" TEXT,
    "adNombre" TEXT,
    "plataforma" TEXT,
    "esOrganico" BOOLEAN NOT NULL DEFAULT false,
    "presupuestoMensual" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "campanaId" TEXT,
    "nombreCompleto" TEXT,
    "telefono" TEXT NOT NULL,
    "respuestasFormulario" JSONB,
    "score" INTEGER,
    "categoriaScore" "CategoriaScore",
    "etapa" "EtapaLead" NOT NULL DEFAULT 'CREATED',
    "origen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversacion" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "modo" "ModoConversacion" NOT NULL DEFAULT 'BOT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "remitente" TEXT NOT NULL,
    "texto" TEXT,
    "mediaUrl" TEXT,
    "generadoPor" TEXT NOT NULL,
    "toolCallsJson" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "doctorId" TEXT,
    "motivoConsulta" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "tipo" "TipoCita" NOT NULL DEFAULT 'EVALUACION',
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "googleCalendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaControl" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentoIdentidad" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "alergias" TEXT,
    "enfermedadesRelevantes" TEXT,
    "medicacionActual" TEXT,
    "embarazoLactancia" BOOLEAN,
    "tratamientosPrevios" JSONB,
    "consentimientoInformado" BOOLEAN NOT NULL DEFAULT false,
    "autorizaUsoImagenMarketing" BOOLEAN NOT NULL DEFAULT false,
    "productoMarca" TEXT,
    "numeroLote" TEXT,
    "unidadesDosis" DECIMAL(10,2),
    "zonasTratadas" TEXT,
    "tecnica" TEXT,
    "reaccionesAdversas" TEXT,
    "indicacionesPostTratamiento" TEXT,
    "fechaProximoControl" TIMESTAMP(3),
    "resultadoControl" TEXT,
    "fotosAntesDespuesUrls" JSONB,
    "montoCobrado" DECIMAL(10,2),
    "formaPago" TEXT,
    "crossSellSugerido" TEXT,
    "crossSellAceptado" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichaControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "marca" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReporteAnalisis" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "metricasJson" JSONB NOT NULL,
    "narrativaIA" TEXT,
    "tokenPublico" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReporteAnalisis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_slug_key" ON "Clinica"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_clinicaId_nombre_key" ON "Doctor"("clinicaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_clinicaId_slug_key" ON "Servicio"("clinicaId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Campana_metaCampaignId_key" ON "Campana"("metaCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "FichaControl_citaId_key" ON "FichaControl"("citaId");

-- CreateIndex
CREATE UNIQUE INDEX "ReporteAnalisis_tokenPublico_key" ON "ReporteAnalisis"("tokenPublico");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campana" ADD CONSTRAINT "Campana_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "Campana"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "Conversacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaControl" ADD CONSTRAINT "FichaControl_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaControl" ADD CONSTRAINT "FichaControl_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteAnalisis" ADD CONSTRAINT "ReporteAnalisis_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
