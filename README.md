# 🏥 RadVault — Patient Health Records & Disease Trend Monitoring Platform

> **"One Patient. One Connected Health Journey. Zero-PII Population Surveillance."**  
> *A unified digital health ecosystem combining consent-driven medical record continuity, ASHA grassroots triage, break-glass emergency QR passports, specialist tele-radiology, and real-time public health disease trend analytics.*

[![Live Demo](https://img.shields.io/badge/Live%20Deployment-radvault.vercel.app-008080?style=for-the-badge&logo=vercel&logoColor=white)](https://radvault.vercel.app)
[![Hack Matrix 5.0](https://img.shields.io/badge/Hack%20Matrix%205.0-Healthcare%20%7C%20HLTH01-0284C7?style=for-the-badge)](https://hackmatrix.gfgpccoe.in)
[![Production Status](https://img.shields.io/badge/Status-Live%20%26%20Active-2ea44f?style=for-the-badge)](https://radvault.vercel.app)

🌐 **Live Application**: **[https://radvault.vercel.app](https://radvault.vercel.app)**

---

![RadVault Universal Connected Health Network](docs/images/01_landing_hero.png)

---

## 🎯 Alignment with Hack Matrix 5.0 (# HLTH01)

RadVault directly solves **Problem Statement # HLTH01: Patient Health Records & Disease Trend Monitoring** by connecting individual patient longitudinal care with population-level epidemiological surveillance.

| Expected Outcome (Hack Matrix PS #HLTH01) | RadVault Solution | Implementation Status |
| :--- | :--- | :---: |
| **1. Clinician QR Code & Longitudinal Record** | **Emergency Health Passport & Doctor Workspace**: Scanning QR triggers an authenticated longitudinal view of visit history, vitals timeline, and DICOM radiology scans. | ✅ **100% Implemented** |
| **2. Public Health Administrator View (Disease Trends)** | **Public Health DHO Portal**: Dedicated command center displaying aggregate case counts by location (OpenStreetMap Pune Taluka GIS), time window (7D/30D/90D), and condition category. | ✅ **100% Implemented** |
| **3. Provable Access Controls (Zero-PII Separation)** | **Data Layer PII Isolation**: DHO administrator view queries aggregated endpoints where patient names, phone numbers, and ABHA IDs are completely stripped at ingestion. | ✅ **100% Implemented** |
| **4. Minimum Group-Size Threshold ($k$-Anonymity)** | **Mathematical $k \ge 5$ Privacy Guard**: Rural sub-center clusters with fewer than 5 cases are masked (`< 5 cases (Suppressed)`) to prevent patient re-identification. | ✅ **100% Implemented** |
| **5. Genuine Role-Based Access Control (RBAC)** | **5 Dedicated Role Workspaces**: Independent interfaces for ASHA Workers, Patients, Hospital Reception, Specialist Doctors, and District Health Officers. | ✅ **100% Implemented** |

---

## 📌 What is RadVault?

**RadVault** is an end-to-end healthcare and disease surveillance platform engineered for rural and tier-2/3 health networks. It bridges rural health workers (**ASHAs**), primary health centers (**PHCs**), hospital receptionists, specialist physicians (**Doctors/Radiologists**), and District Health Officers (**DHOs**) around a **Unified Patient & ABHA ID**.

### ❌ The Healthcare Challenge:
* **Fragmented Paper Records**: Patients carry paper files and X-ray films between clinics, resulting in lost history and duplicate tests.
* **Specialist Shortages in Rural PHCs**: Primary centers lack full-time radiologists and specialists.
* **Emergency Data Gaps**: First-responders at accident sites lack instant access to blood groups and critical allergies.
* **Delayed Outbreak Detection**: Public health officers lack real-time aggregate disease velocity signals from grassroots consultations.

### ✅ How RadVault Solves It:
RadVault connects every stage of healthcare into a single synchronized digital pipeline—ensuring patient records follow the patient seamlessly while clinical events feed anonymized signals into real-time epidemiological monitoring.

---

## 🔄 End-to-End Care & Surveillance Pipeline

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│  STEP 1: VILLAGE TRIAGE   │ ───► │   STEP 2: PATIENT VAULT   │ ───► │  STEP 3: RADIOLOGY VAULT  │
│ ASHA Worker Registration  │      │  ABHA ID & Vitals Track   │      │ Scan & Diagnostic Reports │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
                                                                                    │
                                                                                    ▼
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│ STEP 7: DHO SURVEILLANCE  │ ◄─── │  STEP 6: SPECIALIST CARE  │ ◄─── │  STEP 5: HOSPITAL INTAKE  │
│ OpenStreetMap Epi Engine  │      │ Tele-Radiology Review     │      │ Reception Queue & Triage  │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 🚀 Interactive Feature Walkthrough

### 👩‍⚕️ Step 1: ASHA Worker Grassroots Portal
Empowers frontline health workers to register families, capture vital telemetry, and log routine village visits.
* **Village Household Registry**: Manage families and patient profiles in rural villages.
* **Digital Patient Registration**: Onboard new patients and link ABHA health numbers.
* **Field Vitals Telemetry**: Capture Blood Pressure, Heart Rate, SpO2, Temperature, and Pregnancy milestones.

---

### 👨‍👩‍👧 Step 2: Patient & Family Health Portal
A central health hub allowing patients and family members to access their ABHA health card, vitals trends, and care history.
* **Family Profile Switcher**: Switch health profiles across household members.
* **ABHA Digital Health Card**: Instant digital ABHA QR codes for clinic check-in.
* **Vitals Telemetry Monitor**: Track historical vitals trends with indicator cards.

---

### 📁 Step 3: Medical Records & Radiology Vault
A secure digital vault for storing X-rays, CT/MRI scans, lab reports, and doctor prescriptions.
* **Multi-Modality Organization**: Filter records by *Radiology*, *Lab Reports*, or *Prescriptions*.
* **Interactive Scan Viewer**: High-resolution viewer with contrast inversion tools.

---

### 🚨 Step 4: 24x7 Emergency SOS & Health Passport
A public, zero-login emergency interface built for trauma victims and 108 ambulance first-responders.
* **Zero-Login Emergency Dispatch**: Request 108 Ambulance dispatch and notify local PHCs.
* **Break-Glass Emergency Profile**: Instantly reveal critical blood group, allergies, and emergency contacts.
* **Scannable Emergency QR Code**: Paramedics scan QR codes to view emergency dossiers.

---

### 🏥 Step 5: Hospital Reception & Intake Desk
Streamlines patient intake, ABHA scanning, and doctor routing at primary health centers.
* **ABHA Quick Intake**: Fast patient lookup via ABHA QR code scan.
* **Triage Categorization**: Priority queue tagging (*Emergency*, *Urgent*, *Routine*).

---

### 🩺 Step 6: Specialist Doctor & Tele-Radiology Workspace
A clinical workspace for consulting physicians and remote radiologists to review cases, examine scans, and write e-prescriptions.
* **Clinical Case Review**: Access patient history, timeline events, and previous vitals.
* **Tele-Radiology Inspection**: Inspect full-resolution diagnostic imaging scans.

---

### 🛡️ Step 7: Public Health DHO Surveillance & Outbreak Analytics
A high-level command center for District Health Officers (DHO) and epidemiologists to monitor disease trends and outbreak velocities.
* **OpenStreetMap GIS Cartography**: Interactive Pune District vector map with taluka-level clustering (Baramati, Haveli, Bhor, Daund, etc.) and hotspot radar animations.
* **Algorithmic Outbreak Alerts**: Automatic detection of statistical anomalies (e.g., *+142% Dengue Spike Velocity in Baramati Taluka*) with rapid vector-control unit dispatch.
* **Mathematical $k$-Anonymity Protection ($k \ge 5$)**: Rural sub-center clusters recording fewer than 5 cases are strictly masked (`< 5 cases (Suppressed)`) to mathematically prevent patient re-identification.
* **Provable Zero-PII Separation**: Administrator view consumes strictly de-identified aggregates—names, ABHA numbers, and contact details are completely stripped at data ingestion.

---

## ⚡ Quick Start & Live Access

### 🌐 Instant Live Access (No Setup Required)
Test the live production deployment directly in your browser:  
👉 **[https://radvault.vercel.app](https://radvault.vercel.app)**

---

### 💻 Run Locally
```bash
# Clone the repository
git clone https://github.com/sarthakkharade903-tech/RadVault.git

# Navigate to project folder
cd RadVault

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 🛠️ Tech Stack Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8, Tailwind CSS v4 |
| **Mapping & GIS** | Leaflet.js, OpenStreetMap Standard Tiles |
| **Icons & Design** | Lucide React, Custom Healthcare UI Theme |
| **Database Engine** | Dual Engine: Supabase PostgreSQL + Offline Mock Engine |
| **Security & RLS** | Row Level Security (RLS) on `patients`, `vitals`, `health_records`, `referrals` |

---

## 📜 Team & License

Built for **Hack Matrix 5.0 (PCCOE)** under Problem Statement `# HLTH01`.  
Developed by **Team RadVault**.
