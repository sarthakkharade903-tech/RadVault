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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectColumns(tableName) {
  console.log(`\nInspecting columns for table public.${tableName}...`);
  try {
    const { error } = await supabase
      .from(tableName)
      .select('non_existent_column_for_schema_diagnostic')
      .limit(1);

    if (error) {
      console.log(`Result: ${error.message} (Code: ${error.code})`);
    } else {
      console.log("No error returned? That should not happen since column is dummy.");
    }
  } catch (e) {
    console.log("Exception:", e.message);
  }
}

async function run() {
  const tables = ['asha_workers', 'asha_village_assignments', 'hospital_staff', 'doctors', 'facilities', 'villages', 'consultations'];
  for (const t of tables) {
    await inspectColumns(t);
  }
}

run();
