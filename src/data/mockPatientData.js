/**
 * RadVault Mock Patient Data
 * Structured for Patient Profile, Health Timeline, and Medical Records Vault.
 * Ready for straightforward Supabase / FastAPI adapter binding.
 */

export const mockPatient = {
  id: "PAT-89210",
  abhaId: "91-4521-8890-1204",
  fullName: "Rohan Verma",
  preferredName: "Rohan",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  age: 38,
  gender: "Male",
  dob: "1988-04-14",
  bloodGroup: "O+",
  phone: "+91 98765 43210",
  email: "rohan.verma@example.com",
  address: "Flat 402, Green Meadows, Baner Road, Pune, Maharashtra - 411045",
  maritalStatus: "Married",
  occupation: "Software Architect",
  emergencyContact: {
    name: "Pooja Verma",
    relationship: "Spouse",
    phone: "+91 98765 43211",
    alternatePhone: "+91 20 2589 1234"
  },
  insurance: {
    provider: "Star Health Premier Care",
    policyNumber: "SH-2025-99412-B",
    validTill: "2027-03-31",
    status: "Active"
  },
  consentStatus: "Granted (Standard Access)",
  lastUpdated: "2026-08-20T10:30:00Z"
};

export const mockVitals = [
  {
    id: "vit-1",
    name: "Blood Pressure",
    value: "122/80",
    unit: "mmHg",
    status: "normal",
    statusLabel: "Optimal",
    icon: "heart",
    timestamp: "2026-08-18 09:30 AM",
    trend: "stable",
    normalRange: "90/60 - 120/80"
  },
  {
    id: "vit-2",
    name: "Heart Rate",
    value: "74",
    unit: "bpm",
    status: "normal",
    statusLabel: "Normal",
    icon: "pulse",
    timestamp: "2026-08-18 09:30 AM",
    trend: "stable",
    normalRange: "60 - 100"
  },
  {
    id: "vit-3",
    name: "SpO2 (Oxygen)",
    value: "98",
    unit: "%",
    status: "normal",
    statusLabel: "Excellent",
    icon: "oxygen",
    timestamp: "2026-08-18 09:30 AM",
    trend: "up",
    normalRange: "95 - 100"
  },
  {
    id: "vit-4",
    name: "Fasting Blood Sugar",
    value: "108",
    unit: "mg/dL",
    status: "warning",
    statusLabel: "Pre-diabetic",
    icon: "sugar",
    timestamp: "2026-08-18 08:00 AM",
    trend: "attention",
    normalRange: "70 - 99"
  },
  {
    id: "vit-5",
    name: "Body Temperature",
    value: "98.4",
    unit: "Â°F",
    status: "normal",
    statusLabel: "Normal",
    icon: "temp",
    timestamp: "2026-08-18 09:30 AM",
    trend: "stable",
    normalRange: "97.8 - 99.0"
  },
  {
    id: "vit-6",
    name: "Body Mass Index",
    value: "23.6",
    unit: "kg/mÂ²",
    status: "normal",
    statusLabel: "Healthy (71 kg, 173 cm)",
    icon: "bmi",
    timestamp: "2026-08-18 09:30 AM",
    trend: "stable",
    normalRange: "18.5 - 24.9"
  }
];

export const mockAllergies = [
  {
    id: "alg-1",
    substance: "Penicillin",
    type: "Medication",
    severity: "severe",
    reaction: "Anaphylaxis / Hives",
    diagnosed: "2018-05-12"
  },
  {
    id: "alg-2",
    substance: "Iodinated Radiographic Contrast",
    type: "Radiology Agent",
    severity: "moderate",
    reaction: "Mild erythema & nausea (Pre-medication required)",
    diagnosed: "2022-11-04"
  },
  {
    id: "alg-3",
    substance: "Peanuts",
    type: "Food",
    severity: "mild",
    reaction: "Contact dermatitis / itchy throat",
    diagnosed: "2012-03-20"
  }
];

export const mockConditions = [
  {
    id: "cnd-1",
    condition: "Hypertension (Stage 1)",
    category: "Cardiovascular",
    status: "Under Control",
    diagnosedDate: "2023-02-15",
    diagnosedBy: "Dr. Arvind Kulkarni (Cardiology)",
    notes: "Managed with Telmisartan 40mg daily and regular morning walks."
  },
  {
    id: "cnd-2",
    condition: "Lumbar Disc Bulge (L4-L5)",
    category: "Orthopedic",
    status: "Active / Intermittent",
    diagnosedDate: "2025-06-10",
    diagnosedBy: "Dr. Meera Nambiar (Orthopedics)",
    notes: "Mild right sciatica. Physical therapy advised, avoiding heavy lifting."
  }
];

export const mockMedications = [
  {
    id: "med-1",
    name: "Telmisartan",
    dosage: "40 mg",
    frequency: "Once daily (Morning, after food)",
    indication: "Hypertension",
    prescribedBy: "Dr. Arvind Kulkarni",
    startDate: "2023-02-15",
    refillsLeft: 3
  },
  {
    id: "med-2",
    name: "Metformin HCl (Extended Release)",
    dosage: "500 mg",
    frequency: "Once daily (Night, after dinner)",
    indication: "Glycemic Control / Pre-diabetes",
    prescribedBy: "Dr. S. Mehta (Endocrinologist)",
    startDate: "2026-08-18",
    refillsLeft: 5
  },
  {
    id: "med-3",
    name: "Vitamin D3 (Cholecalciferol)",
    dosage: "60,000 IU",
    frequency: "Once weekly for 8 weeks",
    indication: "Vitamin D Deficiency",
    prescribedBy: "Dr. Meera Nambiar",
    startDate: "2026-07-01",
    refillsLeft: 2
  }
];

export const mockTimelineEvents = [
  {
    id: "tle-1",
    date: "2026-08-18",
    time: "10:15 AM",
    title: "Comprehensive Metabolic Panel & Lipid Profile",
    category: "labs",
    categoryLabel: "Laboratory Report",
    facility: "Metropolis Diagnostics, Aundh",
    doctor: "Dr. Smita Patil, MD Pathology",
    summary: "Fasting glucose mildly elevated (108 mg/dL). HbA1c at 5.8%. Lipid parameters within normal baseline.",
    details: "Serum Creatinine: 0.9 mg/dL, eGFR: >90, Total Cholesterol: 182 mg/dL, HDL: 46 mg/dL, LDL: 112 mg/dL. Recommended dietary lifestyle modifications.",
    status: "Completed",
    isImportant: true,
    recordId: "rec-lab-2026"
  },
  {
    id: "tle-2",
    date: "2026-07-22",
    time: "03:45 PM",
    title: "Lumbar Spine MRI (1.5T with Multi-planar Sequences)",
    category: "radiology",
    categoryLabel: "Radiology Scan",
    facility: "RadVault Imaging & AI Hub, Baner",
    doctor: "Dr. Siddharth Deshmukh, Radiologist",
    summary: "L4-L5 posterior disc protrusion causing mild anterior thecal sac indentation. No critical nerve root impingement.",
    details: "Sagittal and axial T1 and T2 weighted sequences evaluated. Desiccation of L4-L5 disc noted. Conus medullaris terminates at normal L1 level. Facet joints are intact without significant hypertrophy.",
    status: "Verified",
    isImportant: true,
    recordId: "rec-mri-lumbar"
  },
  {
    id: "tle-3",
    date: "2026-07-20",
    time: "11:00 AM",
    title: "Orthopedic Consultation â€” Lower Back & Radicular Pain",
    category: "consultation",
    categoryLabel: "Clinical Consultation",
    facility: "Sahyadri Super Specialty Hospital",
    doctor: "Dr. Meera Nambiar, MS Ortho",
    summary: "Patient presented with 3-week history of dull aching lower back pain radiating to right lateral thigh.",
    details: "SLR test positive at 65 degrees on right side. Deep tendon reflexes intact. Ordered MRI Lumbar spine and prescribed conservative analgesics with ergonomic posture adjustments.",
    status: "Completed",
    isImportant: false,
    recordId: null
  },
  {
    id: "tle-4",
    date: "2026-03-14",
    time: "09:00 AM",
    title: "Digital Chest Radiograph (PA View)",
    category: "radiology",
    categoryLabel: "Radiology Scan",
    facility: "Ruby Hall Clinic Diagnostic Center",
    doctor: "Dr. Rajesh Khandelwal, Radiologist",
    summary: "Clear lung fields bilaterally. Normal cardiothoracic ratio. No focal consolidation or pleural effusion.",
    details: "Trachea midline. Costophrenic and cardiophrenic angles clear. Bony thoracic cage and soft tissues unremarkable. Examined as part of annual preventive executive screening.",
    status: "Verified",
    isImportant: false,
    recordId: "rec-xray-chest"
  },
  {
    id: "tle-5",
    date: "2025-11-05",
    time: "04:30 PM",
    title: "Cardiology Annual Review & 2D-Echocardiogram",
    category: "consultation",
    categoryLabel: "Cardiology Follow-up",
    facility: "Apollo Clinic, Pune",
    doctor: "Dr. Arvind Kulkarni, DM Cardiology",
    summary: "BP well-controlled (122/80). LVEF 62%. Normal left ventricular systolic and diastolic function.",
    details: "No regional wall motion abnormality. Valves appear morphologically normal with no significant regurgitation or stenosis. Continue Telmisartan 40mg once daily.",
    status: "Completed",
    isImportant: false,
    recordId: "rec-echo-2025"
  },
  {
    id: "tle-6",
    date: "2025-06-12",
    time: "02:00 PM",
    title: "Abdominal & Pelvic Ultrasound",
    category: "radiology",
    categoryLabel: "Ultrasound Scan",
    facility: "RadVault Imaging & Diagnostic Center",
    doctor: "Dr. Siddharth Deshmukh, Radiologist",
    summary: "Grade 1 Fatty Liver (hepatic steatosis). Gallbladder, pancreas, spleen, and kidneys within normal limits.",
    details: "Liver is mildly enlarged (15.2 cm) with increased parenchymal echogenicity. No intrahepatic biliary dilatation. Both kidneys demonstrate normal corticomedullary differentiation without calculi.",
    status: "Verified",
    isImportant: false,
    recordId: "rec-usg-abdomen"
  }
];

export const mockMedicalRecords = [
  {
    id: "rec-mri-lumbar",
    title: "MRI Lumbar Spine (T1/T2 Axial & Sagittal)",
    modality: "MRI",
    bodyRegion: "Spine / Lumbar",
    date: "2026-07-22",
    time: "03:45 PM",
    facility: "RadVault Imaging & AI Hub",
    doctor: "Dr. Siddharth Deshmukh",
    radiologistLicense: "MCI-MH-44912",
    fileType: "DICOM Series (48 slices)",
    fileSize: "142.5 MB",
    status: "Verified",
    statusColor: "emerald",
    aiTriageRisk: "Low - Mild Protrusion",
    thumbnailType: "mri-spine",
    previewUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80",
    patientFriendlySummary: "This MRI was done to check for the cause of your lower back pain. The scan found a small disc bulge at the L4â€“L5 level of your lower back. The report says this bulge is not causing significant narrowing of the spinal canal. The other discs in your spine appear normal.",
    report: {
      clinicalIndication: "Subacute lower back pain radiating to right gluteal region. Rule out lumbar disc herniation.",
      technique: "Multiplanar T1, T2, and STIR weighted MRI sequences performed on 1.5 Tesla Siemens Magnetom scanner.",
      findings: [
        "L1-L2, L2-L3, and L3-L4 disc heights and hydration signals are preserved with no posterior bulging.",
        "L4-L5 shows mild disc desiccation with a 3.2 mm broad-based posterior-central disc protrusion. Mild effacement of the anterior epidural fat without significant neural foraminal narrowing.",
        "L5-S1 disc is intact with normal signal intensity.",
        "Spinal cord terminates at normal L1 level with normal signal.",
        "Facet joints and ligamenta flava are unremarkable."
      ],
      impression: "Mild L4-L5 posterior disc protrusion causing minimal thecal indentation. No canal stenosis or severe nerve root compression. Conservative clinical correlation advised.",
      verifiedBy: "Dr. Siddharth Deshmukh, MD Radio-Diagnosis"
    }
  },
  {
    id: "rec-xray-chest",
    title: "Digital Chest Radiograph (PA View)",
    modality: "X-Ray",
    bodyRegion: "Thorax / Chest",
    date: "2026-03-14",
    time: "09:00 AM",
    facility: "Ruby Hall Clinic Diagnostic Center",
    doctor: "Dr. Rajesh Khandelwal",
    radiologistLicense: "MCI-MH-22310",
    fileType: "High-Res DICOM / PNG",
    fileSize: "18.4 MB",
    status: "Verified",
    statusColor: "emerald",
    aiTriageRisk: "Normal",
    thumbnailType: "xray-chest",
    previewUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80",
    patientFriendlySummary: "This chest X-ray was taken as part of a routine wellness check. The report describes the lungs as clear, with no signs of infection or fluid. The heart shadow appears to be a normal size. The bones of the chest and the windpipe (trachea) appear normal.",
    report: {
      clinicalIndication: "Executive annual wellness medical examination.",
      technique: "Standard Posteroanterior (PA) digital chest radiograph taken at full inspiration.",
      findings: [
        "Trachea is centrally located in the midline.",
        "Lungs are clear with no focal alveolar consolidation, mass lesion, or interstitial opacity.",
        "Cardiothoracic ratio is normal (< 0.50). Great vessels and mediastinum are within normal configuration.",
        "Both costophrenic and cardiophrenic sulci are sharp.",
        "Visualized osseous structures of the rib cage and shoulder girdles are intact."
      ],
      impression: "Normal digital chest radiograph. No acute cardiopulmonary abnormality detected.",
      verifiedBy: "Dr. Rajesh Khandelwal, DMRD"
    }
  },
  {
    id: "rec-usg-abdomen",
    title: "Ultrasound Whole Abdomen & Pelvis",
    modality: "Ultrasound",
    bodyRegion: "Abdomen & Pelvis",
    date: "2025-06-12",
    time: "02:00 PM",
    facility: "RadVault Imaging & Diagnostic Center",
    doctor: "Dr. Siddharth Deshmukh",
    radiologistLicense: "MCI-MH-44912",
    fileType: "USG Cine Loop & Report PDF",
    fileSize: "26.1 MB",
    status: "Verified",
    statusColor: "emerald",
    aiTriageRisk: "Mild Steatosis",
    thumbnailType: "usg-abdomen",
    previewUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
    patientFriendlySummary: "This ultrasound was done as a routine abdominal checkup. The report describes Grade 1 fatty change (fatty liver) in the liver â€” this is described as mild in the report. The gallbladder, bile ducts, pancreas, spleen, and kidneys all appear normal in this scan.",
    report: {
      clinicalIndication: "Routine abdominal checkup following elevated triglycerides.",
      technique: "Real-time B-mode and color Doppler ultrasonography performed with 3.5 MHz curvilinear transducer.",
      findings: [
        "Liver measures 15.1 cm, showing diffuse increase in parenchymal echogenicity with mild posterior beam attenuation consistent with Grade-I fatty infiltration.",
        "Gallbladder is physiological in distension, lumen is echo-free, wall thickness normal (2.2 mm).",
        "Common Bile Duct is non-dilated (4.1 mm).",
        "Pancreas is normal in size and echotexture.",
        "Spleen is normal in size (9.8 cm).",
        "Right kidney measures 10.4 cm, Left kidney measures 10.8 cm. Normal cortical thickness and no hydronephrosis.",
        "Urinary bladder wall is smooth."
      ],
      impression: "Grade 1 hepatic steatosis (Fatty Liver). No other significant sonographic abnormalities.",
      verifiedBy: "Dr. Siddharth Deshmukh, MD Radio-Diagnosis"
    }
  },
  {
    id: "rec-echo-2025",
    title: "2D Transthoracic Echocardiogram & Doppler",
    modality: "Cardiology",
    bodyRegion: "Cardiovascular",
    date: "2025-11-05",
    time: "04:30 PM",
    facility: "Apollo Clinic, Cardiology Suite",
    doctor: "Dr. Arvind Kulkarni",
    radiologistLicense: "MCI-MH-11880",
    fileType: "DICOM Multi-frame + PDF Report",
    fileSize: "68.2 MB",
    status: "Verified",
    statusColor: "emerald",
    aiTriageRisk: "Normal",
    thumbnailType: "echo",
    previewUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80",
    patientFriendlySummary: "This echocardiogram (heart ultrasound) was done to monitor your blood pressure condition. The report says the heart is pumping well. The pumping strength (ejection fraction) is 62%, which is within the normal range as per the report. The heart valves appear normal and no fluid was found around the heart.",
    report: {
      clinicalIndication: "Hypertension surveillance evaluation.",
      technique: "2D and M-mode echocardiography with color, pulsed, and continuous wave Doppler.",
      findings: [
        "Left ventricle is normal in internal dimensions with normal wall thickness (IVSd: 10 mm, LVPWd: 9 mm).",
        "Global LV systolic function is preserved with ejection fraction of ~62%.",
        "No regional wall motion abnormalities noted at rest.",
        "Mitral and Aortic valves are structurally normal with laminar flow.",
        "No pericardial effusion or intracardiac thrombus."
      ],
      impression: "Normal 2D-Echocardiogram. Preserved LV systolic function (LVEF 62%). Good hypertensive control.",
      verifiedBy: "Dr. Arvind Kulkarni, DM Cardiology"
    }
  },
  {
    id: "rec-lab-2026",
    title: "Comprehensive Metabolic & Lipid Diagnostic Panel",
    modality: "Lab Report",
    bodyRegion: "Pathology / Blood",
    date: "2026-08-18",
    time: "10:15 AM",
    facility: "Metropolis Diagnostics, Aundh",
    doctor: "Dr. Smita Patil",
    radiologistLicense: "MCI-MH-33019",
    fileType: "Digital Pathology Report (PDF)",
    fileSize: "2.4 MB",
    status: "Verified",
    statusColor: "emerald",
    aiTriageRisk: "Pre-Diabetic Alert",
    thumbnailType: "lab-report",
    previewUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80",
    patientFriendlySummary: "This blood test was done as part of a routine annual health checkup. The report shows that the fasting blood sugar (108 mg/dL) and HbA1c (5.8%) are slightly above the reference range shown in the report. The report describes the kidney values, cholesterol, and other lipid values as largely within the reference ranges shown.",
    report: {
      clinicalIndication: "Annual executive blood profile and routine diabetic screening.",
      technique: "Automated chemiluminescence analyzer & enzymatic photometry.",
      findings: [
        "Fasting Plasma Glucose: 108 mg/dL (Reference: 70 - 99 mg/dL) [HIGH]",
        "HbA1c (Glycated Hemoglobin): 5.8% (Reference: < 5.7%) [PRE-DIABETIC]",
        "Serum Creatinine: 0.92 mg/dL (Reference: 0.7 - 1.2 mg/dL) [NORMAL]",
        "Estimated GFR (CKD-EPI): > 90 mL/min/1.73mÂ² [NORMAL]",
        "Total Cholesterol: 182 mg/dL (Reference: < 200 mg/dL) [DESIRABLE]",
        "Triglycerides: 148 mg/dL (Reference: < 150 mg/dL) [NORMAL]",
        "HDL Cholesterol: 46 mg/dL (Reference: > 40 mg/dL) [NORMAL]",
        "LDL Cholesterol: 106.4 mg/dL (Reference: < 100 mg/dL) [BORDERLINE]"
      ],
      impression: "Impaired Fasting Glucose and borderline HbA1c suggestive of early pre-diabetes. Serum renal and lipid parameters are largely preserved.",
      verifiedBy: "Dr. Smita Patil, MD Pathology"
    }
  },
  {
    id: "rec-ct-brain-2024",
    title: "Non-Contrast Brain CT (Head Trauma Rule-Out)",
    modality: "CT Scan",
    bodyRegion: "Head / Neuro",
    date: "2024-10-10",
    time: "08:20 PM",
    facility: "Emergency Radiology Dept, Jupiter Hospital",
    doctor: "Dr. Siddharth Deshmukh",
    radiologistLicense: "MCI-MH-44912",
    fileType: "Volumetric CT DICOM (160 slices)",
    fileSize: "210.8 MB",
    status: "Verified",
    statusColor: "emerald",
    aiTriageRisk: "Normal / Cleared",
    thumbnailType: "ct-brain",
    previewUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80",
    patientFriendlySummary: "This CT scan was done after a minor head bump to check for any injury inside the skull. The report says no bleeding, bruising, or fractures were found inside or on the skull. The brain structures appear normal in this scan.",
    report: {
      clinicalIndication: "Minor head bump during recreational football; transient dizziness.",
      technique: "Continuous 5mm axial CT sections acquired from skull base to vertex without IV contrast.",
      findings: [
        "No acute intra-axial or extra-axial hemorrhage, hematoma, or contusion seen.",
        "Ventricular system, basal cisterns, and cerebral sulci are normal in size and symmetrical.",
        "Midline structures are centrally situated without shift.",
        "No calvarial or skull base fractures demonstrated on bone window algorithms."
      ],
      impression: "Normal non-contrast head CT scan. No traumatic intracranial lesion or fracture.",
      verifiedBy: "Dr. Siddharth Deshmukh, MD Radio-Diagnosis"
    }
  }
];
