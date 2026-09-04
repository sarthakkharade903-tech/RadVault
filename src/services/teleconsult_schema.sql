-- ==============================================================================
-- RADVAULT -- COMPLETE MIGRATION V2
-- Run ALL of this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rdmpeyjfqrzvniotsfxf/sql
-- ==============================================================================

-- 1. Fix care_requests status constraint to allow teleconsult statuses
ALTER TABLE care_requests DROP CONSTRAINT IF EXISTS care_requests_status_check;
ALTER TABLE care_requests ADD CONSTRAINT care_requests_status_check
  CHECK (status IN (
    'SUBMITTED', 'PENDING_PHC', 'ACCEPTED', 'COMPLETED', 'CANCELLED',
    'WAITING_FOR_DOCTOR', 'IN_CALL'
  ));

-- 2. Create teleconsult_sessions table (idempotent)
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
  token                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they do not exist
ALTER TABLE teleconsult_sessions ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE teleconsult_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Enable RLS policies
ALTER TABLE teleconsult_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read teleconsult_sessions" ON teleconsult_sessions;
DROP POLICY IF EXISTS "Allow public insert teleconsult_sessions" ON teleconsult_sessions;
DROP POLICY IF EXISTS "Allow public update teleconsult_sessions" ON teleconsult_sessions;
CREATE POLICY "Allow public read teleconsult_sessions" ON teleconsult_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert teleconsult_sessions" ON teleconsult_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update teleconsult_sessions" ON teleconsult_sessions FOR UPDATE USING (true);

-- 4. CRITICAL: Enable Supabase Realtime on teleconsult_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE teleconsult_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE care_requests;

-- 5. Verify
SELECT schemaname, tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('teleconsult_sessions', 'care_requests', 'referrals');
