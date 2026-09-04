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

async function testReferral() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await supabase.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });
  
  const testRef = {
    patient_id: '94c2a2ab-49ee-4dad-9382-7c8b26abbdf9',
    patient_name: 'kalpana chavla',
    created_by: 'ASHA Worker (Sunita Deshmukh)',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
    destination_department: 'General Medicine',
    priority: 'HIGH',
    status: 'Pending',
    symptoms: 'Fever and weakness'
  };

  const { data, error } = await supabase.from('referrals').insert([testRef]).select();
  console.log('Insert with public.patient:', data ? data[0].id : null, 'Error:', error);
}

testReferral();
