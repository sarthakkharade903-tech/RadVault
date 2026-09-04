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

async function checkPatients() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await supabase.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });

  const testPatient = {
    unified_id: `MH-P-${Math.floor(10000 + Math.random() * 90000)}`,
    full_name: 'Test ASHA Patient Insert',
    age: 28,
    gender: 'Female',
    blood_group: 'B+',
    phone_number: '9876543210',
    village_id: 'e1111111-1111-1111-1111-111111111111',
    vitals: { conditions: [] }
  };

  const { data: pData, error: pErr } = await supabase.from('patients').insert([testPatient]).select();
  console.log('ASHA insert into public.patients:', pData ? pData[0].id : null, 'Error:', pErr);

  if (pData && pData[0]) {
    const ref = {
      patient_id: pData[0].id,
      patient_name: pData[0].full_name,
      created_by: 'ASHA Worker (Sunita Deshmukh)',
      destination_hospital: 'Shrirampur Primary Health Centre',
      destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
      destination_department: 'General Medicine',
      priority: 'HIGH',
      status: 'Pending',
      symptoms: 'Fever and weakness'
    };
    const { data: refData, error: refErr } = await supabase.from('referrals').insert([ref]).select();
    console.log('ASHA referral insert for new patient:', refData ? refData[0].id : null, 'Error:', refErr);
  }
}

checkPatients();
