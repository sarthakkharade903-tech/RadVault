import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Inbox,
  ArrowRight,
  AlertTriangle,
  Search,
  Loader2,
  X,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

// Mock/Demo configuration matching Auth parameters
const DEMO_DOCTOR_PROFILE = {
  id: 'doc-arvind-kulkarni',
  name: 'Dr. Arvind Kulkarni',
  specialty: 'Cardiology',
  facility_id: 'f2222222-2222-2222-2222-222222222222',
  facility_name: 'Pune Sassoon General Hospital'
};

const INITIAL_DEMO_REFERRALS = [
  {
    id: 'REF-DEMO-001',
    patient_id: 'pat-demo-1',
    patient_name: 'Rajesh Kumar',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'Cardiology',
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
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'Gynecology & Obstetrics',
    doctor_assigned: 'Dr. Arvind Kulkarni',
    priority: 'ORANGE',
    priority_label: '🟡 Urgent / Within 24 Hours',
    status: 'Accepted',
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
    destination_hospital: 'Pune Sassoon General Hospital',
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

const MOCK_PATIENT_HISTORY = {
  'pat-demo-1': [
    {
      date: '14 Aug 2026',
      type: 'ASHA Frontline Visit',
      clinical: 'ASHA Triage',
      diagnosis: 'Pre-hypertension risk',
      notes: 'Advised lower sodium intake, morning walks. Follow-up checklist scheduled.'
    }
  ]
};

export default function DoctorWorkspace({ onNavigateToPatientView: _onNavigateToPatientView }) {
  const { user, isDemoMode } = useAuth();

  // Navigation states: 'home' | 'cases'
  const [activeTab, setActiveTab] = useState('home');
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded profiles and clinical data
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Referral (Case view) & Sign Confirmation Modal
  const [activeCase, setActiveCase] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);

  // Consultation Form state
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentAdvice, setTreatmentAdvice] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Custom Prescriptions Adder Fields
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medDur, setMedDur] = useState('');

  // Custom Investigations Adder
  const [newInvest, setNewInvest] = useState('');

  // Load profile and clinical database structures
  const loadDoctorDbData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      // 1. Fetch Doctor Profile
      const { data: docData, error: docErr } = await supabase
        .from('doctors')
        .select('*, facilities(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (docErr) throw docErr;

      if (!docData) {
        setError('No verified doctor profile found for this account. Please contact system admin.');
        setLoading(false);
        return;
      }

      setDoctorProfile({
        id: docData.id,
        name: docData.name,
        specialty: docData.specialty,
        facility_id: docData.facility_id,
        facility_name: docData.facilities?.name || 'Assigned Facility'
      });

      // 2. Fetch scoped referrals
      const { data: refData, error: refErr } = await supabase
        .from('referrals')
        .select('*')
        .eq('destination_facility_id', docData.facility_id)
        .eq('doctor_assigned', docData.name)
        .order('created_at', { ascending: false });

      if (refErr) throw refErr;
      setReferrals(refData || []);

    } catch (err) {
      console.error('[RadVault Doctor] Fetch error:', err.message);
      setError('Unable to load queue and clinic data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial Load
  useEffect(() => {
    if (isDemoMode) {
      setDoctorProfile(DEMO_DOCTOR_PROFILE);
      setReferrals(INITIAL_DEMO_REFERRALS);
      setLoading(false);
    } else {
      loadDoctorDbData();
    }
  }, [isDemoMode, loadDoctorDbData]);

  // Toast alerts
  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ─── LOCAL STORAGE DRAFT HANDLERS ───

  const getDraftKey = (refId) => `radvault_doctor_draft_${refId}`;

  const handleSaveDraft = () => {
    if (!activeCase) return;
    const draftData = {
      clinicalAssessment,
      diagnosis,
      treatmentAdvice,
      prescriptions,
      investigations,
      followUpDate
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
      } catch (e) {
        console.warn('Unable to load consultation draft:', e);
      }
    } else {
      // Clear Form for fresh start
      setClinicalAssessment('');
      setDiagnosis('');
      setTreatmentAdvice('');
      setPrescriptions([]);
      setInvestigations([]);
      setFollowUpDate('');
    }
  };

  const handleOpenCase = (ref) => {
    setActiveCase(ref);
    handleLoadDraft(ref.id);
  };

  const handleCloseCase = () => {
    setActiveCase(null);
    setShowSignModal(false);
  };

  // ─── ADD / REMOVE PRESCRIPTIONS ───

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
    setMedFreq('');
    setMedDur('');
  };

  const handleRemoveMedicine = (id) => {
    setPrescriptions(prev => prev.filter(m => m.id !== id));
  };

  // ─── ADD / REMOVE INVESTIGATIONS ───

  const handleAddInvestigation = () => {
    if (!newInvest.trim()) return;
    setInvestigations(prev => [...prev, newInvest.trim()]);
    setNewInvest('');
  };

  const handleRemoveInvestigation = (index) => {
    setInvestigations(prev => prev.filter((_, i) => i !== index));
  };

  // ─── SIGN & COMPLETE CONSULTATION ───

  const handleSignConsultation = async () => {
    if (!activeCase || !doctorProfile) return;

    if (isDemoMode) {
      // 1. Update in-memory referrals
      setReferrals(prev => prev.map(r => r.id === activeCase.id ? { ...r, status: 'Completed' } : r));
      
      // 2. Update local mock encounters to feed back into ASHA follow-up workflow
      const rawEncs = localStorage.getItem('radvault_encounters_v1');
      if (rawEncs) {
        try {
          const encList = JSON.parse(rawEncs);
          const updatedList = encList.map(e => {
            if (e.referralId === activeCase.id || e.referral_id === activeCase.id) {
              return {
                ...e,
                followUpDate: followUpDate || e.followUpDate,
                follow_up_date: followUpDate || e.follow_up_date,
                followUpReason: `Diagnosis: ${diagnosis}. Advice: ${treatmentAdvice}`,
                follow_up_reason: `Diagnosis: ${diagnosis}. Advice: ${treatmentAdvice}`,
                followUpCompleted: false,
                follow_up_completed: false
              };
            }
            return e;
          });
          localStorage.setItem('radvault_encounters_v1', JSON.stringify(updatedList));
        } catch (err) {
          console.warn('Unable to sync mock follow-up encounter:', err);
        }
      }

      // Clean up local draft
      localStorage.removeItem(getDraftKey(activeCase.id));
      showToast('✓ Consultation signed. ASHA follow-up updated.');
      handleCloseCase();
      return;
    }

    try {
      // 1. Insert into consultations table
      const consultationPayload = {
        referral_id: activeCase.id,
        patient_id: activeCase.patient_id, // UUID type match
        doctor_id: doctorProfile.id,
        facility_id: doctorProfile.facility_id,
        clinical_assessment: clinicalAssessment,
        diagnosis: diagnosis,
        treatment_advice: treatmentAdvice,
        prescriptions: prescriptions.map(p => ({ name: p.name, dose: p.dose, freq: p.freq, duration: p.duration })),
        investigations: investigations,
        follow_up_recommended_date: followUpDate || null
      };

      const { error: consErr } = await supabase
        .from('consultations')
        .insert([consultationPayload]);

      if (consErr) {
        // Safe check for duplicate UNIQUE constraint errors
        if (consErr.code === '23505') {
          throw new Error('A signed consultation already exists for this referral record.');
        }
        throw consErr;
      }

      // 2. Update referrals status
      const { error: refErr } = await supabase
        .from('referrals')
        .update({ status: 'Completed' })
        .eq('id', activeCase.id);

      if (refErr) throw refErr;

      // 3. Connect follow-up date and details back to original encounter
      if (followUpDate) {
        const { error: encErr } = await supabase
          .from('encounters')
          .update({
            follow_up_date: followUpDate,
            follow_up_reason: `Diagnosis: ${diagnosis}. Clinical advice: ${treatmentAdvice}`,
            follow_up_completed: false
          })
          .eq('referral_id', activeCase.id);

        if (encErr) {
          console.warn('Warning: Could not link follow-up date to primary ASHA encounter row:', encErr.message);
        }
      }

      // Clean up database state indicators
      setReferrals(prev => prev.map(r => r.id === activeCase.id ? { ...r, status: 'Completed' } : r));
      localStorage.removeItem(getDraftKey(activeCase.id));
      showToast('✓ Consultation signed and synced to care registry.');
      handleCloseCase();

    } catch (err) {
      console.error('[RadVault Doctor] Signing error:', err.message);
      setError(`Failed to sign consultation: ${err.message}`);
      setShowSignModal(false);
    }
  };

  // Memos for metrics
  const counts = useMemo(() => {
    const waiting = referrals.filter(r => r.status === 'Arrived' || r.status === 'Accepted').length;
    const completed = referrals.filter(r => r.status === 'Completed').length;
    const urgent = referrals.filter(r => (r.status === 'Arrived' || r.status === 'Accepted') && (r.priority === 'HIGH' || r.priority === 'RED')).length;
    return { waiting, completed, urgent };
  }, [referrals]);

  // Scoped lists
  const filteredReferrals = useMemo(() => {
    let list = [...referrals];

    // Priority sort: HIGH/RED first, then ORANGE, then GREEN
    list.sort((a, b) => {
      const pA = a.priority === 'HIGH' || a.priority === 'RED' ? 3 : a.priority === 'ORANGE' ? 2 : 1;
      const pB = b.priority === 'HIGH' || b.priority === 'RED' ? 3 : b.priority === 'ORANGE' ? 2 : 1;
      return pB - pA;
    });

    if (activeTab === 'cases') {
      if (queueFilter === 'Active') {
        list = list.filter(r => r.status === 'Arrived' || r.status === 'Accepted');
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
  }, [referrals, activeTab, queueFilter, searchQuery]);

  // Next Patient selection: highest priority Arrived patient
  const nextPatient = useMemo(() => {
    return referrals
      .filter(r => r.status === 'Arrived')
      .sort((a, b) => {
        const pA = a.priority === 'HIGH' || a.priority === 'RED' ? 3 : a.priority === 'ORANGE' ? 2 : 1;
        const pB = b.priority === 'HIGH' || b.priority === 'RED' ? 3 : b.priority === 'ORANGE' ? 2 : 1;
        return pB - pA;
      })[0] || null;
  }, [referrals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#800000]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">

      {/* Toast Alert */}
      {successMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 bg-slate-900 text-white font-extrabold text-xs rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─── DOCTOR SHELL CONTAINER ─── */}
      {!activeCase ? (
        <div className="space-y-6">
          
          {/* Header Dashboard Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 bg-[#FDF2F2] border border-[#800000]/30 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner">
                🩺
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-tight">
                  Good morning, {doctorProfile?.name || 'Specialist'}
                </h1>
                <p className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>📍 {doctorProfile?.facility_name || 'Assigned Facility'}</span>
                  <span>·</span>
                  <span className="text-[#800000]">{doctorProfile?.specialty || 'General Medicine'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={isDemoMode ? null : loadDoctorDbData}
              className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#800000]" />
              <span>Sync Dashboard</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
            {[
              { key: 'home', label: 'Home Feed' },
              { key: 'cases', label: 'Clinical Queue' }
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
                    : 'border-transparent text-slate-500 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: HOME FEED */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Quick Numbers */}
              <div className="grid grid-cols-3 gap-3.5">
                <div 
                  onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-[#800000]/60 rounded-2xl cursor-pointer transition-colors space-y-1"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waiting</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{counts.waiting}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Active</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setActiveTab('cases'); setQueueFilter('Active'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-rose-400 rounded-2xl cursor-pointer transition-colors space-y-1"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Urgent Cases</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-rose-800">{counts.urgent}</span>
                    <span className="text-[10px] text-rose-600 font-bold">High Risk</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setActiveTab('cases'); setQueueFilter('Completed'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-colors space-y-1"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Consultations</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{counts.completed}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Completed</span>
                  </div>
                </div>
              </div>

              {/* Next Arrived Patient Alert / CTA */}
              {nextPatient ? (
                <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-lg space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-wider bg-[#800000] text-rose-100 px-2 py-0.5 rounded border border-[#800000]/50 inline-block mb-1.5 animate-pulse">
                      Highest Priority Waiting
                    </span>
                    <h3 className="text-base font-black">{nextPatient.patient_name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Reason: {nextPatient.symptoms}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCase(nextPatient)}
                    className="px-5 py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Clinical Case</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs text-slate-400 font-medium">
                  ✓ No arrived patients are currently waiting in your queue.
                </div>
              )}

              {/* Today's Cases list */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 shadow-2xs">
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Today's Cases</h2>

                {referrals.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {referrals.slice(0, 5).map(ref => {
                      const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                      const isUrgent = ref.priority === 'ORANGE';
                      const labelClass = isHigh ? 'bg-rose-50 text-rose-800' : isUrgent ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-700';

                      return (
                        <div key={ref.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-slate-900">{ref.patient_name}</span>
                              <span className="font-mono text-[10px] text-slate-400">ID: {ref.patient_id}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${labelClass}`}>
                                {ref.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                              {ref.destination_department} · Status: {ref.status}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {ref.status !== 'Completed' ? (
                              <button
                                onClick={() => handleOpenCase(ref)}
                                className="px-3 py-1.5 bg-[#800000] hover:bg-[#660000] text-white font-black text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                Open Case
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Signed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">No cases parsed.</div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CLINICAL QUEUE */}
          {activeTab === 'cases' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Queue Controls */}
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
                      className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] shrink-0 transition-colors cursor-pointer ${
                        queueFilter === btn.key
                          ? 'bg-[#800000] text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="relative shrink-0 w-full sm:w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search queue..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Patient Case Listing */}
              {filteredReferrals.length > 0 ? (
                <div className="space-y-3">
                  {filteredReferrals.map(ref => {
                    const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
                    const isUrgent = ref.priority === 'ORANGE';
                    const labelClass = isHigh ? 'bg-rose-50 text-rose-800 border-rose-200' : isUrgent ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    const isWaiting = ref.status === 'Arrived' || ref.status === 'Accepted';

                    return (
                      <div
                        key={ref.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-900">{ref.patient_name}</span>
                            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                              ID: {ref.patient_id}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${labelClass}`}>
                              {ref.priority_label || ref.priority}
                            </span>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${
                            isWaiting ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {ref.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          <strong className="text-slate-700">Complaint:</strong> {ref.symptoms}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-[10px] text-slate-400 font-semibold">
                            Referred on {new Date(ref.created_at).toLocaleDateString('en-IN')} by {ref.created_by || 'ASHA'}
                          </div>

                          {ref.status !== 'Completed' ? (
                            <button
                              onClick={() => handleOpenCase(ref)}
                              className="px-4 py-1.5 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl transition-colors cursor-pointer ml-auto"
                            >
                              Open Consultation
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

        </div>
      ) : (
        // ─── TAB 2: ACTIVE CLINICAL CASE PANEL (Split two-column layout) ───
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Header details with close actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] uppercase font-black tracking-wider bg-[#800000] text-rose-100 px-2 py-0.5 rounded">
                  Clinical Examination Mode
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">Case ID: {activeCase.id}</span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-1.5">{activeCase.patient_name}</h2>
              <p className="text-xs text-[#800000] font-bold mt-0.5">{activeCase.destination_department} Specialist Consultation</p>
            </div>

            <button
              onClick={handleCloseCase}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Close Case"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Clinical Progress Journey Timeline */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs flex items-center justify-between text-[11px] font-black text-slate-500 overflow-x-auto gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
              <span>ASHA Triage</span>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
              <span>Referral Created</span>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
            <div className="flex items-center gap-2 shrink-0 text-slate-900">
              <span className="w-5 h-5 rounded-full bg-[#800000] text-white flex items-center justify-center text-[10px] animate-pulse">4</span>
              <span>Specialist Examination</span>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px]">5</span>
              <span>Follow-up loop</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: PATIENT CONTEXT & HEALTH RECORDS HISTORY */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Demographics & Referral Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Triage Context Summary</h3>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Risk Priority</span>
                    <span className="text-rose-800">{activeCase.priority_label || activeCase.priority}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Referred By</span>
                    <span className="text-slate-900">{activeCase.created_by}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Primary symptoms notes</span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {activeCase.symptoms}
                  </p>
                </div>

                {/* Vitals */}
                {activeCase.vitals && Object.keys(activeCase.vitals).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Frontline Vitals</span>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-extrabold text-slate-700 bg-slate-50 p-2.5 border border-slate-100 rounded-2xl">
                      {activeCase.vitals.bp && <div>BP: {activeCase.vitals.bp}</div>}
                      {activeCase.vitals.pulse && <div>HR: {activeCase.vitals.pulse} bpm</div>}
                      {activeCase.vitals.spo2 && <div>SpO₂: {activeCase.vitals.spo2}%</div>}
                      {activeCase.vitals.temp && <div>Temp: {activeCase.vitals.temp}°F</div>}
                    </div>
                  </div>
                )}

                {/* Danger Signs */}
                {activeCase.danger_signs && activeCase.danger_signs.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-rose-600 block font-black uppercase">⚠️ Danger Signs Flagged</span>
                    <p className="text-xs text-rose-800 bg-rose-50 border border-rose-100 p-3 rounded-2xl leading-relaxed">
                      {activeCase.danger_signs.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Longitudinal History */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Patient Health History</h3>
                
                {MOCK_PATIENT_HISTORY[activeCase.patient_id] ? (
                  <div className="space-y-3">
                    {MOCK_PATIENT_HISTORY[activeCase.patient_id].map((hist, i) => (
                      <div key={i} className="text-xs font-medium text-slate-600 border border-slate-100 p-3 rounded-2xl bg-slate-5/50 space-y-1">
                        <div className="flex items-center justify-between font-extrabold">
                          <span className="text-slate-800">{hist.type}</span>
                          <span className="text-[10px] text-slate-400">{hist.date}</span>
                        </div>
                        <div><strong className="text-slate-700">Diagnosis:</strong> {hist.diagnosis}</div>
                        <p className="text-[11px] text-slate-500 italic mt-1">"{hist.notes}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    No previous health history records available.
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: CLINICAL CONSULTATION FORM */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-5">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Clinical Examination Consultation</h3>

                <div className="space-y-4">
                  
                  {/* A. Clinical Assessment */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wide block">
                      Clinical Assessment / Findings
                    </label>
                    <textarea
                      value={clinicalAssessment}
                      onChange={(e) => setClinicalAssessment(e.target.value)}
                      placeholder="Describe symptoms severity, lung sounds, heart auscultation, clinical presentation..."
                      rows={3}
                      className="w-full border-2 border-slate-200 focus:border-[#800000] outline-none rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-900 bg-white transition-colors"
                    />
                  </div>

                  {/* B. Diagnosis */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wide block">
                      Specialist Diagnosis
                    </label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Enter clinical diagnosis (e.g. Stage 1 Hypertension, suspected angina pectoris...)"
                      rows={2}
                      className="w-full border-2 border-slate-200 focus:border-[#800000] outline-none rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-900 bg-white transition-colors"
                    />
                  </div>

                  {/* C. Treatment Advice */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wide block">
                      Treatment / Advice Notes
                    </label>
                    <textarea
                      value={treatmentAdvice}
                      onChange={(e) => setTreatmentAdvice(e.target.value)}
                      placeholder="Dosage instruction details, rest guidelines, diet alterations advice..."
                      rows={2}
                      className="w-full border-2 border-slate-200 focus:border-[#800000] outline-none rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-900 bg-white transition-colors"
                    />
                  </div>

                  {/* D. Prescriptions */}
                  <div className="space-y-3.5 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wide block">
                      Prescribe Medications
                    </label>
                    
                    {/* Add medicine subform */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="Medicine name"
                        className="col-span-2 border border-slate-200 rounded-lg p-2 font-semibold bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={medDose}
                        onChange={(e) => setMedDose(e.target.value)}
                        placeholder="Dosage (e.g. 500mg)"
                        className="border border-slate-200 rounded-lg p-2 font-semibold bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={medFreq}
                        onChange={(e) => setMedFreq(e.target.value)}
                        placeholder="Frequency (e.g. BID)"
                        className="border border-slate-200 rounded-lg p-2 font-semibold bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={medDur}
                        onChange={(e) => setMedDur(e.target.value)}
                        placeholder="Duration (e.g. 5 days)"
                        className="border border-slate-200 rounded-lg p-2 font-semibold bg-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg p-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>

                    {/* Prescribed List */}
                    {prescriptions.length > 0 && (
                      <div className="pt-2 divide-y divide-slate-100 space-y-1.5">
                        {prescriptions.map(med => (
                          <div key={med.id} className="flex items-center justify-between text-xs font-bold text-slate-800 py-1.5">
                            <div>
                              <span>{med.name}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {med.dose} · {med.freq} · {med.duration}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(med.id)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* E. Investigations */}
                  <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wide block">
                      Request Diagnostics / Investigations
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newInvest}
                        onChange={(e) => setNewInvest(e.target.value)}
                        placeholder="Investigation name (e.g. ECG, Lipid)"
                        className="flex-1 border border-slate-200 rounded-lg p-2 font-semibold bg-white outline-none text-xs"
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
                          <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700">
                            <span>{inv}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInvestigation(idx)}
                              className="text-rose-600 hover:text-rose-800"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* F. Follow-up Recommendation */}
                  <div className="space-y-3.5 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <label className="text-[11px] font-black uppercase text-[#800000] tracking-wide block">
                        Frontline ASHA Follow-up
                      </label>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        Doctor recommends · ASHA performs
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
                      <div className="flex items-end text-[10px] text-slate-500 font-medium leading-relaxed pb-1.5">
                        Follow-up checklist triggers automatically in target ASHA worker dashboard for visual verification.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Consultation Actions footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 text-xs font-black text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    className="px-5 py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-99 cursor-pointer"
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

      {/* ─── MODAL: SIGN CLINICAL SUMMARY CONFIRMATION ─── */}
      {showSignModal && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Sign clinical checkup summary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please review before writing to patient records vault.</p>
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
                <span className="text-slate-900">{diagnosis}</span>
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
                  <span className="text-slate-900">Scheduled on {new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}

            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3.5">
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

    </div>
  );
}
