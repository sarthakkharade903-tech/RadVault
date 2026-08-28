import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Heart,
  Wind,
  Thermometer,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { createEncounter } from '../../services/encounterService';

const COMMON_COMPLAINTS = [
  { id: 'fever', label: 'Fever', icon: '🌡️' },
  { id: 'cough', label: 'Cough', icon: '💨' },
  { id: 'chest_pain', label: 'Chest Pain', icon: '❤️' },
  { id: 'breathlessness', label: 'Shortness of Breath', icon: '🫁' },
  { id: 'weakness', label: 'Severe Weakness / Fatigue', icon: '⚡' },
  { id: 'headache', label: 'Severe Headache', icon: '🧠' },
  { id: 'injury', label: 'Trauma / Injury / Fall', icon: '🩹' },
  { id: 'abdominal', label: 'Abdominal Pain', icon: '🩺' },
  { id: 'vomiting', label: 'Vomiting / Nausea', icon: '🤢' },
  { id: 'diarrhea', label: 'Diarrhea / Dehydration', icon: '💧' }
];

const DANGER_SIGNS_LIST = [
  { id: 'ds_breathing', label: 'Severe breathing difficulty, gasping, or stridor', severity: 'HIGH' },
  { id: 'ds_chest', label: 'Crushing chest pain, pressure, or radiating pain to arm/jaw', severity: 'HIGH' },
  { id: 'ds_consciousness', label: 'Altered consciousness, fainting, confusion, or unresponsiveness', severity: 'HIGH' },
  { id: 'ds_bleeding', label: 'Severe active bleeding or uncontrolled hemorrhage', severity: 'HIGH' },
  { id: 'ds_spo2', label: 'Low oxygen saturation (SpO₂ < 94%)', severity: 'HIGH' },
  { id: 'ds_fever_stiff', label: 'Continuous high fever (> 103°F) with neck stiffness or seizure', severity: 'HIGH' },
  { id: 'ds_cyanosis', label: 'Cyanosis (blue lips/face) or cold clammy skin', severity: 'HIGH' },
  { id: 'ds_dehydration', label: 'Severe dehydration (inability to drink/breastfeed, lethargy)', severity: 'HIGH' }
];

// ─── Deterministic Fallback ──────────────────────────────────────────────────
function runDeterministicFallback({ symptoms, spo2, temp }) {
  const spo2Num = parseFloat(spo2);
  const tempNum = parseFloat(temp);
  const hasChestPain = symptoms.toLowerCase().includes('chest');

  if ((spo2Num && spo2Num < 94) || hasChestPain) {
    return {
      priority: 'HIGH',
      priorityLabel: '🔴 RED — Immediate Emergency',
      note: 'Clinical parameters indicate immediate hospital evaluation required.',
      recommendation: 'Emergency & Trauma',
      source: 'Protocol Rules Engine'
    };
  }
  if ((tempNum && tempNum >= 101) || symptoms.toLowerCase().includes('breath')) {
    return {
      priority: 'ORANGE',
      priorityLabel: '🟡 ORANGE — Urgent, Within 24 Hours',
      note: 'Elevated physiological markers. Specialist consultation recommended within 24 hours.',
      recommendation: 'Specialist Consultation',
      source: 'Protocol Rules Engine'
    };
  }
  return {
    priority: 'GREEN',
    priorityLabel: '🟢 GREEN — Routine, Within 7 Days',
    note: 'Stable physiological indicators. Primary health center / routine follow-up appropriate.',
    recommendation: 'Primary Health Center',
    source: 'Protocol Rules Engine'
  };
}

async function runAITriage({ symptoms, bp, spo2, temp, pulse, dangerSigns = [], patientAge, patientGender, isDemoMode }) {
  // If danger signs are actively flagged, prioritize emergency deterministically
  if (dangerSigns.length > 0) {
    return {
      priority: 'HIGH',
      priorityLabel: '🔴 RED — Immediate Emergency',
      note: `Critical danger signs identified (${dangerSigns.join(', ')}). Immediate hospital transfer recommended.`,
      recommendation: 'Emergency & Trauma',
      source: 'Clinical Danger Screening Protocol'
    };
  }

  // If in Demo Mode, bypass network backend
  if (isDemoMode) {
    return runDeterministicFallback({ symptoms, bp, spo2, temp, pulse });
  }

  // 1. Attempt Backend Gemini Proxy Triage
  try {
    const response = await fetch('/api/triage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symptoms,
        bp,
        spo2,
        temp,
        pulse,
        dangerSigns,
        patientAge,
        patientGender
      })
    });

    if (response.ok) {
      const data = await response.json();
      const labels = {
        RED: '🔴 RED — Immediate Emergency',
        ORANGE: '🟡 ORANGE — Urgent, Within 24 Hours',
        GREEN: '🟢 GREEN — Routine, Within 7 Days'
      };

      return {
        priority: data.priority === 'RED' ? 'HIGH' : data.priority,
        priorityLabel: labels[data.priority] || labels.GREEN,
        note: data.explanation || 'Stable vital parameters.',
        recommendation: data.priority === 'RED' ? 'Emergency & Trauma' : 'Specialist Consultation',
        source: 'Google Gemini 1.5 Triage Model'
      };
    } else {
      console.warn(`Backend triage API failed with status ${response.status}`);
    }
  } catch (err) {
    console.warn('Backend Gemini triage failed:', err.message);
  }

  // 2. Fallback to client-side Groq Triage if Groq key exists
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (GROQ_API_KEY) {
    try {
      const prompt = `
You are an expert AI Triage assistant for a frontline rural health worker (ASHA) in India.
Analyze the following patient encounter:
Patient: ${patientAge || 'Adult'} yrs, ${patientGender || 'Beneficiary'}
Symptoms: ${symptoms}
Vitals: BP: ${bp || 'N/A'}, SpO2: ${spo2 || 'N/A'}%, Temp: ${temp || 'N/A'}F, Pulse: ${pulse || 'N/A'}bpm
Danger Signs Flagged: ${dangerSigns.length > 0 ? dangerSigns.join(', ') : 'None'}

Output EXACTLY AND ONLY a valid JSON object with the following schema:
{
  "priority": "RED" | "ORANGE" | "GREEN",
  "note": "A clear, 2-sentence medical summary explaining the priority and recommendation."
}
`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        const labels = {
          RED: '🔴 RED — Immediate Emergency',
          ORANGE: '🟡 ORANGE — Urgent, Within 24 Hours',
          GREEN: '🟢 GREEN — Routine, Within 7 Days'
        };

        return {
          priority: parsed.priority === 'RED' ? 'HIGH' : parsed.priority,
          priorityLabel: labels[parsed.priority] || labels.GREEN,
          note: parsed.note,
          recommendation: parsed.priority === 'RED' ? 'Emergency & Trauma' : 'Specialist Consultation',
          source: 'Groq Llama-3 Triage Model (Client Fallback)'
        };
      }
    } catch (err) {
      console.warn('Client-side Groq fallback failed:', err.message);
    }
  }

  // 3. Fallback to deterministic rules
  return runDeterministicFallback({ symptoms, bp, spo2, temp, pulse });
}

export default function EncounterWizard({
  patient,
  onCancel,
  onEncounterCompleted,
  onRequestReferral,
  isDemoMode = false,
  ashaProfile = null
}) {
  const [step, setStep] = useState(1); // 1: Complaints, 2: Vitals, 3: Danger Signs, 4: Triage

  // Step 1: Complaints & Symptoms
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [symptomNotes, setSymptomNotes] = useState('');

  // Step 2: Vitals & History
  const [temp, setTemp] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [respRate, setRespRate] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(
    (patient?.vitals?.conditions) || []
  );

  // Step 3: Danger Signs
  const [dangerSigns, setDangerSigns] = useState([]);

  // Step 4: Triage & AI Result
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [localAdviceNotes, setLocalAdviceNotes] = useState('');
  const [localFollowUpDays, setLocalFollowUpDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const patientId = patient.unified_id || patient.id;
  const patientName = patient.full_name || patient.name || 'Beneficiary';

  const toggleComplaint = (id) => {
    setSelectedComplaints((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleDangerSign = (label) => {
    setDangerSigns((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const toggleHistory = (item) => {
    setSelectedHistory((prev) =>
      prev.includes(item) ? prev.filter((h) => h !== item) : [...prev, item]
    );
  };

  // Run Triage Analysis
  const handleRunTriage = async () => {
    setIsAnalyzing(true);
    setError('');
    try {
      const compiledSymptoms = [
        ...selectedComplaints.map((c) => COMMON_COMPLAINTS.find((x) => x.id === c)?.label || c),
        symptomNotes.trim()
      ].filter(Boolean).join(', ');

      const result = await runAITriage({
        symptoms: compiledSymptoms || 'General checkup',
        bp,
        spo2,
        temp,
        pulse,
        dangerSigns,
        patientAge: patient.age,
        patientGender: patient.gender,
        isDemoMode
      });

      setTriageResult(result);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(`Triage analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Complete with Local Advice (No Referral)
  const handleSaveLocalAdvice = async () => {
    setIsSubmitting(true);
    try {
      const compiledSymptoms = [
        ...selectedComplaints.map((c) => COMMON_COMPLAINTS.find((x) => x.id === c)?.label || c),
        symptomNotes.trim()
      ].filter(Boolean);

      let followUpDateStr = null;
      if (localFollowUpDays && localFollowUpDays !== 'none') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(localFollowUpDays));
        followUpDateStr = d.toISOString().slice(0, 10);
      }

      const encounter = await createEncounter({
        patient,
        complaint: compiledSymptoms[0] || 'Health Checkup',
        symptoms: compiledSymptoms,
        symptomNotes: `${symptomNotes}. Local Advice: ${localAdviceNotes}`,
        vitals: { bp, pulse, spo2, temp, respRate, weight },
        relevantHistory: selectedHistory,
        dangerSigns,
        priority: triageResult?.priority || 'LOW',
        priorityLabel: triageResult?.priorityLabel || 'Routine',
        aiNote: triageResult?.note || '',
        actionType: 'LOCAL_ADVICE',
        followUpDate: followUpDateStr,
        followUpReason: localAdviceNotes ? `Review: ${localAdviceNotes.slice(0, 50)}` : 'Follow-up health review',
        referralData: null,
        ashaWorkerId: ashaProfile?.id || null,
        ashaWorkerName: ashaProfile?.name || ashaProfile?.worker_id || 'ASHA Worker',
        isDemoMode
      });

      onEncounterCompleted(encounter);
    } catch (err) {
      console.error('Failed to save encounter:', err);
      setError(`Error saving encounter: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Referral Flow
  const handleTriggerReferral = () => {
    const compiledSymptoms = [
      ...selectedComplaints.map((c) => COMMON_COMPLAINTS.find((x) => x.id === c)?.label || c),
      symptomNotes.trim()
    ].filter(Boolean);

    onRequestReferral({
      patient,
      complaint: compiledSymptoms[0] || 'Care Referral',
      symptoms: compiledSymptoms.join(', '),
      symptomNotes,
      vitals: { bp, pulse, spo2, temp, respRate, weight },
      relevantHistory: selectedHistory,
      dangerSigns,
      triageResult
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* ── Active Patient Encounter Header ── */}
      <div className="bg-[#008080] text-white rounded-3xl p-5 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center font-black text-xl shrink-0">
            {patientName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-base">{patientName}</span>
              <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded font-bold">
                {patientId}
              </span>
              {patient.age && <span className="text-xs text-white/90">{patient.age} yrs</span>}
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Active Encounter · Frontline Care Intake
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Cancel Encounter
        </button>
      </div>

      {/* ── Step Progress Indicator ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: 'Complaints' },
          { num: 2, label: 'Vitals & History' },
          { num: 3, label: 'Danger Signs' },
          { num: 4, label: 'Triage & Action' },
        ].map(({ num, label }) => {
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div
              key={num}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                isActive
                  ? 'bg-white border-[#008080] shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                  isActive
                    ? 'bg-[#008080] text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isDone ? '✓' : num}
                </span>
                <span className="text-xs font-extrabold hidden sm:inline">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Presenting Complaints & Symptoms ── */}
      {step === 1 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-extrabold text-[#212121]">1. Presenting Complaints & Symptoms</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select common symptoms reported by the patient or enter specific details.</p>
          </div>

          {/* Quick-select Symptom Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {COMMON_COMPLAINTS.map(({ id, label, icon }) => {
              const isSelected = selectedComplaints.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleComplaint(id)}
                  className={`p-3 rounded-2xl text-left font-bold text-xs flex items-center gap-2.5 transition-all border-2 ${
                    isSelected
                      ? 'bg-[#FFF5EB] border-[#FF9933] text-[#b35900] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="truncate">{label}</span>
                  {isSelected && <span className="ml-auto text-xs font-black">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Detailed Symptom Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Specific Clinical Notes / Onset Duration
            </label>
            <textarea
              rows={3}
              value={symptomNotes}
              onChange={(e) => setSymptomNotes(e.target.value)}
              placeholder="e.g. Cough with fever for 3 days, mild exertion breathlessness since morning..."
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-2xl text-xs font-medium outline-none transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (selectedComplaints.length === 0 && !symptomNotes.trim()) {
                  setError('Please select or describe at least one presenting complaint.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              Continue to Vitals →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Vitals & Relevant History ── */}
      {step === 2 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-extrabold text-[#212121]">2. Physiological Vitals & History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Record vital parameters measured during this checkup.</p>
          </div>

          {/* Vitals Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[#FF9933]" />
                  Temperature (°F)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">97.8 - 99.1 °F</span>
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 98.6"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-[#212121] outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  Blood Pressure
                </label>
                <span className="text-[10px] text-slate-400 font-medium">120/80 mmHg</span>
              </div>
              <input
                type="text"
                placeholder="e.g. 120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-[#212121] outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-700" />
                  Pulse (bpm)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">60 - 100 bpm</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-[#212121] outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-600" />
                  SpO₂ (%)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">95 - 100%</span>
              </div>
              <input
                type="number"
                min="50"
                max="100"
                placeholder="e.g. 98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-[#212121] outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Resp. Rate (/min)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">12 - 20 /min</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 18"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-[#212121] outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Weight (kg)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Body mass</span>
              </div>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-[#212121] outline-none"
              />
            </div>
          </div>

          {/* Relevant Conditions Toggles */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Confirmed Relevant History
            </label>
            <div className="flex flex-wrap gap-2">
              {['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Pregnancy', 'Tuberculosis'].map((cond) => {
                const isSelected = selectedHistory.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleHistory(cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#008080] text-white border-[#008080] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep(3);
              }}
              className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Continue to Danger Signs Screening →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Danger Signs Screening ── */}
      {step === 3 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#212121]">3. Red-Flag Danger Signs Screening</h2>
              <p className="text-xs text-slate-500 mt-0.5">Check if ANY critical emergency danger signs are present.</p>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              Emergency Protocol
            </span>
          </div>

          {/* Danger Signs Checklist */}
          <div className="space-y-2.5">
            {DANGER_SIGNS_LIST.map(({ id, label }) => {
              const isChecked = dangerSigns.includes(label);
              return (
                <div
                  key={id}
                  onClick={() => toggleDangerSign(label)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    isChecked
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by div click
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                  <span className="text-xs font-extrabold leading-snug">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Emergency Alert Box if Danger Signs Checked */}
          {dangerSigns.length > 0 && (
            <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 space-y-1 animate-in zoom-in-95 duration-100">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Emergency Warning: {dangerSigns.length} Critical Danger Sign(s) Flagged
              </div>
              <p className="text-xs text-rose-800 font-medium">
                National Health Mission protocol requires immediate escalation and specialist hospital referral for these symptoms.
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleRunTriage}
              className="px-6 py-3 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Running AI Triage Analysis…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Generate AI Triage Recommendation →
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Digital Triage Result & ASHA Decision Action ── */}
      {step === 4 && triageResult && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base font-extrabold text-[#212121]">4. Digital Triage Assessment & Decision</h2>
            <p className="text-xs text-slate-500 mt-0.5">Review priority recommendation and select clinical care routing.</p>
          </div>

          {/* Priority Card */}
          <div className={`p-5 rounded-3xl border-2 space-y-2.5 ${
            triageResult.priority === 'HIGH'
              ? 'bg-rose-50 border-rose-400 text-rose-950'
              : triageResult.priority === 'ORANGE'
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-emerald-50 border-emerald-400 text-emerald-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Triage Priority Recommendation
              </span>
              <span className="text-[11px] font-mono font-bold opacity-75">
                {triageResult.source}
              </span>
            </div>

            <div className="text-xl font-black flex items-center gap-2">
              <span>{triageResult.priority === 'HIGH' ? '🔴 HIGH — Immediate Emergency' : triageResult.priority === 'ORANGE' ? '🟡 ORANGE — Urgent (Within 24h)' : '🟢 GREEN — Routine Care'}</span>
            </div>

            <p className="text-xs leading-relaxed font-medium">
              {triageResult.note}
            </p>
          </div>

          {/* AI Decision Support Disclaimer */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-[#008080] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              <strong>Clinical Decision Support Notice:</strong> This AI priority recommendation assists frontline screening. The final clinical triage decision, hospital routing, and treatment advice remains the responsibility of the ASHA worker and qualified medical professionals.
            </p>
          </div>

          {/* Local Care Advice input (if not referring immediately) */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                ASHA Local Advice / Home Care Notes
              </label>
              <input
                type="text"
                value={localAdviceNotes}
                onChange={(e) => setLocalAdviceNotes(e.target.value)}
                placeholder="e.g. Advised hydration, ORS, paracetamol for mild fever, visit PHC if symptoms persist..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-medium outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Schedule Frontline Follow-up
                </label>
                <select
                  value={localFollowUpDays}
                  onChange={(e) => setLocalFollowUpDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
                >
                  <option value="3">Within 3 Days (Check symptom resolution)</option>
                  <option value="7">Within 7 Days (Standard checkup)</option>
                  <option value="14">Within 14 Days (Chronic management)</option>
                  <option value="none">No immediate follow-up needed</option>
                </select>
              </div>

              {localFollowUpDays !== 'none' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Target Follow-up Date
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                    {(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + parseInt(localFollowUpDays || 7));
                      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decision Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary Action: Create Referral */}
            <button
              type="button"
              onClick={handleTriggerReferral}
              className="p-4 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Create Specialist / Hospital Referral →</span>
            </button>

            {/* Secondary Action: Record Local Advice */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveLocalAdvice}
              className="p-4 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Encounter…' : 'Record Local Advice & Complete'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
