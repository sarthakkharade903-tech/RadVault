-- =====================================================================
-- RadVault: PART 1 of 3 — CREATE TABLES
-- Run this first. Wait for "Success" before running Part 2.
-- =====================================================================

-- Drop all old tables if they exist (clean slate)
DROP TABLE IF EXISTS public.radvault_orders        CASCADE;
DROP TABLE IF EXISTS public.radvault_messages      CASCADE;
DROP TABLE IF EXISTS public.radvault_prescriptions CASCADE;
DROP TABLE IF EXISTS public.radvault_lab_reports   CASCADE;
DROP TABLE IF EXISTS public.radvault_studies       CASCADE;
DROP TABLE IF EXISTS public.radvault_medicines     CASCADE;
DROP TABLE IF EXISTS public.radvault_patients      CASCADE;

-- 1. Patients
CREATE TABLE public.radvault_patients (
    id            TEXT PRIMARY KEY,
    abha_id       TEXT,
    name          TEXT NOT NULL,
    age           INTEGER,
    gender        TEXT,
    village       TEXT,
    blood_group   TEXT,
    phone         TEXT,
    asha_worker   TEXT,
    phc_center    TEXT,
    critical_alert TEXT,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Studies (Scans / DICOM)
CREATE TABLE public.radvault_studies (
    id               TEXT PRIMARY KEY,
    patient_id       TEXT REFERENCES public.radvault_patients(id),
    patient_name     TEXT NOT NULL,
    patient_age      INTEGER,
    patient_gender   TEXT,
    modality         TEXT NOT NULL,
    body_region      TEXT NOT NULL,
    study_date       DATE DEFAULT CURRENT_DATE,
    facility         TEXT NOT NULL,
    technician_name  TEXT,
    referring_doctor TEXT,
    urgency          TEXT DEFAULT 'normal',
    file_url         TEXT,
    thumbnail_url    TEXT,
    file_name        TEXT,
    file_size        TEXT,
    is_multi_slice   BOOLEAN DEFAULT false,
    dicom_metadata   JSONB DEFAULT '{}'::jsonb,
    technician_notes TEXT,
    doctor_findings  TEXT,
    ai_analysis      JSONB DEFAULT '{}'::jsonb,
    measurements     JSONB DEFAULT '[]'::jsonb,
    pins             JSONB DEFAULT '[]'::jsonb,
    lab_results      JSONB DEFAULT NULL,
    created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Lab Reports (Diagnostic Centre Portal)
CREATE TABLE public.radvault_lab_reports (
    id             TEXT PRIMARY KEY,
    patient_id     TEXT REFERENCES public.radvault_patients(id),
    patient_name   TEXT NOT NULL,
    report_type    TEXT NOT NULL,
    lab_name       TEXT,
    uploaded_at    TIMESTAMPTZ DEFAULT now(),
    urgency        TEXT DEFAULT 'normal',
    status         TEXT DEFAULT 'pending',
    file_url       TEXT,
    file_name      TEXT,
    file_size      TEXT,
    summary        TEXT,
    doctor_comment TEXT,
    created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Prescriptions (Doctor Terminal)
CREATE TABLE public.radvault_prescriptions (
    id             TEXT PRIMARY KEY,
    patient_id     TEXT REFERENCES public.radvault_patients(id),
    patient_name   TEXT NOT NULL,
    patient_age    INTEGER,
    patient_gender TEXT,
    abha_id        TEXT,
    diagnosis      TEXT NOT NULL,
    drugs          JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice         TEXT,
    follow_up      TEXT,
    doctor_name    TEXT NOT NULL,
    prescribed_at  TIMESTAMPTZ DEFAULT now(),
    status         TEXT DEFAULT 'active',
    created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Doctor Messages (Chat Terminal)
CREATE TABLE public.radvault_messages (
    id           TEXT PRIMARY KEY,
    thread_id    TEXT NOT NULL,
    patient_id   TEXT REFERENCES public.radvault_patients(id),
    from_role    TEXT NOT NULL,
    from_name    TEXT NOT NULL,
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    rx_id        TEXT,
    sent_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Pharmacy Medicine Stock
CREATE TABLE public.radvault_medicines (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT NOT NULL,
    unit       TEXT NOT NULL DEFAULT 'Tablets',
    stock      INTEGER NOT NULL DEFAULT 0,
    min_level  INTEGER NOT NULL DEFAULT 50,
    price      NUMERIC(10,2) NOT NULL DEFAULT 0,
    supplier   TEXT,
    expiry     TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Pharmacy Orders
CREATE TABLE public.radvault_orders (
    id            TEXT PRIMARY KEY,
    rx_id         TEXT,
    patient_id    TEXT REFERENCES public.radvault_patients(id),
    patient_name  TEXT NOT NULL,
    doctor_name   TEXT,
    prescribed_at TIMESTAMPTZ DEFAULT now(),
    status        TEXT DEFAULT 'pending',
    items         JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount  NUMERIC(10,2) DEFAULT 0,
    dispensed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

SELECT 'PART 1 DONE: All 7 tables created successfully.' AS result;
