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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read local share store:", e);
  }
  const init = getInitialShares();
  saveShares(init);
  return init;
}

// Write shares to localStorage
function saveShares(shares) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shares));
  } catch (e) {
    console.warn("Could not write to local share store:", e);
  }
}

/**
 * Returns available doctors directory
 */
export async function getDoctors() {
  return [...MOCK_DOCTORS];
}

/**
 * Returns all shares for a patient (active, revoked, expired)
 */
export async function getAllShares(patientId = "PAT-89210") {
  const shares = loadShares();
  return shares.filter((s) => !patientId || s.patientId === patientId);
}

/**
 * Returns active shares for a patient
 */
export async function getActiveShares(patientId = "PAT-89210") {
  const all = await getAllShares(patientId);
  return all.filter((s) => s.status === "active");
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
}) {
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

/**
 * Revokes an existing share by ID
 */
export async function revokeShareAccess(shareId) {
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
