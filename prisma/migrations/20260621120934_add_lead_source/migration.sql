-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "salesUserId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'WEBSITE';

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_salesUserId_idx" ON "leads"("salesUserId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_salesUserId_fkey" FOREIGN KEY ("salesUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
