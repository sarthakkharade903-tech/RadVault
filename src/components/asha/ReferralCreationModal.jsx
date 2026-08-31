import React, { useState, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  X,
  Loader2,
  Send,
  Navigation,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DEPARTMENTS } from '../../data/mockReferrals';
import { createEncounter } from '../../services/encounterService';
import { supabase } from '../../services/supabase';
import { getCurrentLocation, getOfflineGovHospitals } from '../../services/locationService';

export default function ReferralCreationModal({
  isOpen,
  onClose,
  encounterContext,
  onReferralSuccess,
  isDemoMode = false,
  ashaProfile = null
}) {
  const [hospitals, setHospitals] = useState([]);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);
  const [isOfflineDirectory, setIsOfflineDirectory] = useState(false);
  const [hospital, setHospital] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [doctorAssigned] = useState('On-Duty Specialist');
  const [urgencyNotes, setUrgencyNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('3');
  const [ashaAccompanying, setAshaAccompanying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch facilities: Online first, with Offline Government Directory + GPS Distance fallback
  useEffect(() => {
    if (!isOpen) return;

    const fetchFacilities = async () => {
      setFetchingHospitals(true);
      setIsOfflineDirectory(false);

      try {
        const { data: dbFacilities, error: dbErr } = await supabase
          .from('facilities')
          .select('id, name, district')
          .order('name');

        if (!dbErr && dbFacilities && dbFacilities.length > 0) {
          setHospitals(dbFacilities);
          const defaultFac = dbFacilities.find(f => f.name.includes('Shrirampur')) || dbFacilities[0];
          setHospital(defaultFac.name);
          setSelectedFacilityId(defaultFac.id);
        } else {
          throw new Error('Using offline government facility directory');
        }
      } catch (err) {
        console.warn('Online facility lookup unavailable, activating offline government directory:', err?.message || err);
        setIsOfflineDirectory(true);

        // Calculate GPS distance from offline bundled dataset
        const userLoc = await getCurrentLocation();
        const offlineList = getOfflineGovHospitals(userLoc.lat, userLoc.lon);

        const mapped = offlineList.map(h => ({
          id: h.id,
          name: h.name,
          district: h.district,
          type: h.type,
          distanceKm: h.distanceKm
        }));

        setHospitals(mapped);
        if (mapped.length > 0) {
          setHospital(mapped[0].name);
          setSelectedFacilityId(mapped[0].id);
        }
      } finally {
        setFetchingHospitals(false);
      }
    };

    fetchFacilities();
  }, [isOpen]);

  if (!isOpen || !encounterContext) return null;

  const {
    patient,
    complaint,
    symptoms,
    symptomNotes,
    vitals,
    relevantHistory,
    dangerSigns,
    triageResult
  } = encounterContext;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospital) {
      setError('Please select a destination hospital.');
      return;
    }
    if (!department) {
      setError('Please select a clinical department.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + parseInt(followUpDays || 3));

      const escortNote = ashaAccompanying ? ' [ASHA ACCOMPANYING PATIENT / ESCORTED REFERRAL]' : '';

      const newEncounter = await createEncounter({
        patient,
        complaint: complaint || 'Specialist Referral',
        symptoms: typeof symptoms === 'string' ? [symptoms] : symptoms,
        symptomNotes: `${symptomNotes || ''}. Referral Reason: ${urgencyNotes}${escortNote}`,
        vitals,
        relevantHistory,
        dangerSigns,
        priority: triageResult?.priority || 'HIGH',
        priorityLabel: triageResult?.priorityLabel || 'Emergency / Urgent',
        aiNote: triageResult?.note || '',
        actionType: 'REFERRAL',
        referralData: {
          hospital,
          facilityId: selectedFacilityId,
          department,
          doctor: doctorAssigned,
          ashaAccompanying: ashaAccompanying ? true : false,
          followUpDate: followUpDate.toISOString().slice(0, 10)
        },
        ashaWorkerId: ashaProfile?.id || null,
        ashaWorkerName: ashaProfile?.name || ashaProfile?.worker_id || 'ASHA Worker',
        isDemoMode
      });

      onReferralSuccess(newEncounter);
      onClose();
    } catch (err) {
      console.error('Failed to create referral:', err);
      setError(`Referral creation error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#008080] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Create Specialist Referral</h2>
              <p className="text-xs text-white/80">Route encounter to secondary / tertiary facility</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
            aria-label="Close referral creation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Patient Context Review Strip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="font-extrabold text-[#212121]">{patient.full_name || patient.name}</span>
              <span className="font-mono text-slate-400 ml-2">ID: {patient.unified_id || patient.id}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
              triageResult?.priority === 'HIGH' || triageResult?.priority === 'RED'
                ? 'bg-rose-100 text-rose-800'
                : triageResult?.priority === 'ORANGE'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              Priority: {triageResult?.priorityLabel || triageResult?.priority || 'URGENT'}
            </span>
          </div>

          {/* Destination Hospital / Facility */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#008080]" />
                Destination Hospital / Facility *
              </label>
              {isOfflineDirectory ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-amber-700" /> Offline Directory (GPS Ranked)
                </span>
              ) : fetchingHospitals ? (
                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading facilities...
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Live Facilities
                </span>
              )}
            </div>

            <select
              value={selectedFacilityId}
              onChange={(e) => {
                const facId = e.target.value;
                setSelectedFacilityId(facId);
                const matched = hospitals.find(h => h.id === facId);
                if (matched) setHospital(matched.name);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-bold outline-none"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.distanceKm ? `· ${h.distanceKm} km (${h.type || h.district})` : h.district ? `(${h.district})` : ''}
                </option>
              ))}
            </select>

            {isOfflineDirectory && (
              <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Using offline government facility directory (Satara/Pune district dataset) with GPS distance sorting.</span>
              </p>
            )}
          </div>

          {/* Specialty Department */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-[#008080]" />
              Specialist Clinical Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-bold outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* ASHA Escort / Maternal Support Flag (Feature 5) */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            ashaAccompanying ? 'bg-rose-50/90 border-rose-300' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ashaAccompanying}
                onChange={(e) => setAshaAccompanying(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#008080] rounded border-slate-300 focus:ring-[#008080] cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  ASHA Accompanying Patient
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5 font-medium leading-relaxed">
                  Flag for hospital intake reception. May support maternal referral coordination & institutional delivery handover.
                </span>
              </div>
            </label>
          </div>

          {/* Referral Urgency / Instructions */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Referral Reason / Clinical Handover Notes
            </label>
            <textarea
              rows={2}
              value={urgencyNotes}
              onChange={(e) => setUrgencyNotes(e.target.value)}
              placeholder="e.g. Needs immediate ECG & cardiac evaluation. Patient family notified of emergency transport."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-medium outline-none"
            />
          </div>

          {/* Follow-up Expected In (Days) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Expected Visit Timeline
              </label>
              <select
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
              >
                <option value="1">Within 24 Hours (Immediate)</option>
                <option value="3">Within 3 Days</option>
                <option value="7">Within 7 Days (Routine)</option>
                <option value="14">Within 14 Days</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                ASHA Follow-up Due
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                {(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + parseInt(followUpDays || 3));
                  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                })()}
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Routing Referral…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  Submit & Route Referral →
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
