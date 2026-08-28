/**
 * RadVault Role Architecture Definitions
 * Canonical role constants and UI configuration.
 */

export const ROLES = {
  ASHA: 'asha',
  HOSPITAL_STAFF: 'hospital_staff',
  DOCTOR: 'doctor',
  PATIENT: 'patient'
};

export const ROLE_CONFIG = {
  [ROLES.ASHA]: {
    key: ROLES.ASHA,
    label: 'ASHA / Frontline Health Worker',
    shortLabel: 'ASHA Worker',
    icon: '👩‍⚕️',
    badgeColor: 'bg-[#FFF5EB] text-[#b35900] border-[#FF9933]/50',
    accentColor: '#FF9933',
    path: '/asha',
    description: 'Primary user: Patient registration, vitals, digital triage, specialist referrals & task tracking'
  },
  [ROLES.HOSPITAL_STAFF]: {
    key: ROLES.HOSPITAL_STAFF,
    label: 'Hospital Staff / Operations',
    shortLabel: 'Hospital Staff',
    icon: '🏥',
    badgeColor: 'bg-[#E6F2F2] text-[#008080] border-[#008080]/40',
    accentColor: '#008080',
    path: '/hospital',
    description: 'Operational user: Incoming referral intake, doctor routing, arrival management & operational queue'
  },
  [ROLES.DOCTOR]: {
    key: ROLES.DOCTOR,
    label: 'Doctor / Clinical Specialist',
    shortLabel: 'Doctor',
    icon: '🩺',
    badgeColor: 'bg-[#FDF2F2] text-[#800000] border-[#800000]/40',
    accentColor: '#800000',
    path: '/doctor',
    description: 'Clinical user: Referral review, imaging/scans inspection, diagnosis, treatment advice & follow-up recommendations'
  },
  [ROLES.PATIENT]: {
    key: ROLES.PATIENT,
    label: 'Patient (Beneficiary View)',
    shortLabel: 'Patient',
    icon: '👤',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    accentColor: '#555555',
    path: '/patient',
    description: 'Beneficiary: Personal health record vault, emergency ID & active care timeline'
  }
};
