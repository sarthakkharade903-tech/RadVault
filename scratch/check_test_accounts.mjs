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

const ASHA_EMAIL = "somu5243d@gmail.com";
const ASHA_PASSWORD = "Samir@7498";
const STAFF_EMAIL = "myanawar5243d@gmail.com";
const STAFF_PASSWORD = "Samir@135";
const DOCTOR_EMAIL = "samir5243d@gmail.com";
const DOCTOR_PASSWORD = "Samir@8806";

async function checkAccounts() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

  console.log("Checking ASHA account...");
  const { data: ashaAuth } = await supabase.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });
  console.log("ASHA User ID:", ashaAuth?.user?.id);
  console.log("ASHA app_metadata:", ashaAuth?.user?.app_metadata);
  console.log("ASHA user_metadata:", ashaAuth?.user?.user_metadata);

  console.log("\nChecking Staff account...");
  const { data: staffAuth } = await supabase.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  console.log("Staff User ID:", staffAuth?.user?.id);
  console.log("Staff app_metadata:", staffAuth?.user?.app_metadata);
  console.log("Staff user_metadata:", staffAuth?.user?.user_metadata);

  console.log("\nChecking Doctor account...");
  const { data: docAuth } = await supabase.auth.signInWithPassword({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });
  console.log("Doctor User ID:", docAuth?.user?.id);
  console.log("Doctor app_metadata:", docAuth?.user?.app_metadata);
  console.log("Doctor user_metadata:", docAuth?.user?.user_metadata);
}

checkAccounts();
