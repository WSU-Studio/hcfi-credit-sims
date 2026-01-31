-- AlterTable
ALTER TABLE "static_pages" ADD COLUMN     "menuOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showInMenu" BOOLEAN NOT NULL DEFAULT false;
