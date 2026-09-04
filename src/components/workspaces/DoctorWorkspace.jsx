import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Inbox,
  ArrowRight,
  AlertTriangle,
  Search,
  Loader2,
  X,
  Trash2,
  Save,
  CheckCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  Stethoscope,
  Building2,
  Activity,
  Video,
  PhoneCall,
  PhoneOff,
  Pill,
  Clock,
  User,
  Sparkles
} from 'lucide-react';
import { supabase, ensureRoleAuth } from '../../services/supabase';
import { getPatientTimeline } from '../../services/patientService';
import {
  getWaitingTeleconsultSessions,
  doctorAcceptTeleconsult,
  doctorCompleteTeleconsult
} from '../../services/ashaService';



const DEMO_DOCTOR_PROFILE = {
  id: 'd3333333-3333-3333-3333-333333333333',
  name: 'Dr. Arvind Kulkarni',
  specialty: 'General Medicine',
  facility_id: 'f1111111-1111-1111-1111-111111111111',
  facility_name: 'Shrirampur Primary Health Centre'
};

const INITIAL_DEMO_REFERRALS = [
  {
    id: 'REF-DEMO-001',
    patient_id: 'pat-demo-1',
    patient_name: 'Rajesh Kumar',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_department: 'General Medicine',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'HIGH',
    priority_label: '🔴 Emergency / Immediate Attention',
    status: 'Arrived',
    symptoms: 'Severe chest tightness, radiating pain to left shoulder and jaw. Vitals recorded post-exertion.',
    vitals: { bp: '142/90', pulse: '88', spo2: '95', temp: '98.6', respRate: '20', weight: '68' },
    danger_signs: ['Crushing chest pain, pressure, or radiating pain to arm/jaw'],
    created_at: new Date().toISOString()
  },
  {
    id: 'REF-DEMO-002',
    patient_id: 'pat-demo-2',
    patient_name: 'Sunita Patil',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_department: 'General Medicine',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'ORANGE',
    priority_label: '🟡 Urgent / Within 24 Hours',
    status: 'Assigned',
    symptoms: 'Persistent headache, blood pressure elevation. Gestational age: 28 weeks.',
    vitals: { bp: '138/88', pulse: '84', spo2: '98', temp: '98.2', respRate: '18', weight: '72' },
    danger_signs: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'REF-DEMO-003',
    patient_id: 'pat-demo-3',
    patient_name: 'Amit Shinde',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Shrirampur Primary Health Centre',
    destination_department: 'General Medicine',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'GREEN',
    priority_label: '🟢 Routine / Local Care',
    status: 'Arrived',
    symptoms: 'Fever with dry cough for 3 days. Checked at frontline visit.',
    vitals: { bp: '118/76', pulse: '78', spo2: '99', temp: '99.4', respRate: '16', weight: '64' },
    danger_signs: [],
    created_at: new Date().toISOString()
  }
];

export default function DoctorWorkspace({
  isDemoMode = false,
  demoDataEnabled = true,
  onBack,
  goHome,
  onNavigateToPatientView: _onNavigateToPatientView
}) {
  const handleBack = onBack || goHome;

  const [activeTab, setActiveTab] = useState('home');
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeCase, setActiveCase] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);

  const [consultationMode, setConsultationMode] = useState('IN_PERSON');
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentAdvice, setTreatmentAdvice] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [followUpDate, setFollowUpDate] = useState('');

  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('Once daily');
  const [medDur, setMedDur] = useState('5 days');

  const [newInvest, setNewInvest] = useState('');

  const [hasConsent, setHasConsent] = useState(true);
  const [isBreakingGlass, setIsBreakingGlass] = useState(false);
  const [caseHistory, setCaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ─── Live Teleconsultation Desk State ───
  const [teleQueue, setTeleQueue] = useState([]);
  const [activeTeleSession, setActiveTeleSession] = useState(null);
  const [showTeleModal, setShowTeleModal] = useState(false);
  const [teleCallTimer, setTeleCallTimer] = useState(0);
  const [teleDiagnosis, setTeleDiagnosis] = useState('Acute Viral Febrile Illness');
  const [teleMedicines, setTeleMedicines] = useState([
    { name: 'Tab. Paracetamol 500mg', dosage: '1 tablet thrice daily after food (3 days)' },
    { name: 'Sachet ORS (Oral Rehydration)', dosage: '1 packet in 1 litre boiled cool water (daily)' },
    { name: 'Tab. Cetirizine 10mg', dosage: '1 tablet at bedtime if nasal congestion persists' }
  ]);
  const [teleAdvice, setTeleAdvice] = useState('Adequate oral hydration. Rest for 3 days. Return to PHC if fever persists.');
  const [teleSaving, setTeleSaving] = useState(false);
  const [isDoctorMuted, setIsDoctorMuted] = useState(false);
  const [isDoctorVideoOff, setIsDoctorVideoOff] = useState(false);
  const [quickMedName, setQuickMedName] = useState('');
  const [quickMedDosage, setQuickMedDosage] = useState('');

  // Call timer for active consultation
  useEffect(() => {
    let t = null;
    if (showTeleModal) {
      t = setInterval(() => setTeleCallTimer(prev => prev + 1), 1000);
    } else {
      setTeleCallTimer(0);
    }
    return () => clearInterval(t);
  }, [showTeleModal]);

  const getDraftKey = (refId) => `radvault_doctor_draft_${refId}`;

  const loadDoctorDbData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError('');

      if (isDemoMode) {
        setDoctorProfile(DEMO_DOCTOR_PROFILE);
        setReferrals(demoDataEnabled ? INITIAL_DEMO_REFERRALS : []);
        if (!isSilent) setLoading(false);
        return;
      }

      // Live Supabase Authentication
      await ensureRoleAuth('doctor');
      const { data: { user: activeUser } } = await supabase.auth.getUser();

      if (!activeUser) {
        throw new Error('Authentication failed for Doctor portal. Please check Supabase credentials.');
      }

      const { data: docData, error: docErr } = await supabase
        .from('doctors')
        .select('id, name, specialty, facility_id, facilities(name)')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      if (docErr) throw docErr;

      if (!docData) {
        throw new Error(`Doctor profile not found in database for authenticated user ${activeUser.email}.`);
      }

      const resolvedDoctor = {
        id: docData.id,
        name: docData.name,
        specialty: docData.specialty,
        facility_id: docData.facility_id,
        facility_name: docData.facilities?.name || 'Shrirampur Primary Health Centre'
      };

      setDoctorProfile(resolvedDoctor);

      const { data: refData, error: refErr } = await supabase
        .from('referrals')
        .select('*')
        .or(`destination_facility_id.eq.${resolvedDoctor.facility_id},doctor_assigned.eq.${resolvedDoctor.name},destination_hospital.ilike.%${(resolvedDoctor.facility_name || 'Shrirampur').split(' ')[0]}%`)
        .order('created_at', { ascending: false });

      if (refErr) throw refErr;

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
          console.warn('[RadVault Doctor] Could not join patient profiles:', pErr.message);
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
      console.error('[RadVault Doctor] Fetch error:', err.message);
      setError(`Unable to load queue and clinic data: ${err.message}`);
      setDoctorProfile(null);
      setReferrals([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [isDemoMode, demoDataEnabled]);

  const loadTeleQueue = useCallback(async () => {
    try {
      const { data } = await getWaitingTeleconsultSessions();
      setTeleQueue(data || []);
    } catch (err) {
      console.warn('[DoctorWorkspace] Failed to fetch teleconsult queue:', err);
    }
  }, []);

  useEffect(() => {
    loadDoctorDbData(false);
    loadTeleQueue();

    const channel = supabase.channel('doctor_referrals_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        loadDoctorDbData(true);
      })
      .subscribe();

    const teleChannel = supabase.channel('doctor_tele_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teleconsult_sessions' }, () => {
        loadTeleQueue();
      })
      .subscribe();

    const interval = setInterval(() => {
      loadDoctorDbData(true);
      loadTeleQueue();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(teleChannel);
      clearInterval(interval);
    };
  }, [loadDoctorDbData, loadTeleQueue]);

  const handleStartTeleconsult = async (session) => {
    try {
      const docName = doctorProfile?.name || 'Dr. Arvind Kulkarni (Medical Officer)';
      await doctorAcceptTeleconsult(session.id, docName);
      setActiveTeleSession({ ...session, doctor_name: docName });
      setTeleDiagnosis(session.chief_complaint?.includes('Fever') ? 'Acute Viral Febrile Illness' : 'General OPD Health Review');
      setShowTeleModal(true);
      showToast(`✓ Connected to ${session.patient_name} in Virtual OPD Room.`);
      loadTeleQueue();
    } catch (err) {
      setError(`Failed to connect teleconsult: ${err.message}`);
    }
  };

  const handleCompleteTeleconsult = async () => {
    if (!activeTeleSession) return;
    setTeleSaving(true);
    try {
      await doctorCompleteTeleconsult(activeTeleSession.id, {
        diagnosis: teleDiagnosis || 'Viral Illness and Upper Respiratory Review',
        rx_medicines: teleMedicines,
        doctor_advice: teleAdvice,
        session_duration_sec: teleCallTimer,
        care_request_id: activeTeleSession.care_request_id
      });
      setTeleSaving(false);
      setShowTeleModal(false);
      setActiveTeleSession(null);
      showToast('✓ Teleconsultation signed and official e-Prescription (Rx) dispatched to patient in real time.');
      loadTeleQueue();
      loadDoctorDbData(true);
    } catch (err) {
      setTeleSaving(false);
      setError(`Failed to complete teleconsultation: ${err.message}`);
    }
  };


  const handleSaveDraft = () => {
    if (!activeCase) return;
    const draftData = {
      clinicalAssessment,
      diagnosis,
      treatmentAdvice,
      prescriptions,
      investigations,
      followUpDate,
      consultationMode
    };
    localStorage.setItem(getDraftKey(activeCase.id), JSON.stringify(draftData));
    showToast('✓ Draft saved locally. Changes will persist across page refreshes.');
  };

  const handleLoadDraft = (refId) => {
    const raw = localStorage.getItem(getDraftKey(refId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setClinicalAssessment(parsed.clinicalAssessment || '');
        setDiagnosis(parsed.diagnosis || '');
        setTreatmentAdvice(parsed.treatmentAdvice || '');
        setPrescriptions(parsed.prescriptions || []);
        setInvestigations(parsed.investigations || []);
        setFollowUpDate(parsed.followUpDate || '');
        setConsultationMode(parsed.consultationMode || 'IN_PERSON');
      } catch (e) {
        console.warn('Unable to load consultation draft:', e);
      }
    } else {
      setClinicalAssessment('');
      setDiagnosis('');
      setTreatmentAdvice('');
      setPrescriptions([]);
      setInvestigations([]);
      setFollowUpDate('');
      setConsultationMode('IN_PERSON');
    }
  };

  const checkConsent = useCallback(async (patientId) => {
    if (!patientId || !doctorProfile?.id) {
      setHasConsent(true);
      setCaseHistory([]);
      return;
    }

    try {
      setHistoryLoading(true);
      const timeline = await getPatientTimeline(patientId);
      setCaseHistory((timeline || []).map(t => ({
        date: t.date,
        type: t.categoryLabel || t.title,
        clinical: t.category,
        diagnosis: t.summary,
        notes: t.details
      })));
      setHasConsent(true);
    } catch (err) {
      console.warn('Unable to verify patient consent status:', err.message);
      setHasConsent(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [doctorProfile]);

  const handleBreakGlass = async () => {
    if (!activeCase || !doctorProfile) return;
    try {
      setIsBreakingGlass(true);
      setHasConsent(true);
      showToast('🚨 Emergency Break-Glass override executed. Audit trace logged.');

      const timeline = await getPatientTimeline(activeCase.patient_id);
      setCaseHistory((timeline || []).map(t => ({
        date: t.date,
        type: t.categoryLabel || t.title,
        clinical: t.category,
        diagnosis: t.summary,
        notes: t.details
      })));
    } catch (err) {
      console.error('Failed to execute break glass override:', err.message);
    } finally {
      setIsBreakingGlass(false);
    }
  };

  const handleOpenCase = (ref) => {
    setActiveCase(ref);
    handleLoadDraft(ref.id);
    checkConsent(ref.patient_id);
  };

  const handleCloseCase = () => {
    setActiveCase(null);
    setShowSignModal(false);
  };

  const handleStartConsultation = async () => {
    if (!activeCase) return;
    try {
      const { error: err } = await supabase
        .from('referrals')
        .update({ status: 'In Consultation' })
        .eq('id', activeCase.id);

      if (err) throw err;

      setActiveCase(prev => ({ ...prev, status: 'In Consultation' }));
      setReferrals(prev => prev.map(r => r.id === activeCase.id ? { ...r, status: 'In Consultation' } : r));
      showToast('✓ Consultation started. Status updated to In Consultation.');
    } catch (err) {
      console.warn('Could not update status to In Consultation:', err.message);
      setActiveCase(prev => ({ ...prev, status: 'In Consultation' }));
    }
  };

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    const newMed = {
      id: `med-${Date.now()}`,
      name: medName.trim(),
      dose: medDose.trim() || 'As directed',
      freq: medFreq.trim() || 'Once daily',
      duration: medDur.trim() || '5 days'
    };
    setPrescriptions(prev => [...prev, newMed]);
    setMedName('');
    setMedDose('');
    setMedFreq('Once daily');
    setMedDur('5 days');
  };

  const handleRemoveMedicine = (id) => {
    setPrescriptions(prev => prev.filter(m => m.id !== id));
  };

  const handleAddInvestigation = () => {
    if (!newInvest.trim()) return;
    setInvestigations(prev => [...prev, newInvest.trim()]);
    setNewInvest('');
  };

  const handleRemoveInvestigation = (index) => {
    setInvestigations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignConsultation = async () => {
    if (!activeCase || !doctorProfile) return;

    const modeTag = consultationMode === 'TELECONSULTATION' ? '[Teleconsultation Signed]' : '[Hospital Visit Checked]';
    const rxSummary = prescriptions.length > 0
      ? `Rx: ${prescriptions.map(p => `${p.name} (${p.dose})`).join(', ')}`
      : 'No Rx prescribed';
    const formattedFollowUpReason = `${modeTag} Diagnosis: ${diagnosis || 'Consultation complete'}. Advice: ${treatmentAdvice || 'Review follow-up'}. ${rxSummary}`;

    try {
      const consultationPayload = {
        referral_id: activeCase.id,
        patient_id: activeCase.patient_id,
        doctor_id: doctorProfile.id,
        facility_id: doctorProfile.facility_id,
        clinical_assessment: `[${consultationMode === 'TELECONSULTATION' ? 'REMOTE TELECONSULTATION' : 'IN-PERSON VISIT'}] ${clinicalAssessment}`,
        diagnosis: diagnosis,
        treatment_advice: treatmentAdvice,
        prescriptions: prescriptions.map(p => ({ name: p.name, dose: p.dose, freq: p.freq, duration: p.duration })),
        investigations: investigations,
        follow_up_recommended_date: followUpDate || null
      };

      // Upsert consultation — surface any real errors
      const { error: consErr } = await supabase
        .from('consultations')
        .upsert([consultationPayload], { onConflict: 'referral_id' });

      if (consErr) throw consErr;

      // Mark referral as Completed
      const { error: refErr } = await supabase
        .from('referrals')
        .update({ status: 'Completed' })
        .eq('id', activeCase.id);

      if (refErr) throw refErr;

      // Sync care_request status to COMPLETED
      try {
        await supabase
          .from('care_requests')
          .update({
            status: 'COMPLETED',
            completed_at: new Date().toISOString()
          })
          .eq('patient_id', activeCase.patient_id);
      } catch (e) {
        console.warn('[RadVault Doctor] Care request sync skipped:', e.message);
      }

      setReferrals(prev => prev.map(r => r.id === activeCase.id ? { ...r, status: 'Completed' } : r));
      localStorage.removeItem(getDraftKey(activeCase.id));
      showToast(`✓ Consultation signed (${consultationMode === 'TELECONSULTATION' ? 'Teleconsultation' : 'In-Person'}). Follow-up note: "${formattedFollowUpReason.slice(0, 80)}..."`);
      handleCloseCase();

    } catch (err) {
      console.error('[RadVault Doctor] Signing error:', err.message);
      setError(`Failed to sign consultation: ${err.message}`);
      setShowSignModal(false);
    }
  };

  const counts = useMemo(() => {
    const waiting = referrals.filter(r => r.status === 'Arrived' || r.status === 'Accepted' || r.status === 'Assigned' || r.status === 'In Consultation').length;
    const completed = referrals.filter(r => r.status === 'Completed').length;
    const urgent = referrals.filter(r => (r.status !== 'Completed') && (r.priority === 'HIGH' || r.priority === 'RED')).length;
    return { waiting, completed, urgent };
  }, [referrals]);

  const filteredReferrals = useMemo(() => {
    let list = [...referrals];

    list.sort((a, b) => {
      const pA = a.priority === 'HIGH' || a.priority === 'RED' ? 3 : a.priority === 'ORANGE' ? 2 : 1;
      const pB = b.priority === 'HIGH' || b.priority === 'RED' ? 3 : b.priority === 'ORANGE' ? 2 : 1;
      return pB - pA;
    });

    if (activeTab === 'cases') {
      if (queueFilter === 'Active') {
        list = list.filter(r => r.status === 'Arrived' || r.status === 'Accepted' || r.status === 'Assigned' || r.status === 'In Consultation');
      } else if (queueFilter === 'Completed') {
        list = list.filter(r => r.status === 'Completed');
      }
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(r => 
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.patient_id || '').toLowerCase().includes(q) ||
        (r.symptoms || '').toLowerCase().includes(q) ||
        (r.doctor_assigned || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [referrals, activeTab, queueFilter, searchQuery]);

  const nextPatient = useMemo(() => {
    return referrals
      .filter(r => r.status === 'Arrived' || r.status === 'Assigned' || r.status === 'In Consultation')
      .sort((a, b) => {
        const pA = a.priority === 'HIGH' || a.priority === 'RED' ? 3 : a.priority === 'ORANGE' ? 2 : 1;
        const pB = b.priority === 'HIGH' || b.priority === 'RED' ? 3 : b.priority === 'ORANGE' ? 2 : 1;
        return pB - pA;
      })[0] || null;
  }, [referrals]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#800000]" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Clinical Specialist Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFCFB] pb-16 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {handleBack && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Return to Portal Selection"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Portals</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FDF2F2] border border-[#800000]/30 flex items-center justify-center text-[#800000] font-black text-sm">
                🩺
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 tracking-tight">RadVault Specialist</span>
                <span className="text-[10px] text-slate-400 block font-bold leading-none">Clinical Doctor Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-black text-slate-900">{doctorProfile?.name || 'Dr. Arvind Kulkarni'}</span>
              <span className="text-[10px] font-bold text-[#800000]">{doctorProfile?.facility_name || 'Shrirampur PHC'}</span>
            </div>
            <button
              onClick={loadDoctorDbData}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Refresh Clinical Queue"
            >
              <RefreshCw className="w-4 h-4 text-[#800000]" />
            </button>
          </div>
        </div>
      </header>

      {successMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <span>{successMsg}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
        {!activeCase ? (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#FDF2F2] border border-[#800000]/30 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  🩺
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-black text-slate-900">
                      Welcome, {doctorProfile?.name || 'Dr. Arvind Kulkarni'}
                    </h1>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Active Duty
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-2 flex-wrap">
                    <span>📍 {doctorProfile?.facility_name || 'Shrirampur Primary Health Centre'}</span>
                    <span>·</span>
                    <span className="text-[#800000]">{doctorProfile?.specialty || 'General Medicine'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                  className="px-4 py-2 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Inbox className="w-4 h-4" />
                  <span>Assigned Cases ({counts.waiting})</span>
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
                  onClick={loadDoctorDbData}
                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live Incoming Teleconsult Alert Banner */}
            {teleQueue.length > 0 && (
              <div className="p-4 bg-teal-50 border-2 border-[#008F83] rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#008F83] text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black bg-[#008F83] text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                        ● LIVE VIRTUAL CALL INCOMING
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {teleQueue[0].patient_name}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {teleQueue[0].token || 'eS-SHIR-248'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mt-1">
                      Reported Concern: <span className="font-bold text-slate-900">{teleQueue[0].chief_complaint || 'General Checkup'}</span> · Live Vitals Linked
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartTeleconsult(teleQueue[0])}
                  className="px-5 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Connect Video Call</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
              {[
                { key: 'home', label: 'Home Overview' },
                { key: 'cases', label: `Assigned Queue (${counts.waiting})` },
                { key: 'teleconsult', label: `📹 Virtual Tele-OPD (${teleQueue.length})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 font-black border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'home' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                    className="p-5 bg-white border border-slate-200 hover:border-[#800000]/60 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned / Waiting</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{counts.waiting}</span>
                      <span className="text-xs text-slate-400 font-bold">Patients in Queue</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                    className="p-5 bg-white border border-slate-200 hover:border-rose-400 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Emergency & Red Priority</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-rose-700">{counts.urgent}</span>
                      <span className="text-xs text-rose-600 font-bold">Immediate Attention</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('cases'); setQueueFilter('Completed'); }}
                    className="p-5 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Signed Consultations</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-700">{counts.completed}</span>
                      <span className="text-xs text-emerald-600 font-bold">Finished</span>
                    </div>
                  </div>
                </div>

                {nextPatient ? (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-black tracking-wider bg-[#800000] text-rose-100 px-2.5 py-0.5 rounded-full border border-[#800000]/50 animate-pulse">
                          ⚡ Immediate Case Ready
                        </span>
                        <span className="text-xs font-bold text-slate-400">Status: {nextPatient.status}</span>
                      </div>
                      <h3 className="text-xl font-black">{nextPatient.patient_name}</h3>
                      <p className="text-xs text-slate-300 font-medium max-w-xl line-clamp-2">
                        <strong>Complaint:</strong> {nextPatient.symptoms || 'Clinical referral from ASHA worker.'}
                      </p>
                      {nextPatient.vitals && (
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 pt-1">
                          {nextPatient.vitals.bp && <span>BP: <strong className="text-white">{nextPatient.vitals.bp}</strong></span>}
                          {nextPatient.vitals.pulse && <span>HR: <strong className="text-white">{nextPatient.vitals.pulse} bpm</strong></span>}
                          {nextPatient.vitals.spo2 && <span>SpO2: <strong className="text-white">{nextPatient.vitals.spo2}%</strong></span>}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenCase(nextPatient)}
                      className="px-6 py-3 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Open Clinical Case</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-400 font-medium">
                    ✓ All assigned patients have been attended. No urgent cases waiting.
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Assigned Patient Cases</h2>
                    <span className="text-[11px] font-bold text-slate-400">{referrals.length} total referrals</span>
                  </div>

                  {referrals.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {referrals.slice(0, 6).map(ref => {
                        const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                        const isUrgent = ref.priority === 'ORANGE';
                        const labelClass = isHigh ? 'bg-rose-50 text-rose-800 border-rose-200' : isUrgent ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                        return (
                          <div key={ref.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900">{ref.patient_name}</span>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                                  {ref.patient_id ? String(ref.patient_id).slice(0, 8).toUpperCase() : 'PAT-ID'}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${labelClass}`}>
                                  {ref.priority_label || ref.priority}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                {ref.destination_department} · Status: <strong>{ref.status}</strong> · Doctor: {ref.doctor_assigned || 'On-Duty Specialist'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {ref.status !== 'Completed' ? (
                                <button
                                  onClick={() => handleOpenCase(ref)}
                                  className="px-4 py-1.5 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Open Case</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Consultation Signed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium">No patient cases found in queue.</div>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'cases' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    {[
                      { key: 'ALL', label: 'All Cases' },
                      { key: 'Active', label: `Active Queue (${counts.waiting})` },
                      { key: 'Completed', label: `Completed (${counts.completed})` }
                    ].map(btn => (
                      <button
                        key={btn.key}
                        onClick={() => setQueueFilter(btn.key)}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shrink-0 transition-colors cursor-pointer ${
                          queueFilter === btn.key
                            ? 'bg-[#800000] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative shrink-0 w-full sm:w-[260px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by patient, ID, doctor..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#800000]"
                    />
                  </div>
                </div>

                {filteredReferrals.length > 0 ? (
                  <div className="space-y-3">
                    {filteredReferrals.map(ref => {
                      const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                      const isUrgent = ref.priority === 'ORANGE';
                      const labelClass = isHigh ? 'bg-rose-50 text-rose-800 border-rose-200' : isUrgent ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      const isWaiting = ref.status === 'Arrived' || ref.status === 'Accepted' || ref.status === 'Assigned' || ref.status === 'In Consultation';

                      return (
                        <div
                          key={ref.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-slate-900">{ref.patient_name}</span>
                              <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-bold">
                                {ref.patient_id ? String(ref.patient_id).slice(0, 8).toUpperCase() : 'PAT-ID'}
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${labelClass}`}>
                                {ref.priority_label || ref.priority}
                              </span>
                              {ref.doctor_assigned && (
                                <span className="text-[10px] font-bold text-[#800000] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#800000]/20">
                                  🩺 {ref.doctor_assigned}
                                </span>
                              )}
                            </div>

                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${
                              ref.status === 'In Consultation'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                                : isWaiting
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              ● {ref.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            <strong className="text-slate-700">Complaint:</strong> {ref.symptoms}
                          </p>

                          {ref.vitals && Object.keys(ref.vitals).length > 0 && (
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 flex-wrap">
                              {ref.vitals.bp && <span>BP: <strong>{ref.vitals.bp}</strong></span>}
                              {ref.vitals.pulse && <span>Pulse: <strong>{ref.vitals.pulse} bpm</strong></span>}
                              {ref.vitals.spo2 && <span>SpO2: <strong>{ref.vitals.spo2}%</strong></span>}
                              {ref.vitals.temp && <span>Temp: <strong>{ref.vitals.temp}°F</strong></span>}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-[10px] text-slate-400 font-semibold">
                              Referred on {new Date(ref.created_at).toLocaleDateString('en-IN')} by {ref.created_by || 'ASHA'}
                            </div>

                            {ref.status !== 'Completed' ? (
                              <button
                                onClick={() => handleOpenCase(ref)}
                                className="px-4 py-2 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl transition-colors cursor-pointer ml-auto flex items-center gap-1.5"
                              >
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Open Clinical Case</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 flex items-center gap-1 ml-auto">
                                <CheckCircle className="w-3.5 h-3.5" /> Consultation Signed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">No cases matching queue filters</p>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'teleconsult' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#008F83]" />
                      <span>Virtual Tele-OPD Queue (eSanjeevani Network)</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Remote patients connected from villages awaiting on-duty doctor video consultation
                    </p>
                  </div>
                  <button
                    onClick={loadTeleQueue}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Queue</span>
                  </button>
                </div>

                {teleQueue.length > 0 ? (
                  <div className="space-y-3">
                    {teleQueue.map(item => (
                      <div
                        key={item.id}
                        className="bg-white border-2 border-[#008F83]/30 rounded-3xl p-5 shadow-xs hover:border-[#008F83] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              {item.session_status === 'IN_CALL' ? 'In Active Call' : 'In Virtual Waiting Room'}
                            </span>
                            <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {item.token || 'eS-SHIR-248'}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-900">{item.patient_name}</h4>
                          
                          <p className="text-xs text-slate-600 font-semibold">
                            Reported Concern: <span className="font-bold text-slate-800">{item.chief_complaint || 'General Checkup'}</span>
                          </p>

                          {item.vitals_snapshot && (
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 pt-1">
                              <span>BP: <b className="text-slate-800">{item.vitals_snapshot.bp_systolic ? `${item.vitals_snapshot.bp_systolic}/${item.vitals_snapshot.bp_diastolic || 80}` : '120/80'}</b></span>
                              <span>·</span>
                              <span>SpO2: <b className="text-slate-800">{item.vitals_snapshot.spo2_pct || 98}%</b></span>
                              <span>·</span>
                              <span>Pulse: <b className="text-slate-800">{item.vitals_snapshot.pulse_bpm || 76} bpm</b></span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartTeleconsult(item)}
                          className="px-5 py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>{item.session_status === 'IN_CALL' ? 'Re-Join Call' : 'Connect Video Call'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <Video className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">No patients waiting in Virtual OPD</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      When a patient initiates a teleconsultation from their Care Hub, they will appear here live in real-time.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] uppercase font-black tracking-wider bg-[#800000] text-rose-100 px-2.5 py-0.5 rounded">
                    Clinical Examination Mode
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">Case ID: {activeCase.id}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                    activeCase.status === 'In Consultation'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    ● {activeCase.status}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1.5">{activeCase.patient_name}</h2>
                <p className="text-xs text-[#800000] font-bold mt-0.5">
                  {activeCase.destination_department} Specialist Consultation · Assigned: {activeCase.doctor_assigned || doctorProfile?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeCase.status !== 'In Consultation' && activeCase.status !== 'Completed' && (
                  <button
                    onClick={handleStartConsultation}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Start Consultation</span>
                  </button>
                )}
                <button
                  onClick={handleCloseCase}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Close Case"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs flex items-center justify-between text-[11px] font-black text-slate-500 overflow-x-auto gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                <span>ASHA Triage</span>
              </div>
              <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                <span>Staff Accepted & Assigned</span>
              </div>
              <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
              <div className="flex items-center gap-2 shrink-0 text-slate-900">
                <span className="w-5 h-5 rounded-full bg-[#800000] text-white flex items-center justify-center text-[10px] animate-pulse">3</span>
                <span>Doctor Consultation</span>
              </div>
              <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
              <div className="flex items-center gap-2 shrink-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  activeCase.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {activeCase.status === 'Completed' ? '✓' : '4'}
                </span>
                <span>Follow-Up Closed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Triage Context & Observations</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Risk Priority</span>
                      <span className="text-rose-800 font-extrabold">{activeCase.priority_label || activeCase.priority}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Referred By</span>
                      <span className="text-slate-900">{activeCase.created_by || 'ASHA Frontline'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Primary Symptoms / Notes</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {activeCase.symptoms || 'No primary symptom description provided.'}
                    </p>
                  </div>

                  {activeCase.ai_note && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-700 block font-bold uppercase">✨ AI Triage Clinical Assessment</span>
                      <p className="text-xs text-indigo-900 bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl leading-relaxed font-medium">
                        {activeCase.ai_note}
                      </p>
                    </div>
                  )}

                  {activeCase.vitals && Object.keys(activeCase.vitals).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Frontline Vitals</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-extrabold text-slate-700 bg-slate-50 p-2.5 border border-slate-100 rounded-2xl">
                        {activeCase.vitals.bp && <div>BP: <span className="text-slate-900 font-black">{activeCase.vitals.bp}</span></div>}
                        {activeCase.vitals.pulse && <div>HR: <span className="text-slate-900 font-black">{activeCase.vitals.pulse} bpm</span></div>}
                        {activeCase.vitals.spo2 && <div>SpO2: <span className="text-slate-900 font-black">{activeCase.vitals.spo2}%</span></div>}
                        {activeCase.vitals.temp && <div>Temp: <span className="text-slate-900 font-black">{activeCase.vitals.temp}°F</span></div>}
                      </div>
                    </div>
                  )}

                  {activeCase.danger_signs && activeCase.danger_signs.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-rose-600 block font-black uppercase">⚠️ Danger Signs Flagged</span>
                      <p className="text-xs text-rose-800 bg-rose-50 border border-rose-100 p-3 rounded-2xl leading-relaxed font-bold">
                        {activeCase.danger_signs.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Patient Health Records History</h3>
                  
                  {historyLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#800000]" />
                      <span>Loading longitudinal health timeline...</span>
                    </div>
                  ) : !hasConsent ? (
                    <div className="border border-red-200 bg-red-50/50 rounded-2xl p-4 text-center space-y-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600 font-bold text-sm">🔒</div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Beneficiary Consent Required</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          Access to past medical history and records is restricted under ABHA data privacy standards.
                        </p>
                      </div>
                      <button
                        onClick={handleBreakGlass}
                        disabled={isBreakingGlass}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        {isBreakingGlass ? 'Logging trace...' : '🚨 Break-Glass / Emergency Access'}
                      </button>
                    </div>
                  ) : caseHistory && caseHistory.length > 0 ? (
                    <div className="space-y-3">
                      {caseHistory.slice(0, 5).map((hist, i) => (
                        <div key={i} className="text-xs font-medium text-slate-600 border border-slate-100 p-3 rounded-2xl bg-slate-50/60 space-y-1">
                          <div className="flex items-center justify-between font-extrabold">
                            <span className="text-slate-800">{hist.type}</span>
                            <span className="text-[10px] text-slate-400">{hist.date}</span>
                          </div>
                          {hist.diagnosis && (
                            <div><strong className="text-slate-700">Summary:</strong> {hist.diagnosis}</div>
                          )}
                          {hist.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">"{hist.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No previous health history records recorded for this beneficiary.
                    </div>
                  )}
                </div>

              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Clinical Examination & Consultation</h3>
                    <span className="text-[10px] font-bold text-slate-400">Step 3 of 4 in Continuity Care</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                          Care Delivery Mode
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">In-Person or Tele-Consult</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setConsultationMode('IN_PERSON')}
                          className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            consultationMode === 'IN_PERSON'
                              ? 'bg-white border-[#800000] text-[#800000] shadow-xs'
                              : 'bg-slate-100/70 border-transparent text-slate-500 hover:bg-white'
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                          <span>In-Person Checkup</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConsultationMode('TELECONSULTATION')}
                          className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            consultationMode === 'TELECONSULTATION'
                              ? 'bg-white border-[#800000] text-[#800000] shadow-xs'
                              : 'bg-slate-100/70 border-transparent text-slate-500 hover:bg-white'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                          <span>Remote Tele-Advice</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                        Clinical Assessment & Physical Exam Findings
                      </label>
                      <textarea
                        rows={3}
                        value={clinicalAssessment}
                        onChange={(e) => setClinicalAssessment(e.target.value)}
                        placeholder="e.g. Chest clear on auscultation, regular heart sounds S1S2 present, no pedal edema, abdominal examination soft non-tender..."
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-white outline-none focus:border-[#800000] leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                        Clinical Diagnosis <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Upper Respiratory Tract Infection / Mild Bronchitis"
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 bg-white outline-none focus:border-[#800000]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                        Treatment Plan & Advice <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={treatmentAdvice}
                        onChange={(e) => setTreatmentAdvice(e.target.value)}
                        placeholder="e.g. Adequate hydration, warm saline gargles, steam inhalation, rest for 3 days. Return immediately if high fever or breathlessness occurs."
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-white outline-none focus:border-[#800000] leading-relaxed"
                      />
                    </div>

                    <div className="space-y-3 bg-slate-50/60 p-4 border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                          Prescription / Medicines (Rx)
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Added: {prescriptions.length}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          className="sm:col-span-2 border border-slate-200 rounded-lg p-2 text-xs font-bold bg-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Dose (e.g. 500mg)"
                          value={medDose}
                          onChange={(e) => setMedDose(e.target.value)}
                          className="border border-slate-200 rounded-lg p-2 text-xs font-bold bg-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddMedicine}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg text-xs py-2 cursor-pointer transition-colors"
                        >
                          + Add Rx
                        </button>
                      </div>

                      {prescriptions.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {prescriptions.map((m) => (
                            <div key={m.id} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                              <span>💊 {m.name} — {m.dose} ({m.freq}, {m.duration})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicine(m.id)}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 bg-slate-50/60 p-4 border border-slate-200 rounded-2xl">
                      <label className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                        Diagnostic Investigations & Tests
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 12-Lead ECG, Complete Blood Count, Chest X-Ray..."
                          value={newInvest}
                          onChange={(e) => setNewInvest(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInvestigation(); } }}
                          className="flex-1 border border-slate-200 rounded-lg p-2 text-xs font-bold bg-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddInvestigation}
                          className="px-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {investigations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {investigations.map((inv, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700">
                              <span>🔬 {inv}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvestigation(idx)}
                                className="text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 bg-slate-50/60 p-4 border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-[#800000] tracking-wide block">
                          Frontline ASHA Follow-Up Loop
                        </label>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Doctor recommends · ASHA visits
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Recommended Date</span>
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 font-bold bg-white outline-none"
                          />
                        </div>
                        <div className="flex items-center text-[11px] text-slate-500 font-medium leading-relaxed">
                          Follow-up checklist triggers automatically in target ASHA worker dashboard for in-person verification.
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="px-4 py-2.5 text-xs font-black text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-slate-400" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!diagnosis.trim() || !treatmentAdvice.trim()) {
                          setError('A clinical diagnosis and treatment advice are required to sign.');
                          setTimeout(() => setError(''), 4000);
                          return;
                        }
                        setShowSignModal(true);
                      }}
                      className="px-6 py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Sign Consultation</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {showSignModal && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Sign & Finalize Clinical Summary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please review before writing to patient records registry.</p>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold text-slate-700 space-y-2.5">
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Diagnosed Case</span>
                <span className="text-slate-900 font-extrabold">{diagnosis}</span>
              </div>

              <div className="pt-2.5">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Treatment Plan</span>
                <span className="text-slate-900 leading-relaxed block font-medium">{treatmentAdvice}</span>
              </div>

              {prescriptions.length > 0 && (
                <div className="pt-2.5">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Prescribed Medicines</span>
                  <div className="space-y-0.5 font-extrabold text-[11px] text-slate-900">
                    {prescriptions.map(m => (
                      <div key={m.id}>· {m.name} ({m.dose} / {m.freq} / {m.duration})</div>
                    ))}
                  </div>
                </div>
              )}

              {investigations.length > 0 && (
                <div className="pt-2.5">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Required Investigations</span>
                  <span className="text-slate-900">{investigations.join(', ')}</span>
                </div>
              )}

              {followUpDate && (
                <div className="pt-2.5">
                  <span className="text-[10px] text-[#800000] block font-black uppercase">ASHA Home Visit Follow-up</span>
                  <span className="text-slate-900">Scheduled for {new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleSignConsultation}
                className="px-5 py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Sign & Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE DOCTOR TELECONSULTATION CONSOLE ── */}
      {showTeleModal && activeTeleSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#16324F] to-[#008F83] px-6 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Video className="w-4 h-4 text-teal-200" />
                </div>
                <div>
                  <h3 className="text-xs font-black flex items-center gap-1.5">
                    Live Tele-OPD Consultation Desk
                    <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse">
                      ● IN CALL
                    </span>
                  </h3>
                  <p className="text-[10px] text-teal-100">
                    Patient: {activeTeleSession.patient_name} · Token: {activeTeleSession.token || 'eS-SHIR-248'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-black/40 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{Math.floor(teleCallTimer / 60)}:{(teleCallTimer % 60).toString().padStart(2, '0')}</span>
                </div>
                <button
                  onClick={() => setShowTeleModal(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-800 flex-1">
              {/* Video Screen Simulation */}
              <div className="relative w-full h-44 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                <div className="text-center text-white space-y-1">
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-teal-400 mx-auto flex items-center justify-center text-2xl shadow-lg">
                    👤
                  </div>
                  <p className="font-extrabold text-xs text-white">{activeTeleSession.patient_name}</p>
                  <p className="text-[10px] text-teal-300">Connected from Village Home (Mobile)</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-2.5 bg-teal-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-4 bg-teal-400 rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-3 bg-teal-400 rounded-full animate-pulse delay-150" />
                  </div>
                </div>

                <div className="absolute top-2 right-2 w-16 h-20 bg-slate-800 border border-white/20 rounded-lg overflow-hidden flex flex-col items-center justify-center text-white shadow-md">
                  <span className="text-lg">{isDoctorVideoOff ? "🚫" : "👨‍⚕️"}</span>
                  <span className="text-[8px] font-bold mt-0.5 text-slate-300">You (Doctor)</span>
                </div>

                <div className="absolute bottom-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDoctorMuted(!isDoctorMuted)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDoctorMuted ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {isDoctorMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDoctorVideoOff(!isDoctorVideoOff)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDoctorVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {isDoctorVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Vitals Snapshot & Reported Symptoms */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Patient Vitals & Complaint</span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ABHA Linked</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] text-slate-400 font-bold">BP</p>
                    <p className="font-black text-slate-800">{activeTeleSession.vitals_snapshot?.bp_systolic ? `${activeTeleSession.vitals_snapshot.bp_systolic}/${activeTeleSession.vitals_snapshot.bp_diastolic || 80}` : '120/80'}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] text-slate-400 font-bold">Pulse</p>
                    <p className="font-black text-slate-800">{activeTeleSession.vitals_snapshot?.pulse_bpm || 76} bpm</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] text-slate-400 font-bold">SpO2</p>
                    <p className="font-black text-slate-800">{activeTeleSession.vitals_snapshot?.spo2_pct || 98}%</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] text-slate-400 font-bold">Temp</p>
                    <p className="font-black text-slate-800">98.6°F</p>
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-medium text-amber-950">
                  <span className="font-bold text-amber-900">Reported Concern: </span>
                  {activeTeleSession.chief_complaint || 'General medical review requested'}
                </div>
              </div>

              {/* Diagnosis Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Clinical Diagnosis (Written to Patient Health Record)
                </label>
                <input
                  type="text"
                  value={teleDiagnosis}
                  onChange={e => setTeleDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Viral Febrile Illness"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:border-[#008F83]"
                />
              </div>

              {/* Fast Prescribe Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Prescribe Medicines (1-Click Fast Rural Formulations)
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Tab. Paracetamol 500mg', dosage: '1 tablet thrice daily after food (3 days)' },
                    { name: 'Sachet ORS (Oral Rehydration)', dosage: '1 packet in 1 litre boiled cool water (daily)' },
                    { name: 'Tab. Cetirizine 10mg', dosage: '1 tablet at bedtime' },
                    { name: 'Cap. Amoxicillin 500mg', dosage: '1 capsule thrice daily (5 days)' },
                    { name: 'Tab. Pantoprazole 40mg', dosage: '1 tablet empty stomach in morning' }
                  ].map((med, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!teleMedicines.some(m => m.name === med.name)) {
                          setTeleMedicines(prev => [...prev, med]);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#E8F7F3] hover:text-[#008F83] border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      + {med.name.split(' ')[1] || med.name}
                    </button>
                  ))}
                </div>

                {/* Prescribed list */}
                <div className="space-y-1.5 pt-1">
                  {teleMedicines.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900">{m.name}</span>
                        <span className="text-slate-500 text-[11px] ml-2">{m.dosage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTeleMedicines(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Doctor's Instructions & Follow-up
                </label>
                <textarea
                  rows={2}
                  value={teleAdvice}
                  onChange={e => setTeleAdvice(e.target.value)}
                  placeholder="Clinical advice..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-[#008F83]"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTeleModal(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close Window
              </button>

              <button
                type="button"
                disabled={teleSaving}
                onClick={handleCompleteTeleconsult}
                className="px-6 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {teleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Sign & Issue e-Prescription (Rx)</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
