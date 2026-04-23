-- CreateTable
CREATE TABLE "vehicle_model_images" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "fullAssetCode" TEXT,
    "assetName" TEXT,
    "normalizedAssetName" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mediaId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_model_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_model_images_assetCode_key" ON "vehicle_model_images"("assetCode");

-- CreateIndex
CREATE INDEX "vehicle_model_images_normalizedAssetName_idx" ON "vehicle_model_images"("normalizedAssetName");

-- CreateIndex
CREATE INDEX "vehicle_model_images_isActive_updatedAt_idx" ON "vehicle_model_images"("isActive", "updatedAt");

-- AddForeignKey
ALTER TABLE "vehicle_model_images"
ADD CONSTRAINT "vehicle_model_images_mediaId_fkey"
FOREIGN KEY ("mediaId") REFERENCES "media"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
