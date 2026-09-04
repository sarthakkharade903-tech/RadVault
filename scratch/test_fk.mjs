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
await client.auth.signInWithPassword({ email: 'somu5243d@gmail.com', password: 'Samir@7498' });

// 1. Try random non-existent UUID for referrals.patient_id
const randomUuid = '00000000-0000-0000-0000-000000000001';
const { data: ref1, error: err1 } = await client.from('referrals').insert([{
  patient_id: randomUuid,
  patient_name: 'Random UUID test',
  destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
  destination_hospital: 'Shrirampur Primary Health Centre',
  priority: 'HIGH',
  status: 'Pending'
}]).select();

console.log('Referral with random UUID patient_id:', ref1 ? 'SUCCESS' : 'FAILED', err1?.message || '');
if (ref1) {
  await client.from('referrals').delete().eq('id', ref1[0].id);
}

// 2. Check if referrals.destination_facility_id has FK constraint to facilities
const randomFacUuid = '00000000-0000-0000-0000-000000000002';
const { data: ref2, error: err2 } = await client.from('referrals').insert([{
  patient_id: '94c2a2ab-49ee-4dad-9382-7c8b26abbdf9',
  patient_name: 'Test Fac FK',
  destination_facility_id: randomFacUuid,
  destination_hospital: 'Test Hospital',
  priority: 'HIGH',
  status: 'Pending'
}]).select();

console.log('Referral with random facility_id:', ref2 ? 'SUCCESS' : 'FAILED', err2?.message || '');
if (ref2) {
  await client.from('referrals').delete().eq('id', ref2[0].id);
}
