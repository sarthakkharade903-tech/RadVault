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
