-- ===========================================================================
-- RADVAULT PHASE 3 PATIENT PORTAL & CONSENT VAULT SCHEMA (PRODUCTION-READY)
-- ===========================================================================

BEGIN;

-- ─── 1. LINK PATIENTS TO AUTH.USERS FOR SESSION IDENTIFICATION ──────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='patients' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.patients 
      ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);

-- ─── 2. CREATE MEDICAL RECORDS TABLE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.medical_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  modality      TEXT NOT NULL, -- 'XR' | 'CT' | 'US' | 'LAB' | 'PRESCRIPTION' | 'CONSULTATION'
  body_region   TEXT,          -- e.g. 'Chest', 'Abdomen', 'Brain'
  record_url    TEXT,          -- placeholder for file attachments
  doctor_name   TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  report        JSONB NOT NULL DEFAULT '{}'::jsonb, -- structured findings & impression
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='body_region') THEN
    ALTER TABLE public.medical_records ADD COLUMN body_region TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='report') THEN
    ALTER TABLE public.medical_records ADD COLUMN report JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='facility_name') THEN
    ALTER TABLE public.medical_records ADD COLUMN facility_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='doctor_name') THEN
    ALTER TABLE public.medical_records ADD COLUMN doctor_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='modality') THEN
    ALTER TABLE public.medical_records ADD COLUMN modality TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_records' AND column_name='title') THEN
    ALTER TABLE public.medical_records ADD COLUMN title TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);

-- ─── 3. CREATE PATIENT RECORD SHARES (CONSENT VAULT) TABLE ───────────────────

CREATE TABLE IF NOT EXISTS public.patient_record_shares (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id           UUID REFERENCES public.doctors(id) ON DELETE CASCADE, -- null if custom doctor
  doctor_name         TEXT NOT NULL,
  doctor_specialty    TEXT,
  doctor_facility     TEXT,
  share_scope         TEXT NOT NULL CHECK (share_scope IN ('health_history', 'selected_records')),
  record_ids          UUID[] DEFAULT '{}', -- list of specific authorized record IDs
  duration_type       TEXT NOT NULL CHECK (duration_type IN ('24_hours', '7_days', 'until_revoked')),
  expires_at          TIMESTAMPTZ, -- NULL if until_revoked
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  override_type       TEXT CHECK (override_type IN ('emergency_override')), -- break-glass trace
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_record_shares' AND column_name='override_type') THEN
    ALTER TABLE public.patient_record_shares ADD COLUMN override_type TEXT CHECK (override_type IN ('emergency_override'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patient_record_shares_patient_id ON public.patient_record_shares(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_record_shares_doctor_id ON public.patient_record_shares(doctor_id);

-- ─── 4. SECURITY DEFINER HELPERS & RPC ───────────────────────────────────────

-- Helper to check if doctor has consented access to patient without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.check_patient_access_for_doctor(p_patient_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.patient_record_shares s
    JOIN public.doctors d ON d.id = s.doctor_id
    WHERE d.user_id = p_user_id
      AND s.patient_id = p_patient_id
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
END;
$$;

-- Secure Break-Glass RPC function for emergency doctor access
CREATE OR REPLACE FUNCTION public.execute_emergency_break_glass(p_patient_id UUID, p_reason TEXT DEFAULT 'Clinical Emergency')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor RECORD;
  v_patient RECORD;
  v_share RECORD;
  v_expiry TIMESTAMPTZ;
BEGIN
  -- Verify caller is a registered doctor
  SELECT * INTO v_doctor FROM public.doctors WHERE user_id = auth.uid();
  IF v_doctor.id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only registered clinical doctors can execute emergency break-glass.';
  END IF;

  -- Verify patient exists
  SELECT * INTO v_patient FROM public.patients WHERE id = p_patient_id;
  IF v_patient.id IS NULL THEN
    RAISE EXCEPTION 'Patient not found.';
  END IF;

  -- 24-hour emergency window
  v_expiry := now() + interval '24 hours';

  -- Insert override record into patient_record_shares
  INSERT INTO public.patient_record_shares (
    patient_id,
    doctor_id,
    doctor_name,
    doctor_specialty,
    doctor_facility,
    share_scope,
    duration_type,
    expires_at,
    status,
    override_type
  ) VALUES (
    v_patient.id,
    v_doctor.id,
    v_doctor.name,
    COALESCE(v_doctor.specialty, 'Specialist Physician'),
    'Emergency Access Unit',
    'health_history',
    '24_hours',
    v_expiry,
    'active',
    'emergency_override'
  )
  RETURNING * INTO v_share;

  RETURN jsonb_build_object(
    'success', true,
    'share_id', v_share.id,
    'patient_id', v_share.patient_id,
    'doctor_name', v_share.doctor_name,
    'expires_at', v_share.expires_at,
    'status', v_share.status,
    'override_type', v_share.override_type
  );
END;
$$;

-- ─── 5. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_record_shares ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure idempotency and eliminate any legacy anonymous/permissive policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'medical_records' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.medical_records', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patient_record_shares' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.patient_record_shares', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patients' AND schemaname = 'public' AND policyname IN ('Patients select own patients profile', 'Doctors select consented patients') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.patients', pol.policyname);
  END LOOP;
END $$;

-- 5.1. Patients Table: Allow patient users to select their own profile record
CREATE POLICY "Patients select own patients profile" ON public.patients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5.2. Patients Table: Doctors can view patients who have actively granted consent
CREATE POLICY "Doctors select consented patients" ON public.patients
  FOR SELECT TO authenticated
  USING (public.check_patient_access_for_doctor(id, auth.uid()));

-- 5.3. Medical Records: Patients select their own records
CREATE POLICY "Patients select own medical_records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = medical_records.patient_id
        AND p.user_id = auth.uid()
    )
  );

-- 5.4. Medical Records: Authorized doctors select records based on active shares
CREATE POLICY "Doctors select authorized medical_records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_record_shares s
      JOIN public.doctors d ON d.id = s.doctor_id
      WHERE d.user_id = auth.uid()
        AND s.patient_id = medical_records.patient_id
        AND s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > now())
        AND (s.share_scope = 'health_history' OR medical_records.id = ANY(s.record_ids))
    )
  );

-- 5.5. Medical Records: Clinical staff (Doctor, Staff, ASHA) can insert records
CREATE POLICY "Clinical staff insert medical_records" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hospital_staff hs WHERE hs.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.asha_workers aw WHERE aw.user_id = auth.uid())
  );

-- 5.6. Patient Record Shares: Patients select their own consent entries
CREATE POLICY "Patients select own patient_record_shares" ON public.patient_record_shares
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_record_shares.patient_id
        AND p.user_id = auth.uid()
    )
  );

-- 5.7. Patient Record Shares: Patients insert new shares
CREATE POLICY "Patients insert own patient_record_shares" ON public.patient_record_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_record_shares.patient_id
        AND p.user_id = auth.uid()
    )
  );

-- 5.8. Patient Record Shares: Patients update/revoke their own shares
CREATE POLICY "Patients update own patient_record_shares" ON public.patient_record_shares
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_record_shares.patient_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_record_shares.patient_id
        AND p.user_id = auth.uid()
    )
  );

-- 5.9. Patient Record Shares: Doctors check if access is granted
CREATE POLICY "Doctors select assigned patient_record_shares" ON public.patient_record_shares
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.id = patient_record_shares.doctor_id
    )
  );

-- 5.10. Patient Record Shares: Doctors can insert emergency break-glass records
CREATE POLICY "Doctors insert emergency break_glass patient_record_shares" ON public.patient_record_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    override_type = 'emergency_override'
    AND EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.id = patient_record_shares.doctor_id
    )
  );

COMMIT;
