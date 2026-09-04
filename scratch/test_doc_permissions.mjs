import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const DOCTOR_EMAIL = 'samir5243d@gmail.com';
const DOCTOR_PASSWORD = 'Samir@8806';

async function testDocFlow() {
  const docClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: docAuth, error: authErr } = await docClient.auth.signInWithPassword({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });
  if (authErr) {
    console.error('Doc auth failed:', authErr.message);
    return;
  }
  console.log('Doc logged in:', docAuth.user.id);

  const { data: docProfile, error: dpErr } = await docClient.from('doctors').select('*, facilities(*)').eq('user_id', docAuth.user.id).single();
  console.log('Doc profile:', docProfile, 'Error:', dpErr);

  const { data: refs, error: refErr } = await docClient.from('referrals').select('*').eq('destination_facility_id', docProfile.facility_id);
  console.log('Referrals count in doc facility:', refs ? refs.length : 0, 'Error:', refErr);
  if (refs) {
    console.log('Assigned to this doctor:', refs.filter(r => r.doctor_assigned === docProfile.name).length);
    console.log('All doctors assigned in these referrals:', refs.map(r => ({ id: r.id, doc: r.doctor_assigned, status: r.status, patient: r.patient_name })));
  }
}

testDocFlow();
