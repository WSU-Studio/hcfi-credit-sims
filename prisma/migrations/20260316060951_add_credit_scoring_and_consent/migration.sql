-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "homeOwnershipStatus" TEXT,
ADD COLUMN     "ktpUrl" TEXT,
ADD COLUMN     "motherName" TEXT;
