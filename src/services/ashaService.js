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

/**
 * Authoritative clinical patient identity bridge.
 * Ensures patients.id === village_patients.id with unique unified_id.
 */
export async function ensureClinicalPatient(patient) {
  if (!patient || !patient.id) return null;

  await ensureRoleAuth('asha');

  const { data: existing } = await supabase
    .from('patients')
    .select('id, unified_id, full_name')
    .eq('id', patient.id)
    .maybeSingle();

  if (existing) return existing;

  const unifiedId = `MH-P-${Math.floor(100000 + Math.random() * 900000)}`;
  const clinicalPayload = {
    id: patient.id,
    unified_id: unifiedId,
    full_name: patient.name || patient.full_name || 'Village Resident',
    age: Number(patient.age_years || patient.age) || 30,
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
    console.error('[ashaService] ensureClinicalPatient error:', error.message);
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

  if (!payload.patient_id) {
    return { data: null, error: new Error("Please select a registered patient before dispatching referral.") };
  }

  // 1. Authoritative Clinical Patient Synchronization (ensures patients.id === village_patients.id)
  let clinicalPatient = null;
  try {
    clinicalPatient = await ensureClinicalPatient({
      id: payload.patient_id,
      name: payload.patient_name,
      age: payload.age,
      gender: payload.gender,
      blood_group: payload.blood_group,
      phone: payload.phone,
      vitals: payload.vitals
    });
  } catch (ptErr) {
    console.error('[ashaService] Clinical patient sync error in referral dispatch:', ptErr);
  }
  const targetPatientId = clinicalPatient?.id || payload.patient_id;

  // 2. Sanitize payload strictly for care_requests table columns
  // care_requests table has ONLY: id, patient_id, patient_name, source, created_by, facility, department, slot_preference, appointment_date, doctor_assigned, priority, reason, asha_notes, status, created_at, updated_at, completed_at
  const careRequestRecord = {
    patient_id: targetPatientId,
    patient_name: payload.patient_name || clinicalPatient?.full_name || 'Village Patient',
    source: payload.source || 'ASHA_REFERRED',
    created_by: payload.created_by || 'ASHA Worker (Priya Deshmukh)',
    facility: payload.facility || payload.destination_hospital || 'Shrirampur Primary Health Centre',
    department: payload.department || 'General Medicine',
    slot_preference: payload.slot_preference || null,
    appointment_date: payload.appointment_date || null,
    doctor_assigned: payload.doctor_assigned || null,
    priority: payload.priority || 'ROUTINE',
    reason: payload.reason || payload.asha_notes || 'Referred for specialist evaluation',
    asha_notes: payload.asha_notes || payload.reason || '',
    status: 'SUBMITTED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

  // 3. Insert into public.referrals for Hospital Staff & Doctor specialist pipeline
  const isHigh = payload.priority === 'URGENT' || payload.priority === 'HIGH' || payload.priority === 'RED';
  const isMedium = payload.priority === 'MEDIUM' || payload.priority === 'ORANGE';
  const normalizedPriority = isHigh ? 'HIGH' : isMedium ? 'ORANGE' : 'GREEN';
  const priorityLabel = isHigh ? '🔴 Emergency / Immediate Attention' : isMedium ? '🟡 Urgent / Within 24 Hours' : '🟢 Routine / Local Care';

  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const facilityId = (payload.destination_facility_id && isValidUuid(payload.destination_facility_id))
    ? payload.destination_facility_id
    : 'f1111111-1111-1111-1111-111111111111';
  const hospitalName = payload.facility || payload.destination_hospital || 'Shrirampur Primary Health Centre';

  const referralData = {
    patient_id: targetPatientId,
    patient_name: payload.patient_name || clinicalPatient?.full_name || 'Village Patient',
    created_by: payload.created_by || 'ASHA Worker (Priya Deshmukh)',
    destination_hospital: hospitalName,
    destination_facility_id: facilityId,
    destination_department: payload.department || 'General Medicine',
    doctor_assigned: payload.doctor_assigned || null,
    priority: normalizedPriority,
    priority_label: priorityLabel,
    status: 'Pending',
    symptoms: payload.reason || payload.asha_notes || 'Referred by frontline ASHA for medical care',
    vitals: payload.vitals || null,
    ai_note: payload.ai_note || payload.reason || null
  };

  const { data: createdReferral, error: refInsertErr } = await supabase
    .from('referrals')
    .insert([referralData])
    .select()
    .single();

  if (refInsertErr) {
    console.error('[ashaService] Referral insert error:', refInsertErr);
    return { data: null, error: refInsertErr };
  }

  // 4. Record encounter (best-effort audit)
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
      referral_id: createdReferral.id
    }]);
  } catch (encErr) {
    // Non-blocking
  }

  return { data: createdReferral, error: null };
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
    await ensureRoleAuth('asha');

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
          hospital: c.referrals?.destination_hospital || 'Shrirampur Primary Health Centre'
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
            hospital: e.referrals?.destination_hospital || 'Shrirampur Primary Health Centre'
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
  await ensureRoleAuth('asha');
  try {
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