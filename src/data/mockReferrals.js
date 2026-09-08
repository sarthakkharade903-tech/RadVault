// ─── Referral Facilities & Simplified Hospital Services ────────────────────────

export const HOSPITALS = [
  'Primary Health Centre (PHC) — Shirwal',
  'Sub-District Hospital — Wai',
  'Satara District Civil Hospital',
  'Pune Sassoon General Hospital',
  'Government Medical College Hospital'
];

// Simplified, accessible departments for village ASHA referrals
export const DEPARTMENTS = [
  'General Medicine & OPD',
  'Maternity & Gynecology (ANC / Delivery)',
  'Child Health & Pediatrics',
  'Emergency & Casualty / Trauma',
  'Chest, Cough & TB DOTS',
  'Bone & Orthopedics (Fractures / Pain)',
  'Eye & Vision Care',
  'Dental OPD'
];

export const MOCK_REFERRALS = [
  {
    id: 'ref-001',
    patientName: 'Rahul Patil',
    patientId: 'ABHA-9281-4402',
    createdBy: 'Priya Deshmukh (ASHA)',
    department: 'Emergency & Casualty / Trauma',
    hospital: 'Satara District Civil Hospital',
    doctor: 'Dr. Deshmukh (Casualty MO)',
    priority: 'RED',
    status: 'Pending',
    rawStatus: 'SUBMITTED',
    aiNote: 'Severe retrosternal chest pain radiating to left arm. Profuse diaphoresis, BP 160/100. Immediate ECG and cardiac triage required.',
    is_pregnant: false,
    createdAt: 'Today, 10:15 AM'
  },
  {
    id: 'ref-002',
    patientName: 'Sunita Jadhav',
    patientId: 'ABHA-4192-8813',
    createdBy: 'Priya Deshmukh (ASHA)',
    department: 'Maternity & Gynecology (ANC / Delivery)',
    hospital: 'Sub-District Hospital — Wai',
    doctor: 'Dr. Anita Mane (OB/GYN)',
    priority: 'ORANGE',
    status: 'Accepted',
    rawStatus: 'ACCEPTED',
    aiNote: '34 weeks primigravida with persistent headache, blurred vision, and bilateral pedal edema. High risk pre-eclampsia screening.',
    is_pregnant: true,
    createdAt: 'Today, 08:30 AM'
  },
  {
    id: 'ref-003',
    patientName: 'Anand Shinde',
    patientId: 'ABHA-7721-1054',
    createdBy: 'Priya Deshmukh (ASHA)',
    department: 'General Medicine & OPD',
    hospital: 'Primary Health Centre (PHC) — Shirwal',
    doctor: 'Dr. Kulkarni (Medical Officer)',
    priority: 'GREEN',
    status: 'Completed',
    rawStatus: 'COMPLETED',
    aiNote: 'Known diabetic with non-healing superficial ulcer over right 1st metatarsal. Prescribed antibiotic dressings and glycemic titration.',
    is_pregnant: false,
    createdAt: 'Yesterday, 04:20 PM'
  },
  {
    id: 'ref-004',
    patientName: 'Meena Kamble',
    patientId: 'ABHA-6320-9941',
    createdBy: 'Priya Deshmukh (ASHA)',
    department: 'Chest, Cough & TB DOTS',
    hospital: 'Primary Health Centre (PHC) — Shirwal',
    doctor: 'Dr. S. Patil (Chest Specialist)',
    priority: 'GREEN',
    status: 'Accepted',
    rawStatus: 'WAITING_FOR_DOCTOR',
    aiNote: 'Productive cough with low-grade evening pyrexia for 22 days. Sputum CBNAAT testing initiated under NTEP.',
    is_pregnant: false,
    createdAt: 'Sep 3, 2026'
  },
  {
    id: 'ref-005',
    patientName: 'Tanaji Rao Mohite',
    patientId: 'ABHA-5514-3829',
    createdBy: 'Priya Deshmukh (ASHA)',
    department: 'Bone & Orthopedics (Fractures / Pain)',
    hospital: 'Sub-District Hospital — Wai',
    doctor: 'Dr. V. Joshi (Orthopedist)',
    priority: 'ORANGE',
    status: 'Pending',
    rawStatus: 'SUBMITTED',
    aiNote: 'Fall from farm bullock cart with closed deformity over right distal forearm. Suspected Colles fracture, needs X-ray and POP casting.',
    is_pregnant: false,
    createdAt: 'Sep 2, 2026'
  }
];
