import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from environment variables (.env / .env.local)
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.VITE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

// Initialize Supabase client if configured
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// RadVault Storage & Database Helper Methods
// ==========================================

/**
 * Upload a DICOM / Medical Scan / PDF to Supabase Storage
 * Bucket name: "radvault-scans"
 */
export async function uploadScanFile(file, patientId) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[RadVault] Supabase not configured. Using local object URL.');
    return {
      publicUrl: URL.createObjectURL(file),
      storagePath: null,
      error: null
    };
  }

  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${patientId}/${timestamp}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('radvault-scans')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('radvault-scans')
      .getPublicUrl(storagePath);

    return {
      publicUrl: publicData.publicUrl,
      storagePath,
      error: null
    };
  } catch (err) {
    console.error('[RadVault Storage Error]:', err);
    // Graceful fallback to client object URL
    return {
      publicUrl: URL.createObjectURL(file),
      storagePath: null,
      error: err.message
    };
  }
}

/**
 * Insert new study into Supabase `radvault_studies` table
 */
export async function createStudyRecord(studyData) {
  if (!isSupabaseConfigured() || !supabase) {
    console.info('[RadVault] Supabase not connected. Study stored in client state.');
    return { data: studyData, error: null };
  }

  try {
    // 1. Auto-upsert patient to ensure Foreign Key constraint succeeds
    if (studyData.patientId) {
      const { error: patientErr } = await supabase
        .from('radvault_patients')
        .upsert({
          id: studyData.patientId,
          name: studyData.patientName || 'Patient',
          age: studyData.patientAge || 30,
          gender: studyData.patientGender || 'Other',
          village: 'Satara District'
        }, { onConflict: 'id' });

      if (patientErr) {
        console.warn('[RadVault Patient Upsert Warning]:', patientErr);
      }
    }

    // 2. Insert into radvault_studies
    const payload = {
      id: studyData.id,
      patient_id: studyData.patientId,
      patient_name: studyData.patientName,
      patient_age: studyData.patientAge,
      patient_gender: studyData.patientGender,
      modality: studyData.modality,
      body_region: studyData.bodyRegion,
      study_date: studyData.studyDate || new Date().toISOString().split('T')[0],
      facility: studyData.facility,
      technician_name: studyData.technicianName,
      referring_doctor: studyData.referringDoctor,
      urgency: studyData.urgency,
      file_url: studyData.fileUrl,
      thumbnail_url: studyData.thumbnail,
      file_name: studyData.fileName,
      file_size: studyData.fileSize,
      is_multi_slice: studyData.isMultiSlice || false,
      dicom_metadata: studyData.dicomMetadata || {},
      technician_notes: studyData.technicianNotes || '',
      doctor_findings: studyData.doctorFindings || '',
      ai_analysis: studyData.aiAnalysis || {},
      measurements: studyData.measurements || [],
      pins: studyData.pins || [],
      lab_results: studyData.labResults || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('radvault_studies')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[RadVault DB Insert Error Details]:', error);
      throw error;
    }
    
    console.log('[RadVault DB Insert Success]:', data);
    return { data, error: null };
  } catch (err) {
    console.error('[RadVault DB Insert Error]:', err);
    return { data: studyData, error: err.message || JSON.stringify(err) };
  }
}

/**
 * Fetch all studies from Supabase `radvault_studies` table
 */
export async function fetchAllStudiesFromSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('radvault_studies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform DB snake_case columns back to frontend camelCase
    const formatted = data.map(item => ({
      id: item.id,
      patientId: item.patient_id,
      patientName: item.patient_name,
      patientAge: item.patient_age,
      patientGender: item.patient_gender,
      studyType: item.modality,
      modality: item.modality,
      bodyRegion: item.body_region,
      studyDate: item.study_date,
      facility: item.facility,
      technicianName: item.technician_name,
      referringDoctor: item.referring_doctor,
      urgency: item.urgency,
      thumbnail: item.thumbnail_url || item.file_url,
      fileUrl: item.file_url,
      fileType: item.file_name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      fileName: item.file_name,
      fileSize: item.file_size,
      isMultiSlice: item.is_multi_slice,
      slices: item.file_url ? [item.file_url] : [],
      dicomMetadata: item.dicom_metadata || {},
      technicianNotes: item.technician_notes,
      doctorFindings: item.doctor_findings,
      aiAnalysis: item.ai_analysis || {},
      measurements: item.measurements || [],
      pins: item.pins || [],
      labResults: item.lab_results || null
    }));

    return { data: formatted, error: null };
  } catch (err) {
    console.error('[RadVault DB Fetch Error]:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Update doctor annotations (calipers, pins, findings) in Supabase
 */
export async function updateStudyInSupabase(studyId, updates) {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: null };
  }

  try {
    const dbUpdates = {};
    if (updates.measurements !== undefined) dbUpdates.measurements = updates.measurements;
    if (updates.pins !== undefined) dbUpdates.pins = updates.pins;
    if (updates.doctorFindings !== undefined) dbUpdates.doctor_findings = updates.doctorFindings;

    const { error } = await supabase
      .from('radvault_studies')
      .update(dbUpdates)
      .eq('id', studyId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[RadVault DB Update Error]:', err);
    return { error: err.message };
  }
}

/**
 * Subscribe to realtime scan uploads in Supabase
 */
export function subscribeToRealtimeStudies(onNewStudy) {
  if (!isSupabaseConfigured() || !supabase) return null;

  return supabase
    .channel('radvault_studies_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'radvault_studies' },
      (payload) => {
        if (onNewStudy && payload.new) {
          const item = payload.new;
          const formatted = {
            id: item.id,
            patientId: item.patient_id,
            patientName: item.patient_name,
            patientAge: item.patient_age,
            patientGender: item.patient_gender,
            studyType: item.modality,
            modality: item.modality,
            bodyRegion: item.body_region,
            studyDate: item.study_date,
            facility: item.facility,
            technicianName: item.technician_name,
            referringDoctor: item.referring_doctor,
            urgency: item.urgency,
            thumbnail: item.thumbnail_url || item.file_url,
            fileUrl: item.file_url,
            fileName: item.file_name,
            fileSize: item.file_size,
            isMultiSlice: item.is_multi_slice,
            dicomMetadata: item.dicom_metadata || {},
            technicianNotes: item.technician_notes,
            doctorFindings: item.doctor_findings,
            aiAnalysis: item.ai_analysis || {},
            measurements: item.measurements || [],
            pins: item.pins || []
          };
          onNewStudy(formatted);
        }
      }
    )
    .subscribe();
}
