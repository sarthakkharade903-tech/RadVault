# RadVault Clinical Input Validation Specification & Reference

> **Important Clinical & Legal Disclaimer:**  
> These validation rules support data-quality assurance and frontline clinical decision support. They do **not** constitute a definitive clinical diagnosis. A single measurement must not be used to diagnose chronic conditions such as hypertension or diabetes mellitus. The healthcare worker (ASHA / ANM / Medical Officer) remains the final clinical decision-maker.

---

## 1. Summary of Clinical Validation Framework

RadVault employs a medically defensible **4-State Validation Model**:

| State | Badge Color | Behavior | Clinical Meaning |
| :--- | :--- | :--- | :--- |
| **INVALID / IMPOSSIBLE** | 🔴 Red | **Blocks Save / Submission** | Physically impossible values, malformed syntax, or inverted relationships (e.g. $DBP \ge SBP$, $SpO_2 > 100\%$, Pulse $> 250$). |
| **CRITICAL / DANGER** | 🔴 Red Alert / Pulse | **Allows Save + Triggers Referral Alert** | Acute clinical emergency requiring urgent evaluation according to protocol (e.g. $BP \ge 180/120$, $SpO_2 < 90\%$, Severe Hypoglycemia). |
| **WARNING / ABNORMAL** | 🟡 Amber | **Allows Save + Shows Guidance** | Plausible but elevated or subnormal reading. Advises repeat measurement and clinical review. |
| **NORMAL** | 🟢 Green | **Allows Save** | Resting value within physiological bounds for the specified age and demographic cohort. |

---

## 2. Vital Signs & Demographic Validation Matrix

### 2.1 Blood Pressure (mmHg)

* **Physical Input Limits:** Systolic: 40–300 mmHg; Diastolic: 30–200 mmHg.
* **Mathematical Invariant:** Systolic must be strictly greater than Diastolic ($SBP > DBP$).
* **Format:** Integer numbers only; separate Systolic and Diastolic fields with display in mmHg.

#### Adult General Population (AHA/ACC 2017 & WHO 2021)
| Category | Systolic (mmHg) | | Diastolic (mmHg) | Clinical Action & Phrasing |
| :--- | :--- | :--- | :--- | :--- |
| **Normal** | $< 120$ | **and** | $< 80$ | Normal resting blood pressure. |
| **Elevated** | $120–129$ | **and** | $< 80$ | Mildly elevated systolic reading. |
| **Stage 1 Range** | $130–139$ | **or** | $80–89$ | Elevated reading — clinical follow-up and lifestyle review advised. |
| **Stage 2 Range** | $140–179$ | **or** | $90–119$ | High reading — requires clinical review and repeat measurement. |
| **Severe / Crisis Range** | $\ge 180$ | **or** | $\ge 120$ | **Critical Alert:** Severely high reading — repeat measurement and assess urgently according to symptoms/clinical protocol. |
| **Hypotension (Low BP)** | $\le 85$ | **or** | $\le 50$ | Low blood pressure reading — check patient hydration and alertness. |

#### Maternal / Pregnancy Context (MoHFW PMSMA & ACOG / FOGSI)
*Activated when patient is identified as pregnant or maternal pathway is selected.*
| Category | Systolic (mmHg) | | Diastolic (mmHg) | Clinical Action & Phrasing |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Maternal BP** | $< 140$ | **and** | $< 90$ | Expected maternal blood pressure range. |
| **Elevated BP in Pregnancy** | $\ge 140$ | **or** | $\ge 90$ | **Warning:** Elevated BP in pregnancy — Clinical evaluation for gestational hypertension / proteinuria advised. |
| **Severe High BP in Pregnancy** | $\ge 160$ | **or** | $\ge 110$ | **Critical Alert:** Severe High BP in Pregnancy — Urgent obstetric referral required to assess pre-eclampsia risk. |

* **Authoritative Sources:**
  - *American Heart Association / American College of Cardiology (2017)*: [Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults](https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065)
  - *World Health Organization (2021)*: [Guideline for the pharmacological treatment of hypertension in adults](https://www.who.int/publications/i/item/9789240033986)
  - *Ministry of Health and Family Welfare (MoHFW), Government of India*: [Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) Operational Guidelines](https://pmsma.mohfw.gov.in/)
  - *American College of Obstetricians and Gynecologists (ACOG)*: [Gestational Hypertension and Preeclampsia: ACOG Practice Bulletin No. 222](https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/06/gestational-hypertension-and-preeclampsia)

---

### 2.2 Pulse / Heart Rate (bpm)

* **Physical Input Limits:** 30–250 bpm (integers only). Rejects $\le 0$ and values $> 250$ (e.g. `9999`).

| Age Group | Normal Resting Range (bpm) | Tachycardia Alert | Bradycardia Alert | Authoritative Basis |
| :--- | :--- | :--- | :--- | :--- |
| **Neonate** ($< 1$ month) | 100–180 | $> 180$ (Severe: $\ge 200$) | $< 100$ (Severe: $\le 80$) | WHO PALS / Neonatal Resuscitation |
| **Infant** (1–11 months) | 100–160 | $> 160$ (Severe: $\ge 180$) | $< 100$ (Severe: $\le 80$) | WHO Pocket Book of Hospital Care for Children |
| **Child** (1–5 years) | 80–130 | $> 130$ (Severe: $\ge 160$) | $< 80$ (Severe: $\le 60$) | WHO IMNCI Guidelines |
| **Child** (6–12 years) | 70–110 | $> 110$ (Severe: $\ge 140$) | $< 70$ (Severe: $\le 50$) | Pediatric Advanced Life Support (PALS) |
| **Adult** ($> 12$ years) | 60–100 | $> 100$ (Severe: $\ge 140$) | $< 60$ (Severe: $\le 45$) | AHA / WHO Clinical Assessment |

* **Authoritative Sources:**
  - *WHO*: [Pocket Book of Hospital Care for Children: Guidelines for the Management of Common Illnesses](https://www.who.int/publications/i/item/9789241548373)
  - *Indian National Health Mission (NHM)*: [Integrated Management of Neonatal and Childhood Illness (IMNCI)](https://nhm.gov.in/)

---

### 2.3 Respiratory Rate (breaths/min)

* **Physical Input Limits:** 6–80 breaths/min (integers only).

| Cohort | Normal Range (/min) | Fast Breathing Cutoff (IMNCI) | Severe Respiratory Distress |
| :--- | :--- | :--- | :--- |
| **Neonate** ($< 2$ months) | 30–60 | $\ge 60$ /min | $\ge 70$ or $\le 20$ /min |
| **Infant** (2–11 months) | 30–50 | $\ge 50$ /min | $\ge 60$ or $\le 18$ /min |
| **Child** (1–5 years) | 20–40 | $\ge 40$ /min | $\ge 50$ or $\le 14$ /min |
| **Child** (6–12 years) | 18–30 | $> 30$ /min | $\ge 40$ or $\le 10$ /min |
| **Adult** ($> 12$ years) | 12–20 | $> 20$ /min | $\ge 30$ (Severe Tachypnea) or $\le 8$ (Bradypnea) |

* **Authoritative Sources:**
  - *WHO & UNICEF*: [Integrated Management of Childhood Illness (IMCI)](https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/integrated-management-of-childhood-illness)
  - *NHM India*: [Guidelines for Control of Acute Respiratory Infections (ARI)](https://nhm.gov.in/)

---

### 2.4 Oxygen Saturation ($SpO_2$ %)

* **Physical Input Limits:** 40% – 100%. Rejects $> 100\%$ and $< 40\%$.

| $SpO_2$ Reading | Classification | Severity | Action & Guidance |
| :--- | :--- | :--- | :--- |
| **95% – 100%** | Normal Saturation | Normal | Adequate arterial blood oxygenation. |
| **90% – 94%** | Mild to Moderate Hypoxemia | Warning | Check probe placement, nail polish, cold extremities; repeat measurement and evaluate clinically. |
| **40% – 89%** | Critical Hypoxemia | **Critical Alert** | **Emergency Threshold:** WHO emergency oxygen cutoff ($\le 90\%$). Immediate oxygen therapy evaluation and urgent medical transfer recommended. |

* **Authoritative Sources:**
  - *World Health Organization (2011)*: [Pulse Oximetry Training Manual](https://www.who.int/publications/i/item/9789241501132)
  - *WHO (2021)*: [Clinical Management of COVID-19: Living Guideline (Oxygenation Cutoffs)](https://www.who.int/publications/i/item/WHO-2019-nCoV-clinical-2021-2)

---

### 2.5 Body Temperature (°C / °F)

* **Physical Input Limits:**
  - Celsius: 30.0°C – 45.0°C.
  - Fahrenheit: 85.0°F – 113.0°F.

| Category | Celsius Range | Fahrenheit Range | Clinical Action |
| :--- | :--- | :--- | :--- |
| **Severe Hypothermia** | $\le 32.0^\circ\text{C}$ | $\le 89.6^\circ\text{F}$ | **Critical Alert:** Active rewarming and urgent medical intervention. |
| **Hypothermia** | $32.1–35.0^\circ\text{C}$ | $89.7–95.0^\circ\text{F}$ | Keep patient warm with blankets and recheck temperature. |
| **Normal Temperature** | $36.5–37.5^\circ\text{C}$ | $97.7–99.5^\circ\text{F}$ | Normal physiological core temperature. |
| **Mild / Low-Grade Fever** | $37.6–38.4^\circ\text{C}$ | $99.6–101.1^\circ\text{F}$ | Monitor hydration, symptoms, and comfort. |
| **High Fever** | $38.5–39.9^\circ\text{C}$ | $101.3–103.8^\circ\text{F}$ | Antipyretic review and clinical evaluation recommended. |
| **Severe Hyperpyrexia** | $\ge 40.0^\circ\text{C}$ | $\ge 104.0^\circ\text{F}$ | **Critical Alert:** Urgent active cooling, antipyretic administration, and medical officer review. |

* **Authoritative Sources:**
  - *World Health Organization*: [Thermal Control of the Newborn: A Practical Guide](https://www.who.int/publications/i/item/WHO-FCH-CAH-02.10)
  - *Indian Academy of Pediatrics (IAP)*: [Standard Treatment Guidelines for Pediatric Fever](https://iapindia.org/)

---

### 2.6 Blood Glucose (mg/dL)

* **Physical Input Limits:** 20–1000 mg/dL (1.1–55.5 mmol/L).

| Reading (mg/dL) | Classification | Severity | Action & Context |
| :--- | :--- | :--- | :--- |
| **$\le 54$** | Severe Hypoglycemia | **Critical Alert** | Immediate fast-acting oral glucose/sugar if conscious, or IV dextrose transfer. |
| **$55–69$** | Hypoglycemia | Warning | Assess symptoms (sweating, tremor, hunger); provide oral carbohydrates. |
| **$70–99$** | Normal Fasting | Normal | Normal fasting glucose. |
| **$100–139$** | Normal Post-Meal / Impaired Fasting | Normal / Warning | Expected post-meal reading; impaired if strictly fasting. |
| **$140–199$** | Elevated Glucose | Warning | Elevated reading — interpretation depends on meal timing; repeat measurement advised. |
| **$200–299$** | High Glucose / Hyperglycemia | Warning | High glucose reading — clinical evaluation recommended. |
| **$\ge 300$** | Severe Hyperglycemia | **Critical Alert** | Risk of acute metabolic decompensation (DKA / HHS); urgent medical officer review advised. |

* **Authoritative Sources:**
  - *American Diabetes Association (ADA, 2024)*: [Standards of Care in Diabetes](https://diabetesjournals.org/care/issue/47/Supplement_1)
  - *Indian Council of Medical Research (ICMR, 2018)*: [Guidelines for Management of Type 2 Diabetes in India](https://www.icmr.gov.in/)

---

### 2.7 Anthropometrics & Body Mass Index (BMI)

* **Weight:** 0.5 kg – 350 kg.
* **Height:** 30 cm – 250 cm.
* **MUAC (Mid-Upper Arm Circumference, 6–59 months):** 5.0–35.0 cm.
  - SAM (Severe Acute Malnutrition): $< 11.5$ cm (**Critical Alert**).
  - MAM (Moderate Acute Malnutrition): $11.5–12.4$ cm (**Warning**).
  - Normal Nutrition: $\ge 12.5$ cm.
* **BMI ($kg/m^2$):**
  - **Pediatric ($< 18$ years):** Explicitly marked with note: *"Adult BMI interpretation not applicable for age < 18 years. Use WHO pediatric growth charts/percentiles."*
  - **Adults ($\ge 18$ years):**
    - Underweight: $< 18.5$
    - Normal Weight: $18.5–24.9$
    - Overweight: $25.0–29.9$ (WHO Asian-Pacific threshold note: $\ge 23.0$)
    - Obesity: $\ge 30.0$ (WHO Asian-Pacific threshold note: $\ge 27.5$)
  - Disclaimer: *"Derived screening index only — not a clinical diagnosis."*

* **Authoritative Sources:**
  - *WHO Expert Consultation (2004)*: [Appropriate body-mass index for Asian populations](https://www.who.int/publications/i/item/9241546417)
  - *WHO Child Growth Standards*: [Mid-upper arm circumference (MUAC) for age](https://www.who.int/tools/child-growth-standards)

---

### 2.8 Age & Date of Birth Validation

* **Range:** Integer 0 to 125 years.
* **Date of Birth:** Must not be in the future ($DOB \le Today$).
* **Calculation:** If DOB is provided, age is calculated accurately accounting for month and day.

---

### 2.9 Indian Mobile Phone Number Validation

* **Canonical Format:** 10 digits starting with `6`, `7`, `8`, or `9`.
* **Accepted Formats Normalized:**
  - `9876543210`
  - `+919876543210`
  - `+91 98765 43210`
  - `+91-9876543210`
  - `09876543210`
* **Canonical Stored Value:** 10-digit national string `XXXXXXXXXX` (Display format: `+91 XXXXX XXXXX`).
* **Rejected Inputs:** Letters (`abcdefghij`), lengths $\ne 10$ digits (`123`, `123456789012`), starting with invalid digits `0–5` (`1234567890`), and emergency short codes (`108`, `104`, `100`, `112`) entered as personal mobile numbers.
