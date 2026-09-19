# 🏥 RadVault — Connected Universal Healthcare Platform

> **"One Patient. One Connected Health Journey."**  
> *Consent-driven universal medical imaging, ASHA grassroots triage, patient health vault, and specialist clinical consultation platform for rural and underserved communities.*

---

![RadVault Landing Gateway](docs/images/01_landing_hero.png)

---

## 📌 Executive Summary

**RadVault** is an end-to-end digital healthcare ecosystem designed to eliminate healthcare fragmentation in rural and tier-2/3 regions. It seamlessly bridges rural frontline healthcare workers (**ASHAs / PHCs**), patients & families, hospital receptionists, and urban medical specialists (**Doctors / Radiologists**) around a **Unified Patient & ABHA ID**.

### ❌ The Rural Healthcare Gap:
* **Paper-Based & Lost Records**: Patients carry physical paper files, X-ray films, and CDs across cities, often losing critical diagnostic history.
* **Specialist Shortages**: Rural Primary Healthcare Centers (PHCs) lack full-time radiologists and specialists.
* **Repeated Diagnostic Scans**: Patients undergo duplicate expensive diagnostic scans due to inaccessible prior medical records.
* **Emergency Delay**: First responders at trauma sites lack instant access to blood groups, critical allergies, or medical histories.

### ✅ RadVault's Solution:
Connects every stage of the healthcare continuum into a unified, synchronized web platform powered by **Live Supabase DB** with fallback **Offline Demo Modes**.

---

## 🔄 End-to-End Connected Care Workflow

RadVault coordinates a 4-step care flow that ensures no patient data is lost along their journey from village to multi-specialty hospital:

```
[ Step 1: Village Triage ] ──► [ Step 2: Patient Vault ] ──► [ Step 3: Hospital Intake ] ──► [ Step 4: Specialist Care ]
  • ASHA Worker Visit          • ABHA Health Passport        • Reception Queue            • Tele-Radiology Review
  • Vitals & Registration      • Chronological Timeline      • Triage Categorization      • DICOM Scan Viewer
  • Medicine Distribution      • Emergency QR Passport       • Doctor Assignment          • Digital E-Prescription
```

---

## 🚀 Key Portals & Feature Walkthrough

### 🌐 1. Landing Gateway & Universal Switcher
The entry point into RadVault allows users to select their designated portal based on role, toggle between **Live Supabase Database** and **Demo Mode**, or instantly trigger the **24x7 Emergency SOS Lifeline**.

![RadVault Landing Hub](docs/images/01_landing_hero.png)

* **Multi-Portal Access**: One-click navigation to ASHA Worker, Patient & Family, Hospital Reception, or Specialist Doctor portals.
* **Dual Database Engine**: Live real-time Supabase database connection with seamless fallback to offline demo datasets.
* **24x7 Emergency Lifeline**: Instant public access banner requiring zero authentication for immediate emergency response.

---

### 👩‍⚕️ 2. ASHA Worker Grassroots Portal
Empowers Accredited Social Health Activists (ASHAs) and PHC staff to manage community healthcare directly at the village household level.

![ASHA Worker Portal](docs/images/02_asha_portal.png)

* **Village & Family Roster**: Digital registry of families, households, and demographics in villages like *Vadgaon*.
* **ABHA & Patient Registration**: Quick onboarding of new patients with automatic ABHA ID generation.
* **Routine Visit Logger & Vitals Check**: Field telemetry capture for Blood Pressure, Heart Rate, SpO2, Temperature, and Pregnancy Tracking (e.g., Rekha Bai).
* **Medicine Kit Manager**: Inventory tracking and distribution logging for essential medications (ORST, Paracetamol, Iron Folic Acid).
* **High-Risk Follow-Up Tracker**: Prioritized clinical alert queues for maternal care and chronic disease monitoring.

---

### 👨‍👩‍👧 3. Patient & Family Health Portal
A patient-centered health command dashboard providing families complete ownership over their medical records and health history.

![Patient & Family Hub](docs/images/03_patient_dashboard.png)

* **Family Health Hub**: Multi-member switcher allowing household heads (e.g., *Rahul Patil*) to manage health profiles for spouses and children.
* **ABHA Health Passport**: Digital ABHA card with instant QR code sharing for hospital visits.
* **Vitals Telemetry Monitor**: Interactive 4-card telemetry display tracking historical vitals trends.
* **Chronological Health Timeline**: Unified event feed tracking every clinic visit, diagnostic report, and doctor advice.
* **Government Scheme Finder**: Automated eligibility matcher for *Ayushman Bharat (PM-JAY)* and state healthcare benefits.

---

### 📁 4. Medical Records & Radiology Vault
A high-performance digital repository for diagnostic imaging scans, lab test reports, and prescriptions.

![Medical Records Vault](docs/images/04_medical_records_vault.png)

* **Multi-Modality Filter**: Organize records by *Radiology (X-Ray/CT/MRI)*, *Lab Reports*, or *Prescriptions*.
* **Interactive Image & Scan Viewer**: High-resolution viewer modal equipped with image contrast inversion, zoom, and brightness adjustments.
* **Clinical Diagnostic Findings**: Structured doctor impressions and signed digital reports paired alongside scan visuals.

---

### 🚨 5. 24x7 Emergency SOS & Break-Glass QR Passport
Zero-login emergency triage interface designed for trauma victims and 108 ambulance first-responders.

![Emergency SOS Passport](docs/images/05_emergency_sos_passport.png)

* **Zero-Login Emergency Dispatch**: One-click button to request immediate 108 Ambulance dispatch and notify local PHCs.
* **Break-Glass Emergency Profile**: Reveals vital health info—blood group, critical allergies (e.g., *Penicillin*), chronic conditions, and emergency contacts.
* **Scannable Emergency QR Code**: On-screen QR code allows paramedics to scan and access critical health data on mobile devices.

---

### 🏥 6. Hospital Reception & Intake Desk
Streamlines patient arrival, triage queue management, and specialty clinic routing at PHCs and District Hospitals.

![Hospital Reception Desk](docs/images/06_hospital_reception.png)

* **ABHA Quick Scan Intake**: Rapid patient check-in via ABHA QR code scanning or search.
* **Triage Categorization**: Severity tagging (*Emergency*, *Urgent*, *Routine*) for optimal patient queue management.
* **Specialist Doctor Assignment**: Direct assignment of queued patients to attending doctors and radiology departments.

---

### 🩺 7. Doctor & Specialist Clinical Workspace
A comprehensive diagnostic workspace built for medical specialists, radiologists, and consulting physicians.

![Doctor Workspace](docs/images/07_doctor_workspace.png)

* **Clinical Case Workspace**: Multi-pane dashboard displaying patient history, prior visit timelines, and current telemetry.
* **Tele-Radiology Scan Review**: Advanced imaging review station supporting full-resolution scan inspection.
* **Digital Prescription & Note Writer**: Structured diagnosis entry, drug prescription generator, and referral dispatch.
* **Patient Journey Integration**: Direct navigation into the full family health history for holistic clinical decision-making.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 19 (`react@^19.2.8`), Vite 8 (`vite@^8.2.2`) |
| **Styling & Theme** | Tailwind CSS v4 (`@tailwindcss/vite@^4.3.3`), Vanilla CSS variables |
| **Icons & Visuals** | Lucide React (`lucide-react@^1.33.0`), Custom healthcare illustrations |
| **Backend & Database**| Supabase PostgreSQL (Auth, Storage, Row Level Security) |
| **Data Synchronization** | Dual Engine: Real-time Supabase Client + Offline Mock Fallback Provider |
| **Code Quality** | Oxlint (`oxlint@^1.75.0`), ES6 Modules |

---

## 🗄️ Supabase Database Architecture

RadVault's data structure is centered around the **Unified Patient & ABHA ID** (`MH-P-10482` / `64-8837-7348-6384`):

```
                       ┌────────────────────────┐
                       │     families table     │
                       └───────────┬────────────┘
                                   │ 1:N
                       ┌───────────▼────────────┐
                       │     patients table     │
                       │ (unified_id / abha_id) │
                       └───────────┬────────────┘
                                   │ 1:N
    ┌────────────────┬─────────────┼─────────────┬────────────────┐
    ▼                ▼             ▼             ▼                ▼
┌───────┐      ┌──────────┐  ┌──────────┐  ┌───────────┐   ┌──────────────┐
│vitals │      │  health_ │  │referrals │  │appoint-   │   │ asha_visit_  │
│       │      │  records │  │          │  │ments      │   │    logs      │
└───────┘      └──────────┘  └──────────┘  └───────────┘   └──────────────┘
```

---

## 💻 Environment & Local Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0 or higher)
- **npm** (v9.0 or higher)

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Installation & Run
```bash
# Clone the repository
git clone https://github.com/sarthakkharade903-tech/RadVault.git

# Navigate to project directory
cd RadVault

# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 📂 Project Directory Structure

```
RadVault/
├── docs/
│   └── images/                                # Screenshot assets for GitHub documentation
│       ├── 01_landing_hero.png
│       ├── 02_asha_portal.png
│       ├── 03_patient_dashboard.png
│       ├── 04_medical_records_vault.png
│       ├── 05_emergency_sos_passport.png
│       ├── 06_hospital_reception.png
│       └── 07_doctor_workspace.png
│
├── src/
│   ├── main.jsx                               # Root mounting & global providers
│   ├── App.jsx                                # Main Shell, Landing Gateway, Portal Navigation
│   ├── index.css                              # Tailwind CSS v4 & theme definitions
│   │
│   ├── components/
│   │   ├── ASHA/                              # ASHA Worker Portal components
│   │   │   ├── ASHAPortal.jsx
│   │   │   ├── ASHAHome.jsx
│   │   │   ├── ASHAVisitLogger.jsx
│   │   │   ├── MyVillage.jsx
│   │   │   ├── AddFamilyForm.jsx
│   │   │   └── MedicineKitManager.jsx
│   │   │
│   │   ├── Patient/                           # Patient & Family Hub components
│   │   │   ├── FamilyDashboard.jsx
│   │   │   ├── CareHub.jsx
│   │   │   ├── AbhaModal.jsx
│   │   │   ├── EmergencySOSModal.jsx
│   │   │   ├── EmergencyHealthPassportModal.jsx
│   │   │   └── GovernmentSchemes.jsx
│   │   │
│   │   ├── MedicalRecords/                    # Diagnostic imaging & report vault
│   │   │   ├── MedicalRecordsList.jsx
│   │   │   ├── RecordViewerModal.jsx
│   │   │   └── DocumentPreview.jsx
│   │   │
│   │   ├── HealthTimeline/                    # Chronological care history
│   │   │   └── HealthTimeline.jsx
│   │   │
│   │   └── workspaces/                        # Clinical & Hospital Reception Workspaces
│   │       ├── HospitalStaffWorkspace.jsx
│   │       └── DoctorWorkspace.jsx
│   │
│   ├── services/
│   │   ├── supabase.js                        # Supabase client singleton & auth helper
│   │   └── ashaService.js                     # ASHA data service routines
│   │
│   └── data/
│       └── mockPatientData.js                 # Offline fallback demo data
│
├── public/                                    # Public assets (icons, medical scan samples)
├── package.json                               # Dependencies & build scripts
└── vite.config.js                             # Vite configuration with Tailwind CSS plugin
```

---

## 📜 License & Acknowledgments

Built for connected health continuity, rural accessibility, and hackathon presentation.  
Developed by **Team RadVault**.
