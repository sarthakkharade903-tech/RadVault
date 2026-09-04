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

async function probeColumns() {
  console.log('Probing `public.patients` table structure...');
  const { data, error } = await supabase.from('patients').select('*').limit(1);
  if (error) {
    console.error('Error selecting * from patients:', error);
  } else {
    console.log('Sample record from patients:', data);
    if (data && data[0]) {
      console.log('Available columns in public.patients:', Object.keys(data[0]));
    }
  }
}

probeColumns();
