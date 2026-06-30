-- AlterTable
ALTER TABLE "benefits" ADD COLUMN "isClickable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "benefits" ADD COLUMN "linkUrl" TEXT;
ALTER TABLE "benefits" ADD COLUMN "openInNewTab" BOOLEAN NOT NULL DEFAULT false;
