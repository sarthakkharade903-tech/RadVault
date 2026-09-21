import React, { useState, useEffect } from 'react';
import ReferralList from './ReferralList';
import TriageForm from './TriageForm';
import { supabase } from '../../services/supabase';
import { Plus, ListFilter, Handshake, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ReferralsDashboard({ onBack, initialTab = 'list', demoMode = false }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'list'); // 'new' | 'list'
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const lang = localStorage.getItem("radvault_asha_lang") || "en";

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("[ReferralsDashboard] Could not load referrals:", error);
        setErrorMsg(`Failed to load referrals: ${error.message}`);
        return;
      }

      if (data) {
        const mapped = data.map(d => ({
          id: d.id,
          patientName: d.patient_name || 'Village Resident',
          patientId: d.patient_id ? String(d.patient_id).slice(0, 8).toUpperCase() : 'ABHA-PAT',
          patient_id: d.patient_id,
          destination_facility_id: d.destination_facility_id,
          createdBy: d.created_by || 'ASHA Worker',
          department: d.destination_department || d.department || 'General Medicine & OPD',
          hospital: d.destination_hospital || d.facility || 'Pune Sassoon General Hospital',
          doctor: d.doctor_assigned || 'On-Duty Medical Officer',
          priority: (d.priority === 'URGENT' || d.priority === 'RED' || d.priority === 'EMERGENCY' || d.priority === 'HIGH')
            ? 'RED'
            : (d.priority === 'ORANGE' || d.priority === 'MEDIUM')
            ? 'ORANGE'
            : 'GREEN',
          status: (d.status === 'COMPLETED' || d.status === 'Completed')
            ? 'Completed'
            : (d.status === 'ACCEPTED' || d.status === 'WAITING_FOR_DOCTOR' || d.status === 'IN_CALL' || d.status === 'Accepted' || d.status === 'Arrived' || d.status === 'Assigned')
            ? (d.status === 'WAITING_FOR_DOCTOR' || d.status === 'IN_CALL' ? 'Accepted' : d.status)
            : (d.status || 'Pending'),
          rawStatus: d.status || 'SUBMITTED',
          tokenNumber: d.token_number || null,
          aiNote: d.symptoms || d.ai_note || d.reason || d.asha_notes || 'Referred for specialist medical care',
          symptoms: d.symptoms,
          vitals: d.vitals,
          is_pregnant: (d.destination_department || d.department || '').toLowerCase().includes('maternity') || (d.destination_department || d.department || '').toLowerCase().includes('anc'),
          rawCreatedAt: d.created_at || new Date().toISOString(),
          created_at: d.created_at || new Date().toISOString(),
          createdAt: new Date(d.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }));
        setReferrals(mapped);
      } else {
        setReferrals([]);
      }
    } catch (err) {
      console.error("[ReferralsDashboard] Unexpected fetch error:", err);
      setErrorMsg(`Failed to load referrals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();

    const channel = supabase.channel('referrals_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        fetchReferrals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewReferral = (newReferralData) => {
    const nowIso = new Date().toISOString();
    const mapped = {
      id: newReferralData.id || `ref-${Date.now()}`,
      patientName: newReferralData.patient_name || 'Village Resident',
      patientId: newReferralData.patient_id ? String(newReferralData.patient_id).slice(0, 8).toUpperCase() : 'ABHA-PAT',
      patient_id: newReferralData.patient_id,
      destination_facility_id: newReferralData.destination_facility_id,
      createdBy: newReferralData.created_by || 'ASHA Worker',
      department: newReferralData.destination_department || newReferralData.department || 'General Medicine & OPD',
      hospital: newReferralData.destination_hospital || newReferralData.facility || 'Pune Sassoon General Hospital',
      doctor: newReferralData.doctor_assigned || 'On-Duty Medical Officer',
      priority: newReferralData.priority === 'HIGH' || newReferralData.priority === 'RED' ? 'RED' : 'GREEN',
      status: newReferralData.status || 'Pending',
      rawStatus: newReferralData.status || 'SUBMITTED',
      aiNote: newReferralData.symptoms || newReferralData.reason || newReferralData.asha_notes || 'Referred for specialist evaluation',
      symptoms: newReferralData.symptoms,
      vitals: newReferralData.vitals,
      is_pregnant: newReferralData.destination_department?.toLowerCase().includes('maternity') || newReferralData.destination_department?.toLowerCase().includes('anc'),
      rawCreatedAt: nowIso,
      created_at: nowIso,
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

  const handleDeleteReferral = async (referralTarget) => {
    const targetId = typeof referralTarget === 'object' ? referralTarget.id : referralTarget;
    const targetObj = typeof referralTarget === 'object' ? referralTarget : referrals.find(r => r.id === targetId);

    if (!targetId) return;

    try {
      // 1. Delete canonical record from public.referrals
      const { error: delErr } = await supabase
        .from('referrals')
        .delete()
        .eq('id', targetId);

      if (delErr) {
        console.error("[ReferralsDashboard] Failed to delete referral from Supabase:", delErr);
        throw new Error(delErr.message);
      }

      // 2. Best-effort cascading cleanup of matching care_requests
      try {
        const patientRef = targetObj?.patient_id;
        if (patientRef) {
          await supabase
            .from('care_requests')
            .delete()
            .or(`id.eq.${targetId},and(patient_id.eq.${patientRef},status.neq.COMPLETED)`);
        } else {
          await supabase
            .from('care_requests')
            .delete()
            .eq('id', targetId);
        }
      } catch (cErr) {
        console.warn("[ReferralsDashboard] care_requests cleanup notice:", cErr?.message);
      }

      // 3. Best-effort unlinking of encounters
      try {
        await supabase
          .from('encounters')
          .update({ referral_id: null })
          .eq('referral_id', targetId);
      } catch (eErr) {
        console.warn("[ReferralsDashboard] encounters unlinking notice:", eErr?.message);
      }

      // 4. Update React state immediately
      setReferrals(prev => prev.filter(r => r.id !== targetId));
      setSuccessMsg(
        lang === 'mr'
          ? "रेफरल यशस्वीरित्या काढून टाकले आहे."
          : lang === 'hi'
          ? "रेफरल सफलतापूर्वक हटा दिया गया है।"
          : "Referral removed successfully across all hospital and frontline queues."
      );

      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error("[ReferralsDashboard] Delete error:", err);
      setErrorMsg(`Could not delete referral: ${err.message}`);
      setTimeout(() => {
        setErrorMsg('');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] font-sans text-slate-800 pb-20">
      
      {/* ── Top Bar: Shown when in New Referral form mode ── */}
      {activeTab === 'new' && (
        <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-xs">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? '← सर्व रेफरल यादी' : lang === 'hi' ? '← सभी रेफरल सूची' : '← Back to Referrals'}</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                {lang === 'mr' ? 'मुख्य पान' : lang === 'hi' ? 'होम' : 'Home'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="max-w-3xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMsg && (
        <div className="max-w-3xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs font-bold text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'new' ? (
          <TriageForm
            onSubmit={handleNewReferral}
            onCancel={() => setActiveTab('list')}
            demoMode={demoMode}
          />
        ) : (
          <ReferralList
            referrals={referrals}
            onCreateNew={() => setActiveTab('new')}
            onDeleteReferral={handleDeleteReferral}
            onBack={onBack}
            onRefresh={fetchReferrals}
          />
        )}
      </div>

    </div>
  );
}
