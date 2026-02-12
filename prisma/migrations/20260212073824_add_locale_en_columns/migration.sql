-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "contentEn" TEXT,
ADD COLUMN     "excerptEn" TEXT,
ADD COLUMN     "metaDescriptionEn" TEXT,
ADD COLUMN     "subtitleEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "ctaLabelEn" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "highlightEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "benefits" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "contentEn" TEXT,
ADD COLUMN     "subtitleEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "promos" ADD COLUMN     "contentEn" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "static_pages" ADD COLUMN     "contentEn" TEXT,
ADD COLUMN     "titleEn" TEXT;
