/**
 * shareService.js
 * RadVault — Step 5: Patient-Controlled Sharing Service
 *
 * Provides a clean service abstraction for patient-authorized medical sharing.
 * Prepares the exact data architecture for the future `patient_record_shares`
 * Supabase table while providing seamless client-side persistence for the MVP.
 *
 * Future Supabase table schema:
 * - id: uuid PRIMARY KEY
 * - patient_id: uuid / string
 * - doctor_id: string
 * - doctor_name: string
 * - doctor_specialty: string
 * - doctor_facility: string
 * - share_scope: 'health_history' | 'selected_records'
 * - record_ids: text[] (or null for health_history)
 * - duration_type: '24_hours' | '7_days' | 'until_revoked'
 * - created_at: timestamptz
 * - expires_at: timestamptz | null
 * - revoked_at: timestamptz | null
 * - status: 'active' | 'revoked' | 'expired'
 */

import { supabase } from './supabase';

// ─── Mock Doctors Directory ──────────────────────────────────────────────────
export const MOCK_DOCTORS = [
  {
    id: "doc-kulkarni",
    name: "Dr. Sandeep Kulkarni",
    specialty: "Cardiology",
    facility: "CityCare Super Specialty Hospital, Pune",
    regNo: "MCI-MH-11880",
    initials: "SK",
  },
  {
    id: "doc-sharma",
    name: "Dr. Priya Sharma",
    specialty: "General Medicine & Family Health",
    facility: "District Health Centre, Aundh",
    regNo: "MCI-MH-34219",
    initials: "PS",
  },
  {
    id: "doc-nambiar",
    name: "Dr. Meera Nambiar",
    specialty: "Orthopedics & Spine",
    facility: "Sahyadri Hospital, Pune",
    regNo: "MCI-MH-28941",
    initials: "MN",
  },
  {
    id: "doc-deshmukh",
    name: "Dr. Siddharth Deshmukh",
    specialty: "Radio-Diagnosis & Imaging",
    facility: "RadVault Imaging & AI Hub, Baner",
    regNo: "MCI-MH-44912",
    initials: "SD",
  },
  {
    id: "doc-patil",
    name: "Dr. Smita Patil",
    specialty: "Pathology & Laboratory Medicine",
    facility: "Metropolis Diagnostics, Pune",
    regNo: "MCI-MH-33019",
    initials: "SP",
  },
];

// Helper to format date "2026-08-31" or "31 Aug 2026"
export function formatDisplayDate(dateObj) {
  if (!dateObj) return "";
  const d = typeof dateObj === "string" ? new Date(dateObj) : dateObj;
  if (isNaN(d.getTime())) return dateObj;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Compute expiry date string based on duration
export function calculateExpiry(duration) {
  const now = new Date();
  if (duration === "24_hours") {
    now.setHours(now.getHours() + 24);
    return {
      iso: now.toISOString(),
      display: formatDisplayDate(now) + ` (${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      label: "24 hours",
    };
  } else if (duration === "7_days") {
    now.setDate(now.getDate() + 7);
    return {
      iso: now.toISOString(),
      display: formatDisplayDate(now),
      label: "7 days",
    };
  } else {
    // until revoked
    return {
      iso: null,
      display: "Until revoked",
      label: "Until I revoke access",
    };
  }
}

const STORAGE_KEY = "radvault_patient_shares_v1";

// Initial seed share for demonstration
function getInitialShares() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 6);

  const initial = [
    {
      id: "share-init-001",
      patientId: "PAT-89210",
      doctorId: "doc-kulkarni",
      doctorName: "Dr. Sandeep Kulkarni",
      doctorSpecialty: "Cardiology",
      doctorFacility: "CityCare Super Specialty Hospital, Pune",
      shareScope: "health_history",
      scopeLabel: "Health History",
      recordIds: [],
      recordsSummary: "Full Health History (Scans, Lab Reports, Prescriptions, Consultations)",
      durationType: "7_days",
      durationLabel: "7 days",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      expiresAt: expiry.toISOString(),
      expiresDisplay: formatDisplayDate(expiry),
      status: "active",
      revokedAt: null,
    }
  ];

  return initial;
}

// Read shares from localStorage or memory
function loadShares() {
  const isDemoDataEnabled = typeof localStorage !== 'undefined'
    ? localStorage.getItem('radvault_demo_data_enabled') !== 'false'
    : true;

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (!isDemoDataEnabled) {
          return parsed.filter(s => s.id !== 'share-init-001');
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read local share store:", e);
  }
  if (isDemoDataEnabled) {
    const init = getInitialShares();
    saveShares(init);
    return init;
  }
  return [];
}

// Write shares to localStorage
function saveShares(shares) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
  } catch (e) {
    console.warn("Could not write to local share store:", e);
  }
}

async function getIsDemoMode() {
  try {
    const { data } = await supabase.auth.getSession();
    return !data?.session;
  } catch (_err) {
    return true;
  }
}

/**
 * Returns available doctors directory from database with fallback to verified clinical specialists
 */
export async function getDoctors() {
  try {
    const isDemo = await getIsDemoMode();
    if (!isDemo) {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialty, facility_id, facilities(name)');
      
      if (!error && data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty || 'General Practitioner',
          facility: d.facilities?.name || 'Primary Health Centre',
          regNo: 'MCI-MH-' + d.id.slice(0, 5).toUpperCase(),
          initials: d.name.split(' ').filter(n => !n.startsWith('Dr.')).map(n => n[0]).join('').slice(0, 2) || 'DR'
        }));
      }
    }
  } catch (err) {
    console.warn('[RadVault Share] Error fetching doctors from DB:', err.message);
  }
  return [...MOCK_DOCTORS];
}

/**
 * Returns all shares for a patient (active, revoked, expired)
 */
export async function getAllShares(patientId = "PAT-89210", isDemoMode = false) {
  const isDemo = isDemoMode || await getIsDemoMode();
  if (isDemo || !patientId || patientId.toString().startsWith("PAT-")) {
    const shares = loadShares();
    return shares.filter((s) => !patientId || s.patientId === patientId);
  }

  const { data, error } = await supabase
    .from('patient_record_shares')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shares from Supabase:', error.message);
    throw error;
  }

  // Format database format back to client UI mapping
  return (data || []).map(s => ({
    id: s.id,
    patientId: s.patient_id,
    doctorId: s.doctor_id,
    doctorName: s.doctor_name,
    doctorSpecialty: s.doctor_specialty,
    doctorFacility: s.doctor_facility,
    shareScope: s.share_scope,
    scopeLabel: s.share_scope === 'health_history' ? 'Health History' : `${s.record_ids?.length || 0} Selected Records`,
    recordIds: s.record_ids || [],
    durationType: s.duration_type,
    durationLabel: s.duration_type === '24_hours' ? '24 hours' : s.duration_type === '7_days' ? '7 days' : 'Until revoked',
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    expiresDisplay: s.expires_at ? formatDisplayDate(s.expires_at) : 'Until revoked',
    status: s.status,
    revokedAt: s.revoked_at
  }));
}

/**
 * Returns active shares for a patient
 */
export async function getActiveShares(patientId = "PAT-89210", isDemoMode = false) {
  const all = await getAllShares(patientId, isDemoMode);
  return all.filter((s) => s.status === "active" && (!s.expiresAt || new Date(s.expiresAt) > new Date()));
}

/**
 * Creates a new share access record
 */
export async function createShareAccess({
  patientId = "PAT-89210",
  doctor,
  shareScope = "health_history", // 'health_history' | 'selected_records'
  selectedRecords = [],
  durationType = "7_days", // '24_hours' | '7_days' | 'until_revoked'
  isDemoMode = false
}) {
  const isDemo = isDemoMode || await getIsDemoMode();
  if (isDemo || !patientId || patientId.toString().startsWith("PAT-")) {
    const shares = loadShares();
    const expiryInfo = calculateExpiry(durationType);

    const scopeLabel =
      shareScope === "health_history"
        ? "Health History"
        : selectedRecords.length === 1
        ? `1 Selected Record (${selectedRecords[0]?.title || "Record"})`
        : `${selectedRecords.length} Selected Records`;

    const recordsSummary =
      shareScope === "health_history"
        ? "Comprehensive Health History (Imaging Scans, Lab Pathology, Medications, Health Timeline)"
        : selectedRecords.map((r) => r.title).join(", ");

    const newShare = {
      id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      doctorId: doctor.id || "custom-doctor",
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty || "Specialist Physician",
      doctorFacility: doctor.facility || "Private Clinical Practice",
      shareScope,
      scopeLabel,
      recordIds: selectedRecords.map((r) => r.id),
      selectedRecordTitles: selectedRecords.map((r) => r.title),
      recordsSummary,
      durationType,
      durationLabel: expiryInfo.label,
      createdAt: new Date().toISOString(),
      expiresAt: expiryInfo.iso,
      expiresDisplay: expiryInfo.display,
      status: "active",
      revokedAt: null,
    };

    shares.unshift(newShare);
    saveShares(shares);
    return newShare;
  }

  const expiryInfo = calculateExpiry(durationType);
  const payload = {
    patient_id: patientId,
    doctor_id: doctor.id && !doctor.id.toString().startsWith("custom") ? doctor.id : null,
    doctor_name: doctor.name,
    doctor_specialty: doctor.specialty || 'General Practitioner',
    doctor_facility: doctor.facility || 'Primary Health Centre',
    share_scope: shareScope,
    record_ids: selectedRecords.map(r => r.id),
    duration_type: durationType,
    expires_at: expiryInfo.iso,
    status: 'active'
  };

  const { data, error } = await supabase
    .from('patient_record_shares')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error inserting share record in Supabase:', error.message);
    throw error;
  }

  return {
    id: data.id,
    patientId: data.patient_id,
    doctorId: data.doctor_id,
    doctorName: data.doctor_name,
    doctorSpecialty: data.doctor_specialty,
    doctorFacility: data.doctor_facility,
    shareScope: data.share_scope,
    scopeLabel: data.share_scope === 'health_history' ? 'Health History' : `${data.record_ids?.length || 0} Selected Records`,
    recordIds: data.record_ids || [],
    durationType: data.duration_type,
    durationLabel: expiryInfo.label,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    expiresDisplay: expiryInfo.display,
    status: data.status,
    revokedAt: data.revoked_at
  };
}

/**
 * Revokes an existing share by ID
 */
export async function revokeShareAccess(shareId, isDemoMode = false) {
  const isDemo = isDemoMode || await getIsDemoMode();
  if (isDemo || !shareId || !shareId.toString().includes("-")) {
    const shares = loadShares();
    const index = shares.findIndex((s) => s.id === shareId);
    if (index === -1) {
      throw new Error("Share not found");
    }

    shares[index] = {
      ...shares[index],
      status: "revoked",
      revokedAt: new Date().toISOString(),
    };

    saveShares(shares);
    return shares[index];
  }

  const { data, error } = await supabase
    .from('patient_record_shares')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString()
    })
    .eq('id', shareId)
    .select()
    .single();

  if (error) {
    console.error('Error revoking share record in Supabase:', error.message);
    throw error;
  }

  return {
    id: data.id,
    status: data.status,
    revokedAt: data.revoked_at
  };
}

/**
 * Summarizes health history categories based on real mock items
 */
export function getHealthHistoryCategories(records = [], timelineEvents = [], medications = []) {
  const imagingCount = records.filter((r) =>
    ["MRI", "CT Scan", "X-Ray", "Ultrasound", "Cardiology"].includes(r.modality)
  ).length;

  const labsCount = records.filter((r) => r.modality === "Lab Report").length;
  const medsCount = medications?.length || 3;
  const consultsCount = timelineEvents?.length || 6;

  return [
    {
      id: "cat-imaging",
      label: "Diagnostic Scans & Medical Imaging",
      count: imagingCount || 5,
      unit: imagingCount === 1 ? "scan" : "scans",
      icon: "🩻",
    },
    {
      id: "cat-labs",
      label: "Pathology & Laboratory Reports",
      count: labsCount || 1,
      unit: labsCount === 1 ? "report" : "reports",
      icon: "🧪",
    },
    {
      id: "cat-meds",
      label: "Active Prescriptions & Dosages",
      count: medsCount,
      unit: medsCount === 1 ? "prescription" : "prescriptions",
      icon: "💊",
    },
    {
      id: "cat-timeline",
      label: "Consultation History & Timeline",
      count: consultsCount,
      unit: consultsCount === 1 ? "consultation" : "consultations",
      icon: "📋",
    },
  ];
}
