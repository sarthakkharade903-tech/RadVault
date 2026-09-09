import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Inbox,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  RefreshCw,
  Phone,
  FileText,
  Stethoscope,
  Activity,
  Building2,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Ticket,
  Clock,
  Siren,
  Volume2,
  VolumeX,
  MapPin,
  UserCheck
} from 'lucide-react';
import { supabase, ensureRoleAuth } from '../../services/supabase';
import { assignStaffTokenAndSlot } from '../../services/ashaService';
import {
  updateEmergencyDispatch,
  parseEmergencyRecord
} from '../../services/emergencyService';

// Canonical Referral Status constants
const REFERRAL_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  ARRIVED: 'Arrived',
  ASSIGNED: 'Assigned',
  IN_CONSULTATION: 'In Consultation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

// Initial Demo/Mock Data for standalone testing in Demo Mode
const DEMO_DOCTORS = [
  { id: 'd-1', name: 'Dr. Arvind Kulkarni', specialty: 'Cardiology' },
  { id: 'd-2', name: 'Dr. Priya Sharma', specialty: 'General Medicine' },
  { id: 'd-3', name: 'Dr. Meera Nambiar', specialty: 'Pediatrics' }
];

const INITIAL_DEMO_REFERRALS = [
  {
    id: 'REF-DEMO-001',
    patient_id: 'pat-demo-1',
    patient_unified_id: 'MH-P-10482',
    patient_name: 'Rajesh Kumar',
    patient_phone: '9876543210',
    patient_age: 48,
    patient_gender: 'Male',
    patient_blood_group: 'B+',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'Cardiology',
    doctor_assigned: 'On-Duty Specialist',
    priority: 'HIGH',
    priority_label: 'Emergency / Immediate Attention',
    status: REFERRAL_STATUS.PENDING,
    symptoms: 'Chest tightness and intermittent breathlessness. Notes: Patient reports radiating pain to arm.',
    ai_note: 'Triage Risk: High. Suspected acute coronary event or severe cardiac ischemia. Urgent ECG and cardiology evaluation recommended upon intake.',
    vitals: { bp: '142/90', pulse: '88', spo2: '95', temp: '98.6', respRate: '20', weight: '68' },
    danger_signs: ['Crushing chest pain, pressure, or radiating pain to arm/jaw'],
    created_at: new Date().toISOString()
  },
  {
    id: 'REF-DEMO-002',
    patient_id: 'pat-demo-2',
    patient_unified_id: 'MH-P-44021',
    patient_name: 'Sunita Patil',
    patient_phone: '9123456789',
    patient_age: 26,
    patient_gender: 'Female',
    patient_blood_group: 'O+',
    is_pregnant: true,
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'Gynecology & Obstetrics',
    doctor_assigned: 'On-Duty Specialist',
    priority: 'ORANGE',
    priority_label: 'Urgent / Within 24 Hours',
    status: REFERRAL_STATUS.ACCEPTED,
    symptoms: 'Mild headache and swelling. Notes: Antenatal follow-up check. ASHA ACCOMPANYING.',
    ai_note: 'Gestational monitoring: 28 weeks gestation with mild pedal edema and borderline elevated systolic pressure. Rule out early preeclampsia.',
    vitals: { bp: '134/86', pulse: '82', spo2: '98', temp: '98.4', respRate: '18', weight: '71' },
    danger_signs: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'REF-DEMO-003',
    patient_id: 'pat-demo-3',
    patient_unified_id: 'MH-P-99821',
    patient_name: 'Amit Shinde',
    patient_phone: '8888888888',
    patient_age: 34,
    patient_gender: 'Male',
    patient_blood_group: 'A+',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'General Medicine',
    doctor_assigned: 'Dr. Priya Sharma',
    priority: 'GREEN',
    priority_label: 'Routine / Local Care',
    status: REFERRAL_STATUS.ARRIVED,
    symptoms: 'Mild fever and sore throat. Notes: Seasonal throat infection.',
    ai_note: 'Upper respiratory infection symptoms. Vitals stable. Standard symptomatic treatment protocol advised.',
    vitals: { bp: '118/76', pulse: '76', spo2: '99', temp: '99.8', respRate: '16', weight: '62' },
    danger_signs: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'REF-DEMO-004',
    patient_id: 'pat-demo-4',
    patient_unified_id: 'MH-P-55210',
    patient_name: 'Anand Bhosle',
    patient_phone: '9822114455',
    patient_age: 42,
    patient_gender: 'Male',
    patient_blood_group: 'AB+',
    created_by: 'Direct Patient (Self-Booking)',
    source: 'PATIENT_DIRECT',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'General Medicine',
    doctor_assigned: null,
    priority: 'GREEN',
    priority_label: 'Routine / Direct OPD',
    status: REFERRAL_STATUS.PENDING,
    symptoms: 'Self-scheduled morning consultation for mild recurring joint pain.',
    ai_note: 'Routine outpatient consultation request from patient portal.',
    vitals: { bp: '122/80', pulse: '74', spo2: '99', temp: '98.4', respRate: '16', weight: '70' },
    danger_signs: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'REF-DEMO-005',
    patient_id: 'pat-demo-5',
    patient_unified_id: 'MH-P-88319',
    patient_name: 'Kavita Jadhav',
    patient_phone: '9423001122',
    patient_age: 29,
    patient_gender: 'Female',
    patient_blood_group: 'B+',
    created_by: 'Virtual Teleconsultation (eSanjeevani)',
    source: 'TELECONSULT',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'Pediatrics',
    doctor_assigned: 'Dr. Meera Nambiar',
    priority: 'ORANGE',
    priority_label: 'Teleconsult / Virtual Queue',
    status: REFERRAL_STATUS.ACCEPTED,
    symptoms: 'Virtual teleconsultation requested for 3-year-old child with persistent seasonal cough and fever.',
    ai_note: 'Virtual OPD session pending. Video room active.',
    vitals: { bp: '110/70', pulse: '88', spo2: '97', temp: '100.2', respRate: '22', weight: '14' },
    danger_signs: [],
    created_at: new Date().toISOString()
  }
];

const DEMO_EMERGENCY_SOS = [
  {
    id: 'sos-demo-1',
    refId: 'SOS-MH-8419',
    patient_id: '00000000-0000-0000-0000-000000000000',
    patient_name: 'Santosh Shinde',
    phone: '9822334455',
    village: 'Wadgaon Phata (4.2 km from PHC)',
    gps: '19.6154,74.6532',
    mapsLink: 'https://maps.google.com/?q=19.6154,74.6532',
    cadCategory: 'CAT 1',
    nature: 'Cardiac / Chest Pain / Unconscious',
    consciousness: 'Drowsy',
    breathing: 'Gasping',
    signs: 'Crushing chest pressure radiating to arm, cold diaphoresis',
    ambulanceStatus: 'NONE',
    ambulanceEta: '10-15 mins',
    ambulanceVehicle: '108-MH-12-8821',
    ashaStatus: 'NONE',
    callLogged: false,
    doctorStatus: 'NONE',
    status: 'PENDING_DISPATCH',
    source: 'EMERGENCY_SOS',
    priority: 'EMERGENCY',
    reason: '[EMERGENCY SOS CAT 1] Cardiac / Chest Pain. Caller: 9822334455, Location: Wadgaon Phata. Consciousness: Drowsy, Breathing: Gasping.',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  }
];

// Helper: Operational elapsed time formatting
const getWaitDuration = (isoString) => {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs === 1 ? '' : 's'} ${mins % 60}m`;
};

// ─── REFERRAL CARD: CARE-HANDOFF FIRST / ONE DOMINANT ACTION ───
function ReferralActionCard({
  refItem,
  onSelect,
  onAccept,
  onMarkArrived,
  onRouteDoctor,
  onOpenToken,
  getReferralOrigin
}) {
  const origin = getReferralOrigin(refItem);
  const dangerSigns = Array.isArray(refItem.danger_signs)
    ? refItem.danger_signs
    : (typeof refItem.danger_signs === 'string' && refItem.danger_signs.trim())
    ? [refItem.danger_signs]
    : [];

  const vitals = refItem.vitals || {};
  const status = refItem.status;

  // Truthful operational status configuration
  const statusConfig = {
    Pending: {
      label: 'Referral Received',
      pillClass: 'bg-amber-50 text-amber-900 border-amber-300'
    },
    Accepted: {
      label: 'Referral Accepted',
      pillClass: 'bg-sky-50 text-sky-900 border-sky-300'
    },
    Arrived: {
      label: 'Patient Arrived',
      pillClass: 'bg-teal-50 text-teal-900 border-teal-300'
    },
    Assigned: {
      label: refItem.doctor_assigned
        ? `Waiting for ${refItem.doctor_assigned.startsWith('Dr.') ? refItem.doctor_assigned : 'Dr. ' + refItem.doctor_assigned}`
        : 'Clinician Assigned',
      pillClass: 'bg-indigo-50 text-indigo-900 border-indigo-300'
    },
    'In Consultation': {
      label: refItem.doctor_assigned
        ? `In Consultation with ${refItem.doctor_assigned.startsWith('Dr.') ? refItem.doctor_assigned : 'Dr. ' + refItem.doctor_assigned}`
        : 'In Consultation',
      pillClass: 'bg-purple-50 text-purple-900 border-purple-300'
    },
    Completed: {
      label: 'Consultation Completed',
      pillClass: 'bg-emerald-50 text-emerald-900 border-emerald-300'
    },
    Cancelled: {
      label: 'Referral Cancelled',
      pillClass: 'bg-slate-100 text-slate-700 border-slate-300'
    }
  };

  const currentStatus = statusConfig[status] || {
    label: status,
    pillClass: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  const hasAssignedToken = refItem.slot_preference?.includes('Token') || refItem.ai_note?.includes('TOKEN:');
  const tokenDisplay = refItem.slot_preference || (refItem.ai_note?.match(/TOKEN:\s*([^|]+)/i)?.[1]?.trim() ? `Token #${refItem.ai_note.match(/TOKEN:\s*([^|]+)/i)[1].trim()}` : null);

  const hasVitals = vitals.bp || vitals.pulse || vitals.spo2 || vitals.temp || vitals.respRate || vitals.weight;

  return (
    <div
      data-referral-id={refItem.id}
      data-patient-name={refItem.patient_name}
      onClick={() => onSelect(refItem)}
      className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-[#008080]/60 hover:shadow-md transition-all cursor-pointer group space-y-3.5"
    >
      {/* ── LEVEL 1: IMMEDIATE (Identity + State + Dominant Action) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#008080] transition-colors flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#008080] shrink-0" />
            <span>{refItem.patient_name}</span>
          </span>

          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold">
            {refItem.patient_unified_id ? `ID: ${refItem.patient_unified_id}` : (refItem.patient_id ? `ID: ${refItem.patient_id.slice(0, 8)}` : 'ID: Pending')}
          </span>

          {/* Referral Origin Badge */}
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${origin.badge}`}>
            <span>{origin.icon}</span>
            <span>{origin.label}</span>
          </span>

          {/* Authoritative Priority Badge */}
          {refItem.priority && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
              refItem.priority === 'HIGH' || refItem.priority === 'RED'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : refItem.priority === 'ORANGE'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {refItem.priority_label || refItem.priority}
            </span>
          )}

          {/* ASHA Escort Indicator */}
          {(refItem.symptoms?.includes('ASHA ACCOMPANYING') || refItem.clinical_summary?.includes('ASHA ACCOMPANYING')) && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              🤰 ASHA Escort
            </span>
          )}
        </div>

        {/* Operational Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-2xs ${currentStatus.pillClass}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* ── LEVEL 2: IMPORTANT CLINICAL & HANDOFF CONTEXT ── */}
      <div className="space-y-2 text-xs">
        {/* Chief Complaint / Symptoms */}
        <div className="text-slate-700 font-medium leading-relaxed">
          <span className="font-bold text-slate-900">Chief Complaint:</span> {refItem.symptoms || 'Referral intake encounter'}
        </div>

        {/* Recorded Danger Signs */}
        {dangerSigns.length > 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-bold flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black uppercase text-[10px] text-rose-700 block tracking-wider">Recorded Danger Signs:</span>
              <span>{dangerSigns.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Frontline Measured Vitals: Data Availability Indicator (Full vitals in Details) */}
        {hasVitals && (
          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-md">
              <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Frontline vitals recorded</span>
            </span>
          </div>
        )}

        {/* Care Handoff Trajectory & Origin */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
          <span className="font-medium text-slate-600">
            From: <strong className="text-slate-800">{origin.label}</strong>{refItem.created_by ? ` · ${refItem.created_by}` : ''}
          </span>

          {tokenDisplay && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008F83] bg-[#E8F7F3] border border-[#008F83]/30 px-2.5 py-0.5 rounded-md font-mono shadow-2xs">
              <Ticket className="w-3 h-3" />
              <span>{tokenDisplay}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── LEVEL 3: ACTION BAR (>= 44px Touch Targets) ── */}
      <div
        className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[11px] text-slate-400 font-medium">
          {refItem.destination_department && (
            <span>Dept: <strong className="text-slate-600">{refItem.destination_department}</strong></span>
          )}
        </div>

        {/* Action Cluster: ONE DOMINANT ACTION + Secondary Actions */}
        <div className="flex items-center gap-2.5 ml-auto shrink-0 flex-wrap">
          {/* Secondary Action: View Details / Case File (>= 44px touch height) */}
          <button
            type="button"
            data-referral-id={refItem.id}
            data-action="view-case"
            onClick={() => onSelect(refItem)}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
            title="Open Clinical Case Details"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{status === 'Completed' ? 'View Case File' : 'Details'}</span>
          </button>

          {/* Secondary Action: Assign Token (>= 44px touch height) */}
          {(status === 'Accepted' || status === 'Pending') && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="assign-token"
              onClick={() => onOpenToken(refItem)}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
              title="Assign or Edit OPD Token & Arrival Slot"
            >
              <Ticket className="w-4 h-4 text-amber-700" />
              <span>{hasAssignedToken ? 'Edit Token' : 'Assign Token'}</span>
            </button>
          )}

          {/* ─── DOMINANT PRIMARY NEXT-STEP ACTION (>= 44px Touch Height) ─── */}
          {status === 'Pending' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="accept-referral"
              onClick={() => onAccept(refItem.id)}
              className="min-h-[44px] px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Referral</span>
            </button>
          )}

          {status === 'Accepted' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="mark-arrived"
              onClick={() => onMarkArrived(refItem.id)}
              className="min-h-[44px] px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark Patient Arrived</span>
            </button>
          )}

          {status === 'Arrived' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="send-to-doctor"
              onClick={() => onRouteDoctor(refItem)}
              className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Assign Doctor</span>
            </button>
          )}

          {status === 'Assigned' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="reassign-doctor"
              onClick={() => onRouteDoctor(refItem)}
              className="min-h-[44px] px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              <span>Reassign Doctor</span>
            </button>
          )}

          {status === 'In Consultation' && (
            <span className="min-h-[44px] px-4 py-2 text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 rounded-xl inline-flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-purple-600" />
              <span>With {refItem.doctor_assigned ? (refItem.doctor_assigned.startsWith('Dr.') ? refItem.doctor_assigned : 'Dr. ' + refItem.doctor_assigned) : 'Clinician'}</span>
            </span>
          )}

          {status === 'Completed' && (
            <span className="min-h-[44px] px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Encounter Closed</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HospitalStaffWorkspace({
  isDemoMode = false,
  demoDataEnabled = true,
  onBack,
  goHome,
  onNavigateToPatientView: _onNavigateToPatientView
}) {
  const handleBack = onBack || goHome;

  // Navigation Tabs: 'home' | 'queue' | 'referrals' | 'emergency'
  const [activeTab, setActiveTab] = useState('home');
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Accepted_Arrived' | 'In_Consultation' | 'Completed'
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'ASHA' | 'PATIENT_DIRECT' | 'TELECONSULT'
  const [searchQuery, setSearchQuery] = useState('');

  // Operational State
  const [referrals, setReferrals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staffProfile, setStaffProfile] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ─── Emergency SOS Dispatch CAD State ───
  const [emergencyCases, setEmergencyCases] = useState([]);
  const [allEmergencyLogs, setAllEmergencyLogs] = useState([]);
  const [emergencyAlarmMuted, setEmergencyAlarmMuted] = useState(false);
  const [emergencyFilter, setEmergencyFilter] = useState('ACTIVE'); // 'ACTIVE' | 'ALL' | 'RESOLVED'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [dispatchModalSOS, setDispatchModalSOS] = useState(null);
  const [ambulanceVehicleInput, setAmbulanceVehicleInput] = useState('108-MH-12-8821');
  const [ambulanceEtaInput, setAmbulanceEtaInput] = useState('10-12 mins');

  // Referral Origin & Pipeline Helper
  const getReferralOrigin = useCallback((ref) => {
    const text = `${ref.source || ''} ${ref.created_by || ''} ${ref.symptoms || ''}`.toLowerCase();
    if (text.includes('teleconsult')) {
      return { key: 'TELECONSULT', label: 'Virtual Teleconsult', icon: '📹', badge: 'bg-[#E8F7F3] text-[#008F83] border-[#008F83]/30' };
    }
    if (text.includes('patient') || text.includes('self-booking') || text.includes('self-scheduled') || text.includes('direct opd')) {
      return { key: 'PATIENT_DIRECT', label: 'Direct Patient Booking', icon: '👤', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return { key: 'ASHA', label: 'ASHA Field Referral', icon: '🚨', badge: 'bg-red-50 text-red-700 border-red-200' };
  }, []);

  // Selected Referral Context / Modals
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDoctorRouteModal, setShowDoctorRouteModal] = useState(null); // holds referral object

  // ─── Token & Arrival Slot Allocation Modal State ───
  const [showTokenModal, setShowTokenModal] = useState(null); // referral object to schedule
  const [assignTokenNum, setAssignTokenNum] = useState('SHIR-OPD-014');
  const [assignSlot, setAssignSlot] = useState('10:30 AM – 11:00 AM');
  const [assignRoom, setAssignRoom] = useState('Counter 2 · General OPD');
  const [assignDoctor, setAssignDoctor] = useState('Dr. Arvind Kulkarni');
  const [assignInstruction, setAssignInstruction] = useState('Report directly to Counter 2 with this token for priority triage.');
  const [assigningLoading, setAssigningLoading] = useState(false);

  const handleOpenTokenModal = (ref) => {
    const randomToken = `SHIR-OPD-0${Math.floor(10 + Math.random() * 89)}`;
    const existingToken =
      ref.slot_preference?.match(/Token\s*#?([A-Z0-9-]+)/i)?.[1]?.trim() ||
      ref.ai_note?.match(/TOKEN:\s*([^|]+)/i)?.[1]?.trim() ||
      ref.asha_notes?.match(/TOKEN:\s*([^|]+)/i)?.[1]?.trim() ||
      randomToken;
    const existingSlot =
      (ref.slot_preference?.includes('·') ? ref.slot_preference.split('·')[1]?.trim() : null) ||
      ref.ai_note?.match(/SLOT:\s*([^|]+)/i)?.[1]?.trim() ||
      ref.asha_notes?.match(/SLOT:\s*([^|]+)/i)?.[1]?.trim() ||
      '10:30 AM – 11:00 AM';

    setAssignTokenNum(existingToken);
    setAssignSlot(existingSlot);
    setAssignRoom('Counter 2 · General OPD');
    setAssignDoctor('Dr. Arvind Kulkarni (Medical Officer)');
    setAssignInstruction('Report directly to Counter 2 with this token for priority triage.');
    setShowTokenModal(ref);
  };

  const handleConfirmTokenAssignment = async () => {
    if (!showTokenModal) return;
    setAssigningLoading(true);
    try {
      if (!isDemoMode) {
        const res = await assignStaffTokenAndSlot({
          referralId: showTokenModal.id,
          careRequestId: showTokenModal.id,
          tokenNumber: assignTokenNum,
          arrivalSlot: assignSlot,
          room: assignRoom,
          doctorAssigned: assignDoctor,
          instructions: assignInstruction
        });
        if (!res?.success) {
          throw res?.error || new Error('Failed to update referral token assignment');
        }
      }

      const assignedNote = `TOKEN:${assignTokenNum} | SLOT:${assignSlot} | ROOM:${assignRoom} | INSTRUCTION:${assignInstruction}`;
      const slotPref = `Token #${assignTokenNum} · ${assignSlot}`;

      // Scoped strictly to the target referral ID (no patient_id multi-match)
      setReferrals(prev => prev.map(r => r.id === showTokenModal.id ? {
        ...r,
        status: 'Accepted',
        doctor_assigned: `${assignDoctor} (${assignRoom})`,
        ai_note: assignedNote,
        asha_notes: assignedNote,
        slot_preference: slotPref
      } : r));

      if (selectedReferral && selectedReferral.id === showTokenModal.id) {
        setSelectedReferral(prev => ({
          ...prev,
          status: 'Accepted',
          doctor_assigned: `${assignDoctor} (${assignRoom})`,
          ai_note: assignedNote,
          asha_notes: assignedNote,
          slot_preference: slotPref
        }));
      }

      showToast(`✓ Official Token #${assignTokenNum} & slot ${assignSlot} assigned to ${showTokenModal.patient_name}.`);
      setShowTokenModal(null);
      setTimeout(() => loadSupabaseData(true), 3000);
    } catch (err) {
      setError(`Failed to assign token: ${err.message}`);
    } finally {
      setAssigningLoading(false);
    }
  };

  // Fetch real data from Supabase
  const loadSupabaseData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');

    if (isDemoMode) {
      setStaffProfile({
        name: 'Sagar Deshpande (Operations Desk)',
        phc_name: 'Shrirampur Primary Health Centre'
      });
      setFacility({
        id: 'f1111111-1111-1111-1111-111111111111',
        name: 'Shrirampur Primary Health Centre',
        district: 'Ahmednagar'
      });
      setDoctors(DEMO_DOCTORS);
      setReferrals(demoDataEnabled ? INITIAL_DEMO_REFERRALS : []);
      if (!isSilent) setLoading(false);
      return;
    }

    try {
      // 1. Ensure authenticated session for Hospital Receptionist
      await ensureRoleAuth('reception');
      const { data: { user: activeUser } } = await supabase.auth.getUser();

      if (!activeUser) {
        throw new Error('Authentication failed for Hospital Reception staff. Please check Supabase credentials.');
      }

      // 2. Fetch Hospital Staff Profile and Facility
      const { data: staffData, error: staffErr } = await supabase
        .from('hospital_staff')
        .select('*, facilities(*)')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      if (staffErr) throw staffErr;

      if (!staffData) {
        throw new Error(`Hospital staff record not found for user account (${activeUser.email}). Please verify your staff profile mapping in the database.`);
      }

      const resolvedFacilityId = staffData.facility_id;
      const resolvedFacilityName = staffData.facilities?.name || 'Shrirampur Primary Health Centre';
      const resolvedFacilityDistrict = staffData.facilities?.district || 'District';
      const resolvedStaffName = staffData.name || activeUser.email?.split('@')[0] || 'Hospital Staff';

      setStaffProfile({
        name: resolvedStaffName,
        role: staffData.role || 'Hospital Staff Operations',
        phc_name: resolvedFacilityName
      });

      setFacility({
        id: resolvedFacilityId,
        name: resolvedFacilityName,
        district: resolvedFacilityDistrict
      });

      // 3. Fetch Scoped Doctors for this Facility
      const { data: doctorsData, error: docErr } = await supabase
        .from('doctors')
        .select('*')
        .eq('facility_id', resolvedFacilityId);

      if (docErr) console.warn('[HospitalStaff] doctors query warning:', docErr.message);

      setDoctors(doctorsData || []);

      // 4. Fetch Canonical Referrals for this Facility (Strictly Scoped)
      const { data: refData, error: refErr } = await supabase
        .from('referrals')
        .select('*')
        .eq('destination_facility_id', resolvedFacilityId)
        .order('created_at', { ascending: false });

      if (refErr) throw refErr;

      // 5. Separately Fetch Emergency SOS from care_requests (Emergency CAD Console)
      try {
        const { data: careData } = await supabase
          .from('care_requests')
          .select('*')
          .eq('source', 'EMERGENCY_SOS')
          .order('created_at', { ascending: false });

        if (careData && careData.length > 0) {
          const emergencies = careData.map(parseEmergencyRecord);
          const activeEmergencies = emergencies.filter(c => c.status !== 'RESOLVED' && c.status !== 'COMPLETED');
          setEmergencyCases(activeEmergencies);
          setAllEmergencyLogs(emergencies);
        } else if (isDemoMode && demoDataEnabled) {
          setEmergencyCases(DEMO_EMERGENCY_SOS);
          setAllEmergencyLogs(DEMO_EMERGENCY_SOS);
        } else {
          setEmergencyCases([]);
          setAllEmergencyLogs([]);
        }
      } catch (cErr) {
        console.warn('[HospitalStaff] Emergency SOS CAD fetch notice:', cErr.message);
        if (isDemoMode && demoDataEnabled) {
          setEmergencyCases(DEMO_EMERGENCY_SOS);
          setAllEmergencyLogs(DEMO_EMERGENCY_SOS);
        } else {
          setEmergencyCases([]);
          setAllEmergencyLogs([]);
        }
      }

      // Canonical physical referrals strictly from public.referrals
      // Strict Demo OFF discipline: Never inject demo referrals when Demo is OFF
      const combinedRefs = isDemoMode
        ? (demoDataEnabled ? INITIAL_DEMO_REFERRALS : [])
        : (refData || []);

      // 6. Enrich referrals with patients' human-readable unified_id (MH-P-xxxxx)
      const patientIds = Array.from(new Set(combinedRefs.map(r => r.patient_id).filter(Boolean)));

      let patientsMap = {};
      if (patientIds.length > 0) {
        try {
          const { data: pts } = await supabase
            .from('patients')
            .select('id, unified_id, full_name, age, gender, phone_number, blood_group')
            .in('id', patientIds);

          if (pts && pts.length > 0) {
            pts.forEach(p => {
              patientsMap[p.id] = p;
            });
          }
        } catch (pErr) {
          console.warn('[RADVAULT] Could not join patient profiles:', pErr.message);
        }
      }

      const enrichedRefs = combinedRefs.map(r => {
        const linkedPatient = patientsMap[r.patient_id];
        return {
          ...r,
          patient_name: r.patient_name || linkedPatient?.full_name || 'Patient',
          patient_unified_id: linkedPatient?.unified_id || (r.patient_id && !r.patient_id.includes('-') ? r.patient_id : null),
          patient_phone: linkedPatient?.phone_number || r.vitals?.phone || null,
          patient_age: linkedPatient?.age || null,
          patient_gender: linkedPatient?.gender || null,
          patient_blood_group: linkedPatient?.blood_group || null
        };
      });

      setReferrals(prev => {
        if (!prev || prev.length === 0) return enrichedRefs;
        const statusOrder = ['Pending', 'Accepted', 'Arrived', 'Assigned', 'In Consultation', 'Completed', 'Cancelled'];
        const localMap = new Map(prev.map(r => [r.id, r]));
        return enrichedRefs.map(remoteRef => {
          const local = localMap.get(remoteRef.id);
          if (!local) return remoteRef;
          const localIdx = statusOrder.indexOf(local.status);
          const remoteIdx = statusOrder.indexOf(remoteRef.status);
          if (localIdx > remoteIdx && localIdx >= 0) {
            return {
              ...remoteRef,
              status: local.status,
              doctor_assigned: local.doctor_assigned || remoteRef.doctor_assigned,
              doctor_id: local.doctor_id || remoteRef.doctor_id
            };
          }
          return remoteRef;
        });
      });

    } catch (err) {
      console.error('[RADVAULT][PHC_REFERRAL_LOAD] Data load error:', err.message);
      setError(`Unable to load live referrals: ${err.message}`);
      setReferrals([]);
      setDoctors([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [isDemoMode, demoDataEnabled]);

  // Load Initial Data & Real-time subscription
  useEffect(() => {
    loadSupabaseData(false);

    if (!isDemoMode) {
      const channel1 = supabase.channel('staff_referrals_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
          loadSupabaseData(true);
        })
        .subscribe();

      const interval = setInterval(() => {
        loadSupabaseData(true);
      }, 4000);

      return () => {
        supabase.removeChannel(channel1);
        clearInterval(interval);
      };
    }
  }, [isDemoMode, demoDataEnabled, loadSupabaseData]);

  // Clear toast alert helper
  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRefresh = async () => {
    await loadSupabaseData();
    showToast(isDemoMode ? '✓ Demo referrals queue refreshed.' : '✓ Live referrals queue updated.');
  };

  // ─── STATUS TRANSITIONS (STRICT STATE MACHINE & ID TARGETING) ───
  // 1. Pending -> Accepted
  const handleAcceptReferral = async (refId) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Accepted' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Accepted' } : prev));
      showToast('✓ Referral accepted and moved to waiting room.');
      return;
    }

    const currentRef = referrals.find(r => r.id === refId);
    if (currentRef && currentRef.status !== 'Pending') {
      setError(`Invalid status transition: Referral must be 'Pending' to accept (currently '${currentRef.status}').`);
      return;
    }

    try {
      const { data: updatedRow, error } = await supabase
        .from('referrals')
        .update({ status: 'Accepted' })
        .eq('id', refId)
        .select('id, status')
        .single();

      if (error) throw error;
      if (!updatedRow || updatedRow.id !== refId || updatedRow.status !== 'Accepted') {
        throw new Error(`Accept status update verification failed for referral ${refId}`);
      }

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Accepted' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Accepted' } : prev));
      showToast('✓ Referral accepted successfully.');
      setTimeout(() => loadSupabaseData(true), 2500);
    } catch (err) {
      console.error('[HospitalStaff] Failed to accept referral:', err);
      setError(`Failed to accept referral: ${err.message}`);
    }
  };

  // 2. Accepted -> Arrived
  const handleMarkArrived = async (refId) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Arrived' } : prev));
      showToast('✓ Patient marked as arrived. Ready for clinician assignment.');
      return;
    }

    const currentRef = referrals.find(r => r.id === refId);
    if (currentRef && !['Pending', 'Accepted', 'Assigned'].includes(currentRef.status)) {
      setError(`Invalid status transition: Referral cannot be marked arrived from '${currentRef.status}'.`);
      return;
    }

    try {
      const { data: updatedRow, error } = await supabase
        .from('referrals')
        .update({ status: 'Arrived' })
        .eq('id', refId)
        .select('id, status')
        .single();

      if (error) throw error;
      if (!updatedRow || updatedRow.id !== refId || updatedRow.status !== 'Arrived') {
        throw new Error(`Arrival status update verification failed for referral ${refId}`);
      }

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Arrived' } : prev));
      showToast('✓ Patient physical arrival verified at reception.');
      setTimeout(() => loadSupabaseData(true), 2500);
    } catch (err) {
      console.error('[HospitalStaff] Failed to mark arrival:', err);
      setError(`Failed to mark arrival: ${err.message}`);
    }
  };

  // 3. Arrived / Accepted -> Assign Doctor
  const handleRouteToDoctor = async (refId, doctorName, doctorId = null) => {
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, doctor_assigned: doctorName, doctor_id: doctorId, status: 'Assigned' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, doctor_assigned: doctorName, doctor_id: doctorId, status: 'Assigned' } : prev));
      setShowDoctorRouteModal(null);
      showToast(`✓ Patient successfully assigned to ${doctorName}.`);
      return;
    }

    if (!doctorId || !isUuid(doctorId)) {
      setError("Cannot route referral: Valid canonical Doctor UUID is required.");
      return;
    }

    const currentRef = referrals.find(r => r.id === refId);
    if (currentRef && (currentRef.status === 'Completed' || currentRef.status === 'Cancelled')) {
      setError(`Cannot assign doctor: Referral is in terminal state '${currentRef.status}'.`);
      return;
    }

    try {
      const updatePayload = {
        doctor_assigned: doctorName,
        doctor_id: doctorId,
        status: 'Assigned'
      };

      const { data: updatedRow, error } = await supabase
        .from('referrals')
        .update(updatePayload)
        .eq('id', refId)
        .select('id, status, doctor_assigned, doctor_id')
        .single();

      if (error) throw error;
      if (!updatedRow || updatedRow.id !== refId || updatedRow.doctor_id !== doctorId) {
        throw new Error(`Doctor routing verification failed for referral ${refId}`);
      }

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, ...updatePayload } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, ...updatePayload } : prev));
      setShowDoctorRouteModal(null);
      showToast(`✓ Patient routed to ${doctorName}. Status → Assigned. Doctor desk notified.`);
      setTimeout(() => loadSupabaseData(true), 3000);
    } catch (err) {
      console.error('[HospitalStaff] Failed to assign specialist:', err);
      setError(`Failed to assign specialist: ${err.message}`);
    }
  };

  // ─── Emergency Siren / Audio Chime (CAD Dispatch Protocol) ───
  const playEmergencyChime = useCallback(() => {
    if (emergencyAlarmMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.36);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.16);
      osc2.start(ctx.currentTime + 0.16);
      osc2.stop(ctx.currentTime + 0.36);
    } catch {
      // AudioContext blocked or not supported
    }
  }, [emergencyAlarmMuted]);

  // Periodic chime when unhandled emergency SOS is pending
  useEffect(() => {
    const hasActiveUnhandled = emergencyCases.some(
      c => c.status === 'PENDING_DISPATCH' || !c.callLogged || c.ambulanceStatus === 'NONE'
    );
    if (hasActiveUnhandled && !emergencyAlarmMuted) {
      playEmergencyChime();
      const timer = setInterval(playEmergencyChime, 12000);
      return () => clearInterval(timer);
    }
  }, [emergencyCases, emergencyAlarmMuted, playEmergencyChime]);

  // ─── CAD Dispatch Action Handlers ───
  const handleLogCall = async (sos) => {
    setActionLoadingId(sos.id);
    try {
      if (isDemoMode) {
        setEmergencyCases(prev => prev.map(c => c.id === sos.id ? { ...c, callLogged: true } : c));
        setAllEmergencyLogs(prev => prev.map(c => c.id === sos.id ? { ...c, callLogged: true } : c));
        showToast('📞 Direct call logged with caller');
        return;
      }
      await updateEmergencyDispatch(sos.id, { call_logged: 'true' });
      showToast('📞 Direct call logged with caller');
      await loadSupabaseData(true);
    } catch (err) {
      console.error(err);
      showToast(`Failed to log call: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDispatchAmbulance = async (sos, vehicle, eta) => {
    setActionLoadingId(sos.id);
    try {
      const vNum = vehicle || ambulanceVehicleInput || '108-MH-12-8821';
      const etaVal = eta || ambulanceEtaInput || '10-15 mins';
      if (isDemoMode) {
        setEmergencyCases(prev => prev.map(c => c.id === sos.id ? { ...c, ambulanceStatus: 'DISPATCHED', ambulanceVehicle: vNum, ambulanceEta: etaVal, status: 'DISPATCHED' } : c));
        setAllEmergencyLogs(prev => prev.map(c => c.id === sos.id ? { ...c, ambulanceStatus: 'DISPATCHED', ambulanceVehicle: vNum, ambulanceEta: etaVal, status: 'DISPATCHED' } : c));
        showToast(`🚑 108 Ambulance Dispatched (${vNum} · ETA ${etaVal})`);
        setDispatchModalSOS(null);
        return;
      }
      await updateEmergencyDispatch(sos.id, {
        ambulance_status: 'DISPATCHED',
        ambulance_vehicle: vNum,
        ambulance_eta: etaVal,
        status: 'DISPATCHED'
      });
      showToast(`🚑 108 Ambulance Dispatched (${vNum} · ETA ${etaVal})`);
      setDispatchModalSOS(null);
      await loadSupabaseData(true);
    } catch (err) {
      console.error(err);
      showToast(`Ambulance dispatch error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAlertASHA = async (sos) => {
    setActionLoadingId(sos.id);
    try {
      const msg = `🚨 *EMERGENCY SOS DISPATCH ALERT*\n*Patient:* ${sos.patient_name || 'Citizen'}\n*Phone:* ${sos.phone}\n*Emergency:* ${sos.nature} (${sos.cadCategory})\n*Location:* ${sos.village}\n*GPS Map:* ${sos.mapsLink || 'Near PHC'}\n*Signs:* ${sos.signs || 'Immediate response needed'}\n*Hospital:* Shrirampur PHC\nPlease escort or reach immediately!`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      if (isDemoMode) {
        setEmergencyCases(prev => prev.map(c => c.id === sos.id ? { ...c, ashaStatus: 'ALERTED' } : c));
        setAllEmergencyLogs(prev => prev.map(c => c.id === sos.id ? { ...c, ashaStatus: 'ALERTED' } : c));
        showToast('👩‍⚕️ Village ASHA Escort alerted with GPS location');
        return;
      }
      await updateEmergencyDispatch(sos.id, { asha_status: 'ALERTED' });
      showToast('👩‍⚕️ Village ASHA Escort alerted with GPS location');
      await loadSupabaseData(true);
    } catch (err) {
      console.error(err);
      showToast(`Failed to alert ASHA: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEscalateDoctor = async (sos) => {
    setActionLoadingId(sos.id);
    try {
      if (isDemoMode) {
        setEmergencyCases(prev => prev.map(c => c.id === sos.id ? { ...c, doctorStatus: 'NOTIFIED', doctor_assigned: 'Dr. Arvind Kulkarni' } : c));
        setAllEmergencyLogs(prev => prev.map(c => c.id === sos.id ? { ...c, doctorStatus: 'NOTIFIED', doctor_assigned: 'Dr. Arvind Kulkarni' } : c));
        showToast('🩺 Escalated to Emergency Medical Officer / Doctor Desk');
        return;
      }
      await updateEmergencyDispatch(sos.id, {
        doctor_status: 'NOTIFIED',
        doctor_assigned: 'Dr. Arvind Kulkarni'
      });
      showToast('🩺 Escalated to Emergency Medical Officer / Doctor Desk');
      await loadSupabaseData(true);
    } catch (err) {
      console.error(err);
      showToast(`Doctor routing error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolveSOS = async (sos) => {
    setActionLoadingId(sos.id);
    try {
      if (isDemoMode) {
        setEmergencyCases(prev => prev.filter(c => c.id !== sos.id));
        setAllEmergencyLogs(prev => prev.map(c => c.id === sos.id ? { ...c, status: 'RESOLVED' } : c));
        showToast('✅ Emergency stabilized & resolved');
        return;
      }
      await updateEmergencyDispatch(sos.id, { status: 'RESOLVED' });
      showToast('✅ Emergency stabilized & resolved');
      await loadSupabaseData(true);
    } catch (err) {
      console.error(err);
      showToast(`Failed to resolve SOS: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Memos for metrics across 4 truthful care-handoff stages
  const counts = useMemo(() => {
    const pending = referrals.filter(r => r.status === 'Pending').length;
    const waiting = referrals.filter(r => r.status === 'Accepted' || r.status === 'Arrived' || r.status === 'Assigned').length;
    const inConsultation = referrals.filter(r => r.status === 'In Consultation').length;
    const completed = referrals.filter(r => r.status === 'Completed').length;
    return { pending, waiting, inConsultation, completed, total: referrals.length };
  }, [referrals]);

  // Memos for intake source segregation (ASHA vs Direct Patient vs Teleconsult)
  const sourceCounts = useMemo(() => {
    const asha = referrals.filter(r => getReferralOrigin(r).key === 'ASHA').length;
    const direct = referrals.filter(r => getReferralOrigin(r).key === 'PATIENT_DIRECT').length;
    const tele = referrals.filter(r => getReferralOrigin(r).key === 'TELECONSULT').length;
    return { asha, direct, tele, total: referrals.length };
  }, [referrals, getReferralOrigin]);

  // Scoped referrals based on active tab and filters
  const filteredReferrals = useMemo(() => {
    let list = [...referrals];

    // Applying source segregation filter (ASHA vs Direct Patient vs Teleconsult)
    if (sourceFilter !== 'ALL') {
      list = list.filter(r => getReferralOrigin(r).key === sourceFilter);
    }

    // Applying tab filters
    if (activeTab === 'queue') {
      if (queueFilter === 'Pending') {
        list = list.filter(r => r.status === 'Pending');
      } else if (queueFilter === 'Accepted_Arrived') {
        list = list.filter(r => r.status === 'Accepted' || r.status === 'Arrived' || r.status === 'Assigned');
      } else if (queueFilter === 'In_Consultation') {
        list = list.filter(r => r.status === 'In Consultation');
      } else if (queueFilter === 'Completed') {
        list = list.filter(r => r.status === 'Completed');
      }
    }

    // Applying search queries
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(r =>
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.patient_id || '').toLowerCase().includes(q) ||
        (r.patient_unified_id || '').toLowerCase().includes(q) ||
        (r.destination_department || '').toLowerCase().includes(q) ||
        (r.symptoms || '').toLowerCase().includes(q) ||
        (r.created_by || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [referrals, activeTab, queueFilter, sourceFilter, searchQuery, getReferralOrigin]);

  // Scoped emergency cases for CAD Console
  const filteredEmergencyList = useMemo(() => {
    const list = allEmergencyLogs.length > 0 ? allEmergencyLogs : emergencyCases;
    if (emergencyFilter === 'ACTIVE') {
      return list.filter(c => c.status !== 'RESOLVED' && c.status !== 'COMPLETED');
    }
    if (emergencyFilter === 'RESOLVED') {
      return list.filter(c => c.status === 'RESOLVED' || c.status === 'COMPLETED');
    }
    return list;
  }, [allEmergencyLogs, emergencyCases, emergencyFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#008080]" />
        <span className="text-xs font-bold text-slate-500">Syncing intake queue...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">

      {/* ── Toast Message Notification ── */}
      {successMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 bg-slate-900 text-white font-extrabold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Operations Desk Header ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 bg-[#E6F2F2] border border-[#008080]/30 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner">
            🏥
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              Hospital Care Handoff & Reception Desk
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1.5">
              <span>📍 {facility?.name || 'Unassigned Facility'}</span>
              <span>·</span>
              <span className="text-[#008080]">{staffProfile?.name || 'Staff User'}</span>
            </p>
          </div>
        </div>

        {/* Actions: Back & Refresh buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {handleBack && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              title="Return to Main Portals"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Portals</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 transition-colors cursor-pointer"
            title="Refresh incoming referrals queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#008080] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* ── Truthful Network / Error Banner ── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-xs text-rose-800 font-bold rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-black text-rose-900 text-sm">Unable to sync queue</div>
              <div className="text-xs text-rose-700 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── HIGH PRIORITY 24x7 EMERGENCY SOS COMMAND BANNER ── */}
      {emergencyCases.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl border-2 border-red-400 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shrink-0 animate-pulse">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white text-red-700 px-2.5 py-0.5 rounded-full shadow-xs">
                    CRITICAL EMERGENCY SOS ALERT
                  </span>
                  <span className="text-xs font-bold text-red-100">
                    {emergencyCases.length} Active Call{emergencyCases.length > 1 ? 's' : ''} Pending Dispatch
                  </span>
                </div>
                <p className="text-xs font-black text-white mt-0.5">
                  Emergency Transport Coordination Desk · Shrirampur Casualty (Internal Records)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setEmergencyAlarmMuted(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                  emergencyAlarmMuted
                    ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                    : 'bg-white text-red-700 border-white hover:bg-red-50 shadow-sm'
                }`}
              >
                {emergencyAlarmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-bounce" />}
                <span>{emergencyAlarmMuted ? 'Unmute Siren' : 'Mute Siren'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('emergency')}
                className="px-3 py-1.5 bg-black/30 hover:bg-black/40 text-white rounded-xl text-xs font-black border border-white/30 cursor-pointer transition-colors"
              >
                Open Transport Desk
              </button>
            </div>
          </div>

          {/* Topmost emergency case card in banner */}
          {(() => {
            const topCase = emergencyCases[0];
            return (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                        {topCase.refId || 'SOS-01'}
                      </span>
                      <span className="text-sm font-black text-white">
                        {topCase.patient_name || 'Emergency Caller'}
                      </span>
                      <span className="text-xs font-bold text-red-100">
                        · {topCase.nature}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-200 border border-red-400/50">
                        {topCase.cadCategory} · Target &lt; 8m
                      </span>
                    </div>
                    <div className="text-xs text-red-100 font-medium mt-1 flex items-center gap-2 flex-wrap">
                      <span>📍 {topCase.village}</span>
                      {topCase.mapsLink && (
                        <a
                          href={topCase.mapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-white font-bold flex items-center gap-1 hover:text-amber-200"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>View GPS Pin ({topCase.gps})</span>
                        </a>
                      )}
                      <span>·</span>
                      <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-[11px]">
                        Breathing: {topCase.breathing}
                      </span>
                      <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-[11px]">
                        Consciousness: {topCase.consciousness}
                      </span>
                    </div>
                  </div>

                  {/* Quick Dispatch Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`tel:${topCase.phone}`}
                      onClick={() => handleLogCall(topCase)}
                      className="px-3 py-2 bg-white hover:bg-red-50 text-red-700 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {topCase.phone || 'Caller'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setDispatchModalSOS(topCase)}
                      className={`px-3 py-2 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        topCase.ambulanceStatus === 'DISPATCHED'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                      }`}
                    >
                      <Siren className="w-3.5 h-3.5" />
                      <span>{topCase.ambulanceStatus === 'DISPATCHED' ? `Ambulance Recorded (${topCase.ambulanceEta})` : 'Record Ambulance Dispatch'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAlertASHA(topCase)}
                      className={`px-3 py-2 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        topCase.ashaStatus === 'ALERTED'
                          ? 'bg-teal-700 text-white'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{topCase.ashaStatus === 'ALERTED' ? 'ASHA Alerted (WhatsApp)' : 'Alert ASHA (WhatsApp)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEscalateDoctor(topCase)}
                      className={`px-3 py-2 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                        topCase.doctorStatus === 'NOTIFIED'
                          ? 'bg-purple-800 text-white'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{topCase.doctorStatus === 'NOTIFIED' ? 'Doctor Alerted' : 'Route to Doctor'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === topCase.id}
                      onClick={() => handleResolveSOS(topCase)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs overflow-x-auto scrollbar-hide">
        {[
          { key: 'home', label: 'Desk Overview' },
          { key: 'queue', label: 'Patient Desk & Queue' },
          { key: 'referrals', label: 'Referral Search & Records' },
          {
            key: 'emergency',
            label: `🚨 Emergency Transport${emergencyCases.length > 0 ? ` (${emergencyCases.length})` : ''}`,
            isEmergency: true
          }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearchQuery('');
            }}
            className={`px-4 py-2 font-black border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? tab.isEmergency ? 'border-red-600 text-red-600' : 'border-[#008080] text-[#008080]'
                : tab.isEmergency ? 'border-transparent text-red-600 hover:text-red-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OPERATIONAL HOME (DESK OVERVIEW) ── */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Quick Stats Grid: 4 Truthful Handoff Funnels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('Pending'); }}
              className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. Incoming</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{counts.pending}</span>
                <span className="text-[11px] text-amber-700 font-bold">Pending Intake</span>
              </div>
            </div>

            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('Accepted_Arrived'); }}
              className="p-4 bg-white border border-slate-200 hover:border-[#008080] rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">2. Waiting Room</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{counts.waiting}</span>
                <span className="text-[11px] text-[#008080] font-bold">Arrived / Assigned</span>
              </div>
            </div>

            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('In_Consultation'); }}
              className="p-4 bg-white border border-slate-200 hover:border-purple-400 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3. With Doctor</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{counts.inConsultation}</span>
                <span className="text-[11px] text-purple-700 font-bold">In Consultation</span>
              </div>
            </div>

            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('Completed'); }}
              className="p-4 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">4. Completed Today</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{counts.completed}</span>
                <span className="text-[11px] text-emerald-600 font-bold">Signed Closed</span>
              </div>
            </div>
          </div>

          {/* Primary Operations Queue Button */}
          <button
            onClick={() => { setActiveTab('queue'); setQueueFilter('ALL'); }}
            className="w-full py-4 bg-[#008080] hover:bg-[#006666] text-white font-black text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-99"
          >
            <Inbox className="w-5 h-5" />
            <span>Open Patient Desk & Queue</span>
          </button>

          {/* Next Patients Requiring Action */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Next Patients Requiring Intake Action</h2>
              <span className="text-xs font-bold text-slate-400">One Dominant Action per Patient</span>
            </div>

            {referrals.filter(r => r.status !== 'Completed').length > 0 ? (
              <div className="space-y-3">
                {referrals
                  .filter(r => r.status !== 'Completed')
                  .sort((a, b) => {
                    if (a.priority === b.priority) return 0;
                    if (a.priority === 'HIGH' || a.priority === 'RED') return -1;
                    if (b.priority === 'HIGH' || b.priority === 'RED') return 1;
                    if (a.priority === 'ORANGE') return -1;
                    if (b.priority === 'ORANGE') return 1;
                    return 0;
                  })
                  .slice(0, 3)
                  .map(ref => (
                    <ReferralActionCard
                      key={ref.id}
                      refItem={ref}
                      onSelect={setSelectedReferral}
                      onAccept={handleAcceptReferral}
                      onMarkArrived={handleMarkArrived}
                      onRouteDoctor={setShowDoctorRouteModal}
                      onOpenToken={handleOpenTokenModal}
                      getReferralOrigin={getReferralOrigin}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                ✓ No referrals require operational check-in.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PATIENT DESK & QUEUE (THE PRIMARY OPERATIONAL VIEW) ── */}
      {activeTab === 'queue' && (
        <div className="space-y-4 animate-in fade-in duration-150">

          {/* Source Segregation Filter (ASHA vs Direct Patient vs Teleconsult) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-1.5 overflow-x-auto text-xs shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 px-2">Origin:</span>
            {[
              { key: 'ALL', label: `All Sources (${sourceCounts.total})` },
              { key: 'ASHA', label: `🚨 ASHA Referrals (${sourceCounts.asha})` },
              { key: 'PATIENT_DIRECT', label: `👤 Direct Patient (${sourceCounts.direct})` },
              { key: 'TELECONSULT', label: `📹 Teleconsults (${sourceCounts.tele})` }
            ].map(sBtn => (
              <button
                key={sBtn.key}
                type="button"
                onClick={() => setSourceFilter(sBtn.key)}
                className={`px-3 py-1.5 rounded-xl font-black text-[11px] shrink-0 transition-all cursor-pointer ${
                  sourceFilter === sBtn.key
                    ? 'bg-[#16324F] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sBtn.label}
              </button>
            ))}
          </div>

          {/* 4 Truthful Handoff Funnel Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-hide">
            {[
              { key: 'ALL', label: `All Queue (${referrals.length})` },
              { key: 'Pending', label: `Incoming (${counts.pending})` },
              { key: 'Accepted_Arrived', label: `Waiting Room (${counts.waiting})` },
              { key: 'In_Consultation', label: `With Doctor (${counts.inConsultation})` },
              { key: 'Completed', label: `Completed Today (${counts.completed})` }
            ].map(filterBtn => (
              <button
                key={filterBtn.key}
                onClick={() => setQueueFilter(filterBtn.key)}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-[11px] shrink-0 transition-colors cursor-pointer ${
                  queueFilter === filterBtn.key
                    ? 'bg-[#008080] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filterBtn.label}
              </button>
            ))}
          </div>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue by patient name, ID, symptoms, or department..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-[#008080] rounded-xl text-xs font-semibold text-slate-900 outline-none transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Referral Queue Stream */}
          {filteredReferrals.length > 0 ? (
            <div className="space-y-3">
              {filteredReferrals.map(ref => (
                <ReferralActionCard
                  key={ref.id}
                  refItem={ref}
                  onSelect={setSelectedReferral}
                  onAccept={handleAcceptReferral}
                  onMarkArrived={handleMarkArrived}
                  onRouteDoctor={setShowDoctorRouteModal}
                  onOpenToken={handleOpenTokenModal}
                  getReferralOrigin={getReferralOrigin}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="text-sm font-black text-slate-800">No referrals currently in this queue.</p>
              <p className="text-xs text-slate-400 font-medium">
                {searchQuery
                  ? 'No referrals matched your search keywords.'
                  : 'Incoming referrals from frontline workers and outpatient desks will appear here automatically.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: REFERRAL SEARCH & RECORDS ── */}
      {activeTab === 'referrals' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical & active records by patient name, ID, department, or symptoms..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#008080] rounded-xl text-xs font-semibold text-slate-900 outline-none transition-colors shadow-2xs"
            />
          </div>

          {/* Historical Search Results Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-500 bg-slate-50/50 flex items-center justify-between">
              <span>{filteredReferrals.length} Referral Records Found</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#008080] hover:underline font-bold">Clear Search</button>
              )}
            </div>

            {filteredReferrals.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredReferrals.map(ref => (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref)}
                    className="p-4 hover:bg-slate-50/60 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900">{ref.patient_name}</span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                          {ref.patient_unified_id ? `ID: ${ref.patient_unified_id}` : (ref.patient_id ? `ID: ${ref.patient_id.slice(0, 8)}` : 'ID: Pending')}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {ref.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ref.destination_department} · Intake {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No matching referral history records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: 24x7 EMERGENCY DISPATCH DESK (CAD CONSOLE) ── */}
      {activeTab === 'emergency' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Header & Quick Filter Pills */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center text-2xl shrink-0 text-red-600">
                  <Siren className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                      Emergency Transport &amp; Intake Coordination Desk
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                      Internal Coordination (care_requests)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    Direct helpline intake, manual ambulance dispatch logging, and WhatsApp ASHA mobilization. (Internal PHC facility coordination, not live government telematics).
                  </p>
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-black">
                {[
                  { key: 'ACTIVE', label: `Active (${emergencyCases.length})` },
                  { key: 'ALL', label: `All History (${allEmergencyLogs.length})` },
                  { key: 'RESOLVED', label: 'Resolved' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setEmergencyFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      emergencyFilter === f.key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Operational Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100">
                <span className="text-[10px] font-black uppercase text-red-700 block">Pending Immediate Action</span>
                <span className="text-xl font-black text-red-900 mt-0.5 block">
                  {emergencyCases.filter(c => c.status === 'PENDING_DISPATCH' || c.ambulanceStatus === 'NONE').length}
                </span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-black uppercase text-amber-700 block">Ambulances Logged as Dispatched</span>
                <span className="text-xl font-black text-amber-900 mt-0.5 block">
                  {allEmergencyLogs.filter(c => c.ambulanceStatus === 'DISPATCHED').length}
                </span>
              </div>
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
                <span className="text-[10px] font-black uppercase text-teal-700 block">ASHA Alerted (WhatsApp)</span>
                <span className="text-xl font-black text-teal-900 mt-0.5 block">
                  {allEmergencyLogs.filter(c => c.ashaStatus === 'ALERTED').length}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">Stabilized &amp; Resolved</span>
                <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                  {allEmergencyLogs.filter(c => c.status === 'RESOLVED' || c.status === 'COMPLETED').length}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Cards Stream */}
          <div className="space-y-4">
            {filteredEmergencyList.length > 0 ? (
              filteredEmergencyList.map(sos => {
                const isCat1 = sos.cadCategory === 'CAT 1';
                const isResolved = sos.status === 'RESOLVED' || sos.status === 'COMPLETED';

                return (
                  <div
                    key={sos.id}
                    className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-sm space-y-4 ${
                      isResolved
                        ? 'border-emerald-200 opacity-80'
                        : isCat1
                        ? 'border-red-300 shadow-md ring-1 ring-red-200'
                        : 'border-amber-300 shadow-sm'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          {sos.refId || 'SOS-01'}
                        </span>
                        <h3 className="font-black text-base text-slate-900">
                          {sos.patient_name || 'Emergency Caller'}
                        </h3>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          isCat1
                            ? 'bg-red-600 text-white border-red-700'
                            : 'bg-amber-500 text-white border-amber-600'
                        }`}>
                          {sos.cadCategory} · {sos.nature}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          {new Date(sos.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : sos.ambulanceStatus === 'DISPATCHED'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                      }`}>
                        {isResolved ? '✓ Case Resolved / Stabilized' : sos.ambulanceStatus === 'DISPATCHED' ? `Ambulance Dispatched (ETA ${sos.ambulanceEta})` : 'Pending Dispatch Action'}
                      </span>
                    </div>

                    {/* Core Triage Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">

                      {/* Column 1: Contact & Location */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          Caller &amp; Geolocation
                        </span>
                        <div className="space-y-1 text-slate-700">
                          <p className="flex items-center gap-1.5 font-bold">
                            <Phone className="w-3.5 h-3.5 text-[#008080]" />
                            <a href={`tel:${sos.phone}`} onClick={() => handleLogCall(sos)} className="hover:underline text-slate-900 font-black">
                              {sos.phone || 'No phone provided'}
                            </a>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{sos.village}</span>
                          </p>
                          {sos.mapsLink && (
                            <a
                              href={sos.mapsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-[#008080] hover:underline flex items-center gap-1 mt-1"
                            >
                              <span>Open Google Maps GPS</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Clinical CAD Assessment */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          CAD Clinical Assessment
                        </span>
                        <div className="space-y-1 text-slate-700">
                          <p>
                            <span className="text-slate-400 font-bold">Breathing:</span>{' '}
                            <strong className="text-slate-900">{sos.breathing || 'Not reported'}</strong>
                          </p>
                          <p>
                            <span className="text-slate-400 font-bold">Consciousness:</span>{' '}
                            <strong className="text-slate-900">{sos.consciousness || 'Not reported'}</strong>
                          </p>
                          <p className="text-[11px] text-rose-950 font-bold bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                            {sos.signs || 'Immediate ambulance response advised'}
                          </p>
                        </div>
                      </div>

                      {/* Column 3: Dispatch & Escort Status */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          Dispatch Status
                        </span>
                        <div className="space-y-1 text-slate-700">
                          <p className="flex items-center gap-1.5">
                            <Siren className="w-3.5 h-3.5 text-slate-500" />
                            <span>108: <strong>{sos.ambulanceStatus === 'DISPATCHED' ? `Dispatched (${sos.ambulanceVehicle})` : 'Not Dispatched'}</strong></span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                            <span>ASHA Escort: <strong>{sos.ashaStatus === 'ALERTED' ? 'Alerted via WhatsApp' : 'Not Contacted'}</strong></span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                            <span>Doctor: <strong>{sos.doctorStatus === 'NOTIFIED' ? `Notified (${sos.doctor_assigned})` : 'Not Assigned'}</strong></span>
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* CAD Dispatch Action Toolbar */}
                    {!isResolved && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={`tel:${sos.phone}`}
                            onClick={() => handleLogCall(sos)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#008080]" />
                            <span>{sos.callLogged ? 'Call Logged (Redial)' : 'Call Caller'}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setDispatchModalSOS(sos)}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                              sos.ambulanceStatus === 'DISPATCHED'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                            }`}
                          >
                            <Siren className="w-3.5 h-3.5" />
                            <span>{sos.ambulanceStatus === 'DISPATCHED' ? `Update Ambulance (${sos.ambulanceEta})` : 'Dispatch 108 Ambulance'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAlertASHA(sos)}
                            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border ${
                              sos.ashaStatus === 'ALERTED'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                            <span>{sos.ashaStatus === 'ALERTED' ? 'ASHA Mobilized' : 'Alert Village ASHA'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEscalateDoctor(sos)}
                            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border ${
                              sos.doctorStatus === 'NOTIFIED'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                            <span>{sos.doctorStatus === 'NOTIFIED' ? 'Doctor Alerted' : 'Route to Doctor'}</span>
                          </button>
                        </div>

                        <div>
                          <button
                            type="button"
                            disabled={actionLoadingId === sos.id}
                            onClick={() => handleResolveSOS(sos)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Resolved</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-sm font-black text-slate-800">No active CAD emergency dispatch alerts</p>
                <p className="text-xs text-slate-400">All helpline and 108 calls are monitored in real-time.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── MODAL: 108 AMBULANCE DISPATCH ─── */}
      {dispatchModalSOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">Record Emergency Transport Dispatch</h3>
                <p className="text-xs text-slate-500 mt-0.5">Internal Facility Log · Allocate transport vehicle &amp; staff-estimated ETA</p>
              </div>
              <button
                onClick={() => setDispatchModalSOS(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target caller summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p className="font-black text-slate-900">
                  Patient: {dispatchModalSOS.patient_name || 'Emergency Caller'} · {dispatchModalSOS.nature}
                </p>
                <p className="text-slate-600">
                  📍 Destination: {dispatchModalSOS.village} ({dispatchModalSOS.gps || 'Near PHC'})
                </p>
                <p className="text-slate-600 font-bold">
                  📞 Caller: {dispatchModalSOS.phone}
                </p>
              </div>

              {/* Vehicle Identification */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                  Ambulance Vehicle Identification (Staff-Recorded Plate)
                </label>
                <input
                  type="text"
                  value={ambulanceVehicleInput}
                  onChange={(e) => setAmbulanceVehicleInput(e.target.value)}
                  placeholder="e.g. 108-MH-12-8821"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              {/* ETA Presets */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                  Staff-Entered Estimated Time of Arrival (Manual Estimate)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['6-8 mins', '10-12 mins', '15 mins', '20-25 mins'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmbulanceEtaInput(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        ambulanceEtaInput === preset
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={ambulanceEtaInput}
                  onChange={(e) => setAmbulanceEtaInput(e.target.value)}
                  placeholder="Custom ETA (e.g. 10 mins)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-xs font-bold text-slate-900 outline-none mt-1"
                />
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Record is saved locally in facility care_requests. Does not connect to live government 108 GPS telematics.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispatchModalSOS(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === dispatchModalSOS.id}
                onClick={() => handleDispatchAmbulance(dispatchModalSOS, ambulanceVehicleInput, ambulanceEtaInput)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Siren className="w-3.5 h-3.5" />
                <span>Confirm &amp; Log Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: CLINICAL CASE DOSSIER & PROGRESSIVE DISCLOSURE ─── */}
      {selectedReferral && (() => {
        const isHighRisk = selectedReferral.priority === 'HIGH' || selectedReferral.priority === 'RED';
        const isUrgent = selectedReferral.priority === 'ORANGE';
        const priorityBadgeStyle = isHighRisk
          ? 'bg-rose-100 text-rose-800 border-rose-200'
          : isUrgent
          ? 'bg-amber-100 text-amber-900 border-amber-200'
          : 'bg-emerald-100 text-emerald-900 border-emerald-200';

        let statusBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        if (selectedReferral.status === 'Accepted') statusBadgeStyle = 'bg-sky-100 text-sky-800 border-sky-200';
        if (selectedReferral.status === 'Arrived') statusBadgeStyle = 'bg-teal-100 text-teal-800 border-teal-200';
        if (selectedReferral.status === 'Assigned') statusBadgeStyle = 'bg-indigo-100 text-indigo-800 border-indigo-200';
        if (selectedReferral.status === 'In Consultation') statusBadgeStyle = 'bg-purple-100 text-purple-800 border-purple-200';
        if (selectedReferral.status === 'Completed') statusBadgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';

        const dangerSigns = Array.isArray(selectedReferral.danger_signs)
          ? selectedReferral.danger_signs
          : (typeof selectedReferral.danger_signs === 'string' && selectedReferral.danger_signs.trim())
          ? [selectedReferral.danger_signs]
          : [];

        const vitals = selectedReferral.vitals || {};
        const modalOrigin = getReferralOrigin(selectedReferral);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">

              {/* Modal Top Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#008080]/10 text-[#008080] border border-[#008080]/20">
                      <FileText className="w-3 h-3" />
                      Care Handoff Case File
                    </span>
                    {modalOrigin.key === 'ASHA' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🚨 ASHA Field Referral
                      </span>
                    )}
                    {modalOrigin.key === 'PATIENT_DIRECT' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        👤 Direct Patient Booking
                      </span>
                    )}
                    {modalOrigin.key === 'TELECONSULT' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                        📹 Virtual Teleconsult
                      </span>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${priorityBadgeStyle}`}>
                      {selectedReferral.priority_label || selectedReferral.priority || 'Routine Priority'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${statusBadgeStyle}`}>
                      Status: {selectedReferral.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {selectedReferral.patient_name}
                  </h2>

                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap">
                    <span className="font-mono text-[11px] font-bold bg-slate-200/80 px-2 py-0.5 rounded text-slate-800">
                      {selectedReferral.patient_unified_id ? `Unified ID: ${selectedReferral.patient_unified_id}` : (selectedReferral.patient_id ? `ID: ${selectedReferral.patient_id.slice(0, 8)}` : 'ID: Not assigned')}
                    </span>
                    {(selectedReferral.patient_gender || selectedReferral.patient_age) && (
                      <span className="text-slate-600">
                        {[selectedReferral.patient_gender, selectedReferral.patient_age ? `${selectedReferral.patient_age} yrs` : null].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    {selectedReferral.patient_blood_group && (
                      <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px]">
                        Blood: {selectedReferral.patient_blood_group}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReferral(null)}
                  className="p-2 rounded-full bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  aria-label="Close case file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Case Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 divide-y divide-slate-100">

                {/* 1. Contact & Destination Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Patient Phone & Direct Call</span>
                    {selectedReferral.patient_phone ? (
                      <a
                        href={`tel:${selectedReferral.patient_phone}`}
                        className="inline-flex items-center gap-1.5 text-sm font-black text-[#008080] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedReferral.patient_phone}</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded ml-1 font-bold">Call</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Not recorded</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Destination Facility & Unit</span>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedReferral.destination_hospital || facility?.name || 'Primary Health Centre'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Target Dept: <span className="font-bold text-slate-700">{selectedReferral.destination_department || 'General Medicine'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Clinician & Handoff Responsibility */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Assigned Doctor Desk</span>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <Stethoscope className="w-4 h-4 text-[#008080]" />
                      {selectedReferral.doctor_assigned ? (
                        <span className="text-slate-900">{selectedReferral.doctor_assigned}</span>
                      ) : (
                        <span className="text-amber-700 italic">Not Assigned (Awaiting Reception Desk)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                      Referred By
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedReferral.created_by || 'Frontline Community Worker'}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(selectedReferral.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} · Intake elapsed: {getWaitDuration(selectedReferral.created_at)}
                    </div>
                  </div>
                </div>

                {/* 3. Flagged Danger Signs */}
                {dangerSigns.length > 0 && (
                  <div className="pt-4">
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Critical Danger Signs Flagged by Frontline Triage</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-rose-900 font-bold pl-1">
                        {dangerSigns.map((sign, idx) => (
                          <li key={idx}>{sign}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 4. Pregnancy / Escort Flag */}
                {(selectedReferral.is_pregnant || selectedReferral.symptoms?.includes('ASHA ACCOMPANYING') || selectedReferral.clinical_summary?.includes('ASHA ACCOMPANYING')) && (
                  <div className="pt-3">
                    <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-xs font-bold text-purple-900">
                      <span className="text-base">🤰</span>
                      <span>High-Priority Antenatal / Escorted Case — ASHA worker accompanying for priority intake.</span>
                    </div>
                  </div>
                )}

                {/* 5. Frontline Recorded Vitals (Raw measurements with units only) */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#008080]" />
                      Recorded Frontline Vitals
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Standard Clinical Units</span>
                  </div>

                  {Object.keys(vitals).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
                        <span className="text-sm font-black text-slate-900">{vitals.bp || 'Not recorded'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">mmHg</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Pulse Rate</span>
                        <span className="text-sm font-black text-slate-900">{vitals.pulse ? `${vitals.pulse} bpm` : 'Not recorded'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">Beats / min</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Oxygen (SpO₂)</span>
                        <span className="text-sm font-black text-slate-900">{vitals.spo2 ? `${vitals.spo2}%` : 'Not recorded'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">Saturation</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Temperature</span>
                        <span className="text-sm font-black text-slate-900">{vitals.temp ? `${vitals.temp}°F` : 'Not recorded'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">Fahrenheit</span>
                      </div>

                      {vitals.respRate && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold">Respiration</span>
                          <span className="text-sm font-black text-slate-900">{vitals.respRate} /min</span>
                          <span className="text-[9px] text-slate-400 block font-medium">Breaths / min</span>
                        </div>
                      )}

                      {vitals.weight && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold">Weight</span>
                          <span className="text-sm font-black text-slate-900">{vitals.weight} kg</span>
                          <span className="text-[9px] text-slate-400 block font-medium">Body weight</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 italic text-xs border border-slate-100">
                      No numeric vitals were submitted for this referral encounter.
                    </div>
                  )}
                </div>

                {/* 6. Chief Complaint */}
                <div className="pt-4 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Intake Symptoms & Clinical Complaint</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedReferral.symptoms || 'No detailed symptoms specified.'}
                  </div>
                </div>

                {/* 7. AI-Assisted Triage Note (Clearly Labeled) */}
                {(selectedReferral.ai_note || selectedReferral.clinical_summary) && (
                  <div className="pt-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] text-purple-700 font-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        AI-Assisted Triage Recommendation
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium italic">
                        Frontline clinical prioritization · Not a physician diagnosis
                      </span>
                    </div>
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-950 font-semibold leading-relaxed">
                      {selectedReferral.ai_note || selectedReferral.clinical_summary}
                    </div>
                  </div>
                )}

                {/* 8. Attached Medical Records / Scans */}
                {selectedReferral.attached_file_url && (
                  <div className="pt-4 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Attached Medical Record / Scan</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#008080]" />
                        <span className="text-xs font-bold text-slate-800 truncate">Attached Patient Document / Diagnostic Scan</span>
                      </div>
                      <a
                        href={selectedReferral.attached_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Action Footer: One Dominant Next Action */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReferral(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                >
                  Close Case File
                </button>

                <div className="flex items-center gap-2">
                  {/* Secondary Token button */}
                  {(selectedReferral.status === 'Accepted' || selectedReferral.status === 'Pending') && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="assign-token"
                      onClick={() => handleOpenTokenModal(selectedReferral)}
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Ticket className="w-4 h-4 text-amber-700" />
                      <span>{selectedReferral.slot_preference?.includes('Token') || selectedReferral.ai_note?.includes('TOKEN:') ? 'Edit Token' : 'Assign Token'}</span>
                    </button>
                  )}

                  {/* Dominant Action in Modal */}
                  {selectedReferral.status === 'Pending' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="accept-referral"
                      onClick={() => handleAcceptReferral(selectedReferral.id)}
                      className="px-5 py-2 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Referral</span>
                    </button>
                  )}

                  {selectedReferral.status === 'Accepted' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="mark-arrived"
                      onClick={() => handleMarkArrived(selectedReferral.id)}
                      className="px-5 py-2 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Mark Patient Arrived</span>
                    </button>
                  )}

                  {selectedReferral.status === 'Arrived' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="send-to-doctor"
                      onClick={() => setShowDoctorRouteModal(selectedReferral)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Assign Doctor Desk</span>
                    </button>
                  )}

                  {selectedReferral.status === 'Assigned' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="reassign-doctor"
                      onClick={() => setShowDoctorRouteModal(selectedReferral)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                      <span>Reassign Doctor Desk</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── MODAL 2: ROUTE PATIENT TO CLINICIAN DESK ─── */}
      {showDoctorRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Assign Patient to Doctor Desk</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select verified clinician for {showDoctorRouteModal.patient_name}</p>
              </div>
              <button
                onClick={() => setShowDoctorRouteModal(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {doctors.length > 0 ? (
                doctors.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleRouteToDoctor(showDoctorRouteModal.id, doc.name, doc.id)}
                    data-action="route-to-doctor"
                    data-doctor-id={doc.id}
                    data-doctor-name={doc.name}
                    className="w-full p-3.5 text-left bg-slate-50 hover:bg-[#E6F2F2]/50 hover:border-[#008080] border border-slate-200 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 group-hover:text-[#008080] transition-colors">{doc.name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{doc.specialty || 'Specialist'}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#008080] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  No specialists configured for this facility.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDoctorRouteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 3: ASSIGN OFFICIAL OPD TOKEN & ARRIVAL SLOT ─── */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#16324F] to-[#008F83] px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Assign Official OPD Token & Arrival Slot</h3>
                  <p className="text-[11px] text-teal-100 font-medium">Intake Reception Desk · Staggered Queue Management</p>
                </div>
              </div>
              <button
                onClick={() => setShowTokenModal(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-800 flex-1">

              {/* Patient Info Strip */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patient</span>
                  <p className="font-black text-sm text-slate-900">{showTokenModal.patient_name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{showTokenModal.destination_department || 'General Medicine & OPD'}</p>
                </div>
                <span className="text-[10px] font-black bg-[#E8F7F3] text-[#008F83] px-2.5 py-1 rounded-full border border-[#008F83]/30">
                  {showTokenModal.priority || 'ROUTINE'}
                </span>
              </div>

              {/* 1. Official Token Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                  Official Queue Token Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={assignTokenNum}
                    onChange={e => setAssignTokenNum(e.target.value)}
                    placeholder="e.g. SHIR-OPD-014"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm text-[#008F83] focus:outline-none focus:border-[#008F83]"
                  />
                  <button
                    type="button"
                    onClick={() => setAssignTokenNum(`SHIR-OPD-0${Math.floor(10 + Math.random() * 89)}`)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>

              {/* 2. Staggered Arrival Time Slot */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                  Recommended Staggered Arrival Time Slot
                </label>
                <p className="text-[11px] text-slate-500 font-medium">
                  Allocating spaced arrival times prevents crowded waiting areas.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    '09:30 AM – 10:00 AM',
                    '10:30 AM – 11:00 AM',
                    '11:30 AM – 12:00 PM',
                    '02:30 PM – 03:00 PM'
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAssignSlot(slot)}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer text-left ${
                        assignSlot === slot
                          ? 'bg-[#E8F7F3] border-[#008F83] text-[#008F83] ring-1 ring-[#008F83]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                      <span>{slot}</span>
                    </button>
                  ))}
                </div>

                {/* Custom / Exact Time Slot Input */}
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">Exact Slot:</span>
                  <input
                    type="text"
                    value={assignSlot}
                    onChange={e => setAssignSlot(e.target.value)}
                    placeholder="e.g. 10:30 AM – 11:00 AM"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:border-[#008F83]"
                  />
                </div>
              </div>

              {/* 3. Assigned Counter & Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                    Counter / Room
                  </label>
                  <select
                    value={assignRoom}
                    onChange={e => setAssignRoom(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:border-[#008F83]"
                  >
                    <option value="Counter 2 · General OPD">Counter 2 · General OPD</option>
                    <option value="Counter 1 · Triage & Vitals">Counter 1 · Triage & Vitals</option>
                    <option value="Room 3 · Maternal & Child Health (ANC)">Room 3 · Maternal & Child (ANC)</option>
                    <option value="Room 4 · NCD Chronic Care">Room 4 · NCD Chronic Care</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                    Assigned Clinician
                  </label>
                  <select
                    value={assignDoctor}
                    onChange={e => setAssignDoctor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:border-[#008F83]"
                  >
                    <option value="Dr. Arvind Kulkarni (Medical Officer)">Dr. Arvind Kulkarni (Medical Officer)</option>
                    <option value="Dr. Priya Sharma (MBBS, DGO)">Dr. Priya Sharma (MBBS, DGO)</option>
                    <option value="Dr. Sneha Shinde (Pediatrician)">Dr. Sneha Shinde (Pediatrician)</option>
                  </select>
                </div>
              </div>

              {/* 4. Counter Guidance Instruction */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                  Patient Guidance Instruction
                </label>
                <input
                  type="text"
                  value={assignInstruction}
                  onChange={e => setAssignInstruction(e.target.value)}
                  placeholder="Report directly to counter..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-[#008F83]"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  handleAcceptReferral(showTokenModal.id);
                  setShowTokenModal(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Accept without Token
              </button>

              <button
                type="button"
                disabled={assigningLoading}
                onClick={handleConfirmTokenAssignment}
                className="px-6 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {assigningLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm & Issue Token Pass</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
