-- ===========================================================================
-- RADVAULT ASHA-ONLY WORKSPACE SECURITY MIGRATION
-- Locks down tables against anonymous access, cleans test records,
-- and scopes referrals to authenticated ASHA workers geographically.
-- ===========================================================================

BEGIN;

-- 1. DELETE MOCK SECURITY TEST PATIENT (NO STALE CLINICAL DEPENDENCIES)
DELETE FROM public.patients 
WHERE id = 'f91e295b-744f-4fb7-9faa-ee47bf37ea0e';

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 3. DYNAMICALLY DROP ALL STALE PUBLIC/ANON POLICIES ON PATIENTS AND REFERRALS
-- Keeps only policies starting with "ASHA " to protect authenticated workspace operations.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('patients', 'referrals')
      AND NOT (policyname LIKE 'ASHA %')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 4. ESTABLISH GEOGRAPHIC SCOPE FOR REFERRALS RLS POLICIES
-- NOTE: referrals.patient_id is of type TEXT/VARCHAR in the database, 
-- while patients.id is of type UUID. Explicit cast to ::text is required
-- to prevent "operator does not exist: uuid = text" errors.

-- ASHA selects referrals only for patients in their assigned villages
DROP POLICY IF EXISTS "ASHA select scoped referrals" ON public.referrals;
CREATE POLICY "ASHA select scoped referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.asha_workers aw ON aw.user_id = auth.uid()
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE p.id::text = referrals.patient_id
        AND ava.village_id = p.village_id
    )
  );

-- ASHA inserts referrals only for patients in their assigned villages
DROP POLICY IF EXISTS "ASHA insert scoped referrals" ON public.referrals;
CREATE POLICY "ASHA insert scoped referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.asha_workers aw ON aw.user_id = auth.uid()
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE p.id::text = referrals.patient_id
        AND ava.village_id = p.village_id
    )
  );

-- ASHA updates referrals only for patients in their assigned villages
DROP POLICY IF EXISTS "ASHA update scoped referrals" ON public.referrals;
CREATE POLICY "ASHA update scoped referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.asha_workers aw ON aw.user_id = auth.uid()
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE p.id::text = referrals.patient_id
        AND ava.village_id = p.village_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.asha_workers aw ON aw.user_id = auth.uid()
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE p.id::text = referrals.patient_id
        AND ava.village_id = p.village_id
    )
  );

COMMIT;
