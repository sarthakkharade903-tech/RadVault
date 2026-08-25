import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';
import PatientTypeScreen from './screens/PatientTypeScreen';
import PregnantScreen from './screens/PregnantScreen';
import ChildScreen from './screens/ChildScreen';
import ElderlyScreen from './screens/ElderlyScreen';
import AdultScreen from './screens/AdultScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import { DEPARTMENTS } from '../../data/mockReferrals';

// ─── Haversine Distance Formula ───────────────────────────────────────────────
function getDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = (v) => v * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Department auto-suggestion per patient type ──────────────────────────────
const DEFAULT_DEPT = {
  pregnant: 'Gynecology & Obstetrics',
  child: 'Pediatrics',
  elderly: 'General Medicine',
  adult: 'General Medicine',
  emergency: 'Emergency & Trauma',
};

// ─── Build Groq prompt per patient type ──────────────────────────────────────
function buildPrompt(patientType, answers) {
  if (patientType === 'pregnant') {
    return `You are an expert AI Triage assistant for a rural Indian ASHA worker app.
Patient: Pregnant woman. Month ${answers.monthOfPregnancy}. Previous deliveries: ${answers.previousDeliveries}.
BP: ${answers.bp || 'Not measured'}. Weight: ${answers.weight || 'Not measured'} kg.
Hemoglobin assessment (visual nail/eye test): ${answers.hemoglobin || 'Not done'}.
Danger signs: Vaginal bleeding: ${answers.bleeding ? 'YES' : 'No'}. Swelling in face/hands/feet: ${answers.swelling ? 'YES' : 'No'}. Severe headache or blurred vision: ${answers.headacheVision ? 'YES' : 'No'}. Baby movement in last 24h: ${answers.babyMovement === false ? 'NO (absent)' : 'Yes/not asked'}.
Based on India's ANC protocol, classify the urgency. Output ONLY valid JSON: {"priority":"RED"|"ORANGE"|"GREEN","note":"2-sentence clinical recommendation for the ASHA worker"}`;
  }
  if (patientType === 'child') {
    const symptoms = [];
    if (answers.convulsions) symptoms.push('convulsions');
    if (answers.lethargic) symptoms.push('lethargic/unconscious');
    if (answers.breastfeeding === false) symptoms.push('not feeding');
    if (answers.cough) symptoms.push('cough/breathing difficulty');
    if (answers.diarrhea) symptoms.push('diarrhea >2 days');
    return `You are an expert AI Triage assistant for a rural Indian ASHA worker app using the IMNCI protocol.
Patient: Child. Age: ${answers.ageMonths} months. Weight: ${answers.weight || 'Not measured'} kg. Temperature: ${answers.temp || 'Not measured'}.
MUAC reading: ${answers.muac || 'Not done'}. Vaccination up to date: ${answers.vaccinationUpToDate === false ? 'NO' : 'Yes/Unknown'}.
Symptoms present: ${symptoms.join(', ') || 'None flagged'}.
Based on IMNCI/IMCI protocol, classify urgency. Output ONLY valid JSON: {"priority":"RED"|"ORANGE"|"GREEN","note":"2-sentence clinical recommendation in simple language for ASHA worker"}`;
  }
  if (patientType === 'elderly') {
    return `You are an expert AI Triage assistant for a rural Indian ASHA worker app.
Patient: Elderly / Chronic Disease patient.
Known conditions: ${answers.conditions?.join(', ') || 'None reported'}.
BP: ${answers.bp || 'Not measured'}. Blood Sugar: ${answers.bloodSugar || 'Not checked'}.
Danger signs today: Chest pain: ${answers.chestPain ? 'YES' : 'No'}. Breathing difficulty: ${answers.breathingDifficulty ? 'YES' : 'No'}.
Chief complaint: ${answers.chiefComplaint || 'Not described'}.
Classify urgency for the referral. Output ONLY valid JSON: {"priority":"RED"|"ORANGE"|"GREEN","note":"2-sentence recommendation"}`;
  }
  if (patientType === 'adult') {
    const syms = answers.symptoms?.join(', ') || 'None';
    return `You are an expert AI Triage assistant for a rural Indian ASHA worker app.
Patient: General adult.
Symptoms present: ${syms}. ${answers.otherSymptom ? 'Also: ' + answers.otherSymptom : ''}
BP: ${answers.bp || 'Not measured'}. Temperature: ${answers.temp || 'Not measured'}.
Classify urgency. Output ONLY valid JSON: {"priority":"RED"|"ORANGE"|"GREEN","note":"2-sentence clinical recommendation"}`;
  }
  if (patientType === 'emergency') {
    return `Emergency patient. Danger signs confirmed: ${answers.dangerSigns?.join('; ') || 'Unknown'}.
Output ONLY valid JSON: {"priority":"RED","note":"Emergency patient requiring immediate hospital care. Call for ambulance and prepare for transport immediately."}`;
  }
  return '';
}

// ─── Groq API Call ────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('Missing VITE_GROQ_API_KEY in .env.local');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a medical triage assistant. Respond ONLY with a raw JSON object — no markdown, no code blocks, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => res.statusText);
    console.error('[Groq Error]', res.status, errBody);
    throw new Error(`Groq ${res.status} — ${errBody}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  console.log('[Groq Raw Response]', raw);

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response did not contain valid JSON. Check console for raw output.');
  return JSON.parse(match[0]);
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const STEPS = ['Patient', 'Screening', 'AI Triage', 'Referral'];

function ProgressBar({ step }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
              i < step ? 'bg-[#008080] border-[#008080] text-white' : i === step ? 'bg-white border-[#008080] text-[#008080]' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[9px] font-bold mt-1 ${i === step ? 'text-[#008080]' : 'text-slate-400'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-3 transition-colors ${i < step ? 'bg-[#008080]' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── AI Result Card ───────────────────────────────────────────────────────────
const RESULT_STYLES = {
  RED: 'bg-[#FFF5F5] border-[#D32F2F]/50 text-[#D32F2F]',
  ORANGE: 'bg-[#FFFDF5] border-[#FF9933]/60 text-[#b35900]',
  GREEN: 'bg-[#F1F8F1] border-[#2E7D32]/40 text-[#2E7D32]',
};
const PRIORITY_LABELS = {
  RED: '🔴 RED — Immediate Emergency',
  ORANGE: '🟡 ORANGE — Urgent, Within 24 Hours',
  GREEN: '🟢 GREEN — Routine, Within 7 Days',
};

// ─── Main TriageForm Orchestrator ─────────────────────────────────────────────
export default function TriageForm({ onSubmit, onCancel }) {
  // State machine: 0=type, 1=intake, 2=ai, 3=routing
  const [step, setStep] = useState(0);
  const [patientType, setPatientType] = useState(null);
  const [intakeAnswers, setIntakeAnswers] = useState(null);

  // AI state
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  // Routing state
  const [hospitals, setHospitals] = useState([]);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Fetch hospitals when entering routing step
  useEffect(() => {
    if (step !== 3) return;
    const fetchHospitals = async (lat, lon) => {
      setFetchingHospitals(true);
      try {
        const q = `[out:json];(node["amenity"="hospital"](around:50000,${lat},${lon});way["amenity"="hospital"](around:50000,${lat},${lon});relation["amenity"="hospital"](around:50000,${lat},${lon}););out center;`;
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
        const data = await res.json();
        const found = data.elements
          .map((el) => ({ name: el.tags?.name, distance: getDistKm(lat, lon, el.lat || el.center?.lat, el.lon || el.center?.lon) }))
          .filter((h) => h.name)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 15);
        setHospitals(found);
      } catch (e) { console.error(e); }
      finally { setFetchingHospitals(false); }
    };
    if ('geolocation' in navigator) {
      setFetchingHospitals(true);
      navigator.geolocation.getCurrentPosition(
        (p) => fetchHospitals(p.coords.latitude, p.coords.longitude),
        () => fetchHospitals(18.5204, 73.8567)
      );
    } else { fetchHospitals(18.5204, 73.8567); }
  }, [step]);

  // Step 0 → 1: Patient type selected
  const handleTypeSelect = (type) => {
    setPatientType(type);
    setDepartment(DEFAULT_DEPT[type] || 'General Medicine');
    setStep(1);
  };

  // Step 1 → 2: Intake complete, run Groq AI
  const handleIntakeComplete = async (answers) => {
    setIntakeAnswers(answers);
    setStep(2);
    setIsAnalyzing(true);
    setAiError('');

    // Emergency: skip API, force RED
    if (patientType === 'emergency' || answers.emergencyOverride) {
      setAiResult({
        priority: 'RED',
        note: 'Emergency patient confirmed by danger sign assessment. Immediate hospital transfer required. Do not delay — call for transport now.',
      });
      setIsAnalyzing(false);
      return;
    }

    try {
      const prompt = buildPrompt(patientType, answers);
      const parsed = await callGroq(prompt);
      setAiResult({ priority: parsed.priority, note: parsed.note });
    } catch (err) {
      setAiError(`AI triage failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3: Final submit
  const handleFinalSubmit = async () => {
    if (!hospital) { setRouteError('Please select a destination hospital.'); return; }
    setRouteError('');
    setIsSubmitting(true);

    const referralData = {
      patient_id: 'MH-P-10482',
      patient_name: 'Rajesh Kumar',
      created_by: 'ASHA Worker: You',
      destination_hospital: hospital,
      destination_department: department,
      priority: aiResult?.priority || 'GREEN',
      priority_label: aiResult?.priority === 'RED' ? 'Emergency' : aiResult?.priority === 'ORANGE' ? 'Urgent' : 'Routine',
      status: 'Pending',
      symptoms: JSON.stringify(intakeAnswers),
      vitals: { patient_type: patientType, ...intakeAnswers },
      ai_note: aiResult?.note || '',
      is_pregnant: patientType === 'pregnant',
    };

    await onSubmit(referralData);
    setIsSubmitting(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={step === 0 ? onCancel : () => setStep((s) => Math.max(0, s - 1))}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#555555] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-[#008080]">ASHA Triage & Referral</h2>
          <p className="text-xs text-[#555555]">Patient-centred adaptive assessment</p>
        </div>
      </div>

      <ProgressBar step={step} />

      {/* Screen 0: Type Selection */}
      {step === 0 && <PatientTypeScreen onSelect={handleTypeSelect} />}

      {/* Screen 1: Intake Forms */}
      {step === 1 && (
        <>
          {patientType === 'pregnant' && <PregnantScreen onComplete={handleIntakeComplete} />}
          {patientType === 'child' && <ChildScreen onComplete={handleIntakeComplete} />}
          {patientType === 'elderly' && <ElderlyScreen onComplete={handleIntakeComplete} />}
          {patientType === 'adult' && <AdultScreen onComplete={handleIntakeComplete} />}
          {patientType === 'emergency' && <EmergencyScreen onComplete={handleIntakeComplete} />}
        </>
      )}

      {/* Screen 2: AI Triage Result */}
      {step === 2 && (
        <div>
          <h3 className="font-extrabold text-lg text-[#212121] mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF9933]" /> Groq AI Triage Analysis
          </h3>

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-[#FF9933] animate-spin" />
              <p className="text-sm font-bold text-[#555555]">Llama 3 is analyzing the clinical data...</p>
            </div>
          )}

          {aiError && (
            <div className="flex items-center gap-2 p-4 bg-[#FFF5F5] border border-[#D32F2F]/40 rounded-xl text-sm text-[#D32F2F] font-bold mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {aiError}
            </div>
          )}

          {aiResult && !isAnalyzing && (
            <>
              <div className={`p-5 rounded-2xl border-2 mb-6 ${RESULT_STYLES[aiResult.priority]}`}>
                <p className="font-extrabold text-xl mb-2">{PRIORITY_LABELS[aiResult.priority]}</p>
                <p className="text-sm leading-relaxed opacity-90">{aiResult.note}</p>
              </div>
              <button onClick={() => setStep(3)}
                className="w-full py-4 bg-[#008080] hover:bg-[#006666] text-white font-extrabold rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
                Continue to Hospital Routing →
              </button>
            </>
          )}

          {aiError && (
            <button onClick={() => setStep(3)}
              className="w-full mt-3 py-3 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-xl text-sm transition-colors">
              Skip AI and Continue Manually →
            </button>
          )}
        </div>
      )}

      {/* Screen 3: Hospital Routing + Submit */}
      {step === 3 && (
        <div>
          <h3 className="font-extrabold text-lg text-[#212121] mb-5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#800000]" /> Route to Specialist
          </h3>

          {/* AI Summary Recap */}
          {aiResult && (
            <div className={`p-4 rounded-2xl border-2 mb-5 ${RESULT_STYLES[aiResult.priority]}`}>
              <p className="font-extrabold text-base mb-1">{PRIORITY_LABELS[aiResult.priority]}</p>
              <p className="text-xs opacity-90 leading-relaxed">{aiResult.note}</p>
            </div>
          )}

          {/* Hospital */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 mb-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#555555] flex items-center gap-1.5 mb-2">
                Nearest Hospital Within 50 km
                {fetchingHospitals && <Loader2 className="w-3 h-3 animate-spin text-[#008080]" />}
              </label>
              <select value={hospital} onChange={(e) => setHospital(e.target.value)} disabled={fetchingHospitals}
                className="w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-3 text-sm disabled:opacity-60">
                <option value="">{fetchingHospitals ? 'Locating nearby hospitals...' : '— Select Hospital —'}</option>
                {hospitals.map((h, i) => <option key={i} value={h.name}>{h.name} ({h.distance.toFixed(1)} km away)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#555555] block mb-2">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full border-2 border-slate-200 focus:border-[#008080] outline-none rounded-xl px-3 py-3 text-sm">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {routeError && (
            <div className="flex items-center gap-2 p-3 bg-[#FFF5F5] border border-[#D32F2F]/40 rounded-xl text-sm text-[#D32F2F] font-bold mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {routeError}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-xl text-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleFinalSubmit} disabled={isSubmitting}
              className="flex-2 flex-grow py-3.5 bg-[#800000] hover:bg-[#660000] disabled:bg-slate-300 text-white font-extrabold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSubmitting ? 'Saving...' : 'Save & Submit Referral'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
