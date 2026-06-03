-- AlterTable
-- Add Lead.simulationLeadNo to capture the Hyundai LeadNo (TrxNo) created at
-- PriceStep submit (POST /api/simulation/lead-asset). Mirrored from
-- LeadAssetDraft.hyundaiLeadNo when the user submits ContactModal.
-- This is distinct from `hyundaiLeadNo`, which is set later when an admin
-- submits the lead to Hyundai (admin submit triggers a fresh AddLeadAsset
-- with proper CMO assignment, producing a new LeadNo).
ALTER TABLE "leads" ADD COLUMN "simulationLeadNo" TEXT;

-- CreateIndex (non-unique — same draft LeadNo could theoretically be reused
-- across resubmissions, though current flow creates a new draft each time).
CREATE INDEX "leads_simulationLeadNo_idx" ON "leads"("simulationLeadNo");
