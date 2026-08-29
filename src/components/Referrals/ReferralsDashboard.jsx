import React, { useState, useEffect } from 'react';
import ReferralList from './ReferralList';
import TriageForm from './TriageForm';
import { supabase } from '../../services/supabase';
import { Plus, ListFilter, Handshake, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ReferralsDashboard({ onBack, initialTab = 'list' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'list'); // 'new' | 'list'
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const lang = localStorage.getItem("radvault_asha_lang") || "en";

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('care_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const mapped = data.map(d => ({
          id: d.id,
          patientName: d.patient_name || 'Village Resident',
          patientId: d.patient_id ? String(d.patient_id).slice(0, 8).toUpperCase() : 'ABHA-PAT',
          createdBy: d.created_by || 'ASHA Worker',
          department: d.department || 'General Medicine & OPD',
          hospital: d.facility || 'PHC Shirwal',
          doctor: d.doctor_assigned || 'On-Duty Medical Officer',
          priority: d.priority === 'URGENT' ? 'RED' : d.priority === 'HIGH' ? 'ORANGE' : 'GREEN',
          status: d.status === 'COMPLETED' ? 'Completed' : d.status === 'ACCEPTED' ? 'Accepted' : 'Pending',
          aiNote: d.reason || d.asha_notes || 'Referred for specialist medical care',
          is_pregnant: d.department?.toLowerCase().includes('maternity') || d.department?.toLowerCase().includes('anc'),
          createdAt: new Date(d.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }));
        setReferrals(mapped);
      }
    } catch (err) {
      console.warn("Could not load care_requests:", err);
    }
  };

  useEffect(() => {
    fetchReferrals();

    const channel = supabase.channel('care_requests_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'care_requests' }, () => {
        fetchReferrals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewReferral = (newReferralData) => {
    const mapped = {
      id: newReferralData.id || `ref-${Date.now()}`,
      patientName: newReferralData.patient_name || 'Village Resident',
      patientId: newReferralData.patient_id ? String(newReferralData.patient_id).slice(0, 8).toUpperCase() : 'ABHA-PAT',
      createdBy: newReferralData.created_by || 'ASHA Worker',
      department: newReferralData.department || 'General Medicine & OPD',
      hospital: newReferralData.facility || 'PHC Shirwal',
      doctor: newReferralData.doctor_assigned || 'On-Duty Medical Officer',
      priority: newReferralData.priority === 'URGENT' ? 'RED' : 'GREEN',
      status: 'Pending',
      aiNote: newReferralData.reason || newReferralData.asha_notes || 'Referred for specialist evaluation',
      is_pregnant: newReferralData.department?.toLowerCase().includes('maternity') || newReferralData.department?.toLowerCase().includes('anc'),
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setReferrals(prev => [mapped, ...prev]);
    setSuccessMsg(
      lang === 'mr'
        ? `रेफरल यशस्वीरित्या रुग्णालयाकडे पाठवले आहे: ${mapped.patientName}`
        : lang === 'hi'
        ? `रेफरल सफलतापूर्वक अस्पताल भेजा गया: ${mapped.patientName}`
        : `Referral successfully dispatched to hospital for ${mapped.patientName}`
    );
    setActiveTab('list');

    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const handleDeleteReferral = async (referralId) => {
    // Delete from Supabase care_requests
    try {
      await supabase.from('care_requests').delete().eq('id', referralId);
    } catch (err) {
      console.warn("Could not delete from Supabase:", err);
    }

    setReferrals(prev => prev.filter(r => r.id !== referralId));
    setSuccessMsg(
      lang === 'mr'
        ? "रेफरल यशस्वीरित्या काढून टाकले आहे."
        : lang === 'hi'
        ? "रेफरल सफलतापूर्वक हटा दिया गया है।"
        : "Referral removed successfully."
    );

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] font-sans text-slate-800 pb-20">
      
      {/* ── Top Bar: Quick Mode Switcher (New Referral by default vs History) ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-[#008F83] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{lang === 'mr' ? 'नवीन रेफरल' : lang === 'hi' ? 'नया रेफरल' : 'New Referral'}</span>
            </button>

            <button
              onClick={() => { setActiveTab('list'); fetchReferrals(); }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-[#008F83] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>
                {lang === 'mr' ? 'रेफरल यादी' : lang === 'hi' ? 'रेफरल सूची' : 'Referrals List'}
                {referrals.length > 0 && ` (${referrals.length})`}
              </span>
            </button>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              {lang === 'mr' ? '← मुख्य पान' : lang === 'hi' ? '← होम' : '← Home'}
            </button>
          )}

        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="max-w-3xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'new' ? (
          <TriageForm
            onSubmit={handleNewReferral}
            onCancel={() => setActiveTab('list')}
          />
        ) : (
          <ReferralList
            referrals={referrals}
            onCreateNew={() => setActiveTab('new')}
            onDeleteReferral={handleDeleteReferral}
            onBack={onBack}
          />
        )}
      </div>

    </div>
  );
}
