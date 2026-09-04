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

const DOCTOR_CREDS = { email: "samir5243d@gmail.com", password: "Samir@8806" };

async function checkColumns() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword(DOCTOR_CREDS);
  if (authErr) {
    console.error("Auth error:", authErr.message);
    return;
  }
  console.log("Logged in as Doctor:", authData.user.id);

  const { data: ref, error: refErr } = await supabase.from('referrals').select('*').limit(1);
  if (ref && ref[0]) {
    console.log("referrals sample row:", ref[0]);
    console.log("referrals columns:", Object.keys(ref[0]));
  } else {
    console.log("referrals select error:", refErr);
  }

  const { data: docs, error: docErr } = await supabase.from('doctors').select('*, facilities(*)');
  console.log("doctors table:", docs || docErr);

  const { data: staff, error: staffErr } = await supabase.from('hospital_staff').select('*, facilities(*)');
  console.log("hospital_staff table:", staff || staffErr);
}

checkColumns();
