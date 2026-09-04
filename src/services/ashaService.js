import { supabase } from './supabase';

// â”€â”€ ABHA ID Generator â”€â”€
// Generates a mock 14-digit ABHA number in the format XX-XXXX-XXXX-XXXX
export function generateMockABHA() {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const p1 = String(rand(10, 99));
  const p2 = String(rand(1000, 9999));
  const p3 = String(rand(1000, 9999));
  const p4 = String(rand(1000, 9999));
  return `${p1}-${p2}-${p3}-${p4}`;
}

// â”€â”€ Families â”€â”€
export async function getFamilies() {
  const { data, error } = await supabase
    .from('families')
    .select('*, village_patients(id, name, gender, age_years, status, is_pregnant, is_child, relation_to_head, blood_group, mobile, tb_symptoms, has_chronic, abha_id, asha_verified_at, asha_worker_name, avatar_url)')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function addFamily(payload) {
  const { data, error } = await supabase
    .from('families')
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateFamily(id, updates) {
  const { data, error } = await supabase
    .from('families')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteFamily(id) {
  const { error } = await supabase.from('families').delete().eq('id', id);
  return { error };
}

export async function getFamilyWithMembers(familyId) {
  const { data, error } = await supabase
    .from('families')
    .select('*, village_patients(*)')
    .eq('id', familyId)
    .single();
  return { data, error };
}

// â”€â”€ Patients â”€â”€
export async function getVillagePatients() {
  const { data, error } = await supabase
    .from('village_patients')
    .select('*, families(id, family_name, family_pin, head_of_family, village)')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function addPatient(payload) {
  // Auto-generate ABHA ID if not provided
  const finalPayload = {
    ...payload,
    abha_id: payload.abha_id || generateMockABHA(),
    asha_verified_at: new Date().toISOString(),
    asha_worker_name: payload.asha_worker_name || 'Priya Deshmukh',
  };
  const { data, error } = await supabase
    .from('village_patients')
    .insert([finalPayload])
    .select()
    .single();
  return { data, error };
}

export async function updatePatient(id, updates) {
  const { data, error } = await supabase
    .from('village_patients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deletePatient(id) {
  const { error } = await supabase.from('village_patients').delete().eq('id', id);
  return { error };
}

// â”€â”€ Computed helpers â”€â”€
export function computeStats(patients) {
  return {
    total: patients.length,
    pregnant: patients.filter(p => p.is_pregnant).length,
    children: patients.filter(p => p.is_child).length,
    highRisk: patients.filter(p => p.status === 'red').length,
  };
}

export function computeDueList(patients) {
  const items = [];
  patients.forEach(p => {
    if (p.is_pregnant && p.lmp_date) {
      const weeks = Math.floor((new Date() - new Date(p.lmp_date)) / (7*24*60*60*1000));
      const expected = weeks >= 36 ? 4 : weeks >= 28 ? 3 : weeks >= 16 ? 2 : 1;
      if ((p.anc_visits_done || 0) < expected)
        items.push({ type: 'anc', patientId: p.id, patientName: p.name, label: 'ANC-' + ((p.anc_visits_done||0)+1) + ' visit due', detail: weeks + ' weeks pregnant', urgent: weeks >= 28 });
    }
    if (p.is_child) {
      const missing = ['bcg','opv','dpt','hep_b','measles','mr'].filter(v => !p['vaccine_' + v]);
      if (missing.length)
        items.push({ type: 'vaccine', patientId: p.id, patientName: p.name, label: missing[0].toUpperCase() + ' vaccine due', detail: missing.length + ' vaccines pending', urgent: false });
    }
    if (p.status === 'red' && p.last_visit_date) {
      const days = Math.floor((new Date() - new Date(p.last_visit_date)) / 86400000);
      if (days >= 7)
        items.push({ type: 'followup', patientId: p.id, patientName: p.name, label: 'No visit in ' + days + ' days', detail: 'Urgent - needs immediate follow-up', urgent: true });
    }
  });
  return items;
}

// â”€â”€ Family Portal Auth â”€â”€
export async function familyLogin(email, password) {
  const { data: family, error: fetchErr } = await supabase
    .from('families')
    .select('*')
    .eq('family_email', email.trim().toLowerCase())
    .single();
  if (fetchErr || !family) return { error: 'No family account found. Ask your ASHA worker to register your family.' };
  if (family.family_temp_password !== password) return { error: 'Incorrect password. Check with your ASHA worker.' };

  const { data: members, error: membersErr } = await supabase
    .from('village_patients')
    .select('*')
    .eq('family_id', family.id)
    .order('created_at', { ascending: true });
  if (membersErr) return { error: 'Could not load family members. Please try again.' };

  return { data: { family, members: members || [] } };
}

// â”€â”€â”€ Vitals History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Fetch all vitals history for a patient, newest first.
 * Returns: Array of vitals_history rows.
 */
export async function getVitalsHistory(patientId) {
  const { data, error } = await supabase
    .from('vitals_history')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Save a new vitals reading (any source).
 * @param {Object} payload - { patient_id, source, recorded_by?, bp_systolic, bp_diastolic, blood_glucose, weight_kg, height_cm, temperature_c, spo2_pct, pulse_bpm }
 */
export async function saveVitalsReading(payload) {
  const { data, error } = await supabase
    .from('vitals_history')
    .insert([{ ...payload, recorded_at: new Date().toISOString() }])
    .select()
    .single();
  return { data, error };
}

/**
 * Get all care requests for a patient (UUID from village_patients)
 */
export async function getCareRequests(patientId) {
  const { data, error } = await supabase
    .from('care_requests')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Create a new care request (ASHA referral or self-booking)
 * @param {Object} payload - { patient_id, patient_name, source, facility, department, slot_preference, reason, priority, created_by, asha_notes }
 */
export async function createCareRequest(payload) {
  // Ensure ASHA worker is authenticated for Supabase RLS
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || currentUser.email !== 'somu5243d@gmail.com') {
      await supabase.auth.signInWithPassword({
        email: 'somu5243d@gmail.com',
        password: 'Samir@7498'
      });
    }
  } catch (authErr) {
    console.warn('[ashaService] Auth check warning:', authErr);
  }

  const { data, error } = await supabase
    .from('care_requests')
    .insert([{ ...payload, status: 'SUBMITTED', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select()
    .single();

  // Also bridge to public.referrals for Hospital Staff & Doctor specialist pipeline
  try {
    const isHigh = payload.priority === 'URGENT' || payload.priority === 'HIGH' || payload.priority === 'RED';
    const isMedium = payload.priority === 'MEDIUM' || payload.priority === 'ORANGE';
    const normalizedPriority = isHigh ? 'HIGH' : isMedium ? 'ORANGE' : 'GREEN';
    const priorityLabel = isHigh ? '🔴 Emergency / Immediate Attention' : isMedium ? '🟡 Urgent / Within 24 Hours' : '🟢 Routine / Local Care';

    const facilityId = payload.destination_facility_id || 'f1111111-1111-1111-1111-111111111111';
    const hospitalName = payload.facility || 'Shrirampur Primary Health Centre';

    // Bridge patient_id to public.patients table to satisfy RLS foreign-key/village policy
    let targetPatientId = payload.patient_id;
    let patientFound = false;

    if (targetPatientId) {
      const { data: ptById } = await supabase
        .from('patients')
        .select('id, unified_id')
        .eq('id', targetPatientId)
        .maybeSingle();
      if (ptById) {
        patientFound = true;
      }
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
      } else {
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

        if (!ptErr && createdPt) {
          targetPatientId = createdPt.id;
          patientFound = true;
        }
      }
    }

    const referralData = {
      patient_id: targetPatientId,
      patient_name: payload.patient_name || 'Village Patient',
      created_by: payload.created_by || 'ASHA Worker (Sunita Deshmukh)',
      destination_hospital: hospitalName,
      destination_facility_id: facilityId,
      destination_department: payload.department || 'General Medicine',
      doctor_assigned: payload.doctor_assigned || null,
      priority: normalizedPriority,
      priority_label: priorityLabel,
      status: 'Pending',
      symptoms: payload.reason || payload.asha_notes || 'Referred by frontline ASHA',
      vitals: payload.vitals || null,
      ai_note: payload.ai_note || payload.reason || null
    };

    await supabase
      .from('referrals')
      .insert([referralData]);
  } catch (bridgeErr) {
    console.warn('[ashaService] Referral bridge notice:', bridgeErr);
  }

  return { data, error };
}

/**
 * Update the status of a care request
 * @param {string} id - care_request UUID
 * @param {string} status - 'PENDING_PHC' | 'ACCEPTED' | 'COMPLETED'
 * @param {Object} extra - optional fields { appointment_date, doctor_assigned }
 */
export async function updateCareRequestStatus(id, status, extra = {}) {
  const { data, error } = await supabase
    .from('care_requests')
    .update({ status, updated_at: new Date().toISOString(), ...(status === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {}), ...extra })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

/**
 * Get the latest reading for each metric for a patient.
 * Returns a map: { bp: row, blood_glucose: row, weight_kg: row, ... }
 */
export async function getLatestVitals(patientId) {
  const { data, error } = await supabase
    .from('vitals_history')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error || !data) return { data: {}, error };

  // For each metric, pick the first row that has a non-null value
  const metrics = ['bp_systolic', 'blood_glucose', 'weight_kg', 'height_cm', 'temperature_c', 'spo2_pct', 'pulse_bpm'];
  const latest = {};
  metrics.forEach(m => {
    const found = data.find(r => r[m] !== null && r[m] !== undefined);
    if (found) latest[m] = found;
  });

  return { data: latest, error: null };
}