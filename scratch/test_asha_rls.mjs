import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(l => {
  const [k, v] = l.trim().split('=');
  if (k === 'VITE_SUPABASE_URL') url = v;
  if (k === 'VITE_SUPABASE_ANON_KEY') key = v;
});

const client = createClient(url, key, { auth: { persistSession: false } });
await client.auth.signInWithPassword({ email: 'somu5243d@gmail.com', password: 'Samir@7498' });

console.log('=== TESTING ASHA PERMISSIONS ===');

const tables = ['patients', 'village_patients', 'care_requests', 'referrals', 'consultations', 'encounters', 'families'];
for (const t of tables) {
  const { data, error } = await client.from(t).select('*').limit(3);
  console.log(`ASHA SELECT [${t}]:`, data ? `SUCCESS (${data.length} rows)` : 'FAILED', error?.message || '');
}
