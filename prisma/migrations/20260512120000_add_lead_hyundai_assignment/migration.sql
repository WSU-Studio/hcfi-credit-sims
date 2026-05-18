-- AlterTable
ALTER TABLE "leads" ADD COLUMN "vendorCode" TEXT;
ALTER TABLE "leads" ADD COLUMN "vendorName" TEXT;
ALTER TABLE "leads" ADD COLUMN "oriOfficeCode" TEXT;
ALTER TABLE "leads" ADD COLUMN "oriOfficeName" TEXT;
ALTER TABLE "leads" ADD COLUMN "cmoEmpNo" TEXT;
ALTER TABLE "leads" ADD COLUMN "cmoName" TEXT;
ALTER TABLE "leads" ADD COLUMN "hyundaiLeadNo" TEXT;
ALTER TABLE "leads" ADD COLUMN "hyundaiAssignStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "leads" ADD COLUMN "hyundaiAssignError" TEXT;
ALTER TABLE "leads" ADD COLUMN "hyundaiAssignedAt" TIMESTAMP(3);
