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

async function testResilientInsert() {
  console.log('Testing resilient Supabase insert without `address` column...');

  // Test payload matching exact valid schema:
  const testPatient = {
    unified_id: `MH-TEST-VERIFY-${Date.now()}`,
    full_name: 'TEST Beneficiary Live Verification',
    age: 35,
    gender: 'Female',
    blood_group: 'B+',
    phone_number: '9876543210',
    vitals: {
      village_name: 'Shrirampur Ward 4',
      household_id: 'HH-TEST-001',
      relation_to_head: 'Head',
      conditions: ['Hypertension']
    }
  };

  const { data, error } = await supabase.from('patients').insert([testPatient]).select();
  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Successfully inserted into live `public.patients`:', data[0]);

    // Clean up test record
    const { error: delErr } = await supabase.from('patients').delete().eq('id', data[0].id);
    if (delErr) {
      console.warn('Cleanup warning:', delErr.message);
    } else {
      console.log('✅ Cleaned up test record successfully.');
    }
  }
}

testResilientInsert();
