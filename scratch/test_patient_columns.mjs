import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const candidateColumns = [
  'id', 'unified_id', 'full_name', 'name', 'age', 'gender', 'dob',
  'blood_group', 'phone_number', 'phone', 'address', 'village',
  'village_id', 'area_id', 'household_id', 'relation_to_head',
  'vitals', 'created_at', 'updated_at', 'critical_allergies'
];

async function checkColumns() {
  console.log('Testing candidate columns on `public.patients`...');
  const found = [];
  const missing = [];

  for (const col of candidateColumns) {
    const { error } = await supabase.from('patients').select(col).limit(1);
    if (!error) {
      found.push(col);
    } else {
      missing.push({ col, error: error.message });
    }
  }

  console.log('\n✅ VALID COLUMNS FOUND IN `public.patients`:');
  console.log(found);

  console.log('\n❌ MISSING COLUMNS IN `public.patients`:');
  missing.forEach(m => console.log(`  - ${m.col}: ${m.error}`));
}

checkColumns();
