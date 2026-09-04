import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Custom env parser
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

async function runCheck() {
  console.log("Checking schema of public.patients...");
  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth } = await ashaClient.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });
  if (ashaAuth.session) {
    const { data: patients, error } = await ashaClient.from('patients').select('*').limit(1);
    if (error) {
      console.log("Error querying patients:", error.message);
    } else {
      console.log("Sample patient fields:", patients);
    }
  } else {
    console.log("Login failed.");
  }
}

runCheck();
