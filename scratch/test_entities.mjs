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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: docs } = await supabase.from('doctors').select('*');
  console.log('DOCTORS:', JSON.stringify(docs, null, 2));

  const { data: staff } = await supabase.from('hospital_staff').select('*');
  console.log('STAFF:', JSON.stringify(staff, null, 2));

  const { data: facs } = await supabase.from('facilities').select('*');
  console.log('FACILITIES:', JSON.stringify(facs, null, 2));
}

check();
