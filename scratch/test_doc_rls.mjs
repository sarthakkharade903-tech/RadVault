import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(l => {
  const [k, v] = l.trim().split('=');
  if (k === 'VITE_SUPABASE_URL') url = v;
  if (k === 'VITE_SUPABASE_ANON_KEY') key = v;
});

const client = createClient(url, key, { auth: { persistSession: false } });
await client.auth.signInWithPassword({ email: 'samir5243d@gmail.com', password: 'Samir@8806' });

console.log('=== TESTING DOCTOR PERMISSIONS ON ALL CLINICAL TABLES ===');

const tables = ['patients', 'referrals', 'consultations', 'medical_records', 'encounters', 'care_requests'];
for (const t of tables) {
  const { data, error } = await client.from(t).select('*').limit(3);
  console.log(`Doctor SELECT [${t}]:`, data ? `SUCCESS (${data.length} rows)` : 'FAILED', error?.message || '');
}

// Test Doctor UPDATE referrals
const { data: refToTest } = await client.from('referrals').select('id, status').limit(1).single();
if (refToTest) {
  const { data: uData, error: uErr } = await client.from('referrals').update({ status: refToTest.status }).eq('id', refToTest.id).select();
  console.log('Doctor UPDATE referrals:', uData ? 'SUCCESS' : 'FAILED', uErr?.message || '');
}

// Test Doctor INSERT consultations
const testConsPayload = {
  referral_id: refToTest ? refToTest.id : '00000000-0000-0000-0000-000000000001',
  patient_id: '94c2a2ab-49ee-4dad-9382-7c8b26abbdf9',
  doctor_id: 'd3333333-3333-3333-3333-333333333333',
  facility_id: 'f1111111-1111-1111-1111-111111111111',
  clinical_assessment: 'Test Doctor Assessment',
  diagnosis: 'Test Diagnosis',
  treatment_advice: 'Test Advice',
  prescriptions: [],
  investigations: []
};
const { data: cData, error: cErr } = await client.from('consultations').upsert([testConsPayload], { onConflict: 'referral_id' }).select();
console.log('Doctor UPSERT consultations:', cData ? 'SUCCESS' : 'FAILED', cErr?.message || '');

// Clean up test consultation if created
if (cData && cData[0]) {
  // Leave it or clean up
}
