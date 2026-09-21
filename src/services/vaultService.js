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
 * Upload a document:
 * 1. Uploads the raw binary file to Supabase Storage bucket 'medical-documents'.
 * 2. Obtains the public URL.
 * 3. Converts to base64 data URL as high-availability fallback.
 * 4. Inserts document record into 'medical_documents' table.
 */
export async function uploadDocument({ patientId, familyId, file, category, title, source }) {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${patientId}/${Date.now()}-${safeName}`;
    let publicUrl = null;

    // 1. Upload to Supabase Storage bucket 'medical-documents'
    try {
      const { data: storageUpload, error: storageErr } = await supabase.storage
        .from('medical-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/octet-stream'
        });

      if (!storageErr && storageUpload) {
        const { data: urlData } = supabase.storage
          .from('medical-documents')
          .getPublicUrl(storagePath);
        publicUrl = urlData?.publicUrl || null;
      } else if (storageErr) {
        console.warn("[vaultService] Storage bucket upload warning:", storageErr.message);
      }
    } catch (sErr) {
      console.warn("[vaultService] Storage bucket upload exception:", sErr.message);
    }

    // 2. Convert file to base64 data URL for fast inline preview and offline cache
    let base64Data = null;
    try {
      base64Data = await fileToBase64(file);
    } catch (bErr) {
      console.warn("[vaultService] Base64 conversion warning:", bErr.message);
    }

    // 3. Insert record into medical_documents table
    const { data, error } = await supabase
      .from('medical_documents')
      .insert([{
        patient_id:  patientId,
        family_id:   familyId || null,
        file_name:   file.name,
        file_path:   publicUrl || storagePath,
        file_size:   file.size,
        file_type:   file.type,
        file_data:   base64Data || publicUrl,
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
 * Delete a document from both medical_documents table and Supabase Storage bucket
 */
export async function deleteDocument(id, filePath = null) {
  try {
    if (filePath && typeof filePath === 'string' && !filePath.startsWith('data:')) {
      const pathParts = filePath.split('/medical-documents/');
      const cleanPath = pathParts.length > 1 ? pathParts[1] : filePath;
      await supabase.storage.from('medical-documents').remove([cleanPath]);
    }
  } catch (e) {
    console.warn("Storage cleanup note:", e.message);
  }
  return supabase.from('medical_documents').delete().eq('id', id);
}
