-- =====================================================================
-- RadVault: PART 3 of 3 — RLS, REALTIME & STORAGE
-- Run this AFTER Part 2 shows "Success".
-- =====================================================================

-- ENABLE ROW LEVEL SECURITY on all tables
ALTER TABLE public.radvault_patients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_studies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_lab_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_medicines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radvault_orders        ENABLE ROW LEVEL SECURITY;

-- radvault_patients
DROP POLICY IF EXISTS "rv_pat_sel" ON public.radvault_patients;
DROP POLICY IF EXISTS "rv_pat_ins" ON public.radvault_patients;
DROP POLICY IF EXISTS "rv_pat_upd" ON public.radvault_patients;
CREATE POLICY "rv_pat_sel" ON public.radvault_patients FOR SELECT USING (true);
CREATE POLICY "rv_pat_ins" ON public.radvault_patients FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_pat_upd" ON public.radvault_patients FOR UPDATE USING (true);

-- radvault_studies
DROP POLICY IF EXISTS "rv_std_sel" ON public.radvault_studies;
DROP POLICY IF EXISTS "rv_std_ins" ON public.radvault_studies;
DROP POLICY IF EXISTS "rv_std_upd" ON public.radvault_studies;
CREATE POLICY "rv_std_sel" ON public.radvault_studies FOR SELECT USING (true);
CREATE POLICY "rv_std_ins" ON public.radvault_studies FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_std_upd" ON public.radvault_studies FOR UPDATE USING (true);

-- radvault_lab_reports
DROP POLICY IF EXISTS "rv_lab_sel" ON public.radvault_lab_reports;
DROP POLICY IF EXISTS "rv_lab_ins" ON public.radvault_lab_reports;
DROP POLICY IF EXISTS "rv_lab_upd" ON public.radvault_lab_reports;
CREATE POLICY "rv_lab_sel" ON public.radvault_lab_reports FOR SELECT USING (true);
CREATE POLICY "rv_lab_ins" ON public.radvault_lab_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_lab_upd" ON public.radvault_lab_reports FOR UPDATE USING (true);

-- radvault_prescriptions
DROP POLICY IF EXISTS "rv_rx_sel" ON public.radvault_prescriptions;
DROP POLICY IF EXISTS "rv_rx_ins" ON public.radvault_prescriptions;
DROP POLICY IF EXISTS "rv_rx_upd" ON public.radvault_prescriptions;
CREATE POLICY "rv_rx_sel" ON public.radvault_prescriptions FOR SELECT USING (true);
CREATE POLICY "rv_rx_ins" ON public.radvault_prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_rx_upd" ON public.radvault_prescriptions FOR UPDATE USING (true);

-- radvault_messages
DROP POLICY IF EXISTS "rv_msg_sel" ON public.radvault_messages;
DROP POLICY IF EXISTS "rv_msg_ins" ON public.radvault_messages;
CREATE POLICY "rv_msg_sel" ON public.radvault_messages FOR SELECT USING (true);
CREATE POLICY "rv_msg_ins" ON public.radvault_messages FOR INSERT WITH CHECK (true);

-- radvault_medicines
DROP POLICY IF EXISTS "rv_med_sel" ON public.radvault_medicines;
DROP POLICY IF EXISTS "rv_med_ins" ON public.radvault_medicines;
DROP POLICY IF EXISTS "rv_med_upd" ON public.radvault_medicines;
CREATE POLICY "rv_med_sel" ON public.radvault_medicines FOR SELECT USING (true);
CREATE POLICY "rv_med_ins" ON public.radvault_medicines FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_med_upd" ON public.radvault_medicines FOR UPDATE USING (true);

-- radvault_orders
DROP POLICY IF EXISTS "rv_ord_sel" ON public.radvault_orders;
DROP POLICY IF EXISTS "rv_ord_ins" ON public.radvault_orders;
DROP POLICY IF EXISTS "rv_ord_upd" ON public.radvault_orders;
CREATE POLICY "rv_ord_sel" ON public.radvault_orders FOR SELECT USING (true);
CREATE POLICY "rv_ord_ins" ON public.radvault_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "rv_ord_upd" ON public.radvault_orders FOR UPDATE USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('radvault-scans', 'radvault-scans', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "rv_scan_sel" ON storage.objects;
DROP POLICY IF EXISTS "rv_scan_ins" ON storage.objects;
CREATE POLICY "rv_scan_sel" ON storage.objects FOR SELECT USING (bucket_id = 'radvault-scans');
CREATE POLICY "rv_scan_ins" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'radvault-scans');

SELECT 'PART 3 DONE: RLS, storage set up. RadVault is ready!' AS result;
