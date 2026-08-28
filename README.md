# 🏥 RadVault — ASHA-First Care Coordination & Rural Health Platform

> **"One patient. One connected health journey."**  
> *A Fast, Offline-First, Action-Oriented Digital Health Platform Empowering Frontline ASHA Workers, Connecting Rural Beneficiaries, and Coordinating Specialist Care.*

---

## 📌 Executive Summary & Problem Statement

In rural and underserved Indian healthcare ecosystems, frontline **ASHA (Accredited Social Health Activist)** workers and auxiliary nurses are the primary healthcare interface for millions of citizens. However, frontline workers face severe operational bottlenecks:
* **Fragmented Physical Records**: Reliance on paper diaries and physical registers leads to lost patient histories.
* **Delayed Emergency Escalation**: Danger signs in acute conditions (cardiac distress, respiratory failure, maternal complications) are not detected or escalated quickly.
* **Broken Consultation Loops**: Patients sent to secondary/tertiary district hospitals are lost to follow-up because frontline workers have no visibility into hospital intake or outcomes.
* **Low & Intermittent Connectivity**: Rural field workers operate in patchy cellular zones where traditional web apps fail.
* **High Cognitive Load**: Healthcare apps designed like complex desktop ERPs overwhelm frontline workers with "card soup", confusing analytics, and cluttered interfaces.

### 🌟 RadVault's Solution:
RadVault transforms rural healthcare delivery by putting the **ASHA worker at the center** of an operational care-coordination workflow:

$$\begin{matrix}
\textbf{Discover Patient} & \longrightarrow & \textbf{Understand Context} & \longrightarrow & \textbf{Screen \& Vitals} & \longrightarrow & \textbf{Triage \& Safety} \\
\downarrow & & & & & & \downarrow \\
\textbf{Longitudinal History} & \longleftarrow & \textbf{Frontline Follow-up} & \longleftarrow & \textbf{Care Outcome} & \longleftarrow & \textbf{Hospital Consultation}
\end{matrix}$$

---

## 👥 System Architecture & User Roles

The platform enforces strict role-based access control (RBAC) across three distinct healthcare stakeholders:

```
                               ┌────────────────────────────────┐
                               │   RADVAULT HEALTHCARE SYSTEM   │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
  │      ASHA WORKSPACE     │     │  HOSPITAL STAFF PORTAL  │     │     DOCTOR WORKSPACE    │
  │   (Primary Field User)  │     │   (Intake & Routing)    │     │ (Consultation & Review) │
  └────────────┬────────────┘     └─────────────────────────┘     └─────────────────────────┘
               │
               ▼
  ┌─────────────────────────┐
  │   PATIENT BENEFICIARY   │
  │ (Records Vault & ABHA)  │
  └─────────────────────────┘
```

1. **ASHA / Frontline Health Worker (`ROLES.ASHA`)**:
   * Primary application operator in the field.
   * Discovers/registers village beneficiaries, records encounters, conducts danger sign screening, coordinates hospital consultations, and conducts home follow-ups.
2. **Hospital Staff (`ROLES.HOSPITAL_STAFF`)**:
   * Triages inbound referrals, verifies bed/department availability, and routes patients to on-duty specialists.
3. **Doctor / Specialist (`ROLES.DOCTOR`)**:
   * Reviews clinical triage notes, vitals telemetry, and imaging scans, and records treatment plans/outcomes.
4. **Patient / Beneficiary (`ROLES.PATIENT`)**:
   * Beneficiary with access to the Personal Health Record (PHR) Vault and emergency QR summary.

---

## 🛠️ Complete Feature Breakdown (What Has Been Built)

### 1. 🏠 ASHA Operational Command Center (`AshaDashboard.jsx`)
* **Header & Worker Context**: Displays worker greeting (*"Good day, Sunita"*), assigned area (*Sector 4 · Shrirampur*), and live network/sync state pill (`● Online · Synced`, `⚡ 2 to sync`, or `📴 Offline`).
* **Urgent Attention Strip**: Highlights active emergencies requiring immediate clinical escalation. When all patients are stable, displays a quiet state (`✓ No urgent cases right now`) to eliminate cognitive fatigue.
* **Today's Field Activity Summary**: Lightweight, compact operational summary bar showing visits recorded today, follow-ups due, and active consultations.
* **Primary Field CTAs**: Two prominent, touch-friendly action buttons: `[ Find Beneficiary (Search) ]` and `[ + Register New Patient ]`.
* **Today's Work Queue Preview**: Surfaces the top 3–5 actionable tasks directly on home screen with 1-click record access.
* **High-Attention Watchlist Preview**: Deterministic watch list of beneficiaries with chronic conditions (Hypertension, Diabetes) or recent danger alerts.
* **Today in My Area Preview**: Village-level breakdown across Sector 4.

---

### 2. 👤 Village Beneficiary Registry & Live Search (`AshaPatientsView.jsx`)
* **Fast Multi-Field Search**: Real-time filtering by patient name, Unified ID (`MH-P-10482`), phone number, or village name.
* **Village Filter Chips**: One-click filtering by specific villages (*Shrirampur Ward 4*, *Pimpalgaon Rural*, *Khedi Village*).
* **Operational Status Filters**:
  * `All`: Complete registry.
  * `Needs Attention`: Patients with chronic conditions or recent danger alerts.
  * `Follow-up Due`: Patients due for scheduled home checkups today or overdue.
  * `Active Consultation`: Patients with active referrals dispatched to secondary hospitals.
  * `Recently Seen`: Beneficiaries evaluated in the past 7 days.
* **Next Action Indicator**: Displays the exact next operational task on every patient row (e.g. *"Follow-up due today"*, *"Awaiting hospital response"*, *"Overdue by 2 days"*).

---

### 3. 🛡️ Patient Registration with Duplicate Detection (`PatientRegistrationModal.jsx`)
* **Rapid Intake**: Captures Full Name, Age, Gender, Blood Group, Mobile Number, Village/Ward Address, Emergency Contact details, Chronic Conditions, and Drug Allergies.
* **Live Duplicate Beneficiary Protection**:
  * Compares input phone number and (name + age / village) against existing database records in real-time.
  * Warns with high-visibility banner: *"Possible Existing Beneficiary Found: Rajesh Kumar (MH-P-10482 · Shrirampur Ward 4)"*.
  * Offers 1-click `[Open Existing Record]` to prevent duplicate fragmentation, or `[Continue New Intake]`.
* **Resilient Storage**: Generates a unified identifier (`MH-P-XXXXX`), attempts cloud insert to Supabase `public.patients`, and guarantees offline local cache fallback.

---

### 4. 📅 "Today" Work Queue (`AshaTodayView.jsx`)
* **Categorized Task Management**:
  * 🔴 **URGENT**: Acute emergency danger signs and high-risk cases.
  * 🟡 **DUE TODAY**: Scheduled follow-ups and vital rechecks.
  * 🔵 **WAITING**: Referrals dispatched to hospitals awaiting intake confirmation.
  * 🟢 **UPCOMING**: Scheduled care visits for the next 3–7 days.
* **Action-Oriented Cards**: Shows Patient, Unified ID, Village, Priority, Clinical Reason, Deterministic Next Action, and 1-click action buttons.

---

### 5. 🏥 Hospital Consultations & Referral Tracker (`AshaReferralsView.jsx`)
* **Closed-Loop Care Tracking**:
  * Tracks the referral journey: `Created` $\to$ `Dispatched` $\to$ `Hospital Intake` $\to$ `Specialist Assigned` $\to$ `Completed`.
* **Live Supabase Sync**: Real-time polling of `public.referrals` with `Refresh Live Status` button.
* **Status Filter Tabs**: `All`, `Pending`, `Accepted`, `Completed`.
* **Clinical Metadata**: Shows Destination Hospital, Department (Cardiology, Orthopedics, Pediatrics), Assigned Doctor, Priority Badge, and Triage Notes.

---

### 6. 📋 Action-Based Follow-up Engine (`AshaFollowUpsView.jsx`)
* **Continuity of Care**: Manages scheduled post-visit reviews, medication checks, and post-hospitalization verifications.
* **Categorized Filter Tabs**: `All`, `Overdue` (Red badge), `Due Today` (Amber badge), `Upcoming` (Sky badge), `Completed` (Emerald badge).
* **Action-Based Outcome Resolution Modal**: Allows the ASHA worker to record what actually happened during the home visit:
  1. `Completed`: Patient stable / condition improving.
  2. `Patient Visited Hospital`: Attended specialist consultation.
  3. `Unable to Contact`: Beneficiary not at home / unreachable.
  4. `Condition Deteriorated`: Flagged for immediate clinical escalation.
  5. `Rescheduled`: Re-scheduled for tomorrow, 3 days, 7 days, or 14 days.

---

### 7. 🚨 Clinical Emergency Alerts (`AshaAlertsView.jsx`)
* **Dedicated High-Risk Workspace**: Isolates emergency encounters with active danger signs or `HIGH` priority triage from routine care.
* **Clinical Escalation Cards**: Displays chief complaint, flagged danger signs, abnormal vitals, and destination hospital.
* **1-Click Emergency Calling**: Direct `tel:` link to phone the patient's family emergency contact immediately.

---

### 8. 📍 "Today in My Area" Community Workspace (`AshaCommunityView.jsx`)
* **Village-Level Aggregator**: Groups patients and operational tasks by village/ward.
* **Community Metrics**: Shows Total Beneficiaries Registered, Follow-ups Due, Active Consultations, and High-Attention Patients per village.
* **1-Click Filter**: Direct navigation to view and work on patients in a selected village.

---

### 9. 📋 5-Section Patient Context Single Source of Truth (`PatientContextView.jsx`)
1. **Patient Header & Identity**: Full Name, Age, Gender, Unified ID, Blood Group, Village, Phone Number, Emergency Contact click-to-call, Allergies, and Chronic Conditions.
2. **What Needs Attention Now**: Compact immediate action panel with urgency pill and 1-click action trigger.
3. **Active Care & Consultations**: Current facility, department, priority, and intake status.
4. **Important History**: Chronic conditions (Hypertension, Diabetes), drug allergies, and past clinical flags.
5. **Longitudinal Care History Timeline**: Chronological care track with vital telemetry, danger signs, hospital routing, and cloud sync status badges (`☁ Synced` vs `📱 Saved locally`).

---

### 10. 🩺 4-Step Clinical Encounter Wizard (`EncounterWizard.jsx`)
* **Step 1 — Symptoms & Chief Complaint**: Quick-select common symptom chips + free-text symptom notes.
* **Step 2 — Guided Vitals Entry**:
  * Inputs for Blood Pressure, Pulse, SpO₂, Body Temperature, Respiratory Rate, and Weight.
  * Real-time physiological reference intervals and abnormal vitals flagging (e.g. SpO₂ $< 94\%$ flagged in Amber/Red).
* **Step 3 — Mandatory Danger Sign Screening**:
  * Comprehensive checklist of WHO/MoHFW emergency red flags (Chest pain radiating to jaw, severe breathlessness, convulsions, altered mental status, severe bleeding).
  * **Safety Lock**: Flagging any danger sign permanently locks priority to `HIGH` (Emergency) and prevents AI downgrade.
* **Step 4 — Care Decision & Digital Triage**:
  * **AI-Assisted CDS**: Groq `llama3-8b-8192` triage recommendation with supporting clinical reasoning, deterministic safety fallback, and healthcare disclaimer.
  * **Path A — Local Advice & Home Care**: Guidance instructions + scheduled follow-up (3, 7, 14 days).
  * **Path B — Hospital Specialist Referral**: Launches hospital locator and referral dispatcher.

---

### 11. 🚑 Hospital Discovery & Referral Dispatcher (`ReferralCreationModal.jsx`)
* **Live Facility Discovery**: Queries the **OpenStreetMap / Overpass API** around the patient's coordinates to discover real-world nearby hospitals, CHCs, and PHCs with distance calculations.
* **Department Selector**: General Medicine, Cardiology, Pediatrics, Obstetrics & Gynecology, Orthopedics, Pulmonology, Emergency Care.
* **Dispatch Engine**: Sends referral payload directly to Supabase `public.referrals` table with local offline draft fallback.

---

### 12. ⚡ Offline Storage, Background Auto-Sync & Analytics Engine (`encounterService.js`)
* **Local Storage Persistence**: Uses `radvault_asha_encounters_v1` to ensure zero data loss during connectivity dropouts.
* **Reactive Cloud Sync**: Automatically listens to browser `online` events to sync pending offline drafts to Supabase in the background.
* **Manual Force Sync**: One-click sync button in header and settings.
* **Deterministic Next Action Engine (`derivePatientNextAction`)**: Computes context-aware next steps for any patient record.
* **High-Attention Watchlist Engine (`getHighAttentionWatchlist`)**: Filters patients based on deterministic criteria (danger signs, overdue follow-ups, chronic conditions).

---

## 🗄️ Database Architecture & Supabase Integration

RadVault connects to a PostgreSQL database hosted on Supabase:

```
                               ┌──────────────────────────┐
                               │       auth.users         │
                               └────────────┬─────────────┘
                                            │ 1:1
                               ┌────────────▼─────────────┐
                               │         patients         │
                               │      (unified_id)        │
                               └────────────┬─────────────┘
                                            │ 1:N
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
  ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
  │        referrals         │ │          vitals          │ │      appointments        │
  │ (patient_id, priority,   │ │ (patient_id, bp, pulse,  │ │ (patient_id, doctor,     │
  │  hospital, department)   │ │  spo2, recorded_at)      │ │  facility, status)       │
  └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

### Table Schemas:
1. **`public.patients`**:
   * `id` (UUID PK), `unified_id` (Text Unique), `full_name` (Text), `age` (Int), `gender` (Text), `blood_group` (Text), `phone_number` (Text), `address` (Text), `vitals` (JSONB for emergency contacts, conditions, allergies).
2. **`public.referrals`**:
   * `id` (UUID PK), `patient_id` (Text / UUID), `patient_name` (Text), `destination_hospital` (Text), `destination_department` (Text), `doctor_assigned` (Text), `priority` (Text), `priority_label` (Text), `status` (Text: `Pending`, `Accepted`, `In Consultation`, `Completed`), `symptoms` (Text), `vitals` (JSONB), `ai_note` (Text), `created_at` (Timestamp).

---

## 📂 Codebase File Structure

```
RadVault/
├── index.html                                 # HTML5 entry with responsive viewport
├── package.json                               # Dependencies & build scripts
├── vite.config.js                             # Vite bundler configuration
│
├── src/
│   ├── main.jsx                               # Application root mounting with Context Providers
│   ├── App.jsx                                # Root Portal Router & Role Dispatcher
│   ├── index.css                              # Tailwind CSS v4 design tokens
│   │
│   ├── constants/
│   │   └── roles.js                           # Canonical Role Constants (ASHA, HOSPITAL_STAFF, DOCTOR, PATIENT)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx                    # User authentication, role management & demo mode
│   │   └── PatientContext.jsx                 # Global patient state & live fetch lifecycle
│   │
│   ├── services/
│   │   ├── supabase.js                        # Supabase client singleton
│   │   ├── patientService.js                  # Patient directory queries
│   │   └── encounterService.js                # ⭐ Core ASHA care coordination, sync engine & next-actions
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── RoleGuard.jsx                  # Protected route wrapper enforcing RBAC
│   │   │   ├── NoRoleScreen.jsx               # Unassigned role fallback screen
│   │   │   └── LoadingSpinner.jsx             # Accessible medical loading indicator
│   │   │
│   │   ├── workspaces/
│   │   │   ├── AshaWorkspace.jsx              # ⭐ Master ASHA Application Shell (Sidebar + Sub-views)
│   │   │   ├── HospitalStaffWorkspace.jsx     # Hospital staff portal (Strict boundary)
│   │   │   └── DoctorWorkspace.jsx            # Doctor clinical workspace (Strict boundary)
│   │   │
│   │   ├── asha/
│   │   │   ├── AshaDashboard.jsx              # Command Center (Today's tasks, CTAs, urgent strip)
│   │   │   ├── AshaPatientsView.jsx           # Beneficiary directory with status & village filters
│   │   │   ├── AshaTodayView.jsx              # Prioritized "Today" field work queue
│   │   │   ├── AshaFollowUpsView.jsx          # Action-based follow-up queue & outcome modal
│   │   │   ├── AshaReferralsView.jsx          # Hospital consultations & referral tracker
│   │   │   ├── AshaAlertsView.jsx             # Clinical emergency alerts & click-to-call
│   │   │   ├── AshaCommunityView.jsx          # "Today in My Area" village summary
│   │   │   ├── PatientContextView.jsx         # 5-section longitudinal patient record
│   │   │   ├── EncounterWizard.jsx            # 4-step clinical triage & AI CDS wizard
│   │   │   ├── PatientSearchModal.jsx         # Fast multi-criteria search modal
│   │   │   ├── PatientRegistrationModal.jsx   # Intake modal with real-time duplicate check
│   │   │   └── ReferralCreationModal.jsx      # GPS hospital discovery & dispatch modal
│   │   │
│   │   ├── dashboard/
│   │   │   └── PatientHome.jsx                # Beneficiary home portal
│   │   │
│   │   ├── MedicalRecords/                    # Medical records vault & inverted scan viewer
│   │   ├── HealthTimeline/                    # Chronological healthcare event track
│   │   └── PatientProfile/                    # Demographics & vitals telemetry
│   │
│   └── data/
│       ├── mockPatientData.js                 # Fallback offline records
│       └── mockReferrals.js                   # Seed consultation records
```

---

## 🎨 Design System & Cultural Healthcare Palette

Designed specifically for **Indian frontline healthcare workers** to minimize cognitive load in outdoor daylight field conditions:

| Role | Color | Hex | Psychological & Operational Purpose |
|---|---|---|---|
| **Primary Brand** | Deep Teal | `#008080` | Trust, clinical calm, primary navigation, focus outlines |
| **Warm Action Accent** | Saffron Orange | `#FF9933` | Action CTAs (`+ Register`, `+ Start Encounter`), energy |
| **Emergency Alert** | Crimson Red | `#D32F2F` | Critical danger signs, high medical risk, emergency calling |
| **Warning / Overdue** | Amber Gold | `#D97706` | Overdue follow-ups, pending consultations |
| **Stable / Healing** | Forest Green | `#16A34A` | Completed follow-ups, stable vitals, cloud synced badge |
| **Page Canvas** | Soft Light Gray | `#F1F5F9` | High contrast, zero glare in field conditions |
| **Typography** | Dark Slate Charcoal | `#0F172A` | High legibility ($\ge 14\text{px}$) compliant with WCAG AA |

---

## ⚡ Setup & Local Development Guide

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional AI CDS Key (Groq LLaMA-3)
VITE_GROQ_API_KEY=your-groq-api-key-here
```

### 3. Installation & Local Execution
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Code verification & linting
npx oxlint

# 4. Production build
npm run build
```

The application runs locally at **`http://localhost:5173/`**.

---

## 🔄 End-to-End User Journey Simulation

```
1. Morning Field Start
   └─ ASHA opens RadVault → Checks network status → Views "Today's Work Queue"
2. Triage Urgent Beneficiary
   └─ Opens Rajesh Kumar (Chest discomfort) → Views 5-Section Patient Context
3. Conduct Clinical Encounter
   └─ Starts Encounter Wizard → Records BP 142/90, SpO2 95% → Screens Danger Signs
4. Safety Escalation & Triage
   └─ Danger sign detected → Priority locked to HIGH → AI suggests cardiology review
5. Facility Referral Dispatch
   └─ Overpass API finds Sassoon General Hospital → Dispatches referral → Saved locally & synced to Supabase
6. Action-Based Follow-up
   └─ Next day follow-up appears in "Due Today" → ASHA records outcome: "Patient visited hospital"
7. Community Overview
   └─ ASHA switches to "My Area" → Views total beneficiaries and pending visits in Shrirampur Ward 4
```

---

## 🔒 Team Boundaries & Integrity Guarantees

* **ASHA Workspace**: Fully hardened, feature-complete, offline-resilient, and tested.
* **Hospital Staff Workspace (`HospitalStaffWorkspace.jsx`)**: **100% UNTOUCHED** (preserved for hospital team).
* **Doctor Workspace (`DoctorWorkspace.jsx`)**: **100% UNTOUCHED** (preserved for clinical diagnostic team).
* **Database Schema**: Zero destructive SQL, zero table drops, zero schema drift.

---

**RADVAULT — DIGITAL CARE CONTINUITY FOR EVERY CITIZEN.**
