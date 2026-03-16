-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "activities" TEXT[] DEFAULT ARRAY[]::TEXT[];
