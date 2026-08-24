// National Health Portal / ABDM Tele-Diagnostics Sample Datasets
// Real-world rural health center scans, ABHA IDs, and clinical metadata

export const GOVT_METADATA = {
  portalName: 'National Tele-Radiology Network (RadVault)',
  ministry: 'Ministry of Health & Family Welfare • Government of India',
  initiative: 'Ayushman Bharat Digital Mission (ABDM) • eSanjeevani Tele-Diagnostics',
  helpline: 'Toll Free: 104 / 1075',
  state: 'Government of Maharashtra • Directorate of Health Services'
};

export const SAMPLE_PATIENTS = [
  {
    id: 'MH-P-10482',
    abhaId: '91-4829-1029-4820',
    name: 'Ramesh Patil',
    age: 54,
    gender: 'Male',
    village: 'Koregaon, Satara District',
    bloodGroup: 'B+',
    phone: '+91 98234-11029',
    phcCenter: 'Primary Health Center (PHC) Shirwal',
    ashaWorker: 'Sunita Gaikwad (ASHA #104)',
    criticalAlert: 'Lobar Pneumonia (Right Lower Lung)',
    urgency: 'urgent',
    vitals: {
      bp: '140/90',
      bpStatus: 'Elevated (Stage 1)',
      bpColor: 'text-amber-600',
      spo2: 92,
      spo2Status: 'Alert Low (On 2L O2)',
      spo2Color: 'text-red-600',
      heartRate: 88,
      heartRateStatus: 'Normal Sinus',
      heartRateColor: 'text-emerald-600',
      temp: '101.4 °F',
      tempStatus: 'High Fever',
      tempColor: 'text-amber-600',
      respiratoryRate: '24 /min (Tachypnea)',
      bloodSugar: '142 mg/dL (Post-prandial)'
    },
    pastMedicalHistory: {
      chronicDiseases: [
        { name: 'Type 2 Diabetes Mellitus', since: 'Diagnosed 2019', status: 'Moderate Control' },
        { name: 'Essential Hypertension', since: 'Diagnosed 2021', status: 'On Amlodipine 5mg' },
        { name: 'Mild Chronic Bronchitis', since: 'Diagnosed 2023', status: 'Seasonal exacerbation' }
      ],
      allergies: ['No Known Drug Allergies (NKDA)'],
      surgicalHistory: ['Appendectomy (2012 at Satara Civil Hospital)'],
      familyHistory: ['Father had Ischemic Heart Disease, Mother has Type 2 Diabetes']
    },
    pastPrescriptions: [
      {
        id: 'RX-2026-0810',
        date: '2026-08-10',
        doctor: 'Dr. Anita Joshi (PHC Shirwal)',
        diagnosis: 'Diabetic Health Check & Mild Cough',
        drugs: [
          { name: 'Metformin 500mg', dose: '1 tablet twice daily (BD)', timing: 'After food', days: '30 days' },
          { name: 'Amlodipine 5mg', dose: '1 tablet once daily (OD)', timing: 'Morning after breakfast', days: '30 days' }
        ]
      }
    ],
    currentMedicationsStock: [
      { name: 'Metformin 500mg SR', dose: '1 tab BD (Post-Meal)', stockRemaining: 18, unit: 'Tablets', daysLeft: 9, refillStatus: 'Adequate' },
      { name: 'Amlodipine 5mg', dose: '1 tab OD (Morning)', stockRemaining: 4, unit: 'Tablets', daysLeft: 4, refillStatus: 'Refill Needed ⚠️' },
      { name: 'Amoxicillin 500mg', dose: '1 cap TDS (Post-Meal)', stockRemaining: 15, unit: 'Capsules', daysLeft: 5, refillStatus: 'Active Antibiotic Course' }
    ],
    labResults: [
      { name: 'Total WBC Count', value: '16,400 /uL', ref: '4,000 - 11,000', status: 'critical', alert: 'Marked Leukocytosis' },
      { name: 'Neutrophils', value: '84%', ref: '40 - 75%', status: 'critical', alert: 'Neutrophilia (Left Shift)' },
      { name: 'C-Reactive Protein (CRP)', value: '58.4 mg/L', ref: '< 6.0 mg/L', status: 'critical', alert: 'Severe Acute Inflammation' },
      { name: 'Hemoglobin (Hb)', value: '13.2 g/dL', ref: '13.0 - 17.0', status: 'normal', alert: 'Normal' },
      { name: 'Erythrocyte Sed. Rate (ESR)', value: '42 mm/hr', ref: '< 20', status: 'critical', alert: 'Elevated' },
      { name: 'Serum Creatinine', value: '0.9 mg/dL', ref: '0.7 - 1.3', status: 'normal', alert: 'Normal Renal Function' }
    ]
  },
  {
    id: 'MH-P-10485',
    abhaId: '91-5512-8821-9930',
    name: 'Sunita Shinde',
    age: 42,
    gender: 'Female',
    village: 'Wai, Satara District',
    bloodGroup: 'O+',
    phone: '+91 98451-88310',
    phcCenter: 'Rural Hospital Wai',
    ashaWorker: 'Meena Jadhav (ASHA #108)',
    criticalAlert: 'Chronic Migraine Evaluation with Visual Aura',
    urgency: 'normal',
    vitals: {
      bp: '118/76',
      bpStatus: 'Optimal Normal',
      bpColor: 'text-emerald-600',
      spo2: 98,
      spo2Status: 'Excellent (Room Air)',
      spo2Color: 'text-emerald-600',
      heartRate: 74,
      heartRateStatus: 'Normal Resting',
      heartRateColor: 'text-emerald-600',
      temp: '98.6 °F',
      tempStatus: 'Afebrile (Normal)',
      tempColor: 'text-emerald-600',
      respiratoryRate: '16 /min',
      bloodSugar: '94 mg/dL (Fasting)'
    },
    pastMedicalHistory: {
      chronicDiseases: [
        { name: 'Migraine with Visual Aura', since: 'Diagnosed 2018', status: 'Episodes 2-3 times/month' },
        { name: 'Mild Iron Deficiency Anemia', since: 'Diagnosed 2024', status: 'On oral iron supplements' }
      ],
      allergies: ['Sulfa Drugs (Causes mild cutaneous rash)'],
      surgicalHistory: ['None'],
      familyHistory: ['Mother had Chronic Migraines']
    },
    pastPrescriptions: [
      {
        id: 'RX-2026-0744',
        date: '2026-07-28',
        doctor: 'Dr. Vivek Kulkarni (Wai Rural Hospital)',
        diagnosis: 'Migraine Prophylaxis & Iron Therapy',
        drugs: [
          { name: 'Topiramate 25mg', dose: '1 tablet at bedtime (HS)', timing: 'After dinner', days: '30 days' },
          { name: 'Ferrous Ascorbate + Folic Acid', dose: '1 tablet daily', timing: 'After lunch', days: '60 days' }
        ]
      }
    ],
    currentMedicationsStock: [
      { name: 'Topiramate 25mg', dose: '1 tab HS (Bedtime)', stockRemaining: 22, unit: 'Tablets', daysLeft: 22, refillStatus: 'Adequate' },
      { name: 'Iron + Folic Acid', dose: '1 tab OD (After Lunch)', stockRemaining: 34, unit: 'Tablets', daysLeft: 34, refillStatus: 'Adequate' },
      { name: 'Naproxen 500mg', dose: '1 tab SOS (For acute pain)', stockRemaining: 6, unit: 'Tablets', daysLeft: 6, refillStatus: 'SOS Use Only' }
    ],
    labResults: [
      { name: 'Hemoglobin (Hb)', value: '11.2 g/dL', ref: '12.0 - 15.5', status: 'borderline', alert: 'Mild Anemia (Improving)' },
      { name: 'Serum Ferritin', value: '18 ng/mL', ref: '15 - 150', status: 'borderline', alert: 'Low Normal' },
      { name: 'Serum TSH (Thyroid)', value: '2.4 uIU/mL', ref: '0.4 - 4.5', status: 'normal', alert: 'Euthyroid (Normal)' },
      { name: 'Vitamin B12', value: '310 pg/mL', ref: '200 - 900', status: 'normal', alert: 'Normal' },
      { name: 'Total Cholesterol', value: '168 mg/dL', ref: '< 200', status: 'normal', alert: 'Normal Lipid Profile' },
      { name: 'Random Blood Glucose', value: '94 mg/dL', ref: '70 - 140', status: 'normal', alert: 'Normal' }
    ]
  },
  {
    id: 'MH-P-10490',
    abhaId: '91-7719-2041-3319',
    name: 'Vikram Jadhav',
    age: 61,
    gender: 'Male',
    village: 'Karad, Satara District',
    bloodGroup: 'A+',
    phone: '+91 97123-45678',
    phcCenter: 'Sub-District Hospital Karad',
    ashaWorker: 'Pooja Patil (ASHA #214)',
    criticalAlert: 'L4-L5 Lumbar Disc Bulge with Sciatica',
    urgency: 'urgent',
    vitals: {
      bp: '135/85',
      bpStatus: 'Pre-Hypertension',
      bpColor: 'text-amber-600',
      spo2: 97,
      spo2Status: 'Normal (Room Air)',
      spo2Color: 'text-emerald-600',
      heartRate: 78,
      heartRateStatus: 'Normal',
      heartRateColor: 'text-emerald-600',
      temp: '98.4 °F',
      tempStatus: 'Normal',
      tempColor: 'text-emerald-600',
      respiratoryRate: '18 /min',
      bloodSugar: '156 mg/dL (Pre-diabetic)'
    },
    pastMedicalHistory: {
      chronicDiseases: [
        { name: 'Lumbar Spondylosis L4-L5 Disc Herniation', since: 'Diagnosed 2022', status: 'Radiculopathy Right Leg' },
        { name: 'Mild Osteoarthritis Both Knees', since: 'Diagnosed 2020', status: 'Grade 2 OA' },
        { name: 'Hyperuricemia (Mild Gout)', since: 'Diagnosed 2023', status: 'Diet controlled' }
      ],
      allergies: ['No Known Allergies'],
      surgicalHistory: ['Right Inguinal Hernia Mesh Repair (2016)'],
      familyHistory: ['History of Osteoarthritis in family']
    },
    pastPrescriptions: [
      {
        id: 'RX-2026-0688',
        date: '2026-08-01',
        doctor: 'Dr. Suresh Patil (Ortho Specialist Karad)',
        diagnosis: 'L4-L5 Lumbar Radiculopathy & Knee OA',
        drugs: [
          { name: 'Pregabalin 75mg + Methylcobalamin', dose: '1 cap at night (HS)', timing: 'After dinner', days: '30 days' },
          { name: 'Aceclofenac 100mg + Paracetamol', dose: '1 tab BD', timing: 'After meals (SOS)', days: '10 days' },
          { name: 'Calcium Carbonate + Vit D3', dose: '1 tab daily', timing: 'After breakfast', days: '30 days' }
        ]
      }
    ],
    currentMedicationsStock: [
      { name: 'Pregabalin 75mg + B12', dose: '1 cap HS (Night)', stockRemaining: 12, unit: 'Capsules', daysLeft: 12, refillStatus: 'Adequate' },
      { name: 'Calcium + Vitamin D3', dose: '1 tab OD (Morning)', stockRemaining: 5, unit: 'Tablets', daysLeft: 5, refillStatus: 'Refill Needed ⚠️' },
      { name: 'Aceclofenac 100mg', dose: '1 tab SOS (For pain)', stockRemaining: 8, unit: 'Tablets', daysLeft: 8, refillStatus: 'SOS Stock' }
    ],
    labResults: [
      { name: 'Serum Uric Acid', value: '7.8 mg/dL', ref: '3.5 - 7.2', status: 'critical', alert: 'Elevated (Mild Gout Risk)' },
      { name: 'Vitamin D3 (25-OH)', value: '14.2 ng/mL', ref: '30 - 100', status: 'critical', alert: 'Severe Vitamin D Deficiency' },
      { name: 'Serum Calcium', value: '8.9 mg/dL', ref: '8.5 - 10.5', status: 'normal', alert: 'Normal' },
      { name: 'HbA1c Glycated Hb', value: '6.4%', ref: '< 5.7%', status: 'borderline', alert: 'Pre-Diabetes Range' },
      { name: 'Serum Creatinine', value: '1.0 mg/dL', ref: '0.7 - 1.3', status: 'normal', alert: 'Normal' },
      { name: 'Total WBC Count', value: '7,800 /uL', ref: '4,000 - 11,000', status: 'normal', alert: 'Normal' }
    ]
  },
  {
    id: 'MH-P-10492',
    abhaId: '91-3310-9941-5521',
    name: 'Anil Deshmukh',
    age: 28,
    gender: 'Male',
    village: 'Patan, Satara District',
    bloodGroup: 'AB+',
    phone: '+91 99201-33412',
    phcCenter: 'Patan Rural Emergency Unit',
    ashaWorker: 'Kavita Salunkhe (ASHA #312)',
    criticalAlert: 'Emergency: Distal Radius Fracture (Right Wrist)',
    urgency: 'emergency',
    vitals: {
      bp: '130/82',
      bpStatus: 'Normal Range',
      bpColor: 'text-emerald-600',
      spo2: 99,
      spo2Status: 'Excellent (Room Air)',
      spo2Color: 'text-emerald-600',
      heartRate: 94,
      heartRateStatus: 'Mild Tachycardia (Pain Response)',
      heartRateColor: 'text-amber-600',
      temp: '98.8 °F',
      tempStatus: 'Normal (Afebrile)',
      tempColor: 'text-emerald-600',
      respiratoryRate: '20 /min',
      bloodSugar: '98 mg/dL (Normal)'
    },
    pastMedicalHistory: {
      chronicDiseases: [
        { name: 'None', since: 'N/A', status: 'Healthy Active Young Adult' }
      ],
      allergies: ['No Known Drug Allergies (NKDA)'],
      surgicalHistory: ['None prior. Current: Closed Reduction Right Wrist under Hematoma Block'],
      familyHistory: ['No significant chronic hereditary conditions']
    },
    pastPrescriptions: [
      {
        id: 'RX-2026-0821',
        date: '2026-08-21',
        doctor: 'Dr. R. K. Chavan (Patan Emergency Unit)',
        diagnosis: 'Colles Distal Radius Fracture - Post-Reduction Care',
        drugs: [
          { name: 'Ibuprofen 400mg', dose: '1 tablet twice daily (BD)', timing: 'Strictly after food', days: '5 days' },
          { name: 'Paracetamol 650mg', dose: '1 tablet twice daily (BD)', timing: 'After food', days: '5 days' },
          { name: 'Pantoprazole 40mg', dose: '1 tablet once daily (OD)', timing: 'Empty stomach (Morning)', days: '5 days' },
          { name: 'Vitamin D3 60000 IU', dose: '1 sachet/cap weekly', timing: 'Sundays with milk', days: '8 weeks' }
        ]
      }
    ],
    currentMedicationsStock: [
      { name: 'Ibuprofen 400mg', dose: '1 tab BD (Post-Meal)', stockRemaining: 10, unit: 'Tablets', daysLeft: 5, refillStatus: 'Active Pain Relief' },
      { name: 'Pantoprazole 40mg', dose: '1 tab OD (Empty Stomach)', stockRemaining: 5, unit: 'Tablets', daysLeft: 5, refillStatus: 'Active GI Shield' },
      { name: 'Vitamin D3 60000 IU', dose: '1 cap Weekly (Sun)', stockRemaining: 4, unit: 'Capsules', daysLeft: 28, refillStatus: 'Adequate' }
    ],
    labResults: [
      { name: 'Hemoglobin (Hb)', value: '14.8 g/dL', ref: '13.5 - 17.5', status: 'normal', alert: 'Normal High' },
      { name: 'Blood Group Confirmed', value: 'AB Positive (AB+)', ref: 'N/A', status: 'normal', alert: 'Universal Recipient' },
      { name: 'Bleeding Time (BT)', value: '2.5 mins', ref: '2 - 7 mins', status: 'normal', alert: 'Normal Hemostasis' },
      { name: 'Clotting Time (CT)', value: '5.2 mins', ref: '4 - 10 mins', status: 'normal', alert: 'Normal Coagulation' },
      { name: 'Serum Calcium', value: '9.6 mg/dL', ref: '8.5 - 10.5', status: 'normal', alert: 'Optimal for Bone Union' },
      { name: 'Random Blood Sugar', value: '98 mg/dL', ref: '70 - 140', status: 'normal', alert: 'Normal' }
    ]
  },
  {
    id: 'MH-P-10495',
    abhaId: '91-8841-3392-1049',
    name: 'Meera Kulkarni',
    age: 48,
    gender: 'Female',
    village: 'Mahabaleshwar, Satara',
    bloodGroup: 'O-',
    phone: '+91 98332-90124',
    phcCenter: 'PHC Mahabaleshwar',
    ashaWorker: 'Rekha Pawar (ASHA #089)',
    criticalAlert: 'High Inflammatory Markers & Severe Rheumatoid Flare',
    urgency: 'urgent',
    vitals: {
      bp: '124/80',
      bpStatus: 'Normal Standard',
      bpColor: 'text-emerald-600',
      spo2: 98,
      spo2Status: 'Normal (Room Air)',
      spo2Color: 'text-emerald-600',
      heartRate: 82,
      heartRateStatus: 'Normal Regular',
      heartRateColor: 'text-emerald-600',
      temp: '99.2 °F',
      tempStatus: 'Low-grade Evening Fever',
      tempColor: 'text-amber-600',
      respiratoryRate: '18 /min',
      bloodSugar: '106 mg/dL (Normal)'
    },
    pastMedicalHistory: {
      chronicDiseases: [
        { name: 'Seropositive Rheumatoid Arthritis (RA)', since: 'Diagnosed 2021', status: 'Active flare in wrist/MCP joints' },
        { name: 'Hypothyroidism', since: 'Diagnosed 2017', status: 'On Levothyroxine 50mcg' },
        { name: 'Osteopenia (T-score -1.8)', since: 'Diagnosed 2023', status: 'On Calcium + D3' }
      ],
      allergies: ['Penicillin (Moderate Urticaria)'],
      surgicalHistory: ['None'],
      familyHistory: ['Sister has Autoimmune Thyroiditis']
    },
    pastPrescriptions: [
      {
        id: 'RX-2026-0799',
        date: '2026-07-15',
        doctor: 'Dr. Rekha Deshmukh (Rheumatology Consultant)',
        diagnosis: 'Rheumatoid Arthritis Flare & Hypothyroid Management',
        drugs: [
          { name: 'Methotrexate 10mg', dose: '1 dose weekly on Sunday', timing: 'After dinner', days: '12 weeks' },
          { name: 'Folic Acid 5mg', dose: '1 tablet daily (Except Sunday)', timing: 'Morning', days: '12 weeks' },
          { name: 'Levothyroxine 50mcg', dose: '1 tablet empty stomach', timing: '6:00 AM 30 mins before tea', days: '3 months' }
        ]
      }
    ],
    currentMedicationsStock: [
      { name: 'Levothyroxine 50mcg', dose: '1 tab OD (Empty Stomach)', stockRemaining: 45, unit: 'Tablets', daysLeft: 45, refillStatus: 'Adequate' },
      { name: 'Methotrexate 10mg', dose: '1 dose Weekly (Sunday)', stockRemaining: 3, unit: 'Tablets', daysLeft: 21, refillStatus: 'Adequate' },
      { name: 'Hydroxychloroquine 200mg', dose: '1 tab BD (Post-Meal)', stockRemaining: 6, unit: 'Tablets', daysLeft: 3, refillStatus: 'Refill Needed ⚠️' }
    ],
    labResults: [
      { name: 'Rheumatoid Factor (RF)', value: '64.0 IU/mL', ref: '< 14.0', status: 'critical', alert: 'Strongly Positive' },
      { name: 'Anti-CCP Antibodies', value: '> 200 U/mL', ref: '< 20.0', status: 'critical', alert: 'High Positive (Autoimmune Marker)' },
      { name: 'C-Reactive Protein (CRP)', value: '46.2 mg/L', ref: '< 6.0', status: 'critical', alert: 'Active Synovial Inflammation' },
      { name: 'Erythrocyte Sed. Rate (ESR)', value: '52 mm/hr', ref: '< 20', status: 'critical', alert: 'Markedly Elevated' },
      { name: 'Serum TSH (Thyroid)', value: '3.1 uIU/mL', ref: '0.4 - 4.5', status: 'normal', alert: 'Controlled on Eltroxin' },
      { name: 'Hemoglobin (Hb)', value: '11.4 g/dL', ref: '12.0 - 15.5', status: 'borderline', alert: 'Anemia of Chronic Disease' }
    ]
  }
];

// High-fidelity diagnostic image SVGs
const CHEST_XRAY = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900" width="800" height="900">
  <defs>
    <radialGradient id="lungL" cx="35%" cy="45%" r="35%">
      <stop offset="0%" stop-color="#0a0f1d" />
      <stop offset="70%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </radialGradient>
    <radialGradient id="lungR" cx="65%" cy="48%" r="35%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="50%" stop-color="#64748b" />
      <stop offset="85%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#f8fafc" />
    </radialGradient>
    <radialGradient id="consolidation" cx="70%" cy="65%" r="22%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#e2e8f0" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#94a3b8" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="800" height="900" fill="#030712" />
  <!-- Thoracic rib cage cage outline -->
  <path d="M 400 120 Q 320 220 240 380 Q 200 500 210 680 Q 250 780 400 820 Q 550 780 590 680 Q 600 500 560 380 Q 480 220 400 120 Z" fill="#0f172a" stroke="#475569" stroke-width="2.5" />
  <!-- Left Lung -->
  <path d="M 380 220 C 310 260 250 360 240 480 C 230 600 280 720 370 740 C 375 620 378 400 380 220 Z" fill="url(#lungL)" opacity="0.95" />
  <!-- Right Lung (with consolidation) -->
  <path d="M 420 220 C 490 260 550 360 560 480 C 570 600 520 720 430 740 C 425 620 422 400 420 220 Z" fill="url(#lungR)" opacity="0.95" />
  <!-- Pneumonic Consolidation Overlay -->
  <ellipse cx="490" cy="580" rx="65" ry="50" fill="url(#consolidation)" />
  <!-- Mediastinum & Spine -->
  <rect x="388" y="140" width="24" height="660" fill="#cbd5e1" opacity="0.75" rx="4" />
  <!-- Trachea -->
  <rect x="394" y="160" width="12" height="120" fill="#090d16" opacity="0.9" rx="2" />
  <!-- Cardiac Silhouette -->
  <path d="M 400 420 C 340 460 320 540 340 620 C 360 670 410 690 440 690 C 420 620 410 520 400 420 Z" fill="#e2e8f0" opacity="0.85" />
  <!-- Overlay Annotations -->
  <text x="40" y="60" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="bold">RADVAULT PACS • CHEST PA ERECT</text>
  <text x="40" y="85" fill="#94a3b8" font-family="monospace" font-size="13">ABDM ID: 91-4829-1029-4820 • KV: 120 • EXP: 18ms</text>
  <text x="740" y="60" fill="#ef4444" font-family="monospace" font-size="20" font-weight="bold" text-anchor="end">R</text>
</svg>
`)}`;

const BRAIN_MRI_SLICE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <rect width="600" height="600" fill="#020617" />
  <ellipse cx="300" cy="300" rx="210" ry="245" fill="#1e293b" stroke="#64748b" stroke-width="4" />
  <ellipse cx="300" cy="300" rx="190" ry="225" fill="#0f172a" />
  <!-- Brain Parenchyma -->
  <path d="M 200 200 Q 170 300 200 400 Q 250 480 300 470 Q 350 480 400 400 Q 430 300 400 200 Q 350 130 300 130 Q 250 130 200 200 Z" fill="#334155" opacity="0.85" />
  <!-- Ventricles -->
  <path d="M 285 240 Q 270 290 285 340 Q 295 320 295 280 Z" fill="#090d16" />
  <path d="M 315 240 Q 330 290 315 340 Q 305 320 305 280 Z" fill="#090d16" />
  <!-- Small subcortical hyperintensity spots -->
  <circle cx="230" cy="260" r="5" fill="#f8fafc" opacity="0.9" />
  <circle cx="240" cy="275" r="4" fill="#f8fafc" opacity="0.8" />
  <text x="30" y="40" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold">RADVAULT MRI 1.5T • AXIAL T2 FLAIR</text>
  <text x="30" y="60" fill="#94a3b8" font-family="monospace" font-size="11">FAZEKAS GRADE 1 MICROVASCULAR FOCI</text>
</svg>
`)}`;

const FRACTURE_XRAY = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="600" height="700">
  <rect width="600" height="700" fill="#030712" />
  <!-- Forearm radius & ulna -->
  <rect x="230" y="320" width="55" height="340" fill="#cbd5e1" rx="8" opacity="0.9" />
  <rect x="320" y="300" width="40" height="360" fill="#cbd5e1" rx="6" opacity="0.9" />
  <!-- Distal Radius Displaced Fracture Fragment -->
  <g transform="rotate(8, 260, 280)">
    <rect x="225" y="220" width="65" height="90" fill="#e2e8f0" rx="8" />
    <polygon points="225,280 290,295 290,310 225,295" fill="#030712" />
  </g>
  <!-- Carpal Bones & Metacarpals -->
  <ellipse cx="295" cy="180" rx="65" ry="35" fill="#94a3b8" opacity="0.85" />
  <rect x="240" y="60" width="18" height="90" fill="#cbd5e1" rx="4" />
  <rect x="270" y="40" width="18" height="110" fill="#cbd5e1" rx="4" />
  <rect x="300" y="45" width="18" height="105" fill="#cbd5e1" rx="4" />
  <rect x="330" y="70" width="16" height="80" fill="#cbd5e1" rx="4" />
  <!-- Fracture Line Indicator Red -->
  <line x1="210" y1="305" x2="310" y2="318" stroke="#ef4444" stroke-width="3" stroke-dasharray="5 3" />
  <text x="30" y="50" fill="#ef4444" font-family="monospace" font-size="16" font-weight="bold">EMERGENCY: DISTAL RADIUS FRACTURE</text>
  <text x="30" y="75" fill="#94a3b8" font-family="monospace" font-size="12">COLLES TYPE WITH DORSAL TILT • CARESTREAM DR</text>
</svg>
`)}`;

export const INITIAL_STUDIES = [
  {
    id: 'RV-2026-0801',
    patientId: 'MH-P-10482',
    abhaId: '91-4829-1029-4820',
    patientName: 'Ramesh Patil',
    patientAge: 54,
    patientGender: 'Male',
    studyType: 'X-Ray',
    modality: 'X-Ray',
    bodyRegion: 'Chest / Thorax',
    studyDate: '2026-08-20',
    facility: 'District Hospital Satara Tele-Radiology Hub',
    technicianName: 'Suresh More (Senior Radiographer)',
    referringDoctor: 'Dr. Anita Joshi (PHC Shirwal)',
    urgency: 'urgent',
    thumbnail: CHEST_XRAY,
    fileUrl: CHEST_XRAY,
    fileName: 'Chest_PA_Erect_Ramesh_Patil.dcm',
    fileSize: '18.4 MB (DICOM v3.0)',
    isMultiSlice: false,
    slices: [CHEST_XRAY],
    technicianNotes: 'Patient presented with 5 days high fever, severe productive cough, and chest heaviness. Referred from PHC Shirwal.',
    doctorFindings: 'Dense homogeneous consolidation in the right lower zone with air bronchograms, consistent with Acute Lobar Pneumonia. Left lung field clear. Costophrenic angles sharp. No cardiomegaly.',
    aiAnalysis: {
      detected: true,
      condition: 'Acute Lobar Pneumonia (Consolidation)',
      confidence: 94.2,
      severity: 'Moderate to Severe',
      recommendations: 'Initiate empirical antibiotic regimen (Amoxicillin + Clavulanate) and maintain SpO2 > 94%.'
    }
  },
  {
    id: 'RV-2026-0802',
    patientId: 'MH-P-10485',
    abhaId: '91-5512-8821-9930',
    patientName: 'Sunita Shinde',
    patientAge: 42,
    patientGender: 'Female',
    studyType: 'MRI',
    modality: 'MRI',
    bodyRegion: 'Head / Brain',
    studyDate: '2026-08-19',
    facility: 'Apollo Tele-Diagnostics Regional Hub',
    technicianName: 'Sanjay Deshpande',
    referringDoctor: 'Dr. Vivek Kulkarni (Consultant Neurologist)',
    urgency: 'normal',
    thumbnail: BRAIN_MRI_SLICE,
    fileUrl: BRAIN_MRI_SLICE,
    fileName: 'Brain_MRI_T2_FLAIR_Axial.dcm',
    fileSize: '48.2 MB',
    isMultiSlice: false,
    slices: [BRAIN_MRI_SLICE],
    technicianNotes: 'Chronic refractory migraine with intermittent numbness.',
    doctorFindings: 'Punctate subcortical white matter hyperintensities in right parietal region, consistent with benign microvascular changes. No acute infarct or mass effect.',
    aiAnalysis: {
      detected: true,
      condition: 'Microvascular White Matter Foci (Fazekas Grade 1)',
      confidence: 88.7,
      severity: 'Mild',
      recommendations: 'Control vascular risk factors. Continue routine migraine prophylaxis.'
    }
  },
  {
    id: 'RV-2026-0804',
    patientId: 'MH-P-10492',
    abhaId: '91-3310-9941-5521',
    patientName: 'Anil Deshmukh',
    patientAge: 28,
    patientGender: 'Male',
    studyType: 'X-Ray',
    modality: 'X-Ray',
    bodyRegion: 'Extremities / Bone',
    studyDate: '2026-08-21',
    facility: 'Patan Rural Emergency Hospital',
    technicianName: 'Amit Ghorpade',
    referringDoctor: 'Dr. R. K. Chavan (Emergency Medical Officer)',
    urgency: 'emergency',
    thumbnail: FRACTURE_XRAY,
    fileUrl: FRACTURE_XRAY,
    fileName: 'Wrist_Emergency_AP_Lateral.dcm',
    fileSize: '14.1 MB',
    isMultiSlice: false,
    slices: [FRACTURE_XRAY],
    technicianNotes: 'Two-wheeler road accident. Deformity and severe tenderness over right wrist.',
    doctorFindings: 'Complete transverse extra-articular fracture of distal radius with dorsal displacement (Colles fracture). Ulnar styloid intact.',
    aiAnalysis: {
      detected: true,
      condition: 'Acute Distal Radius Fracture (Displaced)',
      confidence: 98.4,
      severity: 'Severe Emergency',
      recommendations: 'Immediate closed reduction under regional block, backslab splinting, and orthopedic follow-up.'
    }
  },
  {
    id: 'RV-2026-0806',
    patientId: 'MH-P-10490',
    abhaId: '91-7719-2041-3319',
    patientName: 'Vikram Jadhav',
    patientAge: 61,
    patientGender: 'Male',
    studyType: 'X-Ray',
    modality: 'X-Ray',
    bodyRegion: 'Spine / Lumbar',
    studyDate: '2026-08-22',
    facility: 'Sub-District Hospital Karad',
    technicianName: 'Pravin Shinde',
    referringDoctor: 'Dr. Suresh Patil (Ortho Specialist)',
    urgency: 'urgent',
    thumbnail: BRAIN_MRI_SLICE,
    fileUrl: BRAIN_MRI_SLICE,
    fileName: 'Lumbar_Spine_L4_L5_AP_Lat.dcm',
    fileSize: '16.5 MB',
    isMultiSlice: false,
    slices: [BRAIN_MRI_SLICE],
    technicianNotes: 'Severe low back pain radiating down right leg for 3 weeks.',
    doctorFindings: 'Reduced disc space height at L4-L5 and L5-S1 with anterior osteophytes. Neural foraminal narrowing on right side.',
    aiAnalysis: {
      detected: true,
      condition: 'Lumbar Spondylosis with L4-L5 Disc Degeneration',
      confidence: 91.5,
      severity: 'Moderate',
      recommendations: 'Physical therapy, core stabilization exercises, and conservative analgesia with Pregabalin.'
    }
  },
  {
    id: 'RV-2026-0807',
    patientId: 'MH-P-10495',
    abhaId: '91-8841-3392-1049',
    patientName: 'Meera Kulkarni',
    patientAge: 48,
    patientGender: 'Female',
    studyType: 'X-Ray',
    modality: 'X-Ray',
    bodyRegion: 'Both Hands & Wrists (PA)',
    studyDate: '2026-08-22',
    facility: 'PHC Mahabaleshwar',
    technicianName: 'Sunil Pawar',
    referringDoctor: 'Dr. Rekha Deshmukh',
    urgency: 'urgent',
    thumbnail: CHEST_XRAY,
    fileUrl: CHEST_XRAY,
    fileName: 'Hands_Bilateral_PA_RA.dcm',
    fileSize: '12.8 MB',
    isMultiSlice: false,
    slices: [CHEST_XRAY],
    technicianNotes: 'Bilateral symmetrical morning stiffness in MCP and PIP joints lasting > 2 hours.',
    doctorFindings: 'Periarticular osteopenia and mild joint space narrowing in 2nd and 3rd MCP joints bilaterally. No erosions.',
    aiAnalysis: {
      detected: true,
      condition: 'Early Rheumatoid Synovitis Changes',
      confidence: 89.2,
      severity: 'Moderate Flare',
      recommendations: 'Tight DMARD control with Methotrexate + Folic Acid and low dose NSAID bridging.'
    }
  }
];
