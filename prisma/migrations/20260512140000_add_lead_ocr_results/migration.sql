-- CreateTable
CREATE TABLE "lead_ocr_results" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "hyundaiLeadNo" TEXT,
    "ktpFileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "rawResponse" JSONB,
    "nik" TEXT,
    "nama" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TEXT,
    "jenisKelamin" TEXT,
    "alamat" TEXT,
    "kotaKabupaten" TEXT,
    "kecamatan" TEXT,
    "kelurahanDesa" TEXT,
    "zipCode" TEXT,
    "agama" TEXT,
    "statusPerkawinan" TEXT,
    "mrNationalityCode" TEXT,
    "addLeadCustPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_ocr_results_leadId_idx" ON "lead_ocr_results"("leadId");

-- CreateIndex
CREATE INDEX "lead_ocr_results_createdAt_idx" ON "lead_ocr_results"("createdAt");

-- AddForeignKey
ALTER TABLE "lead_ocr_results" ADD CONSTRAINT "lead_ocr_results_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
