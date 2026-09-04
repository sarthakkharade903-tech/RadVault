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

async function checkConsultationsRLS() {
  // Staff trying to insert consultation
  const staff = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await staff.auth.signInWithPassword({ email: 'myanawar5243d@gmail.com', password: 'Samir@135' });
  const { data: sData, error: sErr } = await staff.from('consultations').select('*').limit(1);
  console.log('Staff select consultations:', sData ? sData.length : 0, 'Error:', sErr);

  // Staff insert consultation test
  const { data: sIns, error: sInsErr } = await staff.from('consultations').insert([{
    referral_id: '11111111-1111-1111-1111-111111111111',
    clinical_assessment: 'Test'
  }]);
  console.log('Staff insert consultation:', sIns, 'Error:', sInsErr);

  // Doctor select consultations
  const doc = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await doc.auth.signInWithPassword({ email: 'samir5243d@gmail.com', password: 'Samir@8806' });
  const { data: dData, error: dErr } = await doc.from('consultations').select('*').limit(1);
  console.log('Doctor select consultations:', dData ? dData.length : 0, 'Error:', dErr);
}

checkConsultationsRLS();
