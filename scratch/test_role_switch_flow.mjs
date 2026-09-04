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

const ASHA_CREDS = { email: "somu5243d@gmail.com", password: "Samir@7498" };
const STAFF_CREDS = { email: "myanawar5243d@gmail.com", password: "Samir@135" };
const DOCTOR_CREDS = { email: "samir5243d@gmail.com", password: "Samir@8806" };

async function testRoleSwitchFlow() {
  console.log("=== RADVAULT: TESTING DEMO PORTAL ROLE SWITCH & AUTH PIPELINE ===");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

  // 1. Start in ASHA Portal
  console.log("\n1. Switching to ASHA Portal...");
  console.log("[RADVAULT][DEMO_ROLE_SWITCH] targetRole = asha");
  console.log("[RADVAULT][DEMO_AUTH] authentication started");
  const { data: ashaAuth, error: ashaAuthErr } = await supabase.auth.signInWithPassword(ASHA_CREDS);
  if (ashaAuthErr) {
    console.error("❌ ASHA login failed:", ashaAuthErr.message);
    process.exit(1);
  }
  console.log(`[RADVAULT][DEMO_AUTH] authenticated user = ${ashaAuth.user.id}`);
  console.log(`[RADVAULT][DEMO_AUTH] role = asha`);
  console.log(`[RADVAULT][DEMO_AUTH] session established = true`);

  // Create Patient & Emergency Referral as ASHA
  const timestamp = Date.now().toString().slice(-4);
  const patientName = `Demo Portal Test Patient ${timestamp}`;
  const { data: patient, error: patErr } = await supabase
    .from('patients')
    .insert([{
      full_name: patientName,
      unified_id: `MH-P-${Math.floor(10000 + Math.random() * 90000)}`,
      age: 52,
      gender: 'Male',
      village_id: 'e1111111-1111-1111-1111-111111111111',
      area_id: 'd2222222-2222-2222-2222-222222222222',
      phone_number: '9822000000',
      vitals: { bp: '170/110', spo2: '90', temp: '101.5', pulse: '120' }
    }])
    .select()
    .single();

  if (patErr || !patient) {
    console.error("❌ Patient creation failed:", patErr?.message);
    process.exit(1);
  }

  const facilityId = 'f1111111-1111-1111-1111-111111111111'; // Shrirampur Primary Health Centre
  const { data: referral, error: refErr } = await supabase
    .from('referrals')
    .insert([{
      patient_id: patient.id,
      patient_name: patient.full_name,
      created_by: 'ASHA Worker: Sunita',
      destination_facility_id: facilityId,
      destination_hospital: 'Shrirampur Primary Health Centre',
      destination_department: 'Emergency & Trauma',
      doctor_assigned: 'On-Duty Specialist',
      priority: 'HIGH',
      priority_label: '🔴 RED — Immediate Emergency',
      status: 'Pending',
      symptoms: 'Sudden onset severe chest pain radiating to left shoulder, diaphoresis.',
      vitals: { bp: '170/110', spo2: '90', temp: '101.5', pulse: '120' },
      ai_note: 'Emergency ACS protocol. Requires immediate PHC intake and specialist consultation.'
    }])
    .select()
    .single();

  if (refErr || !referral) {
    console.error("❌ Referral creation failed:", refErr?.message);
    process.exit(1);
  }
  console.log(`✅ ASHA created Real Emergency Referral [${referral.id}] for [${patient.full_name}] at Facility [${facilityId}]`);

  // 2. Switch to Hospital Staff Portal via Demo Switcher
  console.log("\n2. Switching to Hospital Staff Portal via Demo Portals...");
  console.log("[RADVAULT][DEMO_ROLE_SWITCH] targetRole = hospital_staff");
  console.log("[RADVAULT][DEMO_AUTH] authentication started");
  const { data: staffAuth, error: staffAuthErr } = await supabase.auth.signInWithPassword(STAFF_CREDS);
  if (staffAuthErr) {
    console.error("❌ Hospital Staff login failed:", staffAuthErr.message);
    process.exit(1);
  }
  console.log(`[RADVAULT][DEMO_AUTH] authenticated user = ${staffAuth.user.id}`);
  console.log(`[RADVAULT][DEMO_AUTH] role = hospital_staff`);
  console.log(`[RADVAULT][DEMO_AUTH] session established = true`);

  // Hospital Staff Profile Resolution
  const { data: staffProfile, error: staffProfErr } = await supabase
    .from('hospital_staff')
    .select('*, facilities(*)')
    .eq('user_id', staffAuth.user.id)
    .maybeSingle();

  if (staffProfErr || !staffProfile) {
    console.error("❌ Staff profile lookup failed:", staffProfErr?.message);
    process.exit(1);
  }

  console.log(`✅ Staff Profile Resolved -> Name: "${staffProfile.name}", Facility: "${staffProfile.facilities?.name}" (${staffProfile.facility_id})`);

  // Hospital Staff Query Referrals
  const { data: staffReferrals, error: staffRefErr } = await supabase
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', staffProfile.facility_id)
    .order('created_at', { ascending: false });

  if (staffRefErr) {
    console.error("❌ Staff referrals query error:", staffRefErr.message);
    process.exit(1);
  }

  console.log(`[RADVAULT][PHC_REFERRAL_LOAD] user id = ${staffAuth.user.id}, staff profile = ${staffProfile.name}, facility id = ${staffProfile.facility_id}, referrals loaded = ${staffReferrals?.length || 0}`);

  const targetFound = staffReferrals?.find(r => r.id === referral.id);
  if (!targetFound) {
    console.error(`❌ Referral [${referral.id}] NOT found in Hospital Staff queue!`);
    process.exit(1);
  }

  console.log(`✅ Emergency Referral [${referral.id}] IS VISIBLE IN PHC QUEUE!`);
  console.log(`   Patient: ${targetFound.patient_name}`);
  console.log(`   Priority: ${targetFound.priority} (${targetFound.priority_label})`);
  console.log(`   Status: ${targetFound.status}`);
  console.log(`   Facility: ${targetFound.destination_hospital}`);

  // 3. Switch to Doctor Portal via Demo Switcher
  console.log("\n3. Switching to Doctor Portal via Demo Portals...");
  console.log("[RADVAULT][DEMO_ROLE_SWITCH] targetRole = doctor");
  console.log("[RADVAULT][DEMO_AUTH] authentication started");
  const { data: docAuth, error: docAuthErr } = await supabase.auth.signInWithPassword(DOCTOR_CREDS);
  if (docAuthErr) {
    console.error("❌ Doctor login failed:", docAuthErr.message);
    process.exit(1);
  }
  console.log(`[RADVAULT][DEMO_AUTH] authenticated user = ${docAuth.user.id}`);
  console.log(`[RADVAULT][DEMO_AUTH] role = doctor`);
  console.log(`[RADVAULT][DEMO_AUTH] session established = true`);

  const { data: docProfile } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', docAuth.user.id)
    .maybeSingle();

  console.log(`✅ Doctor Profile Resolved -> Name: "${docProfile.name}", Facility: ${docProfile.facility_id}`);

  console.log("\n==================================================");
  console.log("🎉 ALL ROLE SWITCHING & AUTHENTICATION TESTS PASSED!");
  console.log("==================================================");
}

testRoleSwitchFlow();
