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
const STAFF_EMAIL = 'myanawar5243d@gmail.com';
const STAFF_PASSWORD = 'Samir@135';

async function checkStaff() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await supabase.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  
  const { data: ref } = await supabase.from('referrals').select('*').eq('id', 'bac4683b-1f83-4e8d-9085-4cf09d82358c').single();
  console.log('Staff found referral:', ref ? ref.patient_name : null, 'Status:', ref?.status);
}

checkStaff();
