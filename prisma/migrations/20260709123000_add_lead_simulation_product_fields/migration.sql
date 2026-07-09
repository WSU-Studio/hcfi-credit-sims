-- AlterTable
ALTER TABLE "leads" ADD COLUMN "productCode" TEXT,
ADD COLUMN "firstInstallment" TEXT,
ADD COLUMN "isPromotion" BOOLEAN NOT NULL DEFAULT false;
