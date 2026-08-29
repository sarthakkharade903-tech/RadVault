import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Inbox,
  ArrowRight,
  AlertTriangle,
  Search,
  ChevronRight,
  Loader2,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

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
    patient_name: 'Rajesh Kumar',
    created_by: 'ASHA Worker: Sunita Deshmukh',
    destination_hospital: 'Pune Sassoon General Hospital',
    destination_department: 'Cardiology',
    doctor_assigned: 'On-Duty Specialist',
    priority: 'HIGH',
    priority_label: 'Emergency / Immediate Attention',
    status: 'Pending',
    symptoms: 'Chest tightness and intermittent breathlessness. Notes: Patient reports radiating pain to arm.',
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
    doctor_assigned: 'On-Duty Specialist',
    priority: 'ORANGE',
    priority_label: 'Urgent / Within 24 Hours',
    status: 'Accepted',
    symptoms: 'Mild headache and swelling. Notes: Antenatal follow-up check.',
    vitals: { bp: '134/86', pulse: '82', spo2: '98', temp: '98.4', respRate: '18', weight: '71' },
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
    doctor_assigned: 'Dr. Priya Sharma',
    priority: 'GREEN',
    priority_label: 'Routine / Local Care',
    status: 'Arrived',
    symptoms: 'Mild fever and sore throat. Notes: Seasonal throat infection.',
    vitals: { bp: '118/76', pulse: '76', spo2: '99', temp: '99.8', respRate: '16', weight: '62' },
    danger_signs: [],
    created_at: new Date().toISOString()
  }
];

export default function HospitalStaffWorkspace({ onNavigateToPatientView }) {
  const { user, isDemoMode, demoDataEnabled } = useAuth();
  
  // Navigation Tabs: 'home' | 'queue' | 'referrals'
  const [activeTab, setActiveTab] = useState('home');
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Accepted_Arrived' | 'Completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Operational State
  const [referrals, setReferrals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staffProfile, setStaffProfile] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected Referral Context / Modals
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDoctorRouteModal, setShowDoctorRouteModal] = useState(null); // holds referral object

  // Fetch real data from Supabase
  const loadSupabaseData = useCallback(async () => {
    if (!user) {
      setStaffProfile(null);
      setFacility(null);
      setDoctors([]);
      setReferrals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Fetch Hospital Staff Profile and Facility
      const { data: staffData, error: staffErr } = await supabase
        .from('hospital_staff')
        .select('*, facilities(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (staffErr) throw staffErr;

      if (!staffData) {
        setError('No hospital staff profile linked to this user. Please contact system admin.');
        setStaffProfile(null);
        setFacility(null);
        setDoctors([]);
        setReferrals([]);
        setLoading(false);
        return;
      }

      setStaffProfile({
        name: staffData.name,
        role: staffData.role || 'Hospital Staff',
        phc_name: staffData.facilities?.name || 'Assigned PHC'
      });

      const facilityId = staffData.facility_id;
      setFacility({
        id: facilityId,
        name: staffData.facilities?.name || 'Assigned PHC',
        district: staffData.facilities?.district || 'General District'
      });

      // 2. Fetch Scoped Doctors
      const { data: doctorsData, error: docErr } = await supabase
        .from('doctors')
        .select('*')
        .eq('facility_id', facilityId);

      if (docErr) throw docErr;
      setDoctors(doctorsData || []);

      // 3. Fetch Scoped Referrals
      const { data: refData, error: refErr } = await supabase
        .from('referrals')
        .select('*')
        .eq('destination_facility_id', facilityId)
        .order('created_at', { ascending: false });

      if (refErr) throw refErr;
      console.log(`[RADVAULT][PHC_REFERRAL_LOAD] User: ${user.id}, Staff: ${staffData.id}, Facility: ${facilityId} (${staffData.facilities?.name}), Fetched Referrals Count: ${refData?.length || 0}`);
      setReferrals(refData || []);

    } catch (err) {
      console.error('[RADVAULT][PHC_REFERRAL_LOAD] Data load error:', err.message);
      setError('Unable to load referrals and facility data. Please try again.');
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load Initial Data
  useEffect(() => {
    if (isDemoMode && demoDataEnabled) {
      setStaffProfile({
        name: 'Sagar Deshpande (Operations Desk)',
        phc_name: 'Pune Sassoon General Hospital'
      });
      setFacility({
        id: 'f2222222-2222-2222-2222-222222222222',
        name: 'Pune Sassoon General Hospital',
        district: 'Pune'
      });
      setDoctors(DEMO_DOCTORS);
      setReferrals(INITIAL_DEMO_REFERRALS);
      setLoading(false);
    } else {
      loadSupabaseData();
    }
  }, [isDemoMode, demoDataEnabled, loadSupabaseData]);

  // Clear toast alert helper
  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ─── STATUS TRANSITIONS ───

  // 1. Pending -> Accepted
  const handleAcceptReferral = async (refId) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Accepted' } : r));
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
      showToast('✓ Referral accepted successfully.');
    } catch (err) {
      setError(`Failed to accept referral: ${err.message}`);
    }
  };

  // 2. Accepted -> Arrived
  const handleMarkArrived = async (refId) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'Arrived' } : r));
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
      showToast('✓ Patient marked as arrived.');
    } catch (err) {
      setError(`Failed to mark arrival: ${err.message}`);
    }
  };

  // 3. Arrived -> Assign Doctor
  const handleRouteToDoctor = async (refId, doctorName) => {
    if (isDemoMode) {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, doctor_assigned: doctorName } : r));
      setShowDoctorRouteModal(null);
      showToast(`✓ Patient successfully routed to ${doctorName}.`);
      return;
    }

    try {
      const { error: err } = await supabase
        .from('referrals')
        .update({ doctor_assigned: doctorName })
        .eq('id', refId);

      if (err) throw err;

      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, doctor_assigned: doctorName } : r));
      setShowDoctorRouteModal(null);
      showToast(`✓ Scoped referral updated with assigned specialist: ${doctorName}`);
    } catch (err) {
      setError(`Failed to assign specialist: ${err.message}`);
    }
  };

  // Memos for metrics
  const counts = useMemo(() => {
    const pending = referrals.filter(r => r.status === 'Pending').length;
    const waiting = referrals.filter(r => r.status === 'Accepted' || r.status === 'Arrived').length;
    const completed = referrals.filter(r => r.status === 'Completed').length;
    return { pending, waiting, completed };
  }, [referrals]);

  // Scoped referrals based on active tab and filters
  const filteredReferrals = useMemo(() => {
    let list = [...referrals];
    
    // Applying tab filters
    if (activeTab === 'queue') {
      if (queueFilter === 'Pending') {
        list = list.filter(r => r.status === 'Pending');
      } else if (queueFilter === 'Accepted_Arrived') {
        list = list.filter(r => r.status === 'Accepted' || r.status === 'Arrived');
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
        (r.symptoms || '').toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [referrals, activeTab, queueFilter, searchQuery]);

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

        {/* Small Live Refresh Indicator */}
        <button
          onClick={isDemoMode ? null : loadSupabaseData}
          className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 text-[#008080]" />
          <span>Refresh Live</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
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
                      <div key={ref.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900">{ref.patient_name}</span>
                            <span className="font-mono text-[10px] text-slate-400">ID: {ref.patient_id}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${priorityBg}`}>
                              {ref.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {ref.destination_department} · {ref.symptoms}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedReferral(ref)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Context
                          </button>
                          
                          {ref.status === 'Pending' && (
                            <button
                              onClick={() => handleAcceptReferral(ref.id)}
                              className="px-3 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-[11px] rounded-lg transition-colors cursor-pointer"
                            >
                              Accept
                            </button>
                          )}

                          {ref.status === 'Accepted' && (
                            <button
                              onClick={() => handleMarkArrived(ref.id)}
                              className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-[11px] rounded-lg transition-colors cursor-pointer"
                            >
                              Arrive
                            </button>
                          )}

                          {ref.status === 'Arrived' && (
                            <button
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
        <div className="space-y-6 animate-in fade-in duration-150">
          
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
                className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] shrink-0 transition-colors cursor-pointer ${
                  queueFilter === filterBtn.key
                    ? 'bg-[#008080] text-white'
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

                return (
                  <div 
                    key={ref.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{ref.patient_name}</span>
                        <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                          ID: {ref.patient_id}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${priorityClass}`}>
                          {ref.priority_label || ref.priority}
                        </span>
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
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          Context
                        </button>

                        {ref.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleAcceptReferral(ref.id)}
                            className="px-4 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Accept Referral
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
                        
                        {ref.status === 'Completed' && (
                          <button
                            type="button"
                            onClick={() => onNavigateToPatientView()}
                            className="px-3 py-1.5 text-xs font-bold text-[#008080] hover:text-[#006666] flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            <span>Open Records</span>
                            <ArrowRight className="w-3 h-3" />
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
                        <span className="font-mono text-[10px] text-slate-400">{ref.patient_id}</span>
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

      {/* ─── MODAL 1: VIEW PATIENT CONTEXT ─── */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 mb-1">
                  Referral Intake Context
                </span>
                <h2 className="text-sm font-black text-slate-900">{selectedReferral.patient_name}</h2>
                <p className="text-[10px] font-mono text-slate-400 font-bold">ID: {selectedReferral.patient_id}</p>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold text-slate-700 space-y-3">
              
              {/* Routing detail */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Priority Risk</span>
                  <span className="text-slate-900">{selectedReferral.priority_label || selectedReferral.priority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Status</span>
                  <span className="text-slate-900">{selectedReferral.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Facility Target</span>
                  <span className="text-slate-900">{selectedReferral.destination_hospital || 'Facility PHC'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Clinician Desk</span>
                  <span className="text-slate-900">{selectedReferral.doctor_assigned || 'Unassigned'}</span>
                </div>
              </div>

              {/* Vitals */}
              {selectedReferral.vitals && Object.keys(selectedReferral.vitals).length > 0 && (
                <div className="pt-3">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase mb-1">ASHA Triage Vitals</span>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-extrabold text-[11px]">
                    {selectedReferral.vitals.bp && <div>BP: {selectedReferral.vitals.bp}</div>}
                    {selectedReferral.vitals.pulse && <div>HR: {selectedReferral.vitals.pulse} bpm</div>}
                    {selectedReferral.vitals.spo2 && <div>SpO₂: {selectedReferral.vitals.spo2}%</div>}
                    {selectedReferral.vitals.temp && <div>Temp: {selectedReferral.vitals.temp}°F</div>}
                  </div>
                </div>
              )}

              {/* Danger signs */}
              {selectedReferral.danger_signs && selectedReferral.danger_signs.length > 0 && (
                <div className="pt-3">
                  <span className="text-[10px] text-rose-600 block font-black uppercase mb-0.5">⚠️ Danger Signs Flagged</span>
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl leading-relaxed">
                    {selectedReferral.danger_signs.join(', ')}
                  </p>
                </div>
              )}

              {/* Complaint detail */}
              <div className="pt-3">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Intake Complaint & Symptoms</span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed mt-1">
                  {selectedReferral.symptoms}
                </p>
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReferral(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Context
              </button>
            </div>

          </div>
        </div>
      )}

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

    </div>
  );
}
