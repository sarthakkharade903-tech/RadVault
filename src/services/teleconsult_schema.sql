-- ==============================================================================
-- RADVAULT -- TELECONSULT SESSIONS TABLE
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rdmpeyjfqrzvniotsfxf/sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS teleconsult_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID,
  patient_name          TEXT NOT NULL,
  care_request_id       UUID,
  doctor_name           TEXT DEFAULT 'Dr. Priya Sharma (MBBS, DGO)',
  facility              TEXT DEFAULT 'Primary Health Centre - Shirwal',
  chief_complaint       TEXT,
  additional_notes      TEXT,
  vitals_snapshot       JSONB DEFAULT '{}'::jsonb,
  diagnosis             TEXT,
  rx_medicines          JSONB DEFAULT '[]'::jsonb,
  doctor_advice         TEXT,
  session_duration_sec  INTEGER DEFAULT 0,
  session_status        TEXT DEFAULT 'COMPLETED',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teleconsult_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read teleconsult_sessions" ON teleconsult_sessions;
DROP POLICY IF EXISTS "Allow public insert teleconsult_sessions" ON teleconsult_sessions;
DROP POLICY IF EXISTS "Allow public update teleconsult_sessions" ON teleconsult_sessions;

CREATE POLICY "Allow public read teleconsult_sessions"
  ON teleconsult_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert teleconsult_sessions"
  ON teleconsult_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update teleconsult_sessions"
  ON teleconsult_sessions FOR UPDATE USING (true);

ALTER TABLE care_requests DROP CONSTRAINT IF EXISTS care_requests_status_check;
ALTER TABLE care_requests ADD CONSTRAINT care_requests_status_check
  CHECK (status IN ('SUBMITTED', 'PENDING_PHC', 'ACCEPTED', 'COMPLETED', 'CANCELLED'));

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('care_requests', 'teleconsult_sessions');
