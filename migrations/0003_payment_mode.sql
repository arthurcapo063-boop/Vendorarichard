-- 0003_payment_mode.sql
-- Adds the active Paystack mode (test/live) setting column. Run this BEFORE
-- deploying so build-time queries for this column don't fail. Additive & safe.
--
-- Alternative: npx drizzle-kit push   (requires DB access)

ALTER TABLE "settings"
  ADD COLUMN IF NOT EXISTS "payment_mode" text NOT NULL DEFAULT 'test';
