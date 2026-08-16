-- 0001_subaccount_split.sql
-- Adds the Paystack split-payment subaccount fields to the settings table.
-- This project normally uses `drizzle-kit push` to sync the schema. If you
-- deploy to a remote DB (e.g. Supabase) that you can't reach from your local
-- machine, run this file directly (Supabase → SQL Editor, or psql) and then
-- redeploy. Safe to run once; all columns are additive with defaults.
--
-- Alternative (same result): npx drizzle-kit push   <-- requires DB access

ALTER TABLE "settings"
  ADD COLUMN IF NOT EXISTS "subaccount_type" text NOT NULL DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS "subaccount_bank_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "subaccount_bank_code" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "subaccount_account_number" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "subaccount_account_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "subaccount_code" text NOT NULL DEFAULT '';
