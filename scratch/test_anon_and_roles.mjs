import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = 'c:/Users/LENOVO/OneDrive/Desktop/ogdashboard/RadVault/.env.local';
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

async function test() {
  const anon = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: vpts, error: err1 } = await anon.from('village_patients').select('*').limit(2);
  console.log('Anon village_patients:', vpts ? vpts.length : 0, 'Error:', err1);

  const { data: fams, error: err2 } = await anon.from('families').select('*').limit(2);
  console.log('Anon families:', fams ? fams.length : 0, 'Error:', err2);

  const { data: cares, error: err3 } = await anon.from('care_requests').select('*').limit(2);
  console.log('Anon care_requests:', cares ? cares.length : 0, 'Error:', err3);

  const { data: refs, error: err4 } = await anon.from('referrals').select('*').limit(2);
  console.log('Anon referrals:', refs ? refs.length : 0, 'Error:', err4);

  // Now test with Staff user
  const staff = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await staff.auth.signInWithPassword({ email: 'myanawar5243d@gmail.com', password: 'Samir@135' });
  const { data: sRefs, error: sErr } = await staff.from('referrals').select('*').limit(2);
  console.log('Staff referrals query:', sRefs ? sRefs.length : 0, 'Error:', sErr);

  // Now test with Doctor user
  const doc = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await doc.auth.signInWithPassword({ email: 'samir5243d@gmail.com', password: 'Samir@8806' });
  const { data: dRefs, error: dErr } = await doc.from('referrals').select('*').limit(2);
  console.log('Doctor referrals query:', dRefs ? dRefs.length : 0, 'Error:', dErr);

  // Now test with ASHA user
  const asha = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await asha.auth.signInWithPassword({ email: 'somu5243d@gmail.com', password: 'Samir@7498' });
  const { data: aRefs, error: aErr } = await asha.from('referrals').select('*').limit(2);
  console.log('ASHA referrals query:', aRefs ? aRefs.length : 0, 'Error:', aErr);
}

test();
