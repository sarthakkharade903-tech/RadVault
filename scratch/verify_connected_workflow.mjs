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

const ASHA_CREDS = { email: 'somu5243d@gmail.com', password: 'Samir@7498' };
const STAFF_CREDS = { email: 'myanawar5243d@gmail.com', password: 'Samir@135' };
const DOCTOR_CREDS = { email: 'samir5243d@gmail.com', password: 'Samir@8806' };

async function runEndToEndVerification() {
  console.log('===============================================================');
  console.log('🏥 RADVAULT: VERIFYING REAL CONNECTED WORKFLOW HANDOFF');
  console.log('===============================================================');

  // STEP 1: ASHA Creates Referral
  console.log('\n[STEP 1] ASHA Worker creating emergency referral in Supabase...');
  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth, error: ashaAuthErr } = await ashaClient.auth.signInWithPassword(ASHA_CREDS);
  if (ashaAuthErr) throw new Error('ASHA auth failed: ' + ashaAuthErr.message);

  const { data: pt } = await ashaClient.from('patients').select('id, full_name, unified_id').limit(1).single();
  const facilityId = 'f1111111-1111-1111-1111-111111111111'; // Shrirampur PHC

  const timestamp = Date.now().toString().slice(-4);
  const referralPayload = {
    patient_id: pt.id,
    patient_name: pt.full_name + ' (' + timestamp + ')',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_facility_id: facilityId,
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_department: 'General Medicine',
    doctor_assigned: 'On-Duty Specialist',
    priority: 'HIGH',
    priority_label: '🔴 Emergency / Immediate Attention',
    status: 'Pending',
    symptoms: 'Patient presenting with acute severe fever, fatigue, and chest congestion.',
    vitals: { bp: '135/88', pulse: '94', spo2: '96', temp: '102.1' },
    ai_note: 'Triage priority: High. Immediate clinical evaluation recommended.'
  };

  const { data: createdRef, error: createErr } = await ashaClient
    .from('referrals')
    .insert([referralPayload])
    .select()
    .single();

  if (createErr) throw new Error('Referral creation failed: ' + createErr.message);
  console.log('✅ ASHA Referral Created in Supabase:');
  console.log('   ID: ' + createdRef.id);
  console.log('   Patient: ' + createdRef.patient_name);
  console.log('   Status: ' + createdRef.status + ' | Priority: ' + createdRef.priority);

  // STEP 2: Hospital Staff Accepts Referral
  console.log('\n[STEP 2] Hospital Staff checking queue and accepting referral...');
  const staffClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: staffAuth, error: staffAuthErr } = await staffClient.auth.signInWithPassword(STAFF_CREDS);
  if (staffAuthErr) throw new Error('Staff auth failed: ' + staffAuthErr.message);

  const { data: staffFoundRef } = await staffClient
    .from('referrals')
    .select('*')
    .eq('id', createdRef.id)
    .single();

  if (!staffFoundRef) throw new Error('Referral not found in Hospital Staff queue!');
  console.log('✅ Hospital Staff found incoming referral: ' + staffFoundRef.patient_name);

  const { data: acceptedRef, error: acceptErr } = await staffClient
    .from('referrals')
    .update({ status: 'Accepted' })
    .eq('id', createdRef.id)
    .select()
    .single();

  if (acceptErr || acceptedRef.status !== 'Accepted') throw new Error('Failed to accept referral');
  console.log('✅ Hospital Staff Accepted Referral -> Status: ' + acceptedRef.status);

  // STEP 3: Hospital Staff Marks Arrival & Assigns Doctor
  console.log('\n[STEP 3] Hospital Staff assigning Dr. Arvind Kulkarni...');
  const { data: facilityDocs } = await staffClient
    .from('doctors')
    .select('*')
    .eq('facility_id', facilityId);

  const targetDoc = facilityDocs.find(d => d.name.includes('Kulkarni')) || facilityDocs[0];
  console.log('   Selected Doctor from Facility: ' + targetDoc.name + ' (' + targetDoc.specialty + ')');

  const { data: assignedRef, error: assignErr } = await staffClient
    .from('referrals')
    .update({
      doctor_assigned: targetDoc.name,
      status: 'Assigned'
    })
    .eq('id', createdRef.id)
    .select()
    .single();

  if (assignErr) throw new Error('Doctor assignment failed: ' + assignErr.message);
  console.log('✅ Referral Assigned in Supabase:');
  console.log('   Assigned Doctor: ' + assignedRef.doctor_assigned);
  console.log('   Status: ' + assignedRef.status);

  // STEP 4: Doctor Sees Assigned Patient in Doctor Portal
  console.log('\n[STEP 4] Doctor (Dr. Arvind Kulkarni) logging into Doctor Portal...');
  const docClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: docAuth, error: docAuthErr } = await docClient.auth.signInWithPassword(DOCTOR_CREDS);
  if (docAuthErr) throw new Error('Doctor auth failed: ' + docAuthErr.message);

  const { data: docQueue, error: docQueueErr } = await docClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', facilityId)
    .eq('doctor_assigned', targetDoc.name)
    .order('created_at', { ascending: false });

  if (docQueueErr) throw new Error('Doctor queue fetch failed: ' + docQueueErr.message);

  const docCase = docQueue.find(r => r.id === createdRef.id);
  if (!docCase) throw new Error('Assigned case not visible in Doctor queue!');
  console.log('✅ Doctor sees assigned patient in queue:');
  console.log('   Patient Name: ' + docCase.patient_name);
  console.log('   Priority: ' + docCase.priority + ' (' + docCase.priority_label + ')');
  console.log('   Symptoms: ' + docCase.symptoms);
  console.log('   Vitals: ' + JSON.stringify(docCase.vitals));

  // STEP 5: Doctor Starts Consultation
  console.log('\n[STEP 5] Doctor opens clinical case and starts consultation...');
  const { data: activeConsultationRef, error: startErr } = await docClient
    .from('referrals')
    .update({ status: 'In Consultation' })
    .eq('id', createdRef.id)
    .select()
    .single();

  if (startErr || activeConsultationRef.status !== 'In Consultation') {
    throw new Error('Failed to update status to In Consultation');
  }
  console.log('✅ Doctor Started Consultation -> Status: ' + activeConsultationRef.status);

  // STEP 6: Doctor Signs Consultation
  console.log('\n[STEP 6] Doctor signing consultation and completing case...');
  const consultationPayload = {
    referral_id: createdRef.id,
    patient_id: pt.id,
    doctor_id: targetDoc.id,
    facility_id: facilityId,
    clinical_assessment: 'Clinical check confirms acute upper respiratory infection with mild bronchial inflammation.',
    diagnosis: 'Acute Bronchitis with febrile response',
    treatment_advice: 'Bed rest for 3 days, increase fluid intake, steam inhalation, and oral medications.',
    prescriptions: [
      { name: 'Tab Paracetamol', dose: '650mg', freq: 'Thrice daily', duration: '3 days' },
      { name: 'Tab Amoxicillin', dose: '500mg', freq: 'Twice daily', duration: '5 days' },
      { name: 'Syrup Cough Expectorant', dose: '10ml', freq: 'Twice daily', duration: '5 days' }
    ],
    investigations: ['Complete Blood Count', 'Chest X-Ray PA View'],
    follow_up_recommended_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  };

  const { data: signedCons, error: signErr } = await docClient
    .from('consultations')
    .upsert([consultationPayload], { onConflict: 'referral_id' })
    .select()
    .single();

  if (signErr) throw new Error('Consultation signing failed: ' + signErr.message);
  console.log('✅ Consultation Persisted in Supabase -> Consultation ID: ' + signedCons.id);

  // Update Referral to Completed
  const { data: finalRef, error: finalErr } = await docClient
    .from('referrals')
    .update({ status: 'Completed' })
    .eq('id', createdRef.id)
    .select()
    .single();

  if (finalErr || finalRef.status !== 'Completed') {
    throw new Error('Failed to complete referral');
  }
  console.log('✅ Referral Status Updated -> Completed!');

  console.log('\n===============================================================');
  console.log('🎉 REAL CONNECTED WORKFLOW: END-TO-END VERIFICATION SUCCEEDED!');
  console.log('   ASHA -> Staff Accept & Route -> Doctor Review & Consultation');
  console.log('===============================================================');
}

runEndToEndVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
