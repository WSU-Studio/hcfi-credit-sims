-- AlterTable: rename bannerFullWidth to bannerUseContainer (invert logic: useContainer = NOT fullWidth)
ALTER TABLE "articles" ADD COLUMN "bannerUseContainer" BOOLEAN NOT NULL DEFAULT true;

-- Migrate: useContainer = NOT fullWidth (fullWidth true -> useContainer false, fullWidth false -> useContainer true)
UPDATE "articles" SET "bannerUseContainer" = NOT COALESCE("bannerFullWidth", false);

-- Drop old column
ALTER TABLE "articles" DROP COLUMN "bannerFullWidth";
