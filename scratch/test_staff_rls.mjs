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
await client.auth.signInWithPassword({ email: 'myanawar5243d@gmail.com', password: 'Samir@135' });

console.log('=== TESTING HOSPITAL STAFF PERMISSIONS ===');

const tables = ['referrals', 'doctors', 'facilities', 'patients', 'hospital_staff'];
for (const t of tables) {
  const { data, error } = await client.from(t).select('*').limit(3);
  console.log(`Staff SELECT [${t}]:`, data ? `SUCCESS (${data.length} rows)` : 'FAILED', error?.message || '');
}

// Test Staff UPDATE referrals
const { data: refToTest } = await client.from('referrals').select('id, status').limit(1).single();
if (refToTest) {
  const { data: uData, error: uErr } = await client.from('referrals').update({ status: refToTest.status }).eq('id', refToTest.id).select();
  console.log('Staff UPDATE referrals:', uData ? 'SUCCESS' : 'FAILED', uErr?.message || '');
}
