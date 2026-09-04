import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve('.env.local');
let url = '', key = '';
if (fs.existsSync(envLocalPath)) {
  fs.readFileSync(envLocalPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k === 'VITE_SUPABASE_URL') url = v;
        if (k === 'VITE_SUPABASE_ANON_KEY') key = v;
      }
    }
  });
}

const client = createClient(url, key, { auth: { persistSession: false } });

async function check() {
  const tables = [
    'patients', 'village_patients', 'care_requests', 'referrals',
    'doctors', 'hospital_staff', 'facilities', 'consultations',
    'encounters', 'medical_records', 'vitals_history', 'prescriptions', 'investigations', 'tasks', 'families'
  ];
  
  // Test as Doctor
  console.log('=== LOGGING IN AS DOCTOR ===');
  await client.auth.signInWithPassword({ email: 'samir5243d@gmail.com', password: 'Samir@8806' });

  for (const t of tables) {
    const { data, error } = await client.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table [${t}]: ERROR - ${error.message} (code: ${error.code})`);
    } else {
      const cols = data && data[0] ? Object.keys(data[0]) : '(empty table or no rows)';
      console.log(`Table [${t}]: OK - count: ${data ? data.length : 0}`);
      if (Array.isArray(cols)) {
        console.log(`   Columns: ${cols.join(', ')}`);
        console.log(`   Sample row:`, JSON.stringify(data[0]));
      }
    }
  }
}
check();
