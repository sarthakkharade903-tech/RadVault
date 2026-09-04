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
const DOCTOR_CREDS = { email: "samir5243d@gmail.com", password: "Samir@8806" };

async function testClinicalCase() {
  console.log("=== RADVAULT: TESTING DOCTOR CLINICAL CASE FLOW ===");

  const docClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: docAuth, error: authErr } = await docClient.auth.signInWithPassword(DOCTOR_CREDS);

  if (authErr) {
    console.error("❌ Doctor authentication failed:", authErr.message);
    process.exit(1);
  }
  console.log("✅ 1. Doctor Authenticated:", docAuth.user.id);

  // 1. Doctor Profile
  const { data: docProfile } = await docClient
    .from('doctors')
    .select('*, facilities(*)')
    .eq('user_id', docAuth.user.id)
    .single();

  console.log(`✅ 2. Doctor Profile Loaded -> Name: "${docProfile.name}", Specialty: "${docProfile.specialty}", Facility: "${docProfile.facilities?.name}"`);

  // 2. Fetch Active Case
  const { data: cases } = await docClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', docProfile.facility_id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!cases || cases.length === 0) {
    console.error("❌ No referrals in doctor queue to test.");
    process.exit(1);
  }

  const activeCase = cases[0];
  console.log(`✅ 3. Selected Case Loaded -> ID: ${activeCase.id}, Patient: ${activeCase.patient_name}, Priority: ${activeCase.priority}`);

  // 3. Verify Patient History / Consent
  const { data: shares } = await docClient
    .from('patient_record_shares')
    .select('*')
    .eq('patient_id', activeCase.patient_id)
    .eq('doctor_id', docProfile.id)
    .eq('status', 'active');

  console.log(`✅ 4. Consent status checked -> Active shares count: ${shares?.length || 0}`);

  // 4. Test Consultation Signing
  const { data: consultation, error: conErr } = await docClient
    .from('consultations')
    .insert([{
      referral_id: activeCase.id,
      patient_id: activeCase.patient_id,
      doctor_id: docProfile.id,
      facility_id: docProfile.facility_id,
      clinical_assessment: 'Clinical examination confirmed stable vitals. S1S2 present, chest clear.',
      diagnosis: 'Hypertensive crisis under medical management',
      treatment_advice: 'Continue antihypertensive therapy and lifestyle modifications.',
      prescriptions: [
        { id: 'med-1', name: 'Tab Amlodipine', dose: '5mg', freq: 'Once daily', duration: '30 days' },
        { id: 'med-2', name: 'Tab Telmisartan', dose: '40mg', freq: 'Once daily', duration: '30 days' }
      ],
      investigations: ['ECG', 'Serum Creatinine', 'Lipid Profile'],
      follow_up_recommended_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
    }])
    .select()
    .single();

  if (conErr) {
    console.error("❌ Consultation insert failed:", conErr.message);
    process.exit(1);
  }
  console.log(`✅ 5. Consultation Successfully Signed -> Consultation ID: ${consultation.id}`);

  console.log("\n==================================================");
  console.log("🎉 SPECIALIST CLINICAL CASE WORKFLOW VERIFIED!");
  console.log("==================================================");
}

testClinicalCase();
