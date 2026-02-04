-- AlterTable
ALTER TABLE "promos" ADD COLUMN "bannerImageRatio" TEXT,
ADD COLUMN "bannerUseContainer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showBannerImage" BOOLEAN NOT NULL DEFAULT true;
