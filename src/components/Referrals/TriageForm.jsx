import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle, Building2, UserCircle2, Stethoscope, Ambulance } from 'lucide-react';
import PatientSelectScreen from './screens/PatientSelectScreen';
import PatientTypeScreen from './screens/PatientTypeScreen';
import PregnantScreen from './screens/PregnantScreen';
import ChildScreen from './screens/ChildScreen';
import ElderlyScreen from './screens/ElderlyScreen';
import AdultScreen from './screens/AdultScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import { DEPARTMENTS } from '../../data/mockReferrals';
import { createCareRequest } from '../../services/ashaService';
import { fetchGovHospitals, getCurrentLocation } from '../../services/locationService';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Kimi K3 via Modal Dedicated Endpoint Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// â”€â”€â”€ Gemini AI Triage Call â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ─── Kimi K3 AI Triage Call ──────────────────────────
async function callOpenRouter(prompt) {
  // AI Disabled temporarily to save API credits
  return localTriage(prompt);
  const kimiKey = import.meta.env.VITE_KIMI_API_KEY;
  
  if (!kimiKey) {
    console.warn('VITE_KIMI_API_KEY missing, falling back to local triage');
    return localTriage(prompt);
  }

  const ENDPOINT = '/api/kimi/v1/chat/completions'; // Proxy in vite.config.js

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kimiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/Kimi-K3',
        messages: [
          { role: 'system', content: 'You are a medical triage assistant. Respond ONLY with a raw JSON object - no markdown, no code blocks, no explanation. Use format: {"priority":"RED|ORANGE|GREEN","note":"2-sentence clinical recommendation","department":"Nearest relevant department name"}' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => res.statusText);
      console.warn('Kimi API failed, using local triage engine:', errBody);
      return localTriage(prompt);
    }

    const json = await res.json();
    const content = json.choices[0].message.content.trim();
    const cleaned = content.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Kimi API Error:', err.message);
    return localTriage(prompt);
  }
}

// Local rules-based triage engine (works offline / when API is unavailable)
function localTriage(prompt) {
  const p = prompt.toLowerCase();
  let dept = 'General Medicine';
  if (p.includes('pregnant')) dept = 'Gynecology & Obstetrics';
  if (p.includes('child')) dept = 'Pediatrics';

  if (p.includes('bleeding: yes') || p.includes('convulsions: yes') || p.includes('unconscious: yes') || p.includes('emergency')) {
    return { priority: 'RED', note: 'CRITICAL: Danger signs detected. Immediate transfer to higher facility required.', department: dept === 'General Medicine' ? 'Emergency & Trauma' : dept };
  }
  if (p.includes('swelling: yes') || p.includes('headache/vision: yes') || p.includes('not feeding: yes') || p.includes('breathing issue: yes') || p.includes('chest pain: yes')) {
    return { priority: 'ORANGE', note: 'WARNING: High-risk symptoms present. Requires prompt medical evaluation within 24 hours.', department: dept };
  }
  return { priority: 'GREEN', note: 'Patient condition appears stable. Schedule routine follow-up and continue monitoring.', department: dept };
}

function buildPrompt(patientType, answers) {
  let prompt = `You are an expert AI Triage assistant for a rural Indian ASHA worker app.\n`;
  if (patientType === 'pregnant') {
    prompt += `Patient: Pregnant woman. Month ${answers.monthOfPregnancy}. Deliveries: ${answers.previousDeliveries}.\n`;
    prompt += `Danger signs: Vaginal bleeding: ${answers.bleeding?'Yes':'No'}. Swelling: ${answers.swelling?'Yes':'No'}. Headache/Vision: ${answers.headacheVision?'Yes':'No'}. Baby move: ${answers.babyMovement===false?'No':'Yes'}.\n`;
  } else if (patientType === 'child') {
    prompt += `Patient: Child (${answers.ageMonths}m). Weight: ${answers.weight||'N/A'}. MUAC: ${answers.muac||'N/A'}.\n`;
    prompt += `Symptoms: Convulsions: ${answers.convulsions?'Yes':'No'}. Lethargic: ${answers.lethargic?'Yes':'No'}. Cough: ${answers.cough?'Yes':'No'}.\n`;
  } else if (patientType === 'elderly') {
    prompt += `Patient: Elderly. Conditions: ${answers.knownConditions?.join(', ')||'None'}.\n`;
    prompt += `Symptoms: Chest pain: ${answers.chestPain?'Yes':'No'}. Breathing issue: ${answers.breathingDiff?'Yes':'No'}. Mobility issue: ${answers.mobilityLoss?'Yes':'No'}.\n`;
  } else if (patientType === 'adult') {
    prompt += `Patient: Adult. Fever > 3 days: ${answers.prolongedFever?'Yes':'No'}. Severe pain: ${answers.severePain?'Yes':'No'}.\n`;
  } else if (patientType === 'emergency') {
    prompt += `Patient: EMERGENCY. Complaint: ${answers.chiefComplaint}. Danger signs: ${answers.dangerSigns?.join(', ')||'None'}.\n`;
  }
  prompt += `Based on this, classify urgency. Output ONLY valid JSON: {"priority":"RED"|"ORANGE"|"GREEN","note":"2-sentence clinical recommendation","department":"Nearest relevant department name"}`;
  return prompt;
}

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Main TriageForm Orchestrator ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
export default function TriageForm({ onSubmit, onCancel }) {
  // State machine: -1=select patient, 0=type, 1=intake, 2=ai, 3=routing
  const [step, setStep] = useState(-1);
  const [patient, setPatient] = useState(null);
  
  const [patientType, setPatientType] = useState(null);
  const [intakeAnswers, setIntakeAnswers] = useState(null);

  // AI state
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  // Routing state
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [isJsyClaim, setIsJsyClaim] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Real Geolocation Hospital State
  const [hospSearch, setHospSearch] = useState('');
  const [showHospDropdown, setShowHospDropdown] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);

  useEffect(() => {
    if (step !== 3) return; // Only fetch when reaching the Routing step
    
    const fetchHospitals = async (lat, lon) => {
      setFetchingHospitals(true);
      try {
        const results = await fetchGovHospitals(lat, lon);
        setHospitals(results);
      } catch (err) {
        console.warn('Hospitals fetch failed, falling back to static:', err);
        setHospitals([{ name: "Primary Health Centre - Pune", type: "PHC", dist: "2.1" }]);
      } finally {
        setFetchingHospitals(false);
      }
    };

    const triggerLocation = async () => {
      setFetchingHospitals(true);
      try {
        const { lat, lon } = await getCurrentLocation();
        await fetchHospitals(lat, lon);
      } catch (err) {
        console.warn("GPS failed, using Pune:", err);
        await fetchHospitals(18.5204, 73.8567);
      }
    };
    
    window.retryGPS = triggerLocation;
    triggerLocation();
  }, [step]);

  const handlePatientSelected = (selectedPatient) => {
    setPatient(selectedPatient);
    
    // Auto-detect type
    if (selectedPatient.is_pregnant) { setPatientType('pregnant'); setStep(1); }
    else if (selectedPatient.age_years <= 5) { setPatientType('child'); setStep(1); }
    else if (selectedPatient.age_years >= 60) { setPatientType('elderly'); setStep(1); }
    else { setStep(0); } // let them choose adult or emergency
  };

  const handleIntakeSubmit = async (answers) => {
    setIntakeAnswers(answers);
    setStep(2);
    setIsAnalyzing(true);
    setAiError('');

    try {
      const prompt = buildPrompt(patientType, answers);
      const parsed = await callOpenRouter(prompt);
      setAiResult(parsed);
      
                        <option value="">-- Select Department --</option>
      if (parsed.department) {
        setDepartment(parsed.department);
      } else if (patientType === 'pregnant') setDepartment('Gynecology & Obstetrics');
      else if (patientType === 'child') setDepartment('Pediatrics');
      
    } catch (err) {
      setAiError(`AI triage failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!hospital) { setRouteError('Please select a destination hospital.'); return; }
    if (!department) { setRouteError('Please select a department.'); return; }
    setRouteError('');
    setIsSubmitting(true);

    const isUrgent = aiResult?.priority === 'RED' || aiResult?.priority === 'ORANGE';
    const finalPriority = isUrgent ? 'URGENT' : 'ROUTINE';

    let ashaNotes = aiResult?.note || '';
    if (isJsyClaim) ashaNotes += " [ASHA Accompanying Patient - JSY Claim]";

    const { data, error } = await createCareRequest({
      patient_id: patient.id,
      patient_name: patient.name,
      source: 'ASHA_REFERRED',
      created_by: 'ASHA Worker',
      facility: hospital,
      department: department,
      priority: finalPriority,
      reason: ashaNotes,
    });

    setIsSubmitting(false);
    if (error) { setRouteError(error.message); return; }
    if (onSubmit) onSubmit(data);
  };

  const currentStepNum = step === -1 ? 0 : step + 1;
  const isEmergency = aiResult?.priority === 'RED' || aiResult?.priority === 'ORANGE' || patientType === 'emergency';

  // Filter hospitals: if emergency, hide SC
  const availableHospitals = isEmergency ? hospitals.filter(h => h.type !== 'SC') : hospitals;

  return (
    <div className="min-h-screen bg-[#F5FBF9] flex flex-col font-sans text-[#16324F]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <button onClick={onCancel} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#64748B]" />
        </button>
        <div className="text-center">
          <h1 className="text-[15px] font-black tracking-tight text-[#16324F]">ASHA Triage & Referral</h1>
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Patient-centred adaptive assessment</p>
        </div>
        <div className="w-8" />
      </header>

      {/* Progress Bar */}
      <div className="bg-white px-4 py-4 border-b border-[#E2E8F0] overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex items-center min-w-[320px] max-w-md mx-auto relative px-2">
          <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-[#E2E8F0] -z-10 -translate-y-1/2" />
          {['Patient', 'Type', 'Screening', 'AI Triage', 'Referral'].map((lbl, idx) => {
            const actualIdx = idx - 1; 
            const isDone = step > actualIdx;
            const isCurr = step === actualIdx;
            return (
              <div key={lbl} className="flex-1 flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  isDone ? 'bg-[#008F83] text-white border-2 border-[#008F83]' :
                  isCurr ? 'bg-white text-[#008F83] border-2 border-[#008F83] shadow-[0_0_0_2px_rgba(0,143,131,0.2)]' :
                           'bg-white text-[#94A3B8] border-2 border-[#E2E8F0]'
                }`}>
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isCurr ? 'text-[#008F83]' : 'text-[#64748B]'}`}>
                  {lbl}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5 sm:p-6 mb-8">
          
          {step === -1 && <PatientSelectScreen onSelect={handlePatientSelected} />}
          
          {step === 0 && (
            <PatientTypeScreen 
              onSelect={(type) => { setPatientType(type); setStep(1); }}
              patientName={patient?.name}
            />
          )}

          {step === 1 && (
            <>
              {patientType === 'pregnant' && <PregnantScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'child' && <ChildScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'elderly' && <ElderlyScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'adult' && <AdultScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'emergency' && <EmergencyScreen onComplete={handleIntakeSubmit} />}
            </>
          )}

          {step === 2 && (
            <div className="animate-in fade-in zoom-in-95 duration-500 py-8 flex flex-col items-center text-center">
              {isAnalyzing ? (
                <>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#008F83] to-teal-200 rounded-full animate-pulse opacity-20 absolute inset-0" />
                    <div className="w-20 h-20 bg-white rounded-full border-4 border-[#008F83]/30 flex items-center justify-center relative z-10">
                      <Sparkles className="w-8 h-8 text-[#008F83] animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-[#16324F] mt-5">AI is reviewing case...</h3>
                    <p className="text-xs font-semibold text-[#64748B] mt-2">Running local offline triage rules (AI Disabled to save credits)</p>
                </>
              ) : aiError ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
                  <p className="text-sm font-bold text-rose-600 mb-4">{aiError}</p>
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">Go Back</button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-[#E8F7F3] rounded-full flex items-center justify-center mb-5 ring-8 ring-teal-50">
                    <CheckCircle2 className="w-10 h-10 text-[#008F83]" />
                  </div>
                  <h3 className="text-xl font-black text-[#16324F] mb-2">Triage Complete</h3>
                  <div className={`mt-4 mb-6 p-4 rounded-xl border text-left w-full ${
                    aiResult?.priority === 'RED' ? 'bg-rose-50 border-rose-200' :
                    aiResult?.priority === 'ORANGE' ? 'bg-amber-50 border-amber-200' :
                    'bg-[#F5FBF9] border-[#008F83]/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white ${
                        aiResult?.priority === 'RED' ? 'bg-rose-600' :
                        aiResult?.priority === 'ORANGE' ? 'bg-amber-500' : 'bg-[#008F83]'
                      }`}>Priority: {aiResult?.priority}</span>
                    </div>
                    <p className="text-sm font-bold text-[#16324F] leading-relaxed">{aiResult?.note}</p>
                    {aiResult?.department && (
                      <p className="text-xs font-bold text-[#64748B] mt-2">Recommended: {aiResult.department}</p>
                    )}
                  </div>
                  <button onClick={() => setStep(3)} className="w-full py-4 bg-[#16324F] text-white font-black rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                    Proceed to Routing
                  </button>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="text-[17px] font-black text-[#16324F] tracking-tight">Route to Specialist</h3>
              </div>

              {isEmergency && (
                <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-rose-800 uppercase tracking-wider">Emergency Protocol Active</p>
                    <p className="text-[11px] font-medium text-rose-700 mt-0.5">Sub-Centres have been hidden. Please route to a CHC or District Hospital immediately.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-4">
                  <div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 block text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          Nearest Hospitals (Within 50km)
                          {fetchingHospitals && <Loader2 className="w-3 h-3 animate-spin text-[#008F83]" />}
                        </label>
                        {!fetchingHospitals && hospitals.length <= 3 && (
                          <button onClick={() => window.retryGPS()} className="text-[10px] font-bold text-[#008F83] bg-teal-50 px-2 py-0.5 rounded uppercase">Retry GPS</button>
                        )}
                      </div>
                      
                      {/* Custom Searchable Combobox */}
                      <div className="relative">
                        <input 
                          type="text" 
                          value={hospSearch}
                          onChange={e => {
                            setHospital('');
                            setHospSearch(e.target.value);
                            setShowHospDropdown(true);
                          }}
                          onFocus={() => setShowHospDropdown(true)}
                          onBlur={() => setTimeout(() => setShowHospDropdown(false), 200)}
                          placeholder="Search or select a hospital..."
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-sm font-black text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/20 shadow-sm"
                        />
                        
                        {showHospDropdown && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
                            {availableHospitals.filter(h => h.name.toLowerCase().includes(hospSearch.toLowerCase())).length === 0 ? (
                              <div className="p-4 text-center text-sm text-slate-500 font-medium">No hospitals found matching "{hospSearch}"</div>
                            ) : (
                              availableHospitals.filter(h => h.name.toLowerCase().includes(hospSearch.toLowerCase())).map(h => (
                                <div 
                                  key={h.name} 
                                  onClick={() => { setHospital(h.name); setHospSearch(h.name); setShowHospDropdown(false); }}
                                  className="p-3 hover:bg-[#F5FBF9] cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                                >
                                  <p className="text-sm font-black text-[#16324F] leading-tight mb-0.5">{h.name}</p>
                                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                    {h.dist} km away {h.type !== 'SC' && <span className="text-rose-500 ml-1">★ Higher Facility</span>}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Department</label>
                    <select 
                      value={department} onChange={e => setDepartment(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-sm font-black text-[#16324F] appearance-none focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/20 shadow-sm"
                    >
                        <option value="">-- Select Department --</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Real world ASHA Incentive Flag */}
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex items-start gap-3">
                  <div className="pt-0.5">
                    <input type="checkbox" id="jsy" checked={isJsyClaim} onChange={e => setIsJsyClaim(e.target.checked)} className="w-4 h-4 text-teal-600 rounded border-teal-300 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label htmlFor="jsy" className="text-xs font-black text-teal-900 block cursor-pointer">ASHA Accompanying Patient</label>
                    <p className="text-[10px] font-semibold text-teal-700 mt-0.5">Flag this referral for JSY incentive tracking upon hospital arrival.</p>
                  </div>
                </div>

                {routeError && <p className="text-xs font-bold text-rose-600 text-center">{routeError}</p>}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 bg-white border-2 border-[#E2E8F0] text-[#64748B] font-black rounded-xl hover:bg-slate-50 transition-colors">
                    Back
                  </button>
                  <button 
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-[#990000] text-white font-black rounded-xl shadow-lg shadow-rose-900/20 hover:bg-[#800000] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {isSubmitting ? 'Submitting...' : 'Save & Submit Referral'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}