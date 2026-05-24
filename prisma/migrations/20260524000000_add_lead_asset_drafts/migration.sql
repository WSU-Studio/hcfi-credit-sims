-- CreateTable
CREATE TABLE "lead_asset_drafts" (
    "id" TEXT NOT NULL,
    "hyundaiLeadNo" TEXT NOT NULL,
    "vendorCode" TEXT,
    "vendorName" TEXT,
    "oriOfficeCode" TEXT,
    "oriOfficeName" TEXT,
    "modelCode" TEXT,
    "modelName" TEXT,
    "fscCode" TEXT,
    "trimName" TEXT,
    "manufacturingYear" INTEGER,
    "exteriorColorCode" TEXT,
    "exteriorColorName" TEXT,
    "interiorColorCode" TEXT,
    "interiorColorName" TEXT,
    "otrPrice" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "assetPriceAmt" DOUBLE PRECISION,
    "oemAccessoryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawRequest" JSONB,
    "rawResponse" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "convertedLeadId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_asset_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_asset_drafts_hyundaiLeadNo_key" ON "lead_asset_drafts"("hyundaiLeadNo");

-- CreateIndex
CREATE INDEX "lead_asset_drafts_status_createdAt_idx" ON "lead_asset_drafts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "lead_asset_drafts_convertedLeadId_idx" ON "lead_asset_drafts"("convertedLeadId");
