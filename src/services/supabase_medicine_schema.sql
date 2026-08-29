-- ==============================================================================
-- RADVAULT ASHA DRUG KIT & PHC INDENT SCHEMA MIGRATION
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Create asha_medicines table
CREATE TABLE IF NOT EXISTS asha_medicines (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mr TEXT,
    name_hi TEXT,
    category TEXT DEFAULT 'General',
    stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'tabs',
    threshold INTEGER NOT NULL DEFAULT 10,
    batch_number TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE asha_medicines ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if re-running
DROP POLICY IF EXISTS "Allow public read asha_medicines" ON asha_medicines;
DROP POLICY IF EXISTS "Allow public insert asha_medicines" ON asha_medicines;
DROP POLICY IF EXISTS "Allow public update asha_medicines" ON asha_medicines;
DROP POLICY IF EXISTS "Allow public delete asha_medicines" ON asha_medicines;

-- Allow public read/write access for field workers
CREATE POLICY "Allow public read asha_medicines" ON asha_medicines FOR SELECT USING (true);
CREATE POLICY "Allow public insert asha_medicines" ON asha_medicines FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update asha_medicines" ON asha_medicines FOR UPDATE USING (true);
CREATE POLICY "Allow public delete asha_medicines" ON asha_medicines FOR DELETE USING (true);

-- Seed standard NHM ASHA Drug Kit items
INSERT INTO asha_medicines (id, name_en, name_mr, name_hi, category, stock, unit, threshold, batch_number, expiry_date) VALUES
('d1', 'Iron Folic Acid (IFA) Tablets', 'आयर्न फॉलिक ऍसिड गोळ्या', 'आयरन फोलिक एसिड गोलियां', 'Maternal Health', 120, 'tabs', 50, 'IFA-2026-B12', '2027-12-31'),
('d2', 'Paracetamol 500mg', 'पॅरासिटामॉल गोळ्या', 'पैरासिटामोल गोलियां', 'Fever & Pain', 65, 'tabs', 30, 'PCM-500-A9', '2027-08-31'),
('d3', 'ORS Packets (Oral Rehydration)', 'ओ.आर.एस. पाकिटे', 'ओआरएस पैकेट', 'Child Care', 24, 'packets', 15, 'ORS-WHO-88', '2028-03-31'),
('d4', 'Zinc Sulfate 20mg', 'झिंक गोळ्या', 'जिंक की गोलियां', 'Child Care', 40, 'tabs', 20, 'ZN-20-C4', '2027-10-31'),
('d5', 'Pregnancy Test Kits (Nischay)', 'गर्भधारणा तपासणी किट', 'गर्भावस्था जांच किट', 'Maternal Health', 8, 'kits', 5, 'NSH-KIT-01', '2027-05-31'),
('d6', 'Clean Delivery Kits (DDK)', 'स्वच्छ प्रसूती किट', 'प्रसव किट', 'Maternal Health', 3, 'kits', 2, 'DDK-STER-14', '2028-01-31')
ON CONFLICT (id) DO NOTHING;

-- 2. Create medicine_indents table
CREATE TABLE IF NOT EXISTS medicine_indents (
    id TEXT PRIMARY KEY,
    asha_name TEXT DEFAULT 'Priya Deshmukh',
    phc_name TEXT DEFAULT 'PHC Shirwal',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'SUBMITTED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE medicine_indents ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if re-running
DROP POLICY IF EXISTS "Allow public read medicine_indents" ON medicine_indents;
DROP POLICY IF EXISTS "Allow public insert medicine_indents" ON medicine_indents;
DROP POLICY IF EXISTS "Allow public update medicine_indents" ON medicine_indents;

CREATE POLICY "Allow public read medicine_indents" ON medicine_indents FOR SELECT USING (true);
CREATE POLICY "Allow public insert medicine_indents" ON medicine_indents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update medicine_indents" ON medicine_indents FOR UPDATE USING (true);
