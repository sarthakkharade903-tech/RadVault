import { supabase, ensureRoleAuth } from './supabase';

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

// ── Clinical Patients Bridge ──
export async function ensureClinicalPatient(patient) {
  if (!patient || !patient.id) return null;

  // 1. Check if patient already exists in patients table by exact ID
  const { data: existing } = await supabase
    .from('patients')
    .select('id, unified_id, full_name, age, gender, phone_number, blood_group')
    .eq('id', patient.id)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // 2. Generate a collision-free unified_id
  let unifiedId = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `MH-P-${Math.floor(10000 + Math.random() * 90000)}`;
    const { data: collision } = await supabase
      .from('patients')
      .select('id')
      .eq('unified_id', candidate)
      .maybeSingle();
    if (!collision) {
      unifiedId = candidate;
      break;
    }
  }
  if (!unifiedId) unifiedId = `MH-P-${Date.now().toString().slice(-5)}`;

  // 3. Insert new clinical patient row with id equal to village_patient.id
  const clinicalPayload = {
    id: patient.id,
    unified_id: unifiedId,
    full_name: patient.name || patient.full_name || 'Village Resident',
    age: patient.age_years || patient.age || 30,
    gender: patient.gender || 'Other',
    blood_group: patient.blood_group || null,
    phone_number: patient.mobile || patient.phone || patient.phone_number || '9876543210',
    village_id: 'e1111111-1111-1111-1111-111111111111',
    vitals: patient.vitals || {}
  };

  const { data: created, error } = await supabase
    .from('patients')
    .insert([clinicalPayload])
    .select()
    .single();

  if (error) {
    console.error('[ashaService] Clinical patient sync error:', error.message);
    throw error;
  }

  return created;
}

export async function addPatient(payload) {
  await ensureRoleAuth('asha');
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

  if (error) return { data: null, error };

  // Synchronize clinical patient record with identical UUID
  if (data?.id) {
    try {
      await ensureClinicalPatient(data);
    } catch (syncErr) {
      console.warn('[ashaService] ensureClinicalPatient sync warning on registration:', syncErr.message);
    }
  }

  return { data, error: null };
}

export async function updatePatient(id, updates) {
  await ensureRoleAuth('asha');
  const { data, error } = await supabase
    .from('village_patients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error };

  if (data?.id) {
    try {
      await supabase
        .from('patients')
        .update({
          full_name: data.name,
          age: data.age_years || 30,
          gender: data.gender || 'Other',
          blood_group: data.blood_group || null,
          phone_number: data.mobile || '9876543210'
        })
        .eq('id', data.id);
    } catch (syncErr) {
      console.warn('[ashaService] Clinical patient update sync warning:', syncErr.message);
    }
  }

  return { data, error: null };
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
  await ensureRoleAuth('asha');

  try {
    // 1. Resolve or create clinical patient with exact same UUID (deterministic bridge)
    let clinicalPt = null;
    if (payload.patient_id) {
      clinicalPt = await ensureClinicalPatient({
        id: payload.patient_id,
        name: payload.patient_name,
        age: payload.age,
        gender: payload.gender,
        blood_group: payload.blood_group,
        phone: payload.phone,
        vitals: payload.vitals
      });
    }
    const targetPatientId = clinicalPt?.id || payload.patient_id;

    // 2. Insert into care_requests — ONLY columns present in care_requests schema
    const careRequestPayload = {
      patient_id: targetPatientId,
      patient_name: payload.patient_name || clinicalPt?.full_name || 'Village Patient',
      source: payload.source || 'ASHA_REFERRED',
      created_by: payload.created_by || 'ASHA Worker (Priya Deshmukh)',
      facility: payload.facility || payload.destination_hospital || 'Shrirampur Primary Health Centre',
      department: payload.department || payload.destination_department || 'General Medicine',
      slot_preference: payload.slot_preference || null,
      appointment_date: payload.appointment_date || null,
      doctor_assigned: payload.doctor_assigned || null,
      priority: payload.priority || 'MEDIUM',
      reason: payload.reason || payload.symptoms || payload.asha_notes || 'Triage Referral Assessment',
      asha_notes: payload.asha_notes || payload.reason || null,
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: careReqData, error: careReqErr } = await supabase
      .from('care_requests')
      .insert([careRequestPayload])
      .select()
      .single();

    if (careReqErr) {
      console.error('[ashaService] care_requests insert error:', careReqErr.message);
      return { data: null, error: careReqErr };
    }

    // 3. Insert into referrals — with columns present in referrals schema
    const isHigh = payload.priority === 'URGENT' || payload.priority === 'HIGH' || payload.priority === 'RED';
    const isMedium = payload.priority === 'MEDIUM' || payload.priority === 'ORANGE';
    const normalizedPriority = isHigh ? 'HIGH' : isMedium ? 'ORANGE' : 'GREEN';
    const priorityLabel = isHigh ? '🔴 Emergency / Immediate Attention' : isMedium ? '🟡 Urgent / Within 24 Hours' : '🟢 Routine / Local Care';

    const hospitalName = payload.facility || payload.destination_hospital || 'Shrirampur Primary Health Centre';
    const facilityId = payload.destination_facility_id || 'f1111111-1111-1111-1111-111111111111';

    const referralData = {
      patient_id: targetPatientId,
      patient_name: payload.patient_name || clinicalPt?.full_name || 'Village Patient',
      created_by: payload.created_by || 'ASHA Worker (Priya Deshmukh)',
      destination_hospital: hospitalName,
      destination_facility_id: facilityId,
      destination_department: payload.department || payload.destination_department || 'General Medicine',
      doctor_assigned: payload.doctor_assigned || null,
      priority: normalizedPriority,
      priority_label: priorityLabel,
      status: 'Pending',
      symptoms: payload.reason || payload.symptoms || payload.asha_notes || 'Referred by frontline ASHA',
      vitals: payload.vitals || null,
      ai_note: payload.ai_note || payload.reason || null
    };

    const { data: createdRef, error: refErr } = await supabase
      .from('referrals')
      .insert([referralData])
      .select()
      .single();

    if (refErr) {
      console.error('[ashaService] referral insert error:', refErr.message);
      return { data: null, error: refErr };
    }

    // 4. Record encounter (best effort)
    try {
      await supabase.from('encounters').insert([{
        patient_id: targetPatientId,
        asha_id: 'a3333333-3333-3333-3333-333333333333',
        date: new Date().toISOString(),
        complaint: payload.reason || payload.asha_notes || 'Triage Referral Assessment',
        symptoms: [payload.reason || 'Frontline Triage Assessment'],
        vitals: payload.vitals || {},
        priority: normalizedPriority,
        priority_label: priorityLabel,
        outcome: 'REFERRAL_CREATED',
        referral_id: createdRef?.id || null
      }]);
    } catch (encErr) {
      console.warn('[ashaService] encounter insert skipped:', encErr);
    }

    return { data: createdRef || careReqData, error: null };
  } catch (bridgeErr) {
    console.error('[ashaService] Referral bridge error:', bridgeErr);
    return { data: null, error: bridgeErr };
  }
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

/**
 * Fetch all doctor-recommended follow-up tasks from consultations table.
 */
export async function getDoctorFollowUps() {
  await ensureRoleAuth('asha');
  try {
    const { data: consData, error: consErr } = await supabase
      .from('consultations')
      .select('*, patients(id, unified_id, full_name, age, gender, phone_number), referrals(destination_hospital, symptoms, priority)')
      .not('follow_up_recommended_date', 'is', null)
      .order('created_at', { ascending: false });

    if (consErr) {
      console.warn('[ashaService] Consultations query warning:', consErr.message);
    }

    if (consData && consData.length > 0) {
      const formatted = consData.map(c => {
        const rxStr = Array.isArray(c.prescriptions) && c.prescriptions.length > 0
          ? `Rx: ${c.prescriptions.map(p => `${p.name || ''} ${p.dose || ''}`).join(', ')}`
          : '';
        const detail = [c.diagnosis, c.treatment_advice, rxStr].filter(Boolean).join(' • ');

        return {
          id: c.id,
          encounterId: c.id,
          patient_id: c.patient_id,
          patientId: c.patient_id,
          patients: c.patients,
          patientName: c.patients?.full_name || 'Village Resident',
          follow_up_date: c.follow_up_recommended_date,
          follow_up_reason: detail || 'Doctor specialist follow-up visit required.',
          priority: c.referrals?.priority || 'HIGH',
          hospital: c.referrals?.destination_hospital || 'Shrirampur Primary Health Centre'
        };
      });
      return { data: formatted, error: null };
    }

    return { data: [], error: null };
  } catch (err) {
    console.error('[ashaService] getDoctorFollowUps error:', err);
    return { data: [], error: err };
  }
}

/**
 * Mark a follow-up encounter or consultation as completed in Supabase / state.
 */
export async function completeFollowUp(encounterOrConsultId, resolutionNote = '') {
  await ensureRoleAuth('asha');
  try {
    // Also record in encounters if applicable
    await supabase
      .from('encounters')
      .update({
        follow_up_completed: true,
        follow_up_completed_at: new Date().toISOString(),
        follow_up_resolution_note: resolutionNote || 'Home visit completed by ASHA worker'
      })
      .eq('id', encounterOrConsultId);
  } catch (e) {
    console.warn('[ashaService] completeFollowUp encounter update skipped:', e);
  }

  return { success: true, error: null };
}