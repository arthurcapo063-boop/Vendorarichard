-- 0002_processing_fee.sql
-- Adds the processing-fee pass-through columns. Run this BEFORE deploying so
-- the build-time queries for these columns don't fail. Additive & safe.
--
-- Alternative: npx drizzle-kit push   (requires DB access)

ALTER TABLE "settings"
  ADD COLUMN IF NOT EXISTS "charge_processing_fee" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "processing_fee_percent" numeric(5,2) NOT NULL DEFAULT '3';

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "processing_fee" numeric(12,2) NOT NULL DEFAULT '0';
