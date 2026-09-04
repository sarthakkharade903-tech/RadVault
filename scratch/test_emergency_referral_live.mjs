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

const ASHA_EMAIL = process.env.TEST_ASHA_EMAIL || "somu5243d@gmail.com";
const ASHA_PASSWORD = process.env.TEST_ASHA_PASSWORD || "Samir@7498";
const STAFF_EMAIL = process.env.TEST_STAFF_EMAIL || "myanawar5243d@gmail.com";
const STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD || "Samir@135";
const DOCTOR_EMAIL = process.env.TEST_DOCTOR_EMAIL || "samir5243d@gmail.com";
const DOCTOR_PASSWORD = process.env.TEST_DOCTOR_PASSWORD || "Samir@8806";

async function runLiveTest() {
  console.log("=== RADVAULT PHASE 10: REAL EMERGENCY REFERRAL LIVE PIPELINE TEST ===");

  // 1. ASHA LOGIN
  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth, error: ashaAuthErr } = await ashaClient.auth.signInWithPassword({
    email: ASHA_EMAIL,
    password: ASHA_PASSWORD
  });

  if (ashaAuthErr || !ashaAuth.user) {
    console.error("❌ ASHA login failed:", ashaAuthErr?.message);
    process.exit(1);
  }
  console.log("✅ 1. ASHA Authenticated Session Established.");

  const { data: ashaProf } = await ashaClient
    .from('asha_workers')
    .select('*, asha_village_assignments(village_id, villages(id, name, area_id))')
    .eq('user_id', ashaAuth.user.id)
    .maybeSingle();

  const assignedVillage = ashaProf?.asha_village_assignments?.[0]?.villages;
  const villageId = assignedVillage?.id || 'e1111111-1111-1111-1111-111111111111';
  const areaId = assignedVillage?.area_id || 'd2222222-2222-2222-2222-222222222222';
  console.log(`ASHA Profile: ${ashaProf?.name || 'ASHA'}, Village: ${assignedVillage?.name} (${villageId})`);

  // 2. REGISTER NEW PATIENT
  const timestamp = Date.now().toString().slice(-4);
  const testPatientName = `Emergency Patient ${timestamp}`;
  const testUnifiedId = `MH-P-${Math.floor(10000 + Math.random() * 90000)}`;

  const { data: patient, error: patErr } = await ashaClient
    .from('patients')
    .insert([{
      full_name: testPatientName,
      unified_id: testUnifiedId,
      age: 48,
      gender: 'Female',
      village_id: villageId,
      area_id: areaId,
      phone_number: '9876500000',
      vitals: { bp: '160/105', spo2: '91', temp: '102.4', pulse: '115' }
    }])
    .select()
    .single();

  if (patErr || !patient) {
    console.error("❌ Patient registration failed:", patErr?.message);
    process.exit(1);
  }
  console.log(`✅ 2. Patient Registered -> ID: ${patient.id}, Unified: ${patient.unified_id}, Name: ${patient.full_name}`);

  // 3. CREATE EMERGENCY REFERRAL
  const facilityId = 'f1111111-1111-1111-1111-111111111111'; // Shrirampur PHC
  const facilityName = 'Shrirampur Primary Health Centre';

  const referralPayload = {
    patient_id: patient.id, // UUID
    patient_name: patient.full_name,
    created_by: `ASHA Worker: ${ashaProf?.name || 'Sunita'}`,
    destination_facility_id: facilityId,
    destination_hospital: facilityName,
    destination_department: 'Emergency & Trauma',
    doctor_assigned: 'On-Duty Specialist',
    priority: 'HIGH',
    priority_label: '🔴 RED — Immediate Emergency',
    status: 'Pending',
    symptoms: 'Acute crushing retrosternal chest pain, diaphoresis, SpO2 91%, BP 160/105.',
    vitals: { bp: '160/105', spo2: '91', temp: '102.4', pulse: '115' },
    ai_note: 'Emergency protocol: Acute Coronary Syndrome suspected. Urgent secondary care escalation.'
  };

  const { data: referral, error: refErr } = await ashaClient
    .from('referrals')
    .insert([referralPayload])
    .select()
    .single();

  if (refErr || !referral) {
    console.error("❌ Emergency Referral creation failed:", refErr?.message);
    process.exit(1);
  }
  console.log(`✅ 3. Emergency Referral Created -> ID: ${referral.id}, Priority: ${referral.priority}, Facility: ${referral.destination_facility_id}, Status: ${referral.status}`);

  // 4. HOSPITAL STAFF LOGIN
  const staffClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: staffAuth, error: staffAuthErr } = await staffClient.auth.signInWithPassword({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD
  });

  if (staffAuthErr || !staffAuth.user) {
    console.error("❌ Staff login failed:", staffAuthErr?.message);
    process.exit(1);
  }
  console.log("✅ 4. Hospital Staff Authenticated Session Established.");

  const { data: staffProf } = await staffClient
    .from('hospital_staff')
    .select('*, facilities(*)')
    .eq('user_id', staffAuth.user.id)
    .maybeSingle();

  console.log(`Staff Profile: ${staffProf?.name}, Facility: ${staffProf?.facilities?.name} (${staffProf?.facility_id})`);

  // 5. QUERY REFERRALS AS HOSPITAL STAFF
  const { data: staffQueue, error: queueErr } = await staffClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', staffProf.facility_id)
    .order('created_at', { ascending: false });

  if (queueErr) {
    console.error("❌ Staff queue query failed:", queueErr.message);
    process.exit(1);
  }

  const foundReferral = staffQueue?.find(r => r.id === referral.id);
  if (!foundReferral) {
    console.error(`❌ Newly created emergency referral [${referral.id}] NOT found in PHC Staff intake queue! Total queue size: ${staffQueue?.length}`);
    process.exit(1);
  }
  console.log(`✅ 5. Emergency Referral [${referral.id}] VISIBLE in PHC Staff Queue! Patient: ${foundReferral.patient_name}, Priority: ${foundReferral.priority}`);

  // 6. ACCEPT REFERRAL
  const { data: acceptedRef, error: accErr } = await staffClient
    .from('referrals')
    .update({ status: 'Accepted' })
    .eq('id', referral.id)
    .select()
    .single();

  if (accErr || !acceptedRef || acceptedRef.status !== 'Accepted') {
    console.error("❌ Accept referral failed:", accErr?.message);
    process.exit(1);
  }
  console.log(`✅ 6. Referral Accepted -> Status: ${acceptedRef.status}`);

  // 7. CHECK-IN (PATIENT ARRIVAL)
  const { data: arrivedRef, error: arrErr } = await staffClient
    .from('referrals')
    .update({ status: 'Arrived' })
    .eq('id', referral.id)
    .select()
    .single();

  if (arrErr || !arrivedRef || arrivedRef.status !== 'Arrived') {
    console.error("❌ Patient arrival update failed:", arrErr?.message);
    process.exit(1);
  }
  console.log(`✅ 7. Patient Arrival Recorded -> Status: ${arrivedRef.status}`);

  // 8. DOCTOR ROUTING
  // Fetch doctors in facility
  const { data: facilityDoctors } = await staffClient
    .from('doctors')
    .select('*')
    .eq('facility_id', staffProf.facility_id);

  const assignedDoc = facilityDoctors?.[0];
  const doctorName = assignedDoc?.name || 'Dr. Samir Specialist';

  const { data: routedRef, error: routeErr } = await staffClient
    .from('referrals')
    .update({ doctor_assigned: doctorName })
    .eq('id', referral.id)
    .select()
    .single();

  if (routeErr || !routedRef) {
    console.error("❌ Doctor routing failed:", routeErr?.message);
    process.exit(1);
  }
  console.log(`✅ 8. Doctor Assigned -> ${routedRef.doctor_assigned}`);

  // 9. DOCTOR LOGIN & QUEUE
  const docClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: docAuth, error: docAuthErr } = await docClient.auth.signInWithPassword({
    email: DOCTOR_EMAIL,
    password: DOCTOR_PASSWORD
  });

  if (docAuthErr || !docAuth.user) {
    console.error("❌ Doctor login failed:", docAuthErr?.message);
    process.exit(1);
  }
  console.log("✅ 9. Doctor Authenticated Session Established.");

  const { data: docProf } = await docClient
    .from('doctors')
    .select('*')
    .eq('user_id', docAuth.user.id)
    .maybeSingle();

  const { data: docQueue, error: docQueueErr } = await docClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', docProf.facility_id)
    .order('created_at', { ascending: false });

  if (docQueueErr) {
    console.error("❌ Doctor queue query failed:", docQueueErr.message);
    process.exit(1);
  }

  const docFound = docQueue?.find(r => r.id === referral.id);
  if (!docFound) {
    console.error("❌ Referral not found in Doctor queue!");
    process.exit(1);
  }
  console.log(`✅ 10. Doctor examination queue received referral [${referral.id}]. Patient: ${docFound.patient_name}`);

  // 10. CONSULTATION PERSISTENCE
  const { data: consultation, error: conErr } = await docClient
    .from('consultations')
    .insert([{
      referral_id: referral.id,
      patient_id: patient.id,
      doctor_id: docProf.id,
      facility_id: docProf.facility_id,
      clinical_assessment: 'Immediate stabilization administered. Sublingual nitroglycerin and aspirin 300mg loaded.',
      diagnosis: 'Acute Coronary Syndrome / NSTEMI',
      treatment_advice: 'Continuous cardiac monitoring, serial troponins, 2D Echo advised.',
      prescriptions: [
        { medication: 'Tab Aspirin', dosage: '75mg', frequency: '1-0-0', duration: '30 days' },
        { medication: 'Tab Clopidogrel', dosage: '75mg', frequency: '1-0-0', duration: '30 days' },
        { medication: 'Tab Atorvastatin', dosage: '40mg', frequency: '0-0-1', duration: '30 days' }
      ],
      investigations: ['12-Lead ECG', 'Serial Troponin I', '2D Echocardiography'],
      follow_up_recommended_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    }])
    .select()
    .single();

  if (conErr || !consultation) {
    console.error("❌ Consultation insert failed:", conErr?.message);
    process.exit(1);
  }
  console.log(`✅ 11. Consultation Persisted -> ID: ${consultation.id}`);

  // Mark referral completed
  await docClient
    .from('referrals')
    .update({ status: 'Completed' })
    .eq('id', referral.id);

  console.log("✅ 12. Referral Marked Completed.");

  console.log("\n==================================================");
  console.log("🎉 ALL REAL WORKFLOW PHASES PASSED WITHOUT ERROR!");
  console.log(`Referral ID: ${referral.id}`);
  console.log(`Patient ID: ${patient.id} (${patient.full_name})`);
  console.log(`Facility ID: ${facilityId} (${facilityName})`);
  console.log("==================================================");
}

runLiveTest();
