-- ===========================================================================
-- RADVAULT PHASE 4 — VILLAGE SURVEY & BENEFICIARY ONBOARDING SCHEMA
-- ===========================================================================

BEGIN;

-- ─── 1. EXTEND PATIENTS TABLE FOR HOUSEHOLD RELATIONSHIPS ───────────────────
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS household_id TEXT,
  ADD COLUMN IF NOT EXISTS relation_to_head TEXT;

-- Create index for fast household retrieval
CREATE INDEX IF NOT EXISTS idx_patients_household_id ON public.patients(household_id);

-- Verify that existing RLS policies on public.patients continue to protect new columns
-- ("ASHA insert scoped patients", "ASHA select scoped patients", "ASHA update scoped patients")

COMMIT;
