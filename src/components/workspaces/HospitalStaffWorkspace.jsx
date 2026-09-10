import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Stethoscope,
  CheckCircle2,
  ExternalLink,
  Ticket,
  Clock,
  Siren,
  Volume2,
  VolumeX,
  MapPin,
  UserCheck,
  Building2
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

// ─── REFERRAL CARD: SCANNABLE DECISION CARD ───
function ReferralActionCard({
  refItem,
  onSelect,
  onAccept,
  onMarkArrived,
  onRouteDoctor,
  onOpenToken,
  actionLoadingId,
  getReferralOrigin: _getReferralOrigin
}) {
  const status = refItem.status;
  const isActionLoading = actionLoadingId === refItem.id;
  const docName = refItem.doctor_assigned
    ? (refItem.doctor_assigned.startsWith('Dr.') ? refItem.doctor_assigned : 'Dr. ' + refItem.doctor_assigned)
    : null;

  const patientDemographics = [
    refItem.patient_age ? `${refItem.patient_age} yrs` : null,
    refItem.patient_gender,
    refItem.patient_blood_group ? `${refItem.patient_blood_group}` : null
  ].filter(Boolean).join(' · ');

  const patientIdDisplay = refItem.is_legacy_patient
    ? `Legacy: ${refItem.patient_id || 'Unlinked'}`
    : (refItem.patient_unified_id || (refItem.patient_id ? `ID: ${refItem.patient_id.slice(0, 8)}` : 'ID: Pending'));
  const referralReason = refItem.symptoms || refItem.clinical_summary || 'General referral evaluation';

  // Patient initial for avatar badge
  const initial = (refItem.patient_name || 'P').trim()[0].toUpperCase();

  // Priority color: truthful frontline/heuristic priority
  const priorityKey = (refItem.priority || '').toUpperCase();
  const priorityBorder =
    priorityKey === 'HIGH' || priorityKey === 'RED' ? 'border-l-rose-500' :
    priorityKey === 'ORANGE' ? 'border-l-amber-400' :
    'border-l-teal-500';
  const priorityBadge =
    priorityKey === 'HIGH' || priorityKey === 'RED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : priorityKey === 'ORANGE'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-50 text-slate-500 border-slate-200';
  const priorityLabel =
    priorityKey === 'HIGH' || priorityKey === 'RED' ? 'Frontline: High' :
    priorityKey === 'ORANGE' ? 'Frontline: Urgent' :
    priorityKey === 'EMERGENCY' ? 'Frontline: Urgent' : 'Routine';

  // Elapsed wait time
  const elapsedMins = refItem.created_at
    ? Math.round((Date.now() - new Date(refItem.created_at).getTime()) / 60000)
    : null;
  const elapsedLabel = elapsedMins === null ? null
    : elapsedMins < 60 ? `${elapsedMins}m ago`
    : `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m ago`;

  // Status badge color
  const statusBadge =
    status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
    status === 'Accepted' ? 'bg-slate-100 text-slate-700 border-slate-200' :
    status === 'Arrived' ? 'bg-teal-50 text-teal-800 border-teal-200' :
    status === 'Assigned' ? 'bg-blue-50 text-blue-800 border-blue-200' :
    status === 'In Consultation' ? 'bg-purple-50 text-purple-800 border-purple-200' :
    status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    'bg-slate-100 text-slate-600 border-slate-200';

  const statusText =
    status === 'Pending' ? 'Pending Acceptance' :
    status === 'Accepted' ? 'Waiting for Patient' :
    status === 'Arrived' ? 'Arrived at Reception' :
    status === 'Assigned' ? `In Queue: ${docName || 'Doctor'}` :
    status === 'In Consultation' ? `With ${docName || 'Doctor'}` :
    status === 'Completed' ? 'Completed' : status;

  // Hand-off responsibility & next action
  const responsibility =
    status === 'Pending'
      ? { badge: 'Reception Desk', badgeColor: 'bg-amber-100 text-amber-800', nextText: 'Action: Review & Accept' } :
    status === 'Accepted'
      ? { badge: 'Patient En Route', badgeColor: 'bg-slate-100 text-slate-700', nextText: 'Waiting: Arrival at desk' } :
    status === 'Arrived'
      ? { badge: 'Reception Desk', badgeColor: 'bg-teal-100 text-teal-800', nextText: 'Action: Assign Clinician' } :
    status === 'Assigned'
      ? { badge: docName ? `${docName}` : 'Doctor Queue', badgeColor: 'bg-blue-100 text-blue-800', nextText: 'Next: Clinician Calling' } :
    status === 'In Consultation'
      ? { badge: docName ? `With ${docName}` : 'Consultation', badgeColor: 'bg-purple-100 text-purple-800', nextText: 'In Progress: Clinical Exam' } :
    status === 'Completed'
      ? { badge: 'Completed', badgeColor: 'bg-emerald-100 text-emerald-800', nextText: 'Encounter closed' } :
      { badge: 'Front Desk', badgeColor: 'bg-slate-100 text-slate-700', nextText: 'Next Step' };

  // 3-Tier Visual Hierarchy
  const isActionNeeded = status === 'Pending' || status === 'Arrived';
  const isCompleted = status === 'Completed';

  const cardStyle = isActionNeeded
    ? `bg-white border-slate-200/90 border-l-4 ${priorityBorder} hover:border-teal-300 hover:shadow-xs shadow-2xs ring-1 ring-teal-500/10`
    : isCompleted
    ? 'bg-slate-50/60 border-slate-200/70 border-l-4 border-l-emerald-500/40 hover:bg-white hover:border-slate-300 opacity-85'
    : `bg-slate-50/40 border-slate-200/80 border-l-4 ${priorityBorder} hover:bg-white hover:border-slate-300 shadow-2xs`;

  return (
    <div
      data-referral-id={refItem.id}
      data-patient-name={refItem.patient_name}
      data-action="open-case"
      onClick={() => onSelect(refItem)}
      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${cardStyle}`}
    >
      {/* Row 1: Patient avatar + identity + Status badge & Responsibility */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#008F83] border border-teal-100 flex items-center justify-center font-black text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-[#16324F] leading-tight truncate flex items-center gap-1.5">
              <span>{refItem.patient_name}</span>
              {refItem.is_legacy_patient && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Legacy Record
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {patientIdDisplay}{patientDemographics ? ` · ${patientDemographics}` : ''}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
            {statusText}
          </span>
          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
            {responsibility.nextText}
          </span>
        </div>
      </div>

      {/* Row 2: Reason for referral */}
      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
        {referralReason}
      </p>

      {/* Row 3: Action + metadata */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left metadata: origin, department, elapsed time */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium flex-wrap">
          {elapsedLabel && (
            <span className={`font-bold ${elapsedMins > 60 ? 'text-amber-700' : 'text-slate-500'}`}>
              {elapsedLabel}
            </span>
          )}
          {elapsedLabel && <span>·</span>}
          <span>{refItem.destination_department || 'General OPD'}</span>
          {priorityKey && priorityKey !== 'GREEN' && (
            <>
              <span>·</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${priorityBadge}`}>
                {priorityLabel}
              </span>
            </>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Token link for Pending/Accepted */}
          {(status === 'Accepted' || status === 'Pending') && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="assign-token"
              onClick={() => onOpenToken(refItem)}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium cursor-pointer"
            >
              Token
            </button>
          )}

          {/* PRIMARY ACTION BUTTON — one dominant action per status */}
          {status === 'Pending' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="accept-referral"
              disabled={isActionLoading}
              onClick={() => onAccept(refItem.id)}
              className={`px-4 py-1.5 bg-[#008F83] hover:bg-[#007369] text-white font-black text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActionLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Accepting...</span>
                </>
              ) : (
                'Accept Referral'
              )}
            </button>
          )}

          {status === 'Accepted' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="mark-arrived"
              disabled={isActionLoading}
              onClick={() => onMarkArrived(refItem.id)}
              className={`px-4 py-1.5 bg-[#16324F] hover:bg-[#1f456e] text-white font-black text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActionLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Marking...</span>
                </>
              ) : (
                'Mark Arrived'
              )}
            </button>
          )}

          {status === 'Arrived' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="send-to-doctor"
              disabled={isActionLoading}
              onClick={() => onRouteDoctor(refItem)}
              className={`px-4 py-1.5 bg-[#008F83] hover:bg-[#007369] text-white font-black text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActionLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                'Assign Doctor'
              )}
            </button>
          )}

          {status === 'Assigned' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="reassign-doctor"
              disabled={isActionLoading}
              onClick={() => onRouteDoctor(refItem)}
              className={`px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActionLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Reassign
            </button>
          )}

          {status === 'In Consultation' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="view-case"
              onClick={() => onSelect(refItem)}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              With Doctor · View
            </button>
          )}

          {status === 'Completed' && (
            <button
              type="button"
              data-referral-id={refItem.id}
              data-action="view-case"
              onClick={() => onSelect(refItem)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              View Summary
            </button>
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

  // Navigation Tabs: 'queue' | 'home' | 'emergency'
  const [activeTab, setActiveTab] = useState('queue');
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
  const actionLoadingIdRef = useRef(actionLoadingId);
  useEffect(() => {
    actionLoadingIdRef.current = actionLoadingId;
  }, [actionLoadingId]);
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
  const [assignDoctor, setAssignDoctor] = useState('');
  const [assignDoctorId, setAssignDoctorId] = useState(null);
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

    // Default to first available DB doctor, or empty
    const defaultDoctor = doctors.length > 0 ? doctors[0] : null;
    setAssignTokenNum(existingToken);
    setAssignSlot(existingSlot);
    setAssignRoom('Counter 2 · General OPD');
    setAssignDoctor(ref.doctor_assigned || defaultDoctor?.name || '');
    setAssignDoctorId(ref.doctor_id || defaultDoctor?.id || null);
    setAssignInstruction('Report directly to Counter 2 with this token for priority triage.');
    setShowTokenModal(ref);
  };

  const handleConfirmTokenAssignment = async () => {
    if (!showTokenModal || assigningLoading) return;
    if (!facility?.id && !isDemoMode) {
      setError('Facility information unavailable. Action aborted.');
      return;
    }
    setAssigningLoading(true);
    try {
      const targetStatus = showTokenModal.status === 'Pending' ? 'Accepted' : showTokenModal.status;
      if (!isDemoMode) {
        const res = await assignStaffTokenAndSlot({
          referralId: showTokenModal.id,
          careRequestId: showTokenModal.id,
          tokenNumber: assignTokenNum,
          arrivalSlot: assignSlot,
          room: assignRoom,
          doctorAssigned: assignDoctor,
          doctorId: assignDoctorId,
          facilityId: facility.id,
          status: targetStatus,
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
        status: targetStatus,
        doctor_assigned: assignDoctor ? `${assignDoctor} (${assignRoom})` : r.doctor_assigned,
        doctor_id: assignDoctorId || r.doctor_id,
        ai_note: assignedNote,
        asha_notes: assignedNote,
        slot_preference: slotPref
      } : r));

      if (selectedReferral && selectedReferral.id === showTokenModal.id) {
        setSelectedReferral(prev => ({
          ...prev,
          status: targetStatus,
          doctor_assigned: assignDoctor ? `${assignDoctor} (${assignRoom})` : prev.doctor_assigned,
          doctor_id: assignDoctorId || prev.doctor_id,
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

      if (!staffData || !staffData.facility_id || !staffData.facilities) {
        throw new Error('Facility information unavailable. Please retry or contact an administrator.');
      }

      const resolvedFacilityId = staffData.facility_id;
      const resolvedFacilityName = staffData.facilities.name;
      const resolvedFacilityDistrict = staffData.facilities.district || 'District';
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
          .eq('facility', resolvedFacilityName)
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
      // Canonical patient identity is UUID; filter to prevent Postgres syntax error on legacy strings
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const patientUuids = Array.from(new Set(combinedRefs.map(r => r.patient_id).filter(isUuid)));

      let patientsMap = {};
      if (patientUuids.length > 0) {
        try {
          const { data: pts } = await supabase
            .from('patients')
            .select('id, unified_id, full_name, age, gender, phone_number, blood_group')
            .in('id', patientUuids);

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
        const hasValidPatientUuid = isUuid(r.patient_id);
        const linkedPatient = hasValidPatientUuid ? patientsMap[r.patient_id] : null;
        const isLegacyId = r.patient_id && !hasValidPatientUuid;
        return {
          ...r,
          is_legacy_patient: isLegacyId,
          patient_name: r.patient_name || linkedPatient?.full_name || (isLegacyId ? `Patient (${r.patient_id})` : 'Patient'),
          patient_unified_id: linkedPatient?.unified_id || (isLegacyId ? `Legacy ID: ${r.patient_id}` : (r.patient_id && !r.patient_id.includes('-') ? r.patient_id : null)),
          patient_phone: linkedPatient?.phone_number || r.vitals?.phone || null,
          patient_age: linkedPatient?.age || r.patient_age || null,
          patient_gender: linkedPatient?.gender || r.patient_gender || null,
          patient_blood_group: linkedPatient?.blood_group || r.patient_blood_group || null
        };
      });

      setReferrals(prev => {
        if (!prev || prev.length === 0) return enrichedRefs;
        // If an item is actively executing an in-flight mutation, retain its active in-flight status until mutation resolves
        const currentLoadingId = actionLoadingIdRef.current;
        if (currentLoadingId) {
          const inFlight = prev.find(r => r.id === currentLoadingId);
          if (inFlight) {
            return enrichedRefs.map(remoteRef => remoteRef.id === currentLoadingId ? inFlight : remoteRef);
          }
        }
        return enrichedRefs;
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
      }, 30000);

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

  // ─── STATUS TRANSITIONS (APPLICATION-LEVEL REFERRAL WORKFLOW) ───
  // 1. Pending -> Accepted
  const handleAcceptReferral = async (refId) => {
    if (actionLoadingId) return;
    if (!facility?.id && !isDemoMode) {
      setError('Facility information unavailable. Action aborted.');
      return;
    }

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

    setActionLoadingId(refId);
    try {
      let updateQuery = supabase
        .from('referrals')
        .update({ status: 'Accepted' })
        .eq('id', refId)
        .eq('destination_facility_id', facility.id);

      const { data: updatedRow, error } = await updateQuery
        .select('id, status')
        .single();

      if (error) throw error;
      if (!updatedRow || updatedRow.id !== refId || updatedRow.status !== 'Accepted') {
        throw new Error(`Accept status update verification failed for referral ${refId}`);
      }

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Accepted' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Accepted' } : prev));
      showToast('✓ Referral accepted — now waiting for patient arrival at reception.');
      setTimeout(() => loadSupabaseData(true), 2500);
    } catch (err) {
      console.error('[HospitalStaff] Failed to accept referral:', err);
      setError(`Failed to accept referral: ${err.message}`);
      await loadSupabaseData(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Accepted -> Arrived
  const handleMarkArrived = async (refId) => {
    if (actionLoadingId) return;
    if (!facility?.id && !isDemoMode) {
      setError('Facility information unavailable. Action aborted.');
      return;
    }

    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Arrived' } : prev));
      showToast('✓ Patient physical arrival recorded at reception — ready for clinician assignment.');
      return;
    }

    const currentRef = referrals.find(r => r.id === refId);
    if (currentRef && !['Pending', 'Accepted', 'Assigned'].includes(currentRef.status)) {
      setError(`Invalid status transition: Referral cannot be marked arrived from '${currentRef.status}'.`);
      return;
    }

    setActionLoadingId(refId);
    try {
      let updateQuery = supabase
        .from('referrals')
        .update({ status: 'Arrived' })
        .eq('id', refId)
        .eq('destination_facility_id', facility.id);

      const { data: updatedRow, error } = await updateQuery
        .select('id, status')
        .single();

      if (error) throw error;
      if (!updatedRow || updatedRow.id !== refId || updatedRow.status !== 'Arrived') {
        throw new Error(`Arrival status update verification failed for referral ${refId}`);
      }

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Arrived' } : prev));
      showToast('✓ Patient physical arrival verified at reception — please assign a clinician desk.');
      setTimeout(() => loadSupabaseData(true), 2500);
    } catch (err) {
      console.error('[HospitalStaff] Failed to mark arrival:', err);
      setError(`Failed to mark arrival: ${err.message}`);
      await loadSupabaseData(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Arrived / Accepted -> Assign Doctor
  const handleRouteToDoctor = async (refId, doctorName, doctorId = null) => {
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (actionLoadingId) return;
    if (!facility?.id && !isDemoMode) {
      setError('Facility information unavailable. Action aborted.');
      return;
    }

    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, doctor_assigned: doctorName, doctor_id: doctorId, status: 'Assigned' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, doctor_assigned: doctorName, doctor_id: doctorId, status: 'Assigned' } : prev));
      setShowDoctorRouteModal(null);
      showToast(`✓ Patient routed to ${doctorName} (Assigned) — clinician consultation queue updated.`);
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

    setActionLoadingId(refId);
    try {
      const updatePayload = {
        doctor_assigned: doctorName,
        doctor_id: doctorId,
        status: 'Assigned'
      };

      let updateQuery = supabase
        .from('referrals')
        .update(updatePayload)
        .eq('id', refId)
        .eq('destination_facility_id', facility.id);

      const { data: updatedRow, error } = await updateQuery
        .select('id, status, doctor_assigned, doctor_id')
        .single();

      if (error) throw error;
      if (!updatedRow || updatedRow.id !== refId || updatedRow.doctor_id !== doctorId) {
        throw new Error(`Doctor routing verification failed for referral ${refId}`);
      }

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, ...updatePayload } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, ...updatePayload } : prev));
      setShowDoctorRouteModal(null);
      showToast(`✓ Patient routed to ${doctorName} (Assigned) — clinician consultation queue updated.`);
      setTimeout(() => loadSupabaseData(true), 3000);
    } catch (err) {
      console.error('[HospitalStaff] Failed to assign specialist:', err);
      setError(`Failed to assign specialist: ${err.message}`);
      await loadSupabaseData(true);
    } finally {
      setActionLoadingId(null);
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
        showToast(`🚑 Ambulance request recorded (${vNum} · Recorded ETA: ${etaVal})`);
        setDispatchModalSOS(null);
        return;
      }
      await updateEmergencyDispatch(sos.id, {
        ambulance_status: 'DISPATCHED',
        ambulance_vehicle: vNum,
        ambulance_eta: etaVal,
        status: 'DISPATCHED'
      });
      showToast(`🚑 Ambulance request recorded (${vNum} · Recorded ETA: ${etaVal})`);
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
      const hospitalName = facility?.name || (isDemoMode ? 'Shrirampur Primary Health Centre' : 'Primary Health Centre');
      const msg = `🚨 *EMERGENCY SOS DISPATCH ALERT*\n*Patient:* ${sos.patient_name || 'Citizen'}\n*Phone:* ${sos.phone}\n*Emergency:* ${sos.nature} (${sos.cadCategory})\n*Location:* ${sos.village}\n*GPS Map:* ${sos.mapsLink || 'Near Facility'}\n*Signs:* ${sos.signs || 'Immediate response needed'}\n*Hospital:* ${hospitalName}\nPlease escort or reach immediately!`;
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
    const onDutyDoctor = doctors.length > 0 ? doctors[0].name : 'Emergency Medical Officer';
    try {
      if (isDemoMode) {
        setEmergencyCases(prev => prev.map(c => c.id === sos.id ? { ...c, doctorStatus: 'NOTIFIED', doctor_assigned: onDutyDoctor } : c));
        setAllEmergencyLogs(prev => prev.map(c => c.id === sos.id ? { ...c, doctorStatus: 'NOTIFIED', doctor_assigned: onDutyDoctor } : c));
        showToast(`🩺 Escalated to ${onDutyDoctor}`);
        return;
      }
      await updateEmergencyDispatch(sos.id, {
        doctor_status: 'NOTIFIED',
        doctor_assigned: onDutyDoctor
      });
      showToast(`🩺 Escalated to ${onDutyDoctor}`);
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
    const arrived = referrals.filter(r => r.status === 'Arrived').length;
    const actionNeeded = pending + arrived;
    const waiting = referrals.filter(r => r.status === 'Accepted' || r.status === 'Arrived' || r.status === 'Assigned').length;
    const inConsultation = referrals.filter(r => r.status === 'In Consultation').length;
    const completed = referrals.filter(r => r.status === 'Completed').length;
    return { pending, arrived, actionNeeded, waiting, inConsultation, completed, total: referrals.length };
  }, [referrals]);

  // Memos for intake source segregation (ASHA vs Direct Patient vs Teleconsult)
  const _sourceCounts = useMemo(() => {
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
      if (queueFilter === 'ACTION_NEEDED') {
        list = list.filter(r => r.status === 'Pending' || r.status === 'Arrived');
      } else if (queueFilter === 'Pending') {
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* ── Toast Message Notification ── */}
      {successMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 bg-slate-900 text-white font-extrabold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Operations Desk Header ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 bg-teal-50 border border-teal-200/80 text-[#008F83] rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-6 h-6 text-[#008F83]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-[#16324F] leading-tight">
                  Hospital Referral Desk &amp; Intake
                </h1>
                {isDemoMode ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Demo Mode
                  </span>
                ) : error ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Sync Disrupted
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                    Live Subscription (30s Fallback)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-700 font-bold">📍 {facility?.name || 'Primary Health Centre'}</span>
                <span className="text-slate-300">·</span>
                <span>Staff: {staffProfile?.name || 'Coordination Desk'}</span>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-xl text-[11px] font-black text-slate-700 hover:text-teal-900 transition-colors cursor-pointer shadow-2xs"
              title="Refresh incoming referrals queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#008F83] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Subtle Operational Summary */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3 sm:gap-4 text-xs text-slate-500 font-medium flex-wrap">
          <span>Needs Action: <strong className={counts.actionNeeded > 0 ? "text-amber-800 font-black" : "text-slate-900 font-bold"}>{counts.actionNeeded}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Waiting Room: <strong className="text-slate-900 font-bold">{counts.waiting}</strong></span>
          <span className="text-slate-300">·</span>
          <span>With Doctor: <strong className="text-slate-900 font-bold">{counts.inConsultation}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Completed: <strong className="text-emerald-700 font-bold">{counts.completed}</strong></span>
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
        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg border border-red-400 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: alert identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base shrink-0 animate-pulse">
                🚨
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white text-red-700 px-2 py-0.5 rounded-full">
                    EMERGENCY SOS
                  </span>
                  <span className="text-sm font-black text-white truncate">
                    {emergencyCases[0].patient_name || 'Emergency Caller'}
                  </span>
                  <span className="text-xs text-red-100">
                    · {emergencyCases[0].nature} · 📍 {emergencyCases[0].village}
                  </span>
                </div>
                {emergencyCases.length > 1 && (
                  <p className="text-[11px] text-red-200 mt-0.5">
                    +{emergencyCases.length - 1} more active call{emergencyCases.length > 2 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Right: quick actions + open desk */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <a
                href={`tel:${emergencyCases[0].phone}`}
                onClick={() => handleLogCall(emergencyCases[0])}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>

              <button
                type="button"
                onClick={() => setDispatchModalSOS(emergencyCases[0])}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  emergencyCases[0].ambulanceStatus === 'DISPATCHED'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                }`}
              >
                <Siren className="w-3.5 h-3.5" />
                <span>{emergencyCases[0].ambulanceStatus === 'DISPATCHED' ? 'Ambulance Logged ✓' : 'Log Ambulance'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyAlarmMuted(prev => !prev)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                title={emergencyAlarmMuted ? 'Unmute siren' : 'Mute siren'}
              >
                {emergencyAlarmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('emergency')}
                className="px-3 py-1.5 bg-black/30 hover:bg-black/40 text-white rounded-xl text-xs font-black border border-white/30 cursor-pointer transition-colors"
              >
                Open Desk →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1 text-xs overflow-x-auto scrollbar-hide">
        {[
          {
            key: 'queue',
            label: 'Patient Queue',
            badge: counts.actionNeeded > 0 ? counts.actionNeeded : null,
            badgeColor: 'bg-amber-500 text-white'
          },
          { key: 'home', label: 'Desk Overview' },
          {
            key: 'emergency',
            label: '🚨 Emergency',
            badge: emergencyCases.length > 0 ? emergencyCases.length : null,
            badgeColor: 'bg-red-600 text-white',
            isEmergency: true
          }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearchQuery('');
            }}
            className={`px-4 py-2 font-black border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === tab.key
                ? tab.isEmergency ? 'border-red-600 text-red-600' : 'border-[#008080] text-[#008080]'
                : tab.isEmergency ? 'border-transparent text-red-600 hover:text-red-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab.badgeColor} leading-none`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OPERATIONAL HOME (DESK OVERVIEW) ── */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Quick Stats Grid: 4 Truthful Handoff Funnels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('ACTION_NEEDED'); }}
              className={`p-4 bg-white border rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs ${
                counts.actionNeeded > 0 ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:border-amber-400'
              }`}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">⚡ Staff Action Needed</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${counts.actionNeeded > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                  {counts.actionNeeded}
                </span>
                <span className="text-[11px] text-amber-700 font-bold">
                  {counts.pending} intake · {counts.arrived} arrive
                </span>
              </div>
            </div>

            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('Accepted_Arrived'); }}
              className="p-4 bg-white border border-slate-200 hover:border-[#008080] rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waiting Room</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{counts.waiting}</span>
                <span className="text-[11px] text-[#008080] font-bold">Arrived / Assigned</span>
              </div>
            </div>

            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('In_Consultation'); }}
              className="p-4 bg-white border border-slate-200 hover:border-purple-400 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">With Doctor</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{counts.inConsultation}</span>
                <span className="text-[11px] text-purple-700 font-bold">In Consultation</span>
              </div>
            </div>

            <div
              onClick={() => { setActiveTab('queue'); setQueueFilter('Completed'); }}
              className="p-4 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completed Today</span>
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
            <span>Open Patient Desk & Queue ({referrals.length} Total)</span>
          </button>

          {/* 1. URGENT / ACTION REQUIRED SECTION */}
          {counts.actionNeeded > 0 ? (
            <div className="bg-white border-2 border-teal-600/40 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-sm font-black">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      Patients Requiring Staff Action ({counts.actionNeeded})
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {counts.pending} pending referral acceptance · {counts.arrived} arrived awaiting clinician assignment
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('queue'); setQueueFilter('ACTION_NEEDED'); }}
                  className="text-xs font-black text-[#008080] hover:underline cursor-pointer self-start sm:self-auto"
                >
                  View Actionable Queue →
                </button>
              </div>

              <div className="space-y-3">
                {referrals
                  .filter(r => r.status === 'Pending' || r.status === 'Arrived')
                  .sort((a, b) => {
                    if (a.priority === b.priority) return 0;
                    if (a.priority === 'HIGH' || a.priority === 'RED') return -1;
                    if (b.priority === 'HIGH' || b.priority === 'RED') return 1;
                    if (a.priority === 'ORANGE') return -1;
                    if (b.priority === 'ORANGE') return 1;
                    return 0;
                  })
                  .slice(0, 4)
                  .map(ref => (
                    <ReferralActionCard
                      key={ref.id}
                      refItem={ref}
                      onSelect={setSelectedReferral}
                      onAccept={handleAcceptReferral}
                      onMarkArrived={handleMarkArrived}
                      onRouteDoctor={setShowDoctorRouteModal}
                      onOpenToken={handleOpenTokenModal}
                      actionLoadingId={actionLoadingId}
                      getReferralOrigin={getReferralOrigin}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <h3 className="text-sm font-black text-slate-900">All Arrived Patients Have Been Assigned</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No immediate staff action required. New incoming referrals from ASHA workers or outpatient desks will appear here automatically.
              </p>
            </div>
          )}

          {/* 2. IN-PROGRESS & MONITORING SECTION */}
          {referrals.filter(r => r.status === 'Accepted' || r.status === 'Assigned' || r.status === 'In Consultation').length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                    In-Progress Referrals Underway ({counts.waiting - counts.arrived + counts.inConsultation})
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Patients awaiting physical arrival or currently in queue / consultation with clinicians
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab('queue'); setQueueFilter('Accepted_Arrived'); }}
                  className="text-xs font-black text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  View Waiting Room →
                </button>
              </div>

              <div className="space-y-3">
                {referrals
                  .filter(r => r.status === 'Accepted' || r.status === 'Assigned' || r.status === 'In Consultation')
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
                      actionLoadingId={actionLoadingId}
                      getReferralOrigin={getReferralOrigin}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PATIENT QUEUE (PRIMARY OPERATIONAL VIEW) ── */}
      {activeTab === 'queue' && (
        <div className="space-y-3 animate-in fade-in duration-150">

          {/* Single combined filter + search row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Status filter pills — primary operational filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-hide flex-1">
              {[
                { key: 'ALL', label: `All (${referrals.length})` },
                { key: 'ACTION_NEEDED', label: `⚡ Action (${counts.actionNeeded})`, isAction: true },
                { key: 'Pending', label: `Incoming (${counts.pending})` },
                { key: 'Accepted_Arrived', label: `Waiting (${counts.waiting})` },
                { key: 'In_Consultation', label: `With Dr. (${counts.inConsultation})` },
                { key: 'Completed', label: `Done (${counts.completed})` }
              ].map(filterBtn => (
                <button
                  key={filterBtn.key}
                  onClick={() => setQueueFilter(filterBtn.key)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] shrink-0 transition-colors cursor-pointer ${
                    queueFilter === filterBtn.key
                      ? filterBtn.isAction ? 'bg-amber-600 text-white shadow-xs' : 'bg-[#008080] text-white shadow-xs'
                      : filterBtn.isAction && counts.actionNeeded > 0
                      ? 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {filterBtn.label}
                </button>
              ))}
            </div>

            {/* Source filter — compact segment, secondary */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 text-[10px] font-black shrink-0">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'ASHA', label: '🚨 ASHA' },
                { key: 'PATIENT_DIRECT', label: '👤 Direct' },
                { key: 'TELECONSULT', label: '📹 Tele' }
              ].map(sBtn => (
                <button
                  key={sBtn.key}
                  type="button"
                  onClick={() => setSourceFilter(sBtn.key)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    sourceFilter === sBtn.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sBtn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID, symptoms, or department..."
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
            queueFilter === 'ALL' && !searchQuery ? (
              <div className="space-y-6">
                {/* 1. Needs Your Action */}
                {(() => {
                  const needsAction = filteredReferrals.filter(r => r.status === 'Pending' || r.status === 'Arrived');
                  if (needsAction.length === 0) return null;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                          <span>⚡ Needs Your Action</span>
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            {needsAction.length}
                          </span>
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">Review referrals &amp; route arrived patients</span>
                      </div>
                      <div className="space-y-3">
                        {needsAction.map(ref => (
                          <ReferralActionCard
                            key={ref.id}
                            refItem={ref}
                            onSelect={setSelectedReferral}
                            onAccept={handleAcceptReferral}
                            onMarkArrived={handleMarkArrived}
                            onRouteDoctor={setShowDoctorRouteModal}
                            onOpenToken={handleOpenTokenModal}
                            actionLoadingId={actionLoadingId}
                            getReferralOrigin={getReferralOrigin}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. In Progress & Monitoring */}
                {(() => {
                  const inProgress = filteredReferrals.filter(r => r.status === 'Accepted' || r.status === 'Assigned' || r.status === 'In Consultation');
                  if (inProgress.length === 0) return null;
                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                        <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                          <span>In Progress</span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {inProgress.length}
                          </span>
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">En route or waiting in clinician queue</span>
                      </div>
                      <div className="space-y-3">
                        {inProgress.map(ref => (
                          <ReferralActionCard
                            key={ref.id}
                            refItem={ref}
                            onSelect={setSelectedReferral}
                            onAccept={handleAcceptReferral}
                            onMarkArrived={handleMarkArrived}
                            onRouteDoctor={setShowDoctorRouteModal}
                            onOpenToken={handleOpenTokenModal}
                            actionLoadingId={actionLoadingId}
                            getReferralOrigin={getReferralOrigin}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Completed Today */}
                {(() => {
                  const completed = filteredReferrals.filter(r => r.status === 'Completed');
                  if (completed.length === 0) return null;
                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                        <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <span>Completed Today</span>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {completed.length}
                          </span>
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {completed.map(ref => (
                          <ReferralActionCard
                            key={ref.id}
                            refItem={ref}
                            onSelect={setSelectedReferral}
                            onAccept={handleAcceptReferral}
                            onMarkArrived={handleMarkArrived}
                            onRouteDoctor={setShowDoctorRouteModal}
                            onOpenToken={handleOpenTokenModal}
                            actionLoadingId={actionLoadingId}
                            getReferralOrigin={getReferralOrigin}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
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
                    actionLoadingId={actionLoadingId}
                    getReferralOrigin={getReferralOrigin}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="py-14 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-2.5 px-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50/80 border border-teal-100/80 text-[#008F83] flex items-center justify-center mb-1">
                <Inbox className="w-7 h-7 text-[#008F83]/80" />
              </div>
              <h4 className="text-base font-black text-[#16324F]">No referrals currently require attention</h4>
              <p className="text-xs text-slate-500 font-medium max-w-sm">
                {searchQuery
                  ? 'No referrals matched your search keywords. Try searching by another name, ID, or department.'
                  : 'Incoming referrals from frontline workers and outpatient desks will appear here automatically.'}
              </p>
            </div>
          )}
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
                        {isResolved ? '✓ Case Resolved / Stabilized' : sos.ambulanceStatus === 'DISPATCHED' ? `Ambulance Request Recorded (ETA ${sos.ambulanceEta})` : 'Pending Action'}
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

                      {/* Column 2: Frontline Assessment */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          Frontline Triage Assessment
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
                          Response Status
                        </span>
                        <div className="space-y-1 text-slate-700">
                          <p className="flex items-center gap-1.5">
                            <Siren className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ambulance: <strong>{sos.ambulanceStatus === 'DISPATCHED' ? `Request Recorded (${sos.ambulanceVehicle})` : 'Not Recorded'}</strong></span>
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
                            <span>{sos.ambulanceStatus === 'DISPATCHED' ? `Update Ambulance (${sos.ambulanceEta})` : 'Record Ambulance Request'}</span>
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
                <p className="text-sm font-black text-slate-800">No active emergency transport calls</p>
                <p className="text-xs text-slate-400">Emergency transport requests are logged and monitored in real-time.</p>
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

      {/* ─── MODAL 1: REFERRAL HANDOFF RECORD (CLEAN, FOCUSED PATIENT CASE) ─── */}
      {selectedReferral && (() => {
        const dangerSigns = Array.isArray(selectedReferral.danger_signs)
          ? selectedReferral.danger_signs
          : (typeof selectedReferral.danger_signs === 'string' && selectedReferral.danger_signs.trim())
          ? [selectedReferral.danger_signs]
          : [];

        const vitals = selectedReferral.vitals || {};
        const docName = selectedReferral.doctor_assigned
          ? (selectedReferral.doctor_assigned.startsWith('Dr.') ? selectedReferral.doctor_assigned : 'Dr. ' + selectedReferral.doctor_assigned)
          : null;

        // Current state label
        let stateLabel = 'PENDING — NEEDS HOSPITAL ACCEPTANCE';
        if (selectedReferral.status === 'Accepted') stateLabel = 'ACCEPTED — WAITING FOR PATIENT ARRIVAL';
        if (selectedReferral.status === 'Arrived') stateLabel = 'ARRIVED — NEEDS DOCTOR ASSIGNMENT';
        if (selectedReferral.status === 'Assigned') stateLabel = `ASSIGNED — IN QUEUE (${docName || 'Doctor'})`;
        if (selectedReferral.status === 'In Consultation') stateLabel = `IN CONSULTATION — WITH ${docName || 'Doctor'}`;
        if (selectedReferral.status === 'Completed') stateLabel = 'COMPLETED — ENCOUNTER SIGNED';

        // 6-step referral journey timeline
        const statusOrder = ['Pending', 'Accepted', 'Arrived', 'Assigned', 'In Consultation', 'Completed'];
        const currentIdx = statusOrder.indexOf(selectedReferral.status);

        const timelineSteps = [
          {
            title: 'Referral created by frontline worker',
            subtitle: `${selectedReferral.created_by || 'ASHA Worker'}${selectedReferral.created_at ? ` · ${new Date(selectedReferral.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`,
            status: 'done'
          },
          {
            title: currentIdx >= 1 ? 'Referral accepted by hospital staff' : 'Review and accept referral',
            subtitle: currentIdx >= 1 ? 'Facility capacity acknowledged' : (currentIdx === 0 ? 'CURRENT STEP: Hospital Staff' : ''),
            status: currentIdx > 0 ? 'done' : (currentIdx === 0 ? 'current' : 'upcoming')
          },
          {
            title: currentIdx >= 2 ? 'Patient arrived at facility' : 'Patient arrival at facility',
            subtitle: currentIdx >= 2 ? 'Patient present at reception desk' : (currentIdx === 1 ? 'CURRENT STEP: Patient traveling' : ''),
            status: currentIdx > 1 ? 'done' : (currentIdx === 1 ? 'current' : 'upcoming')
          },
          {
            title: currentIdx >= 3 ? `Assigned to ${docName || 'Doctor'}` : 'Assign doctor desk',
            subtitle: currentIdx >= 3 ? 'Consultation queue assigned' : (currentIdx === 2 ? 'CURRENT STEP: Hospital Staff' : ''),
            status: currentIdx > 2 ? 'done' : (currentIdx === 2 ? 'current' : 'upcoming')
          },
          {
            title: currentIdx >= 4 ? `Consultation with ${docName || 'Doctor'}` : 'Doctor consultation',
            subtitle: currentIdx === 4 ? 'CURRENT STEP: Consultation in progress' : (currentIdx === 3 ? 'Patient waiting in OPD queue' : ''),
            status: currentIdx > 4 ? 'done' : (currentIdx === 3 || currentIdx === 4 ? 'current' : 'upcoming')
          },
          {
            title: currentIdx === 5 ? 'Consultation completed & signed' : 'Encounter sign-off',
            subtitle: currentIdx === 5 ? 'Encounter completed & signed' : '',
            status: currentIdx === 5 ? 'done' : 'upcoming'
          }
        ];

        // Responsibility details
        let respParty = 'Hospital Staff';
        let nextStepText = 'Review and accept incoming referral';
        if (selectedReferral.status === 'Accepted') {
          respParty = 'Patient';
          nextStepText = 'Patient traveling to facility; mark arrived when present at reception';
        } else if (selectedReferral.status === 'Arrived') {
          respParty = 'Hospital Staff';
          nextStepText = 'Assign on-duty doctor desk to route patient';
        } else if (selectedReferral.status === 'Assigned') {
          respParty = docName || 'Assigned Clinician';
          nextStepText = 'Patient is waiting in doctor consultation queue';
        } else if (selectedReferral.status === 'In Consultation') {
          respParty = docName || 'Assigned Clinician';
          nextStepText = 'Consultation in progress with clinician';
        } else if (selectedReferral.status === 'Completed') {
          respParty = 'Completed';
          nextStepText = 'Clinical consultation finalized and signed';
        }

        const tokenDisplay = selectedReferral.slot_preference || (selectedReferral.ai_note?.match(/TOKEN:\s*([^|]+)/i)?.[1]?.trim() ? `Token #${selectedReferral.ai_note.match(/TOKEN:\s*([^|]+)/i)[1].trim()}` : null);

        // State label colors
        const stateColor =
          selectedReferral.status === 'Pending' ? { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', dot: 'bg-amber-500' } :
          selectedReferral.status === 'Accepted' ? { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-800', dot: 'bg-slate-500' } :
          selectedReferral.status === 'Arrived' ? { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-900', dot: 'bg-teal-600 animate-pulse' } :
          selectedReferral.status === 'Assigned' ? { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', dot: 'bg-blue-500' } :
          selectedReferral.status === 'In Consultation' ? { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', dot: 'bg-purple-500 animate-pulse' } :
          selectedReferral.status === 'Completed' ? { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', dot: 'bg-emerald-500' } :
          { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              data-action="open-case"
              data-referral-id={selectedReferral.id}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
            >

              {/* Modal Header: Patient identity + state callout + primary action */}
              <div className="p-5 border-b border-slate-100 bg-white flex flex-col gap-3 shrink-0">

                {/* Patient identity row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#008F83] border border-teal-100 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                      {(selectedReferral.patient_name || 'P').trim()[0].toUpperCase()}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-black uppercase text-[#008F83] tracking-wider block">
                        Patient Case Record
                      </span>
                      <h2 className="text-lg font-black text-[#16324F] tracking-tight truncate">
                        {selectedReferral.patient_name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="font-mono font-bold text-slate-700">
                          {selectedReferral.patient_unified_id ? selectedReferral.patient_unified_id : (selectedReferral.patient_id ? `ID: ${selectedReferral.patient_id.slice(0, 8)}` : 'ID: Pending')}
                        </span>
                        <span>·</span>
                        <span>
                          {[
                            selectedReferral.patient_age ? `${selectedReferral.patient_age} yrs` : null,
                            selectedReferral.patient_gender,
                            selectedReferral.patient_blood_group ? `Blood ${selectedReferral.patient_blood_group}` : null
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReferral(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close case file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* State callout — the visual centerpiece */}
                <div className={`rounded-2xl border px-4 py-3 ${stateColor.bg} ${stateColor.border} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stateColor.dot}`} />
                    <span className={`text-sm font-black tracking-tight ${stateColor.text}`}>
                      {stateLabel}
                    </span>
                  </div>
                  <div className={`text-[11px] font-semibold ${stateColor.text} opacity-80`}>
                    Next: {nextStepText} — <strong>{respParty}</strong>
                  </div>

                  {/* Full-width primary action inside the state callout */}
                  {selectedReferral.status === 'Pending' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="accept-referral"
                      disabled={actionLoadingId === selectedReferral.id}
                      onClick={() => handleAcceptReferral(selectedReferral.id)}
                      className={`w-full mt-1 py-2 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        actionLoadingId === selectedReferral.id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionLoadingId === selectedReferral.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        'Accept Referral →'
                      )}
                    </button>
                  )}

                  {selectedReferral.status === 'Accepted' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="mark-arrived"
                      disabled={actionLoadingId === selectedReferral.id}
                      onClick={() => handleMarkArrived(selectedReferral.id)}
                      className={`w-full mt-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        actionLoadingId === selectedReferral.id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionLoadingId === selectedReferral.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Marking Arrived...</span>
                        </>
                      ) : (
                        'Mark Patient Arrived →'
                      )}
                    </button>
                  )}

                  {selectedReferral.status === 'Arrived' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="send-to-doctor"
                      disabled={actionLoadingId === selectedReferral.id}
                      onClick={() => setShowDoctorRouteModal(selectedReferral)}
                      className={`w-full mt-1 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        actionLoadingId === selectedReferral.id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      Assign Doctor →
                    </button>
                  )}

                  {selectedReferral.status === 'Assigned' && (
                    <button
                      type="button"
                      data-referral-id={selectedReferral.id}
                      data-action="reassign-doctor"
                      disabled={actionLoadingId === selectedReferral.id}
                      onClick={() => setShowDoctorRouteModal(selectedReferral)}
                      className={`w-full mt-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        actionLoadingId === selectedReferral.id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      Reassign Doctor
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Case Body: 3 Clean Focused Sections */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700">

                {/* ── SECTION 1: WHY THEY ARE HERE ── */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Why They Are Here
                  </h3>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 leading-relaxed">
                    {selectedReferral.symptoms || 'Referral intake encounter'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Referred By</span>
                      <span className="font-semibold text-slate-800">{selectedReferral.created_by || 'Frontline ASHA Worker'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Facility</span>
                      <span className="font-semibold text-slate-800">
                        {selectedReferral.destination_hospital || facility?.name || 'Primary Health Centre'}
                        {selectedReferral.destination_department ? ` · ${selectedReferral.destination_department}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: FRONTLINE ASSESSMENT ── */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Frontline Assessment
                  </h3>

                  {/* Flagged Danger Signs if recorded */}
                  {dangerSigns.length > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                      <span className="font-black text-rose-800 block mb-0.5">⚠️ Flagged Danger Signs by Frontline Triage:</span>
                      <span className="font-semibold">{dangerSigns.join(', ')}</span>
                    </div>
                  )}

                  {/* Pregnancy / Escort Indicator if recorded */}
                  {(selectedReferral.is_pregnant || selectedReferral.symptoms?.includes('ASHA ACCOMPANYING') || selectedReferral.clinical_summary?.includes('ASHA ACCOMPANYING')) && (
                    <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
                      🤰 ASHA worker accompanying patient for intake support.
                    </div>
                  )}

                  {/* Clean Vitals Table */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-100/60 flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span>Frontline Recorded Vitals</span>
                      <span className="text-[10px] text-slate-400 font-medium">Standard units</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 text-xs">
                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Blood Pressure</span>
                        <span className="font-bold text-slate-900">{vitals.bp ? `${vitals.bp} mmHg` : 'Not recorded'}</span>
                      </div>
                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Pulse Rate</span>
                        <span className="font-bold text-slate-900">{vitals.pulse ? `${vitals.pulse} bpm` : 'Not recorded'}</span>
                      </div>
                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Oxygen (SpO₂)</span>
                        <span className="font-bold text-slate-900">{vitals.spo2 ? `${vitals.spo2} %` : 'Not recorded'}</span>
                      </div>
                      <div className="p-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Temperature</span>
                        <span className="font-bold text-slate-900">{vitals.temp ? `${vitals.temp} °F` : 'Not recorded'}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI-Assisted Frontline Triage Recommendation if present */}
                  {(selectedReferral.ai_note || selectedReferral.clinical_summary) && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                        AI-Assisted Frontline Triage Recommendation (Operational prioritization · Not a physician diagnosis)
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {selectedReferral.ai_note || selectedReferral.clinical_summary}
                      </p>
                    </div>
                  )}

                  {/* Attached Document / Scan if present */}
                  {selectedReferral.attached_file_url && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="font-semibold text-slate-700">Attached Patient Document / Diagnostic Scan</span>
                      <a
                        href={selectedReferral.attached_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#008080] font-bold hover:underline"
                      >
                        View Document ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* ── SECTION 3: REFERRAL JOURNEY ── */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Referral Journey
                    </h3>
                    {tokenDisplay && (
                      <span className="text-[11px] font-mono font-bold text-teal-800">
                        {tokenDisplay}
                      </span>
                    )}
                  </div>
                  <div className="pl-2 border-l-2 border-slate-200 space-y-3 py-1 text-xs">
                    {timelineSteps.map((step, sIdx) => (
                      <div key={sIdx} className="relative pl-4">
                        <div className={`absolute -left-[13px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step.status === 'done'
                            ? 'bg-emerald-600 text-white'
                            : step.status === 'current'
                            ? 'bg-[#008080] text-white ring-2 ring-[#008080]/30'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {step.status === 'done' ? '✓' : step.status === 'current' ? '→' : '○'}
                        </div>
                        <div>
                          <div className={`font-bold ${
                            step.status === 'current'
                              ? 'text-[#008080] font-black'
                              : step.status === 'done'
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}>
                            {step.title}
                          </div>
                          {step.subtitle && (
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              {step.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Clean Modal Action Footer */}
              <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReferral(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Close Record
                </button>

                {/* Secondary Token button */}
                {(selectedReferral.status === 'Accepted' || selectedReferral.status === 'Pending') && (
                  <button
                    type="button"
                    data-referral-id={selectedReferral.id}
                    data-action="assign-token"
                    onClick={() => handleOpenTokenModal(selectedReferral)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>{selectedReferral.slot_preference?.includes('Token') || selectedReferral.ai_note?.includes('TOKEN:') ? 'Edit Token' : 'Assign Token'}</span>
                  </button>
                )}
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
                    disabled={actionLoadingId === showDoctorRouteModal.id}
                    onClick={() => handleRouteToDoctor(showDoctorRouteModal.id, doc.name, doc.id)}
                    data-action="route-to-doctor"
                    data-doctor-id={doc.id}
                    data-doctor-name={doc.name}
                    className="w-full p-3.5 text-left bg-slate-50 hover:bg-[#E6F2F2]/50 hover:border-[#008080] border border-slate-200 rounded-2xl flex items-center justify-between transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 group-hover:text-[#008080] transition-colors">{doc.name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{doc.specialty || 'Specialist'}</div>
                    </div>
                    {actionLoadingId === showDoctorRouteModal.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#008080]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#008080] group-hover:translate-x-0.5 transition-all" />
                    )}
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
                    value={assignDoctorId || assignDoctor}
                    onChange={e => {
                      const selectedVal = e.target.value;
                      const selectedDoc = doctors.find(d => d.id === selectedVal || d.name === selectedVal);
                      if (selectedDoc) {
                        setAssignDoctor(selectedDoc.name);
                        setAssignDoctorId(selectedDoc.id);
                      } else {
                        setAssignDoctor(selectedVal);
                        setAssignDoctorId(null);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:border-[#008F83]"
                  >
                    {doctors && doctors.length > 0 ? (
                      doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} {doc.specialty || doc.department ? `(${doc.specialty || doc.department})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">No specialists configured for this facility</option>
                    )}
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
    </div>
  );
}
