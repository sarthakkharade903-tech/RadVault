# 🏥 RadVault — Patient & Frontline Healthcare Portal

> **"One patient. One connected health journey."**  
> *Consent-Driven Universal Medical Imaging & Emergency Health Record Exchange for Rural and Underserved Communities.*

---

## 📌 Executive Summary

**RadVault** is a unified digital health continuity and radiology vault platform built for hackathons and production healthcare scenarios. It bridges the gap between rural frontline healthcare workers (ASHAs / PHCs), patients, and urban medical specialists through a **Unified Patient ID** (e.g. `MH-P-10482`).

### The Problem in Rural Healthcare:
Rural and underserved patients face long travel distances, severe specialist shortages, fragmented physical records (paper reports, films, CDs), repeated diagnostic tests, delayed hospital referrals, poor follow-up, and absence of critical data during emergency triage.

### RadVault's Solution:
Connects every stage of the patient's care lifecycle:
$$\text{Patient / ASHA} \longrightarrow \text{Triage \& Vitals} \longrightarrow \text{Unified Patient ID} \longrightarrow \text{Referral} \longrightarrow \text{Specialist Consultation} \longrightarrow \text{Imaging Vault} \longrightarrow \text{Follow-up}$$

---

## 👥 Team Structure & Scope

The project consists of 6 developers divided into two specialized teams:

```
                          ┌────────────────────────┐
                          │   RADVAULT PLATFORM    │
                          └───────────┬────────────┘
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     TEAM A: PATIENT PORTAL    │             │   TEAM B: CLINICAL PORTAL     │
│   (Frontline & Patient Web)   │             │ (Doctor & Diagnostics Engine) │
└──────────────┬────────────────┘             └───────────────────────────────┘
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
Member 1   Member 2    Member 3
 (YOU)     (Sujay)    (Teammate)
```

| Member | Assigned Ownership | Status |
| :--- | :--- | :--- |
| **Member 1 (You)** | • **Patient Home Dashboard** (`PatientHome.jsx`)<br>• **Frontend Architecture & Navigation Shell** (`App.jsx`)<br>• **Supabase Integration & Config** (`supabase.js`)<br>• **Database Schema & Row Level Security (RLS)** (`schema.sql`)<br>• **Global Patient State Context** (`PatientContext.jsx`)<br>• **Shared UI System & Color Theory** (Teal / Maroon / Saffron)<br>• **Module Integration Coordinator** | ✅ **Completed & Integrated** |
| **Member 2 (Sujay)** | • **Patient Profile & Demographics** (`PatientProfile/`)<br>• **Health Timeline & Chronology** (`HealthTimeline/`)<br>• **Medical Records & Vault Viewer** (`MedicalRecords/`) | ✅ **Merged into `samir5243d`** |
| **Member 3** | • **Specialist Referrals Management**<br>• **Doctor Appointments & Care Scheduling**<br>• **Emergency Break-Glass QR Code Generator & Audit Log** | 🔄 **Structured Placeholders Ready** |
| **Team B** | • **Doctor / Clinical Diagnostic Workspace** (Radiology AI, DICOM uploads) | 🔒 **Isolated Portal** |

---

## 🛠️ Tech Stack & Dependencies

- **Frontend Framework**: React 19 (`react@^19.2.8`, `react-dom@^19.2.8`)
- **Bundler & Dev Server**: Vite 8 (`vite@^8.2.2`)
- **Styling Engine**: Tailwind CSS v4 (`@tailwindcss/vite@^4.3.3`, `tailwindcss@^4.3.3`)
- **Iconography**: Lucide React (`lucide-react@^1.33.0`)
- **Backend / Database**: Supabase (PostgreSQL 15+, Auth, Storage, Row Level Security)
- **Client Library**: `@supabase/supabase-js@^2.112.3`
- **Linter**: Oxlint (`oxlint@^1.75.0`)

---

## 🎨 Cultural Color Palette & Design System

Designed specifically for **Indian healthcare users**, senior citizens, and frontline workers. The theme uses a clean **light background (`#F9F9F9`)** with high-contrast text ($\ge 16\text{px}$) and emotionally resonant healthcare colors:

| Color Role | Hex Code | Psychological & Clinical Meaning | Where It Is Used |
| :--- | :--- | :--- | :--- |
| **Background** | `#F9F9F9` | Clean, calm, accessible for senior eyes | Page canvas, main background |
| **Card Surface** | `#FFFFFF` | Clear elevation & sharp focus | All cards, modals, dropdowns |
| **Text Primary** | `#212121` | High-contrast dark charcoal (WCAG AA) | Headings, telemetry numbers, body copy |
| **Text Secondary** | `#555555` | Soft readability for metadata | Subheadings, dates, hospital labels |
| **Teal (Primary)** | `#008080` | Trust, medical calm, continuity | Brand headers, vitals outlines, nav icons |
| **Maroon (Secondary)** | `#800000` | Authority, clinical seriousness | Patient name title, doctor names, active tab |
| **Saffron (Accent)** | `#FF9933` | Warmth, energy, optimism | Greeting underline, action CTAs, emergency badges |
| **Success Green** | `#2E7D32` | Healing, confirmed care | Confirmed appointments, "All Caught Up" banner |
| **Warning Amber** | `#FFC107` | Caution, pending review | Pending specialist referrals, attention alerts |
| **Error Red** | `#D32F2F` | Critical emergency triage | Blood group, critical allergies, emergency cross |

### 🇮🇳 Culturally Familiar Icons:
- 🏠 **Home**: Traditional sloping-roof Indian house icon (`Home`).
- 📖 **Records**: Clinic register / medical notebook (`BookOpen`).
- 🤝 **Referrals**: Doctor–patient connection handshake (`Handshake`).
- 🛡️➕ **Emergency ID**: Saffron shield with bold red cross (`Shield` + `Plus`).
- 👤 **Profile**: Circular avatar silhouette (`UserCircle2`).

---

## 🗄️ Supabase Database Architecture

Everything is anchored around the **Unified Patient ID** (`MH-P-10482`).

```
                              ┌──────────────────┐
                              │  auth.users /    │
                              │     profiles     │
                              └────────┬─────────┘
                                       │ 1:1
                              ┌────────▼─────────┐
                              │     patients     │
                              │  (unified_id)    │
                              └────────┬─────────┘
                                       │ 1:N
         ┌───────────────┬─────────────┼───────────────┬───────────────┐
         ▼               ▼             ▼               ▼               ▼
┌────────────────┐┌────────────┐┌─────────────┐┌───────────────┐┌──────────────┐
│ health_records ││   vitals   ││ referrals   ││ appointments  ││medical_files │
└────────────────┘└────────────┘└─────────────┘└───────────────┘└──────────────┘
```

### Tables Implemented in Member 1 Scope:
1. **`patients`**: `id` (UUID PK), `unified_id` (Unique text), `full_name`, `age`, `gender`, `blood_group`, `contact`, `created_at`.
2. **`vitals`**: `id` (UUID PK), `patient_id` (FK `patients.id` CASCADE), `blood_pressure`, `pulse`, `temperature`, `oxygen`, `recorded_at`.
3. **`appointments`**: `id` (UUID PK), `patient_id` (FK `patients.id` CASCADE), `doctor_name`, `facility`, `appointment_date`, `appointment_time`, `status`, `created_at`.
4. **`referrals`**, **`medical_files`**, **`emergency_profiles`**, **`access_logs`**: (Extended schema tables with foreign keys and RLS).

### Row Level Security (RLS) & Query Optimization:
- Explicit RLS enabled across all tables.
- Public read access policies for `anon` and `authenticated` roles in demo/triage mode.
- Composite indexes on `(patient_id, recorded_at DESC)` and `(patient_id, appointment_date)`.

---

## 📂 Project Directory Structure

```
RadVault/
├── .env.example                               # Environment template (URL & Anon key placeholders)
├── .env.local                                 # Local development secrets (Git-ignored)
├── .gitignore                                 # Git rules ignoring .env, .env.*, node_modules
├── index.html                                 # Clean HTML5 entry with RadVault branding
├── package.json                               # Unified dependencies and build scripts
├── vite.config.js                             # Vite configuration with Tailwind CSS v4 plugin
│
├── src/
│   ├── main.jsx                               # Root mounting with <React.StrictMode> & <PatientProvider>
│   ├── App.jsx                                # Main Navigation Shell, Header, Portal Switcher, 6 Tabs
│   ├── index.css                              # Tailwind v4 theme tokens, color variables & base CSS
│   │
│   ├── context/
│   │   └── PatientContext.jsx                 # Global patient state, live fetch lifecycle, usePatient()
│   │
│   ├── services/
│   │   ├── supabase.js                        # Supabase client singleton using Vite env variables
│   │   ├── supabaseClient.js                  # Top-level client alias for cross-module imports
│   │   └── patientService.js                  # getPatients(), getVitals(), getUpcomingAppointments()
│   │
│   ├── components/
│   │   ├── common/
│   │   │   └── LoadingSpinner.jsx             # Accessible animated Teal spinner with ARIA support
│   │   │
│   │   ├── dashboard/
│   │   │   └── PatientHome.jsx                # ⭐ Member 1 Core: Patient Home Command Center
│   │   │
│   │   ├── MedicalRecords/                    # 📦 Member 2 (Sujay) Integrated Module
│   │   │   ├── MedicalRecordsList.jsx         # Records list grid & detail modals
│   │   │   ├── RecordCard.jsx                 # Scan thumbnail card (X-Ray, CT, MRI, Labs)
│   │   │   ├── RecordFilters.jsx              # Modality filter chips
│   │   │   └── RecordViewerModal.jsx          # Interactive report & inverted scan viewer
│   │   │
│   │   ├── HealthTimeline/                    # 📦 Member 2 (Sujay) Integrated Module
│   │   │   ├── HealthTimeline.jsx             # Vertical chronological care event tracker
│   │   │   ├── TimelineFilter.jsx             # Category filter buttons
│   │   │   └── TimelineItem.jsx               # Event node with expandable clinical details
│   │   │
│   │   └── PatientProfile/                    # 📦 Member 2 (Sujay) Integrated Module
│   │       ├── PatientProfileCard.jsx         # ABHA ID, demographics, emergency trigger
│   │       ├── PatientVitals.jsx              # Historical vitals telemetry display
│   │       └── PatientConditions.jsx          # Chronic conditions, allergies & medications
│   │
│   ├── data/
│   │   └── mockPatientData.js                 # Fallback offline records for hackathon resiliency
│   │
│   ├── pages/
│   │   └── PatientPortalPage.jsx              # Unified multi-module tab layout container
│   │
│   └── styles/
│       └── patientModules.css                 # Unified stylesheet styled with Teal/Maroon/Saffron
```

---

## 💻 What Has Been Built (Screen-by-Screen)

### 1. Patient Home Dashboard (`src/components/dashboard/PatientHome.jsx`)
- **Personalized Greeting**: *"Good morning, Ramesh 👋"* with saffron warm accent underline.
- **Patient Context & Unified ID**: Card displaying `MH-P-10482`, full name, age, gender, blood group in Red (`O+`), contact number, and Rural Health Link status.
- **Multi-Patient Switcher**: Dropdown allowing seamless switching between registered patients in Supabase.
- **"What Needs Your Attention" Section**: Dynamic triage alert showing confirmed consultations (Green) and pending referrals requiring action (Amber). Zero-state displays *"You're all caught up!"*.
- **Upcoming Doctor Appointment**: Confirmed consultation preview showing Doctor name, Facility, Date, Time, and status pill.
- **Emergency ID Card**: Red-highlighted emergency card showing blood group, critical allergies, emergency contact, and a bold Saffron CTA to open Emergency ID.
- **Medical Records Card**: Document counter (12 total, 3 recently added) with Maroon CTA to view records.
- **Latest Vitals Grid**: 4-card telemetry grid for Blood Pressure (`128/82 mmHg`), Heart Rate (`76 bpm`), SpO2 (`98%`), and Body Temp (`98.4°F`).
- **Specialist Referrals Summary**: Active referrals counter with Doctor name in Maroon and Handshake icon.
- **Recent Health Activity**: Chronological audit list of newly uploaded MRI scans, referrals, and lab reports with Teal timeline dots.

### 2. Medical Records Vault (`src/components/MedicalRecords/`)
- Filter by Modality: `All`, `Radiology (X-Ray/CT/MRI)`, `Lab Reports`, `Prescriptions`.
- Interactive **RecordViewerModal**: Dual-pane modal with high-resolution scan viewer (invert contrast tool) and structured clinical findings/impressions signed by doctors.

### 3. Health Timeline (`src/components/HealthTimeline/`)
- Vertical chronological track connecting all healthcare events from ASHA triage to specialist follow-up.
- Filter by event type (`Radiology`, `Labs`, `Consultations`).
- Direct link from any timeline event to open the corresponding medical record.

### 4. Patient Profile & Vitals (`src/components/PatientProfile/`)
- Patient identification card with ABHA number, age, gender, blood group, and emergency contact.
- Critical conditions list, allergy severity indicators, and active daily medication schedules.

### 5. Mobile-First Bottom Navigation (`src/App.jsx`)
- Fixed responsive bottom navigation bar with 6 tabs:
  1. 🏠 **Home** (Member 1)
  2. 📖 **Records** (Member 2)
  3. ⏱️ **Timeline** (Member 2)
  4. 🤝 **Referrals** (Member 3)
  5. 🛡️➕ **Emergency** (Member 3)
  6. 👤 **Profile** (Member 2)

---

## ⚡ Environment & Setup Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Environment Variables Configuration
Create a `.env.local` file in the root folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

PORT=8000
DEBUG=True
```

*(Note: `.env` and `.env.local` are strictly protected in `.gitignore`).*

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Build for production
npm run build
```

The application will run locally at **`http://localhost:5173/`**.

---

## 🔄 Git Branch Summary

- **Current Active Branch**: `samir5243d`
- **Features Merged**:
  - `member1-patient-theme-light-icons` (Light theme + Indian palette + cultural icons)
  - `origin/sujay` (Medical Records, Health Timeline, Patient Profile components)
- **Repository Remote**: `https://github.com/sarthakkharade903-tech/RadVault.git`

---

## 🎯 Next Steps for the Team

1. **Member 3 Integration**: Drop in the live **Referrals workflow** and **Emergency Break-Glass QR generation logic** into the designated placeholders in `src/App.jsx`.
2. **Clinical Portal Link**: Connect Team B's doctor diagnostic dashboard to the shared Supabase `health_records` and `medical_files` tables.
3. **Multilingual Support**: Add Hindi and Marathi language toggles for rural patient accessibility.
