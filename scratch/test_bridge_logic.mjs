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

async function testBridgeLogic() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  await supabase.auth.signInWithPassword({ email: 'somu5243d@gmail.com', password: 'Samir@7498' });

  // 1. Fetch a village patient from village_patients
  const { data: vpt } = await supabase.from('village_patients').select('*').limit(1).single();
  console.log('Testing with village patient:', vpt.id, vpt.name);

  // 2. Simulated createCareRequest payload
  const payload = {
    patient_id: vpt.id,
    patient_name: vpt.name,
    gender: vpt.gender,
    age: vpt.age_years,
    phone: vpt.mobile,
    source: 'ASHA_VISIT',
    facility: 'Shrirampur Primary Health Centre',
    destination_facility_id: 'f1111111-1111-1111-1111-111111111111',
    department: 'General Medicine',
    reason: 'Severe persistent fever and lethargy',
    priority: 'HIGH',
    created_by: 'ASHA Worker (Sunita Deshmukh)',
    vitals: { bp: '130/85', pulse: 90, temp: 101.2 }
  };

  // 3. Run bridge logic
  let targetPatientId = payload.patient_id;
  let patientFound = false;

  const { data: ptById } = await supabase
    .from('patients')
    .select('id, unified_id')
    .eq('id', targetPatientId)
    .maybeSingle();

  if (ptById) {
    patientFound = true;
    console.log('Found existing in public.patients by ID:', ptById.id);
  }

  if (!patientFound) {
    const defaultVillageId = 'e1111111-1111-1111-1111-111111111111';
    const { data: ptByName } = await supabase
      .from('patients')
      .select('id, unified_id')
      .ilike('full_name', payload.patient_name || '')
      .eq('village_id', defaultVillageId)
      .limit(1)
      .maybeSingle();

    if (ptByName) {
      targetPatientId = ptByName.id;
      patientFound = true;
      console.log('Found existing in public.patients by name:', ptByName.id);
    } else {
      console.log('Creating new bridge row in public.patients...');
      const newUnifiedId = `MH-P-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPatientPayload = {
        unified_id: newUnifiedId,
        full_name: payload.patient_name || 'Village Resident',
        age: payload.age || 30,
        gender: payload.gender || 'Unknown',
        blood_group: payload.blood_group || null,
        phone_number: payload.phone || '9876543210',
        village_id: defaultVillageId,
        vitals: payload.vitals || {}
      };
      const { data: createdPt, error: ptErr } = await supabase
        .from('patients')
        .insert([newPatientPayload])
        .select()
        .single();

      if (ptErr) {
        console.error('Error creating bridge patient:', ptErr);
      } else {
        targetPatientId = createdPt.id;
        patientFound = true;
        console.log('Created bridge patient in public.patients:', createdPt.id);
      }
    }
  }

  // 4. Now insert into referrals
  const referralData = {
    patient_id: targetPatientId,
    patient_name: payload.patient_name,
    created_by: payload.created_by,
    destination_hospital: payload.facility,
    destination_facility_id: payload.destination_facility_id,
    destination_department: payload.department,
    doctor_assigned: null,
    priority: 'HIGH',
    priority_label: '🔴 Emergency / Immediate Attention',
    status: 'Pending',
    symptoms: payload.reason,
    vitals: payload.vitals
  };

  const { data: refCreated, error: refErr } = await supabase
    .from('referrals')
    .insert([referralData])
    .select()
    .single();

  console.log('Referral created successfully:', refCreated?.id, 'Error:', refErr);
}

testBridgeLogic();
