/*
  Warnings:

  - You are about to drop the column `rol` on the `Usuario` table. All the data in the column will be lost.
  - Added the required column `tipoUsuario` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('PLATAFORMA', 'CLINICA');

-- CreateEnum
CREATE TYPE "RolPlataforma" AS ENUM ('ADMIN_MASTER', 'SUPERVISOR', 'SOPORTE');

-- CreateEnum
CREATE TYPE "RolClinica" AS ENUM ('ADMIN_MASTER', 'ADMIN', 'ASESOR', 'DOCTOR', 'RECEPCION');

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "rol",
ADD COLUMN     "rolClinica" "RolClinica",
ADD COLUMN     "rolPlataforma" "RolPlataforma",
ADD COLUMN     "tipoUsuario" "TipoUsuario" NOT NULL;

-- DropEnum
DROP TYPE "RolUsuario";
