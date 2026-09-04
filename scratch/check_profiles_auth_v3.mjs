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

const ASHA_EMAIL = "somu5243d@gmail.com";
const ASHA_PASSWORD = "Samir@7498";
const STAFF_EMAIL = "myanawar5243d@gmail.com";
const STAFF_PASSWORD = "Samir@135";
const DOCTOR_EMAIL = "samir5243d@gmail.com";
const DOCTOR_PASSWORD = "Samir@8806";

async function runCheck() {
  console.log("=== VERIFYING REMEDIATED PROFILE MAPPINGS ===\n");
  let allPass = true;

  // 1. ASHA
  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth } = await ashaClient.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });
  if (ashaAuth.session) {
    console.log(`ASHA Email: ${ASHA_EMAIL} logged in successfully.`);
    console.log(`  - UUID: ${ashaAuth.user.id} (Expected: 4d62b3a7-46d1-47b1-9fc6-b0146d9d27c8)`);
    console.log(`  - Role metadata: ${ashaAuth.user.user_metadata.role} (Expected: asha)`);
    
    if (ashaAuth.user.id !== '4d62b3a7-46d1-47b1-9fc6-b0146d9d27c8' || ashaAuth.user.user_metadata.role !== 'asha') {
      console.log("  ❌ ASHA UUID or role metadata MISMATCH!");
      allPass = false;
    }

    const { data: ashaProf } = await ashaClient.from('asha_workers').select('*').eq('user_id', ashaAuth.user.id).maybeSingle();
    if (ashaProf) {
      console.log(`  - Profile Link: FOUND (ID: ${ashaProf.id}, Name: ${ashaProf.name})`);
      
      const { data: ass } = await ashaClient.from('asha_village_assignments').select('*').eq('asha_id', ashaProf.id).eq('village_id', 'e1111111-1111-1111-1111-111111111111').maybeSingle();
      if (ass) {
        console.log(`  - Village assignment: CORRECT (Linked to: e1111111-1111-1111-1111-111111111111)`);
      } else {
        console.log(`  ❌ Village assignment: MISMATCH OR MISSING!`);
        allPass = false;
      }
    } else {
      console.log("  ❌ Profile Link: MISSING in public.asha_workers!");
      allPass = false;
    }
  } else {
    console.log("  ❌ ASHA Login failed.");
    allPass = false;
  }

  // 2. STAFF
  const staffClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: staffAuth } = await staffClient.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  if (staffAuth.session) {
    console.log(`\nSTAFF Email: ${STAFF_EMAIL} logged in successfully.`);
    console.log(`  - UUID: ${staffAuth.user.id} (Expected: f810c565-4a22-4355-96be-893213a5ffc5)`);
    console.log(`  - Role metadata: ${staffAuth.user.user_metadata.role} (Expected: hospital_staff)`);
    
    if (staffAuth.user.id !== 'f810c565-4a22-4355-96be-893213a5ffc5' || staffAuth.user.user_metadata.role !== 'hospital_staff') {
      console.log("  ❌ STAFF UUID or role metadata MISMATCH!");
      allPass = false;
    }

    const { data: staffProf } = await staffClient.from('hospital_staff').select('*').eq('user_id', staffAuth.user.id).maybeSingle();
    if (staffProf) {
      console.log(`  - Profile Link: FOUND (ID: ${staffProf.id}, Name: ${staffProf.name})`);
      if (staffProf.facility_id === 'f1111111-1111-1111-1111-111111111111') {
        console.log(`  - Facility assignment: CORRECT (Linked to: f1111111-1111-1111-1111-111111111111)`);
      } else {
        console.log(`  ❌ Facility assignment: MISMATCH! Got: ${staffProf.facility_id}`);
        allPass = false;
      }
    } else {
      console.log("  ❌ Profile Link: MISSING in public.hospital_staff!");
      allPass = false;
    }
  } else {
    console.log("  ❌ STAFF Login failed.");
    allPass = false;
  }

  // 3. DOCTOR
  const docClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: docAuth } = await docClient.auth.signInWithPassword({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });
  if (docAuth.session) {
    console.log(`\nDOCTOR Email: ${DOCTOR_EMAIL} logged in successfully.`);
    console.log(`  - UUID: ${docAuth.user.id} (Expected: c40b1787-8ff4-48eb-b5c9-2fc9ce8fa108)`);
    console.log(`  - Role metadata: ${docAuth.user.user_metadata.role} (Expected: doctor)`);
    
    if (docAuth.user.id !== 'c40b1787-8ff4-48eb-b5c9-2fc9ce8fa108' || docAuth.user.user_metadata.role !== 'doctor') {
      console.log("  ❌ DOCTOR UUID or role metadata MISMATCH!");
      allPass = false;
    }

    const { data: docProf } = await docClient.from('doctors').select('*').eq('user_id', docAuth.user.id).maybeSingle();
    if (docProf) {
      console.log(`  - Profile Link: FOUND (ID: ${docProf.id}, Name: ${docProf.name})`);
      if (docProf.facility_id === 'f1111111-1111-1111-1111-111111111111') {
        console.log(`  - Facility assignment: CORRECT (Linked to: f1111111-1111-1111-1111-111111111111)`);
      } else {
        console.log(`  ❌ Facility assignment: MISMATCH! Got: ${docProf.facility_id}`);
        allPass = false;
      }
    } else {
      console.log("  ❌ Profile Link: MISSING in public.doctors!");
      allPass = false;
    }
  } else {
    console.log("  ❌ DOCTOR Login failed.");
    allPass = false;
  }

  console.log(`\nFINAL VERIFICATION STATUS: ${allPass ? "PASS" : "FAIL"}`);
}

runCheck();
