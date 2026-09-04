import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = 'c:/Users/LENOVO/OneDrive/Desktop/ogdashboard/RadVault/.env.local';
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

async function testVillagePatientReferral() {
  const asha = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await asha.auth.signInWithPassword({ email: 'somu5243d@gmail.com', password: 'Samir@7498' });

  // Get a village patient
  const { data: vpts } = await asha.from('village_patients').select('*').limit(1).single();
  console.log('Village patient:', vpts.id, vpts.name);

  // Attempt to insert referral with village patient ID
  const refPayload = {
    patient_id: vpts.id,
    patient_name: vpts.name,
    created_by: 'ASHA Worker',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
    destination_department: 'General Medicine',
    priority: 'HIGH',
    status: 'Pending',
    symptoms: 'Chest pain'
  };

  const { data, error } = await asha.from('referrals').insert([refPayload]).select();
  console.log('Insert referral with village patient ID result:', data ? data[0].id : null, 'Error:', error);
}

testVillagePatientReferral();
