-- =====================================================================
-- RadVault: PART 2 of 3 — SEED DATA
-- Run this AFTER Part 1 shows "Success".
-- =====================================================================

-- Seed Patients
INSERT INTO public.radvault_patients
    (id, abha_id, name, age, gender, village, blood_group, phone, asha_worker, phc_center, critical_alert)
VALUES
    ('MH-P-10482','91-4829-1029-4820','Ramesh Patil',   54,'Male',   'Koregaon, Satara',     'B+', '+91 98234-11029','Sunita Gaikwad (ASHA #104)','PHC Shirwal',        'Lobar Pneumonia (Right Lung)'),
    ('MH-P-10485','91-5512-8821-9930','Sunita Shinde',  42,'Female', 'Wai, Satara',           'O+', '+91 98451-88310','Meena Jadhav (ASHA #108)',  'Rural Hospital Wai', 'Chronic Migraine Evaluation'),
    ('MH-P-10490','91-7719-2041-3319','Vikram Jadhav',  61,'Male',   'Karad, Satara',         'A+', '+91 97123-45678','Pooja Patil (ASHA #214)',   'Sub-District Karad', 'L4-L5 Lumbar Disc Bulge'),
    ('MH-P-10492','91-3310-9941-5521','Anil Deshmukh',  28,'Male',   'Patan, Satara',         'AB+','+91 99201-33412','Kavita Salunkhe (ASHA #312)','Patan Emergency',   'Emergency: Distal Radius Fracture'),
    ('MH-P-10495','91-8841-3392-1049','Meera Kulkarni', 48,'Female', 'Mahabaleshwar, Satara', 'O-', '+91 98332-90124','Rekha Pawar (ASHA #089)',   'PHC Mahabaleshwar',  'High Inflammatory Markers');

-- Seed Pharmacy Medicine Stock
INSERT INTO public.radvault_medicines
    (id, name, category, unit, stock, min_level, price, supplier, expiry)
VALUES
    ('MED-001','Amoxicillin 500mg',        'Antibiotic',  'Capsules', 240, 50, 8.50, 'Cipla Ltd.',     '2027-06'),
    ('MED-002','Paracetamol 650mg',         'Analgesic',   'Tablets',  850,100, 2.00, 'Sun Pharma',     '2027-12'),
    ('MED-003','Azithromycin 500mg',        'Antibiotic',  'Tablets',   38, 40,35.00, 'Dr Reddys Labs', '2026-11'),
    ('MED-004','Metformin 500mg',           'Antidiabetic','Tablets',  600,100, 4.50, 'USV Ltd.',       '2027-09'),
    ('MED-005','Amlodipine 5mg',            'Cardiac',     'Tablets',   12, 50, 6.00, 'Lupin Ltd.',     '2027-03'),
    ('MED-006','Pantoprazole 40mg',         'GI',          'Tablets',  400, 80, 5.50, 'Torrent Pharma', '2027-08'),
    ('MED-007','Ibuprofen 400mg',           'NSAID',       'Tablets',  520,100, 3.00, 'Cipla Ltd.',     '2027-06'),
    ('MED-008','Cefixime 200mg',            'Antibiotic',  'Tablets',   75, 40,45.00, 'Alkem Labs',     '2026-10'),
    ('MED-009','Vitamin D3 60000 IU',       'Supplement',  'Capsules',  90, 30,28.00, 'Abbott India',   '2027-02'),
    ('MED-010','Iron Plus Folic Acid',      'Supplement',  'Tablets',  700,150, 1.50, 'Wockhardt',      '2027-11'),
    ('MED-011','Atorvastatin 20mg',         'Cardiac',     'Tablets',   18, 50,12.00, 'Sun Pharma',     '2027-04'),
    ('MED-012','Salbutamol Inhaler 100mcg', 'Respiratory', 'Units',     22, 10,120.00,'GSK India',      '2026-12');

SELECT 'PART 2 DONE: Patients and medicines seeded.' AS result;
