-- AlterTable
ALTER TABLE "promos" ADD COLUMN "layout" JSONB,
ADD COLUMN "slug" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "promos_slug_key" ON "promos"("slug");
