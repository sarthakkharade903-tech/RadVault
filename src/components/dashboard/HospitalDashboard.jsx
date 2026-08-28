import React, { useState, useEffect } from 'react';
import { Building2, ChevronLeft, Clock, CheckCircle2, AlertTriangle, Search, Activity, User, Calendar, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { updateCareRequestStatus } from '../../services/ashaService';

export default function HospitalDashboard({ goHome }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('care_requests')
      .select('*')
      .in('status', ['SUBMITTED', 'PENDING_PHC'])
      .order('priority', { ascending: true }) // URGENT first (Assuming URGENT sorts before HIGH/ROUTINE alphabetically? Actually U, H, R... U comes last. Wait. Let's just order by created_at)
      .order('created_at', { ascending: false });

    if (data) {
      // Sort manually: RED/URGENT > ORANGE/HIGH > GREEN/ROUTINE
      const sorted = data.sort((a, b) => {
        const pA = a.priority === 'URGENT' || a.priority === 'RED' ? 3 : (a.priority === 'HIGH' || a.priority === 'ORANGE' ? 2 : 1);
        const pB = b.priority === 'URGENT' || b.priority === 'RED' ? 3 : (b.priority === 'HIGH' || b.priority === 'ORANGE' ? 2 : 1);
        return pB - pA;
      });
      setRequests(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to realtime updates for "Wow" factor
    const channel = supabase.channel('care_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'care_requests' }, payload => {
        fetchRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleAccept = async (id) => {
    setProcessing(id);
    await updateCareRequestStatus(id, 'ACCEPTED');
    await fetchRequests();
    setProcessing(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FF] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-indigo-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-indigo-900/5">
        <div className="flex items-center gap-4">
          <button onClick={goHome} className="p-2 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Hospital Reception
            </h1>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Central Intake Queue</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Live Sync Active</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pending Admissions & Referrals</h2>
          <div className="bg-white px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2 shadow-sm text-sm font-bold text-indigo-600">
            <Clock className="w-4 h-4" />
            {requests.length} in queue
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold">Loading Queue...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-indigo-100 p-12 text-center shadow-xl shadow-indigo-900/5">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Queue is Empty</h3>
            <p className="text-slate-500 font-medium">All incoming referrals have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              const isUrgent = req.priority === 'URGENT' || req.priority === 'RED';
              const isHigh = req.priority === 'HIGH' || req.priority === 'ORANGE';
              
              const priorityStyles = isUrgent 
                ? 'border-rose-200 bg-rose-50/30 shadow-rose-900/5' 
                : isHigh 
                  ? 'border-amber-200 bg-amber-50/30 shadow-amber-900/5'
                  : 'border-indigo-100 bg-white shadow-indigo-900/5';
                  
              const badgeStyles = isUrgent 
                ? 'bg-rose-100 text-rose-700' 
                : isHigh 
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-indigo-100 text-indigo-700';

              return (
                <div key={req.id} className={`p-5 rounded-3xl border shadow-lg flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:shadow-xl ${priorityStyles}`}>
                  
                  {/* Left: Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${badgeStyles}`}>
                        {isUrgent && <AlertTriangle className="w-3 h-3" />}
                        {req.priority || 'ROUTINE'} Priority
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-1">{req.patient_name}</h3>
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-3">
                      <User className="w-4 h-4" /> Source: <span className="text-indigo-600 font-bold">{req.source === 'ASHA_REFERRED' ? 'ASHA Worker Referral' : 'Patient Direct Booking'}</span>
                    </p>
                    
                    <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-sm inline-block">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Requested</p>
                      <p className="text-sm font-black text-slate-700">{req.department || 'General Medicine'}</p>
                    </div>
                  </div>

                  {/* Middle: Clinical Notes */}
                  <div className="flex-1 bg-white/60 p-4 rounded-2xl border border-slate-200/50 self-stretch">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Clinical Notes
                    </p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      {req.reason || req.asha_notes || 'No specific notes provided.'}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 w-full md:w-auto">
                    <button 
                      onClick={() => handleAccept(req.id)}
                      disabled={processing === req.id}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {processing === req.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      {processing === req.id ? 'Accepting...' : 'Accept & Schedule'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
