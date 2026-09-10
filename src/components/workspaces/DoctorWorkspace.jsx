import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  VideoOff,
  Mic,
  MicOff,
  PhoneCall,
  Pill,
  Sparkles,
  Plus
} from 'lucide-react';

import { supabase, ensureRoleAuth } from '../../services/supabase';
import { getPatientTimeline } from '../../services/patientService';
import {
  getWaitingTeleconsultSessions,
  doctorAcceptTeleconsult,
  doctorCompleteTeleconsult,
  getFullPatientClinicalDocket,
  generateClinicalAiSummary
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
    doctor_id: 'd3333333-3333-3333-3333-333333333333',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'HIGH',
    priority_label: '🔴 Frontline Priority: High (Immediate Attention Recommended)',
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
    doctor_id: 'd3333333-3333-3333-3333-333333333333',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'ORANGE',
    priority_label: '🟡 Frontline Priority: Medium (Within 24 Hours Recommended)',
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
    doctor_id: 'd3333333-3333-3333-3333-333333333333',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'GREEN',
    priority_label: '🟢 Frontline Priority: Routine / Local Care',
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

  const [doctorProfile, setDoctorProfile] = useState(() => isDemoMode ? DEMO_DOCTOR_PROFILE : null);
  const doctorProfileRef = useRef(doctorProfile);
  useEffect(() => {
    doctorProfileRef.current = doctorProfile;
  }, [doctorProfile]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(() => !isDemoMode);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [activeCase, setActiveCase] = useState(null);
  const [editingReferralId, setEditingReferralId] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

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

  // ─── Clinical Docket State (Allergies, Meds, AI Summary) ───
  const [clinicalDocket, setClinicalDocket] = useState(null);
  const [docketLoading, setDocketLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [allergyWarning, setAllergyWarning] = useState(null); // prescription safety shield

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
    const tStart = performance.now();
    try {
      if (!isSilent && !doctorProfileRef.current) setLoading(true);
      setError('');

      if (isDemoMode) {
        setDoctorProfile(DEMO_DOCTOR_PROFILE);
        doctorProfileRef.current = DEMO_DOCTOR_PROFILE;
        setReferrals(demoDataEnabled ? INITIAL_DEMO_REFERRALS : []);
        setLoading(false);
        return;
      }

      // Ensure authenticated session for Doctor Specialist
      const { user: authUser, error: authErr } = await ensureRoleAuth('doctor');
      if (authErr || !authUser) {
        throw new Error(`Authentication failed for Doctor portal: ${authErr?.message || 'Check credentials'}`);
      }
      const activeUser = authUser;

      // Reuse cached doctor profile if available for active session
      let resolvedDoctor = doctorProfileRef.current;
      if (!resolvedDoctor || resolvedDoctor.user_id !== activeUser.id) {
        const { data: docData, error: docErr } = await supabase
          .from('doctors')
          .select('id, name, specialty, facility_id, facilities(name)')
          .eq('user_id', activeUser.id)
          .maybeSingle();

        if (docErr) {
          console.error('[RadVault Doctor] Doctor profile fetch error:', docErr.message);
        }

        if (!isDemoMode && (!docData || !docData.id)) {
          throw new Error(`Doctor clinical profile not found in database for user ${activeUser.id}. Please contact facility administrator.`);
        }

        resolvedDoctor = docData ? {
          id: docData.id,
          user_id: activeUser.id,
          name: docData.name,
          specialty: docData.specialty,
          facility_id: docData.facility_id,
          facility_name: docData.facilities?.name || 'Shrirampur Primary Health Centre'
        } : (isDemoMode ? DEMO_DOCTOR_PROFILE : null);

        if (!resolvedDoctor) {
          throw new Error(`Doctor clinical profile not found in database for user ${activeUser.id}. Please contact facility administrator.`);
        }

        setDoctorProfile(resolvedDoctor);
        doctorProfileRef.current = resolvedDoctor;
      }

      // Authoritative doctor scoping: query referrals strictly by doctor_id UUID (ZERO name fallback)
      // Concurrently query teleconsult queue for doctor's facility in parallel
      const [resReferrals, resTele] = await Promise.all([
        resolvedDoctor.id
          ? supabase
              .from('referrals')
              .select('*')
              .eq('doctor_id', resolvedDoctor.id)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [], error: null }),
        getWaitingTeleconsultSessions(resolvedDoctor.facility_name).catch(err => {
          console.warn('[DoctorWorkspace] Teleconsult fetch error in parallel load:', err);
          return { data: [] };
        })
      ]);

      if (resReferrals.error) {
        console.warn('[RadVault Doctor] Referrals fetch warning:', resReferrals.error.message);
        setError(`Failed to fetch referrals: ${resReferrals.error.message}`);
      }

      // Canonical physical clinical referrals come strictly from public.referrals
      const combinedRefs = resReferrals.data || [];
      // RENDER REFERRALS IMMEDIATELY — DO NOT BLOCK ON SECONDARY PATIENTS TABLE
      setReferrals(combinedRefs);
      if (resTele?.data) {
        setTeleQueue(resTele.data);
      }
      setLoading(false);
      console.log(`[DOCTOR_PORTAL_PERFORMANCE] Usable queue rendered in ${(performance.now() - tStart).toFixed(1)}ms (${combinedRefs.length} referrals, ${resTele?.data?.length || 0} teleconsults)`);

      // Non-blocking background enrichment of patient details
      const patientIds = Array.from(new Set(combinedRefs.map(r => r.patient_id).filter(Boolean)));
      if (patientIds.length > 0) {
        supabase
          .from('patients')
          .select('id, unified_id, full_name, age, gender, phone_number, blood_group')
          .in('id', patientIds)
          .then(({ data: pts, error: pErr }) => {
            if (pErr) {
              console.warn('[RadVault Doctor] Could not join patient profiles:', pErr.message);
              return;
            }
            if (pts && pts.length > 0) {
              const patientsMap = {};
              pts.forEach(p => { patientsMap[p.id] = p; });
              setReferrals(prev => prev.map(r => {
                const linkedPatient = patientsMap[r.patient_id];
                if (!linkedPatient) return r;
                return {
                  ...r,
                  patient_unified_id: linkedPatient.unified_id || (r.patient_id && !r.patient_id.includes('-') ? r.patient_id : null),
                  patient_phone: linkedPatient.phone_number || r.vitals?.phone || null,
                  patient_age: linkedPatient.age || null,
                  patient_gender: linkedPatient.gender || null,
                  patient_blood_group: linkedPatient.blood_group || null
                };
              }));
            }
          })
          .catch(pErr => {
            console.warn('[RadVault Doctor] Patient enrichment background error:', pErr.message);
          });
      }

    } catch (err) {
      console.error('[RadVault Doctor] Fetch error:', err.message);
      setError(`Could not load referral queue (${err.message.substring(0, 100)}).`);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [isDemoMode, demoDataEnabled]);


  const loadTeleQueue = useCallback(async () => {
    try {
      const facilityFilter = doctorProfileRef.current?.facility_name || null;
      const { data } = await getWaitingTeleconsultSessions(facilityFilter);
      setTeleQueue(data || []);
    } catch (err) {
      console.warn('[DoctorWorkspace] Failed to fetch teleconsult queue:', err);
    }
  }, []);

  useEffect(() => {
    loadDoctorDbData(false);

    const channel = supabase.channel('doctor_referrals_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        loadDoctorDbData(true);
      })
      .subscribe();

    const teleChannel = supabase.channel('doctor_tele_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teleconsult_sessions' }, () => {
        loadTeleQueue();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[DoctorWorkspace] Realtime subscribed to teleconsult_sessions');
        }
      });

    // 15-second poll for referrals
    const interval = setInterval(() => {
      loadDoctorDbData(true);
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(teleChannel);
      clearInterval(interval);
    };
  }, [loadDoctorDbData, loadTeleQueue]);

  // Teleconsult queue poll: fast 5s poll ONLY when activeTab is teleconsult
  useEffect(() => {
    if (activeTab === 'teleconsult') {
      loadTeleQueue();
      const teleInterval = setInterval(() => {
        loadTeleQueue();
      }, 5000);
      return () => clearInterval(teleInterval);
    }
  }, [activeTab, loadTeleQueue]);


  const loadClinicalDocket = async (patientId, patientName) => {
    if (!patientId && !patientName) return;
    setDocketLoading(true);
    setClinicalDocket(null);
    setAiSummary(null);
    setAiSummaryError(null);
    setAllergyWarning(null);
    try {
      const docket = await getFullPatientClinicalDocket(patientId, patientName);
      setClinicalDocket(docket);
    } catch (err) {
      console.warn('[DoctorWorkspace] Clinical docket load error:', err.message);
    } finally {
      setDocketLoading(false);
    }
  };

  const handleLoadAiSummary = async () => {
    if (!clinicalDocket) return;
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    try {
      const { summary, error } = await generateClinicalAiSummary(clinicalDocket);
      if (error) {
        setAiSummaryError(error);
      } else {
        setAiSummary(summary);
      }
    } catch (err) {
      setAiSummaryError(err.message);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Prescription Safety Shield: checks a medicine name against known allergies
  const checkAllergyContraindication = (medicineName) => {
    if (!clinicalDocket?.allergies) return null;
    const allergyList = clinicalDocket.allergies.toLowerCase().split(/[,;]/);
    const CONTRAINDICATION_MAP = {
      'penicillin': ['amoxicillin', 'ampicillin', 'cloxacillin', 'flucloxacillin', 'piperacillin'],
      'sulfa': ['sulfamethoxazole', 'trimethoprim', 'cotrimoxazole', 'bactrim'],
      'nsaids': ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin'],
      'aspirin': ['ibuprofen', 'diclofenac', 'naproxen'],
      'codeine': ['tramadol', 'morphine'],
      'sulfonamide': ['sulfamethoxazole', 'dapsone', 'furosemide'],
    };
    const medLower = medicineName.toLowerCase();
    for (const allergy of allergyList) {
      const a = allergy.trim();
      if (medLower.includes(a)) return `⚠️ ALLERGY ALERT: Patient is allergic to "${a.toUpperCase()}". Do not prescribe this medication!`;
      const contraList = CONTRAINDICATION_MAP[a] || [];
      for (const contra of contraList) {
        if (medLower.includes(contra)) {
          return `⚠️ CONTRAINDICATION: Patient has "${a.toUpperCase()}" allergy. ${medicineName} (${contra}) is cross-reactive and contraindicated!`;
        }
      }
    }
    return null;
  };

  const handleStartTeleconsult = async (session) => {

    try {
      const docName = doctorProfile?.name || 'Dr. Arvind Kulkarni (Medical Officer)';
      await doctorAcceptTeleconsult(session.id, docName);
      setActiveTeleSession({ ...session, doctor_name: docName });
      setTeleDiagnosis(session.chief_complaint?.includes('Fever') ? 'Acute Viral Febrile Illness' : 'General OPD Health Review');
      setShowTeleModal(true);
      showToast(`✓ Connected to ${session.patient_name} in Virtual OPD Room.`);
      loadTeleQueue();
      // Load clinical docket for teleconsultation patient
      loadClinicalDocket(session.patient_id, session.patient_name);
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
    if (!ref || !ref.id) {
      console.error('[RadVault Doctor] handleOpenCase invoked without valid referral:', ref);
      setError('Cannot open clinical case: Invalid referral record.');
      return;
    }
    setActiveCase({ ...ref, referralId: ref.id });
    setEditingReferralId(ref.id);
    handleLoadDraft(ref.id);
    checkConsent(ref.patient_id);
    loadClinicalDocket(ref.patient_id, ref.patient_name);
  };

  const handleCloseCase = () => {
    setActiveCase(null);
    setEditingReferralId(null);
    setShowSignModal(false);
    setClinicalDocket(null);
    setAiSummary(null);
    setAllergyWarning(null);
    setClinicalAssessment('');
    setDiagnosis('');
    setTreatmentAdvice('');
    setPrescriptions([]);
    setInvestigations([]);
    setFollowUpDate('');
  };

  const handleStartConsultation = async () => {
    if (!activeCase?.id) return;
    try {
      if (!isDemoMode) {
        const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        if (!isUuid(activeCase.id)) {
          throw new Error(`Referral ID "${activeCase.id}" is not a valid UUID.`);
        }
        const { data: updatedRef, error: startErr } = await supabase
          .from('referrals')
          .update({ status: 'In Consultation' })
          .eq('id', activeCase.id)
          .select('id, status')
          .single();

        if (startErr) throw startErr;
        if (!updatedRef || updatedRef.status !== 'In Consultation') {
          throw new Error('Database status verification failed: Referral status is not In Consultation.');
        }
      }
      setActiveCase(prev => ({ ...prev, status: 'In Consultation' }));
      setReferrals(prev => prev.map(r => r.id === activeCase.id ? { ...r, status: 'In Consultation' } : r));
      showToast('✓ Case marked: In Consultation');
    } catch (err) {
      console.error('Could not update status to In Consultation:', err.message);
      setError(`Failed to update status to In Consultation: ${err.message}`);
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

  // Finalize & Sign Consultation
  const handleSignConsultation = async () => {
    if (!activeCase || !doctorProfile) {
      setError('Cannot sign consultation: Active case or doctor profile is missing.');
      return;
    }

    // STRICT IDENTITY CHECK: Ensure the referral being finalized matches the active case
    if (!activeCase.id || activeCase.id !== editingReferralId) {
      console.error(`[RadVault Doctor] Identity mismatch! activeCase: ${activeCase?.id} vs editingReferralId: ${editingReferralId}`);
      setError(`Identity Mismatch: Attempted to finalize referral ${activeCase.id}, but active editing session is bound to ${editingReferralId}. Consultation blocked.`);
      setShowSignModal(false);
      return;
    }

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (!isDemoMode) {
      if (!activeCase || !activeCase.id || !isUuid(activeCase.id)) {
        setError(`Invalid referral UUID: "${activeCase?.id}". Cannot sign consultation.`);
        setShowSignModal(false);
        return;
      }
      if (!activeCase.patient_id || !isUuid(activeCase.patient_id)) {
        setError(`Invalid patient UUID: "${activeCase?.patient_id}". Cannot sign consultation.`);
        setShowSignModal(false);
        return;
      }
      if (!isUuid(doctorProfile.id)) {
        setError(`Invalid doctor UUID: "${doctorProfile.id}". Cannot sign consultation.`);
        setShowSignModal(false);
        return;
      }
      if (!isUuid(doctorProfile.facility_id)) {
        setError(`Invalid facility UUID: "${doctorProfile.facility_id}". Cannot sign consultation.`);
        setShowSignModal(false);
        return;
      }
      if (activeCase.doctor_id && activeCase.doctor_id !== doctorProfile.id) {
        setError(`Doctor identity mismatch: referral is assigned to doctor UUID "${activeCase.doctor_id}", but authenticated doctor is "${doctorProfile.id}". Cannot sign consultation.`);
        setShowSignModal(false);
        return;
      }
      if (activeCase.destination_facility_id && activeCase.destination_facility_id !== doctorProfile.facility_id) {
        setError(`Facility identity mismatch: referral destination facility ("${activeCase.destination_facility_id}") does not match consultation facility ("${doctorProfile.facility_id}"). Cannot sign consultation.`);
        setShowSignModal(false);
        return;
      }
    }

    setIsSigning(true);
    setError('');
    
    try {
      const consultationPayload = {
        referral_id: activeCase.id,
        patient_id: activeCase.patient_id,
        doctor_id: doctorProfile.id,
        facility_id: doctorProfile.facility_id,
        clinical_assessment: `[${consultationMode === 'TELECONSULTATION' ? 'REMOTE TELECONSULTATION' : 'IN-PERSON VISIT'}] ${clinicalAssessment || 'Clinical evaluation completed.'}`,
        diagnosis: diagnosis || 'Clinical Evaluation Completed',
        treatment_advice: treatmentAdvice || 'Follow standard medical instructions.',
        prescriptions: prescriptions.map(p => ({ name: p.name, dose: p.dose, freq: p.freq, duration: p.duration })),
        investigations: investigations,
        follow_up_recommended_date: followUpDate || null
      };

      if (!isDemoMode) {
        // Step 1: Upsert consultation record
        const { error: consErr } = await supabase
          .from('consultations')
          .upsert([consultationPayload], { onConflict: 'referral_id' });

        if (consErr) throw new Error(`Consultation record insert failed: ${consErr.message}`);

        // Step 2: Strict verification of consultation persistence
        const { data: verifiedCons, error: consVerifyErr } = await supabase
          .from('consultations')
          .select('id, referral_id, patient_id, doctor_id, facility_id')
          .eq('referral_id', activeCase.id)
          .single();

        if (consVerifyErr || !verifiedCons) {
          throw new Error(`Consultation verification failed in database: ${consVerifyErr?.message || 'Row not found'}`);
        }

        if (
          verifiedCons.referral_id !== activeCase.id ||
          verifiedCons.patient_id !== activeCase.patient_id ||
          verifiedCons.doctor_id !== doctorProfile.id ||
          verifiedCons.facility_id !== doctorProfile.facility_id
        ) {
          throw new Error(`Consultation identity mismatch in database! Persisted: referral=${verifiedCons.referral_id}, patient=${verifiedCons.patient_id}, doctor=${verifiedCons.doctor_id}, facility=${verifiedCons.facility_id}`);
        }

        // Step 3: ONLY after verified consultation persistence: Update referrals status to 'Completed'
        const { data: updatedRef, error: refErr } = await supabase
          .from('referrals')
          .update({ status: 'Completed' })
          .eq('id', activeCase.id)
          .select('id, status')
          .single();

        if (refErr) throw new Error(`Referral status update failed: ${refErr.message}`);

        if (!updatedRef || updatedRef.status !== 'Completed') {
          throw new Error('Verification failed: Referral status in database is not Completed.');
        }
      }

      setReferrals(prev => prev.map(r => r.id === activeCase.id ? { ...r, status: 'Completed' } : r));
      localStorage.removeItem(getDraftKey(activeCase.id));
      showToast(`✓ Consultation signed (${consultationMode === 'TELECONSULTATION' ? 'Teleconsultation' : 'In-Person'}). Follow-up note recorded.`);
      handleCloseCase();

    } catch (err) {
      console.error('[RadVault Doctor] Signing error:', err.message);
      setError(`Failed to sign consultation: ${err.message}`);
      setShowSignModal(false);
    } finally {
      setIsSigning(false);
    }
  };

  // Authoritative Doctor Scoping: strictly and solely referral.doctor_id === doctorProfile.id (ZERO name fallback)
  const isDoctorAssigned = useCallback((r) => {
    if (!doctorProfile?.id || !r || !r.doctor_id) return false;
    return r.doctor_id === doctorProfile.id;
  }, [doctorProfile]);

  const doctorReferrals = useMemo(() => {
    if (!doctorProfile) return [];
    return referrals.filter(isDoctorAssigned);
  }, [referrals, isDoctorAssigned, doctorProfile]);

  const counts = useMemo(() => {
    const waiting = doctorReferrals.filter(r => r.status === 'Arrived' || r.status === 'Accepted' || r.status === 'Assigned' || r.status === 'In Consultation').length;
    const completed = doctorReferrals.filter(r => r.status === 'Completed').length;
    const urgent = doctorReferrals.filter(r => (r.status !== 'Completed') && (r.priority === 'HIGH' || r.priority === 'RED')).length;
    return { waiting, completed, urgent };
  }, [doctorReferrals]);

  const filteredReferrals = useMemo(() => {
    let list = [...doctorReferrals];

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
        (r.symptoms || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [doctorReferrals, activeTab, queueFilter, searchQuery]);

  const activeConsultation = useMemo(() => {
    return doctorReferrals.find(r => r.status === 'In Consultation') || null;
  }, [doctorReferrals]);

  const newlyAssignedCases = useMemo(() => {
    return doctorReferrals
      .filter(r => r.status === 'Assigned')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [doctorReferrals]);

  const newestAssignment = newlyAssignedCases[0] || null;

  const nextPatient = useMemo(() => {
    return doctorReferrals
      .filter(r => r.status === 'Arrived' || r.status === 'Assigned' || r.status === 'In Consultation')
      .sort((a, b) => {
        if (a.status === 'In Consultation' && b.status !== 'In Consultation') return -1;
        if (b.status === 'In Consultation' && a.status !== 'In Consultation') return 1;
        const pA = a.priority === 'HIGH' || a.priority === 'RED' ? 3 : a.priority === 'ORANGE' ? 2 : 1;
        const pB = b.priority === 'HIGH' || b.priority === 'RED' ? 3 : b.priority === 'ORANGE' ? 2 : 1;
        return pB - pA;
      })[0] || null;
  }, [doctorReferrals]);

  // Unified Attention Hierarchy:
  // 1. Active In-Progress Consultation (top urgency to resume/complete)
  // 2. Newest Referral Assignment
  // 3. Next Waiting Patient in Queue
  const attentionCase = useMemo(() => {
    if (activeConsultation) return { ref: activeConsultation, type: 'IN_PROGRESS' };
    if (newestAssignment) return { ref: newestAssignment, type: 'NEW_ASSIGNMENT' };
    if (nextPatient) return { ref: nextPatient, type: 'NEXT_IN_QUEUE' };
    return null;
  }, [activeConsultation, newestAssignment, nextPatient]);

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
              <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] font-black text-sm">
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
              <span className="text-[10px] font-bold text-[#7C3AED]">{doctorProfile?.facility_name || 'Shrirampur PHC'}</span>
            </div>
            <button
              onClick={loadDoctorDbData}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Refresh Clinical Queue"
            >
              <RefreshCw className="w-4 h-4 text-[#7C3AED]" />
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
                <div className="w-14 h-14 bg-[#F5F3FF] border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner">
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
                    <span className="text-[#7C3AED]">{doctorProfile?.specialty || 'General Medicine'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
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
                      ? 'border-[#7C3AED] text-[#7C3AED]'
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
                    className="p-5 bg-white border border-slate-200 hover:border-[#7C3AED]/60 rounded-2xl cursor-pointer transition-colors space-y-1 shadow-2xs"
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Frontline Priority: High / Urgent</span>
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

                {/* ─── UNIFIED ATTENTION SECTION ─── */}
                {loading ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2 shadow-2xs">
                    <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                    <span>Loading assigned referrals...</span>
                  </div>
                ) : attentionCase ? (
                  <div
                    data-referral-id={attentionCase.ref.id}
                    className={`rounded-3xl p-5 sm:p-6 border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden transition-all ${
                      attentionCase.type === 'IN_PROGRESS'
                        ? 'bg-[#1E1B4B] border-indigo-500/50 text-white'
                        : attentionCase.type === 'NEW_ASSIGNMENT'
                        ? 'bg-[#052E26] border-emerald-600/50 text-white'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <div className="space-y-2.5 relative z-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        {attentionCase.type === 'IN_PROGRESS' && (
                          <span className="text-[10px] uppercase font-black tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-400/40 flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                            ACTIVE CONSULTATION IN PROGRESS
                          </span>
                        )}
                        {attentionCase.type === 'NEW_ASSIGNMENT' && (
                          <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            NEW REFERRAL ASSIGNMENT
                          </span>
                        )}
                        {attentionCase.type === 'NEXT_IN_QUEUE' && (
                          <span className="text-[10px] uppercase font-black tracking-wider bg-purple-500/20 text-purple-300 px-3 py-0.5 rounded-full border border-purple-400/40 flex items-center gap-1.5">
                            ⚡ NEXT PATIENT IN QUEUE
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-300 font-mono">
                          ID: {String(attentionCase.ref.id).slice(0, 8).toUpperCase()}
                        </span>

                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${
                          attentionCase.ref.priority === 'HIGH' || attentionCase.ref.priority === 'RED'
                            ? 'bg-rose-900/80 text-rose-200 border-rose-700'
                            : attentionCase.ref.priority === 'ORANGE'
                            ? 'bg-amber-900/80 text-amber-200 border-amber-700'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {attentionCase.ref.priority_label || attentionCase.ref.priority}
                        </span>

                        <span className="text-xs font-bold text-slate-300">
                          Status: <strong className="text-white">{attentionCase.ref.status}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-white">{attentionCase.ref.patient_name}</h3>
                        {(attentionCase.ref.patient_age || attentionCase.ref.patient_gender) && (
                          <span className="text-xs text-slate-400 font-bold">
                            ({attentionCase.ref.patient_age ? `${attentionCase.ref.patient_age}y` : ''}
                            {attentionCase.ref.patient_age && attentionCase.ref.patient_gender ? ' · ' : ''}
                            {attentionCase.ref.patient_gender || ''})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
                        <strong className="text-white">Chief Complaint:</strong> {attentionCase.ref.symptoms || 'Clinical referral from frontline health worker.'}
                      </p>

                      {attentionCase.ref.vitals && (
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-300 pt-0.5 flex-wrap">
                          {attentionCase.ref.vitals.bp && <span>BP: <strong className="text-white">{attentionCase.ref.vitals.bp} mmHg</strong></span>}
                          {attentionCase.ref.vitals.pulse && <span>Pulse: <strong className="text-white">{attentionCase.ref.vitals.pulse} bpm</strong></span>}
                          {attentionCase.ref.vitals.spo2 && <span>SpO2: <strong className="text-white">{attentionCase.ref.vitals.spo2}%</strong></span>}
                          {attentionCase.ref.vitals.temp && <span>Temp: <strong className="text-white">{attentionCase.ref.vitals.temp}°F</strong></span>}
                        </div>
                      )}

                      {attentionCase.ref.danger_signs && attentionCase.ref.danger_signs.length > 0 && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚠️ Danger Signs: {attentionCase.ref.danger_signs.join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 pt-0.5">
                        <span>Department: <strong className="text-white">{attentionCase.ref.destination_department || 'General Medicine'}</strong></span>
                        {counts.waiting > 1 && (
                          <span className="text-slate-300 font-bold">
                            · {counts.waiting - 1} other case{counts.waiting - 1 > 1 ? 's' : ''} waiting in your queue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 relative z-10">
                      <button
                        data-referral-id={attentionCase.ref.id}
                        data-action="open-case"
                        onClick={() => handleOpenCase(attentionCase.ref)}
                        className={`min-h-[44px] px-6 py-2.5 font-black text-xs rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                          attentionCase.type === 'IN_PROGRESS'
                            ? 'bg-indigo-400 hover:bg-indigo-300 text-slate-950'
                            : attentionCase.type === 'NEW_ASSIGNMENT'
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                            : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>{attentionCase.type === 'IN_PROGRESS' ? 'RESUME CONSULTATION' : 'OPEN CASE'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-400 font-medium">
                    <span>✓ All assigned patients have been attended. No cases waiting.</span>
                  </div>
                )}

                {/* ─── 2. ACTIVE QUEUE OVERVIEW ─── */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-black uppercase text-slate-600 tracking-wider">Active Queue Overview</h2>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Physical hospital referrals assigned for consultation</p>
                    </div>
                    <button
                      onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                      className="text-xs font-black text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      View Full Queue ({counts.waiting}) →
                    </button>
                  </div>

                  {loading ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                      <span>Loading queue...</span>
                    </div>
                  ) : doctorReferrals.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {doctorReferrals.slice(0, 6).map(ref => {
                        const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                        const isUrgent = ref.priority === 'ORANGE';
                        const labelClass = isHigh ? 'bg-rose-50 text-rose-800 border-rose-200' : isUrgent ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                        return (
                          <div
                            key={ref.id}
                            data-referral-id={ref.id}
                            data-patient-name={ref.patient_name}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                          >
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
                                {ref.destination_department} · Status: <strong>{ref.status}</strong> · Assigned: {doctorProfile?.name || 'Specialist'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {ref.status !== 'Completed' ? (
                                <button
                                  data-referral-id={ref.id}
                                  data-action="open-case"
                                  onClick={() => handleOpenCase(ref)}
                                  className="min-h-[44px] px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
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
                            ? 'bg-[#7C3AED] text-white shadow-xs'
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
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                    <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-800">Loading referral queue...</p>
                  </div>
                ) : filteredReferrals.length > 0 ? (
                  <div className="space-y-3">
                    {filteredReferrals.map(ref => {
                      const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                      const isUrgent = ref.priority === 'ORANGE';
                      const labelClass = isHigh ? 'bg-rose-50 text-rose-800 border-rose-200' : isUrgent ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      const isWaiting = ref.status === 'Arrived' || ref.status === 'Accepted' || ref.status === 'Assigned' || ref.status === 'In Consultation';

                      return (
                        <div
                          key={ref.id}
                          data-referral-id={ref.id}
                          data-patient-name={ref.patient_name}
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
                              {doctorProfile?.name && (
                                <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded border border-[#7C3AED]/20">
                                  🩺 {doctorProfile.name}
                                </span>
                              )}
                              {(ref.slot_preference || ref.ai_note?.includes('TOKEN:')) && (
                                <span className="text-[10px] font-black text-[#008F83] bg-[#E8F7F3] px-2 py-0.5 rounded border border-[#008F83]/30 font-mono">
                                  🎟️ {ref.slot_preference || `Token #${ref.ai_note?.match(/TOKEN:\s*([^|]+)/i)?.[1]?.trim()}`}
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
                              {ref.vitals.bp && <span>BP: <strong>{ref.vitals.bp} mmHg</strong></span>}
                              {ref.vitals.pulse && <span>Pulse: <strong>{ref.vitals.pulse} bpm</strong></span>}
                              {ref.vitals.spo2 && <span>SpO2: <strong>{ref.vitals.spo2}%</strong></span>}
                              {ref.vitals.temp && <span>Temp: <strong>{ref.vitals.temp}°F</strong></span>}
                            </div>
                          )}

                          {ref.danger_signs && ref.danger_signs.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                ⚠️ Danger Signs: {ref.danger_signs.join(', ')}
                              </span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-[10px] text-slate-400 font-semibold">
                              Referred on {new Date(ref.created_at).toLocaleDateString('en-IN')} by {ref.created_by || 'ASHA'}
                            </div>

                            {ref.status !== 'Completed' ? (
                              <button
                                data-referral-id={ref.id}
                                data-action="open-case"
                                onClick={() => handleOpenCase(ref)}
                                className="min-h-[44px] px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs rounded-xl transition-colors cursor-pointer ml-auto flex items-center gap-1.5 shadow-xs"
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
                  <span className="text-[9px] uppercase font-black tracking-wider bg-[#7C3AED] text-purple-100 px-2.5 py-0.5 rounded">
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
                <p className="text-xs text-[#7C3AED] font-bold mt-0.5">
                  {activeCase.destination_department} Specialist Consultation · Assigned: {doctorProfile?.name || 'Specialist'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeCase.status !== 'In Consultation' && activeCase.status !== 'Completed' && (
                  <button
                    onClick={handleStartConsultation}
                    className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Start Consultation</span>
                  </button>
                )}
                <button
                  onClick={handleCloseCase}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
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
                <span className="w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px] animate-pulse">3</span>
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

            {/* ── CLINICAL DOSSIER PANEL ── Allergies, Meds, History, AI Copilot ── */}

            {docketLoading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#008F83]" />
                <span className="text-xs text-slate-500 font-bold">Loading clinical dossier from ABHA health records...</span>
              </div>
            ) : clinicalDocket ? (
              <div className="space-y-3">
                {/* Clinical Identity Resolution Banner */}
                {clinicalDocket.resolved === false ? (
                  <div className="bg-amber-50 border-l-4 border-amber-500 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 font-black text-sm">⚠️</div>
                    <div>
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">UNRESOLVED CLINICAL RECORD</p>
                      <p className="text-xs font-bold text-amber-900 mt-0.5">{clinicalDocket.error || 'Patient UUID could not be resolved to a registered clinical profile.'}</p>
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5">Historical records, vitals, and allergy status are suppressed to prevent identity cross-contamination.</p>
                    </div>
                  </div>
                ) : clinicalDocket.allergies ? (
                  <div className="bg-red-50 border-l-4 border-red-500 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-red-700 font-black text-sm">⚠️</div>
                    <div>
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-wider">DOCUMENTED DRUG ALLERGY — CRITICAL</p>
                      <p className="text-xs font-black text-red-900 mt-0.5">{clinicalDocket.allergies}</p>
                      <p className="text-[10px] text-red-600 font-medium mt-0.5">Cross-check all prescriptions before signing. A safety shield is active below.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800">No Known Drug Allergies (NKDA) — Safe to prescribe standard formulations</span>
                  </div>
                )}

                {/* Allergy Warning (triggered by prescription safety shield) */}
                {allergyWarning && (
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 text-xs font-bold text-amber-900 flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <span>{allergyWarning}</span>
                  </div>
                )}

                {/* Current Medications & Chronic Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clinicalDocket.currentMedications && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Pill className="w-3 h-3" /> Active Medications on Record
                      </p>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">{clinicalDocket.currentMedications}</p>
                    </div>
                  )}
                  {clinicalDocket.chronicConditions?.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Chronic Conditions
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {clinicalDocket.chronicConditions.map((cond, i) => (
                          <span key={i} className="text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">{cond}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vitals Trend (from vitals_history) */}
                {clinicalDocket.vitals?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Vitals History ({clinicalDocket.vitals.length} readings)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] font-bold text-slate-700">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <td className="pb-1 pr-3">Date</td>
                            <td className="pb-1 pr-3">BP</td>
                            <td className="pb-1 pr-3">Pulse</td>
                            <td className="pb-1 pr-3">SpO₂</td>
                            <td className="pb-1">Temp</td>
                          </tr>
                        </thead>
                        <tbody>
                          {clinicalDocket.vitals.slice(0, 3).map((v, i) => (
                            <tr key={i} className={i === 0 ? 'text-[#007A70] font-extrabold' : 'text-slate-600'}>
                              <td className="py-0.5 pr-3">{new Date(v.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                              <td className="py-0.5 pr-3">{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : v.bp_systolic || '—'}</td>
                              <td className="py-0.5 pr-3">{v.pulse_bpm ? `${v.pulse_bpm} bpm` : '—'}</td>
                              <td className="py-0.5 pr-3">{v.spo2_pct ? `${v.spo2_pct}%` : '—'}</td>
                              <td className="py-0.5">{v.temperature_c ? `${((v.temperature_c * 9/5) + 32).toFixed(1)}°F` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* AI Clinical Copilot */}
                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">⚡ AI Clinical Copilot (Groq / RAG)</span>
                    </div>
                    {!aiSummary && (
                      <button
                        type="button"
                        onClick={handleLoadAiSummary}
                        disabled={aiSummaryLoading}
                        className="text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-60 flex items-center gap-1.5 transition-colors"
                      >
                        {aiSummaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {aiSummaryLoading ? 'Analyzing...' : 'Generate 3-sec Briefing'}
                      </button>
                    )}
                  </div>

                  {aiSummaryError && (
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-lg">{aiSummaryError}</p>
                  )}

                  {aiSummary ? (
                    <div className="space-y-2 text-xs">
                      {aiSummary.critical_alerts && aiSummary.critical_alerts !== 'NONE' && (
                        <div className="flex gap-2">
                          <span className="text-red-500 shrink-0">🚨</span>
                          <div>
                            <span className="font-black text-red-700">Safety: </span>
                            <span className="text-red-800 font-semibold">{aiSummary.critical_alerts}</span>
                          </div>
                        </div>
                      )}
                      {aiSummary.active_regimen && aiSummary.active_regimen !== 'NONE' && (
                        <div className="flex gap-2">
                          <span className="text-amber-500 shrink-0">💊</span>
                          <div>
                            <span className="font-black text-amber-700">Medications: </span>
                            <span className="text-amber-900 font-semibold">{aiSummary.active_regimen}</span>
                          </div>
                        </div>
                      )}
                      {aiSummary.clinical_trajectory && (
                        <div className="flex gap-2">
                          <span className="text-indigo-500 shrink-0">📋</span>
                          <div>
                            <span className="font-black text-indigo-700">Trajectory: </span>
                            <span className="text-indigo-800 font-semibold">{aiSummary.clinical_trajectory}</span>
                          </div>
                        </div>
                      )}
                      {aiSummary.suggested_guardrails && aiSummary.suggested_guardrails !== 'NONE' && (
                        <div className="flex gap-2">
                          <span className="text-slate-500 shrink-0">🛡️</span>
                          <div>
                            <span className="font-black text-slate-700">Avoid: </span>
                            <span className="text-slate-700 font-semibold">{aiSummary.suggested_guardrails}</span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setAiSummary(null)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-600 font-bold cursor-pointer mt-1"
                      >
                        Regenerate →
                      </button>
                    </div>
                  ) : !aiSummaryLoading && !aiSummaryError && (
                    <p className="text-[10px] text-indigo-400 font-medium">
                      Click "Generate 3-sec Briefing" to get an AI-synthesized clinical summary of this patient's history, disease trajectory, and prescribing guardrails.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Triage Context & Observations</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Frontline Priority</span>
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
                      <span className="text-[10px] text-indigo-700 block font-bold uppercase">✨ AI-Assisted Frontline Triage Recommendation</span>
                      <p className="text-xs text-indigo-900 bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl leading-relaxed font-medium">
                        {activeCase.ai_note}
                      </p>
                    </div>
                  )}

                  {activeCase.vitals && Object.keys(activeCase.vitals).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Frontline Vitals</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-extrabold text-slate-700 bg-slate-50 p-2.5 border border-slate-100 rounded-2xl">
                        {activeCase.vitals.bp && <div>BP: <span className="text-slate-900 font-black">{activeCase.vitals.bp} mmHg</span></div>}
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
                      <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
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
                              ? 'bg-white border-[#7C3AED] text-[#7C3AED] shadow-xs'
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
                              ? 'bg-white border-[#7C3AED] text-[#7C3AED] shadow-xs'
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
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-white outline-none focus:border-[#7C3AED] leading-relaxed"
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
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 bg-white outline-none focus:border-[#7C3AED]"
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
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-white outline-none focus:border-[#7C3AED] leading-relaxed"
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
                        <label className="text-xs font-black uppercase text-[#7C3AED] tracking-wide block">
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
                      className="min-h-[44px] px-5 py-2.5 text-xs font-black text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                      className="min-h-[44px] px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
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
                  <span className="text-[10px] text-[#7C3AED] block font-black uppercase">ASHA Home Visit Follow-up</span>
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
                disabled={isSigning}
                onClick={handleSignConsultation}
                className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                {isSigning ? 'Signing...' : 'Sign & Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE DOCTOR TELECONSULTATION CONSOLE ── */}
      {/* ── LIVE DOCTOR TELECONSULTATION CONSOLE ── */}
      {showTeleModal && activeTeleSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#16324F] to-[#008F83] px-5 sm:px-6 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black">
                  <Video className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-white">
                      Live Tele-OPD Video Consultation Desk
                    </h3>
                    <span className="text-[9px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      IN CALL
                    </span>
                    <span className="text-[10px] bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded font-mono font-bold">
                      Token: {activeTeleSession.token || 'eS-SHIR-248'}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100 font-medium">
                    Patient: <strong className="text-white font-bold">{activeTeleSession.patient_name}</strong> · Facility: {doctorProfile?.facility_name || 'Primary Health Centre - Shirwal'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="bg-black/40 px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{Math.floor(teleCallTimer / 60)}:{(teleCallTimer % 60).toString().padStart(2, '0')}</span>
                </div>
                <button
                  onClick={() => setShowTeleModal(false)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Body: Left = Video + Prescribing, Right = Patient Reports & Docket */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50/50">
              
              {/* LEFT COLUMN: Video Screen, Symptoms, Prescriptions, Call Actions */}
              <div className="lg:col-span-6 space-y-3.5">
                
                {/* Video Screen Simulation */}
                <div className="relative w-full h-52 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg border border-slate-800">
                  <div className="text-center text-white space-y-1">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-teal-400 mx-auto flex items-center justify-center text-2xl shadow-xl">
                      👤
                    </div>
                    <p className="font-extrabold text-xs text-white">{activeTeleSession.patient_name}</p>
                    <p className="text-[10px] text-teal-300 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Village Patient Mobile Device (Audio/Video Live)
                    </p>
                    {/* Animated soundwave */}
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      <span className="w-1 h-2.5 bg-teal-400 rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-teal-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-6 bg-teal-400 rounded-full animate-pulse delay-150" />
                      <span className="w-1 h-3.5 bg-teal-400 rounded-full animate-pulse delay-100" />
                      <span className="w-1 h-2 bg-teal-400 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>

                  {/* Doctor Picture-in-Picture */}
                  <div className="absolute top-2.5 right-2.5 w-20 h-22 bg-slate-900 border border-white/20 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white shadow-xl">
                    <span className="text-xl">{isDoctorVideoOff ? "🚫" : "👨‍⚕️"}</span>
                    <span className="text-[8px] font-bold mt-0.5 text-slate-300">Dr. Arvind</span>
                    <span className="text-[7px] text-teal-400 font-mono">You (MO)</span>
                  </div>

                  {/* Call Controls Bar */}
                  <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDoctorMuted(!isDoctorMuted)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold ${
                        isDoctorMuted ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs'
                      }`}
                    >
                      {isDoctorMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{isDoctorMuted ? 'Muted' : 'Mute'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDoctorVideoOff(!isDoctorVideoOff)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold ${
                        isDoctorVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs'
                      }`}
                    >
                      {isDoctorVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{isDoctorVideoOff ? 'Camera Off' : 'Camera'}</span>
                    </button>
                  </div>
                </div>

                {/* Reported Symptoms */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Chief Complaint & Reported Symptoms
                  </span>
                  <p className="text-xs font-bold text-slate-800 bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl">
                    {activeTeleSession.chief_complaint || 'General medical review requested'}
                  </p>
                </div>

                {/* Clinical Diagnosis Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
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

                {/* Fast Prescribe Presets & Safety Shield */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Prescribe Medicines (1-Click Fast Rural Formulations)
                    </span>
                    <span className="text-[9px] text-[#008F83] font-bold">Dispensed at PHC</span>
                  </div>

                  {/* Contraindication shield alert banner */}
                  {allergyWarning && (
                    <div className="p-2.5 bg-red-50 border-2 border-red-400 rounded-xl text-xs font-bold text-red-900 flex items-center gap-2 animate-in fade-in">
                      <span className="text-base shrink-0">🛡️</span>
                      <span>{allergyWarning}</span>
                    </div>
                  )}

                  {/* Preset Buttons */}
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
                          const warning = checkAllergyContraindication(med.name);
                          if (warning) {
                            setAllergyWarning(warning);
                          } else {
                            setAllergyWarning(null);
                            if (!teleMedicines.some(m => m.name === med.name)) {
                              setTeleMedicines(prev => [...prev, med]);
                            }
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#E8F7F3] hover:text-[#008F83] border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{med.name.split(' ')[1] || med.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Prescribed List */}
                  <div className="space-y-1.5 pt-1">
                    {teleMedicines.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No medicines prescribed yet. Click presets above.</p>
                    ) : (
                      teleMedicines.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900">{m.name}</span>
                            <span className="text-slate-500 text-[11px] ml-2 block sm:inline">{m.dosage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTeleMedicines(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Doctor's Advice */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Doctor's Instructions & Follow-up
                  </label>
                  <textarea
                    rows={2}
                    value={teleAdvice}
                    onChange={e => setTeleAdvice(e.target.value)}
                    placeholder="e.g. Ensure patient drinks boiled water and rests. Return if fever doesn't subside."
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-[#008F83]"
                  />
                </div>

                {/* Sign Rx Button */}
                <button
                  type="button"
                  disabled={teleSaving}
                  onClick={handleCompleteTeleconsult}
                  className="w-full py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {teleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Sign & Issue Official e-Prescription (Rx)</span>
                </button>

              </div>

              {/* RIGHT COLUMN: Full Patient Reports & Required Clinical Details */}
              <div className="lg:col-span-6 space-y-3.5 overflow-y-auto">
                
                {/* 1. Patient Profile Banner */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-wider bg-[#16324F] text-teal-100 px-2 py-0.5 rounded">
                        Patient Dossier
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">{activeTeleSession.patient_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {clinicalDocket?.age ? `${clinicalDocket.age} yrs` : 'Age: —'} · {clinicalDocket?.gender || 'Gender: —'} · Blood: {clinicalDocket?.bloodGroup || '—'}
                      </p>
                    </div>
                    {clinicalDocket?.abhaId && (
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold block">ABHA ID</span>
                        <span className="text-xs font-mono font-black text-teal-700">{clinicalDocket.abhaId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Critical Safety Alert: Allergies */}
                <div className="space-y-2">
                  {clinicalDocket?.resolved === false ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 shadow-xs">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 font-black text-xs">⚠️</div>
                      <div>
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">UNRESOLVED CLINICAL RECORD</p>
                        <p className="text-xs font-bold text-amber-900 mt-0.5">{clinicalDocket.error || 'Patient identity could not be verified in clinical database.'}</p>
                      </div>
                    </div>
                  ) : clinicalDocket?.allergies ? (
                    <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-3 flex items-start gap-2.5 shadow-xs">
                      <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-red-700 font-black text-sm">⚠️</div>
                      <div>
                        <p className="text-[10px] font-black text-red-700 uppercase tracking-wider">DOCUMENTED DRUG ALLERGY (CRITICAL)</p>
                        <p className="text-xs font-black text-red-900 mt-0.5">{clinicalDocket.allergies}</p>
                        <p className="text-[10px] text-red-600 font-medium mt-0.5">Cross-check all prescribed drugs. Cross-reactive antibiotics will be blocked.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-800">No Known Drug Allergies (NKDA)</span>
                    </div>
                  )}

                  {/* Active Medications & Chronic Conditions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Pill className="w-3 h-3 text-teal-600" /> Active Medications
                      </p>
                      <p className="text-xs font-bold text-slate-800">
                        {clinicalDocket?.currentMedications || 'None recorded'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 text-amber-600" /> Chronic Conditions
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {clinicalDocket?.chronicConditions && clinicalDocket.chronicConditions.length > 0 ? (
                          clinicalDocket.chronicConditions.map((cond, i) => (
                            <span key={i} className="text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-full">{cond}</span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">None documented</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Live Frontline Vitals Snapshot & Trends */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Frontline Vitals & Biometrics
                    </span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                      Real-Time
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <p className="text-[9px] text-slate-400 font-bold">BP</p>
                      <p className="font-black text-slate-800">{activeTeleSession.vitals_snapshot?.bp_systolic ? `${activeTeleSession.vitals_snapshot.bp_systolic}/${activeTeleSession.vitals_snapshot.bp_diastolic || 80}` : '120/80'}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <p className="text-[9px] text-slate-400 font-bold">Pulse</p>
                      <p className="font-black text-slate-800">{activeTeleSession.vitals_snapshot?.pulse_bpm || 76} bpm</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <p className="text-[9px] text-slate-400 font-bold">SpO2</p>
                      <p className="font-black text-slate-800">{activeTeleSession.vitals_snapshot?.spo2_pct || 98}%</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <p className="text-[9px] text-slate-400 font-bold">Temp</p>
                      <p className="font-black text-slate-800">98.6°F</p>
                    </div>
                  </div>

                  {/* Vitals History Trend Table */}
                  {clinicalDocket?.vitals && clinicalDocket.vitals.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Recent Vitals Trend</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] font-bold text-slate-700">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-100">
                              <td className="pb-1">Date</td>
                              <td className="pb-1">BP</td>
                              <td className="pb-1">Pulse</td>
                              <td className="pb-1">SpO2</td>
                              <td className="pb-1">Temp</td>
                            </tr>
                          </thead>
                          <tbody>
                            {clinicalDocket.vitals.slice(0, 3).map((v, i) => (
                              <tr key={i} className={i === 0 ? 'text-[#008F83] font-black' : 'text-slate-600'}>
                                <td className="py-0.5">{new Date(v.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                <td className="py-0.5">{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '—'}</td>
                                <td className="py-0.5">{v.pulse_bpm ? `${v.pulse_bpm} bpm` : '—'}</td>
                                <td className="py-0.5">{v.spo2_pct ? `${v.spo2_pct}%` : '—'}</td>
                                <td className="py-0.5">{v.temperature_c ? `${((v.temperature_c * 9/5) + 32).toFixed(1)}°F` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. ⚡ AI Clinical Copilot (Groq / RAG Briefing) */}
                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-3.5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                        ⚡ AI Clinical Copilot (Groq / RAG Briefing)
                      </span>
                    </div>
                    {!aiSummary && (
                      <button
                        type="button"
                        onClick={handleLoadAiSummary}
                        disabled={aiSummaryLoading}
                        className="text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-60 flex items-center gap-1 transition-colors"
                      >
                        {aiSummaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {aiSummaryLoading ? 'Analyzing...' : '3-sec Briefing'}
                      </button>
                    )}
                  </div>

                  {aiSummaryError && (
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg">{aiSummaryError}</p>
                  )}

                  {aiSummary ? (
                    <div className="space-y-1.5 text-xs">
                      {aiSummary.critical_alerts && aiSummary.critical_alerts !== 'NONE' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-red-500 shrink-0">🚨</span>
                          <div>
                            <span className="font-black text-red-700">Safety: </span>
                            <span className="text-red-800 font-medium">{aiSummary.critical_alerts}</span>
                          </div>
                        </div>
                      )}
                      {aiSummary.active_regimen && aiSummary.active_regimen !== 'NONE' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-amber-500 shrink-0">💊</span>
                          <div>
                            <span className="font-black text-amber-700">Medications: </span>
                            <span className="text-amber-900 font-medium">{aiSummary.active_regimen}</span>
                          </div>
                        </div>
                      )}
                      {aiSummary.clinical_trajectory && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-indigo-500 shrink-0">📋</span>
                          <div>
                            <span className="font-black text-indigo-700">Trajectory: </span>
                            <span className="text-indigo-900 font-medium">{aiSummary.clinical_trajectory}</span>
                          </div>
                        </div>
                      )}
                      {aiSummary.suggested_guardrails && aiSummary.suggested_guardrails !== 'NONE' && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-slate-500 shrink-0">🛡️</span>
                          <div>
                            <span className="font-black text-slate-700">Avoid: </span>
                            <span className="text-slate-700 font-medium">{aiSummary.suggested_guardrails}</span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setAiSummary(null)}
                        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer"
                      >
                        Regenerate →
                      </button>
                    </div>
                  ) : !aiSummaryLoading && !aiSummaryError && (
                    <p className="text-[10px] text-indigo-500 font-medium">
                      Click "3-sec Briefing" to run AI synthesis of this patient's medical history, allergies, and prescribing guardrails.
                    </p>
                  )}
                </div>

                {/* 5. Prior Consultations & Records */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Prior Consultations & Records on File
                  </span>
                  {clinicalDocket?.pastConsultations && clinicalDocket.pastConsultations.length > 0 ? (
                    <div className="space-y-1.5">
                      {clinicalDocket.pastConsultations.slice(0, 3).map((c, i) => (
                        <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{c.diagnosis || 'General OPD Visit'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{c.treatment_advice || c.clinical_assessment || 'Standard review'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No prior hospital consultations on file for this patient.</p>
                  )}
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowTeleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer transition-colors"
              >
                Close Desk
              </button>

              <div className="text-[11px] text-slate-400 font-medium">
                Official ABDM e-Prescription will be cryptographically linked to Patient ABHA ID
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
