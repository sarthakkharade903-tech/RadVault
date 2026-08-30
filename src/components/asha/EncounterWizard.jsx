import React, { useState, useMemo } from 'react';
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
  Info,
  Droplet,
  Baby,
  UserCheck,
  Zap,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { createEncounter } from '../../services/encounterService';
import { assessVitalsPayload } from '../../utils/vitalsValidator';

// ─── DEMOGRAPHIC SCREENING PATHWAYS ──────────────────────────────────────────
export const SCREENING_PATHWAYS = {
  PEDIATRIC: {
    id: 'PEDIATRIC',
    label: 'Pediatric (Under 5)',
    marathi: 'बाल आरोग्य (५ वर्षांखालील)',
    hindi: 'बाल स्वास्थ्य (५ वर्ष से कम)',
    icon: '👶',
    color: '#008F83',
    complaints: [
      { id: 'ped_fever', label: 'High Fever (तीव्र ताप)', icon: '🌡️' },
      { id: 'ped_inability_feed', label: 'Cannot Drink / Breastfeed (दूध पिण्यास असमर्थ)', icon: '🍼' },
      { id: 'ped_vomiting', label: 'Vomits Everything (सतत उलट्या)', icon: '🤢' },
      { id: 'ped_diarrhea', label: 'Watery Diarrhea / Dehydration (पाण्यासारखे जुलाब)', icon: '💧' },
      { id: 'ped_fast_breath', label: 'Fast Breathing / Chest Indrawing (छाती भरणे / जलद श्वास)', icon: '🫁' },
      { id: 'ped_lethargy', label: 'Lethargic / Unresponsive (अतिशय सुस्त / प्रतिसाद नसणे)', icon: '💤' },
      { id: 'ped_cough', label: 'Persistent Cough (> 14 days) (दीर्घकालीन खोकला)', icon: '💨' },
      { id: 'ped_rash', label: 'Skin Rash / Measles (अंगावर पुरळ / गोवर)', icon: '🔴' }
    ],
    dangerSigns: [
      { id: 'peds_stridor', label: 'Stridor while calm (शांत असताना श्वास घेताना आवाज)', severity: 'HIGH' },
      { id: 'peds_indrawing', label: 'Severe lower chest wall indrawing (छाती खोलवर खचणे)', severity: 'HIGH' },
      { id: 'peds_convulsion', label: 'Convulsions / Fits during illness (आचके / झटके येणे)', severity: 'HIGH' },
      { id: 'peds_muac', label: 'Severe Acute Malnutrition (MUAC < 11.5 cm) (तीव्र कुपोषण)', severity: 'HIGH' },
      { id: 'peds_unconscious', label: 'Unconscious or abnormally sleepy (बेभान / अचेत अवस्था)', severity: 'HIGH' }
    ]
  },
  MATERNAL: {
    id: 'MATERNAL',
    label: 'Maternal ANC / Pregnancy',
    marathi: 'माता आरोग्य व प्रसूतीपूर्व तपासणी (ANC)',
    hindi: 'मातृ स्वास्थ्य एवं प्रसव पूर्व जांच',
    icon: '🤰',
    color: '#D97706',
    complaints: [
      { id: 'mat_headache', label: 'Severe Headache & Vision Blur (तीव्र डोकेदुखी / अंधुक दिसणे)', icon: '🧠' },
      { id: 'mat_bleeding', label: 'Vaginal Bleeding / Spotting (योनीतून रक्तस्त्राव)', icon: '🩸' },
      { id: 'mat_swelling', label: 'Facial / Hand Swelling (चेहरा व हातावर सूज)', icon: '🦶' },
      { id: 'mat_abd_pain', label: 'Severe Abdominal / Epigastric Pain (पोटात तीव्र कळा)', icon: '🩺' },
      { id: 'mat_fever', label: 'High Fever with Chills (थंडी वाजून तीव्र ताप)', icon: '🌡️' },
      { id: 'mat_movement', label: 'Reduced Fetal Movement (बाळाची हालचाल मंदावणे)', icon: '👶' },
      { id: 'mat_fluid', label: 'Water Leaking before Labor (पाणी जाणे)', icon: '💧' },
      { id: 'mat_fatigue', label: 'Severe Breathlessness / Pale Skin (अतिशय थकवा / धाप लागणे)', icon: '⚡' }
    ],
    dangerSigns: [
      { id: 'mats_bp', label: 'High BP (≥ 140/90 mmHg) with Proteinuria / Swelling (उच्च रक्तदाब)', severity: 'HIGH' },
      { id: 'mats_hemorrhage', label: 'Active antepartum / postpartum hemorrhage (अति रक्तस्त्राव)', severity: 'HIGH' },
      { id: 'mats_seizure', label: 'Eclampsia / Seizures (गरोदरपणात झटके येणे)', severity: 'HIGH' },
      { id: 'mats_no_movement', label: 'Absence of fetal heart sounds / movements (बाळाची हालचाल बंद)', severity: 'HIGH' }
    ]
  },
  GERIATRIC: {
    id: 'GERIATRIC',
    label: 'Geriatric & Chronic NCD',
    marathi: 'ज्येष्ठ नागरिक व असंसर्गजन्य रोग (NCD)',
    hindi: 'वरिष्ठ नागरिक एवं गैर-संचारी रोग',
    icon: '👴',
    color: '#800000',
    complaints: [
      { id: 'ger_chest', label: 'Chest Pressure / Angina (छातीत जडपणा / दुखणे)', icon: '❤️' },
      { id: 'ger_weakness', label: 'Sudden One-Sided Weakness (एका बाजूला अशक्तपणा / पक्षाघात)', icon: '⚡' },
      { id: 'ger_breathless', label: 'Shortness of Breath on Exertion (किरकोळ कामात धाप लागणे)', icon: '🫁' },
      { id: 'ger_dizziness', label: 'Dizziness & Loss of Balance / Falls (चक्कर येणे / तोल जाणे)', icon: '🌀' },
      { id: 'ger_ulcer', label: 'Non-Healing Foot Wound / Diabetic Ulcer (पायाची न भरणारी जखम)', icon: '🩹' },
      { id: 'ger_vision', label: 'Sudden Vision Loss / Clouding (दृष्टी अंधुक होणे)', icon: '👁️' },
      { id: 'ger_joint', label: 'Severe Joint Pain & Immobility (तीव्र सांधेदुखी / हालचाल मंद)', icon: '🦴' },
      { id: 'ger_urinary', label: 'Urinary Incontinence / Retention (लघवीचा त्रास)', icon: '💧' }
    ],
    dangerSigns: [
      { id: 'gers_stroke', label: 'FAST Signs: Facial droop, arm weakness, slurred speech (पक्षाघात लक्षणे)', severity: 'HIGH' },
      { id: 'gers_mi', label: 'Suspected Myocardial Infarction / Radiating chest pain (हृदयविकार झटका)', severity: 'HIGH' },
      { id: 'gers_rbs', label: 'Extreme Blood Glucose (< 55 or > 350 mg/dL) (अनियंत्रित साखर)', severity: 'HIGH' },
      { id: 'gers_hypoxia', label: 'Chronic Hypoxemia (SpO₂ < 90% at rest) (ऑक्सिजन कमतरता)', severity: 'HIGH' }
    ]
  },
  ADULT: {
    id: 'ADULT',
    label: 'Adult General OPD',
    marathi: 'प्रौढ सामान्य आरोग्य तपासणी',
    hindi: 'वयस्क सामान्य स्वास्थ्य जांच',
    icon: '👤',
    color: '#008080',
    complaints: [
      { id: 'fever', label: 'Fever (ताप)', icon: '🌡️' },
      { id: 'cough', label: 'Cough / Cold (खोकला / सर्दी)', icon: '💨' },
      { id: 'chest_pain', label: 'Chest Pain (छातीत दुखणे)', icon: '❤️' },
      { id: 'breathlessness', label: 'Shortness of Breath (धाप लागणे)', icon: '🫁' },
      { id: 'weakness', label: 'Severe Weakness / Fatigue (अशक्तपणा)', icon: '⚡' },
      { id: 'headache', label: 'Severe Headache (डोकेदुखी)', icon: '🧠' },
      { id: 'injury', label: 'Trauma / Injury / Fall (जखम / मार लागणे)', icon: '🩹' },
      { id: 'abdominal', label: 'Abdominal Pain (पोटदुखी)', icon: '🩺' },
      { id: 'vomiting', label: 'Vomiting / Nausea (उलट्या / मळमळ)', icon: '🤢' },
      { id: 'diarrhea', label: 'Diarrhea / Loose Stools (जुलाब)', icon: '💧' }
    ],
    dangerSigns: [
      { id: 'ds_breathing', label: 'Severe breathing difficulty, gasping, or stridor', severity: 'HIGH' },
      { id: 'ds_chest', label: 'Crushing chest pain, pressure, or radiating pain to arm/jaw', severity: 'HIGH' },
      { id: 'ds_consciousness', label: 'Altered consciousness, fainting, confusion, or unresponsiveness', severity: 'HIGH' },
      { id: 'ds_bleeding', label: 'Severe active bleeding or uncontrolled hemorrhage', severity: 'HIGH' },
      { id: 'ds_spo2', label: 'Low oxygen saturation (SpO₂ < 92%)', severity: 'HIGH' },
      { id: 'ds_fever_stiff', label: 'Continuous high fever (> 103°F) with neck stiffness or seizure', severity: 'HIGH' }
    ]
  }
};

// ─── Deterministic Protocol Fallback ─────────────────────────────────────────
function runDeterministicFallback({ symptoms, spo2, temp, bp, pulse, dangerSigns = [] }) {
  const spo2Num = parseFloat(spo2);
  const tempNum = parseFloat(temp);
  const hasChestPain = symptoms.toLowerCase().includes('chest');

  if (dangerSigns.length > 0 || (spo2Num && spo2Num < 92) || hasChestPain) {
    return {
      priority: 'HIGH',
      priorityLabel: '🔴 RED — Immediate Emergency Transfer',
      note: 'Critical physiological danger markers detected. Immediate facility referral required.',
      recommendation: 'Emergency & Trauma',
      source: 'Protocol Rules Engine'
    };
  }

  if ((tempNum && tempNum >= 101) || symptoms.toLowerCase().includes('breath') || (spo2Num && spo2Num < 95)) {
    return {
      priority: 'ORANGE',
      priorityLabel: '🟡 ORANGE — Urgent Consultation (Within 24h)',
      note: 'Elevated physiological markers. Specialist consultation recommended within 24 hours.',
      recommendation: 'Specialist Consultation',
      source: 'Protocol Rules Engine'
    };
  }

  return {
    priority: 'GREEN',
    priorityLabel: '🟢 GREEN — Routine PHC Follow-up',
    note: 'Stable vitals. Local advice and standard frontline follow-up appropriate.',
    recommendation: 'Primary Health Center',
    source: 'Protocol Rules Engine'
  };
}

// ─── AI Triage Engine (Gemini / Groq / Rules) ────────────────────────────────
async function runAITriage({
  symptoms,
  bp,
  spo2,
  temp,
  pulse,
  dangerSigns = [],
  patientAge,
  patientGender,
  pathwayKey,
  isDemoMode
}) {
  // If severe danger signs are present, bypass to high priority
  if (dangerSigns.length > 0) {
    return {
      priority: 'HIGH',
      priorityLabel: '🔴 RED — Immediate Emergency Transfer',
      note: `Critical danger signs flagged (${dangerSigns.join(', ')}). Immediate hospital transfer required.`,
      recommendation: 'Emergency & Trauma',
      source: 'Clinical Danger Screening Protocol'
    };
  }

  if (isDemoMode) {
    return runDeterministicFallback({ symptoms, spo2, temp, bp, pulse, dangerSigns });
  }

  // 1. Backend Gemini Proxy
  try {
    const response = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        bp,
        spo2,
        temp,
        pulse,
        dangerSigns,
        patientAge,
        patientGender,
        pathway: pathwayKey
      })
    });

    if (response.ok) {
      const data = await response.json();
      const labels = {
        RED: '🔴 RED — Immediate Emergency Transfer',
        ORANGE: '🟡 ORANGE — Urgent Consultation (Within 24h)',
        GREEN: '🟢 GREEN — Routine PHC Follow-up'
      };

      return {
        priority: data.priority === 'RED' ? 'HIGH' : data.priority,
        priorityLabel: labels[data.priority] || labels.GREEN,
        note: data.explanation || 'Vital parameters recorded and assessed.',
        recommendation: data.priority === 'RED' ? 'Emergency & Trauma' : 'Specialist Consultation',
        source: 'Google Gemini 1.5 Triage Model'
      };
    }
  } catch (err) {
    console.warn('Backend triage notice:', err.message);
  }

  // 2. Deterministic Rule fallback
  return runDeterministicFallback({ symptoms, spo2, temp, bp, pulse, dangerSigns });
}

export default function EncounterWizard({
  patient,
  onCancel,
  onEncounterCompleted,
  onRequestReferral,
  isDemoMode = false,
  ashaProfile = null
}) {
  const patientAge = parseInt(patient.age_years || patient.age || 30, 10);
  const patientGender = (patient.gender || '').toLowerCase();
  const isFemale = patientGender === 'female' || patientGender === 'f';

  // Automatically determine initial pathway based on demographics
  const initialPathway = useMemo(() => {
    if (patientAge <= 5) return 'PEDIATRIC';
    if (isFemale && patientAge >= 12 && patientAge <= 50 && (patient.is_pregnant || patient.pregnancy_status === 'pregnant')) {
      return 'MATERNAL';
    }
    if (patientAge >= 55) return 'GERIATRIC';
    return 'ADULT';
  }, [patientAge, isFemale, patient.is_pregnant, patient.pregnancy_status]);

  const [activePathwayKey, setActivePathwayKey] = useState(initialPathway);
  const activePathway = SCREENING_PATHWAYS[activePathwayKey] || SCREENING_PATHWAYS.ADULT;

  const [step, setStep] = useState(1); // 1: Complaints, 2: Vitals & Safety, 3: Danger Signs, 4: Result

  // Step 1: Complaints & Symptoms
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [symptomNotes, setSymptomNotes] = useState('');

  // Step 2: Vitals
  const [temp, setTemp] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [rbs, setRbs] = useState('');
  const [muac, setMuac] = useState('');
  const [weight, setWeight] = useState('');
  const [vitalsAssessment, setVitalsAssessment] = useState({ canProceed: true, hasDangerous: false, errors: [], warnings: [] });
  const [dangerAckConfirmed, setDangerAckConfirmed] = useState(false);

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

  // Real-time vitals validation assessment
  const handleVitalsChange = (updater) => {
    updater();
    // Vitals assessment is triggered in handleProceedFromVitals
  };

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

  // Vitals Safety Check on Step 2 Next
  const handleProceedFromVitals = (forceDangerousPass = false) => {
    setError('');
    const assessment = assessVitalsPayload({
      bloodPressure: bp,
      oxygenSaturation: spo2,
      heartRate: pulse,
      bloodGlucose: rbs,
      temperature: temp
    });

    setVitalsAssessment(assessment);

    // If impossible values entered -> block and show error
    if (!assessment.canProceed) {
      setError(assessment.errors[0] || 'Invalid vital measurement entered.');
      return;
    }

    // If dangerous values detected and user hasn't explicitly clicked Continue -> show danger alert box
    if (assessment.hasDangerous && !forceDangerousPass && !dangerAckConfirmed) {
      // Stay on step 2 and show the High-Risk Danger Alert box
      return;
    }

    // Advance to Step 3
    setStep(3);
  };

  // Run Triage Analysis
  const handleRunTriage = async () => {
    setIsAnalyzing(true);
    setError('');
    try {
      const compiledSymptoms = [
        ...selectedComplaints.map((c) => activePathway.complaints.find((x) => x.id === c)?.label || c),
        symptomNotes.trim()
      ].filter(Boolean).join(', ');

      const result = await runAITriage({
        symptoms: compiledSymptoms || 'General health evaluation',
        bp,
        spo2,
        temp,
        pulse,
        dangerSigns,
        patientAge,
        patientGender,
        pathwayKey: activePathwayKey,
        isDemoMode
      });

      // If dangerous vitals were confirmed, ensure priority is at least HIGH
      if (vitalsAssessment.hasDangerous) {
        result.priority = 'HIGH';
        result.priorityLabel = '🔴 RED — Immediate Emergency Transfer';
      }

      setTriageResult(result);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(`Triage analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Local Advice & Home Care
  const handleSaveLocalAdvice = async () => {
    setIsSubmitting(true);
    try {
      const compiledSymptoms = [
        ...selectedComplaints.map((c) => activePathway.complaints.find((x) => x.id === c)?.label || c),
        symptomNotes.trim()
      ].filter(Boolean);

      let followUpDateStr = null;
      if (localFollowUpDays && localFollowUpDays !== 'none') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(localFollowUpDays, 10));
        followUpDateStr = d.toISOString().slice(0, 10);
      }

      const encounter = await createEncounter({
        patient,
        complaint: compiledSymptoms[0] || 'Routine Health Visit',
        symptoms: compiledSymptoms,
        symptomNotes: `${symptomNotes}. Advice: ${localAdviceNotes}`,
        vitals: { temp, bp, pulse, spo2, rbs, weight, muac },
        dangerSigns,
        priority: triageResult?.priority || 'GREEN',
        aiExplanation: triageResult?.note || 'Routine frontline consultation.',
        outcome: 'ADVICE_GIVEN',
        followUpDate: followUpDateStr,
        ashaId: ashaProfile?.id,
        isDemoMode
      });

      if (onEncounterCompleted) onEncounterCompleted(encounter);
    } catch (err) {
      console.error(err);
      setError(`Failed to save encounter: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transfer to Referral Creation Flow
  const handleCreateReferralFromEncounter = async () => {
    setIsSubmitting(true);
    try {
      const compiledSymptoms = [
        ...selectedComplaints.map((c) => activePathway.complaints.find((x) => x.id === c)?.label || c),
        symptomNotes.trim()
      ].filter(Boolean);

      const encounter = await createEncounter({
        patient,
        complaint: compiledSymptoms[0] || 'Care Referral',
        symptoms: compiledSymptoms,
        symptomNotes: `${symptomNotes}. Triage Note: ${triageResult?.note || ''}`,
        vitals: { temp, bp, pulse, spo2, rbs, weight, muac },
        dangerSigns,
        priority: triageResult?.priority || 'HIGH',
        aiExplanation: triageResult?.note || 'Immediate medical evaluation required.',
        outcome: 'REFERRAL_CREATED',
        ashaId: ashaProfile?.id,
        isDemoMode
      });

      if (onRequestReferral) {
        onRequestReferral(encounter);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to prepare referral: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2">
      
      {/* ── TOP BENEFICIARY IDENTITY STRIP ── */}
      <div className="bg-[#008080] text-white p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black shrink-0">
            {activePathway.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-base">{patientName}</span>
              <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded font-bold">
                {patientId}
              </span>
              <span className="text-xs text-white/90 font-medium">
                {patientAge} yrs · {patient.gender || 'Beneficiary'}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Active Screening: <strong className="text-white">{activePathway.label}</strong> ({activePathway.marathi})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* ── DEMOGRAPHIC PATHWAY SWITCHER (Demographically Filtered) ── */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {/* Pediatric Tab: Shown only for age <= 12 */}
          {patientAge <= 12 && (
            <button
              type="button"
              onClick={() => { setActivePathwayKey('PEDIATRIC'); setSelectedComplaints([]); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activePathwayKey === 'PEDIATRIC'
                  ? 'bg-[#008F83] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>👶</span>
              <span>Child Under 5 (बालक)</span>
            </button>
          )}

          {/* Maternal ANC Tab: Strictly shown ONLY for Female 12-50 */}
          {isFemale && patientAge >= 12 && patientAge <= 50 && (
            <button
              type="button"
              onClick={() => { setActivePathwayKey('MATERNAL'); setSelectedComplaints([]); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activePathwayKey === 'MATERNAL'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>🤰</span>
              <span>Maternal ANC (गर्भारपण)</span>
            </button>
          )}

          {/* Geriatric Tab: Shown for 50+ */}
          {patientAge >= 50 && (
            <button
              type="button"
              onClick={() => { setActivePathwayKey('GERIATRIC'); setSelectedComplaints([]); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activePathwayKey === 'GERIATRIC'
                  ? 'bg-[#800000] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>👴</span>
              <span>Geriatric / NCD (ज्येष्ठ नागरिक)</span>
            </button>
          )}

          {/* Adult General Tab */}
          <button
            type="button"
            onClick={() => { setActivePathwayKey('ADULT'); setSelectedComplaints([]); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activePathwayKey === 'ADULT'
                ? 'bg-[#008080] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span>👤</span>
            <span>General OPD (सामान्य)</span>
          </button>
        </div>
      </div>

      {/* ── STEP PROGRESS INDICATOR ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: '1 Symptoms' },
          { num: 2, label: '2 Vitals' },
          { num: 3, label: '3 Danger Signs' },
          { num: 4, label: '4 Triage Result' },
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

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: PRESENTING COMPLAINTS & SYMPTOMS ── */}
      {step === 1 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                1. {activePathway.label} Symptoms (लक्षणे)
              </h2>
              <span className="text-[10px] font-bold text-slate-500">Step 1 of 4</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Select all presenting complaints reported by the patient or family.
            </p>
          </div>

          {/* Quick-select Demographic Symptom Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePathway.complaints.map(({ id, label, icon }) => {
              const isSelected = selectedComplaints.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleComplaint(id)}
                  className={`p-3 rounded-2xl text-left font-bold text-xs flex items-center gap-2.5 transition-all border-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFF5EB] border-[#FF9933] text-[#b35900] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="truncate flex-1">{label}</span>
                  {isSelected && <span className="text-xs font-black text-[#b35900]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Detailed Symptom Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Specific Clinical Notes / Onset Duration (विशिष्ट नोंदी)
            </label>
            <textarea
              rows={3}
              value={symptomNotes}
              onChange={(e) => setSymptomNotes(e.target.value)}
              placeholder="e.g. Cough with fever for 3 days, breathing difficulty since morning..."
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-2xl text-xs font-medium outline-none transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (selectedComplaints.length === 0 && !symptomNotes.trim()) {
                  setError('Please select or describe at least one presenting symptom.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Vitals →</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: VITALS & PHYSIOLOGICAL SAFETY ENGINE ── */}
      {step === 2 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                2. Physiological Vitals & Safety Validation (शारीरिक मोजमाप)
              </h2>
              <span className="text-[10px] font-bold text-slate-500">Step 2 of 4</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Record physiological readings. The safety engine verifies valid ranges in real-time.
            </p>
          </div>

          {/* Vitals Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            
            {/* Blood Pressure */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Blood Pressure (रक्तदाब)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">120/80</span>
              </div>
              <input
                type="text"
                placeholder="e.g. 120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {/* SpO2 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-600" />
                  <span>SpO₂ % (ऑक्सिजन)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">95–100%</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Temperature */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[#FF9933]" />
                  <span>Temp °F (तापमान)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">98.6°F</span>
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 98.6"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Pulse */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-700" />
                  <span>Pulse bpm (नाडीचे ठोके)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">60–100</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Blood Glucose (RBS) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Blood Sugar mg/dL (साखर)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">70–140</span>
              </div>
              <input
                type="number"
                placeholder="e.g. 110"
                value={rbs}
                onChange={(e) => setRbs(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Pediatric MUAC or Adult Weight */}
            {activePathwayKey === 'PEDIATRIC' ? (
              <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-900 flex items-center gap-1">
                    <Baby className="w-3.5 h-3.5 text-teal-700" />
                    <span>MUAC cm (दंड घेर)</span>
                  </label>
                  <span className="text-[10px] text-teal-700 font-bold">&gt; 12.5 cm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 13.5"
                  value={muac}
                  onChange={(e) => setMuac(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-teal-300 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Weight kg (वजन)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">kg</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 58"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-[#008080] rounded-xl text-sm font-bold text-slate-900 outline-none"
                />
              </div>
            )}

          </div>

          {/* ── HIGH-RISK VITALS SAFETY ALERT BOX (Real Dangerous Readings) ── */}
          {vitalsAssessment.hasDangerous && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    ⚠️ High-Risk Physiological Reading Detected
                  </h4>
                  <ul className="mt-1 space-y-1 text-xs font-bold text-amber-900">
                    {vitalsAssessment.warnings.map((w, idx) => (
                      <li key={idx}>• {w}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-800 mt-1.5 font-medium">
                    This reading indicates acute clinical risk. If accurate, immediate priority referral is advised. If entered by mistake, click <strong>Recheck Reading</strong>.
                  </p>
                </div>
              </div>

              {/* Two Explicit Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => {
                    setDangerAckConfirmed(false);
                    setVitalsAssessment({ canProceed: true, hasDangerous: false, errors: [], warnings: [] });
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Recheck Reading (पुन्हा तपासा)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDangerAckConfirmed(true);
                    handleProceedFromVitals(true);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Continue to Referral → (रेफरल सुरू ठेवा)</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={() => handleProceedFromVitals(false)}
              className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Danger Signs →</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: DEMOGRAPHIC DANGER SIGNS ── */}
      {step === 3 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                3. Critical Danger Signs (धोक्याची लक्षणे)
              </h2>
              <span className="text-[10px] font-bold text-slate-500">Step 3 of 4</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Flag any red-flag emergency symptoms requiring immediate facility escalation.
            </p>
          </div>

          {/* Danger Signs List */}
          <div className="space-y-2">
            {activePathway.dangerSigns.map(({ id, label }) => {
              const isChecked = dangerSigns.includes(label);
              return (
                <label
                  key={id}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-rose-50 border-rose-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDangerSign(label)}
                    className="mt-0.5 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900">{label}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    RED FLAG
                  </span>
                </label>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleRunTriage}
              className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAnalyzing ? 'Evaluating Triage...' : 'Generate AI Triage Result →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: TRIAGE RESULT & DECISION ── */}
      {step === 4 && triageResult && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                4. Clinical Assessment & Recommendation (निकाल)
              </h2>
              <span className="text-[10px] font-bold text-slate-500">Step 4 of 4</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Verified clinical outcome and next recommended action.
            </p>
          </div>

          {/* Triage Priority Banner */}
          <div
            className={`p-5 rounded-2xl border-2 space-y-2 ${
              triageResult.priority === 'HIGH' || triageResult.priority === 'RED'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : triageResult.priority === 'ORANGE'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black uppercase tracking-wide">
                {triageResult.priorityLabel}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/80 border">
                {triageResult.source}
              </span>
            </div>
            <p className="text-xs font-bold leading-relaxed">{triageResult.note}</p>
          </div>

          {/* Action Choice: Local Advice vs Referral */}
          {triageResult.priority === 'HIGH' || triageResult.priority === 'RED' ? (
            <div className="space-y-3">
              <div className="p-4 bg-rose-100/60 border border-rose-300 rounded-2xl text-xs text-rose-950 font-bold flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
                <span>
                  High-risk parameters detected. Transfer to <strong>PHC / Hospital Specialist</strong> recommended immediately.
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateReferralFromEncounter}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Create Immediate Specialist Referral (रेफरल पाठवा) →</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wide">
                  Frontline Advice & Home Care Notes (मार्गदर्शन)
                </h4>
                <textarea
                  rows={2}
                  value={localAdviceNotes}
                  onChange={(e) => setLocalAdviceNotes(e.target.value)}
                  placeholder="e.g. Prescribed ORS + Paracetamol, instructed hydration, recheck in 3 days..."
                  className="w-full p-3 bg-white border border-slate-200 focus:border-[#008080] rounded-xl text-xs font-medium outline-none"
                />

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
                  <span>Schedule Follow-up In:</span>
                  <select
                    value={localFollowUpDays}
                    onChange={(e) => setLocalFollowUpDays(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="3">3 Days (3 दिवस)</option>
                    <option value="7">7 Days (7 दिवस)</option>
                    <option value="14">14 Days (14 दिवस)</option>
                    <option value="none">No follow-up needed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveLocalAdvice}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete & Record Advice</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateReferralFromEncounter}
                  className="py-3 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Send PHC Referral Instead →</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ← Back to Danger Signs
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
