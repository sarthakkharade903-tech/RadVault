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

async function checkMedicineTables() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: meds, error: medErr } = await supabase.from('asha_medicines').select('*').limit(1);
  console.log("asha_medicines table check:", medErr ? `Error: ${medErr.message}` : `Exists! Rows: ${meds.length}`);

  const { data: indents, error: indErr } = await supabase.from('medicine_indents').select('*').limit(1);
  console.log("medicine_indents table check:", indErr ? `Error: ${indErr.message}` : `Exists! Rows: ${indents.length}`);
}

checkMedicineTables();
