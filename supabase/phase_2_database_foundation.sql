-- ===========================================================================
-- RADVAULT PHASE 2 DATABASE FOUNDATION MIGRATION
-- ===========================================================================

BEGIN;

-- ─── 1. CREATE FACILITIES ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.facilities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  district     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. CREATE HOSPITAL STAFF PROFILE ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hospital_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  facility_id  UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospital_staff_user_id ON public.hospital_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_staff_facility_id ON public.hospital_staff(facility_id);

-- ─── 3. CREATE DOCTORS PROFILE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.doctors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  specialty    TEXT NOT NULL,
  facility_id  UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_facility_id ON public.doctors(facility_id);

-- ─── 4. EXTEND REFERRALS TABLE ─────────────────────────────────────────────

-- Safe ALTER TABLE operation to avoid duplicate errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='referrals' AND column_name='destination_facility_id'
  ) THEN
    ALTER TABLE public.referrals 
      ADD COLUMN destination_facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_destination_facility_id ON public.referrals(destination_facility_id);

-- ─── 5. CREATE CONSULTATIONS TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.consultations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id                 UUID NOT NULL UNIQUE REFERENCES public.referrals(id) ON DELETE CASCADE,
  patient_id                  UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id                   UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  facility_id                 UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  clinical_assessment         TEXT,
  diagnosis                   TEXT,
  treatment_advice            TEXT,
  prescriptions               JSONB NOT NULL DEFAULT '[]'::jsonb,
  investigations              TEXT[] NOT NULL DEFAULT '{}',
  follow_up_recommended_date  DATE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_referral_id ON public.consultations(referral_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_facility_id ON public.consultations(facility_id);

-- ─── 6. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Allow authenticated read on facilities" ON public.facilities;
DROP POLICY IF EXISTS "Allow authenticated read on hospital_staff" ON public.hospital_staff;
DROP POLICY IF EXISTS "Allow authenticated read on doctors" ON public.doctors;
DROP POLICY IF EXISTS "Hospital staff select scoped referrals" ON public.referrals;
DROP POLICY IF EXISTS "Hospital staff update scoped referrals" ON public.referrals;
DROP POLICY IF EXISTS "Doctors select scoped referrals" ON public.referrals;
DROP POLICY IF EXISTS "Facility staff select referred patients" ON public.patients;
DROP POLICY IF EXISTS "ASHA select scoped consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors select scoped consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors insert consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors update consultations" ON public.consultations;
DROP POLICY IF EXISTS "Hospital staff select scoped consultations" ON public.consultations;

-- 6.1. Facilities: Select allowed for all authenticated users
CREATE POLICY "Allow authenticated read on facilities" ON public.facilities 
  FOR SELECT TO authenticated USING (true);

-- 6.2. Profiles: Select allowed for all authenticated users
CREATE POLICY "Allow authenticated read on hospital_staff" ON public.hospital_staff 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on doctors" ON public.doctors 
  FOR SELECT TO authenticated USING (true);

-- 6.3. Referrals: Scoped to Hospital Staff by destination facility
CREATE POLICY "Hospital staff select scoped referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs
      WHERE hs.user_id = auth.uid()
        AND hs.facility_id = referrals.destination_facility_id
    )
  );

CREATE POLICY "Hospital staff update scoped referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs
      WHERE hs.user_id = auth.uid()
        AND hs.facility_id = referrals.destination_facility_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs
      WHERE hs.user_id = auth.uid()
        AND hs.facility_id = referrals.destination_facility_id
    )
  );

-- 6.4. Referrals: Scoped to Doctors by destination facility
CREATE POLICY "Doctors select scoped referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.facility_id = referrals.destination_facility_id
    )
  );

-- 6.5. Patients: Facility staff can read details of patients referred to their facility
CREATE POLICY "Facility staff select referred patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.referrals r
      LEFT JOIN public.hospital_staff hs ON hs.facility_id = r.destination_facility_id
      LEFT JOIN public.doctors d ON d.facility_id = r.destination_facility_id
      WHERE (hs.user_id = auth.uid() OR d.user_id = auth.uid())
        AND r.patient_id = patients.id::text
    )
  );

-- 6.6. Consultations: ASHA can read consultations for patients in their assigned villages
CREATE POLICY "ASHA select scoped consultations" ON public.consultations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.asha_workers aw ON aw.user_id = auth.uid()
      JOIN public.asha_village_assignments ava ON ava.asha_id = aw.id
      WHERE p.id = consultations.patient_id
        AND ava.village_id = p.village_id
    )
  );

-- 6.7. Consultations: Doctor operations (Select own facility, Insert/Update own authorship)
CREATE POLICY "Doctors select scoped consultations" ON public.consultations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.id = consultations.doctor_id
    )
  );

CREATE POLICY "Doctors insert consultations" ON public.consultations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.id = consultations.doctor_id
        AND d.facility_id = consultations.facility_id
    )
  );

CREATE POLICY "Doctors update consultations" ON public.consultations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.id = consultations.doctor_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.id = consultations.doctor_id
    )
  );

-- 6.8. Consultations: Hospital Staff select consultations in their facility
CREATE POLICY "Hospital staff select scoped consultations" ON public.consultations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs
      WHERE hs.user_id = auth.uid()
        AND hs.facility_id = consultations.facility_id
    )
  );

-- ─── 7. SEED DEMO DATA ───────────────────────────────────────────────────────

-- Seed default facilities for demonstration
INSERT INTO public.facilities (id, name, district)
VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Shrirampur Primary Health Centre', 'Ahmednagar'),
  ('f2222222-2222-2222-2222-222222222222', 'Pune Sassoon General Hospital', 'Pune')
ON CONFLICT (name) DO UPDATE SET district = EXCLUDED.district;

-- Note on hospital_staff and doctors profiles:
-- Since these profiles reference auth.users(id), they cannot be seeded in an idempotent schema script
-- without active authentication UUIDs. They will be instantiated at sign-up/link time by the auth hooks.

COMMIT;
