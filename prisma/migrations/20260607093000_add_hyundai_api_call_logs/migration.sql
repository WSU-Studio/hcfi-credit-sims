CREATE TABLE "hyundai_api_call_logs" (
    "id"              TEXT        NOT NULL,
    "leadId"          TEXT,
    "hyundaiLeadNo"   TEXT,
    "endpoint"        TEXT        NOT NULL,
    "url"             TEXT        NOT NULL,
    "status"          TEXT        NOT NULL,
    "httpStatus"      INTEGER,
    "hyundaiStatus"   TEXT,
    "hyundaiMessage"  TEXT,
    "requestBody"     JSONB       NOT NULL,
    "responseBody"    JSONB,
    "errorMessage"    TEXT,
    "durationMs"      INTEGER,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hyundai_api_call_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hyundai_api_call_logs_hyundaiLeadNo_idx" ON "hyundai_api_call_logs"("hyundaiLeadNo");
CREATE INDEX "hyundai_api_call_logs_leadId_idx"        ON "hyundai_api_call_logs"("leadId");
CREATE INDEX "hyundai_api_call_logs_endpoint_idx"      ON "hyundai_api_call_logs"("endpoint");
CREATE INDEX "hyundai_api_call_logs_createdAt_idx"     ON "hyundai_api_call_logs"("createdAt");

ALTER TABLE "hyundai_api_call_logs"
    ADD CONSTRAINT "hyundai_api_call_logs_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
