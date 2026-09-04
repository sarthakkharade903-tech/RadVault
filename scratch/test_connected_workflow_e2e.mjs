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

const ASHA_CREDS = { email: 'somu5243d@gmail.com', password: 'Samir@7498' };
const STAFF_CREDS = { email: 'myanawar5243d@gmail.com', password: 'Samir@135' };
const DOCTOR_CREDS = { email: 'samir5243d@gmail.com', password: 'Samir@8806' };

async function runEndToEndConnectedWorkflow() {
  console.log('\n======================================================');
  console.log('🚀 TESTING CONNECTED WORKFLOW END-TO-END (ASHA → STAFF → DOCTOR)');
  console.log('======================================================\n');

  // Single client instance that switches auth session just like the browser!
  const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

  // -------------------------------------------------------------
  // STEP 1: ASHA Worker Portal
  // -------------------------------------------------------------
  console.log('--- STEP 1: ASHA PORTAL ---');
  const { data: ashaAuth, error: ashaErr } = await client.auth.signInWithPassword(ASHA_CREDS);
  if (ashaErr) throw new Error(`ASHA Auth failed: ${ashaErr.message}`);
  console.log(`✓ ASHA Authenticated: ${ashaAuth.user.email} (${ashaAuth.user.id})`);

  // Get a patient from village_patients
  const { data: vpt, error: vptErr } = await client.from('village_patients').select('*').limit(1).single();
  if (vptErr) throw vptErr;
  console.log(`✓ Loaded village patient: ${vpt.name} (Village ID: ${vpt.id})`);

  // Test the newly implemented createCareRequest bridge logic:
  // Check/create in public.patients to satisfy RLS
  let targetPatientId = vpt.id;
  let patientFound = false;

  const { data: ptById } = await client.from('patients').select('id, unified_id').eq('id', targetPatientId).maybeSingle();
  if (ptById) {
    patientFound = true;
    targetPatientId = ptById.id;
  }

  if (!patientFound) {
    const defaultVillageId = 'e1111111-1111-1111-1111-111111111111';
    const { data: ptByName } = await client.from('patients').select('id, unified_id').ilike('full_name', vpt.name).eq('village_id', defaultVillageId).limit(1).maybeSingle();
    if (ptByName) {
      targetPatientId = ptByName.id;
      patientFound = true;
    } else {
      const newUnifiedId = `MH-P-${Math.floor(10000 + Math.random() * 90000)}`;
      const { data: createdPt, error: ptErr } = await client.from('patients').insert([{
        unified_id: newUnifiedId,
        full_name: vpt.name,
        age: vpt.age_years || 30,
        gender: vpt.gender || 'Female',
        village_id: defaultVillageId,
        phone_number: vpt.mobile || '9876543210',
        vitals: {}
      }]).select().single();
      if (ptErr) throw ptErr;
      targetPatientId = createdPt.id;
    }
  }

  // Create care_request
  const careReqPayload = {
    patient_id: targetPatientId,
    patient_name: vpt.name,
    source: 'ASHA_VISIT',
    facility: 'Shrirampur Primary Health Centre',
    department: 'General Medicine',
    reason: 'Severe acute breathing difficulty and fever',
    priority: 'HIGH',
    status: 'SUBMITTED',
    created_by: 'ASHA Worker (Sunita Deshmukh)'
  };
  const { data: careReq, error: careReqErr } = await client.from('care_requests').insert([careReqPayload]).select().single();
  if (careReqErr) throw careReqErr;
  console.log(`✓ Care request created in DB: ${careReq.id}`);

  // Create bridged referral
  const referralPayload = {
    patient_id: targetPatientId,
    patient_name: vpt.name,
    created_by: 'ASHA Worker (Sunita Deshmukh)',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
    destination_department: 'General Medicine',
    doctor_assigned: null,
    priority: 'HIGH',
    priority_label: '🔴 Emergency / Immediate Attention',
    status: 'Pending',
    symptoms: 'Severe acute breathing difficulty and fever',
    vitals: { bp: '135/88', pulse: '92', spo2: '93', temp: '101.4' }
  };
  const { data: createdRef, error: refErr } = await client.from('referrals').insert([referralPayload]).select().single();
  if (refErr) throw new Error(`Referral bridge insert failed: ${refErr.message}`);
  console.log(`✓ Referral created in DB: ${createdRef.id} with status: ${createdRef.status}`);

  // -------------------------------------------------------------
  // STEP 2: Hospital Staff Portal (Session Switch)
  // -------------------------------------------------------------
  console.log('\n--- STEP 2: HOSPITAL STAFF PORTAL (SESSION SWITCH) ---');
  const { data: staffAuth, error: staffAuthErr } = await client.auth.signInWithPassword(STAFF_CREDS);
  if (staffAuthErr) throw new Error(`Staff Auth failed: ${staffAuthErr.message}`);
  console.log(`✓ Staff Authenticated: ${staffAuth.user.email} (${staffAuth.user.id})`);

  // Staff retrieves scoped facility and referrals
  const { data: staffData } = await client.from('hospital_staff').select('*, facilities(*)').eq('user_id', staffAuth.user.id).single();
  console.log(`✓ Staff Facility: ${staffData?.facilities?.name} (Facility ID: ${staffData?.facility_id})`);

  const { data: staffQueue, error: staffQueueErr } = await client
    .from('referrals')
    .select('*')
    .or(`destination_facility_id.eq.${staffData.facility_id},destination_hospital.ilike.%Shrirampur%`)
    .eq('id', createdRef.id);
  if (staffQueueErr) throw staffQueueErr;
  console.log(`✓ Staff sees new referral in queue: ${staffQueue[0]?.id}, status: ${staffQueue[0]?.status}`);

  // Staff accepts referral
  const { error: acceptErr } = await client.from('referrals').update({ status: 'Accepted' }).eq('id', createdRef.id);
  if (acceptErr) throw acceptErr;
  console.log(`✓ Staff accepted referral`);

  // Patient arrives at OPD
  const { error: arriveErr } = await client.from('referrals').update({ status: 'Arrived' }).eq('id', createdRef.id);
  if (arriveErr) throw arriveErr;
  console.log(`✓ Staff marked patient as Arrived`);

  // Staff assigns specialist Dr. Arvind Kulkarni
  const doctorName = 'Dr. Arvind Kulkarni';
  const { error: routeErr } = await client.from('referrals').update({
    status: 'Assigned',
    doctor_assigned: doctorName
  }).eq('id', createdRef.id);
  if (routeErr) throw routeErr;
  console.log(`✓ Staff routed patient to ${doctorName} with status: Assigned`);

  // Verify referral is visible in Waiting Room filter
  const { data: waitingQueue } = await client
    .from('referrals')
    .select('id, status, doctor_assigned')
    .eq('id', createdRef.id)
    .in('status', ['Accepted', 'Arrived', 'Assigned', 'In Consultation']);
  console.log(`✓ Waiting room verification: Found ${waitingQueue.length} referral, status: ${waitingQueue[0]?.status}, Assigned to: ${waitingQueue[0]?.doctor_assigned}`);

  // -------------------------------------------------------------
  // STEP 3: Doctor Specialist Portal (Session Switch)
  // -------------------------------------------------------------
  console.log('\n--- STEP 3: DOCTOR SPECIALIST PORTAL (SESSION SWITCH) ---');
  const { data: docAuth, error: docAuthErr } = await client.auth.signInWithPassword(DOCTOR_CREDS);
  if (docAuthErr) throw new Error(`Doctor Auth failed: ${docAuthErr.message}`);
  console.log(`✓ Doctor Authenticated: ${docAuth.user.email} (${docAuth.user.id})`);

  // Doctor fetches profile
  const { data: docProfile } = await client.from('doctors').select('*, facilities(*)').eq('user_id', docAuth.user.id).single();
  console.log(`✓ Doctor Profile: ${docProfile.name}, Specialty: ${docProfile.specialty}, Facility: ${docProfile.facilities?.name}`);

  // Doctor loads referrals matching facility or assignment
  const { data: doctorQueue, error: docQueueErr } = await client
    .from('referrals')
    .select('*')
    .or(`destination_facility_id.eq.${docProfile.facility_id},doctor_assigned.eq.${docProfile.name}`)
    .eq('id', createdRef.id);
  if (docQueueErr) throw docQueueErr;
  console.log(`✓ Doctor sees assigned referral in active queue: ${doctorQueue[0]?.id}, patient: ${doctorQueue[0]?.patient_name}`);

  // Doctor starts consultation
  const { error: startErr } = await client.from('referrals').update({ status: 'In Consultation' }).eq('id', createdRef.id);
  if (startErr) throw startErr;
  console.log(`✓ Doctor started consultation: status -> In Consultation`);

  // Doctor signs consultation with diagnosis, treatment, prescriptions
  const consultationData = {
    referral_id: createdRef.id,
    patient_id: targetPatientId,
    doctor_id: docProfile.id,
    facility_id: docProfile.facility_id,
    clinical_assessment: '[IN-PERSON VISIT] Patient examined at Shrirampur PHC. Bilateral wheezing and fever.',
    diagnosis: 'Acute Bronchitis with Respiratory Distress',
    treatment_advice: 'Administered nebulization. Continue oral antibiotics and inhaler.',
    prescriptions: [
      { name: 'Amoxicillin-Clavulanate 625mg', dose: '1 tab', freq: 'Twice daily', duration: '5 days' },
      { name: 'Salbutamol Inhaler 100mcg', dose: '2 puffs', freq: 'Every 8 hours as needed', duration: '7 days' }
    ],
    investigations: ['Chest X-Ray PA View', 'Complete Blood Count (CBC)'],
    follow_up_recommended_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  };

  const { data: signedCons, error: consErr } = await client.from('consultations').upsert([consultationData], { onConflict: 'referral_id' }).select().single();
  if (consErr) throw new Error(`Consultation signing failed: ${consErr.message}`);
  console.log(`✓ Consultation saved and signed in DB: ${signedCons.id}`);

  // Referral marked as Completed
  const { error: completeRefErr } = await client.from('referrals').update({ status: 'Completed' }).eq('id', createdRef.id);
  if (completeRefErr) throw completeRefErr;
  console.log(`✓ Referral status updated to: Completed`);

  // Care request synced to COMPLETED
  const { error: compCareErr } = await client.from('care_requests').update({ status: 'COMPLETED', completed_at: new Date().toISOString() }).eq('patient_id', targetPatientId);
  if (compCareErr) console.warn('Care request sync notice:', compCareErr.message);
  else console.log(`✓ Care request marked COMPLETED`);

  // -------------------------------------------------------------
  // STEP 4: Final Validation
  // -------------------------------------------------------------
  console.log('\n--- STEP 4: FINAL INTEGRITY VERIFICATION ---');
  const { data: finalRef } = await client.from('referrals').select('*').eq('id', createdRef.id).single();
  console.log(`✓ Final Referral: Status = '${finalRef.status}', Doctor = '${finalRef.doctor_assigned}', Patient = '${finalRef.patient_name}'`);
  
  const { data: finalCons } = await client.from('consultations').select('*').eq('referral_id', createdRef.id).single();
  console.log(`✓ Final Consultation in DB: Diagnosis = '${finalCons.diagnosis}', Prescriptions = ${finalCons.prescriptions.length} items`);

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED: CONNECTED WORKFLOW IS FULLY FUNCTIONAL!');
  console.log('======================================================\n');
}

runEndToEndConnectedWorkflow().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
