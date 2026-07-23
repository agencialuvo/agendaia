-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "cupoLiberado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noShowMensajeEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noShowMensajeEnviadoEn" TIMESTAMP(3),
ADD COLUMN     "recordatorio24hEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordatorio2hEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordatorioMananaEnviado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FichaControl" ADD COLUMN     "recordatorioControlEnviado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "retargetingDia15Enviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retargetingDia30Enviado" BOOLEAN NOT NULL DEFAULT false;
