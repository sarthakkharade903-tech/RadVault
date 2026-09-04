import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { assessVitalsPayload, validateBloodPressure, validateSpO2, validateHeartRate, validateTemperature } from '../src/utils/vitalsValidator.js';

const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[k] = v;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function runTest() {
  console.log('================================================================');
  console.log(' RADVAULT — PHASE 3 ASHA WORKSPACE INTEGRATION TEST');
  console.log('================================================================');

  // 1. Test Vitals Validation Engine Unit Tests
  console.log('\n--- 1. Testing Physiological Vitals Validation Engine ---');
  
  // Impossible BP (1000/500)
  const impBp = validateBloodPressure('1000/500');
  console.log(`BP "1000/500": isValid=${impBp.isValid}, status=${impBp.status}, msg="${impBp.message}"`);
  if (impBp.isValid !== false) throw new Error('Impossible BP was not rejected!');

  // Dangerous BP (185/115)
  const dangBp = validateBloodPressure('185/115');
  console.log(`BP "185/115": isValid=${dangBp.isValid}, isDangerous=${dangBp.isDangerous}, status=${dangBp.status}`);
  if (!dangBp.isValid || !dangBp.isDangerous) throw new Error('Dangerous BP was not accepted as warning!');

  // Impossible SpO2 (999)
  const impSpo2 = validateSpO2(999);
  console.log(`SpO2 999%: isValid=${impSpo2.isValid}, status=${impSpo2.status}`);
  if (impSpo2.isValid !== false) throw new Error('Impossible SpO2 was not rejected!');

  // Dangerous SpO2 (88%)
  const dangSpo2 = validateSpO2(88);
  console.log(`SpO2 88%: isValid=${dangSpo2.isValid}, isDangerous=${dangSpo2.isDangerous}`);
  if (!dangSpo2.isValid || !dangSpo2.isDangerous) throw new Error('Dangerous SpO2 was not flagged!');

  // Comprehensive batch
  const batchTest = assessVitalsPayload({ bloodPressure: '190/115', heartRate: '135', oxygenSaturation: '89', temperature: '103.2' });
  console.log(`Batch Dangerous Vitals -> canProceed=${batchTest.canProceed}, hasDangerous=${batchTest.hasDangerous}, warningsCount=${batchTest.warnings.length}`);
  if (!batchTest.canProceed || !batchTest.hasDangerous || batchTest.warnings.length !== 4) {
    throw new Error('Batch vital validator failed on multi-danger test!');
  }
  console.log('✓ Vitals Validation Engine passed all safety test cases.');

  // 2. Test Supabase Medicine Kit & Indent Tables
  console.log('\n--- 2. Testing ASHA Medicine Kit & Indent Persistence ---');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: meds, error: medErr } = await supabase.from('asha_medicines').select('*');
  if (medErr) throw new Error(`Failed to query asha_medicines: ${medErr.message}`);
  console.log(`✓ asha_medicines accessible in Supabase. Available items: ${meds.length}`);
  meds.forEach(m => console.log(`   - ${m.name_en} (${m.name_mr || ''}): Stock ${m.stock} ${m.unit}`));

  const testIndentId = `IND-TEST-${Date.now()}`;
  const { error: indErr } = await supabase.from('medicine_indents').insert([{
    id: testIndentId,
    asha_name: 'Sunita Deshmukh',
    phc_name: 'Shrirampur Primary Health Centre',
    items: [{ medicine_id: 'd1', name: 'Iron Folic Acid (IFA) Tablets', requested_qty: 50, unit: 'tabs' }],
    status: 'SUBMITTED',
    notes: 'Phase 3 Automated End-to-End Verification Indent Slip'
  }]);

  if (indErr) throw new Error(`Failed to insert test indent: ${indErr.message}`);
  console.log(`✓ medicine_indents insert successful. Reference ID: ${testIndentId}`);

  // 3. Test Closed-Loop Specialist Follow-up Query
  console.log('\n--- 3. Testing Closed-Loop Specialist Consultation -> ASHA Follow-up Sync ---');
  const { data: consultations, error: consErr } = await supabase
    .from('consultations')
    .select('id, patient_id, diagnosis, treatment_advice, follow_up_recommended_date, created_at')
    .not('follow_up_recommended_date', 'is', null)
    .limit(5);

  if (consErr) throw new Error(`Failed to query consultations: ${consErr.message}`);
  console.log(`✓ Consultations with follow-up dates found in Supabase: ${consultations.length}`);
  consultations.forEach(c => {
    console.log(`   - Consultation ID: ${c.id}, Follow-up Date: ${c.follow_up_recommended_date}, Diagnosis: ${c.diagnosis}`);
  });

  console.log('\n================================================================');
  console.log(' ALL PHASE 3 ASHA WORKSPACE INTEGRATION CHECKS PASSED!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
