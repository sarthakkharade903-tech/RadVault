-- ==============================================================================
-- RADVAULT ABDM (Ayushman Bharat Digital Mission) SCHEMA MIGRATION
-- Supports:
--   Milestone 1 (M1): ABHA Linking & Identity Verification
--   Milestone 2 (M2): Health Information Provider (HIP) Care-Contexts & FHIR Sharing
--   Milestone 3 (M3): Health Information User (HIU) Consent Tracking & Record Exchange
-- ==============================================================================

-- 1. Extend patients & village_patients with official ABDM tracking columns
ALTER TABLE IF EXISTS patients 
  ADD COLUMN IF NOT EXISTS abha_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS abha_address VARCHAR(100),
  ADD COLUMN IF NOT EXISTS abha_status VARCHAR(20) DEFAULT 'UNLINKED',
  ADD COLUMN IF NOT EXISTS abha_profile JSONB,
  ADD COLUMN IF NOT EXISTS abdm_verified_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS village_patients 
  ADD COLUMN IF NOT EXISTS abha_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS abha_address VARCHAR(100),
  ADD COLUMN IF NOT EXISTS abha_status VARCHAR(20) DEFAULT 'UNLINKED',
  ADD COLUMN IF NOT EXISTS abha_profile JSONB,
  ADD COLUMN IF NOT EXISTS abdm_verified_at TIMESTAMPTZ;

-- 2. Care Contexts Registry (Milestone 2 - HIP)
-- Each care context corresponds to an atomic clinical episode (Consultation, Diagnostic Report, Triage)
CREATE TABLE IF NOT EXISTS care_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  patient_abha VARCHAR(100),
  reference_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. "RV-CC-2026-0001"
  display_name VARCHAR(255) NOT NULL,            -- e.g. "OP Consultation & Prescription (19-Sep-2026)"
  record_type VARCHAR(50) NOT NULL,              -- 'OPConsultation', 'DiagnosticReport', 'Prescription', 'DischargeSummary'
  source_table VARCHAR(50),                      -- 'consultations', 'medical_records', 'encounters'
  source_id UUID,
  fhir_bundle JSONB,                             -- Cached NRCeS FHIR R4 DocumentBundle
  is_linked BOOLEAN DEFAULT TRUE,
  hip_facility_id VARCHAR(100) DEFAULT 'IN2710001928', -- PHC Shirwal HFR ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_contexts_patient_id ON care_contexts(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_contexts_patient_abha ON care_contexts(patient_abha);
CREATE INDEX IF NOT EXISTS idx_care_contexts_reference_number ON care_contexts(reference_number);

-- 3. ABDM Consents Management (Milestone 2 & 3 - HIP & HIU)
-- Tracks patient consent lifecycle across ABDM Gateway
CREATE TABLE IF NOT EXISTS abdm_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id VARCHAR(100) UNIQUE NOT NULL,
  consent_request_id VARCHAR(100),
  role VARCHAR(10) NOT NULL CHECK (role IN ('HIP', 'HIU')),
  patient_abha_address VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED', -- 'REQUESTED', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED'
  purpose_code VARCHAR(20) DEFAULT 'CAREST',       -- 'CAREST', 'BTG', 'PUBHLTH'
  purpose_text VARCHAR(255) DEFAULT 'Care Management & Clinical Consultation',
  hi_types TEXT[] NOT NULL DEFAULT ARRAY['DiagnosticReport', 'Prescription', 'OPConsultation'],
  data_from TIMESTAMPTZ,
  data_to TIMESTAMPTZ,
  data_erase_at TIMESTAMPTZ,                       -- Mandatory compliance: data must not be accessed after this timestamp
  consent_artifact JSONB,                          -- Signed ABDM Consent Artifact
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abdm_consents_consent_id ON abdm_consents(consent_id);
CREATE INDEX IF NOT EXISTS idx_abdm_consents_patient_abha ON abdm_consents(patient_abha_address);
CREATE INDEX IF NOT EXISTS idx_abdm_consents_status ON abdm_consents(status);

-- 4. HIU Received External Records (Milestone 3 - HIU)
-- Encrypted FHIR bundles pulled from other hospitals/diagnostic labs via ABDM network
CREATE TABLE IF NOT EXISTS abdm_received_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id VARCHAR(100) REFERENCES abdm_consents(consent_id) ON DELETE CASCADE,
  patient_id UUID,
  patient_abha_address VARCHAR(100) NOT NULL,
  external_hip_id VARCHAR(100),                    -- Source facility HFR ID
  external_hip_name VARCHAR(255),                  -- e.g. "KEM Hospital, Pune"
  care_context_reference VARCHAR(100),
  hi_type VARCHAR(50) NOT NULL,                    -- 'DiagnosticReport', 'Prescription', etc.
  fhir_bundle JSONB NOT NULL,                      -- Decrypted HL7 FHIR R4 DocumentBundle
  data_erase_at TIMESTAMPTZ,                       -- Auto-erasure deadline per patient consent
  is_purged BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abdm_received_records_patient ON abdm_received_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_abdm_received_records_abha ON abdm_received_records(patient_abha_address);

-- 5. Enable Row-Level Security (RLS)
ALTER TABLE care_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abdm_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE abdm_received_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users / service role unrestricted access
CREATE POLICY "Allow authenticated read/write care_contexts" 
  ON care_contexts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write care_contexts for demo" 
  ON care_contexts FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write abdm_consents" 
  ON abdm_consents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write abdm_consents for demo" 
  ON abdm_consents FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write abdm_received_records" 
  ON abdm_received_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write abdm_received_records for demo" 
  ON abdm_received_records FOR ALL TO anon USING (true) WITH CHECK (true);
