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
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Ticket,
  Clock
} from 'lucide-react';
import { supabase, ensureRoleAuth } from '../../services/supabase';
import { assignStaffTokenAndSlot } from '../../services/ashaService';


// Canonical Referral Status constants
const REFERRAL_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  ARRIVED: 'Arrived',
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

export default function HospitalStaffWorkspace({ 
  isDemoMode = false,
  demoDataEnabled = true,
  onBack,
  goHome,
  onNavigateToPatientView: _onNavigateToPatientView 
}) {
  const handleBack = onBack || goHome;
  
  // Navigation Tabs: 'home' | 'queue' | 'referrals'
  const [activeTab, setActiveTab] = useState('home');
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Accepted_Arrived' | 'Completed'
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
    setAssignTokenNum(randomToken);
    setAssignSlot('10:30 AM – 11:00 AM');
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
        await assignStaffTokenAndSlot({
          referralId: showTokenModal.id,
          patientId: showTokenModal.patient_id,
          tokenNumber: assignTokenNum,
          arrivalSlot: assignSlot,
          room: assignRoom,
          doctorAssigned: assignDoctor,
          instructions: assignInstruction
        });
      }

      const assignedNote = `TOKEN:${assignTokenNum} | SLOT:${assignSlot} | ROOM:${assignRoom} | INSTRUCTION:${assignInstruction}`;

      setReferrals(prev => prev.map(r => r.id === showTokenModal.id ? {
        ...r,
        status: 'Accepted',
        doctor_assigned: `${assignDoctor} (${assignRoom})`,
        ai_note: assignedNote
      } : r));

      if (selectedReferral && selectedReferral.id === showTokenModal.id) {
        setSelectedReferral(prev => ({
          ...prev,
          status: 'Accepted',
          doctor_assigned: `${assignDoctor} (${assignRoom})`,
          ai_note: assignedNote
        }));
      }

      showToast(`✓ Official Token #${assignTokenNum} & slot ${assignSlot} assigned to ${showTokenModal.patient_name}.`);
      setShowTokenModal(null);
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

      let resolvedFacilityId = staffData?.facility_id;
      let resolvedFacilityName = staffData?.facilities?.name;
      let resolvedFacilityDistrict = staffData?.facilities?.district;
      let resolvedStaffName = staffData?.name;

      if (!staffData) {
        const { data: defaultFac, error: facErr } = await supabase
          .from('facilities')
          .select('*')
          .order('name', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (facErr) throw facErr;

        if (defaultFac) {
          resolvedFacilityId = defaultFac.id;
          resolvedFacilityName = defaultFac.name;
          resolvedFacilityDistrict = defaultFac.district;
        } else {
          resolvedFacilityId = 'f1111111-1111-1111-1111-111111111111';
          resolvedFacilityName = 'Shrirampur Primary Health Centre';
          resolvedFacilityDistrict = 'Ahmednagar';
        }
        resolvedStaffName = activeUser.user_metadata?.name || activeUser.email?.split('@')[0] || 'Hospital Staff';
      }

      setStaffProfile({
        name: resolvedStaffName,
        role: staffData?.role || 'Hospital Staff Operations',
        phc_name: resolvedFacilityName
      });

      setFacility({
        id: resolvedFacilityId,
        name: resolvedFacilityName,
        district: resolvedFacilityDistrict || 'District'
      });

      // 3. Fetch Scoped Doctors for this Facility
      const { data: doctorsData, error: docErr } = await supabase
        .from('doctors')
        .select('*')
        .eq('facility_id', resolvedFacilityId);

      if (docErr) console.warn('[HospitalStaff] doctors query warning:', docErr.message);

      const fallbackDoctors = [
        { id: 'doc-kulkarni', name: 'Dr. Arvind Kulkarni', specialty: 'General Medicine & OPD', room: 'OPD Room 2' },
        { id: 'doc-sharma', name: 'Dr. Priya Sharma', specialty: 'Maternal & Child Health', room: 'ANC Room 4' },
        { id: 'doc-shinde', name: 'Dr. Rajesh Shinde', specialty: 'Chest & TB DOTS Specialist', room: 'Chest Clinic Room 1' }
      ];

      setDoctors((doctorsData && doctorsData.length > 0) ? doctorsData : fallbackDoctors);


      // 4. Fetch Scoped Referrals
      const { data: refData, error: refErr } = await supabase
        .from('referrals')
        .select('*')
        .or(`destination_facility_id.eq.${resolvedFacilityId},destination_hospital.ilike.%${(resolvedFacilityName || 'Shrirampur').split(' ')[0]}%`)
        .order('created_at', { ascending: false });

      if (refErr) throw refErr;

      // 5. Enrich referrals with patients' human-readable unified_id (MH-P-xxxxx)
      const rawRefs = refData || [];
      const patientIds = Array.from(new Set(rawRefs.map(r => r.patient_id).filter(Boolean)));
      
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

      const enrichedRefs = rawRefs.map(r => {
        const linkedPatient = patientsMap[r.patient_id];
        return {
          ...r,
          patient_unified_id: linkedPatient?.unified_id || (r.patient_id && !r.patient_id.includes('-') ? r.patient_id : null),
          patient_phone: linkedPatient?.phone_number || r.vitals?.phone || null,
          patient_age: linkedPatient?.age || null,
          patient_gender: linkedPatient?.gender || null,
          patient_blood_group: linkedPatient?.blood_group || null
        };
      });

      setReferrals(enrichedRefs);

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
      const channel = supabase.channel('staff_referrals_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
          loadSupabaseData(true);
        })
        .subscribe();

      const interval = setInterval(() => {
        loadSupabaseData(true);
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
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

  // ─── STATUS TRANSITIONS ───

  // 1. Pending -> Accepted
  const handleAcceptReferral = async (refId) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Accepted' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Accepted' } : prev));
      showToast('✓ Referral accepted and moved to waiting queue.');
      return;
    }

    try {
      const { error: err } = await supabase
        .from('referrals')
        .update({ status: 'Accepted' })
        .eq('id', refId);

      if (err) throw err;
      
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Accepted' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Accepted' } : prev));
      showToast('✓ Referral accepted successfully.');
    } catch (err) {
      setError(`Failed to accept referral: ${err.message}`);
    }
  };

  // 2. Accepted -> Arrived
  const handleMarkArrived = async (refId) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Arrived' } : prev));
      showToast('✓ Patient marked as arrived. Ready for doctor routing.');
      return;
    }

    try {
      const { error: err } = await supabase
        .from('referrals')
        .update({ status: 'Arrived' })
        .eq('id', refId);

      if (err) throw err;

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, status: 'Arrived' } : prev));
      showToast('✓ Patient marked as arrived.');
    } catch (err) {
      setError(`Failed to mark arrival: ${err.message}`);
    }
  };

  // 3. Arrived -> Assign Doctor
  const handleRouteToDoctor = async (refId, doctorName) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, doctor_assigned: doctorName, status: 'Assigned' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, doctor_assigned: doctorName, status: 'Assigned' } : prev));
      setShowDoctorRouteModal(null);
      showToast(`✓ Patient successfully routed to ${doctorName}.`);
      return;
    }

    try {
      // 1. Update referrals
      const { error: err } = await supabase
        .from('referrals')
        .update({ doctor_assigned: doctorName, status: 'Assigned' })
        .eq('id', refId);

      if (err) console.warn('[HospitalStaff] update referrals notice:', err.message);

      // 2. Also update care_requests so patient & doctor see it
      try {
        await supabase
          .from('care_requests')
          .update({
            doctor_assigned: doctorName,
            status: 'ACCEPTED',
            updated_at: new Date().toISOString()
          })
          .or(`id.eq.${refId},patient_id.eq.${showDoctorRouteModal?.patient_id || ''}`);
      } catch (_) {}

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, doctor_assigned: doctorName, status: 'Assigned' } : r));
      setSelectedReferral(prev => (prev && prev.id === refId ? { ...prev, doctor_assigned: doctorName, status: 'Assigned' } : prev));
      setShowDoctorRouteModal(null);
      showToast(`✓ Scoped referral updated with assigned specialist: ${doctorName}`);
    } catch (err) {
      setError(`Failed to assign specialist: ${err.message}`);
    }
  };


  // Memos for metrics
  const counts = useMemo(() => {
    const pending = referrals.filter(r => r.status === 'Pending').length;
    const waiting = referrals.filter(r => r.status === 'Accepted' || r.status === 'Arrived' || r.status === 'Assigned' || r.status === 'In Consultation').length;
    const completed = referrals.filter(r => r.status === 'Completed').length;
    return { pending, waiting, completed };
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
        list = list.filter(r => r.status === 'Accepted' || r.status === 'Arrived' || r.status === 'Assigned' || r.status === 'In Consultation');
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
        (r.destination_department || '').toLowerCase().includes(q) ||
        (r.symptoms || '').toLowerCase().includes(q) ||
        (r.created_by || '').toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [referrals, activeTab, queueFilter, sourceFilter, searchQuery, getReferralOrigin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#008080]" />
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
              PHC Operations Desk
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 transition-colors cursor-pointer"
            title="Refresh incoming referrals queue"
          >
            <RefreshCw className={`w-3 h-3 text-[#008080] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold rounded-2xl flex items-center justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
        {[
          { key: 'home', label: 'Home' },
          { key: 'queue', label: 'Patient Queue' },
          { key: 'referrals', label: 'Referral Log' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearchQuery('');
            }}
            className={`px-4 py-2 font-black border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#008080] text-[#008080]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OPERATIONAL HOME ── */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            <div 
              onClick={() => { setActiveTab('queue'); setQueueFilter('Pending'); }}
              className="p-4 bg-white border border-slate-200 hover:border-[#FF9933] rounded-2xl cursor-pointer transition-colors space-y-1"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Incoming</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900">{counts.pending}</span>
                <span className="text-[10px] text-[#FF9933] font-bold">Pending</span>
              </div>
            </div>

            <div 
              onClick={() => { setActiveTab('queue'); setQueueFilter('Accepted_Arrived'); }}
              className="p-4 bg-white border border-slate-200 hover:border-[#008080] rounded-2xl cursor-pointer transition-colors space-y-1"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waiting Room</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900">{counts.waiting}</span>
                <span className="text-[10px] text-[#008080] font-bold">Arrived</span>
              </div>
            </div>

            <div 
              onClick={() => { setActiveTab('queue'); setQueueFilter('Completed'); }}
              className="p-4 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-colors space-y-1"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completed</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900">{counts.completed}</span>
                <span className="text-[10px] text-emerald-600 font-bold">Closed</span>
              </div>
            </div>
          </div>

          {/* Primary Operations Queue Button */}
          <button
            onClick={() => { setActiveTab('queue'); setQueueFilter('ALL'); }}
            className="w-full py-4 bg-[#008080] hover:bg-[#006666] text-white font-black text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-99"
          >
            <Inbox className="w-5 h-5" />
            <span>Open Patient Queue</span>
          </button>

          {/* Urgent Next Patients Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3.5">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Next Patients</h2>
            
            {referrals.filter(r => r.status !== 'Completed').length > 0 ? (
              <div className="divide-y divide-slate-100">
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
                  .map(ref => {
                    const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                    const isUrgent = ref.priority === 'ORANGE';
                    const priorityBg = isHigh ? 'bg-rose-50 text-rose-800' : isUrgent ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-700';
                    
                    return (
                      <div 
                        key={ref.id} 
                        onClick={() => setSelectedReferral(ref)}
                        className="py-3 px-2 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900 group-hover:text-[#008080] transition-colors flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#008080]" />
                              {ref.patient_name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                              {ref.patient_unified_id ? `ID: ${ref.patient_unified_id}` : `ID: ${ref.patient_id?.slice(0, 8)}`}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${priorityBg}`}>
                              {ref.priority}
                            </span>
                            {ref.patient_phone && (
                              <a 
                                href={`tel:${ref.patient_phone}`} 
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.2 rounded transition-colors" 
                                title="Call patient"
                              >
                                <Phone className="w-2.5 h-2.5 text-[#008080]" />
                                <span>{ref.patient_phone}</span>
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {ref.destination_department} · {ref.symptoms}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedReferral(ref)}
                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#008080] border border-teal-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Open Clinical Case"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Clinical Case</span>
                          </button>
                          
                          {ref.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleOpenTokenModal(ref)}
                              className="px-3.5 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Ticket className="w-3 h-3" />
                              <span>Assign Token & Slot</span>
                            </button>
                          )}

                          {ref.status === 'Accepted' && (
                            <button
                              type="button"
                              onClick={() => handleMarkArrived(ref.id)}
                              className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-[11px] rounded-lg transition-colors cursor-pointer"
                            >
                              Arrive
                            </button>
                          )}

                          {ref.status === 'Arrived' && (
                            <button
                              type="button"
                              onClick={() => setShowDoctorRouteModal(ref)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] rounded-lg transition-colors cursor-pointer"
                            >
                              Route
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                ✓ No referrals require operational check-in.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ACTIVE QUEUE ── */}
      {activeTab === 'queue' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Source Segregation Bar (ASHA vs Direct Patient vs Teleconsult) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-1.5 overflow-x-auto text-xs shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 px-2">Origin Filter:</span>
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

          {/* Sub Filtering Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { key: 'ALL', label: 'All Queue' },
              { key: 'Pending', label: `Incoming (${counts.pending})` },
              { key: 'Accepted_Arrived', label: `Waiting Room (${counts.waiting})` },
              { key: 'Completed', label: `Completed (${counts.completed})` }
            ].map(filterBtn => (
              <button
                key={filterBtn.key}
                onClick={() => setQueueFilter(filterBtn.key)}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] shrink-0 transition-colors cursor-pointer ${
                  queueFilter === filterBtn.key
                    ? 'bg-[#008080] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filterBtn.label}
              </button>
            ))}
          </div>

          {/* Referral Queue Listing */}
          {filteredReferrals.length > 0 ? (
            <div className="space-y-3">
              {filteredReferrals.map(ref => {
                const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                const isUrgent = ref.priority === 'ORANGE';
                const priorityClass = isHigh
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : isUrgent
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                let statusPillColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (ref.status === 'Accepted') statusPillColor = 'bg-sky-50 text-sky-800 border-sky-200';
                if (ref.status === 'Arrived') statusPillColor = 'bg-teal-50 text-teal-800 border-teal-200';
                if (ref.status === 'Completed') statusPillColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                const origin = getReferralOrigin(ref);

                return (
                  <div 
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5 hover:border-[#008080]/60 hover:shadow-md transition-all cursor-pointer group"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 group-hover:text-[#008080] transition-colors flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#008080]" />
                          {ref.patient_name}
                        </span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                          {ref.patient_unified_id ? `ID: ${ref.patient_unified_id}` : `ID: ${ref.patient_id?.slice(0, 8)}`}
                        </span>

                        {/* Origin Tag */}
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${origin.badge}`}>
                          <span>{origin.icon}</span>
                          <span>{origin.label}</span>
                        </span>

                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${priorityClass}`}>
                          {ref.priority_label || ref.priority}
                        </span>
                        {ref.patient_phone && (
                          <a 
                            href={`tel:${ref.patient_phone}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors" 
                            title="Call patient"
                          >
                            <Phone className="w-3 h-3 text-[#008080]" />
                            <span>{ref.patient_phone}</span>
                          </a>
                        )}
                        {(ref.symptoms?.includes('ASHA ACCOMPANYING') || ref.clinical_summary?.includes('ASHA ACCOMPANYING')) && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            🤰 ASHA Escort
                          </span>
                        )}
                      </div>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded border ${statusPillColor}`}>
                        {ref.status}
                      </span>
                    </div>

                    {/* Vitals Summary snippet if present */}
                    {ref.vitals && Object.keys(ref.vitals).length > 0 && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {ref.vitals.bp && <span>BP: <strong>{ref.vitals.bp}</strong></span>}
                        {ref.vitals.pulse && <span>Pulse: <strong>{ref.vitals.pulse} bpm</strong></span>}
                        {ref.vitals.spo2 && <span>SpO₂: <strong>{ref.vitals.spo2}%</strong></span>}
                        {ref.vitals.temp && <span>Temp: <strong>{ref.vitals.temp}°F</strong></span>}
                      </div>
                    )}

                    {/* Symptoms notes */}
                    <div className="text-xs text-slate-600 font-medium space-y-1">
                      <div>
                        <strong className="text-slate-700">Complaint:</strong> {ref.symptoms}
                      </div>
                      {ref.created_by && (
                        <div className="text-[10px] text-slate-400">
                          Referred by {ref.created_by}
                        </div>
                      )}
                    </div>

                    {/* Actions and Routing footer */}
                    <div 
                      className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ref.doctor_assigned && (
                        <div className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          🩺 Specialist Assigned: <span className="text-slate-900">{ref.doctor_assigned}</span>
                        </div>
                      )}
                      
                      {!ref.doctor_assigned && <div className="text-[10px] italic text-slate-400">No clinician assigned yet</div>}

                      <div className="flex items-center gap-2 ml-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedReferral(ref)}
                          className="px-3 py-1.5 text-xs font-bold text-[#008080] bg-teal-50/70 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Open Clinical Case File"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Clinical Case</span>
                        </button>

                        {ref.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleOpenTokenModal(ref)}
                            className="px-4 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Assign Token & Slot</span>
                          </button>
                        )}

                        {ref.status === 'Accepted' && (
                          <button
                            type="button"
                            onClick={() => handleMarkArrived(ref.id)}
                            className="px-4 py-1.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Mark Arrived
                          </button>
                        )}

                        {ref.status === 'Arrived' && (
                          <button
                            type="button"
                            onClick={() => setShowDoctorRouteModal(ref)}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Send to Doctor
                          </button>
                        )}

                        {ref.status === 'Assigned' && (
                          <button
                            type="button"
                            onClick={() => setShowDoctorRouteModal(ref)}
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Re-assign Doctor
                          </button>
                        )}

                        {ref.status === 'In Consultation' && (
                          <span className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                            In Consultation
                          </span>
                        )}
                        
                        {ref.status === 'Completed' && (
                          <button
                            type="button"
                            onClick={() => setSelectedReferral(ref)}
                            className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Open Completed Clinical Case"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>View Case File</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-800">No patient matching queue filters</p>
              <p className="text-xs text-slate-400">All referrals for this category are up to date.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: REFERRAL SEARCH LOG ── */}
      {activeTab === 'referrals' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search referrals by name, ABHA/Unified ID, department, or symptoms..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#008080] rounded-xl text-xs font-semibold text-slate-900 outline-none transition-colors shadow-2xs"
            />
          </div>

          {/* Simple Search Results Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-500 bg-slate-50/50 flex items-center justify-between">
              <span>{filteredReferrals.length} Referrals Found</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#008080] hover:underline">Clear Search</button>
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
                          {ref.patient_unified_id ? `ID: ${ref.patient_unified_id}` : `ID: ${ref.patient_id?.slice(0, 8)}`}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {ref.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ref.destination_department} · Referred on {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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

      {/* ─── MODAL 1: CLINICAL CASE DOSSIER & INTAKE CONTEXT ─── */}
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
        if (selectedReferral.status === 'In Consultation') statusBadgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
        if (selectedReferral.status === 'Completed') statusBadgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';

        // Safe danger signs normalization
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
                      Clinical Case File
                    </span>
                    {modalOrigin === 'ASHA' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🚨 ASHA Referral
                      </span>
                    )}
                    {modalOrigin === 'PATIENT_DIRECT' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        👤 Direct Patient Booking
                      </span>
                    )}
                    {modalOrigin === 'TELECONSULT' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                        📹 Virtual Teleconsult
                      </span>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${priorityBadgeStyle}`}>
                      {selectedReferral.priority_label || selectedReferral.priority}
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
                      {selectedReferral.patient_unified_id ? `ABHA / ID: ${selectedReferral.patient_unified_id}` : `ID: ${selectedReferral.patient_id}`}
                    </span>
                    {(selectedReferral.patient_gender || selectedReferral.patient_age) && (
                      <span className="text-slate-500">
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
                  aria-label="Close clinical case file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Case Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                
                {/* Contact & Facility Overview */}
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
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded ml-1 font-bold">Call Now</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No phone recorded</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Destination Facility & Unit</span>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedReferral.destination_hospital || 'District Hospital / PHC'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Unit: <span className="font-bold text-slate-700">{selectedReferral.destination_department || 'OPD Triage'}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Clinician Desk */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Doctor / Specialist Desk</span>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <Stethoscope className="w-4 h-4 text-[#008080]" />
                      {selectedReferral.doctor_assigned ? (
                        <span className="text-slate-900">{selectedReferral.doctor_assigned}</span>
                      ) : (
                        <span className="text-amber-700 italic">Not Assigned (Awaiting OPD Triage Desk)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                      {modalOrigin === 'PATIENT_DIRECT' 
                        ? 'Booked Directly By' 
                        : modalOrigin === 'TELECONSULT' 
                        ? 'Consultation Origin' 
                        : 'Referred By Frontline Worker'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedReferral.created_by || (modalOrigin === 'PATIENT_DIRECT' ? 'Direct Patient (Self-Booking)' : modalOrigin === 'TELECONSULT' ? 'Virtual Teleconsultation' : 'ASHA Community Worker')}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(selectedReferral.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Flagged Danger Signs */}
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

                {/* Pregnancy / Special Escort Flag */}
                {(selectedReferral.is_pregnant || selectedReferral.symptoms?.includes('ASHA ACCOMPANYING') || selectedReferral.clinical_summary?.includes('ASHA ACCOMPANYING')) && (
                  <div className="pt-3">
                    <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-xs font-bold text-purple-900">
                      <span className="text-base">🤰</span>
                      <span>High-Priority Antenatal / Escorted Case — ASHA worker accompanying for priority OPD admission.</span>
                    </div>
                  </div>
                )}

                {/* Frontline Triage Vitals */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#008080]" />
                      Recorded Vitals at Triage
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Standard Health Mission Parameters</span>
                  </div>

                  {Object.keys(vitals).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
                        <span className="text-sm font-black text-slate-900">{vitals.bp || '—'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">mmHg</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold">Pulse / HR</span>
                        <span className="text-sm font-black text-slate-900">{vitals.pulse ? `${vitals.pulse} bpm` : '—'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">Beats/min</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border ${vitals.spo2 && Number(vitals.spo2) < 95 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block font-bold">Oxygen (SpO₂)</span>
                        <span className="text-sm font-black text-slate-900">{vitals.spo2 ? `${vitals.spo2}%` : '—'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">{vitals.spo2 && Number(vitals.spo2) < 95 ? '⚠️ Low Oxygen' : 'Normal'}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border ${vitals.temp && Number(vitals.temp) >= 100 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block font-bold">Temperature</span>
                        <span className="text-sm font-black text-slate-900">{vitals.temp ? `${vitals.temp}°F` : '—'}</span>
                        <span className="text-[9px] text-slate-400 block font-medium">{vitals.temp && Number(vitals.temp) >= 100 ? '⚠️ Fever' : 'Normal'}</span>
                      </div>

                      {vitals.respRate && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold">Respiration</span>
                          <span className="text-sm font-black text-slate-900">{vitals.respRate}/min</span>
                          <span className="text-[9px] text-slate-400 block font-medium">Breaths</span>
                        </div>
                      )}

                      {vitals.weight && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-bold">Weight</span>
                          <span className="text-sm font-black text-slate-900">{vitals.weight} kg</span>
                          <span className="text-[9px] text-slate-400 block font-medium">Body mass</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 italic text-xs border border-slate-100">
                      No numeric vitals were submitted for this referral encounter.
                    </div>
                  )}
                </div>

                {/* Chief Complaint / Symptoms */}
                <div className="pt-4 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Intake Symptoms & Notes</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedReferral.symptoms || 'No detailed symptoms specified.'}
                  </div>
                </div>

                {/* ASHA AI Clinical Assessment Note */}
                {(selectedReferral.ai_note || selectedReferral.clinical_summary) && (
                  <div className="pt-4 space-y-1.5">
                    <span className="text-[10px] text-purple-700 font-black uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      ASHA AI Clinical Assessment Note
                    </span>
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-950 font-semibold leading-relaxed">
                      {selectedReferral.ai_note || selectedReferral.clinical_summary}
                    </div>
                  </div>
                )}

                {/* Attached Medical Records / Scans */}
                {selectedReferral.attached_file_url && (
                  <div className="pt-4 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Attached Medical Record / Scan</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#008080]" />
                        <span className="text-xs font-bold text-slate-800 truncate">Patient Health Document / Scan</span>
                      </div>
                      <a
                        href={selectedReferral.attached_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span>View Scan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReferral(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                  >
                    Close Case
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedReferral.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleOpenTokenModal(selectedReferral)}
                      className="px-4 py-2 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Assign Token & Arrival Slot</span>
                    </button>
                  )}

                  {selectedReferral.status === 'Accepted' && (
                    <button
                      type="button"
                      onClick={() => handleMarkArrived(selectedReferral.id)}
                      className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Patient Arrived</span>
                    </button>
                  )}

                  {(selectedReferral.status === 'Arrived' || selectedReferral.status === 'Accepted') && (
                    <button
                      type="button"
                      onClick={() => setShowDoctorRouteModal(selectedReferral)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>{selectedReferral.doctor_assigned ? 'Reassign Doctor Desk' : 'Assign Doctor Desk'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── MODAL 2: ROUTE TO CLINICIAN ─── */}
      {showDoctorRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Route Patient to Doctor</h2>
                <p className="text-xs text-slate-500 mt-0.5">Assign clinician desk for {showDoctorRouteModal.patient_name}</p>
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
                    onClick={() => handleRouteToDoctor(showDoctorRouteModal.id, doc.name)}
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

      {/* ── ASSIGN OFFICIAL OPD TOKEN & ARRIVAL SLOT MODAL ── */}
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
                  <p className="text-[11px] text-teal-100 font-medium">PHC Shirwal Intake Desk · Staggered Queue Management</p>
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
                  Allocating spaced arrival times prevents 100+ patients crowding the morning OPD hallway at once.
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
                  Patient Counter Guidance
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
