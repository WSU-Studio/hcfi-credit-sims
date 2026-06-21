-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cmoEmpNo" TEXT,
ADD COLUMN     "oriOfficeCode" TEXT,
ADD COLUMN     "oriOfficeName" TEXT,
ADD COLUMN     "userType" TEXT,
ADD COLUMN     "vendorCity" TEXT,
ADD COLUMN     "vendorCode" TEXT,
ADD COLUMN     "vendorName" TEXT;

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- CreateIndex
CREATE INDEX "users_vendorCode_idx" ON "users"("vendorCode");
