/**
 * RadVault — Medically Defensible Physiological & Demographic Validation Engine
 * Second-Stage Research-Based Clinical Validator
 *
 * Primary Authoritative Standards:
 * - World Health Organization (WHO) & WHO India Clinical Guidance
 * - American Heart Association (AHA) / American College of Cardiology (ACC) 2017 Guidelines
 * - Ministry of Health and Family Welfare (MoHFW) / National Health Mission (NHM) India (IMNCI & PMSMA)
 * - American College of Obstetricians and Gynecologists (ACOG) & FOGSI India (Hypertension in Pregnancy)
 * - American Diabetes Association (ADA) & ICMR Guidelines for Management of Diabetes
 *
 * Core Clinical Principles:
 * 1. INVALID: Malformed, impossible, mathematically inconsistent, or outside physiological limits (BLOCK SAVE).
 * 2. WARNING: Clinically abnormal but plausible measurement (ALLOW SAVE + ADVISE RECHECK/FOLLOW-UP).
 * 3. DANGER: Severe / emergency-level measurement (ALLOW SAVE + URGENT CLINICAL PROTOCOL ALERT).
 * 4. NORMAL: Expected physiological range for demographic cohort (ALLOW SAVE).
 * 5. NON-DIAGNOSTIC: Never state "You have [Condition]". Communicate readings and recommend clinical review.
 */

// ─── PHYSIOLOGICAL THRESHOLDS & BOUNDARIES ───────────────────────────────────

export const VITALS_THRESHOLDS = {
  // Blood Pressure (mmHg) — AHA/ACC 2017 & WHO 2021
  BP_SYSTOLIC: {
    minPossible: 40,
    maxPossible: 300,
    normalMax: 119,
    elevatedMax: 129,
    stage1Max: 139,
    stage2Min: 140,
    severeMin: 180,
    dangerousLow: 70,
    hypotensionMax: 85,
    // Pregnancy thresholds (MoHFW PMSMA & ACOG)
    pregnancyHypertensionMin: 140,
    pregnancySevereMin: 160
  },
  BP_DIASTOLIC: {
    minPossible: 30,
    maxPossible: 200,
    normalMax: 79,
    stage1Max: 89,
    stage2Min: 90,
    severeMin: 120,
    dangerousLow: 40,
    hypotensionMax: 50,
    // Pregnancy thresholds (MoHFW PMSMA & ACOG)
    pregnancyHypertensionMin: 90,
    pregnancySevereMin: 110
  },

  // Heart Rate / Pulse (bpm) — WHO / PALS / NHM
  HEART_RATE: {
    minPossible: 30,
    maxPossible: 250,
    // Age-specific normal resting bands
    neonateNormalMin: 100, // < 1 month
    neonateNormalMax: 180,
    infantNormalMin: 100,  // 1-11 months
    infantNormalMax: 160,
    toddlerNormalMin: 80,  // 1-5 years
    toddlerNormalMax: 130,
    childNormalMin: 70,    // 6-12 years
    childNormalMax: 110,
    adultNormalMin: 60,    // > 12 years
    adultNormalMax: 100,
    // Severe acute risk thresholds (adult)
    adultDangerousHigh: 140,
    adultDangerousLow: 45
  },

  // Respiratory Rate (breaths/min) — WHO / IMNCI / NHM
  RESPIRATORY_RATE: {
    minPossible: 6,
    maxPossible: 80,
    // Age-specific normal resting bands & fast-breathing cutoffs (WHO IMNCI)
    neonateNormalMin: 30,  // < 2 months
    neonateNormalMax: 60,
    neonateFastBreathing: 60,
    infantNormalMin: 30,   // 2-11 months
    infantNormalMax: 50,
    infantFastBreathing: 50,
    childNormalMin: 20,    // 1-5 years
    childNormalMax: 40,
    childFastBreathing: 40,
    olderChildNormalMin: 18, // 6-12 years
    olderChildNormalMax: 30,
    adultNormalMin: 12,    // > 12 years
    adultNormalMax: 20,
    adultTachypneaMin: 24,
    adultBradypneaMax: 10,
    adultDangerousHigh: 30,
    adultDangerousLow: 8
  },

  // Oxygen Saturation SpO2 (%) — WHO Pulse Oximetry Guidelines
  SPO2: {
    minPossible: 40,
    maxPossible: 100,
    normalMin: 95,
    mildHypoxiaMin: 90,
    criticalLow: 90 // < 90% is WHO emergency oxygen threshold
  },

  // Body Temperature — WHO & Indian Academy of Pediatrics
  TEMP_CELSIUS: {
    minPossible: 30.0,
    maxPossible: 45.0,
    hypothermiaSevereMax: 32.0,
    hypothermiaMax: 35.0,
    normalMin: 36.5,
    normalMax: 37.5,
    feverMin: 37.6,
    highFeverMin: 38.5,
    hyperpyrexiaMin: 40.0
  },
  TEMP_FAHRENHEIT: {
    minPossible: 85.0,
    maxPossible: 113.0,
    hypothermiaSevereMax: 89.6,
    hypothermiaMax: 95.0,
    normalMin: 97.7,
    normalMax: 99.5,
    feverMin: 99.6,
    highFeverMin: 101.3,
    hyperpyrexiaMin: 104.0
  },

  // Blood Glucose (mg/dL) — WHO & ADA & ICMR
  BLOOD_GLUCOSE: {
    minPossible: 20,
    maxPossible: 1000,
    severeHypoglycemiaMax: 54,
    hypoglycemiaMax: 70,
    fastingNormalMin: 70,
    fastingNormalMax: 99,
    fastingImpairedMax: 125,
    randomNormalMax: 140,
    elevatedMax: 199,
    hyperglycemiaMin: 200,
    severeHyperglycemiaMin: 300
  },

  // Anthropometrics
  WEIGHT: { minPossible: 0.5, maxPossible: 350 },
  HEIGHT: { minPossible: 30, maxPossible: 250 },

  // Mid-Upper Arm Circumference MUAC (cm) — WHO Child Growth Standards (6-59 months)
  MUAC: {
    minPossible: 5.0,
    maxPossible: 35.0,
    samCutoff: 11.5, // Severe Acute Malnutrition (< 11.5 cm)
    mamCutoff: 12.5  // Moderate Acute Malnutrition (11.5 - 12.4 cm)
  },

  // Age (years)
  AGE: { minPossible: 0, maxPossible: 125 }
};

// ─── 1. BLOOD PRESSURE VALIDATOR ─────────────────────────────────────────────

/**
 * Validate Blood Pressure
 *
 * Accepts either:
 *   - bpString: "120/80"
 *   - (systolic, diastolic, options) as separate arguments
 *
 * Options:
 *   - isPregnant {boolean}: Applies ACOG / MoHFW PMSMA pregnancy thresholds
 *   - age {number}: Patient age in years
 *
 * @returns {object} Validation result object with 3-state clinical model
 */
export function validateBloodPressure(systolicInput, diastolicInput, options = {}) {
  let sVal, dVal, opts = options;

  // Handle case where options was passed as second argument with a slash-separated string
  if (typeof systolicInput === 'string' && systolicInput.includes('/') && typeof diastolicInput === 'object') {
    opts = diastolicInput || {};
    diastolicInput = undefined;
  }

  if (diastolicInput === undefined && typeof systolicInput === 'string') {
    if (!systolicInput.trim()) {
      return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
    }
    const parts = systolicInput.split('/').map(s => s.trim());
    if (parts.length !== 2) {
      return {
        valid: false,
        isValid: false,
        severity: 'invalid',
        status: 'IMPOSSIBLE',
        message: 'Format must be Systolic/Diastolic (e.g., 120/80 mmHg).'
      };
    }
    sVal = parts[0];
    dVal = parts[1];
  } else {
    if ((systolicInput === undefined || systolicInput === null || systolicInput === '') &&
        (diastolicInput === undefined || diastolicInput === null || diastolicInput === '')) {
      return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
    }
    sVal = systolicInput;
    dVal = diastolicInput;
  }

  // Reject non-numeric input (integers only)
  if (typeof sVal === 'string' && !/^-?\d+$/.test(sVal.trim())) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Systolic blood pressure must be an integer (mmHg).'
    };
  }
  if (typeof dVal === 'string' && !/^-?\d+$/.test(dVal.trim())) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Diastolic blood pressure must be an integer (mmHg).'
    };
  }

  const systolic = parseInt(sVal, 10);
  const diastolic = parseInt(dVal, 10);

  if (isNaN(systolic) || isNaN(diastolic)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Blood pressure values must be numeric integers.'
    };
  }

  // Reject physically impossible values
  if (systolic < VITALS_THRESHOLDS.BP_SYSTOLIC.minPossible || systolic > VITALS_THRESHOLDS.BP_SYSTOLIC.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Systolic BP (${systolic} mmHg) is outside human physiological limits (40–300 mmHg).`
    };
  }

  if (diastolic < VITALS_THRESHOLDS.BP_DIASTOLIC.minPossible || diastolic > VITALS_THRESHOLDS.BP_DIASTOLIC.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Diastolic BP (${diastolic} mmHg) is outside human physiological limits (30–200 mmHg).`
    };
  }

  // Systolic must be strictly greater than Diastolic
  if (diastolic >= systolic) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Diastolic BP (${diastolic} mmHg) cannot be equal to or higher than Systolic BP (${systolic} mmHg).`
    };
  }

  const isPregnant = Boolean(opts?.isPregnant);

  // ── PREGNANCY-SPECIFIC BP INTERPRETATION (MoHFW PMSMA & ACOG) ──
  if (isPregnant) {
    if (systolic >= VITALS_THRESHOLDS.BP_SYSTOLIC.pregnancySevereMin || diastolic >= VITALS_THRESHOLDS.BP_DIASTOLIC.pregnancySevereMin) {
      return {
        valid: true,
        isValid: true,
        severity: 'critical',
        status: 'DANGEROUS',
        isDangerous: true,
        category: 'Severe High BP in Pregnancy',
        systolic,
        diastolic,
        formatted: `${systolic}/${diastolic} mmHg`,
        message: `Severe High BP in Pregnancy (${systolic}/${diastolic} mmHg) — Urgent obstetric referral required to assess pre-eclampsia risk.`
      };
    }

    if (systolic >= VITALS_THRESHOLDS.BP_SYSTOLIC.pregnancyHypertensionMin || diastolic >= VITALS_THRESHOLDS.BP_DIASTOLIC.pregnancyHypertensionMin) {
      return {
        valid: true,
        isValid: true,
        severity: 'warning',
        status: 'DANGEROUS',
        isDangerous: true,
        category: 'Elevated BP in Pregnancy',
        systolic,
        diastolic,
        formatted: `${systolic}/${diastolic} mmHg`,
        message: `Elevated BP in Pregnancy (${systolic}/${diastolic} mmHg) — Clinical evaluation for gestational hypertension / proteinuria advised.`
      };
    }

    if (systolic <= VITALS_THRESHOLDS.BP_SYSTOLIC.hypotensionMax || diastolic <= VITALS_THRESHOLDS.BP_DIASTOLIC.hypotensionMax) {
      return {
        valid: true,
        isValid: true,
        severity: 'warning',
        status: 'NORMAL',
        isDangerous: false,
        category: 'Low BP in Pregnancy (Hypotension)',
        systolic,
        diastolic,
        formatted: `${systolic}/${diastolic} mmHg`,
        message: `Low blood pressure reading (${systolic}/${diastolic} mmHg) — Check for dizziness, hydration, and maternal positioning.`
      };
    }

    return {
      valid: true,
      isValid: true,
      severity: 'normal',
      status: 'NORMAL',
      isDangerous: false,
      category: 'Normal Maternal BP',
      systolic,
      diastolic,
      formatted: `${systolic}/${diastolic} mmHg`,
      message: null
    };
  }

  // ── GENERAL ADULT BP INTERPRETATION (AHA/ACC 2017 & WHO 2021) ──
  let category = 'Normal Blood Pressure';
  let severity = 'normal';
  let message = null;
  let isDangerous = false;

  if (systolic >= VITALS_THRESHOLDS.BP_SYSTOLIC.severeMin || diastolic >= VITALS_THRESHOLDS.BP_DIASTOLIC.severeMin) {
    category = 'Severe Hypertension Range';
    severity = 'critical';
    isDangerous = true;
    message = `Severely high reading (${systolic}/${diastolic} mmHg) — Repeat measurement and assess urgently according to symptoms/clinical protocol.`;
  } else if (systolic >= VITALS_THRESHOLDS.BP_SYSTOLIC.stage2Min || diastolic >= VITALS_THRESHOLDS.BP_DIASTOLIC.stage2Min) {
    category = 'Stage 2 Hypertension Range';
    severity = 'warning';
    isDangerous = true;
    message = `High reading (${systolic}/${diastolic} mmHg) — Requires clinical review and repeat measurement.`;
  } else if (systolic >= 130 || diastolic > 80) {
    category = 'Stage 1 Hypertension Range';
    severity = 'warning';
    message = `Elevated reading (${systolic}/${diastolic} mmHg) — Clinical follow-up and lifestyle review advised.`;
  } else if (systolic > 120 && diastolic <= 80) {
    category = 'Elevated Blood Pressure';
    severity = 'warning';
    message = `Mildly elevated systolic reading (${systolic}/${diastolic} mmHg).`;
  } else if (systolic <= VITALS_THRESHOLDS.BP_SYSTOLIC.hypotensionMax || diastolic <= VITALS_THRESHOLDS.BP_DIASTOLIC.hypotensionMax) {
    category = 'Hypotension (Low BP)';
    severity = 'warning';
    isDangerous = systolic <= VITALS_THRESHOLDS.BP_SYSTOLIC.dangerousLow;
    message = `Low blood pressure reading (${systolic}/${diastolic} mmHg) — Check patient hydration, symptoms, and alertness.`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    category,
    systolic,
    diastolic,
    formatted: `${systolic}/${diastolic} mmHg`,
    message
  };
}

// ─── 2. PULSE / HEART RATE VALIDATOR ─────────────────────────────────────────

/**
 * Validate Pulse / Heart Rate (bpm)
 *
 * Age bands supported:
 *   - Neonate: < 0.08 years (< 1 month) -> 100-180 bpm
 *   - Infant: < 1 year (1-11 months) -> 100-160 bpm
 *   - Toddler & Preschool: 1-5 years -> 80-130 bpm
 *   - School-Age Child: 6-12 years -> 70-110 bpm
 *   - Adolescent & Adult: > 12 years -> 60-100 bpm
 *
 * @param {number|string} val - Pulse in bpm
 * @param {number} [age=30] - Patient age in years
 */
export function validatePulse(val, age = 30) {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Pulse must be a whole number (bpm).'
    };
  }

  // Human survival limits
  if (num < VITALS_THRESHOLDS.HEART_RATE.minPossible || num > VITALS_THRESHOLDS.HEART_RATE.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Pulse (${num} bpm) is outside human survival limits (30–250 bpm). Recheck reading.`
    };
  }

  const numericAge = typeof age === 'number' ? age : parseFloat(age) || 30;

  let normalMin = VITALS_THRESHOLDS.HEART_RATE.adultNormalMin;
  let normalMax = VITALS_THRESHOLDS.HEART_RATE.adultNormalMax;
  let dangerousHigh = VITALS_THRESHOLDS.HEART_RATE.adultDangerousHigh;
  let dangerousLow = VITALS_THRESHOLDS.HEART_RATE.adultDangerousLow;
  let cohortLabel = 'Adult';

  if (numericAge < 0.08) {
    cohortLabel = 'Neonate';
    normalMin = VITALS_THRESHOLDS.HEART_RATE.neonateNormalMin;
    normalMax = VITALS_THRESHOLDS.HEART_RATE.neonateNormalMax;
    dangerousHigh = 200;
    dangerousLow = 80;
  } else if (numericAge < 1) {
    cohortLabel = 'Infant';
    normalMin = VITALS_THRESHOLDS.HEART_RATE.infantNormalMin;
    normalMax = VITALS_THRESHOLDS.HEART_RATE.infantNormalMax;
    dangerousHigh = 180;
    dangerousLow = 80;
  } else if (numericAge <= 5) {
    cohortLabel = 'Child (1-5y)';
    normalMin = VITALS_THRESHOLDS.HEART_RATE.toddlerNormalMin;
    normalMax = VITALS_THRESHOLDS.HEART_RATE.toddlerNormalMax;
    dangerousHigh = 160;
    dangerousLow = 60;
  } else if (numericAge <= 12) {
    cohortLabel = 'Child (6-12y)';
    normalMin = VITALS_THRESHOLDS.HEART_RATE.childNormalMin;
    normalMax = VITALS_THRESHOLDS.HEART_RATE.childNormalMax;
    dangerousHigh = 140;
    dangerousLow = 50;
  }

  let severity = 'normal';
  let category = `Normal Pulse (${cohortLabel})`;
  let message = null;
  let isDangerous = false;

  if (num >= dangerousHigh) {
    severity = 'critical';
    category = 'Severe Tachycardia';
    isDangerous = true;
    message = `Very high pulse reading (${num} bpm) — Check for fever, pain, dehydration, respiratory or cardiac distress.`;
  } else if (num > normalMax) {
    severity = 'warning';
    category = 'Tachycardia (Elevated Pulse)';
    message = `Elevated pulse reading (${num} bpm) for ${cohortLabel} (expected resting: ${normalMin}–${normalMax} bpm).`;
  } else if (num <= dangerousLow) {
    severity = 'critical';
    category = 'Severe Bradycardia';
    isDangerous = true;
    message = `Very low pulse reading (${num} bpm) — Check patient stability, consciousness, and perfusion.`;
  } else if (num < normalMin) {
    severity = 'warning';
    category = 'Bradycardia (Low Pulse)';
    message = `Low pulse reading (${num} bpm) for ${cohortLabel} (expected resting: ${normalMin}–${normalMax} bpm).`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    value: num,
    category,
    message
  };
}

export const validateHeartRate = validatePulse;

// ─── 3. RESPIRATORY RATE VALIDATOR ───────────────────────────────────────────

/**
 * Validate Respiratory Rate (breaths/min)
 *
 * Age bands supported (WHO IMNCI & NHM):
 *   - Neonate (< 2 months): 30-60 /min (Fast breathing: >= 60)
 *   - Infant (2-11 months): 30-50 /min (Fast breathing: >= 50)
 *   - Child (1-5 years): 20-40 /min (Fast breathing: >= 40)
 *   - Older Child (6-12 years): 18-30 /min
 *   - Adult (> 12 years): 12-20 /min
 *
 * @param {number|string} val
 * @param {number} [age=30]
 */
export function validateRespiratoryRate(val, age = 30) {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Respiratory rate must be an integer (breaths/min).'
    };
  }

  if (num < VITALS_THRESHOLDS.RESPIRATORY_RATE.minPossible || num > VITALS_THRESHOLDS.RESPIRATORY_RATE.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Respiratory rate (${num}/min) is outside plausible human limits (6–80/min).`
    };
  }

  const numericAge = typeof age === 'number' ? age : parseFloat(age) || 30;

  let normalMin = VITALS_THRESHOLDS.RESPIRATORY_RATE.adultNormalMin;
  let normalMax = VITALS_THRESHOLDS.RESPIRATORY_RATE.adultNormalMax;
  let fastBreathingThreshold = VITALS_THRESHOLDS.RESPIRATORY_RATE.adultTachypneaMin;
  let dangerousHigh = VITALS_THRESHOLDS.RESPIRATORY_RATE.adultDangerousHigh;
  let dangerousLow = VITALS_THRESHOLDS.RESPIRATORY_RATE.adultDangerousLow;
  let cohortLabel = 'Adult';

  if (numericAge < 0.16) { // < 2 months
    cohortLabel = 'Neonate (< 2m)';
    normalMin = VITALS_THRESHOLDS.RESPIRATORY_RATE.neonateNormalMin;
    normalMax = VITALS_THRESHOLDS.RESPIRATORY_RATE.neonateNormalMax;
    fastBreathingThreshold = VITALS_THRESHOLDS.RESPIRATORY_RATE.neonateFastBreathing;
    dangerousHigh = 70;
    dangerousLow = 20;
  } else if (numericAge < 1) { // 2-11 months
    cohortLabel = 'Infant (2-11m)';
    normalMin = VITALS_THRESHOLDS.RESPIRATORY_RATE.infantNormalMin;
    normalMax = VITALS_THRESHOLDS.RESPIRATORY_RATE.infantNormalMax;
    fastBreathingThreshold = VITALS_THRESHOLDS.RESPIRATORY_RATE.infantFastBreathing;
    dangerousHigh = 60;
    dangerousLow = 18;
  } else if (numericAge <= 5) { // 1-5 years
    cohortLabel = 'Child (1-5y)';
    normalMin = VITALS_THRESHOLDS.RESPIRATORY_RATE.childNormalMin;
    normalMax = VITALS_THRESHOLDS.RESPIRATORY_RATE.childNormalMax;
    fastBreathingThreshold = VITALS_THRESHOLDS.RESPIRATORY_RATE.childFastBreathing;
    dangerousHigh = 50;
    dangerousLow = 14;
  } else if (numericAge <= 12) { // 6-12 years
    cohortLabel = 'Child (6-12y)';
    normalMin = VITALS_THRESHOLDS.RESPIRATORY_RATE.olderChildNormalMin;
    normalMax = VITALS_THRESHOLDS.RESPIRATORY_RATE.olderChildNormalMax;
    fastBreathingThreshold = 32;
    dangerousHigh = 40;
    dangerousLow = 10;
  }

  let severity = 'normal';
  let category = `Normal Respiration (${cohortLabel})`;
  let message = null;
  let isDangerous = false;

  if (num >= dangerousHigh) {
    severity = 'critical';
    category = 'Severe Tachypnea (Fast Breathing)';
    isDangerous = true;
    message = `Severely high respiratory rate (${num} breaths/min) — Indicates acute respiratory distress; assess chest indrawing and airway immediately.`;
  } else if (num >= fastBreathingThreshold) {
    severity = 'warning';
    category = 'Fast Breathing (IMNCI / Clinical Alert)';
    isDangerous = true;
    message = `Fast breathing reading (${num} breaths/min) meets IMNCI/clinical threshold for ${cohortLabel} (expected: ${normalMin}–${normalMax}/min).`;
  } else if (num > normalMax) {
    severity = 'warning';
    category = 'Elevated Respiration';
    message = `Elevated respiratory rate (${num} breaths/min) for ${cohortLabel} (expected: ${normalMin}–${normalMax}/min).`;
  } else if (num <= dangerousLow) {
    severity = 'critical';
    category = 'Severe Bradypnea (Slow Breathing)';
    isDangerous = true;
    message = `Dangerously slow respiration (${num} breaths/min) — Immediate airway and ventilation assessment needed.`;
  } else if (num < normalMin) {
    severity = 'warning';
    category = 'Low Respiration';
    message = `Low respiratory rate (${num} breaths/min) for ${cohortLabel} (expected: ${normalMin}–${normalMax}/min).`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    value: num,
    category,
    message
  };
}

// ─── 4. SpO2 VALIDATOR ───────────────────────────────────────────────────────

/**
 * Validate Oxygen Saturation SpO2 (%)
 *
 * Authoritative Standard: WHO Pulse Oximetry Training Manual & COVID-19 Clinical Management
 * Bounds: 40% - 100%
 */
export function validateSpO2(val) {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'SpO2 must be a numeric percentage.'
    };
  }

  // Never allow values above 100% or below 40%
  if (num < VITALS_THRESHOLDS.SPO2.minPossible || num > VITALS_THRESHOLDS.SPO2.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `SpO2 reading (${num}%) is outside human physiological limits (40–100%). Check for typo.`
    };
  }

  let severity = 'normal';
  let category = 'Normal Oxygen Saturation';
  let message = null;
  let isDangerous = false;

  if (num < VITALS_THRESHOLDS.SPO2.criticalLow) {
    severity = 'critical';
    category = 'Critical Hypoxemia';
    isDangerous = true;
    message = `Critical Low Oxygen Reading (SpO2 ${num}%) — Immediate oxygen therapy evaluation and emergency transfer advised (WHO emergency threshold < 90%).`;
  } else if (num < VITALS_THRESHOLDS.SPO2.normalMin) {
    severity = 'warning';
    category = 'Mild to Moderate Hypoxemia';
    isDangerous = true;
    message = `Low Oxygen Reading (SpO2 ${num}%) — Check probe positioning, nail polish, or cold extremities; repeat measurement and assess clinically.`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    value: num,
    category,
    message
  };
}

// ─── 5. TEMPERATURE VALIDATOR ────────────────────────────────────────────────

/**
 * Validate Body Temperature
 * Supports both Celsius and Fahrenheit with auto-detection.
 */
export function validateTemperature(val, preferredUnit = 'auto') {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Temperature must be a valid number.'
    };
  }

  // Determine scale
  let isFahrenheit = preferredUnit === 'F';
  if (preferredUnit === 'auto' || preferredUnit === 'C') {
    if (num > 60) isFahrenheit = true; // Numbers like 98.6 are clearly Fahrenheit
  }

  if (isFahrenheit) {
    if (num < VITALS_THRESHOLDS.TEMP_FAHRENHEIT.minPossible || num > VITALS_THRESHOLDS.TEMP_FAHRENHEIT.maxPossible) {
      return {
        valid: false,
        isValid: false,
        severity: 'invalid',
        status: 'IMPOSSIBLE',
        message: `Temperature (${num}°F) is outside human survival limits (85.0–113.0°F). Recheck thermometer.`
      };
    }

    let severity = 'normal';
    let category = 'Normal Body Temperature';
    let message = null;
    let isDangerous = false;

    if (num >= VITALS_THRESHOLDS.TEMP_FAHRENHEIT.hyperpyrexiaMin) {
      severity = 'critical';
      category = 'Severe Hyperpyrexia';
      isDangerous = true;
      message = `Severe Hyperpyrexia (${num}°F) — Urgent cooling, antipyretic review, and clinical evaluation required.`;
    } else if (num >= VITALS_THRESHOLDS.TEMP_FAHRENHEIT.highFeverMin) {
      severity = 'warning';
      category = 'High Fever';
      isDangerous = true;
      message = `High Fever reading (${num}°F) — Antipyretic review and clinical evaluation recommended.`;
    } else if (num >= VITALS_THRESHOLDS.TEMP_FAHRENHEIT.feverMin) {
      severity = 'warning';
      category = 'Mild Fever / Elevated Temperature';
      message = `Elevated temperature reading (${num}°F) — Monitor hydration and symptoms.`;
    } else if (num <= VITALS_THRESHOLDS.TEMP_FAHRENHEIT.hypothermiaSevereMax) {
      severity = 'critical';
      category = 'Severe Hypothermia';
      isDangerous = true;
      message = `Severe Hypothermia reading (${num}°F) — Immediate active rewarming and medical assessment required.`;
    } else if (num <= VITALS_THRESHOLDS.TEMP_FAHRENHEIT.hypothermiaMax) {
      severity = 'warning';
      category = 'Hypothermia';
      isDangerous = true;
      message = `Hypothermia reading (${num}°F) — Keep patient warm with blankets and recheck.`;
    }

    return {
      valid: true,
      isValid: true,
      severity,
      status: isDangerous ? 'DANGEROUS' : 'NORMAL',
      isDangerous,
      value: num,
      unit: '°F',
      celsiusValue: parseFloat((((num - 32) * 5) / 9).toFixed(1)),
      category,
      message
    };
  }

  // Celsius validation
  if (num < VITALS_THRESHOLDS.TEMP_CELSIUS.minPossible || num > VITALS_THRESHOLDS.TEMP_CELSIUS.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Temperature (${num}°C) is outside human survival limits (30.0–45.0°C). Recheck thermometer.`
    };
  }

  let severity = 'normal';
  let category = 'Normal Body Temperature';
  let message = null;
  let isDangerous = false;

  if (num >= VITALS_THRESHOLDS.TEMP_CELSIUS.hyperpyrexiaMin) {
    severity = 'critical';
    category = 'Severe Hyperpyrexia';
    isDangerous = true;
    message = `Severe Hyperpyrexia (${num}°C) — Urgent cooling, antipyretic review, and clinical evaluation required.`;
  } else if (num >= VITALS_THRESHOLDS.TEMP_CELSIUS.highFeverMin) {
    severity = 'warning';
    category = 'High Fever';
    isDangerous = true;
    message = `High Fever reading (${num}°C) — Antipyretic review and clinical evaluation recommended.`;
  } else if (num >= VITALS_THRESHOLDS.TEMP_CELSIUS.feverMin) {
    severity = 'warning';
    category = 'Mild Fever / Elevated Temperature';
    message = `Elevated temperature reading (${num}°C) — Monitor hydration and symptoms.`;
  } else if (num <= VITALS_THRESHOLDS.TEMP_CELSIUS.hypothermiaSevereMax) {
    severity = 'critical';
    category = 'Severe Hypothermia';
    isDangerous = true;
    message = `Severe Hypothermia reading (${num}°C) — Immediate active rewarming and medical assessment required.`;
  } else if (num <= VITALS_THRESHOLDS.TEMP_CELSIUS.hypothermiaMax) {
    severity = 'warning';
    category = 'Hypothermia';
    isDangerous = true;
    message = `Hypothermia reading (${num}°C) — Keep patient warm with blankets and recheck.`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    value: num,
    unit: '°C',
    fahrenheitValue: parseFloat(((num * 9) / 5 + 32).toFixed(1)),
    category,
    message
  };
}

// ─── 6. BLOOD GLUCOSE VALIDATOR ──────────────────────────────────────────────

/**
 * Validate Blood Glucose (RBS / Fasting / Post-prandial in mg/dL)
 *
 * Authoritative Guidelines: WHO & ADA & ICMR Type 2 Diabetes Guidelines
 *
 * @param {number|string} val - Glucose in mg/dL
 * @param {string} [context='random'] - 'fasting' | 'postprandial' | 'random'
 */
export function validateBloodGlucose(val, context = 'random') {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Blood glucose must be numeric (mg/dL).'
    };
  }

  if (num < VITALS_THRESHOLDS.BLOOD_GLUCOSE.minPossible || num > VITALS_THRESHOLDS.BLOOD_GLUCOSE.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Blood glucose (${num} mg/dL) is outside valid human limits (20–1000 mg/dL).`
    };
  }

  let severity = 'normal';
  let category = 'Normal Blood Glucose';
  let message = null;
  let isDangerous = false;

  if (num <= VITALS_THRESHOLDS.BLOOD_GLUCOSE.severeHypoglycemiaMax) {
    severity = 'critical';
    category = 'Severe Hypoglycemia';
    isDangerous = true;
    message = `Severe Hypoglycemia reading (${num} mg/dL) — Administer oral glucose/sugar immediately if conscious, or seek emergency medical support.`;
  } else if (num < VITALS_THRESHOLDS.BLOOD_GLUCOSE.hypoglycemiaMax) {
    severity = 'warning';
    category = 'Hypoglycemia (Low Blood Sugar)';
    isDangerous = true;
    message = `Low blood glucose reading (${num} mg/dL) — Assess for sweating, shakiness, or confusion; provide fast-acting carbohydrates.`;
  } else if (num >= VITALS_THRESHOLDS.BLOOD_GLUCOSE.severeHyperglycemiaMin) {
    severity = 'critical';
    category = 'Severe Hyperglycemia';
    isDangerous = true;
    message = `Severe Hyperglycemia reading (${num} mg/dL) — Risk of acute metabolic decompensation; urgent medical officer review advised.`;
  } else if (num >= VITALS_THRESHOLDS.BLOOD_GLUCOSE.hyperglycemiaMin) {
    severity = 'warning';
    category = 'High Blood Glucose';
    isDangerous = true;
    message = `High glucose reading (${num} mg/dL) — Clinical evaluation and repeat testing advised.`;
  } else if (num > VITALS_THRESHOLDS.BLOOD_GLUCOSE.randomNormalMax) {
    severity = 'warning';
    category = 'Elevated Blood Glucose';
    message = `Elevated glucose reading (${num} mg/dL) — Interpretation depends on fasting vs post-meal context; repeat measurement advised.`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    value: num,
    context,
    category,
    message
  };
}

// ─── 7. ANTHROPOMETRIC VALIDATORS (WEIGHT, HEIGHT, BMI, MUAC) ─────────────────

/**
 * Validate Weight in kg
 */
export function validateWeight(val) {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Weight must be a valid number (kg).'
    };
  }

  if (num < VITALS_THRESHOLDS.WEIGHT.minPossible || num > VITALS_THRESHOLDS.WEIGHT.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Weight (${num} kg) is outside plausible human limits (0.5–350 kg).`
    };
  }

  return {
    valid: true,
    isValid: true,
    severity: 'normal',
    status: 'NORMAL',
    value: num,
    unit: 'kg',
    message: null
  };
}

/**
 * Validate Height in cm
 */
export function validateHeight(val) {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Height must be a valid number (cm).'
    };
  }

  if (num < VITALS_THRESHOLDS.HEIGHT.minPossible || num > VITALS_THRESHOLDS.HEIGHT.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Height (${num} cm) is outside plausible human limits (30–250 cm).`
    };
  }

  return {
    valid: true,
    isValid: true,
    severity: 'normal',
    status: 'NORMAL',
    value: num,
    unit: 'cm',
    message: null
  };
}

/**
 * Calculate Derived Body Mass Index (BMI)
 *
 * Note: For patients under 18 years, adult BMI categories are not applicable.
 * Uses WHO adult cutoffs with an explicit disclaimer.
 *
 * @param {number|string} heightCm
 * @param {number|string} weightKg
 * @param {number} [age=30]
 */
export function calculateDerivedBMI(heightCm, weightKg, age = 30) {
  const hRes = validateHeight(heightCm);
  const wRes = validateWeight(weightKg);

  if (!hRes.valid || !wRes.valid || !hRes.value || !wRes.value) {
    return null;
  }

  const heightM = hRes.value / 100;
  const bmi = parseFloat((wRes.value / (heightM * heightM)).toFixed(1));
  const numericAge = typeof age === 'number' ? age : parseFloat(age) || 30;

  if (numericAge < 18) {
    return {
      value: bmi,
      category: 'Pediatric (Age < 18)',
      isPediatric: true,
      message: 'Adult BMI categories not applicable for age < 18 years. Refer to WHO pediatric growth percentiles.',
      disclaimer: 'Derived screening index only — not a clinical diagnosis.'
    };
  }

  let category = 'Normal Weight';
  let severity = 'normal';

  if (bmi < 18.5) {
    category = 'Underweight';
    severity = 'warning';
  } else if (bmi >= 30.0) {
    category = 'Obesity Range';
    severity = 'warning';
  } else if (bmi >= 25.0) {
    category = 'Overweight Range';
    severity = 'warning';
  }

  return {
    value: bmi,
    category,
    severity,
    isPediatric: false,
    asianIndianNote: 'WHO Asian-Pacific threshold: Overweight >= 23.0 kg/m², Obesity >= 27.5 kg/m².',
    disclaimer: 'Derived screening index only — not a clinical diagnosis.'
  };
}

/**
 * Validate Mid-Upper Arm Circumference (MUAC in cm)
 * Used in children 6-59 months for acute malnutrition screening.
 */
export function validateMUAC(val) {
  if (val === undefined || val === null || val === '') {
    return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', message: null };
  }

  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;

  if (isNaN(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'MUAC must be a numeric measurement (cm).'
    };
  }

  if (num < VITALS_THRESHOLDS.MUAC.minPossible || num > VITALS_THRESHOLDS.MUAC.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `MUAC (${num} cm) is outside plausible limits (5.0–35.0 cm).`
    };
  }

  let severity = 'normal';
  let category = 'Normal Nutrition (MUAC >= 12.5 cm)';
  let isDangerous = false;
  let message = null;

  if (num < VITALS_THRESHOLDS.MUAC.samCutoff) {
    severity = 'critical';
    category = 'Severe Acute Malnutrition (SAM)';
    isDangerous = true;
    message = `Critical MUAC (${num} cm < 11.5 cm) — Indicates Severe Acute Malnutrition (SAM); urgent nutritional center referral required.`;
  } else if (num < VITALS_THRESHOLDS.MUAC.mamCutoff) {
    severity = 'warning';
    category = 'Moderate Acute Malnutrition (MAM)';
    isDangerous = true;
    message = `Low MUAC (${num} cm: 11.5–12.4 cm) — Moderate Acute Malnutrition (MAM); supplementary nutrition advised.`;
  }

  return {
    valid: true,
    isValid: true,
    severity,
    status: isDangerous ? 'DANGEROUS' : 'NORMAL',
    isDangerous,
    value: num,
    category,
    message
  };
}

// ─── 8. AGE AND DATE OF BIRTH VALIDATORS ─────────────────────────────────────

/**
 * Validate Patient Age and Date of Birth
 * Bounds: 0 to 125 years integer
 */
export function validateAge(ageVal, dobVal = null) {
  if (dobVal) {
    const dob = new Date(dobVal);
    const now = new Date();
    if (isNaN(dob.getTime())) {
      return {
        valid: false,
        isValid: false,
        severity: 'invalid',
        status: 'IMPOSSIBLE',
        message: 'Invalid Date of Birth format.'
      };
    }
    if (dob > now) {
      return {
        valid: false,
        isValid: false,
        severity: 'invalid',
        status: 'IMPOSSIBLE',
        message: 'Date of Birth cannot be in the future.'
      };
    }

    let calculatedAge = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge > VITALS_THRESHOLDS.AGE.maxPossible) {
      return {
        valid: false,
        isValid: false,
        severity: 'invalid',
        status: 'IMPOSSIBLE',
        message: `Calculated age (${calculatedAge}) exceeds maximum limit (125 years).`
      };
    }

    return {
      valid: true,
      isValid: true,
      severity: 'normal',
      status: 'NORMAL',
      age: calculatedAge,
      dob: dobVal,
      message: null
    };
  }

  if (ageVal === undefined || ageVal === null || ageVal === '') {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Age is required.'
    };
  }

  const num = typeof ageVal === 'string' ? parseFloat(ageVal.trim()) : ageVal;

  if (isNaN(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: 'Age must be a whole number of years.'
    };
  }

  if (num < VITALS_THRESHOLDS.AGE.minPossible || num > VITALS_THRESHOLDS.AGE.maxPossible) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      message: `Age (${num}) must be between 0 and 125 years.`
    };
  }

  return {
    valid: true,
    isValid: true,
    severity: 'normal',
    status: 'NORMAL',
    age: num,
    message: null
  };
}

// ─── 9. INDIAN MOBILE NUMBER VALIDATOR ───────────────────────────────────────

/**
 * Validate and normalize Indian mobile phone number
 *
 * Requirements:
 * - Exactly 10 digits
 * - Starts with 6, 7, 8, or 9
 * - Supports +91, 91, or 0 prefixes and cleans all punctuation
 * - Canonical storage format: 10-digit string `XXXXXXXXXX`
 * - Display format: `+91 XXXXX XXXXX`
 * - Rejects short emergency numbers (108, 104, etc.) as patient mobile numbers
 */
export function validateIndianMobileNumber(phoneVal, isOptional = false) {
  if (phoneVal === undefined || phoneVal === null || phoneVal === '') {
    if (isOptional) {
      return { valid: true, isValid: true, severity: 'empty', status: 'EMPTY', normalized: '', message: null };
    }
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      normalized: '',
      message: 'Mobile number is required.'
    };
  }

  const rawStr = String(phoneVal).trim();

  // Reject alphabetic characters
  if (/[a-zA-Z]/.test(rawStr)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      normalized: '',
      message: 'Enter a valid 10-digit Indian mobile number (digits only).'
    };
  }

  // Remove common separators (+, -, spaces, parenthesis)
  let digits = rawStr.replace(/[^0-9]/g, '');

  // Strip international / trunk prefix if present
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Reject emergency helpline short codes if mistakenly entered as beneficiary phone
  if (['108', '104', '100', '101', '102', '112', '1098', '181'].includes(digits)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      normalized: digits,
      message: `Emergency helpline code (${digits}) cannot be used as patient personal mobile number.`
    };
  }

  if (digits.length !== 10) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      normalized: digits,
      message: `Enter a valid 10-digit Indian mobile number (found ${digits.length} digits).`
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      isValid: false,
      severity: 'invalid',
      status: 'IMPOSSIBLE',
      normalized: digits,
      message: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
    };
  }

  return {
    valid: true,
    isValid: true,
    severity: 'normal',
    status: 'NORMAL',
    normalized: digits,
    formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
    message: null
  };
}

// ─── 10. COMPOSITE VITALS PAYLOAD ASSESSMENT ────────────────────────────────

/**
 * Full Vitals Payload Assessment
 * Evaluates a complete set of vitals before submission.
 *
 * @param {object} vitals - Object containing vital readings
 * @param {object} patientContext - Patient context { age, isPregnant, gender }
 */
export function assessVitalsPayload(vitals, patientContext = {}) {
  if (!vitals) return { canProceed: true, hasDangerous: false, errors: [], warnings: [] };

  const errors = [];
  const warnings = [];
  const patientAge = patientContext.age || 30;
  const isPregnant = Boolean(patientContext.isPregnant);

  // 1. Blood Pressure
  if (vitals.bloodPressure || vitals.bp) {
    const bpRes = validateBloodPressure(vitals.bloodPressure || vitals.bp, undefined, { isPregnant, age: patientAge });
    if (!bpRes.valid) errors.push(bpRes.message);
    else if (bpRes.isDangerous && bpRes.message) warnings.push(bpRes.message);
  }

  // 2. SpO2
  if (vitals.oxygenSaturation || vitals.spo2) {
    const spo2Res = validateSpO2(vitals.oxygenSaturation || vitals.spo2);
    if (!spo2Res.valid) errors.push(spo2Res.message);
    else if (spo2Res.isDangerous && spo2Res.message) warnings.push(spo2Res.message);
  }

  // 3. Pulse / Heart Rate
  if (vitals.heartRate || vitals.pulse) {
    const hrRes = validatePulse(vitals.heartRate || vitals.pulse, patientAge);
    if (!hrRes.valid) errors.push(hrRes.message);
    else if (hrRes.isDangerous && hrRes.message) warnings.push(hrRes.message);
  }

  // 4. Respiratory Rate
  if (vitals.respiratoryRate || vitals.respRate || vitals.rr) {
    const rrRes = validateRespiratoryRate(vitals.respiratoryRate || vitals.respRate || vitals.rr, patientAge);
    if (!rrRes.valid) errors.push(rrRes.message);
    else if (rrRes.isDangerous && rrRes.message) warnings.push(rrRes.message);
  }

  // 5. Temperature
  if (vitals.temperature || vitals.temp) {
    const tempRes = validateTemperature(vitals.temperature || vitals.temp);
    if (!tempRes.valid) errors.push(tempRes.message);
    else if (tempRes.isDangerous && tempRes.message) warnings.push(tempRes.message);
  }

  // 6. Blood Glucose
  if (vitals.bloodGlucose || vitals.rbs) {
    const bgRes = validateBloodGlucose(vitals.bloodGlucose || vitals.rbs);
    if (!bgRes.valid) errors.push(bgRes.message);
    else if (bgRes.isDangerous && bgRes.message) warnings.push(bgRes.message);
  }

  // 7. Weight
  if (vitals.weight) {
    const wRes = validateWeight(vitals.weight);
    if (!wRes.valid) errors.push(wRes.message);
  }

  // 8. Height
  if (vitals.height) {
    const hRes = validateHeight(vitals.height);
    if (!hRes.valid) errors.push(hRes.message);
  }

  // 9. MUAC (Pediatric)
  if (vitals.muac) {
    const muacRes = validateMUAC(vitals.muac);
    if (!muacRes.valid) errors.push(muacRes.message);
    else if (muacRes.isDangerous && muacRes.message) warnings.push(muacRes.message);
  }

  return {
    canProceed: errors.length === 0,
    hasDangerous: warnings.length > 0,
    errors,
    warnings
  };
}
