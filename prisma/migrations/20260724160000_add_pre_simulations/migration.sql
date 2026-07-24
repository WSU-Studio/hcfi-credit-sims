-- CreateTable
CREATE TABLE "pre_simulations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "vendorCode" TEXT,
    "vendorName" TEXT,
    "vendorCity" TEXT,
    "oriOfficeCode" TEXT,
    "oriOfficeName" TEXT,
    "modelCode" TEXT,
    "modelName" TEXT,
    "manufacturingYear" INTEGER,
    "fscCode" TEXT,
    "trimName" TEXT,
    "exteriorColorCode" TEXT,
    "exteriorColorName" TEXT,
    "interiorColorCode" TEXT,
    "interiorColorName" TEXT,
    "vehicleSummary" TEXT,
    "assetSnapshot" JSONB,
    "otrPrice" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "partnerCode" TEXT,
    "simulationLeadNo" TEXT,
    "productCode" TEXT,
    "productName" TEXT,
    "dpPercent" DOUBLE PRECISION,
    "tenor" INTEGER,
    "firstInstallment" TEXT,
    "isPromotion" BOOLEAN NOT NULL DEFAULT false,
    "summarySnapshot" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pre_simulations_slug_key" ON "pre_simulations"("slug");

-- CreateIndex
CREATE INDEX "pre_simulations_isPublished_createdAt_idx" ON "pre_simulations"("isPublished", "createdAt");

-- AddForeignKey
ALTER TABLE "pre_simulations" ADD CONSTRAINT "pre_simulations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
