import { supabase } from './supabase';

/**
 * Convert a File to a base64 data URL string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // returns "data:application/pdf;base64,..."
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a document: convert to base64 and store directly in the DB.
 * No Supabase Storage bucket required.
 */
export async function uploadDocument({ patientId, familyId, file, category, title, source }) {
  try {
    // 1. Convert file to base64 data URL
    const base64Data = await fileToBase64(file);

    // 2. Insert everything into the medical_documents table
    const { data, error } = await supabase
      .from('medical_documents')
      .insert([{
        patient_id:  patientId,
        family_id:   familyId || null,
        file_name:   file.name,
        file_path:   `${patientId}/${Date.now()}-${file.name}`, // kept for future storage migration
        file_size:   file.size,
        file_type:   file.type,
        file_data:   base64Data, // stored as base64 data URL
        category:    category || 'Other',
        title:       title || file.name,
        source:      source || 'Self uploaded',
        uploaded_by: 'Patient',
      }])
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      return { data: null, error: { message: `DB Error: ${error.message}` } };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Upload error:", err);
    return { data: null, error: { message: `Error: ${err.message}` } };
  }
}

/**
 * Fetch all documents for a patient, with optional category filter.
 * Note: file_data can be large; we omit it from the list query for performance.
 */
export async function getDocuments(patientId, category = null) {
  let query = supabase
    .from('medical_documents')
    .select('id, patient_id, family_id, file_name, file_path, file_size, file_type, category, document_date, title, notes, source, uploaded_by, created_at, updated_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) console.error("Fetch error:", error);
  return { data: data || [], error };
}

/**
 * Fetch a single document WITH its file_data for preview
 */
export async function getDocumentById(id) {
  const { data, error } = await supabase
    .from('medical_documents')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

/**
 * Delete a document from the metadata table (base64 approach — no bucket cleanup needed)
 */
export async function deleteDocument(id) {
  return supabase.from('medical_documents').delete().eq('id', id);
}
