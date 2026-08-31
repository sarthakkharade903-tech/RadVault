import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { ROLES, ROLE_CONFIG } from './constants/roles';

// Existing Patient Portal Components
import { PatientHome } from './components/dashboard/PatientHome';
import {
  mockPatient,
  mockVitals,
  mockAllergies,
  mockConditions,
  mockMedications,
  mockTimelineEvents,
  mockMedicalRecords,
} from './data/mockPatientData';

import PatientProfileCard from './components/PatientProfile/PatientProfileCard';
import PatientVitals from './components/PatientProfile/PatientVitals';
import PatientConditions from './components/PatientProfile/PatientConditions';
import HealthTimeline from './components/HealthTimeline/HealthTimeline';
import MedicalRecordsList from './components/MedicalRecords/MedicalRecordsList';
import ReferralsDashboard from './components/Referrals/ReferralsDashboard';
import GovernmentSchemes from './components/Patient/GovernmentSchemes';

import AshaWorkspace from './components/workspaces/AshaWorkspace';
import HospitalStaffWorkspace from './components/workspaces/HospitalStaffWorkspace';
import DoctorWorkspace from './components/workspaces/DoctorWorkspace';
import LandingPage from './components/landing/LandingPage';
import PortalSignIn from './components/auth/PortalSignIn';
import RoleGuard from './components/common/RoleGuard';
import NoRoleScreen from './components/common/NoRoleScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import { getPatientTimeline } from './services/patientService';
import { supabase } from './services/supabase';

import {
  HeartPulse,
  Home,
  UserCircle2,
  BookOpen,
  Handshake,
  Shield,
  Plus,
  ChevronLeft,
  Clock,
  Landmark,
} from 'lucide-react';

// ─── Indian-Friendly Cultural Emergency Shield Icon ─────────────────────────

function NavEmergencyIcon({ active = false }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Shield className={`w-5 h-5 ${active ? 'text-[#D32F2F] fill-[#D32F2F]/20' : 'text-[#D32F2F]'}`} />
      <Plus className="w-3 h-3 text-[#D32F2F] absolute stroke-[3.5]" />
    </div>
  );
}

// ─── Placeholder screen for Member 3 Referrals & Emergency ───────────────────

function PlaceholderScreen({
  icon: Icon,
  title,
  member,
  description,
  color = 'text-[#008080]',
  btnColor = 'bg-[#008080] hover:bg-[#006666] text-white',
  ctaText,
  onCta,
  onBack,
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-200">
          <Icon className={`w-9 h-9 ${color}`} aria-hidden="true" />
        </div>
        <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFF5EB] text-[#b35900] border border-[#FF9933]/50 mb-3">
          {member}
        </span>
        <h2 className="text-2xl font-extrabold text-[#212121] mb-2">{title}</h2>
        <p className="text-sm sm:text-base text-[#555555] mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {ctaText && onCta && (
            <button
              onClick={onCta}
              className={`w-full sm:w-auto px-5 py-2.5 font-bold rounded-xl text-sm transition-colors shadow-sm ${btnColor}`}
            >
              {ctaText}
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-xl text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Patient Bottom Navigation Items ─────────────────────────────────────────

const PATIENT_NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    Icon: Home,
  },
  {
    key: 'records',
    label: 'Records',
    Icon: BookOpen,
  },
  {
    key: 'timeline',
    label: 'Timeline',
    Icon: Clock,
  },
  {
    key: 'referrals',
    label: 'Referrals',
    Icon: Handshake,
  },
  {
    key: 'emergency',
    label: 'Emergency',
    CustomIcon: NavEmergencyIcon,
  },
  {
    key: 'schemes',
    label: 'Schemes',
    Icon: Landmark,
  },
  {
    key: 'profile',
    label: 'Profile',
    Icon: UserCircle2,
  },
];

// ─── Main Application Shell ───────────────────────────────────────────────────

function App() {
  const {
    role,
    loading,
    hasNoRole,
    isDemoMode,
    demoDataEnabled,
    toggleDemoData,
    isAuthenticated,
    switchDemoRole,
    logout,
    patientProfile
  } = useAuth();

  const [activePatientTab, setActivePatientTab] = useState('home');
  const [showPortalPicker, setShowPortalPicker] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['asha', 'hospital', 'doctor', 'patient'].includes(hash)) return hash;
    }
    return null;
  });
  const [isPatientDemoActive, setIsPatientDemoActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      return hash === 'patient';
    }
    return false;
  });
  const [targetRecordId, setTargetRecordId] = useState(null);

  const [patientRecords, setPatientRecords] = useState([]);
  const [patientTimeline, setPatientTimeline] = useState([]);

  // Fetch patient portal records and timeline in Real Mode
  useEffect(() => {
    if (role === ROLES.PATIENT) {
      if (isDemoMode && demoDataEnabled) {
        setPatientRecords(mockMedicalRecords);
        setPatientTimeline(mockTimelineEvents);
        return;
      }

      if (!patientProfile?.id) {
        setPatientRecords([]);
        setPatientTimeline([]);
        return;
      }

      let isMounted = true;
      const loadPatientPortalData = async () => {
        try {
          // Query medical records
          const { data: recs, error: recsErr } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patientProfile.id)
            .order('created_at', { ascending: false });

          if (recsErr) throw recsErr;

          // Query chronological timeline
          const timeline = await getPatientTimeline(patientProfile.id);

          if (!isMounted) return;

          setPatientRecords((recs || []).map(r => ({
            id: r.id,
            title: r.title,
            modality: r.modality,
            bodyRegion: r.body_region,
            date: new Date(r.created_at).toISOString().slice(0, 10),
            time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            facility: r.facility_name,
            doctor: r.doctor_name,
            radiologistLicense: r.report?.radiologistLicense || 'MCI-MH-11223',
            fileType: r.report?.fileType || 'DICOM Series',
            fileSize: r.report?.fileSize || '15 MB',
            status: 'Verified',
            statusColor: 'emerald',
            aiTriageRisk: r.report?.aiTriageRisk || 'Low Risk',
            thumbnailType: r.modality === 'XR' ? 'xray-chest' : r.modality === 'CT' ? 'ct-abdomen' : 'mri-spine',
            previewUrl: r.record_url || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
            patientFriendlySummary: r.report?.patientFriendlySummary || 'This diagnostic scan is stored in your personal health vault.',
            report: {
              clinicalIndication: r.report?.clinicalIndication || 'Routine review.',
              technique: r.report?.technique || 'Standard imaging scan.',
              findings: r.report?.findings || [],
              impression: r.report?.impression || 'Normal findings.',
              verifiedBy: r.doctor_name
            }
          })));

          setPatientTimeline(timeline);
        } catch (err) {
          console.error('[RadVault Portal] Error fetching patient data:', err.message);
        }
      };

      loadPatientPortalData();
      return () => {
        isMounted = false;
      };
    }
  }, [role, isDemoMode, demoDataEnabled, patientProfile?.id]);

  // Sync role with URL hash on mount & hashchange for native routing in demo mode
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['asha', 'hospital', 'doctor', 'patient'].includes(hash)) {
        setSelectedPortal(hash);
        if (hash === 'patient') {
          setIsPatientDemoActive(true);
          await switchDemoRole(ROLES.PATIENT);
        } else {
          setIsPatientDemoActive(false);
        }
      } else if (!hash) {
        setSelectedPortal(null);
        setIsPatientDemoActive(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when demo role changes
  const handleRoleSelect = async (targetRole) => {
    setShowPortalPicker(false);
    const hashKey = targetRole === ROLES.HOSPITAL_STAFF ? 'hospital' : targetRole;
    window.location.hash = hashKey;
    setSelectedPortal(hashKey);
    if (targetRole === ROLES.PATIENT) {
      setIsPatientDemoActive(true);
    } else {
      setIsPatientDemoActive(false);
    }
    await switchDemoRole(targetRole);
  };

  const handleEnterPatientDemo = async () => {
    setIsPatientDemoActive(true);
    setSelectedPortal('patient');
    window.location.hash = 'patient';
    await switchDemoRole(ROLES.PATIENT);
  };

  const handleViewRecordFromTimeline = (recordId) => {
    setTargetRecordId(recordId);
    setActivePatientTab('records');
  };

  const handleTriggerEmergency = () => {
    setActivePatientTab('emergency');
  };

  // Loading state handler
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <LoadingSpinner message="Determining RadVault care session..." />
      </div>
    );
  }

  // ── UNREGISTERED / UNAUTHENTICATED PORTAL ENTRY FLOW ──
  if (!isAuthenticated && !isPatientDemoActive) {
    if (selectedPortal) {
      return (
        <PortalSignIn
          portalKey={selectedPortal}
          onBack={() => {
            setSelectedPortal(null);
            setIsPatientDemoActive(false);
            window.location.hash = '';
          }}
          onSwitchPortal={(key) => {
            setSelectedPortal(key);
            window.location.hash = key;
            if (key === 'patient') {
              setIsPatientDemoActive(true);
            } else {
              setIsPatientDemoActive(false);
            }
          }}
          onLoginSuccess={() => {
            setSelectedPortal(null);
            setIsPatientDemoActive(false);
            window.location.hash = '';
          }}
          onEnterDemoPatient={handleEnterPatientDemo}
        />
      );
    }

    return (
      <LandingPage
        onSelectPortal={(key) => {
          setSelectedPortal(key);
          window.location.hash = key;
          if (key === 'patient') {
            setIsPatientDemoActive(false);
          }
        }}
      />
    );
  }

  // Authenticated user with missing or invalid role handler
  if (hasNoRole) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <HeartPulse className="w-6 h-6 text-[#008080]" />
            <span className="font-black text-lg text-[#008080]">RadVault</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <NoRoleScreen />
        </main>
      </div>
    );
  }

  const currentRoleConfig = (role && ROLE_CONFIG[role]) || ROLE_CONFIG[ROLES.ASHA];

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#212121] flex flex-col font-sans selection:bg-[#FF9933]/30 selection:text-[#800000]">

      {/* ── Demo / Prototype Notice Banner (Active during Demo Mode only) ── */}
      {isDemoMode && (
        <div className="bg-slate-900 text-slate-200 text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-slate-800">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] animate-pulse" />
              <strong className="text-white uppercase tracking-wider font-extrabold text-[10px] bg-[#FF9933]/20 text-[#FF9933] px-1.5 py-0.2 rounded border border-[#FF9933]/40">
                Prototype Demo Mode
              </strong>
              <span>Client-side role preview for testing. Real authorization is enforced via Supabase Auth + PostgreSQL RLS.</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              Active: {currentRoleConfig.shortLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header (Light Theme with Role Badge & Portal Switcher) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">

          {/* Branding & Active Workspace Identifier */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPortalPicker(!showPortalPicker)}
              className="flex items-center gap-3 group text-left"
              title="Switch role portal"
              aria-expanded={showPortalPicker}
              aria-haspopup="true"
            >
              <div className="w-10 h-10 bg-[#008080]/10 border-2 border-[#008080]/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <HeartPulse className="w-6 h-6 text-[#008080]" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-[#008080] tracking-tight">RadVault</span>
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${currentRoleConfig.badgeColor}`}>
                    {currentRoleConfig.icon} {currentRoleConfig.shortLabel}
                  </span>
                </div>
                <p className="text-[11px] text-[#555555] font-medium leading-none mt-0.5">
                  ASHA-First Digital Care Coordination
                </p>
              </div>
            </button>
          </div>

          {/* Right Side Portal & Role Controls */}
          <div className="flex items-center gap-2">
            {/* ── Demo Data ON/OFF Toggle Button ── */}
            <button
              onClick={toggleDemoData}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                demoDataEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title={demoDataEnabled ? "Click to switch Demo Data OFF (Show real Supabase data only)" : "Click to switch Demo Data ON (Show prototype demo records)"}
              aria-label={`Toggle demo data: Currently ${demoDataEnabled ? 'ON' : 'OFF'}`}
            >
              <span className={`w-2 h-2 rounded-full ${demoDataEnabled ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} aria-hidden="true" />
              <span>Demo Data: <strong className={demoDataEnabled ? 'text-amber-950 font-black' : 'text-slate-800 font-black'}>{demoDataEnabled ? 'ON' : 'OFF'}</strong></span>
            </button>

            <button
              onClick={async () => {
                await logout();
                setIsPatientDemoActive(false);
                setSelectedPortal(null);
                window.location.hash = '';
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isPatientDemoActive ? 'Exit Demo' : 'Sign Out'}
            </button>
            <button
              onClick={() => setShowPortalPicker(!showPortalPicker)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              aria-label="Switch system portal view"
            >
              <span className="w-2 h-2 rounded-full bg-[#008080] animate-pulse" aria-hidden="true" />
              Workspaces
            </button>
          </div>
        </div>

        {/* ── Multi-Role Portal Switcher Dropdown ── */}
        {showPortalPicker && (
          <div className="max-w-5xl mx-auto mt-3 p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-[#555555] uppercase tracking-wider">
                  {isDemoMode ? 'Prototype Role Switcher (Demo Mode)' : 'Authorized Workspaces'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {isDemoMode
                    ? 'Preview the 3 core healthcare personas (ASHA, Hospital Staff, Doctor) and the beneficiary view.'
                    : 'Your workspace is assigned according to your verified clinical credentials.'}
                </p>
              </div>
              <button
                onClick={() => setShowPortalPicker(false)}
                className="text-xs text-[#555555] hover:text-[#212121] font-bold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. ASHA / Frontline Worker */}
              <div
                onClick={() => handleRoleSelect(ROLES.ASHA)}
                role="button"
                tabIndex={0}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                  role === ROLES.ASHA
                    ? 'bg-[#FFF5EB] border-[#FF9933] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-[#FF9933]/60 hover:bg-[#FFF5EB]/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">👩‍⚕️</span>
                  <span className="font-extrabold text-sm text-[#212121]">ASHA Worker</span>
                  {role === ROLES.ASHA && (
                    <span className="text-[10px] bg-[#FF9933] text-white font-bold px-1.5 py-0.2 rounded ml-auto">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#555555] line-clamp-2">
                  Primary user: Patient registration, vitals, AI triage & referrals.
                </p>
              </div>

              {/* 2. Hospital Staff / Operations */}
              <div
                onClick={() => handleRoleSelect(ROLES.HOSPITAL_STAFF)}
                role="button"
                tabIndex={0}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                  role === ROLES.HOSPITAL_STAFF
                    ? 'bg-[#E6F2F2] border-[#008080] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-[#008080]/60 hover:bg-[#E6F2F2]/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">🏥</span>
                  <span className="font-extrabold text-sm text-[#212121]">Hospital Staff</span>
                  {role === ROLES.HOSPITAL_STAFF && (
                    <span className="text-[10px] bg-[#008080] text-white font-bold px-1.5 py-0.2 rounded ml-auto">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#555555] line-clamp-2">
                  Operational user: Referral intake queue, doctor routing & arrivals.
                </p>
              </div>

              {/* 3. Doctor / Clinical Specialist */}
              <div
                onClick={() => handleRoleSelect(ROLES.DOCTOR)}
                role="button"
                tabIndex={0}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                  role === ROLES.DOCTOR
                    ? 'bg-[#FDF2F2] border-[#800000] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-[#800000]/60 hover:bg-[#FDF2F2]/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">🩺</span>
                  <span className="font-extrabold text-sm text-[#212121]">Doctor Specialist</span>
                  {role === ROLES.DOCTOR && (
                    <span className="text-[10px] bg-[#800000] text-white font-bold px-1.5 py-0.2 rounded ml-auto">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#555555] line-clamp-2">
                  Clinical user: Consultation, imaging review & treatment advice.
                </p>
              </div>

              {/* 4. Patient (Beneficiary View) */}
              <div
                onClick={() => handleRoleSelect(ROLES.PATIENT)}
                role="button"
                tabIndex={0}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                  role === ROLES.PATIENT
                    ? 'bg-slate-100 border-slate-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">👤</span>
                  <span className="font-extrabold text-sm text-[#212121]">Patient Portal</span>
                  {role === ROLES.PATIENT && (
                    <span className="text-[10px] bg-slate-700 text-white font-bold px-1.5 py-0.2 rounded ml-auto">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#555555] line-clamp-2">
                  Beneficiary: Personal health record vault, emergency ID & timeline.
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content Area (Role-Guarded Workspaces) ── */}
      <main className="flex-1" id="main-content">

        {/* ── WORKSPACE 1: ASHA / Frontline Health Worker (Primary) ── */}
        {role === ROLES.ASHA && (
          <RoleGuard allowedRoles={[ROLES.ASHA]}>
            <AshaWorkspace
              onNavigateToPatientView={() => handleRoleSelect(ROLES.PATIENT)}
            />
          </RoleGuard>
        )}

        {/* ── WORKSPACE 2: Hospital Staff / Operations ── */}
        {role === ROLES.HOSPITAL_STAFF && (
          <RoleGuard allowedRoles={[ROLES.HOSPITAL_STAFF]}>
            <HospitalStaffWorkspace
              onNavigateToPatientView={() => handleRoleSelect(ROLES.PATIENT)}
            />
          </RoleGuard>
        )}

        {/* ── WORKSPACE 3: Doctor / Clinical Specialist ── */}
        {role === ROLES.DOCTOR && (
          <RoleGuard allowedRoles={[ROLES.DOCTOR]}>
            <DoctorWorkspace
              onNavigateToPatientView={() => handleRoleSelect(ROLES.PATIENT)}
            />
          </RoleGuard>
        )}

        {/* ── WORKSPACE 4: Patient Portal (Beneficiary View - Full Existing Tabs) ── */}
        {role === ROLES.PATIENT && (
          <RoleGuard allowedRoles={[ROLES.PATIENT]}>
            <div className="pb-24">
              {/* Tab 1: Member 1 - Patient Home Dashboard */}
              {activePatientTab === 'home' && (
                <PatientHome onNavigate={setActivePatientTab} />
              )}

              {/* Tab 2: Member 2 - Medical Records Vault (Sujay's Module) */}
              {activePatientTab === 'records' && (
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#008080]">Medical Records & Vault</h2>
                      <p className="text-sm text-[#555555]">Digitized radiological scans, lab reports, and doctor prescriptions.</p>
                    </div>
                    <button
                      onClick={() => setActivePatientTab('home')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Home
                    </button>
                  </div>
                  <MedicalRecordsList
                    records={patientRecords}
                    initialSelectedRecordId={targetRecordId}
                    patient={patientProfile || mockPatient}
                  />
                </div>
              )}

              {/* Tab 3: Member 2 - Health Timeline (Sujay's Module) */}
              {activePatientTab === 'timeline' && (
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#008080]">Health Timeline</h2>
                      <p className="text-sm text-[#555555]">Chronological timeline of consultations, scans, and triage events.</p>
                    </div>
                    <button
                      onClick={() => setActivePatientTab('home')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Home
                    </button>
                  </div>
                  <HealthTimeline
                    events={patientTimeline}
                    onViewRecord={handleViewRecordFromTimeline}
                  />
                </div>
              )}

              {/* Tab 4: Member 3 - Specialist Referrals (ASHA Triage Module) */}
              {activePatientTab === 'referrals' && (
                <ReferralsDashboard onBack={() => setActivePatientTab('home')} />
              )}

              {/* Tab 5: Member 3 - Emergency Break-Glass ID */}
              {activePatientTab === 'emergency' && (
                <PlaceholderScreen
                  icon={NavEmergencyIcon}
                  title="Emergency Break-Glass ID"
                  member="Team A Member 3 · Module"
                  description="Generate emergency QR codes exposing only critical triage info (Blood group, allergies, emergency contacts) with audit logging."
                  color="text-[#D32F2F]"
                  btnColor="bg-[#FF9933] hover:bg-[#E68A2E] text-slate-950"
                  ctaText="Generate One-Time Emergency QR"
                  onCta={() => alert('🚨 Emergency QR Generated: Scan to view minimum critical blood group & allergy triage data.')}
                  onBack={() => setActivePatientTab('home')}
                />
              )}

              {/* Tab 6: Public Benefits - Government Health Schemes */}
              {activePatientTab === 'schemes' && (
                <GovernmentSchemes onBack={() => setActivePatientTab('home')} />
              )}

              {/* Tab 7: Member 2 - Patient Profile & Conditions (Sujay's Module) */}
              {activePatientTab === 'profile' && (
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#008080]">Patient Profile & Health Details</h2>
                      <p className="text-sm text-[#555555]">Demographics, critical conditions, allergies, and vitals history.</p>
                    </div>
                    <button
                      onClick={() => setActivePatientTab('home')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Home
                    </button>
                  </div>
                  {!isDemoMode && !patientProfile ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700 text-xl font-bold">
                        ⚠️
                      </div>
                      <h3 className="text-base font-bold text-amber-900">Patient Profile Not Linked</h3>
                      <p className="text-sm text-amber-700 max-w-md mx-auto">
                        Your login is authenticated, but no registered patient record is associated with your account yet. Please coordinate with your local ASHA worker to link your profile.
                      </p>
                    </div>
                  ) : (
                    <div className="rv-profile-layout">
                      <div className="rv-profile-top-grid">
                        <PatientProfileCard
                          patient={isDemoMode ? mockPatient : (patientProfile || {})}
                          onTriggerEmergencyQR={handleTriggerEmergency}
                        />
                        <PatientVitals vitals={mockVitals} />
                      </div>
                      <PatientConditions
                        allergies={mockAllergies}
                        conditions={mockConditions}
                        medications={mockMedications}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── Patient Bottom Navigation Bar ── */}
              <nav
                className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-2 shadow-lg"
                aria-label="Patient portal navigation"
              >
                <div className="max-w-md mx-auto flex items-center justify-around">
                  {PATIENT_NAV_ITEMS.map(({ key, label, Icon, CustomIcon }) => {
                    const isActive = activePatientTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setActivePatientTab(key);
                          setTargetRecordId(null);
                        }}
                        className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all min-w-[50px] relative group ${
                          isActive
                            ? 'text-[#800000] font-extrabold bg-[#800000]/8 scale-105'
                            : 'text-[#555555] hover:text-[#008080] hover:bg-[#008080]/5'
                        }`}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {isActive && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-[#FF9933] rounded-full" />
                        )}

                        {CustomIcon ? (
                          <CustomIcon active={isActive} />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? 'text-[#800000]' : 'text-[#008080]/80 group-hover:text-[#008080]'}`} aria-hidden="true" />
                        )}
                        <span className="text-[10px] font-bold leading-none tracking-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </RoleGuard>
        )}
      </main>
    </div>
  );
}

export default App;
