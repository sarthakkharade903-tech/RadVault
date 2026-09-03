import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  ChevronLeft,
  AlertTriangle,
  Heart,
  Wind,
  Thermometer,
  Activity,
  Building2,
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { DEPARTMENTS } from '../../data/mockReferrals';
import { supabase } from '../../services/supabase';
import { assessVitalsPayload } from '../../utils/vitalsValidator';

// ─── Haversine Distance Formula ───────────────────────────────────────────────
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// ─── Groq AI Triage Engine ────────────────────────────────────────────────────
async function runAITriageWithGroq({ symptoms, bp, spo2, temp, pulse }) {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error("Missing VITE_GROQ_API_KEY in .env.local");
  }

  const prompt = `
You are an expert AI Triage assistant for a rural healthcare system.
Analyze the following patient data:
Symptoms: ${symptoms}
Blood Pressure: ${bp || 'Not recorded'}
SpO2: ${spo2 || 'Not recorded'}%
Temperature: ${temp || 'Not recorded'}°F
Pulse: ${pulse || 'Not recorded'} bpm

Output EXACTLY AND ONLY a valid JSON object with the following schema:
{
  "priority": "RED" | "ORANGE" | "GREEN",
  "note": "A clear, 2-sentence medical summary explaining the priority and recommendation."
}
Criteria:
RED: Emergency (heart attack, stroke, SpO2 < 94, severe bleeding, unconscious) -> Recommend Immediate ER
ORANGE: Urgent (high fever, severe pain, BP > 140, SpO2 94-96) -> Recommend specialist within 24h
GREEN: Routine (mild symptoms, stable vitals) -> Recommend routine OPD
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API returned ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  
  const labels = {
    RED: '🔴 RED — Immediate Emergency',
    ORANGE: '🟡 ORANGE — Urgent, Within 24 Hours',
    GREEN: '🟢 GREEN — Routine, Within 7 Days'
  };

  return {
    priority: parsed.priority,
    label: labels[parsed.priority] || labels.GREEN,
    note: parsed.note,
    recommendation: parsed.priority === 'RED' ? 'Emergency & Trauma' : 'Specialist Consultation',
  };
}

// ─── Input Field Helper ───────────────────────────────────────────────────────
function InputField({ label, icon: Icon, iconColor, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-[#555555] uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className={`w-4 h-4 ${iconColor || 'text-[#008080]'}`} />
          </div>
        )}
        <input
          {...props}
          className={`w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-2.5 text-sm text-[#212121] bg-white transition-colors ${Icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

const RESULT_STYLES = {
  RED: 'bg-[#FFF5F5] border-[#D32F2F]/50 text-[#D32F2F]',
  ORANGE: 'bg-[#FFFDF5] border-[#FF9933]/60 text-[#b35900]',
  GREEN: 'bg-[#F1F8F1] border-[#2E7D32]/40 text-[#2E7D32]',
};

// ─── TriageForm Main ──────────────────────────────────────────────────────────
export default function TriageForm({ onSubmit, onCancel }) {
  // Form State
  const [symptoms, setSymptoms] = useState('');
  const [bp, setBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');

  // Destination & Department
  const [hospital, setHospital] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [department, setDepartment] = useState('Cardiology');

  // GPS & Hospital state
  const [hospitals, setHospitals] = useState([]);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  // 1. Fetch verified facilities from Supabase
  useEffect(() => {
    const fetchFacilities = async () => {
      setFetchingHospitals(true);
      try {
        const { data: dbFacilities } = await supabase
          .from('facilities')
          .select('id, name, district')
          .order('name');

        if (dbFacilities && dbFacilities.length > 0) {
          setHospitals(dbFacilities);
          const defaultFac = dbFacilities.find(f => f.name.includes('Shrirampur')) || dbFacilities[0];
          setHospital(defaultFac.name);
          setSelectedFacilityId(defaultFac.id);
        } else {
          const fallback = [
            { id: 'f1111111-1111-1111-1111-111111111111', name: 'Shrirampur Primary Health Centre', district: 'Ahmednagar' },
            { id: 'f2222222-2222-2222-2222-222222222222', name: 'Pune Sassoon General Hospital', district: 'Pune' }
          ];
          setHospitals(fallback);
          setHospital(fallback[0].name);
          setSelectedFacilityId(fallback[0].id);
        }
      } catch (err) {
        console.warn('Facility load fallback in TriageForm:', err);
        const fallback = [
          { id: 'f1111111-1111-1111-1111-111111111111', name: 'Shrirampur Primary Health Centre', district: 'Ahmednagar' },
          { id: 'f2222222-2222-2222-2222-222222222222', name: 'Pune Sassoon General Hospital', district: 'Pune' }
        ];
        setHospitals(fallback);
        setHospital(fallback[0].name);
        setSelectedFacilityId(fallback[0].id);
      } finally {
        setFetchingHospitals(false);
      }
    };

    fetchFacilities();
  }, []);

  const handleRunAI = async () => {
    if (!symptoms.trim()) {
      setError('Please describe the patient symptoms before running AI triage.');
      return;
    }

    const vitalsCheck = assessVitalsPayload({ bp, spo2, temp, pulse });
    if (!vitalsCheck.canProceed) {
      setError(vitalsCheck.errors[0] || 'Physiologically impossible vitals measurement entered.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const result = await runAITriageWithGroq({ symptoms, bp, spo2, temp, pulse });
      setAiResult(result);
    } catch (err) {
      console.error(err);
      setError(`AI Triage Failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) { setError('Symptoms are required.'); return; }
    if (!hospital) { setError('Please select a destination hospital.'); return; }
    if (!department) { setError('Please select a department.'); return; }
    if (!aiResult) { setError('Please run the AI triage analysis before submitting.'); return; }

    const vitalsCheck = assessVitalsPayload({ bp, spo2, temp, pulse });
    if (!vitalsCheck.canProceed) {
      setError(vitalsCheck.errors[0] || 'Physiologically impossible vitals measurement entered.');
      return;
    }
    setError('');

    // Fetch patient or fallback to first patient in database
    let patientId = null;
    let patientName = 'Beneficiary';
    try {
      const { data: pat } = await supabase.from('patients').select('id, full_name').limit(1).maybeSingle();
      if (pat) {
        patientId = pat.id;
        patientName = pat.full_name;
      }
    } catch {
      // Ignored
    }

    // Format for Supabase `referrals` table
    const newReferral = {
      patient_id: patientId || '148d891f-83d1-4578-9eb2-f93f9de8cffd',
      patient_name: patientName,
      created_by: 'ASHA Worker: Frontline Triage',
      destination_facility_id: selectedFacilityId || 'f1111111-1111-1111-1111-111111111111',
      destination_hospital: hospital,
      destination_department: department,
      priority: aiResult.priority,
      priority_label: aiResult.priority === 'RED' ? 'Emergency' : aiResult.priority === 'ORANGE' ? 'Urgent' : 'Routine',
      status: 'Pending',
      symptoms: symptoms,
      vitals: { bp, spo2, temp, pulse },
      ai_note: aiResult.note,
    };

    onSubmit(newReferral);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#555555] transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-[#008080]">ASHA Triage & Referral</h2>
          <p className="text-xs text-[#555555]">Record vitals, get Groq AI priority, send to specialist</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Section 1: Symptoms ────────────────────────────── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-[#212121] flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-[#008080]" />
            Step 1: Clinical Symptoms
          </h3>
          <div>
            <label className="text-xs font-bold text-[#555555] uppercase tracking-wide block mb-1.5">
              Describe Patient Symptoms *
            </label>
            <textarea
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Chest tightness and shortness of breath since 2 days, mild fever..."
              className="w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-2.5 text-sm text-[#212121] bg-white resize-none transition-colors"
            />
          </div>
        </div>

        {/* ── Section 2: Vitals ─────────────────────────────── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-[#212121] flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#008080]" />
            Step 2: Record Vitals (optional but recommended)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Blood Pressure" icon={Heart} iconColor="text-[#D32F2F]" placeholder="e.g. 128/82" value={bp} onChange={(e) => setBp(e.target.value)} />
            <InputField label="SpO₂ Oxygen %" icon={Wind} iconColor="text-sky-500" placeholder="e.g. 97" type="number" min="70" max="100" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
            <InputField label="Temperature (°F)" icon={Thermometer} iconColor="text-[#FF9933]" placeholder="e.g. 99.4" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
            <InputField label="Pulse (bpm)" icon={Activity} iconColor="text-[#800000]" placeholder="e.g. 88" type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          </div>
        </div>

        {/* ── Section 3: AI Triage ─────────────────────────── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-[#212121] flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#FF9933]" />
            Step 3: Groq AI Triage Analysis
          </h3>

          <button
            type="button"
            onClick={handleRunAI}
            disabled={isAnalyzing}
            className="w-full py-3 bg-[#FF9933] hover:bg-[#e68a2e] active:bg-[#cc7a29] disabled:opacity-60 text-slate-900 font-extrabold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Llama 3 is analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                ✨ Run AI Triage Now
              </>
            )}
          </button>

          {/* AI Result */}
          {aiResult && (
            <div className={`mt-4 p-4 rounded-xl border-2 ${RESULT_STYLES[aiResult.priority]}`}>
              <p className="font-extrabold text-lg mb-1">{aiResult.label}</p>
              <p className="text-xs leading-relaxed opacity-90">{aiResult.note}</p>
              <div className="mt-2 pt-2 border-t border-current/20">
                <p className="text-xs font-bold">
                  💡 Suggested: {aiResult.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 4: Hospital Routing ───────────────────── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-[#212121] flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-[#800000]" />
            Step 4: Route to Specialist (Verified Facility)
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#555555] uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                Destination Hospital / Facility
                {fetchingHospitals && <Loader2 className="w-3 h-3 animate-spin text-[#008080]" />}
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  const facId = e.target.value;
                  setSelectedFacilityId(facId);
                  const matched = hospitals.find(h => h.id === facId);
                  if (matched) setHospital(matched.name);
                }}
                disabled={fetchingHospitals}
                className="w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-2.5 text-sm text-[#212121] bg-white transition-colors disabled:opacity-60"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.district ? `(${h.district})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#555555] uppercase tracking-wide block mb-1.5">
                Department / Specialty *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-2.5 text-sm text-[#212121] bg-white transition-colors"
              >
                <option value="">— Select Department —</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-[#FFF5F5] border border-[#D32F2F]/40 rounded-xl text-sm text-[#D32F2F] font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-[#800000] hover:bg-[#660000] text-white font-extrabold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save to Supabase & Submit
          </button>
        </div>
      </form>
    </div>
  );
}
