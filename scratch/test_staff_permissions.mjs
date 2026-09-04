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

async function testStaffFlow() {
  const staffClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: staffAuth, error: authErr } = await staffClient.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  if (authErr) {
    console.error('Staff auth failed:', authErr.message);
    return;
  }
  console.log('Staff logged in:', staffAuth.user.id);

  const { data: staffProfile, error: spErr } = await staffClient.from('hospital_staff').select('*, facilities(*)').eq('user_id', staffAuth.user.id).single();
  console.log('Staff profile:', staffProfile, 'Error:', spErr);

  const { data: docs, error: docErr } = await staffClient.from('doctors').select('*').eq('facility_id', staffProfile.facility_id);
  console.log('Doctors in facility:', docs, 'Error:', docErr);

  const { data: refs, error: refErr } = await staffClient.from('referrals').select('*').limit(5);
  console.log('Referrals count for staff:', refs ? refs.length : 0, 'Error:', refErr);
  if (refs && refs.length > 0) {
    console.log('Sample referral:', refs[0]);
  }
}

testStaffFlow();
