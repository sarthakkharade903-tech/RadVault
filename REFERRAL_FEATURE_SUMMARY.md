# ASHA Digital Triage & Referral System (v3.0)

This document summarizes the Referrals module developed for the RadVault platform, specifically targeting the Smart India Hackathon (SIH) Problem Statement 26133 by focusing on empowering frontline ASHA workers.

## Core Architecture
A 4-step adaptive state machine designed for low health-literacy environments, prioritizing tap-friendly interfaces and visual assessments over manual text entry.

### Step 1: Patient Categorization
The system starts by identifying the patient type, which dictates the clinical protocol followed:
- 🤰 **Pregnant Woman** (ANC Screening)
- 👶 **Child Under 5** (IMNCI Protocol)
- 🧓 **Elderly / Chronic Disease**
- 🧑 **General Adult**
- 🚨 **Emergency Fast-Track** (Bypasses AI, instantly generates a RED referral)

### Step 2: Adaptive Clinical Intake
Instead of a generic form, the UI adapts to mirror real-world ASHA training:
- **Pregnant:** Checks for danger signs (active bleeding), month of pregnancy, and uses a **Color Band Selector** for Hemoglobin (visual nail/eyelid check) instead of requiring lab values.
- **Child:** Checks IMNCI danger signs (convulsions, lethargy) and uses a **MUAC (Mid-Upper Arm Circumference) Color Band** (Red/Yellow/Green) for malnutrition assessment.
- **Elderly:** Tap-chip selection for known conditions (Diabetes, TB) and blood sugar level estimation.
- **Adult:** 12 quick tap-chips for common symptoms (Fever, Chest Pain).

### Step 3: AI Urgency Classification (Groq)
- Integrates with Groq's high-speed API using the `llama-3.3-70b-versatile` model.
- Automatically constructs a precise clinical prompt based on the specific patient type and intake answers.
- Forces the LLM to output a strict JSON structure containing:
  - **Priority:** `RED` (Emergency), `ORANGE` (Urgent), or `GREEN` (Routine).
  - **Clinical Note:** A 2-sentence actionable recommendation for the ASHA worker.

### Step 4: Intelligent Routing
- Uses the **Overpass API** to fetch real hospital coordinates based on the user's GPS location.
- Filters and sorts hospitals within a 50km radius by distance.
- Auto-suggests the correct destination department (e.g., Pediatrics for children, Gynecology for pregnant women).

## Key Files & Components
- `src/components/Referrals/TriageForm.jsx` - The main orchestrator and state machine.
- `src/components/Referrals/screens/SharedComponents.jsx` - Reusable UI elements (Big Tap Buttons, Color Bands, Steppers).
- `src/components/Referrals/screens/*Screen.jsx` - Individual adaptive intake screens.
