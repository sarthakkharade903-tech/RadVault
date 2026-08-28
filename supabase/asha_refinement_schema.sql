-- ===========================================================================
-- RADVAULT ASHA WORKSPACE REFINEMENT MIGRATION SCHEMA
-- ===========================================================================

BEGIN;

-- ─── 1. GEOGRAPHIC HIERARCHY TABLES ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  district    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.villages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  area_id     UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, area_id)
);

CREATE INDEX IF NOT EXISTS idx_villages_area_id ON public.villages(area_id);


-- ─── 2. ASHA WORKER PROFILES & ASSIGNMENTS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.asha_workers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id   TEXT NOT NULL UNIQUE, -- e.g. 'ASHA-MH-7042'
  name        TEXT NOT NULL,
  phone       TEXT,
  phc_name    TEXT NOT NULL, -- e.g. 'Shrirampur PHC'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asha_village_assignments (
  asha_id     UUID NOT NULL REFERENCES public.asha_workers(id) ON DELETE CASCADE,
  village_id  UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  PRIMARY KEY (asha_id, village_id)
);

CREATE INDEX IF NOT EXISTS idx_asha_workers_user_id ON public.asha_workers(user_id);


-- ─── 3. LINK PATIENTS TO GEOGRAPHY ──────────────────────────────────────────

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS village_id UUID REFERENCES public.villages(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS area_id    UUID REFERENCES public.areas(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_patients_village_id ON public.patients(village_id);
CREATE INDEX IF NOT EXISTS idx_patients_area_id ON public.patients(area_id);


-- ─── 4. CLINICAL ENCOUNTERS & TRIAGE PERSISTENCE ────────────────────────────

CREATE TABLE IF NOT EXISTS public.encounters (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id                   TEXT UNIQUE, -- Links offline draft caches
  patient_id                 UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  asha_id                    UUID NOT NULL REFERENCES public.asha_workers(id) ON DELETE RESTRICT,
  date                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  complaint                  TEXT NOT NULL,
  symptoms                   TEXT[] NOT NULL DEFAULT '{}',
  symptom_notes              TEXT,
  vitals                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  danger_signs               TEXT[] NOT NULL DEFAULT '{}',
  priority                   TEXT NOT NULL DEFAULT 'LOW',
  priority_label             TEXT NOT NULL DEFAULT 'Routine',
  ai_note                    TEXT,
  outcome                    TEXT NOT NULL DEFAULT 'LOCAL_ADVICE', -- 'REFERRAL_CREATED' | 'LOCAL_ADVICE'
  referral_id                UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  follow_up_date             DATE,
  follow_up_reason           TEXT,
  follow_up_completed        BOOLEAN NOT NULL DEFAULT false,
  follow_up_completed_at     TIMESTAMPTZ,
  follow_up_outcome          TEXT, -- 'COMPLETED' | 'RESCHEDULED' | 'PATIENT_WENT_FACILITY' | etc.
  follow_up_resolution_note  TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON public.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_asha_id ON public.encounters(asha_id);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON public.encounters(date DESC);


-- ─── 5. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asha_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asha_village_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

-- 5.0. DROP Existing Policies to ensure idempotency and repeatable execution
DROP POLICY IF EXISTS "Allow authenticated read on areas" ON public.areas;
DROP POLICY IF EXISTS "Allow authenticated read on villages" ON public.villages;
DROP POLICY IF EXISTS "Allow authenticated read on asha_workers" ON public.asha_workers;
DROP POLICY IF EXISTS "Allow authenticated read on asha_village_assignments" ON public.asha_village_assignments;
DROP POLICY IF EXISTS "ASHA select scoped patients" ON public.patients;
DROP POLICY IF EXISTS "ASHA insert scoped patients" ON public.patients;
DROP POLICY IF EXISTS "ASHA update scoped patients" ON public.patients;
DROP POLICY IF EXISTS "ASHA select scoped encounters" ON public.encounters;
DROP POLICY IF EXISTS "ASHA insert scoped encounters" ON public.encounters;
DROP POLICY IF EXISTS "ASHA update scoped encounters" ON public.encounters;

-- 5.1. Areas & Villages: Allow all authenticated users to read geographic references
CREATE POLICY "Allow authenticated read on areas" ON public.areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on villages" ON public.villages FOR SELECT TO authenticated USING (true);

-- 5.2. ASHA Workers profiles: SELECT allowed for authenticated
CREATE POLICY "Allow authenticated read on asha_workers" ON public.asha_workers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on asha_village_assignments" ON public.asha_village_assignments FOR SELECT TO authenticated USING (true);

-- 5.3. Scoped patient read: ASHA worker can select patients in their assigned villages
CREATE POLICY "ASHA select scoped patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE aw.user_id = auth.uid()
        AND ava.village_id = patients.village_id
    )
  );

-- 5.4. Scoped patient insert: ASHA worker can register patients into their assigned villages
-- Enforces qualified patients.village_id to prevent namespace shadowing vulnerabilities
CREATE POLICY "ASHA insert scoped patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE aw.user_id = auth.uid()
        AND ava.village_id = patients.village_id
    )
  );

-- 5.5. Scoped patient update: ASHA worker can update patients belonging to an authorized village
CREATE POLICY "ASHA update scoped patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE aw.user_id = auth.uid()
        AND ava.village_id = patients.village_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE aw.user_id = auth.uid()
        AND ava.village_id = patients.village_id
    )
  );

-- 5.6. Encounters: ASHA worker can select/insert/update encounters
CREATE POLICY "ASHA select scoped encounters" ON public.encounters
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      JOIN public.patients p ON p.id = encounters.patient_id
      WHERE aw.user_id = auth.uid()
        AND ava.village_id = p.village_id
    )
  );

CREATE POLICY "ASHA insert scoped encounters" ON public.encounters
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      JOIN public.patients p ON p.id = encounters.patient_id
      WHERE aw.user_id = auth.uid()
        AND aw.id = encounters.asha_id -- Enforces worker ID match (prevents impersonation)
        AND ava.village_id = p.village_id
    )
  );

CREATE POLICY "ASHA update scoped encounters" ON public.encounters
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      WHERE aw.user_id = auth.uid()
        AND aw.id = encounters.asha_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.asha_workers aw
      WHERE aw.user_id = auth.uid()
        AND aw.id = encounters.asha_id
    )
  );


-- ─── 6. SEED DEMO DATA ───────────────────────────────────────────────────────

-- Seed Area
INSERT INTO public.areas (id, name, district)
VALUES ('d2222222-2222-2222-2222-222222222222', 'Sector 4', 'Ahmednagar')
ON CONFLICT (name) DO UPDATE SET district = EXCLUDED.district;

-- Seed Villages
INSERT INTO public.villages (id, name, area_id)
VALUES 
  ('e1111111-1111-1111-1111-111111111111', 'Shrirampur Ward 4', 'd2222222-2222-2222-2222-222222222222'),
  ('e2222222-2222-2222-2222-222222222222', 'Pimpalgaon Rural', 'd2222222-2222-2222-2222-222222222222'),
  ('e3333333-3333-3333-3333-333333333333', 'Khedi Village', 'd2222222-2222-2222-2222-222222222222')
ON CONFLICT (name, area_id) DO NOTHING;

-- Map existing patients to Shrirampur Ward 4 if not set
UPDATE public.patients 
SET 
  village_id = 'e1111111-1111-1111-1111-111111111111',
  area_id = 'd2222222-2222-2222-2222-222222222222'
WHERE village_id IS NULL OR area_id IS NULL;

COMMIT;
