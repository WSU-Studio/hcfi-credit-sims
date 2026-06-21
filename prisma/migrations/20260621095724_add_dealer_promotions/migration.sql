-- CreateTable
CREATE TABLE "dealer_promotions" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "vendorName" TEXT,
    "assetCode" TEXT NOT NULL,
    "assetName" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxDiscount" DOUBLE PRECISION,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dealer_promotions_vendorCode_isActive_idx" ON "dealer_promotions"("vendorCode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_promotions_vendorCode_assetCode_key" ON "dealer_promotions"("vendorCode", "assetCode");

-- AddForeignKey
ALTER TABLE "dealer_promotions" ADD CONSTRAINT "dealer_promotions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
