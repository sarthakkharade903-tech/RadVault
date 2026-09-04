import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  Building2, UserCircle2, Stethoscope, Ambulance, Mic, Square,
  Volume2, Trash2, Check, ArrowRight, ArrowLeft, Search, Plus
} from 'lucide-react';
import PatientSelectScreen from './screens/PatientSelectScreen';
import PatientTypeScreen from './screens/PatientTypeScreen';
import PregnantScreen from './screens/PregnantScreen';
import ChildScreen from './screens/ChildScreen';
import ElderlyScreen from './screens/ElderlyScreen';
import AdultScreen from './screens/AdultScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import { DEPARTMENTS, HOSPITALS } from '../../data/mockReferrals';
import { createCareRequest } from '../../services/ashaService';
import { fetchGovHospitals, getCurrentLocation } from '../../services/locationService';
import { supabase, ensureRoleAuth } from '../../services/supabase';

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const TRIAGE_TRANSLATIONS = {
  en: {
    title: "Patient Referral & Triage",
    subtitle: "AI Clinical Urgency & Hospital Routing",
    selectPatient: "Select Patient",
    patientType: "Patient Type",
    assessment: "Health Assessment",
    triageResult: "Triage Urgency",
    routing: "Hospital Routing",
    hospitalSelect: "Select Destination Hospital",
    searchHospital: "Search hospital name or nearby PHC...",
    deptSelect: "Select Clinical Service / Department",
    chooseDept: "-- Select Department --",
    jsyLabel: "ASHA Accompanying Patient",
    jsySub: "Flag for emergency escort or JSY incentive upon hospital arrival",
    voiceNoteTitle: "Voice Scribe Condition Note",
    voiceNoteSub: "Speak patient symptoms via microphone to transcribe notes",
    startRec: "Start Voice Recording",
    stopRec: "Stop & Save Note",
    recActive: "Recording: 00:",
    memoPlayer: "Recorded Audio Condition Memo",
    removeAudio: "Remove",
    notesLabel: "Clinical Observations & Urgent Symptoms",
    notesPlaceholder: "Spoken or typed patient observations for receiving doctor...",
    priorityRed: "EMERGENCY (Immediate Transfer)",
    priorityOrange: "URGENT (Evaluate within 24h)",
    priorityGreen: "ROUTINE (Scheduled OPD)",
    submitReferral: "Save & Dispatch Referral",
    submitting: "Dispatching Referral...",
    back: "Back",
    continueRouting: "Proceed to Hospital Routing →",
    errSelectHosp: "Please select a destination hospital.",
    errSelectDept: "Please select a clinical department."
  },
  mr: {
    title: "रुग्ण रेफरल व तात्काळ तपासणी",
    subtitle: "रुग्णालय व प्राथमिक आरोग्य केंद्र रेफरल",
    selectPatient: "रुग्ण निवडा",
    patientType: "रुग्णाचा प्रकार",
    assessment: "आरोग्य तपासणी",
    triageResult: "तातडीचे वर्गीकरण",
    routing: "रुग्णालय निवड",
    hospitalSelect: "रेफर करण्याचे रुग्णालय निवडा",
    searchHospital: "रुग्णालय किंवा प्राथमिक आरोग्य केंद्र शोधा...",
    deptSelect: "तपासणी विभाग निवडा",
    chooseDept: "-- विभाग निवडा --",
    jsyLabel: "आशा कार्यकर्ता सोबत जात आहे",
    jsySub: "तातडीच्या रुग्णासोबत रुग्णालयात जाण्यासाठी नोंद",
    voiceNoteTitle: "आवाज नोंदणी व लक्षणे",
    voiceNoteSub: "माईकवर बोलून रुग्णाची लक्षणे नोंदवा",
    startRec: "माईक सुरू करा",
    stopRec: "नोंद पूर्ण करा",
    recActive: "रेकॉर्डिंग चालू: 00:",
    memoPlayer: "रेकॉर्ड केलेली ऑडिओ नोंद",
    removeAudio: "काढून टाका",
    notesLabel: "रुग्णाची लक्षणे व डॉक्टरांसाठी माहिती",
    notesPlaceholder: "रुग्णालयातील डॉक्टरांसाठी महत्त्वाची लक्षणे...",
    priorityRed: "अति तातडीचे (तातडीने हलवा)",
    priorityOrange: "तातडीचे (२४ तासांत दाखवा)",
    priorityGreen: "सर्वसाधारण तपासणी",
    submitReferral: "रेफरल नोंद सेव्ह करा",
    submitting: "नोंद होत आहे...",
    back: "मागे",
    continueRouting: "रुग्णालय निवडीकडे जा →",
    errSelectHosp: "कृपया रुग्णालय निवडा.",
    errSelectDept: "कृपया विभाग निवडा."
  },
  hi: {
    title: "मरीज रेफरल एवं जांच",
    subtitle: "अस्पताल एवं पीएचसी रेफरल प्रक्रिया",
    selectPatient: "मरीज चुनें",
    patientType: "मरीज का प्रकार",
    assessment: "स्वास्थ्य जांच",
    triageResult: "प्राथमिकता वर्गीकरण",
    routing: "अस्पताल चयन",
    hospitalSelect: "रेफर हेतु अस्पताल चुनें",
    searchHospital: "अस्पताल या पीएचसी खोजें...",
    deptSelect: "उपचार विभाग चुनें",
    chooseDept: "-- विभाग चुनें --",
    jsyLabel: "आशा कार्यकर्ता साथ जा रही हैं",
    jsySub: "अस्पताल में मरीज के साथ जाने हेतु",
    voiceNoteTitle: "बोलकर लक्षण दर्ज करें",
    voiceNoteSub: "माइक पर बोलकर मरीज की स्थिति दर्ज करें",
    startRec: "माइक शुरू करें",
    stopRec: "दर्ज करें",
    recActive: "रिकॉर्डिंग: 00:",
    memoPlayer: "ऑडियो वॉइस नोट",
    removeAudio: "हटाएं",
    notesLabel: "मरीज के लक्षण एवं डॉक्टर के लिए जानकारी",
    notesPlaceholder: "अस्पताल के डॉक्टर के लिए जरूरी लक्षण...",
    priorityRed: "अति आवश्यक (तुरंत ले जाएं)",
    priorityOrange: "आवश्यक (24 घंटे में दिखाएं)",
    priorityGreen: "सामान्य जांच",
    submitReferral: "रेफरल सुरक्षित करें",
    submitting: "सुरक्षित हो रहा है...",
    back: "पीछे",
    continueRouting: "अस्पताल चयन पर जाएं →",
    errSelectHosp: "कृपया अस्पताल चुनें।",
    errSelectDept: "कृपया विभाग चुनें।"
  }
};

// Local clinical rules engine
function localTriage(patientType, answers) {
  let dept = 'General Medicine & OPD';
  if (patientType === 'pregnant') dept = 'Maternity & Gynecology (ANC / Delivery)';
  if (patientType === 'child') dept = 'Child Health & Pediatrics';
  if (patientType === 'emergency') dept = 'Emergency & Casualty / Trauma';

  if (answers?.bleeding || answers?.convulsions || answers?.unconscious || patientType === 'emergency' || answers?.spo2 < 90) {
    return {
      priority: 'RED',
      note: 'CRITICAL: Severe symptoms detected. Immediate transfer to higher hospital required.',
      department: 'Emergency & Casualty / Trauma'
    };
  }
  if (answers?.swelling || answers?.headacheVision || answers?.breathingDiff || answers?.chestPain || answers?.bp?.includes('150') || answers?.bp?.includes('160')) {
    return {
      priority: 'ORANGE',
      note: 'URGENT: High-risk symptoms present. Requires clinical evaluation within 24 hours.',
      department: dept
    };
  }
  return {
    priority: 'GREEN',
    note: 'ROUTINE: Patient condition appears stable. Routine consultation recommended.',
    department: dept
  };
}

export default function TriageForm({ onSubmit, onCancel, demoMode = false }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = TRIAGE_TRANSLATIONS[lang] || TRIAGE_TRANSLATIONS.en;

  // Step machine: -1=select patient, 0=patient type, 1=assessment, 2=triage review, 3=routing
  const [step, setStep] = useState(-1);
  const [patient, setPatient] = useState(null);
  const [patientType, setPatientType] = useState(null);
  const [intakeAnswers, setIntakeAnswers] = useState(null);

  // AI & Triage State
  const [aiResult, setAiResult] = useState(null);

  // Routing State - default to Shrirampur PHC where reception and doctor operate
  const [hospital, setHospital] = useState('Shrirampur Primary Health Centre');
  const [selectedFacility, setSelectedFacility] = useState({
    id: 'f1111111-1111-1111-1111-111111111111',
    name: 'Shrirampur Primary Health Centre'
  });
  const [facilitiesList, setFacilitiesList] = useState([]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [isJsyClaim, setIsJsyClaim] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Hospital Search Dropdown
  const [hospSearch, setHospSearch] = useState('');
  const [showHospDropdown, setShowHospDropdown] = useState(false);

  // Load real facilities from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        await ensureRoleAuth('asha');
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name, district')
          .order('name');
        if (!error && data && data.length > 0 && isMounted) {
          setFacilitiesList(data);
          const defaultFac = data.find(f => f.name.toLowerCase().includes('shrirampur')) || data[0];
          setHospital(defaultFac.name);
          setSelectedFacility(defaultFac);
        }
      } catch (e) {
        console.warn('[TriageForm] Error loading facilities:', e);
      }
    }
    loadFacilities();
    return () => { isMounted = false; };
  }, []);

  // ── Real Audio Recording State ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState('');
  const [audioLang, setAudioLang] = useState(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  // Clean up audio streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // ── Audio Recording Handler ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlobUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = audioLang;

        recognition.onresult = (event) => {
          let liveText = "";
          for (let i = 0; i < event.results.length; i++) {
            liveText += event.results[i][0].transcript + " ";
          }
          if (liveText.trim()) {
            setVoiceNotes(prev => prev ? `${prev} ${liveText.trim()}` : liveText.trim());
          }
        };
        recognition.start();
      }
    } catch (err) {
      console.error("Mic access denied:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);

    if (!voiceNotes.trim()) {
      setVoiceNotes(
        lang === 'mr'
          ? "रुग्णास गंभीर लक्षणे दिसत आहेत. तातडीने पुढील तपासणीसाठी रेफर केले आहे."
          : lang === 'hi'
          ? "मरीज में गंभीर लक्षण दिखाई दे रहे हैं। तुरंत जांच हेतु रेफर किया गया है।"
          : "Patient displaying acute clinical symptoms. Referred for immediate medical evaluation."
      );
    }
  };

  const handlePatientSelected = (selectedPatient) => {
    setPatient(selectedPatient);
    // Strict age and biological checks
    if (selectedPatient.gender === 'Female' && selectedPatient.is_pregnant && (!selectedPatient.age_years || selectedPatient.age_years >= 12)) {
      setPatientType('pregnant');
      setStep(1);
    } else if (selectedPatient.age_years !== undefined && selectedPatient.age_years !== null && selectedPatient.age_years <= 5) {
      setPatientType('child');
      setStep(1);
    } else {
      // Show age and gender filtered category screen
      setStep(0);
    }
  };

  const handleIntakeSubmit = (answers) => {
    setIntakeAnswers(answers);
    const triage = localTriage(patientType, answers);
    setAiResult(triage);
    setDepartment(triage.department || DEPARTMENTS[0]);
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!hospital) { setRouteError(t.errSelectHosp); return; }
    if (!department) { setRouteError(t.errSelectDept); return; }
    setRouteError('');
    setIsSubmitting(true);

    const isUrgent = aiResult?.priority === 'RED' || aiResult?.priority === 'ORANGE';
    const finalPriority = isUrgent ? 'URGENT' : 'ROUTINE';

    let ashaNotes = voiceNotes.trim() || aiResult?.note || 'ASHA referral initiated';
    if (isJsyClaim) ashaNotes += " [ASHA Accompanying Patient - JSY Escort]";

    // Ensure valid patient_id (strictly required in Demo OFF mode)
    const patientId = patient?.id || (demoMode ? 'b6f81101-46d0-4b4d-8df0-9d9ce11a6a70' : null);
    const patientName = patient?.name || (demoMode ? 'Rekha Bai' : null);

    if (!patientId || !patientName) {
      setRouteError("Please select a registered patient before dispatching referral.");
      setIsSubmitting(false);
      return;
    }

    const patientVitals = {
      bp: intakeAnswers?.bp || patient?.vitals?.bp || patient?.bp || '',
      pulse: intakeAnswers?.pulse || patient?.vitals?.pulse || patient?.pulse || '',
      spo2: intakeAnswers?.spo2 || patient?.vitals?.spo2 || patient?.spo2 || '',
      temp: intakeAnswers?.temp || patient?.vitals?.temp || patient?.temp || '',
      weight: intakeAnswers?.weight || patient?.vitals?.weight || patient?.weight || '',
      height: intakeAnswers?.height || patient?.vitals?.height || patient?.height || '',
      blood_sugar: intakeAnswers?.blood_sugar || patient?.vitals?.blood_sugar || patient?.blood_sugar || ''
    };

    const destinationFacilityId = selectedFacility?.id
      || (facilitiesList.find(f => f.name === hospital)?.id)
      || 'f1111111-1111-1111-1111-111111111111';

    const payload = {
      patient_id: patientId,
      patient_name: patientName,
      age: patient?.age_years || patient?.age || 30,
      gender: patient?.gender || 'Other',
      blood_group: patient?.blood_group || null,
      phone: patient?.mobile || patient?.phone || '9876543210',
      source: 'ASHA_REFERRED',
      created_by: 'ASHA Worker (Priya Deshmukh)',
      facility: hospital || 'Shrirampur Primary Health Centre',
      destination_hospital: hospital || 'Shrirampur Primary Health Centre',
      destination_facility_id: destinationFacilityId,
      department: department || 'General Medicine',
      priority: finalPriority,
      reason: ashaNotes,
      asha_notes: ashaNotes,
      vitals: patientVitals
    };

    const { data, error } = await createCareRequest(payload);
    setIsSubmitting(false);

    if (error) {
      console.error('[TriageForm] Referral dispatch error:', error);
      setRouteError(error.message || 'Failed to dispatch referral to hospital database.');
      return;
    }

    if (data?.id) {
      try {
        const { data: verified } = await supabase
          .from('referrals')
          .select('id, status, destination_hospital')
          .eq('id', data.id)
          .maybeSingle();
        if (verified) {
          console.log('[TriageForm] Referral verified in Supabase referrals:', verified.id);
        }
      } catch (vErr) {
        console.warn('[TriageForm] Referral verification warning:', vErr);
      }
    }

    // Persist completed task status in localStorage
    try {
      const saved = localStorage.getItem("radvault_completed_tasks");
      const taskSet = saved ? new Set(JSON.parse(saved)) : new Set();
      taskSet.add(patientId);
      taskSet.add(`task-${patientId}`);
      localStorage.setItem("radvault_completed_tasks", JSON.stringify(Array.from(taskSet)));
    } catch (e) {
      console.error(e);
    }

    if (onSubmit) {
      onSubmit(data || payload);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] flex flex-col font-sans text-slate-800 pb-24">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#16324F]">{t.title}</h1>
            <p className="text-xs font-bold text-teal-700">{patient ? patient.name : t.subtitle}</p>
          </div>
        </div>

        <span className="text-xs font-extrabold bg-[#E8F7F3] text-[#008F83] px-3 py-1 rounded-full border border-[#008F83]/20">
          {step === -1 ? '1/4' : step === 0 ? '2/4' : step === 1 ? '3/4' : '4/4'}
        </span>
      </header>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 w-full space-y-5">
        
        {/* STEP -1: Select Patient */}
        {step === -1 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <PatientSelectScreen onSelectPatient={handlePatientSelected} demoMode={demoMode} />
          </div>
        )}

        {/* STEP 0: Select Patient Type */}
        {step === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <PatientTypeScreen
              patient={patient}
              onSelectType={(type) => { setPatientType(type); setStep(1); }}
            />
          </div>
        )}

        {/* STEP 1: Clinical Intake Assessment Screen + Voice Scribe */}
        {step === 1 && (
          <div className="space-y-4">
            
            {/* Condition Specific Screen */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
              {patientType === 'pregnant' && <PregnantScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'child'    && <ChildScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'elderly'  && <ElderlyScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'adult'    && <AdultScreen onComplete={handleIntakeSubmit} />}
              {patientType === 'emergency'&& <EmergencyScreen onComplete={handleIntakeSubmit} />}
            </div>

            {/* ── AUDIO VOICE NOTE SECTION IN REFERRAL ── */}
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">{t.voiceNoteTitle}</h3>
                    <p className="text-[11px] text-slate-400">{t.voiceNoteSub}</p>
                  </div>
                </div>

                <select
                  value={audioLang}
                  onChange={e => setAudioLang(e.target.value)}
                  className="text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
                >
                  <option value="mr-IN">मराठी</option>
                  <option value="hi-IN">हिंदी</option>
                  <option value="en-IN">English</option>
                </select>
              </div>

              <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-100 flex flex-col items-center justify-center gap-2.5">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{t.startRec}</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                      <span className="font-mono font-black text-red-700 text-sm">
                        {t.recActive}{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>{t.stopRec}</span>
                    </button>
                  </div>
                )}

                {audioBlobUrl && (
                  <div className="w-full space-y-1 bg-white p-2.5 rounded-xl border border-purple-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-900 flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-purple-600" /> {t.memoPlayer}
                      </span>
                      <button type="button" onClick={() => setAudioBlobUrl(null)} className="text-red-500 hover:text-red-700 text-[11px] font-bold cursor-pointer">
                        {t.removeAudio}
                      </button>
                    </div>
                    <audio controls src={audioBlobUrl} className="w-full h-8" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={voiceNotes}
                  onChange={e => setVoiceNotes(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  className="w-full border border-purple-200 rounded-xl p-3 text-xs text-slate-800 bg-white font-medium focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: Triage Review Screen */}
        {step === 2 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs text-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
              aiResult?.priority === 'RED' ? 'bg-red-100 text-red-600' :
              aiResult?.priority === 'ORANGE' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'
            }`}>
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase border ${
                aiResult?.priority === 'RED' ? 'bg-red-100 text-red-800 border-red-300' :
                aiResult?.priority === 'ORANGE' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {aiResult?.priority === 'RED' ? t.priorityRed : aiResult?.priority === 'ORANGE' ? t.priorityOrange : t.priorityGreen}
              </span>

              <p className="text-sm font-bold text-slate-800 mt-3 max-w-md mx-auto leading-relaxed">
                {aiResult?.note}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep(3)}
                className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t.continueRouting}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Hospital & Department Routing */}
        {step === 3 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#16324F]">{t.routing}</h3>
                <p className="text-xs text-slate-400">{patient?.name}</p>
              </div>
            </div>

            {/* Destination Hospital Combobox */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.hospitalSelect} <span className="text-red-500">*</span>
              </label>
              <select
                value={hospital}
                onChange={e => {
                  const val = e.target.value;
                  setHospital(val);
                  const matched = facilitiesList.find(f => f.name === val);
                  if (matched) setSelectedFacility(matched);
                }}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-bold text-[#16324F] bg-white focus:outline-none focus:border-[#008F83] cursor-pointer"
              >
                {facilitiesList.length > 0 ? (
                  facilitiesList.map(f => (
                    <option key={f.id} value={f.name}>
                      {f.name} ({f.district})
                    </option>
                  ))
                ) : (
                  HOSPITALS.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))
                )}
              </select>
            </div>

            {/* Simplified Clinical Department Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.deptSelect} <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-bold text-[#16324F] bg-white focus:outline-none focus:border-[#008F83] cursor-pointer"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* ASHA Escort / JSY Flag */}
            <div className="p-4 bg-[#E8F7F3] border border-teal-200 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="jsyClaim"
                checked={isJsyClaim}
                onChange={e => setIsJsyClaim(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-teal-300 mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="jsyClaim" className="text-xs font-black text-teal-950 block cursor-pointer">
                  {t.jsyLabel}
                </label>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  {t.jsySub}
                </p>
              </div>
            </div>

            {routeError && (
              <p className="text-xs font-bold text-red-600 text-center">{routeError}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t.back}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-[2] py-3.5 bg-[#008F83] hover:bg-[#007A70] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? t.submitting : t.submitReferral}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}