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
const ASHA_EMAIL = 'somu5243d@gmail.com';
const ASHA_PASSWORD = 'Samir@7498';

async function testAshaReferralInsert() {
  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth } = await ashaClient.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });
  console.log('ASHA logged in:', ashaAuth?.user?.id);

  // Let's test insert into referrals
  const testRef = {
    patient_name: 'Test Connectivity Beneficiary',
    created_by: 'ASHA Worker (Priya Deshmukh)',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
    destination_department: 'General Medicine',
    priority: 'HIGH',
    priority_label: '🔴 Emergency / Immediate Attention',
    status: 'Pending',
    symptoms: 'Acute fever and chest discomfort during home visit',
    vitals: { bp: '138/88', pulse: '92', spo2: '96', temp: '101.2' },
    ai_note: 'Triage Risk: High. Priority hospital referral advised.'
  };

  const { data, error } = await ashaClient.from('referrals').insert([testRef]).select();
  console.log('Referral insert result:', data ? data[0].id : null, 'Error:', error);
}

testAshaReferralInsert();
