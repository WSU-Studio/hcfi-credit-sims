-- AlterTable
ALTER TABLE "lead_asset_drafts" ADD COLUMN     "salesEmpNo" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "salesEmpNo" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "salesEmpNo" TEXT;
