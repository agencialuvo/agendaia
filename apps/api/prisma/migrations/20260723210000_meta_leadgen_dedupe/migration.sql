-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "metaLeadgenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_metaLeadgenId_key" ON "Lead"("metaLeadgenId");
