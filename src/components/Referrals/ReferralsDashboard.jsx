import React, { useState, useEffect } from 'react';
import ReferralList from './ReferralList';
import TriageForm from './TriageForm';
import { supabase } from '../../services/supabase';

export default function ReferralsDashboard({ onBack }) {
  const [isCreating, setIsCreating] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load referrals from Supabase on mount
  useEffect(() => {
    async function fetchReferrals() {
      setLoading(true);
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching referrals:", error);
      } else if (data) {
        // Map snake_case from DB to camelCase for UI compatibility if needed,
        // or just use DB fields directly. The ReferralList expects some specific names:
        const mapped = data.map(d => ({
          id: d.id,
          patientName: d.patient_name || 'Beneficiary',
          patientId: d.patient_id,
          createdBy: d.created_by,
          department: d.destination_department,
          hospital: d.destination_hospital,
          doctor: d.doctor_assigned,
          priority: d.priority,
          priorityLabel: d.priority_label,
          status: d.status,
          symptoms: d.symptoms,
          vitals: d.vitals,
          aiNote: d.ai_note,
          createdAt: new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }));
        setReferrals(mapped);
      }
      setLoading(false);
    }
    fetchReferrals();
  }, []);

  const handleNewReferral = async (newReferralData) => {
    // 1. Insert into Supabase
    const { data, error } = await supabase
      .from('referrals')
      .insert([newReferralData])
      .select();

    if (error) {
      console.error("Error saving referral:", error);
      alert("Failed to save to database. Check console for details.");
      return;
    }

    // 2. Add new referral to the top of the local list
    if (data && data.length > 0) {
      const d = data[0];
      const mapped = {
        id: d.id,
        patientName: d.patient_name,
        patientId: d.patient_id,
        createdBy: d.created_by,
        department: d.destination_department,
        hospital: d.destination_hospital,
        doctor: d.doctor_assigned,
        priority: d.priority,
        priorityLabel: d.priority_label,
        status: d.status,
        symptoms: d.symptoms,
        vitals: d.vitals,
        aiNote: d.ai_note,
        createdAt: new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      };
      setReferrals((prev) => [mapped, ...prev]);
    }

    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <TriageForm
        onSubmit={handleNewReferral}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <ReferralList
      referrals={referrals}
      onCreateNew={() => setIsCreating(true)}
      onBack={onBack}
    />
  );
}
