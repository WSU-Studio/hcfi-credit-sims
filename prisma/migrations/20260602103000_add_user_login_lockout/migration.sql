-- Add login hardening / account-lockout columns to users.
-- All columns are nullable or have safe defaults so existing rows migrate cleanly.
ALTER TABLE "users"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil"         TIMESTAMP(3),
  ADD COLUMN "lastLoginAt"         TIMESTAMP(3),
  ADD COLUMN "lastFailedLoginAt"   TIMESTAMP(3);
