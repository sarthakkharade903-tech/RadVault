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
const STAFF_EMAIL = 'myanawar5243d@gmail.com';
const STAFF_PASSWORD = 'Samir@135';
const DOCTOR_EMAIL = 'samir5243d@gmail.com';
const DOCTOR_PASSWORD = 'Samir@8806';

async function testHandoff() {
  const refId = 'bac4683b-1f83-4e8d-9085-4cf09d82358c';

  // 1. Staff Accepts & Assigns Doctor
  const staff = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await staff.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  
  const { data: acc } = await staff.from('referrals').update({ status: 'Accepted' }).eq('id', refId).select().single();
  console.log('1. Staff Accepted:', acc?.status);

  const { data: arr } = await staff.from('referrals').update({ status: 'Arrived', doctor_assigned: 'Dr. Arvind Kulkarni' }).eq('id', refId).select().single();
  console.log('2. Staff Assigned Doctor:', arr?.doctor_assigned, 'Status:', arr?.status);

  // 2. Doctor Sees Patient in Queue
  const doc = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await doc.auth.signInWithPassword({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });

  const { data: docQueue } = await doc.from('referrals').select('*').eq('doctor_assigned', 'Dr. Arvind Kulkarni').eq('id', refId).single();
  console.log('3. Doctor found in queue:', docQueue?.patient_name, 'Status:', docQueue?.status);

  // 3. Doctor starts consultation
  const { data: inCons } = await doc.from('referrals').update({ status: 'In Consultation' }).eq('id', refId).select().single();
  console.log('4. Doctor started consultation:', inCons?.status);

  // 4. Doctor signs consultation
  const { data: comp } = await doc.from('referrals').update({ status: 'Completed' }).eq('id', refId).select().single();
  console.log('5. Doctor completed consultation:', comp?.status);
}

testHandoff();
