-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "slikRawResponse" JSONB,
ADD COLUMN     "slikResultCode" TEXT,
ADD COLUMN     "slikResultDescr" TEXT,
ADD COLUMN     "slikStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
