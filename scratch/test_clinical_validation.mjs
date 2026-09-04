import {
  validateBloodPressure,
  validatePulse,
  validateRespiratoryRate,
  validateSpO2,
  validateTemperature,
  validateBloodGlucose,
  validateWeight,
  validateHeight,
  calculateDerivedBMI,
  validateMUAC,
  validateAge,
  validateIndianMobileNumber,
  assessVitalsPayload
} from '../src/utils/vitalsValidator.js';

let passed = 0;
let total = 0;

function assert(title, condition, extra = '') {
  total++;
  if (condition) {
    passed++;
    console.log('  ✓ ' + title);
  } else {
    console.error('  ✕ FAILED: ' + title + ' -> ' + extra);
  }
}

console.log('==================================================');
console.log('RADVAULT CLINICAL VALIDATION SECOND-STAGE TEST RUN');
console.log('==================================================\n');

console.log('1. BLOOD PRESSURE');
const bp1 = validateBloodPressure('120/80');
assert('120/80 is valid and normal', bp1.valid === true && bp1.severity === 'normal');

const bp2 = validateBloodPressure('145/92');
assert('145/92 is Stage 2 warning', bp2.valid && bp2.severity === 'warning' && bp2.category.includes('Stage 2'));

const bp3 = validateBloodPressure('181/121');
assert('181/121 is Severe Hypertension (Critical/Danger)', bp3.valid && bp3.severity === 'critical' && bp3.isDangerous);

const bp4 = validateBloodPressure('80/120');
assert('80/120 rejected (DBP >= SBP)', bp4.valid === false && bp4.severity === 'invalid');

const bp5 = validateBloodPressure('72672367263');
assert('72672367263 rejected (malformed/impossible)', bp5.valid === false && bp5.severity === 'invalid');

const bp6 = validateBloodPressure('120/120');
assert('Equal SBP/DBP (120/120) rejected', bp6.valid === false && bp6.severity === 'invalid');

const bpPreg = validateBloodPressure('160/110', undefined, { isPregnant: true });
assert('160/110 in pregnancy is Severe High BP in Pregnancy', bpPreg.valid && bpPreg.severity === 'critical' && bpPreg.category.includes('Severe High BP in Pregnancy'));

const bpPregElev = validateBloodPressure('142/92', undefined, { isPregnant: true });
assert('142/92 in pregnancy is Elevated BP in Pregnancy', bpPregElev.valid && bpPregElev.severity === 'warning' && bpPregElev.category.includes('Elevated BP in Pregnancy'));

console.log('\n2. PULSE / HEART RATE');
const hrAdult = validatePulse(75, 30);
assert('Adult pulse 75 bpm is normal', hrAdult.valid && hrAdult.severity === 'normal');

const hrHigh = validatePulse(145, 30);
assert('Adult pulse 145 bpm is severe tachycardia', hrHigh.valid && hrHigh.severity === 'critical' && hrHigh.isDangerous);

const hrAbsurd = validatePulse(9999, 30);
assert('Pulse 9999 rejected as impossible', hrAbsurd.valid === false && hrAbsurd.severity === 'invalid');

const hrPed = validatePulse(120, 3);
assert('Pediatric pulse 120 bpm at age 3 is normal for toddler', hrPed.valid && hrPed.severity === 'normal');

console.log('\n3. RESPIRATORY RATE');
const rrAdult = validateRespiratoryRate(16, 30);
assert('Adult RR 16/min is normal', rrAdult.valid && rrAdult.severity === 'normal');

const rrPedNormal = validateRespiratoryRate(35, 3);
assert('Pediatric RR 35/min at age 3 is normal', rrPedNormal.valid && rrPedNormal.severity === 'normal');

const rrPedFast = validateRespiratoryRate(45, 3);
assert('Pediatric RR 45/min at age 3 is Fast Breathing (IMNCI alert)', rrPedFast.valid && rrPedFast.category.includes('Fast Breathing'));

const rrAbsurd = validateRespiratoryRate(120, 30);
assert('RR 120/min rejected as impossible', rrAbsurd.valid === false && rrAbsurd.severity === 'invalid');

console.log('\n4. SpO2');
const spo2_98 = validateSpO2(98);
assert('SpO2 98% is normal', spo2_98.valid && spo2_98.severity === 'normal');

const spo2_94 = validateSpO2(94);
assert('SpO2 94% is mild-moderate hypoxemia warning', spo2_94.valid && spo2_94.severity === 'warning');

const spo2_88 = validateSpO2(88);
assert('SpO2 88% is critical hypoxemia alert', spo2_88.valid && spo2_88.severity === 'critical' && spo2_88.isDangerous);

const spo2_70 = validateSpO2(70);
assert('SpO2 70% is plausible critical hypoxemia', spo2_70.valid && spo2_70.severity === 'critical');

const spo2_101 = validateSpO2(101);
assert('SpO2 101% rejected as impossible', spo2_101.valid === false && spo2_101.severity === 'invalid');

const spo2_250 = validateSpO2(250);
assert('SpO2 250% rejected as impossible', spo2_250.valid === false && spo2_250.severity === 'invalid');

console.log('\n5. TEMPERATURE');
const tempNormC = validateTemperature(37.0, 'C');
assert('37.0°C is normal', tempNormC.valid && tempNormC.severity === 'normal');

const tempFeverC = validateTemperature(38.0, 'C');
assert('38.0°C is mild fever warning', tempFeverC.valid && tempFeverC.severity === 'warning');

const tempHighC = validateTemperature(39.0, 'C');
assert('39.0°C is high fever warning', tempHighC.valid && tempHighC.isDangerous);

const tempHypoC = validateTemperature(34.0, 'C');
assert('34.0°C is hypothermia warning', tempHypoC.valid && tempHypoC.category.includes('Hypothermia'));

const tempAbsurdC = validateTemperature(60, 'C');
assert('60°C rejected as impossible', tempAbsurdC.valid === false && tempAbsurdC.severity === 'invalid');

const tempAbsurdLowC = validateTemperature(15, 'C');
assert('15°C rejected as impossible', tempAbsurdLowC.valid === false && tempAbsurdLowC.severity === 'invalid');

console.log('\n6. BLOOD GLUCOSE');
const bgLow = validateBloodGlucose(60);
assert('Glucose 60 mg/dL is hypoglycemia warning', bgLow.valid && bgLow.severity === 'warning');

const bgSevLow = validateBloodGlucose(45);
assert('Glucose 45 mg/dL is severe hypoglycemia critical alert', bgSevLow.valid && bgSevLow.severity === 'critical');

const bgNorm = validateBloodGlucose(95);
assert('Glucose 95 mg/dL is normal', bgNorm.valid && bgNorm.severity === 'normal');

const bgHigh = validateBloodGlucose(220);
assert('Glucose 220 mg/dL is high glucose', bgHigh.valid && bgHigh.severity === 'warning');

const bgSevHigh = validateBloodGlucose(350);
assert('Glucose 350 mg/dL is severe hyperglycemia critical alert', bgSevHigh.valid && bgSevHigh.severity === 'critical');

const bgAbsurd = validateBloodGlucose(1500);
assert('Glucose 1500 mg/dL rejected as impossible', bgAbsurd.valid === false && bgAbsurd.severity === 'invalid');

console.log('\n7. INDIAN MOBILE NUMBER');
const p1 = validateIndianMobileNumber('9876543210');
assert('9876543210 is valid and accepted', p1.valid && p1.normalized === '9876543210');

const p2 = validateIndianMobileNumber('+919876543210');
assert('+919876543210 normalized to 9876543210', p2.valid && p2.normalized === '9876543210');

const p3 = validateIndianMobileNumber('+91 98765 43210');
assert('+91 98765 43210 normalized to 9876543210', p3.valid && p3.normalized === '9876543210');

const p4 = validateIndianMobileNumber('09876543210');
assert('09876543210 normalized to 9876543210', p4.valid && p4.normalized === '9876543210');

const p5 = validateIndianMobileNumber('1234567890');
assert('1234567890 rejected (starts with 1)', p5.valid === false && p5.severity === 'invalid');

const p6 = validateIndianMobileNumber('123');
assert('123 rejected (short length)', p6.valid === false);

const p7 = validateIndianMobileNumber('123456789012');
assert('123456789012 rejected (long length)', p7.valid === false);

const p8 = validateIndianMobileNumber('abcdefghij');
assert('abcdefghij rejected (letters)', p8.valid === false);

const p9 = validateIndianMobileNumber('108');
assert('108 emergency code rejected as patient mobile', p9.valid === false);

console.log('\n8. AGE & DOB');
assert('Age 0 is valid', validateAge(0).valid);
assert('Age 4 is valid', validateAge(4).valid);
assert('Age 18 is valid', validateAge(18).valid);
assert('Age 45 is valid', validateAge(45).valid);
assert('Age 125 is valid', validateAge(125).valid);
assert('Age -5 is rejected', validateAge(-5).valid === false);
assert('Age 150 is rejected', validateAge(150).valid === false);
assert('Future DOB rejected', validateAge(null, '2030-01-01').valid === false);

console.log('\n9. HEIGHT / WEIGHT / BMI');
const bmiAdult = calculateDerivedBMI(170, 70, 30);
assert('Adult BMI calculated (24.2)', bmiAdult.value === 24.2 && !bmiAdult.isPediatric);

const bmiPed = calculateDerivedBMI(110, 18, 5);
assert('Pediatric BMI labeled as not applicable for adult categories', bmiPed.isPediatric === true);

console.log('\n10. COMPOSITE PAYLOAD ASSESSMENT');
const compOk = assessVitalsPayload({ bloodPressure: '120/80', spo2: '98', heartRate: '72' });
assert('Composite normal vitals canProceed === true', compOk.canProceed === true && !compOk.hasDangerous);

const compDanger = assessVitalsPayload({ bloodPressure: '185/125', spo2: '88' });
assert('Composite severe vitals canProceed === true with hasDangerous === true', compDanger.canProceed === true && compDanger.hasDangerous === true);

const compInvalid = assessVitalsPayload({ bloodPressure: '72672367263', spo2: '250' });
assert('Composite impossible vitals canProceed === false', compInvalid.canProceed === false && compInvalid.errors.length > 0);

console.log('\n==================================================');
console.log('TEST SUMMARY: ' + passed + '/' + total + ' TESTS PASSED');
console.log('==================================================');
