import React, { useState, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  X,
  Loader2,
  Send
} from 'lucide-react';
import { HOSPITALS, DEPARTMENTS } from '../../data/mockReferrals';
import { createEncounter } from '../../services/encounterService';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('Cardiology');
  const [doctorAssigned, setDoctorAssigned] = useState('On-Duty Specialist');
  const [urgencyNotes, setUrgencyNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch nearby hospitals using OpenStreetMap Overpass API
  useEffect(() => {
    if (!isOpen) return;

    const fetchHospitals = async (lat, lon) => {
      setFetchingHospitals(true);
      try {
        const query = `
          [out:json];
          (
            node["amenity"="hospital"](around:50000, ${lat}, ${lon});
            way["amenity"="hospital"](around:50000, ${lat}, ${lon});
            relation["amenity"="hospital"](around:50000, ${lat}, ${lon});
          );
          out center;
        `;
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();

        let found = data.elements
          .map((el) => {
            const hLat = el.lat || el.center?.lat;
            const hLon = el.lon || el.center?.lon;
            const dist = getDistanceFromLatLonInKm(lat, lon, hLat, hLon);
            return {
              name: el.tags?.name || 'Unnamed Hospital',
              distance: dist
            };
          })
          .filter((h) => h.name !== 'Unnamed Hospital')
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 15);

        if (found.length > 0) {
          setHospitals(found);
          setHospital(found[0].name);
        } else {
          setHospitals(HOSPITALS.map((h) => ({ name: h, distance: 12.5 })));
          setHospital(HOSPITALS[0]);
        }
      } catch (err) {
        console.warn('Overpass API fallback active:', err);
        setHospitals(HOSPITALS.map((h) => ({ name: h, distance: 15.0 })));
        setHospital(HOSPITALS[0]);
      } finally {
        setFetchingHospitals(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchHospitals(pos.coords.latitude, pos.coords.longitude),
        () => fetchHospitals(18.5204, 73.8567) // Fallback: Pune coordinates
      );
    } else {
      fetchHospitals(18.5204, 73.8567);
    }
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

      const newEncounter = await createEncounter({
        patient,
        complaint: complaint || 'Specialist Referral',
        symptoms: typeof symptoms === 'string' ? [symptoms] : symptoms,
        symptomNotes: `${symptomNotes || ''}. Referral Reason: ${urgencyNotes}`,
        vitals,
        relevantHistory,
        dangerSigns,
        priority: triageResult?.priority || 'HIGH',
        priorityLabel: triageResult?.priorityLabel || 'Emergency / Urgent',
        aiNote: triageResult?.note || '',
        actionType: 'REFERRAL',
        referralData: {
          hospital,
          department,
          doctor: doctorAssigned,
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
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
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
              triageResult?.priority === 'HIGH'
                ? 'bg-rose-100 text-rose-800'
                : triageResult?.priority === 'ORANGE'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              Priority: {triageResult?.priorityLabel || triageResult?.priority || 'URGENT'}
            </span>
          </div>

          {/* Destination Hospital (GPS Discovery) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#008080]" />
                Destination Hospital (Nearby GPS) *
              </span>
              {fetchingHospitals && (
                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Discovering nearby...
                </span>
              )}
            </label>
            <select
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-bold outline-none"
            >
              {hospitals.map((h, idx) => (
                <option key={idx} value={h.name}>
                  {h.name} {h.distance ? `(${h.distance.toFixed(1)} km away)` : ''}
                </option>
              ))}
            </select>
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
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
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
