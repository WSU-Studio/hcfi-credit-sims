-- AlterTable
ALTER TABLE "static_pages" ADD COLUMN     "layout" JSONB,
ALTER COLUMN "content" DROP NOT NULL;
