/**
 * Physiological Vitals Range Validator Engine
 *
 * Distinguishes between:
 * 1. IMPOSSIBLE (Physiological Typos): e.g., BP 1000/500, SpO2 999%, Pulse 500
 *    -> Must be blocked at input layer with clear correction guidance.
 * 2. DANGEROUS / CRITICAL (Plausible severe readings): e.g., BP 185/115, SpO2 88%, Pulse 145
 *    -> Must be allowed to proceed, but highlighted with actionable high-priority alerts.
 * 3. NORMAL / PLAUSIBLE: Within standard home/field screening ranges.
 */

export const VITALS_THRESHOLDS = {
  // Blood Pressure (mmHg)
  BP_SYSTOLIC: { minPossible: 40, maxPossible: 300, dangerousHigh: 180, dangerousLow: 70 },
  BP_DIASTOLIC: { minPossible: 30, maxPossible: 200, dangerousHigh: 110, dangerousLow: 40 },
  
  // Heart Rate / Pulse (bpm)
  HEART_RATE: { minPossible: 30, maxPossible: 250, dangerousHigh: 130, dangerousLow: 45 },
  
  // Oxygen Saturation SpO2 (%)
  SPO2: { minPossible: 40, maxPossible: 100, dangerousLow: 92, criticalLow: 85 },
  
  // Blood Glucose (mg/dL) - Random / Fasting
  BLOOD_GLUCOSE: { minPossible: 20, maxPossible: 800, dangerousHigh: 300, dangerousLow: 55 },
  
  // Body Temperature (Fahrenheit)
  TEMPERATURE: { minPossible: 85, maxPossible: 112, dangerousHigh: 103, dangerousLow: 95 },
  
  // Respiratory Rate (breaths/min)
  RESPIRATORY_RATE: { minPossible: 6, maxPossible: 80, dangerousHigh: 32, dangerousLow: 10 },
  
  // Weight (kg)
  WEIGHT: { minPossible: 1.5, maxPossible: 300 },
  
  // Height (cm)
  HEIGHT: { minPossible: 35, maxPossible: 250 },
  
  // Mid-Upper Arm Circumference MUAC (cm) - Pediatric
  MUAC: { minPossible: 5, maxPossible: 35, severeMalnutrition: 11.5, moderateMalnutrition: 12.5 }
};

/**
 * Validate Blood Pressure String (e.g. "120/80")
 */
export function validateBloodPressure(bpString) {
  if (!bpString || typeof bpString !== 'string') {
    return { isValid: true, status: 'EMPTY', message: null };
  }

  const parts = bpString.split('/').map(s => s.trim());
  if (parts.length !== 2) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: 'Format must be Systolic/Diastolic (e.g. 120/80 mmHg).'
    };
  }

  const systolic = parseInt(parts[0], 10);
  const diastolic = parseInt(parts[1], 10);

  if (isNaN(systolic) || isNaN(diastolic)) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: 'Blood pressure values must be numeric integers.'
    };
  }

  // Check impossible boundaries
  if (systolic < VITALS_THRESHOLDS.BP_SYSTOLIC.minPossible || systolic > VITALS_THRESHOLDS.BP_SYSTOLIC.maxPossible) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: `Systolic BP (${systolic}) is outside physiological limits (40–300 mmHg). Check reading.`
    };
  }

  if (diastolic < VITALS_THRESHOLDS.BP_DIASTOLIC.minPossible || diastolic > VITALS_THRESHOLDS.BP_DIASTOLIC.maxPossible) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: `Diastolic BP (${diastolic}) is outside physiological limits (30–200 mmHg). Check reading.`
    };
  }

  if (diastolic >= systolic) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: `Diastolic BP (${diastolic}) cannot be equal to or higher than Systolic BP (${systolic}).`
    };
  }

  // Check dangerous ranges
  const isDangerous =
    systolic >= VITALS_THRESHOLDS.BP_SYSTOLIC.dangerousHigh ||
    systolic <= VITALS_THRESHOLDS.BP_SYSTOLIC.dangerousLow ||
    diastolic >= VITALS_THRESHOLDS.BP_DIASTOLIC.dangerousHigh ||
    diastolic <= VITALS_THRESHOLDS.BP_DIASTOLIC.dangerousLow;

  if (isDangerous) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      systolic,
      diastolic,
      message: `High-Risk BP reading (${systolic}/${diastolic} mmHg). Immediate clinical evaluation recommended.`
    };
  }

  return { isValid: true, status: 'NORMAL', isDangerous: false, systolic, diastolic, message: null };
}

/**
 * Validate Oxygen Saturation SpO2 (%)
 */
export function validateSpO2(val) {
  if (val === undefined || val === null || val === '') {
    return { isValid: true, status: 'EMPTY', message: null };
  }

  const num = parseFloat(val);
  if (isNaN(num)) {
    return { isValid: false, status: 'IMPOSSIBLE', message: 'SpO2 must be a number.' };
  }

  if (num < VITALS_THRESHOLDS.SPO2.minPossible || num > VITALS_THRESHOLDS.SPO2.maxPossible) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: `SpO2 reading (${num}%) is impossible. Valid physiological range is 40–100%.`
    };
  }

  if (num < VITALS_THRESHOLDS.SPO2.criticalLow) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      value: num,
      message: `CRITICAL HYPOXIA (SpO2 ${num}%): Immediate oxygen and emergency transport required!`
    };
  }

  if (num < VITALS_THRESHOLDS.SPO2.dangerousLow) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      value: num,
      message: `Low Oxygen (SpO2 ${num}%): Patient requires prompt clinical assessment.`
    };
  }

  return { isValid: true, status: 'NORMAL', isDangerous: false, value: num, message: null };
}

/**
 * Validate Heart Rate / Pulse (bpm)
 */
export function validateHeartRate(val) {
  if (val === undefined || val === null || val === '') {
    return { isValid: true, status: 'EMPTY', message: null };
  }

  const num = parseInt(val, 10);
  if (isNaN(num)) {
    return { isValid: false, status: 'IMPOSSIBLE', message: 'Heart rate must be numeric.' };
  }

  if (num < VITALS_THRESHOLDS.HEART_RATE.minPossible || num > VITALS_THRESHOLDS.HEART_RATE.maxPossible) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: `Pulse (${num} bpm) is outside human limits (30–250 bpm). Recheck reading.`
    };
  }

  if (num >= VITALS_THRESHOLDS.HEART_RATE.dangerousHigh) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      value: num,
      message: `Severe Tachycardia (${num} bpm): Check for fever, dehydration, or cardiac distress.`
    };
  }

  if (num <= VITALS_THRESHOLDS.HEART_RATE.dangerousLow) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      value: num,
      message: `Severe Bradycardia (${num} bpm): Check patient alertness and stability.`
    };
  }

  return { isValid: true, status: 'NORMAL', isDangerous: false, value: num, message: null };
}

/**
 * Validate Blood Glucose (mg/dL)
 */
export function validateBloodGlucose(val) {
  if (val === undefined || val === null || val === '') {
    return { isValid: true, status: 'EMPTY', message: null };
  }

  const num = parseFloat(val);
  if (isNaN(num)) {
    return { isValid: false, status: 'IMPOSSIBLE', message: 'Blood glucose must be numeric.' };
  }

  if (num < VITALS_THRESHOLDS.BLOOD_GLUCOSE.minPossible || num > VITALS_THRESHOLDS.BLOOD_GLUCOSE.maxPossible) {
    return {
      isValid: false,
      status: 'IMPOSSIBLE',
      message: `Blood glucose (${num} mg/dL) is outside valid range (20–800 mg/dL).`
    };
  }

  if (num <= VITALS_THRESHOLDS.BLOOD_GLUCOSE.dangerousLow) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      value: num,
      message: `Severe Hypoglycemia (${num} mg/dL): Administer oral glucose/sugar immediately if conscious.`
    };
  }

  if (num >= VITALS_THRESHOLDS.BLOOD_GLUCOSE.dangerousHigh) {
    return {
      isValid: true,
      status: 'DANGEROUS',
      isDangerous: true,
      value: num,
      message: `Severe Hyperglycemia (${num} mg/dL): Urgent PHC / Medical Officer review advised.`
    };
  }

  return { isValid: true, status: 'NORMAL', isDangerous: false, value: num, message: null };
}

/**
 * Full Vitals Payload Assessment
 */
export function assessVitalsPayload(vitals) {
  if (!vitals) return { canProceed: true, hasDangerous: false, errors: [], warnings: [] };

  const errors = [];
  const warnings = [];

  if (vitals.bloodPressure) {
    const bpRes = validateBloodPressure(vitals.bloodPressure);
    if (!bpRes.isValid) errors.push(bpRes.message);
    else if (bpRes.isDangerous) warnings.push(bpRes.message);
  }

  if (vitals.oxygenSaturation || vitals.spo2) {
    const spo2Res = validateSpO2(vitals.oxygenSaturation || vitals.spo2);
    if (!spo2Res.isValid) errors.push(spo2Res.message);
    else if (spo2Res.isDangerous) warnings.push(spo2Res.message);
  }

  if (vitals.heartRate || vitals.pulse) {
    const hrRes = validateHeartRate(vitals.heartRate || vitals.pulse);
    if (!hrRes.isValid) errors.push(hrRes.message);
    else if (hrRes.isDangerous) warnings.push(hrRes.message);
  }

  if (vitals.bloodGlucose || vitals.rbs) {
    const bgRes = validateBloodGlucose(vitals.bloodGlucose || vitals.rbs);
    if (!bgRes.isValid) errors.push(bgRes.message);
    else if (bgRes.isDangerous) warnings.push(bgRes.message);
  }

  return {
    canProceed: errors.length === 0,
    hasDangerous: warnings.length > 0,
    errors,
    warnings
  };
}
