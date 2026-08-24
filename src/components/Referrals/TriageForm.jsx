import React, { useState } from 'react';
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
} from 'lucide-react';
import { HOSPITALS, DEPARTMENTS } from '../../data/mockReferrals';

// ─── AI Triage Engine (Rule-based simulation) ─────────────────────────────────

function runAITriage({ symptoms, bp, spo2, temp, pulse }) {
  // Convert to numbers
  const spo2Val = parseFloat(spo2);
  const tempVal = parseFloat(temp);
  const systolic = parseInt((bp || '').split('/')[0]);
  const pulseVal = parseFloat(pulse);
  const symsLower = (symptoms || '').toLowerCase();

  // Emergency keywords
  const emergencyKeywords = ['unconscious', 'bleeding', 'paralysis', 'stroke', 'heart attack', 'not breathing', 'seizure', 'pregnant bleeding'];
  const urgentKeywords = ['chest pain', 'chest tightness', 'shortness of breath', 'dizziness', 'high fever', 'vomiting', 'severe pain'];

  if (
    (spo2Val && spo2Val < 94) ||
    (systolic && systolic < 90) ||
    (tempVal && tempVal > 103) ||
    (pulseVal && pulseVal > 120) ||
    emergencyKeywords.some((kw) => symsLower.includes(kw))
  ) {
    return {
      priority: 'RED',
      label: '🔴 RED — Immediate Emergency',
      note: 'Critical vitals detected. Patient requires immediate emergency attention. Referral to nearest District Hospital is strongly recommended within 1 hour.',
      recommendation: 'Emergency & Trauma / Nearest Referral Hospital',
    };
  }

  if (
    (spo2Val && spo2Val < 97) ||
    (systolic && systolic > 140) ||
    (tempVal && tempVal > 100.4) ||
    (pulseVal && pulseVal > 100) ||
    urgentKeywords.some((kw) => symsLower.includes(kw))
  ) {
    return {
      priority: 'ORANGE',
      label: '🟡 ORANGE — Urgent, Within 24 Hours',
      note: 'Elevated readings suggest an urgent condition. Specialist consultation is recommended within 24 hours. Monitor the patient closely.',
      recommendation: 'Specialist Consultation at District Hospital',
    };
  }

  return {
    priority: 'GREEN',
    label: '🟢 GREEN — Routine, Within 7 Days',
    note: 'Stable vitals and non-critical symptoms. Patient can be scheduled for a routine outpatient consultation at the nearest PHC or district hospital.',
    recommendation: 'Outpatient / Primary Health Centre',
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

// ─── AI Result Badge ──────────────────────────────────────────────────────────

const RESULT_STYLES = {
  RED: 'bg-[#FFF5F5] border-[#D32F2F]/50 text-[#D32F2F]',
  ORANGE: 'bg-[#FFFDF5] border-[#FF9933]/60 text-[#b35900]',
  GREEN: 'bg-[#F1F8F1] border-[#2E7D32]/40 text-[#2E7D32]',
};

// ─── TriageForm Main ──────────────────────────────────────────────────────────

export default function TriageForm({ onSubmit, onCancel }) {
  const [symptoms, setSymptoms] = useState('');
  const [bp, setBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleRunAI = () => {
    if (!symptoms.trim()) {
      setError('Please describe the patient symptoms before running AI triage.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setAiResult(null);

    // Simulate a 1.8 second AI processing delay for demo effect
    setTimeout(() => {
      const result = runAITriage({ symptoms, bp, spo2, temp, pulse });
      setAiResult(result);
      setIsAnalyzing(false);
    }, 1800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptoms.trim()) { setError('Symptoms are required.'); return; }
    if (!hospital) { setError('Please select a destination hospital.'); return; }
    if (!department) { setError('Please select a department.'); return; }
    if (!aiResult) { setError('Please run the AI triage analysis before submitting.'); return; }
    setError('');

    const newReferral = {
      id: `REF-${String(Math.floor(Math.random() * 900) + 100)}`,
      patientName: 'Rajesh Kumar',
      patientId: 'MH-P-10482',
      createdBy: 'ASHA Worker: You',
      department,
      hospital,
      doctor: 'To be assigned',
      priority: aiResult.priority,
      priorityLabel: aiResult.priority === 'RED' ? 'Emergency' : aiResult.priority === 'ORANGE' ? 'Urgent' : 'Routine',
      status: 'Pending',
      symptoms,
      vitals: { bp, spo2, temp, pulse },
      aiNote: aiResult.note,
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
          <p className="text-xs text-[#555555]">Record vitals, get AI priority, send to specialist</p>
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
            Step 3: AI Triage Analysis
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
                Analyzing symptoms & vitals…
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
            Step 4: Route to Specialist
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#555555] uppercase tracking-wide block mb-1.5">
                Destination Hospital *
              </label>
              <select
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-2.5 text-sm text-[#212121] bg-white transition-colors"
              >
                <option value="">— Select Hospital —</option>
                {HOSPITALS.map((h) => <option key={h} value={h}>{h}</option>)}
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
            Generate & Submit Referral
          </button>
        </div>
      </form>
    </div>
  );
}
