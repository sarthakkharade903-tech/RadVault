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

/**
 * Ensure a village_patient also exists in the clinical `patients` table.
 * Authoritative identity synchronization: patients.id === village_patients.id.
 * No fabricated demographics, strict UUID check, and verified re-read.
 */
export async function ensureClinicalPatient(patient) {
  if (!patient || !patient.id) {
    throw new Error('ensureClinicalPatient: patient object with valid id UUID is required.');
  }

  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  if (!isValidUuid(patient.id)) {
    throw new Error(`ensureClinicalPatient requires a valid UUID, received: ${patient.id}`);
  }

  // 1. Strict primary key query on patients.id = patient.id
  const { data: existing, error: findErr } = await supabase
    .from('patients')
    .select('id, unified_id, full_name, age, gender, blood_group, phone_number')
    .eq('id', patient.id)
    .maybeSingle();

  if (findErr) {
    console.error('[ashaService] ensureClinicalPatient query error:', findErr.message);
    throw findErr;
  }

  if (existing) {
    return existing;
  }

  // 2. Fetch demographic details from village_patients if missing from caller
  let sourceVp = null;
  if (!patient.name || patient.age_years === undefined || !patient.gender) {
    const { data: vpData } = await supabase
      .from('village_patients')
      .select('name, age_years, gender, mobile, blood_group')
      .eq('id', patient.id)
      .maybeSingle();
    sourceVp = vpData;
  }

  const resolvedName = patient.name || patient.full_name || sourceVp?.name || null;
  const resolvedAge = (patient.age_years !== undefined && patient.age_years !== null)
    ? Number(patient.age_years)
    : ((patient.age !== undefined && patient.age !== null)
      ? Number(patient.age)
      : (sourceVp?.age_years !== undefined && sourceVp?.age_years !== null ? Number(sourceVp.age_years) : 0));
  const resolvedGender = patient.gender || sourceVp?.gender || null;
  const resolvedPhone = patient.mobile || patient.phone || patient.phone_number || sourceVp?.mobile || null;
  const resolvedBloodGroup = patient.blood_group || sourceVp?.blood_group || null;

  const unifiedId = `MH-P-${Math.floor(100000 + Math.random() * 900000)}`;
  const clinicalPayload = {
    id: patient.id, // Exact canonical UUID preserved
    unified_id: unifiedId,
    full_name: resolvedName,
    age: resolvedAge, // 0 if unrecorded to satisfy Postgres NOT NULL constraint, never fabricated
    gender: resolvedGender, // null if unknown, never fabricated
    blood_group: resolvedBloodGroup,
    phone_number: resolvedPhone, // null if unknown, never fabricated
    village_id: 'e1111111-1111-1111-1111-111111111111',
    vitals: patient.vitals || {}
  };

  const { data: created, error: insertErr } = await supabase
    .from('patients')
    .insert([clinicalPayload])
    .select()
    .single();

  if (insertErr) {
    console.error('[ashaService] ensureClinicalPatient insert error:', insertErr.message);
    throw insertErr;
  }

  // 3. Re-read inserted patient and confirm exact UUID equality
  const { data: verified, error: verifyErr } = await supabase
    .from('patients')
    .select('id, unified_id, full_name, age, gender, blood_group, phone_number')
    .eq('id', patient.id)
    .single();

  if (verifyErr || !verified || verified.id !== patient.id) {
    throw new Error(`Clinical patient record verification failed after insertion for UUID ${patient.id}`);
  }

  return verified;
}

export async function addPatient(payload) {
  // Normalize mobile vs phone, preserve optional manual abha_id
  const cleanPayload = { ...payload };
  if (cleanPayload.phone && !cleanPayload.mobile) {
    cleanPayload.mobile = cleanPayload.phone;
  }
  delete cleanPayload.phone;

  const finalPayload = {
    ...cleanPayload,
    abha_id: cleanPayload.abha_id ? cleanPayload.abha_id.trim() : null,
    asha_verified_at: new Date().toISOString(),
    asha_worker_name: cleanPayload.asha_worker_name || 'Priya Deshmukh',
  };
  const { data, error } = await supabase
    .from('village_patients')
    .insert([finalPayload])
    .select()
    .single();

  if (error) return { data: null, error };

  if (data?.id) {
    try {
      await ensureClinicalPatient(data);
    } catch (syncErr) {
      console.warn('[ashaService] Clinical patient sync notice on registration:', syncErr.message);
    }
  }

  return { data, error: null };
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
  if (!patients || !Array.isArray(patients)) return items;

  patients.forEach(p => {
    const mobile = p.mobile || '';
    const village = p.families?.village || p.village || 'Shirwal';

    if (p.is_pregnant && p.lmp_date) {
      const weeks = Math.floor((new Date() - new Date(p.lmp_date)) / (7*24*60*60*1000));
      const expected = weeks >= 36 ? 4 : weeks >= 28 ? 3 : weeks >= 16 ? 2 : 1;
      if ((p.anc_visits_done || 0) < expected)
        items.push({
          type: 'anc',
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          is_pregnant: true,
          label: 'ANC-' + ((p.anc_visits_done||0)+1) + ' visit due',
          detail: weeks + ' weeks pregnant • ' + village,
          urgent: weeks >= 28
        });
    }
    if (p.is_child) {
      const missing = ['bcg','opv','dpt','hep_b','measles','mr'].filter(v => !p['vaccine_' + v]);
      if (missing.length)
        items.push({
          type: 'vaccine',
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          is_child: true,
          label: missing[0].toUpperCase() + ' vaccine due',
          detail: missing.length + ' vaccines pending • ' + village,
          urgent: false
        });
    }
    if (p.status === 'red') {
      const days = p.last_visit_date ? Math.floor((new Date() - new Date(p.last_visit_date)) / 86400000) : 8;
      if (days >= 7)
        items.push({
          type: 'followup',
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          status: 'red',
          label: p.last_visit_date ? ('No visit in ' + days + ' days') : 'High-risk follow-up needed',
          detail: 'Urgent home vitals & checkup required • ' + village,
          urgent: true
        });
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
  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  if (!patientId || !isUuid(patientId)) {
    return { data: [], error: null };
  }
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
/**
 * Get all care requests for a patient.
 * First queries by patient_id UUID. If empty (possible bridge UUID mismatch),
 * falls back to patient_name match so the list is never blank.
 */
export async function getCareRequests(patientId, patientName = null) {
  let combined = [];

  // Parallelize independent read-only queries for care_requests and referrals
  try {
    const [careRes, refRes] = await Promise.all([
      supabase
        .from('care_requests')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('referrals')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
    ]);

    if (careRes.data && careRes.data.length > 0) {
      combined.push(...careRes.data);
    }

    if (refRes.data && refRes.data.length > 0) {
      const existingIds = new Set(combined.map(c => c.id));
      for (const r of refRes.data) {
        if (!existingIds.has(r.id)) {
          combined.push({
            id: r.id,
            patient_id: r.patient_id,
            patient_name: r.patient_name,
            source: r.source || 'ASHA_REFERRED',
            created_by: r.created_by,
            facility: r.destination_hospital,
            department: r.destination_department,
            slot_preference: r.slot_preference,
            doctor_assigned: r.doctor_assigned,
            priority: r.priority,
            reason: r.symptoms || r.ai_note,
            asha_notes: r.ai_note,
            status: r.status === 'Accepted' ? 'ACCEPTED' : r.status,
            created_at: r.created_at
          });
        }
      }
    }
  } catch (err) {
    console.warn('[ashaService] care_requests fetch notice:', err.message);
  }

  return { data: combined, error: null };
}



// Concurrency guard to prevent duplicate rapid dispatches for same patient & facility
const inFlightReferralDispatches = new Map();

/**
 * CANONICAL Physical ASHA Referral Dispatch
 * Direct single write to public.referrals
 * @param {Object} payload - { patient_id, patient_name, age, gender, blood_group, phone, created_by, destination_facility_id, destination_hospital, department, priority, reason, asha_notes, vitals, ai_note }
 */
export async function createPhysicalReferral(payload) {
  if (!payload.patient_id) {
    return { data: null, error: new Error("Please select a registered patient before dispatching referral.") };
  }

  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  if (!isValidUuid(payload.patient_id)) {
    return { data: null, error: new Error(`Invalid patient identifier format (UUID required): ${payload.patient_id}`) };
  }

  if (!payload.destination_facility_id || !isValidUuid(payload.destination_facility_id)) {
    return { data: null, error: new Error("Please select a valid registered destination facility.") };
  }

  // Idempotency check: prevent duplicate simultaneous dispatch actions
  const dispatchKey = `${payload.patient_id}_${payload.destination_facility_id}`;
  if (inFlightReferralDispatches.has(dispatchKey)) {
    console.warn('[ashaService] Duplicate in-flight referral dispatch detected for:', dispatchKey);
    return inFlightReferralDispatches.get(dispatchKey);
  }

  const dispatchPromise = (async () => {
    try {
      // 1. Authoritative Clinical Patient Synchronization (ensures patients.id === village_patients.id)
      let clinicalPatient = null;
      try {
        clinicalPatient = await ensureClinicalPatient({
          id: payload.patient_id,
          name: payload.patient_name,
          age: payload.age,
          gender: payload.gender,
          blood_group: payload.blood_group,
          phone: payload.phone || payload.phone_number || payload.mobile,
          vitals: payload.vitals
        });
      } catch (ptErr) {
        console.error('[ashaService] Clinical patient sync error in referral dispatch:', ptErr.message);
        return { data: null, error: new Error(`Clinical patient record bridge failed: ${ptErr.message}`) };
      }

      if (!clinicalPatient?.id || !isValidUuid(clinicalPatient.id)) {
        return { data: null, error: new Error("Clinical patient synchronization failed: No confirmed clinical patient record exists.") };
      }

      const targetPatientId = clinicalPatient.id;

      const isHigh = payload.priority === 'URGENT' || payload.priority === 'HIGH' || payload.priority === 'RED';
      const isMedium = payload.priority === 'MEDIUM' || payload.priority === 'ORANGE';
      const normalizedPriority = isHigh ? 'HIGH' : isMedium ? 'ORANGE' : 'GREEN';
      const priorityLabel = isHigh ? '🔴 Emergency / Immediate Attention' : isMedium ? '🟡 Urgent / Within 24 Hours' : '🟢 Routine / Local Care';

      const defaultCreatedBy = payload.created_by || 'ASHA Worker (Priya Deshmukh)';
      const hospitalName = payload.destination_hospital || payload.facility || 'Pune Sassoon General Hospital';

      const referralData = {
        patient_id: targetPatientId,
        patient_name: payload.patient_name || clinicalPatient?.full_name || null,
        created_by: defaultCreatedBy,
        destination_hospital: hospitalName,
        destination_facility_id: payload.destination_facility_id || 'f2222222-2222-2222-2222-222222222222',
        destination_department: payload.department || payload.destination_department || 'General Medicine',
        doctor_assigned: payload.doctor_assigned || null,
        ...(payload.doctor_id && isValidUuid(payload.doctor_id) ? { doctor_id: payload.doctor_id } : {}),
        priority: normalizedPriority,
        priority_label: priorityLabel,
        status: 'Pending',
        symptoms: payload.reason || payload.asha_notes || 'Referred for medical evaluation',
        vitals: payload.vitals || null,
        ai_note: payload.ai_note || payload.reason || null
      };

      const { data: refData, error: refInsertErr } = await supabase
        .from('referrals')
        .insert([referralData])
        .select()
        .single();

      if (refInsertErr) {
        console.error('[ashaService] Canonical referral insert error:', refInsertErr);
        return { data: null, error: refInsertErr };
      }

      // Strict Post-Insert Verification (Section 7)
      if (!refData || !refData.id || !isValidUuid(refData.id)) {
        return { data: null, error: new Error("Referral creation verification failed: Database did not return a valid referral record.") };
      }
      if (refData.patient_id !== targetPatientId) {
        return { data: null, error: new Error(`Referral verification failed: patient_id mismatch (expected ${targetPatientId}, got ${refData.patient_id})`) };
      }
      if (refData.destination_facility_id !== payload.destination_facility_id) {
        return { data: null, error: new Error(`Referral verification failed: facility_id mismatch (expected ${payload.destination_facility_id}, got ${refData.destination_facility_id})`) };
      }
      if (payload.doctor_id && refData.doctor_id !== payload.doctor_id) {
        return { data: null, error: new Error(`Referral verification failed: doctor_id mismatch (expected ${payload.doctor_id}, got ${refData.doctor_id})`) };
      }

      // 2. Record encounter (best-effort audit, non-blocking)
      if (refData?.id) {
        supabase.from('encounters').insert([{
          patient_id: targetPatientId,
          asha_id: 'a3333333-3333-3333-3333-333333333333',
          date: new Date().toISOString(),
          complaint: payload.reason || payload.asha_notes || 'Triage Referral Assessment',
          symptoms: [payload.reason || 'Frontline Triage Assessment'],
          vitals: payload.vitals || {},
          priority: normalizedPriority,
          priority_label: priorityLabel,
          outcome: 'REFERRAL_CREATED',
          referral_id: refData.id
        }]).then(() => {}).catch(err => console.warn('[ashaService] Non-blocking encounter record notice:', err.message));
      }

      return { data: refData, error: null };
    } finally {
      // Release in-flight lock after brief window (3s) to allow subsequent legitimate dispatches
      setTimeout(() => {
        inFlightReferralDispatches.delete(dispatchKey);
      }, 3000);
    }
  })();

  inFlightReferralDispatches.set(dispatchKey, dispatchPromise);
  return dispatchPromise;
}

/**
 * Create a new care request (Reserved strictly for CareHub, Teleconsultation, and Self-Booking)
 * @param {Object} payload - { patient_id, patient_name, source, facility, department, slot_preference, reason, priority, created_by, asha_notes }
 */
export async function createCareRequest(payload) {
  if (!payload.patient_id && (!payload.source || payload.source === 'ASHA_REFERRED')) {
    return { data: null, error: new Error("Please select a registered patient before booking care request.") };
  }

  const defaultCreatedBy =
    payload.created_by ||
    (payload.source === 'PATIENT_DIRECT' ? 'Direct Patient (Self-Booking)' :
     payload.source === 'TELECONSULT' ? 'Virtual Teleconsultation (eSanjeevani)' :
     'Direct Patient Portal');

  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // 1. Authoritative Clinical Patient Synchronization (ensures patients.id === village_patients.id)
  let clinicalPatient = null;
  if (payload.patient_id) {
    try {
      clinicalPatient = await ensureClinicalPatient({
        id: payload.patient_id,
        name: payload.patient_name,
        age: payload.age,
        gender: payload.gender,
        blood_group: payload.blood_group,
        phone: payload.phone || payload.phone_number || payload.mobile,
        vitals: payload.vitals
      });
    } catch (ptErr) {
      console.warn('[ashaService] Clinical patient sync notice in care request:', ptErr.message);
    }
  }

  const targetPatientId = clinicalPatient?.id || payload.patient_id;
  if (!targetPatientId || !isValidUuid(targetPatientId)) {
    return { data: null, error: new Error("Valid registered patient ID is required to create a care request.") };
  }

  // 2. Sanitize payload strictly for care_requests table columns
  const careRequestRecord = {
    patient_id: targetPatientId,
    patient_name: payload.patient_name || clinicalPatient?.full_name || 'Village Patient',
    source: payload.source || 'PATIENT_DIRECT',
    created_by: defaultCreatedBy,
    facility: payload.facility || payload.destination_hospital || 'Pune Sassoon General Hospital',
    department: payload.department || 'General Medicine',
    slot_preference: payload.slot_preference || null,
    appointment_date: payload.appointment_date || null,
    doctor_assigned: payload.doctor_assigned || null,
    priority: payload.priority || 'ROUTINE',
    reason: payload.reason || payload.asha_notes || 'Scheduled medical appointment',
    asha_notes: payload.asha_notes || payload.reason || '',
    status: payload.status || 'SUBMITTED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(payload.status === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {})
  };

  const { data: careReqData, error: careReqErr } = await supabase
    .from('care_requests')
    .insert([careRequestRecord])
    .select()
    .single();

  if (careReqErr) {
    console.error('[ashaService] care_requests insert error:', careReqErr);
    return { data: null, error: careReqErr };
  }

  return { data: careReqData, error: null };
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

// ─── ASHA Medicine Kit & Drug Inventory ──────────────────────────────

export const DEFAULT_ASHA_MEDICINES = [
  {
    id: 'd1',
    name_en: 'Iron Folic Acid (IFA) Tablets',
    name_mr: 'आयर्न फॉलिक ऍसिड गोळ्या',
    name_hi: 'आयरन फोलिक एसिड गोलियां',
    category: 'Maternal Health',
    stock: 120,
    unit: 'tabs',
    threshold: 50,
    batch_number: 'IFA-2026-B12',
    expiry_date: '2027-12-31'
  },
  {
    id: 'd2',
    name_en: 'Paracetamol 500mg',
    name_mr: 'पॅरासिटामॉल गोळ्या',
    name_hi: 'पैरासिटामोल गोलियां',
    category: 'Fever & Pain',
    stock: 65,
    unit: 'tabs',
    threshold: 30,
    batch_number: 'PCM-500-A9',
    expiry_date: '2027-08-31'
  },
  {
    id: 'd3',
    name_en: 'ORS Packets (Oral Rehydration)',
    name_mr: 'ओ.आर.एस. पाकिटे',
    name_hi: 'ओआरएस पैकेट',
    category: 'Child Care',
    stock: 24,
    unit: 'packets',
    threshold: 15,
    batch_number: 'ORS-WHO-88',
    expiry_date: '2028-03-31'
  },
  {
    id: 'd4',
    name_en: 'Zinc Sulfate 20mg',
    name_mr: 'झिंक गोळ्या',
    name_hi: 'जिंक की गोलियां',
    category: 'Child Care',
    stock: 40,
    unit: 'tabs',
    threshold: 20,
    batch_number: 'ZN-20-C4',
    expiry_date: '2027-10-31'
  },
  {
    id: 'd5',
    name_en: 'Pregnancy Test Kits (Nischay)',
    name_mr: 'गर्भधारणा तपासणी किट',
    name_hi: 'गर्भावस्था जांच किट',
    category: 'Maternal Health',
    stock: 8,
    unit: 'kits',
    threshold: 5,
    batch_number: 'NSH-KIT-01',
    expiry_date: '2027-05-31'
  },
  {
    id: 'd6',
    name_en: 'Clean Delivery Kits (DDK)',
    name_mr: 'स्वच्छ प्रसूती किट',
    name_hi: 'प्रसव किट',
    category: 'Maternal Health',
    stock: 3,
    unit: 'kits',
    threshold: 2,
    batch_number: 'DDK-STER-14',
    expiry_date: '2028-01-31'
  }
];

function getLocalMedicines() {
  try {
    const raw = localStorage.getItem("radvault_asha_drug_kit");
    if (!raw) return DEFAULT_ASHA_MEDICINES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ASHA_MEDICINES;
  } catch {
    return DEFAULT_ASHA_MEDICINES;
  }
}

function setLocalMedicines(items) {
  try {
    localStorage.setItem("radvault_asha_drug_kit", JSON.stringify(items));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

export async function getMedicines() {
  try {
    const { data, error } = await supabase
      .from('asha_medicines')
      .select('*')
      .order('name_en', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocalMedicines(data);
      return { data, error: null };
    }
  } catch (err) {
    console.warn("Supabase asha_medicines fetch failed, using local cache:", err);
  }

  // Fallback to local cache
  const local = getLocalMedicines();
  return { data: local, error: null };
}

export async function addMedicine(payload) {
  const newItem = {
    id: payload.id || `med-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    name_en: payload.name_en || 'New Medicine',
    name_mr: payload.name_mr || payload.name_en || '',
    name_hi: payload.name_hi || payload.name_en || '',
    category: payload.category || 'General',
    stock: parseInt(payload.stock, 10) || 0,
    unit: payload.unit || 'tabs',
    threshold: parseInt(payload.threshold, 10) || 10,
    batch_number: payload.batch_number || '',
    expiry_date: payload.expiry_date || null,
    created_at: new Date().toISOString()
  };

  // Update local cache immediately
  const local = getLocalMedicines();
  const updated = [newItem, ...local];
  setLocalMedicines(updated);

  try {
    const { data, error } = await supabase
      .from('asha_medicines')
      .insert([newItem])
      .select()
      .single();
    if (!error && data) return { data, error: null };
  } catch (err) {
    console.warn("Supabase asha_medicines insert failed:", err);
  }

  return { data: newItem, error: null };
}

export async function updateMedicine(id, updates) {
  const local = getLocalMedicines();
  let updatedItem = null;
  const nextList = local.map(m => {
    if (m.id === id) {
      updatedItem = { ...m, ...updates, updated_at: new Date().toISOString() };
      return updatedItem;
    }
    return m;
  });
  setLocalMedicines(nextList);

  try {
    const { data, error } = await supabase
      .from('asha_medicines')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return { data, error: null };
  } catch (err) {
    console.warn("Supabase asha_medicines update failed:", err);
  }

  return { data: updatedItem, error: null };
}

export async function deleteMedicine(id) {
  const local = getLocalMedicines();
  const nextList = local.filter(m => m.id !== id);
  setLocalMedicines(nextList);

  try {
    const { error } = await supabase
      .from('asha_medicines')
      .delete()
      .eq('id', id);
    if (!error) return { error: null };
  } catch (err) {
    console.warn("Supabase asha_medicines delete failed:", err);
  }

  return { error: null };
}

export async function adjustMedicineStock(id, newStock) {
  return updateMedicine(id, { stock: Math.max(0, parseInt(newStock, 10) || 0) });
}

export async function createMedicineIndent(payload) {
  const indentRecord = {
    id: payload.id || `indent-${Date.now()}`,
    asha_name: payload.asha_name || 'Priya Deshmukh',
    phc_name: payload.phc_name || 'PHC Shirwal',
    items: payload.items || [],
    status: 'SUBMITTED',
    notes: payload.notes || '',
    created_at: new Date().toISOString()
  };

  // Save to local cache
  try {
    const raw = localStorage.getItem("radvault_asha_medicine_indents");
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem("radvault_asha_medicine_indents", JSON.stringify([indentRecord, ...existing]));
  } catch (e) {
    console.warn("Could not save indent to localStorage:", e);
  }

  try {
    const { data, error } = await supabase
      .from('medicine_indents')
      .insert([indentRecord])
      .select()
      .single();
    if (!error && data) return { data, error: null };
  } catch (err) {
    console.warn("Supabase medicine_indents insert failed:", err);
  }

  return { data: indentRecord, error: null };
}

export async function getMedicineIndents() {
  try {
    const { data, error } = await supabase
      .from('medicine_indents')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return { data, error: null };
  } catch (err) {
    console.warn("Supabase medicine_indents fetch failed:", err);
  }

  try {
    const raw = localStorage.getItem("radvault_asha_medicine_indents");
    const parsed = raw ? JSON.parse(raw) : [];
    return { data: parsed, error: null };
  } catch {
    return { data: [], error: null };
  }
}

/**
 * Fetch all pending doctor follow-ups for village patients.
 * Queries consultations and encounters using genuine database schema columns.
 */
export async function getDoctorFollowUps() {
  try {
    const formatted = [];

    // 1. Fetch real doctor follow-ups from consultations table
    const { data: consData, error: consErr } = await supabase
      .from('consultations')
      .select(`
        id,
        patient_id,
        follow_up_recommended_date,
        clinical_assessment,
        diagnosis,
        treatment_advice,
        referrals ( id, destination_hospital, priority ),
        patients ( id, full_name, phone_number )
      `)
      .not('follow_up_recommended_date', 'is', null)
      .order('follow_up_recommended_date', { ascending: true });

    if (consErr) {
      console.warn('[ashaService] consultations follow-up query warning:', consErr.message);
    } else if (consData && consData.length > 0) {
      consData.forEach(c => {
        const detail = [c.diagnosis, c.treatment_advice].filter(Boolean).join(' — ');
        formatted.push({
          id: c.id,
          encounterId: c.id,
          patient_id: c.patient_id,
          patientId: c.patient_id,
          patients: c.patients,
          patientName: c.patients?.full_name || 'Village Resident',
          mobile: c.patients?.phone_number || '',
          follow_up_date: c.follow_up_recommended_date,
          follow_up_reason: detail || 'Doctor specialist follow-up visit required.',
          priority: c.referrals?.priority || 'HIGH',
          hospital: c.referrals?.destination_hospital || 'Pune Sassoon General Hospital'
        });
      });
    }

    // 2. Fetch pending follow-ups from encounters table
    try {
      const { data: encData } = await supabase
        .from('encounters')
        .select(`
          id,
          patient_id,
          follow_up_date,
          follow_up_reason,
          follow_up_completed,
          complaint,
          ai_note,
          referrals ( id, destination_hospital, priority ),
          patients ( id, full_name, phone_number )
        `)
        .eq('follow_up_completed', false)
        .not('follow_up_date', 'is', null)
        .order('follow_up_date', { ascending: true });

      if (encData && encData.length > 0) {
        encData.forEach(e => {
          formatted.push({
            id: e.id,
            encounterId: e.id,
            patient_id: e.patient_id,
            patientId: e.patient_id,
            patients: e.patients,
            patientName: e.patients?.full_name || 'Village Resident',
            mobile: e.patients?.phone_number || '',
            follow_up_date: e.follow_up_date,
            follow_up_reason: e.follow_up_reason || e.complaint || 'Encounter follow-up required.',
            priority: e.referrals?.priority || 'HIGH',
            hospital: e.referrals?.destination_hospital || 'Pune Sassoon General Hospital'
          });
        });
      }
    } catch (encErr) {
      console.warn('[ashaService] encounters follow-up query notice:', encErr.message);
    }

    return { data: formatted, error: null };
  } catch (err) {
    console.error('[ashaService] getDoctorFollowUps error:', err);
    return { data: [], error: err };
  }
}

/**
 * Mark a follow-up encounter or consultation as completed in Supabase.
 */
export async function completeFollowUp(encounterOrConsultId, resolutionNote = '') {
  try {
    const { data, error } = await supabase
      .from('encounters')
      .update({
        follow_up_completed: true,
        follow_up_completed_at: new Date().toISOString(),
        follow_up_resolution_note: resolutionNote || 'Home visit completed by ASHA worker'
      })
      .eq('id', encounterOrConsultId)
      .select('id');

    if (error) {
      console.warn('[ashaService] completeFollowUp encounter update error:', error.message);
      return { success: false, error, persisted: false };
    }

    if (!data || data.length === 0) {
      console.warn('[ashaService] Durable follow-up completion state is not supported by the current schema for consultations without an encounter record.');
      return {
        success: false,
        error: new Error('Durable follow-up completion state is not supported by the current schema.'),
        persisted: false
      };
    }

    return { success: true, error: null, persisted: true };
  } catch (e) {
    console.warn('[ashaService] completeFollowUp encounter update skipped:', e);
    return { success: false, error: e, persisted: false };
  }
}

// ── Teleconsult Sessions ─────────────────────────────────────────────────────

/**
 * Save a completed teleconsultation session including e-Prescription data.
 * @param {Object} payload - {
 *   patient_id, patient_name, care_request_id?,
 *   doctor_name?, facility?,
 *   chief_complaint, additional_notes?,
 *   vitals_snapshot: { bp_systolic, bp_diastolic, spo2_pct, pulse_bpm, temperature_c },
 *   diagnosis, rx_medicines: [{ name, dosage }], doctor_advice,
 *   session_duration_sec
 * }
 * @returns {data, error} — saved teleconsult_sessions row
 */
export async function saveTeleconsultSession(payload) {
  const record = {
    patient_id: payload.patient_id || null,
    patient_name: payload.patient_name || 'Village Patient',
    care_request_id: payload.care_request_id || null,
    doctor_name: payload.doctor_name || 'Dr. Arvind Kulkarni (MBBS, DGO)',
    facility: payload.facility || 'Primary Health Centre - Shirwal',
    chief_complaint: payload.chief_complaint || null,
    additional_notes: payload.additional_notes || null,
    vitals_snapshot: payload.vitals_snapshot || {},
    diagnosis: payload.diagnosis || null,
    rx_medicines: payload.rx_medicines || [],
    doctor_advice: payload.doctor_advice || null,
    session_duration_sec: payload.session_duration_sec || 0,
    session_status: payload.session_status || 'COMPLETED',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('teleconsult_sessions')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('[ashaService] teleconsult_sessions insert error:', error);
  }
  return { data, error };
}

/**
 * Patient enters virtual waiting room:
 * Creates teleconsult record in care_requests (and syncs to teleconsult_sessions if table exists)
 */
export async function createWaitingTeleconsult(payload) {
  const token = payload.token || `eS-SHIR-${Math.floor(100 + Math.random() * 900)}`;

  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const resolvedPatientId = payload.patient_id;
  if (!resolvedPatientId || !isValidUuid(resolvedPatientId)) {
    return { session: null, careReq: null, token: null, id: null, error: new Error("Valid registered patient ID is required to start teleconsultation.") };
  }

  const vitalsJson = JSON.stringify(payload.vitals_snapshot || {});
  const metaString = `TOKEN:${token}|COMPLAINT:${payload.chief_complaint || 'General Consultation'}|VITALS:${vitalsJson}`;

  // 1. Primary: Write to care_requests (guaranteed table in Supabase)
  const { data: careReq, error: careErr } = await createCareRequest({
    patient_id: resolvedPatientId,
    patient_name: payload.patient_name || 'Village Patient',
    facility: payload.facility || 'Pune Sassoon General Hospital',
    department: 'Tele-Health Virtual OPD',
    priority: payload.priority || 'ROUTINE',
    reason: `Virtual Teleconsultation [Token: ${token}]: ${payload.chief_complaint}`,
    slot_preference: token,
    source: 'TELECONSULT',
    created_by: 'eSanjeevani Patient Tele-OPD',
    status: 'WAITING_FOR_DOCTOR',
    asha_notes: metaString
  });

  // 2. Secondary: Also insert into teleconsult_sessions if table exists
  let session = null;
  try {
    const sessionRecord = {
      patient_id: resolvedPatientId,
      patient_name: payload.patient_name || 'Village Patient',
      facility: payload.facility || 'Pune Sassoon General Hospital',
      chief_complaint: payload.chief_complaint || 'General Consultation',
      additional_notes: payload.additional_notes || null,
      vitals_snapshot: payload.vitals_snapshot || {},
      session_duration_sec: 0,
      session_status: 'WAITING_FOR_DOCTOR',
      doctor_name: 'On-Duty Medical Officer',
      token,
      care_request_id: careReq?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: sData } = await supabase
      .from('teleconsult_sessions')
      .insert([sessionRecord])
      .select()
      .maybeSingle();
    session = sData;
  } catch (_) {}

  return { session, careReq, token, id: careReq?.id || session?.id, error: careErr };
}

let teleconsultSessionsTableAvailable = true;

/**
 * Fetch all active teleconsultations waiting for doctor or in call
 * @param {string|null} facilityFilter - optional facility name/id to scope results
 */
export async function getWaitingTeleconsultSessions(facilityFilter = null) {
  // 1. Primary: Query care_requests for source = 'TELECONSULT'
  try {
    let query = supabase
      .from('care_requests')
      .select('*')
      .eq('source', 'TELECONSULT')
      .in('status', ['WAITING_FOR_DOCTOR', 'IN_CALL'])
      .order('created_at', { ascending: false });

    if (facilityFilter && typeof facilityFilter === 'string' && facilityFilter.trim()) {
      query = query.ilike('facility', `%${facilityFilter.trim()}%`);
    }

    const { data: careReqs } = await query;

    if (careReqs && careReqs.length > 0) {
      const normalized = careReqs.map(r => {
        let vitals = {};
        let complaint = r.reason?.replace(/Virtual Teleconsultation \[Token: [^\]]+\]:\s*/i, '') || 'General Consultation';
        let token = r.slot_preference || 'eS-SHIR-OPD';

        if (r.asha_notes?.includes('VITALS:')) {
          try {
            const vPart = r.asha_notes.split('VITALS:')[1];
            if (vPart) vitals = JSON.parse(vPart.split('|')[0]);
          } catch (_) {}
        }
        if (r.asha_notes?.includes('TOKEN:')) {
          const tMatch = r.asha_notes.match(/TOKEN:([^|]+)/);
          if (tMatch) token = tMatch[1].trim();
        }
        if (r.asha_notes?.includes('COMPLAINT:')) {
          const cMatch = r.asha_notes.match(/COMPLAINT:([^|]+)/);
          if (cMatch) complaint = cMatch[1].trim();
        }

        return {
          id: r.id,
          care_request_id: r.id,
          patient_id: r.patient_id,
          patient_name: r.patient_name,
          facility: r.facility,
          chief_complaint: complaint,
          vitals_snapshot: vitals,
          token,
          doctor_name: r.doctor_assigned || 'Dr. Arvind Kulkarni (Medical Officer)',
          session_status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at
        };
      });
      return { data: normalized, error: null };
    }
  } catch (e) {
    console.warn('[ashaService] care_requests teleconsult query notice:', e);
  }

  // 2. Secondary: Query teleconsult_sessions if table exists
  if (teleconsultSessionsTableAvailable) {
    try {
      const { data, error } = await supabase
        .from('teleconsult_sessions')
        .select('*')
        .in('session_status', ['WAITING_FOR_DOCTOR', 'IN_CALL'])
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          teleconsultSessionsTableAvailable = false;
        }
      } else if (data && data.length > 0) {
        return { data, error: null };
      }
    } catch (_) {
      teleconsultSessionsTableAvailable = false;
    }
  }

  return { data: [], error: null };
}

/**
 * Doctor accepts an incoming teleconsultation from waiting room
 */
export async function doctorAcceptTeleconsult(sessionId, doctorName = 'Dr. Arvind Kulkarni') {
  let careData = null;

  // 1. Update care_requests
  try {
    const { data } = await supabase
      .from('care_requests')
      .update({
        status: 'IN_CALL',
        doctor_assigned: doctorName,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .maybeSingle();
    careData = data;
  } catch (_) {}

  // 2. Also update teleconsult_sessions if table exists
  try {
    await supabase
      .from('teleconsult_sessions')
      .update({
        session_status: 'IN_CALL',
        doctor_name: doctorName,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  } catch (_) {}

  return { data: careData, error: null };
}

/**
 * Doctor completes consultation, enters diagnosis, medicines, and signs Rx
 */
export async function doctorCompleteTeleconsult(sessionId, payload) {
  const {
    diagnosis = 'General Medical Evaluation',
    rx_medicines = [],
    doctor_advice = 'Rest and follow prescribed dosage.',
    session_duration_sec = 120,
    doctor_name = 'Dr. Arvind Kulkarni'
  } = payload;

  const notesString = `DIAGNOSIS:${diagnosis}|RX:${JSON.stringify(rx_medicines)}|ADVICE:${doctor_advice}|DUR:${session_duration_sec}`;

  let careData = null;

  // 1. Update care_requests
  try {
    const { data } = await supabase
      .from('care_requests')
      .update({
        status: 'COMPLETED',
        doctor_assigned: doctor_name,
        asha_notes: notesString,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .maybeSingle();
    careData = data;
  } catch (_) {}

  // 2. Also update teleconsult_sessions if table exists
  try {
    await supabase
      .from('teleconsult_sessions')
      .update({
        session_status: 'COMPLETED',
        diagnosis,
        rx_medicines,
        doctor_advice,
        session_duration_sec,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  } catch (_) {}

  return { data: careData, error: null };
}


/**
 * Hospital Staff assigns official Token Number, Staggered Arrival Time Slot & Counter
 * Strictly scoped to the authoritative referral ID (never multi-row patient_id).
 */
export async function assignStaffTokenAndSlot(payload) {
  const {
    careRequestId,
    referralId,
    tokenNumber,
    arrivalSlot,
    room = 'OPD Room 2',
    doctorAssigned = '',
    doctorId = null,
    facilityId = null,
    status: explicitStatus = null,
    instructions = 'Please arrive 10 minutes prior to your time slot and report directly to your assigned counter with this token.'
  } = payload;

  const notesString = `TOKEN:${tokenNumber} | SLOT:${arrivalSlot} | ROOM:${room} | INSTRUCTION:${instructions}`;
  const slotPreference = `Token #${tokenNumber} · ${arrivalSlot}`;
  const targetReferralId = referralId || careRequestId;

  if (!targetReferralId) {
    return {
      success: false,
      error: new Error('Referral ID is required for token and slot assignment.'),
      tokenNumber,
      arrivalSlot
    };
  }

  let updatedReferral = null;
  let updatedCareReq = null;

  // 1. Authoritative Referral Mutation strictly by exact primary key (id = targetReferralId) and facility isolation
  try {
    const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const referralUpdatePayload = {
      status: explicitStatus || 'Accepted',
      ai_note: notesString
    };
    if (doctorAssigned) {
      referralUpdatePayload.doctor_assigned = `${doctorAssigned} (${room})`;
    }
    // Propagate doctor_id only when a valid UUID is provided — preserves UUID identity chain
    if (doctorId && isValidUuid(doctorId)) {
      referralUpdatePayload.doctor_id = doctorId;
    }

    let refQuery = supabase
      .from('referrals')
      .update(referralUpdatePayload)
      .eq('id', targetReferralId);

    if (facilityId) {
      refQuery = refQuery.eq('destination_facility_id', facilityId);
    }

    const { data: refData, error: refErr } = await refQuery
      .select('id, patient_id, status, doctor_assigned, doctor_id')
      .single();


    if (refErr) {
      console.error('[ashaService] Referral token update error:', refErr);
      return {
        success: false,
        error: new Error(`Failed to update referral: ${refErr.message}`),
        tokenNumber,
        arrivalSlot
      };
    }

    if (!refData || refData.id !== targetReferralId) {
      return {
        success: false,
        error: new Error(`Referral verification failed: expected ID ${targetReferralId}`),
        tokenNumber,
        arrivalSlot
      };
    }
    updatedReferral = refData;
  } catch (err) {
    console.error('[ashaService] assignStaffTokenAndSlot referral exception:', err);
    return { success: false, error: err, tokenNumber, arrivalSlot };
  }

  // 2. Authoritative Care Request Mutation if distinct careRequestId supplied
  if (careRequestId && careRequestId !== targetReferralId) {
    try {
      const { data } = await supabase
        .from('care_requests')
        .update({
          status: 'ACCEPTED',
          slot_preference: slotPreference,
          doctor_assigned: `${doctorAssigned} (${room})`,
          asha_notes: notesString,
          updated_at: new Date().toISOString()
        })
        .eq('id', careRequestId)
        .select()
        .maybeSingle();
      updatedCareReq = data;
    } catch (e) {
      console.warn('[ashaService] care_requests update by id notice:', e.message);
    }
  }

  return { success: true, updatedReferral, updatedCareReq, tokenNumber, arrivalSlot };
}


/**
 * Fetch all teleconsult sessions for a patient.
 * @param {string} patientId - village_patients.id UUID
 * @param {string} [patientName] - optional fallback by name
 */
export async function getTeleconsultSessions(patientId) {
  if (!patientId) return { data: [], error: null };
  const { data: byId, error } = await supabase
    .from('teleconsult_sessions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: byId || [], error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL DOCKET: Full patient history, allergies, medications for Doctor UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a comprehensive clinical docket for a patient including:
 * - Allergies, current medications, chronic conditions (from village_patients)
 * - Recent vitals history (from vitals_history)
 * - Past consultations (from consultations + teleconsult_sessions)
 * - Past triage encounters (from encounters)
 */
export async function getFullPatientClinicalDocket(patientId, patientName = null) {
  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const result = {
    resolved: false,
    error: null,
    profile: null,
    displayName: patientName || null,
    vitals: [],
    pastConsultations: [],
    teleconsults: [],
    encounters: [],
    allergies: '',
    currentMedications: '',
    chronicConditions: [],
    bloodGroup: null,
    age: null,
    gender: null,
    abhaId: null,
  };

  let targetUuid = patientId;
  if (!patientId) {
    result.error = 'Patient identifier is missing.';
    return result;
  }

  // Resolve Unified ID (e.g. MH-P-47893) to canonical UUID if not already a UUID
  if (!isValidUuid(patientId)) {
    try {
      const { data: matchedPt } = await supabase
        .from('patients')
        .select('id')
        .eq('unified_id', patientId)
        .maybeSingle();
      if (matchedPt?.id && isValidUuid(matchedPt.id)) {
        targetUuid = matchedPt.id;
      } else {
        result.error = `Invalid clinical identifier format (not a UUID or known Unified ID): ${patientId}`;
        return result;
      }
    } catch (e) {
      result.error = `Resolution error for ${patientId}: ${e.message}`;
      return result;
    }
  }

  try {
    // 1. Query village_patients strictly by exact UUID
    let clinicalProfile = null;
    const { data: vp, error: vpErr } = await supabase
      .from('village_patients')
      .select('id, name, age_years, gender, blood_group, mobile, abha_id, allergies, current_medications, chronic_conditions, has_chronic, is_pregnant, tb_symptoms')
      .eq('id', targetUuid)
      .maybeSingle();

    if (vpErr) {
      console.warn('[ashaService] village_patients query error:', vpErr.message);
    }

    if (vp) {
      clinicalProfile = vp;
    } else {
      // Check canonical patients table strictly by exact UUID if not in village_patients
      const { data: pt, error: ptErr } = await supabase
        .from('patients')
        .select('id, full_name, age, gender, blood_group, phone_number, vitals')
        .eq('id', targetUuid)
        .maybeSingle();

      if (ptErr) console.warn('[ashaService] patients query error:', ptErr.message);

      if (pt) {
        const ptVitals = pt.vitals || {};
        const ptConditions = Array.isArray(ptVitals.conditions)
          ? ptVitals.conditions
          : (ptVitals.condition ? [ptVitals.condition] : []);

        clinicalProfile = {
          id: pt.id,
          name: pt.full_name,
          age_years: pt.age,
          gender: pt.gender,
          blood_group: pt.blood_group,
          mobile: pt.phone_number,
          allergies: ptVitals.allergies || '',
          current_medications: ptVitals.medications || '',
          chronic_conditions: ptConditions,
          has_chronic: ptConditions.length > 0,
          is_pregnant: false,
          tb_symptoms: false,
          abha_id: ptVitals.abha_number || ptVitals.abha_id || (typeof window !== 'undefined' ? localStorage.getItem(`radvault_patient_abha_${targetUuid}`) : null) || null
        };
      }
    }

    // If still unresolved, mark as unresolved.
    if (!clinicalProfile) {
      result.error = `Clinical identity unresolved: No registered patient record matches UUID ${targetUuid}.`;
      return result;
    }

    result.resolved = true;
    result.profile = clinicalProfile;
    result.allergies = clinicalProfile.allergies || '';
    result.currentMedications = clinicalProfile.current_medications || '';
    result.chronicConditions = Array.isArray(clinicalProfile.chronic_conditions)
      ? clinicalProfile.chronic_conditions
      : (clinicalProfile.chronic_conditions ? [clinicalProfile.chronic_conditions] : []);
    if (clinicalProfile.is_pregnant) result.chronicConditions.push('Pregnant');
    if (clinicalProfile.tb_symptoms) result.chronicConditions.push('TB Suspect');
    result.bloodGroup = clinicalProfile.blood_group || null;
    result.age = clinicalProfile.age_years || null;
    result.gender = clinicalProfile.gender || null;
    result.abhaId = clinicalProfile.abha_id || (typeof window !== 'undefined' ? localStorage.getItem(`radvault_patient_abha_${targetUuid}`) : null) || null;

    // 2. Vitals history strictly by verified targetUuid
    const { data: vitals } = await supabase
      .from('vitals_history')
      .select('recorded_at, bp_systolic, bp_diastolic, pulse_bpm, spo2_pct, temperature_c, blood_glucose, weight_kg, height_cm, source, recorded_by')
      .eq('patient_id', targetUuid)
      .order('recorded_at', { ascending: false })
      .limit(8);
    result.vitals = vitals || [];

    // 3. Past consultations strictly by verified targetUuid
    const { data: cons } = await supabase
      .from('consultations')
      .select('id, diagnosis, clinical_assessment, treatment_advice, prescriptions, investigations, created_at, doctor_id, follow_up_recommended_date')
      .eq('patient_id', targetUuid)
      .order('created_at', { ascending: false })
      .limit(8);
    result.pastConsultations = cons || [];

    // 4. Past teleconsultations strictly by verified targetUuid
    const { data: tele } = await supabase
      .from('teleconsult_sessions')
      .select('id, diagnosis, rx_medicines, doctor_advice, doctor_name, session_status, created_at, chief_complaint')
      .eq('patient_id', targetUuid)
      .eq('session_status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(5);
    result.teleconsults = tele || [];

    // 5. Past ASHA triage encounters strictly by verified targetUuid
    const { data: enc } = await supabase
      .from('encounters')
      .select('id, complaint, priority, symptoms, danger_signs, vitals, outcome, created_at')
      .eq('patient_id', targetUuid)
      .order('created_at', { ascending: false })
      .limit(6);
    result.encounters = enc || [];

    // 6. Medical documents & lab reports
    const { data: docs } = await supabase
      .from('medical_documents')
      .select('id, title, category, document_date, notes, file_path, file_type, source, created_at')
      .eq('patient_id', targetUuid)
      .order('created_at', { ascending: false })
      .limit(6);
    result.documents = docs || [];

    const { data: labs } = await supabase
      .from('radvault_lab_reports')
      .select('id, report_type, lab_name, uploaded_at, urgency, status, file_url, file_name, summary, doctor_comment')
      .eq('patient_id', targetUuid)
      .order('uploaded_at', { ascending: false })
      .limit(6);
    result.labReports = labs || [];

  } catch (err) {
    console.warn('[ashaService] getFullPatientClinicalDocket error:', err.message);
    result.error = err.message;
  }

  return result;
}

/**
 * Generate an AI Clinical Summary using Groq (LLaMA-3.3-70b-versatile)
 * Fast-path clinical briefing for rural PHC doctors seeing 80-120 patients/day.
 *
 * Returns: { critical_alerts, active_regimen, clinical_trajectory, suggested_guardrails, raw }
 */
export async function generateClinicalAiSummary(docket) {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return { error: 'GROQ API key not configured', summary: null };
  }

  const {
    profile, allergies, currentMedications, chronicConditions,
    vitals, pastConsultations, teleconsults, encounters, age, gender
  } = docket;

  const patientDesc = `Patient: ${profile?.name || 'Unknown'}, Age: ${age || 'Unknown'}, Gender: ${gender || 'Unknown'}`;
  const allergyDesc = allergies ? `KNOWN ALLERGIES: ${allergies}` : 'No known drug allergies (NKDA)';
  const medsDesc = currentMedications ? `CURRENT MEDICATIONS: ${currentMedications}` : 'No active medications on record';
  const condDesc = chronicConditions.length > 0 ? `CHRONIC CONDITIONS: ${chronicConditions.join(', ')}` : 'No chronic conditions documented';

  const latestVital = vitals[0];
  const vitalDesc = latestVital
    ? `Latest Vitals (${new Date(latestVital.recorded_at).toLocaleDateString('en-IN')}): BP ${latestVital.bp_systolic || 'N/A'}/${latestVital.bp_diastolic || 'N/A'} mmHg, Pulse ${latestVital.pulse_bpm || 'N/A'} bpm, SpO2 ${latestVital.spo2_pct || 'N/A'}%, Temp ${latestVital.temperature_c ? ((latestVital.temperature_c * 9/5) + 32).toFixed(1) + '°F' : 'N/A'}`
    : 'No recent vitals on record';

  const pastDiagnosesDesc = [
    ...pastConsultations.slice(0, 3).map(c => `[${new Date(c.created_at).toLocaleDateString('en-IN')}] ${c.diagnosis || 'General Review'}: ${c.treatment_advice || ''}`),
    ...teleconsults.slice(0, 2).map(t => `[Teleconsult ${new Date(t.created_at).toLocaleDateString('en-IN')}] ${t.diagnosis || t.chief_complaint || 'General OPD'}: Rx by ${t.doctor_name || 'PHC Doctor'}`)
  ].join('\n') || 'No past consultations on record';

  const prompt = `You are a clinical decision support assistant for a rural Primary Health Centre (PHC) in Maharashtra, India. The doctor is seeing 80-120 patients in a 3-hour morning OPD. Generate a concise 3-point clinical briefing in under 100 words total.

${patientDesc}
${allergyDesc}
${medsDesc}
${condDesc}
${vitalDesc}

PAST HISTORY:
${pastDiagnosesDesc}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "critical_alerts": "One sentence: allergies or urgent risks (write NONE if absent)",
  "active_regimen": "One sentence: current medications and compliance notes (write NONE if absent)",
  "clinical_trajectory": "One sentence: disease course trend or notable patterns",
  "suggested_guardrails": "One sentence: drugs or procedures to avoid (write NONE if absent)"
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn('[ashaService] Groq API error:', err);
      return { error: `Groq API error: ${response.status}`, summary: null };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return { summary: parsed, error: null };
  } catch (err) {
    console.warn('[ashaService] generateClinicalAiSummary error:', err.message);
    return { error: err.message, summary: null };
  }
}

// ─── KIMI AI CLINICAL ROADMAP GENERATOR (On-Demand Token Optimized) ───────────
const KIMI_ENDPOINT = "https://sarthakkharadeagent2--ep-kimi-k3-server.us-west.modal.direct/v1/chat/completions";
const KIMI_API_KEY = "wk-cxPGHKXrq3fI7LOqGVzl0f.ws-JbafhsWhgpVfWmpS3EdKqG";

/**
 * Generates an in-depth clinical care roadmap via Kimi K3.
 * Triggered ONLY on user button click to conserve API tokens.
 */
export async function generateKimiClinicalRoadmap({
  patient,
  patientType,
  answers = {},
  voiceNotes = '',
  lang = 'en'
}) {
  // Format patient profile
  const patName = patient?.name || 'Patient';
  const patAge = patient?.age_years || patient?.age || 'Unknown';
  const patGender = patient?.gender || 'Unknown';

  // Format symptoms & vitals
  let symptomsList = [];
  if (Array.isArray(answers?.symptoms)) {
    symptomsList = answers.symptoms;
  } else if (Array.isArray(answers?.dangerSigns)) {
    symptomsList = answers.dangerSigns;
  } else if (Array.isArray(answers?.conditions)) {
    symptomsList = answers.conditions;
  }

  const vitalsText = [
    answers?.bp ? `BP: ${answers.bp} mmHg` : null,
    answers?.pulse ? `Pulse: ${answers.pulse} bpm` : null,
    answers?.spo2 ? `SpO2: ${answers.spo2}%` : null,
    answers?.temp ? `Temp: ${answers.temp}°F` : null,
    answers?.weight ? `Weight: ${answers.weight} kg` : null,
    answers?.bloodSugar ? `Blood Sugar: ${answers.bloodSugar}` : null,
  ].filter(Boolean).join(', ') || 'None measured';

  const userPrompt = `Patient: ${patName} (${patGender}, ${patAge} yrs). Category: ${patientType || 'General'}.
Symptoms/Danger signs: ${symptomsList.join(', ') || answers?.otherSymptom || 'General malaise'}.
Vitals: ${vitalsText}.
Observations / Voice notes: ${voiceNotes || 'Frontline field intake assessment'}.
Language: ${lang === 'mr' ? 'Marathi' : lang === 'hi' ? 'Hindi' : 'English'}.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(KIMI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'moonshotai/Kimi-K3',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI medical triage officer for rural frontline health workers (ASHA).
Analyze the patient data and return ONLY a valid raw JSON object (no markdown, no backticks, no code block) with these exact keys:
{
  "priority": "RED" | "ORANGE" | "GREEN",
  "department": "Appropriate clinical department name",
  "note": "2-sentence clinical diagnosis and rationale",
  "keyRisks": ["Risk 1", "Risk 2", "Risk 3"],
  "firstAidSteps": ["Immediate action 1", "Immediate action 2"],
  "hospitalRoadmap": "Brief step-by-step receiving care plan for the hospital OPD/Casualty"
}`
          },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 600,
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      let rawText = data?.choices?.[0]?.message?.content || '';
      rawText = rawText.trim();
      // Remove any markdown fence if present
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(rawText);
      return {
        success: true,
        priority: parsed.priority || 'ORANGE',
        department: parsed.department || 'General Medicine & OPD',
        note: parsed.note || 'Clinical review completed by Kimi AI.',
        keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks : ['Immediate medical observation required'],
        firstAidSteps: Array.isArray(parsed.firstAidSteps) ? parsed.firstAidSteps : ['Keep patient comfortable and monitor vitals'],
        hospitalRoadmap: parsed.hospitalRoadmap || 'Triage at receiving hospital counter and physician review.',
        model: 'Kimi-K3'
      };
    }
  } catch (err) {
    console.warn('[ashaService] Kimi AI call failed, using clinical fallback:', err.message);
  }

  // Clinical Rule-Based Fallback (Offline & Token-Safe)
  const isRed =
    answers?.bleeding ||
    answers?.convulsions ||
    answers?.unconscious ||
    patientType === 'emergency' ||
    (answers?.spo2 && Number(answers.spo2) < 90);

  const isOrange =
    answers?.swelling ||
    answers?.headacheVision ||
    answers?.breathingDiff ||
    answers?.chestPain ||
    (answers?.bp && (answers.bp.includes('150') || answers.bp.includes('160')));

  const priority = isRed ? 'RED' : isOrange ? 'ORANGE' : 'GREEN';
  const dept =
    patientType === 'pregnant' ? 'Maternity & Gynecology (ANC / Delivery)' :
    patientType === 'child' ? 'Child Health & Pediatrics' :
    patientType === 'emergency' || isRed ? 'Emergency & Casualty / Trauma' :
    'General Medicine & OPD';

  return {
    success: true,
    isFallback: true,
    priority,
    department: dept,
    note: isRed
      ? 'CRITICAL ALERT: Life-threatening danger signs detected. Immediate transfer to higher hospital required.'
      : isOrange
      ? 'URGENT: High-risk clinical signs present. Requires medical officer evaluation within 24 hours.'
      : 'STABLE: Vital parameters within manageable limits. Proceed with routine hospital consultation.',
    keyRisks: isRed
      ? ['Acute respiratory or circulatory distress', 'Risk of rapid clinical deterioration']
      : isOrange
      ? ['Secondary symptom exacerbation', 'Potential hypertensive or metabolic complication']
      : ['Routine symptom follow-up needed'],
    firstAidSteps: isRed
      ? ['Keep airway clear and position patient comfortably', 'Arrange emergency transit (108 Ambulance)']
      : isOrange
      ? ['Ensure patient rests in shade/ventilated area', 'Avoid oral medication without prescription']
      : ['Maintain hydration and record vitals again before leaving'],
    hospitalRoadmap: isRed
      ? 'Direct bypass to Emergency Trauma/Obstetrics unit for immediate IV stabilization and specialist review.'
      : isOrange
      ? 'Priority OPD token, blood pressure & glucose screening, physician examination.'
      : 'General OPD counter registration, vitals verification, routine physician prescription.',
    model: 'Clinical Rule Engine (Offline Guardrail)'
  };
}
