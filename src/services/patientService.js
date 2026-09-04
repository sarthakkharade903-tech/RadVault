import { supabase } from './supabase';

/**
 * Fetch all patients from the 'patients' table.
 * @returns {Promise<Array>} List of patients
 */
export async function getPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching patients from Supabase:', error.message);
    throw error;
  }

  return data;
}

/**
 * Fetch latest vitals for a given patient from the 'vitals' table,
 * ordered by recorded_at descending.
 * @param {string|number} patientId - The patient ID
 * @returns {Promise<Array>} List of vitals records
 */
export async function getVitals(patientId) {
  if (!patientId) {
    throw new Error('Patient ID is required to fetch vitals.');
  }

  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error(`Error fetching vitals for patient ${patientId}:`, error.message);
    throw error;
  }

  return data;
}

/**
 * Fetch upcoming appointments for a given patient from the 'appointments' table,
 * where appointment_date >= today, ordered by appointment_date ascending.
 * @param {string|number} patientId - The patient ID
 * @returns {Promise<Array>} List of upcoming appointments
 */
export async function getUpcomingAppointments(patientId) {
  if (!patientId) {
    throw new Error('Patient ID is required to fetch upcoming appointments.');
  }

  // Get ISO string for current timestamp/date
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .gte('appointment_date', today)
    .order('appointment_date', { ascending: true });

  if (error) {
    console.error(`Error fetching upcoming appointments for patient ${patientId}:`, error.message);
    throw error;
  }

  return data;
}

/**
 * Fetch patient longitudinal health timeline compiled from triage encounters, referrals,
 * consultations, and medical scans.
 * @param {string} patientId - The patient profile ID
 * @returns {Promise<Array>} Chronological list of care events
 */
export async function getPatientTimeline(patientId) {
  if (!patientId) return [];

  try {
    // Query encounters (triage)
    const { data: encounters } = await supabase
      .from('encounters')
      .select('*')
      .eq('patient_id', patientId);

    // Query referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('patient_id', patientId);

    // Query consultations
    const { data: consultations } = await supabase
      .from('consultations')
      .select('*, referrals(destination_hospital)')
      .eq('patient_id', patientId);

    // Query medical records
    const { data: records } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId);

    const events = [];

    // 1. Map encounters to triage category
    (encounters || []).forEach(e => {
      events.push({
        id: `enc-${e.id}`,
        date: new Date(e.created_at).toISOString().slice(0, 10),
        time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `ASHA Frontline Screening Assessment`,
        category: 'triage',
        categoryLabel: 'Triage Assessment',
        facility: e.phc_name || 'Sub-Centre / Community Area',
        doctor: 'ASHA Worker',
        summary: `Encounter Complaint: ${e.complaint || 'Routine checkup'}. Priority: ${e.priority || 'Routine'}`,
        details: `Symptoms: ${(e.symptoms || []).join(', ')}. BP: ${e.vitals?.bp || 'N/A'}, Pulse: ${e.vitals?.pulse || 'N/A'}, SpO2: ${e.vitals?.spo2 || 'N/A'}. Danger signs noted: ${(e.danger_signs || []).join(', ') || 'None'}.`,
        status: e.outcome,
        isImportant: e.priority === 'HIGH' || e.priority === 'ORANGE'
      });
    });

    // 2. Map referrals to referral category
    (referrals || []).forEach(r => {
      events.push({
        id: `ref-${r.id}`,
        date: new Date(r.created_at).toISOString().slice(0, 10),
        time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `Specialist Referral Issued`,
        category: 'referral',
        categoryLabel: 'Referral Transfer',
        facility: r.destination_hospital || 'Shrirampur Primary Health Centre',
        doctor: r.doctor_assigned || 'On-Duty Specialist',
        summary: `Referred due to: ${r.symptoms || 'Clinical evaluation'}. Status: ${r.status}`,
        details: `Destination Facility: ${r.destination_hospital}. Department: ${r.destination_department || 'General Medicine'}. Assigned Doctor: ${r.doctor_assigned}. Priority: ${r.priority}.`,
        status: r.status,
        isImportant: r.priority === 'RED' || r.priority === 'ORANGE' || r.priority === 'HIGH'
      });
    });

    // 3. Map consultations to consultation category
    (consultations || []).forEach(c => {
      const isTeleconsult = (c.clinical_assessment || '').includes('REMOTE TELECONSULTATION');
      events.push({
        id: `cons-${c.id}`,
        date: new Date(c.created_at).toISOString().slice(0, 10),
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: isTeleconsult ? '📡 Remote Specialist Tele-Advice Signed' : '🏥 Specialist Consultation Signed',
        category: 'consultation',
        categoryLabel: isTeleconsult ? 'Tele-Consultation' : 'Specialist Review',
        facility: c.referrals?.destination_hospital || 'Shrirampur Primary Health Centre',
        doctor: c.doctor_id || 'Specialist Physician',
        summary: `Diagnosis: ${c.diagnosis || 'Clinical review'}. Follow-up: ${c.follow_up_recommended_date || 'Routine'}`,
        details: `Clinical assessment: ${c.clinical_assessment}. Treatment advice: ${c.treatment_advice}. Prescriptions: ${(c.prescriptions || []).map(p => `${p.name} (${p.dose})`).join(', ') || 'None'}.`,
        status: 'Completed',
        isImportant: true
      });
    });

    // 4. Map medical records to scans/labs
    (records || []).forEach(m => {
      events.push({
        id: `rec-evt-${m.id}`,
        date: new Date(m.created_at).toISOString().slice(0, 10),
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `${m.title} Report Verified`,
        category: m.modality === 'LAB' ? 'lab' : 'radiology',
        categoryLabel: m.modality === 'LAB' ? 'Laboratory Pathology' : `${m.modality} Imaging Scan`,
        facility: m.facility_name,
        doctor: m.doctor_name,
        summary: `Modality: ${m.modality}. Body Region: ${m.body_region || 'N/A'}`,
        details: `Impression: ${m.report?.impression || 'Report verified.'} Findings: ${m.report?.findings ? m.report.findings.join(' ') : 'None.'}`,
        status: 'Verified',
        isImportant: false,
        recordId: m.id
      });
    });

    return events.sort((a, b) => {
      const dtA = `${a.date} ${a.time || '00:00'}`;
      const dtB = `${b.date} ${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });
  } catch (err) {
    console.error('Error compiling patient timeline:', err.message);
    return [];
  }
}

