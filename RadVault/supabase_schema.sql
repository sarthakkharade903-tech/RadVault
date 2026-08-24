-- =================================================================
-- 🏥 RadVault — COMPLETE FIXED SQL (Safe to run multiple times)
-- PASTE THIS ENTIRE BLOCK → Supabase SQL Editor → Click RUN
-- Tables are created FIRST, then RLS is applied at the end.
-- =================================================================

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: CREATE ALL TABLES FIRST
-- ─────────────────────────────────────────────────────────────────

-- 1a. Patients
CREATE TABLE IF NOT EXISTS public.radvault_patients (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    age           INTEGER,
    gender        TEXT,
    village       TEXT,
    blood_group   TEXT,
    phone         TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1b. Studies (Scans / DICOM)
CREATE TABLE IF NOT EXISTS public.radvault_studies (
    id               TEXT PRIMARY KEY,
    patient_id       TEXT,
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
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1c. Lab Reports (Diagnostic Centre Portal)
CREATE TABLE IF NOT EXISTS public.radvault_lab_reports (
    id             TEXT PRIMARY KEY,
    patient_id     TEXT,
    patient_name   TEXT NOT NULL,
    report_type    TEXT NOT NULL,
    lab_name       TEXT,
    uploaded_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
    urgency        TEXT DEFAULT 'normal',
    status         TEXT DEFAULT 'pending',
    file_url       TEXT,
    file_name      TEXT,
    file_size      TEXT,
    summary        TEXT,
    doctor_comment TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1d. Prescriptions (Doctor Terminal)
CREATE TABLE IF NOT EXISTS public.radvault_prescriptions (
    id             TEXT PRIMARY KEY,
    patient_id     TEXT,
    patient_name   TEXT NOT NULL,
    patient_age    INTEGER,
    patient_gender TEXT,
    abha_id        TEXT,
    diagnosis      TEXT NOT NULL,
    drugs          JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice         TEXT,
    follow_up      TEXT,
    doctor_name    TEXT NOT NULL,
    prescribed_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status         TEXT DEFAULT 'active',
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1e. Doctor Messages (Chat)
CREATE TABLE IF NOT EXISTS public.radvault_messages (
    id           TEXT PRIMARY KEY,
    thread_id    TEXT NOT NULL,
    patient_id   TEXT,
    from_role    TEXT NOT NULL,
    from_name    TEXT NOT NULL,
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    rx_id        TEXT,
    sent_at      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1f. Pharmacy Medicine Stock
CREATE TABLE IF NOT EXISTS public.radvault_medicines (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT NOT NULL,
    unit       TEXT NOT NULL DEFAULT 'Tablets',
    stock      INTEGER NOT NULL DEFAULT 0,
    min_level  INTEGER NOT NULL DEFAULT 50,
    price      NUMERIC(10,2) NOT NULL DEFAULT 0,
    supplier   TEXT,
    expiry     TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 1g. Pharmacy Orders
CREATE TABLE IF NOT EXISTS public.radvault_orders (
    id            TEXT PRIMARY KEY,
    rx_id         TEXT,
    patient_id    TEXT,
    patient_name  TEXT NOT NULL,
    doctor_name   TEXT,
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status        TEXT DEFAULT 'pending',
    items         JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount  NUMERIC(10,2) DEFAULT 0,
    dispensed_at  TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: SAFELY ADD MISSING COLUMNS TO EXISTING TABLES
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='radvault_patients' AND column_name='abha_id') THEN
        ALTER TABLE public.radvault_patients ADD COLUMN abha_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='radvault_patients' AND column_name='asha_worker') THEN
        ALTER TABLE public.radvault_patients ADD COLUMN asha_worker TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='radvault_patients' AND column_name='phc_center') THEN
        ALTER TABLE public.radvault_patients ADD COLUMN phc_center TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='radvault_patients' AND column_name='critical_alert') THEN
        ALTER TABLE public.radvault_patients ADD COLUMN critical_alert TEXT;
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: SEED PATIENTS (safe upsert)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.radvault_patients
    (id, abha_id, name, age, gender, village, blood_group, phone, asha_worker, phc_center, critical_alert)
VALUES
    ('MH-P-10482','91-4829-1029-4820','Ramesh Patil',  54,'Male',  'Koregaon, Satara',    'B+', '+91 98234-11029','Sunita Gaikwad (ASHA #104)','PHC Shirwal',       'Lobar Pneumonia (Right Lung)'),
    ('MH-P-10485','91-5512-8821-9930','Sunita Shinde', 42,'Female','Wai, Satara',          'O+', '+91 98451-88310','Meena Jadhav (ASHA #108)',  'Rural Hospital Wai','Chronic Migraine Evaluation'),
    ('MH-P-10490','91-7719-2041-3319','Vikram Jadhav', 61,'Male',  'Karad, Satara',        'A+', '+91 97123-45678','Pooja Patil (ASHA #214)',   'Sub-District Karad','L4-L5 Lumbar Disc Bulge'),
    ('MH-P-10492','91-3310-9941-5521','Anil Deshmukh', 28,'Male',  'Patan, Satara',        'AB+','+91 99201-33412','Kavita Salunkhe (ASHA #312)','Patan Emergency',  'Emergency: Distal Radius Fracture'),
    ('MH-P-10495','91-8841-3392-1049','Meera Kulkarni',48,'Female','Mahabaleshwar, Satara','O-', '+91 98332-90124','Rekha Pawar (ASHA #089)',   'PHC Mahabaleshwar', 'High Inflammatory Markers')
ON CONFLICT (id) DO UPDATE SET
    abha_id        = EXCLUDED.abha_id,
    name           = EXCLUDED.name,
    age            = EXCLUDED.age,
    gender         = EXCLUDED.gender,
    village        = EXCLUDED.village,
    blood_group    = EXCLUDED.blood_group,
    asha_worker    = EXCLUDED.asha_worker,
    phc_center     = EXCLUDED.phc_center,
    critical_alert = EXCLUDED.critical_alert;

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: SEED PHARMACY MEDICINE STOCK
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.radvault_medicines
    (id, name, category, unit, stock, min_level, price, supplier, expiry)
VALUES
    ('MED-001','Amoxicillin 500mg',         'Antibiotic',  'Capsules', 240, 50, 8.50, 'Cipla Ltd.',    '2027-06'),
    ('MED-002','Paracetamol 650mg',          'Analgesic',   'Tablets',  850,100, 2.00, 'Sun Pharma',    '2027-12'),
    ('MED-003','Azithromycin 500mg',         'Antibiotic',  'Tablets',   38, 40,35.00, 'Dr. Reddys',   '2026-11'),
    ('MED-004','Metformin 500mg',            'Antidiabetic','Tablets',  600,100, 4.50, 'USV Ltd.',      '2027-09'),
    ('MED-005','Amlodipine 5mg',             'Cardiac',     'Tablets',   12, 50, 6.00, 'Lupin Ltd.',    '2027-03'),
    ('MED-006','Pantoprazole 40mg',          'GI',          'Tablets',  400, 80, 5.50, 'Torrent Pharma','2027-08'),
    ('MED-007','Ibuprofen 400mg',            'NSAID',       'Tablets',  520,100, 3.00, 'Cipla Ltd.',    '2027-06'),
    ('MED-008','Cefixime 200mg',             'Antibiotic',  'Tablets',   75, 40,45.00, 'Alkem Labs',    '2026-10'),
    ('MED-009','Vitamin D3 60000 IU',        'Supplement',  'Capsules',  90, 30,28.00, 'Abbott India',  '2027-02'),
    ('MED-010','Iron + Folic Acid',          'Supplement',  'Tablets',  700,150, 1.50, 'Wockhardt',     '2027-11'),
    ('MED-011','Atorvastatin 20mg',          'Cardiac',     'Tablets',   18, 50,12.00, 'Sun Pharma',    '2027-04'),
    ('MED-012','Salbutamol Inhaler 100mcg',  'Respiratory', 'Units',     22, 10,120.00,'GSK India',     '2026-12')
ON CONFLICT (id) DO UPDATE SET
    stock     = EXCLUDED.stock,
    min_level = EXCLUDED.min_level,
    price     = EXCLUDED.price,
    supplier  = EXCLUDED.supplier;

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: ROW LEVEL SECURITY — applied AFTER tables exist
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.radvault_patients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_studies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_lab_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_medicines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_orders        ENABLE ROW LEVEL SECURITY;

-- Patients
DROP POLICY IF EXISTS "rv_pat_sel" ON public.radvault_patients;
DROP POLICY IF EXISTS "rv_pat_ins" ON public.radvault_patients;
DROP POLICY IF EXISTS "rv_pat_upd" ON public.radvault_patients;
CREATE POLICY "rv_pat_sel" ON public.radvault_patients FOR SELECT USING (true);
CREATE POLICY "rv_pat_ins" ON public.radvault_patients FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_pat_upd" ON public.radvault_patients FOR UPDATE USING (true);

-- Studies
DROP POLICY IF EXISTS "rv_std_sel" ON public.radvault_studies;
DROP POLICY IF EXISTS "rv_std_ins" ON public.radvault_studies;
DROP POLICY IF EXISTS "rv_std_upd" ON public.radvault_studies;
CREATE POLICY "rv_std_sel" ON public.radvault_studies FOR SELECT USING (true);
CREATE POLICY "rv_std_ins" ON public.radvault_studies FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_std_upd" ON public.radvault_studies FOR UPDATE USING (true);

-- Lab Reports
DROP POLICY IF EXISTS "rv_lab_sel" ON public.radvault_lab_reports;
DROP POLICY IF EXISTS "rv_lab_ins" ON public.radvault_lab_reports;
DROP POLICY IF EXISTS "rv_lab_upd" ON public.radvault_lab_reports;
CREATE POLICY "rv_lab_sel" ON public.radvault_lab_reports FOR SELECT USING (true);
CREATE POLICY "rv_lab_ins" ON public.radvault_lab_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_lab_upd" ON public.radvault_lab_reports FOR UPDATE USING (true);

-- Prescriptions
DROP POLICY IF EXISTS "rv_rx_sel" ON public.radvault_prescriptions;
DROP POLICY IF EXISTS "rv_rx_ins" ON public.radvault_prescriptions;
DROP POLICY IF EXISTS "rv_rx_upd" ON public.radvault_prescriptions;
CREATE POLICY "rv_rx_sel" ON public.radvault_prescriptions FOR SELECT USING (true);
CREATE POLICY "rv_rx_ins" ON public.radvault_prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_rx_upd" ON public.radvault_prescriptions FOR UPDATE USING (true);

-- Messages
DROP POLICY IF EXISTS "rv_msg_sel" ON public.radvault_messages;
DROP POLICY IF EXISTS "rv_msg_ins" ON public.radvault_messages;
CREATE POLICY "rv_msg_sel" ON public.radvault_messages FOR SELECT USING (true);
CREATE POLICY "rv_msg_ins" ON public.radvault_messages FOR INSERT WITH CHECK (true);

-- Medicines
DROP POLICY IF EXISTS "rv_med_sel" ON public.radvault_medicines;
DROP POLICY IF EXISTS "rv_med_ins" ON public.radvault_medicines;
DROP POLICY IF EXISTS "rv_med_upd" ON public.radvault_medicines;
CREATE POLICY "rv_med_sel" ON public.radvault_medicines FOR SELECT USING (true);
CREATE POLICY "rv_med_ins" ON public.radvault_medicines FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_med_upd" ON public.radvault_medicines FOR UPDATE USING (true);

-- Orders
DROP POLICY IF EXISTS "rv_ord_sel" ON public.radvault_orders;
DROP POLICY IF EXISTS "rv_ord_ins" ON public.radvault_orders;
DROP POLICY IF EXISTS "rv_ord_upd" ON public.radvault_orders;
CREATE POLICY "rv_ord_sel" ON public.radvault_orders FOR SELECT USING (true);
CREATE POLICY "rv_ord_ins" ON public.radvault_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_ord_upd" ON public.radvault_orders FOR UPDATE USING (true);

-- ─────────────────────────────────────────────────────────────────
-- STEP 6: REALTIME (safe — ignore error if already added)
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.radvault_studies;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.radvault_lab_reports;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.radvault_messages;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.radvault_orders;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- STEP 7: STORAGE BUCKET FOR SCANS & REPORTS
-- ─────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('radvault-scans', 'radvault-scans', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "rv_scan_sel" ON storage.objects;
DROP POLICY IF EXISTS "rv_scan_ins" ON storage.objects;
CREATE POLICY "rv_scan_sel" ON storage.objects FOR SELECT USING (bucket_id = 'radvault-scans');
CREATE POLICY "rv_scan_ins" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'radvault-scans');
