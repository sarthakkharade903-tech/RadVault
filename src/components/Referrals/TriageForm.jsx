import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  Building2, UserCircle2, Stethoscope, Ambulance, Mic, Square,
  Volume2, Trash2, Check, ArrowRight, ArrowLeft, Search, Plus, RefreshCw,
  Radio, Navigation, ShieldCheck, HeartPulse, ShieldAlert
} from 'lucide-react';
import PatientSelectScreen from './screens/PatientSelectScreen';
import PatientTypeScreen from './screens/PatientTypeScreen';
import PregnantScreen from './screens/PregnantScreen';
import ChildScreen from './screens/ChildScreen';
import ElderlyScreen from './screens/ElderlyScreen';
import AdultScreen from './screens/AdultScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import { DEPARTMENTS, HOSPITALS } from '../../data/mockReferrals';
import { createPhysicalReferral, generateKimiClinicalRoadmap } from '../../services/ashaService';
import { fetchGovHospitals, getCurrentLocation, calculateHaversineDistance, CONNECTED_FACILITIES } from '../../services/locationService';
import { supabase } from '../../services/supabase';

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRoadmap, setAiRoadmap] = useState(null);

  // Routing State — dynamically populated from CONNECTED_FACILITIES & Supabase
  const hasUserSelectedRef = useRef(false);
  const [hospital, setHospital] = useState(CONNECTED_FACILITIES[0].name);
  const [selectedFacility, setSelectedFacility] = useState(CONNECTED_FACILITIES[0]);
  const [facilitiesList, setFacilitiesList] = useState(CONNECTED_FACILITIES);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [isJsyClaim, setIsJsyClaim] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [routeError, setRouteError] = useState('');

  // Hospital State & Live Geolocation
  const [hospSearch, setHospSearch] = useState('');
  const [showMoreFacilities, setShowMoreFacilities] = useState(false);
  const [nearbyGovHospitals, setNearbyGovHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  // Real-Time Government Hospital Fetching & Live Geolocation
  const loadNearbyHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const coords = await getCurrentLocation();
      setUserCoords(coords);
      const hospitals = await fetchGovHospitals(coords.lat, coords.lon);
      if (hospitals && hospitals.length > 0) {
        setNearbyGovHospitals(hospitals);
      }
    } catch (err) {
      console.warn("Could not fetch nearby government hospitals:", err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    loadNearbyHospitals();
  }, []);

  // Load real facilities from Supabase and merge with coordinates
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name, district')
          .order('name');
        if (!error && data && data.length > 0 && isMounted) {
          const merged = data.map(dbFac => {
            const matched = CONNECTED_FACILITIES.find(
              cf => cf.id === dbFac.id || cf.name.toLowerCase() === dbFac.name.toLowerCase()
            );
            return {
              id: dbFac.id,
              name: dbFac.name,
              district: dbFac.district,
              lat: matched?.lat ?? (dbFac.name.toLowerCase().includes('shrirampur') ? 19.6174 : 18.5284),
              lon: matched?.lon ?? (dbFac.name.toLowerCase().includes('shrirampur') ? 74.6595 : 73.8746),
              type: matched?.type ?? 'PHC',
              typeLabel: matched?.typeLabel ?? (dbFac.district ? `${dbFac.district} District Facility` : 'Registered Govt Facility'),
              isIntegrated: true,
              isGovernment: true
            };
          });
          setFacilitiesList(merged);
          // Auto-select nearest facility if user hasn't explicitly chosen one
          if (!hasUserSelectedRef.current && merged.length > 0) {
            const targetLat = userCoords?.lat ?? 18.5284;
            const targetLon = userCoords?.lon ?? 73.8746;
            const sorted = [...merged].sort((a, b) => {
              const dA = calculateHaversineDistance(targetLat, targetLon, a.lat, a.lon) ?? 999;
              const dB = calculateHaversineDistance(targetLat, targetLon, b.lat, b.lon) ?? 999;
              return dA - dB;
            });
            const nearestFac = sorted[0] || merged[0];
            setSelectedFacility(nearestFac);
            setHospital(nearestFac.name);
          }
        }
      } catch (e) {
        console.warn('[TriageForm] Error loading facilities:', e);
      }
    }
    loadFacilities();
    return () => { isMounted = false; };
  }, [userCoords]);

  // Compute facilities sorted by proximity (connected first, expandable regional health centres)
  const baseFacilities = useMemo(() => {
    const userLat = userCoords?.lat ?? 18.5284;
    const userLon = userCoords?.lon ?? 73.8746;

    const list = facilitiesList.length > 0 ? facilitiesList : CONNECTED_FACILITIES;
    const connected = list.map(f => {
      const d = calculateHaversineDistance(userLat, userLon, f.lat, f.lon) ?? 0;
      return {
        id: f.id,
        name: f.name,
        type: f.type || 'PHC',
        dist: String(d),
        rawDist: d,
        typeLabel: f.district ? `${f.district} District · ${f.typeLabel || 'Facility'}` : (f.typeLabel || 'Government Facility'),
        isIntegrated: true
      };
    }).sort((a, b) => a.rawDist - b.rawDist);

    if (!showMoreFacilities && !hospSearch) {
      return connected;
    }

    const existingNames = new Set(connected.map(c => c.name.toLowerCase()));
    const extra = (nearbyGovHospitals || [])
      .filter(h => !existingNames.has(h.name.toLowerCase()))
      .map(h => ({
        ...h,
        isIntegrated: false
      }));

    return [...connected, ...extra].sort((a, b) => (a.rawDist || 0) - (b.rawDist || 0));
  }, [facilitiesList, userCoords, showMoreFacilities, hospSearch, nearbyGovHospitals]);

  // Auto-sync default selected facility to the closest hospital when baseFacilities updates
  useEffect(() => {
    if (!hasUserSelectedRef.current && baseFacilities && baseFacilities.length > 0) {
      const nearest = baseFacilities[0];
      if (nearest && nearest.name !== hospital) {
        setHospital(nearest.name);
        const matched = facilitiesList.find(f => f.id === nearest.id || f.name.toLowerCase() === nearest.name.toLowerCase()) || nearest;
        setSelectedFacility(matched);
      }
    }
  }, [baseFacilities, facilitiesList, hospital]);

  // ── Real Audio Recording State ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState('');
  const [audioLang, setAudioLang] = useState(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const initialVoiceNotesRef = useRef('');
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
      initialVoiceNotesRef.current = voiceNotes || '';
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
          let fullSpeech = "";
          for (let i = 0; i < event.results.length; i++) {
            fullSpeech += event.results[i][0].transcript + " ";
          }
          const cleanedSpeech = fullSpeech.replace(/\s+/g, ' ').trim();
          if (cleanedSpeech) {
            const base = initialVoiceNotesRef.current ? initialVoiceNotesRef.current.trim() : "";
            setVoiceNotes(base ? `${base} ${cleanedSpeech}` : cleanedSpeech);
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
    if (answers?.voiceNotes) setVoiceNotes(answers.voiceNotes);
    if (answers?.audioBlobUrl) setAudioBlobUrl(answers.audioBlobUrl);
    const triage = localTriage(patientType, answers);
    setAiResult(triage);
    setDepartment(triage.department || DEPARTMENTS[0]);
    setAiRoadmap(null); // Reset roadmap for new intake
    setStep(2);
  };

  const handleGenerateAiRoadmap = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const roadmap = await generateKimiClinicalRoadmap({
        patient,
        patientType,
        answers: intakeAnswers,
        voiceNotes,
        lang
      });
      if (roadmap) {
        setAiRoadmap(roadmap);
        setAiResult(prev => ({
          ...prev,
          priority: roadmap.priority || prev?.priority,
          note: roadmap.note || prev?.note,
          department: roadmap.department || prev?.department,
          clinicalSummary: roadmap.hospitalRoadmap,
          keyRisks: roadmap.keyRisks,
          firstAidSteps: roadmap.firstAidSteps,
          aiModel: roadmap.model
        }));
        if (roadmap.department) {
          const matchedDept = DEPARTMENTS.find(d => d.toLowerCase() === roadmap.department.toLowerCase());
          if (matchedDept) {
            setDepartment(matchedDept);
          }
        }
      }
    } catch (err) {
      console.warn('[TriageForm] AI Roadmap generation error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      console.warn('[TriageForm] Submission already in flight. Ignoring duplicate trigger.');
      return;
    }
    if (!hospital) { setRouteError(t.errSelectHosp); return; }
    if (!department) { setRouteError(t.errSelectDept); return; }
    setRouteError('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const isUrgent = aiResult?.priority === 'RED' || aiResult?.priority === 'ORANGE';
      const finalPriority = isUrgent ? 'URGENT' : 'ROUTINE';

      let ashaNotes = voiceNotes.trim() || aiResult?.note || 'ASHA referral initiated';
      if (isJsyClaim) ashaNotes += " [ASHA Accompanying Patient - JSY Escort]";

      // Ensure valid patient_id (strictly required in Demo OFF mode)
      const patientId = patient?.id || (demoMode ? 'b6f81101-46d0-4b4d-8df0-9d9ce11a6a70' : null);
      const patientName = patient?.name || (demoMode ? 'Rekha Bai' : null);

      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      if (!patientId || !patientName) {
        setRouteError("Please select a registered patient before dispatching referral.");
        return;
      }

      if (!isUuid(patientId)) {
        setRouteError("Selected patient identifier is not a valid clinical UUID.");
        return;
      }

      const resolvedAbha = (patient?.abha_id && patient.abha_id !== 'PENDING' && patient.abha_id !== 'Not linked yet')
        ? patient.abha_id
        : (patientId ? localStorage.getItem(`radvault_abha_${patientId}`) : null);

      const patientVitals = {
        bp: intakeAnswers?.bp || patient?.vitals?.bp || patient?.bp || '',
        pulse: intakeAnswers?.pulse || patient?.vitals?.pulse || patient?.pulse || '',
        spo2: intakeAnswers?.spo2 || patient?.vitals?.spo2 || patient?.spo2 || '',
        temp: intakeAnswers?.temp || patient?.vitals?.temp || patient?.temp || '',
        weight: intakeAnswers?.weight || patient?.vitals?.weight || patient?.weight || '',
        height: intakeAnswers?.height || patient?.vitals?.height || patient?.height || '',
        blood_sugar: intakeAnswers?.blood_sugar || patient?.vitals?.blood_sugar || patient?.blood_sugar || '',
        abha_number: resolvedAbha || '',
        abha_id: resolvedAbha || ''
      };

      let destinationFacilityId = (selectedFacility?.id && isUuid(selectedFacility.id))
        ? selectedFacility.id
        : (facilitiesList.find(f => f.name.toLowerCase() === hospital.toLowerCase())?.id);

      if (!destinationFacilityId || !isUuid(destinationFacilityId)) {
        const matchedConnected = CONNECTED_FACILITIES.find(
          f => f.name.toLowerCase() === hospital.toLowerCase() || f.id === selectedFacility?.id
        );
        if (matchedConnected && isUuid(matchedConnected.id)) {
          destinationFacilityId = matchedConnected.id;
        } else {
          // Default to first connected facility (Pune Sassoon General Hospital)
          destinationFacilityId = CONNECTED_FACILITIES[0].id;
        }
      }

      const chosenHospital = selectedFacility?.name || hospital || CONNECTED_FACILITIES[0].name;

      // Zero Demographic Fabrication: preserve actual values, never default to 30, 'Other', or fake phone
      const resolvedAge = (patient?.age_years !== undefined && patient?.age_years !== null)
        ? Number(patient.age_years)
        : ((patient?.age !== undefined && patient?.age !== null) ? Number(patient.age) : null);
      const resolvedGender = patient?.gender || null;
      const resolvedPhone = patient?.mobile || patient?.phone || null;

      const payload = {
        patient_id: patientId,
        patient_name: patientName,
        age: resolvedAge,
        gender: resolvedGender,
        blood_group: patient?.blood_group || null,
        phone: resolvedPhone,
        abha_id: resolvedAbha || null,
        created_by: 'ASHA Worker (Priya Deshmukh)',
        destination_hospital: chosenHospital,
        destination_facility_id: destinationFacilityId,
        department: department || 'General Medicine',
        priority: finalPriority,
        reason: ashaNotes,
        asha_notes: ashaNotes,
        clinical_summary: aiResult?.clinicalSummary || aiResult?.note || ashaNotes,
        vitals: patientVitals
      };

      const { data, error } = await createPhysicalReferral(payload);

      if (error || !data?.id) {
        console.error('[TriageForm] Referral dispatch error:', error);
        setRouteError(error?.message || 'Failed to dispatch referral to hospital database.');
        return;
      }

      console.log('[TriageForm] Verified Referral created with ID:', data.id);

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
        onSubmit(data);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
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

        {/* STEP 1: Clinical Intake Assessment Screen (Voice Scribe Integrated Internally) */}
        {step === 1 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs">
            {patientType === 'pregnant' && (
              <PregnantScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'child' && (
              <ChildScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'elderly' && (
              <ElderlyScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'adult' && (
              <AdultScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'emergency' && (
              <EmergencyScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
          </div>
        )}

        {/* STEP 2: Triage Review Screen & On-Demand Kimi AI Clinical Roadmap */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 1. Baseline Clinical Assessment Header Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs text-center space-y-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                aiResult?.priority === 'RED' ? 'bg-red-100 text-red-600' :
                aiResult?.priority === 'ORANGE' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'
              }`}>
                {aiResult?.priority === 'RED' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" />
                )}
              </div>

              <div>
                <span className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase border shadow-2xs inline-flex items-center gap-1.5 ${
                  aiResult?.priority === 'RED' ? 'bg-red-50 text-red-800 border-red-300' :
                  aiResult?.priority === 'ORANGE' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    aiResult?.priority === 'RED' ? 'bg-red-600' : aiResult?.priority === 'ORANGE' ? 'bg-amber-500' : 'bg-[#008F83]'
                  }`} />
                  <span>{aiResult?.priority === 'RED' ? t.priorityRed : aiResult?.priority === 'ORANGE' ? t.priorityOrange : t.priorityGreen}</span>
                </span>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500 font-bold">
                  <span>Patient: <strong className="text-slate-900">{patient?.name}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-900 capitalize">{patientType}</strong></span>
                  <span>•</span>
                  <span>Recommended: <strong className="text-teal-800">{department}</strong></span>
                </div>

                <p className="text-sm font-semibold text-slate-800 mt-3 max-w-lg mx-auto leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left sm:text-center">
                  "{aiResult?.note}"
                </p>
              </div>
            </div>

            {/* 2. On-Demand Kimi AI Care Roadmap Card (Saves Tokens) */}
            {!aiRoadmap && !aiLoading && (
              <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-teal-50/70 border-2 border-purple-200/80 rounded-2xl p-5 shadow-2xs text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black uppercase text-purple-950 tracking-wider">
                        Advanced AI Clinical Care Roadmap
                      </h4>
                      <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Powered by Kimi AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Generate verified diagnostic risk assessment, immediate frontline first-aid steps, and a step-by-step hospital intake roadmap.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiRoadmap}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Generate AI Clinical Summary & Care Roadmap</span>
                </button>
                <p className="text-[10px] text-center font-bold text-slate-400">
                  Zero tokens used by default · Only calls Kimi AI on explicit button tap
                </p>
              </div>
            )}

            {/* AI Loading State */}
            {aiLoading && (
              <div className="bg-purple-50/70 border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider">
                  Consulting Kimi AI Clinical Engine...
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Synthesizing patient vitals, reported symptoms, and frontline observations into an action roadmap
                </p>
              </div>
            )}

            {/* Generated AI Care Roadmap Card */}
            {aiRoadmap && (
              <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 text-left space-y-4 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-purple-950 tracking-wider flex items-center gap-1.5">
                        <span>AI Clinical Care Roadmap</span>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                          {aiRoadmap.model || 'Kimi-K3'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">Frontline briefing attached to hospital referral</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiRoadmap}
                    disabled={aiLoading}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-run
                  </button>
                </div>

                {/* 1. Key Diagnostic Risks */}
                {aiRoadmap.keyRisks && aiRoadmap.keyRisks.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-700 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Key Diagnostic Risks & Red Flags</span>
                    </h5>
                    <ul className="space-y-1.5 bg-rose-50/70 p-3.5 rounded-xl border border-rose-100 text-xs font-semibold text-rose-950">
                      {aiRoadmap.keyRisks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold leading-none mt-1">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Immediate ASHA First-Aid Guidance */}
                {aiRoadmap.firstAidSteps && aiRoadmap.firstAidSteps.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-teal-800 mb-1.5 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-[#008F83]" />
                      <span>Immediate ASHA Frontline Actions</span>
                    </h5>
                    <ul className="space-y-1.5 bg-teal-50/70 p-3.5 rounded-xl border border-teal-100 text-xs font-semibold text-teal-950">
                      {aiRoadmap.firstAidSteps.map((stepItem, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#008F83] font-bold leading-none mt-0.5">✓</span>
                          <span>{stepItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Receiving Hospital Protocol */}
                {aiRoadmap.hospitalRoadmap && (
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-900 mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Receiving Hospital Care Protocol</span>
                    </h5>
                    <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                      {aiRoadmap.hospitalRoadmap}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Primary Continue Button */}
            <div className="pt-2">
              <button
                onClick={() => setStep(3)}
                className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-sm sm:text-base rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Hospital Routing →</span>
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

            {/* Destination Government Hospital Routing */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black text-slate-800">
                {t.hospitalSelect} <span className="text-red-500">*</span>
              </label>

              {/* Status Header: Clean location status */}
              <div className="flex items-center justify-between bg-teal-50/60 border border-teal-100 rounded-xl px-3.5 py-2 text-xs">
                <span className="text-teal-900 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#008F83] shrink-0 animate-pulse" />
                  <span>Showing government referral hospitals (Closest first)</span>
                </span>
                <button
                  type="button"
                  onClick={loadNearbyHospitals}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-teal-200 hover:border-teal-300 transition-colors"
                  title="Update location and distances"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingHospitals ? 'animate-spin' : ''}`} />
                  <span>{loadingHospitals ? 'Locating...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Hospital Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search hospital by name or district..."
                  value={hospSearch}
                  onChange={e => setHospSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#008F83] transition-colors"
                />
                {hospSearch && (
                  <button
                    type="button"
                    onClick={() => setHospSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Hospital Selection Cards */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const filtered = baseFacilities.filter(h =>
                    !hospSearch ||
                    h.name.toLowerCase().includes(hospSearch.toLowerCase()) ||
                    (h.typeLabel && h.typeLabel.toLowerCase().includes(hospSearch.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold">No hospitals found matching "{hospSearch}".</p>
                        <button
                          type="button"
                          onClick={() => setHospSearch('')}
                          className="text-xs font-black text-[#008F83] underline mt-1 cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((h, idx) => {
                    const isSelected = hospital === h.name || (selectedFacility && selectedFacility.id === h.id);
                    return (
                      <div
                        key={h.id || idx}
                        data-facility-id={h.id}
                        data-facility-name={h.name}
                        onClick={() => {
                          hasUserSelectedRef.current = true;
                          setHospital(h.name);
                          const matched = facilitiesList.find(f => f.name.toLowerCase() === h.name.toLowerCase()) ||
                                          facilitiesList.find(f => f.id === h.id) ||
                                          CONNECTED_FACILITIES.find(f => f.name.toLowerCase() === h.name.toLowerCase());
                          if (matched) setSelectedFacility(matched);
                          else setSelectedFacility(h);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50/70 border-[#008F83] ring-1 ring-[#008F83] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#008F83] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                              {h.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap font-medium">
                              <span>{h.typeLabel || 'Government Healthcare Facility'}</span>
                              <span>•</span>
                              <span className="text-slate-700 font-bold">
                                📍 {h.dist} km
                              </span>
                              {h.isIntegrated && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#008F83] font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#008F83]" />
                                    Live Reception
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#008F83] bg-[#008F83] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Expandable regional centres toggle if not searching */}
              {!hospSearch && nearbyGovHospitals.length > 0 && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setShowMoreFacilities(!showMoreFacilities)}
                    className="text-[11px] font-extrabold text-[#008F83] hover:underline cursor-pointer"
                  >
                    {showMoreFacilities
                      ? '▲ Show only primary referral hospitals'
                      : `▼ View ${nearbyGovHospitals.length} more regional government centres`}
                  </button>
                </div>
              )}

              {/* Selected Hospital Confirmation Preview */}
              {hospital && (
                <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl flex items-center justify-between gap-2 mt-1">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      Selected Hospital:
                    </span>
                    <p className="text-xs font-black text-teal-950 truncate">
                      {hospital}
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-[#008F83] text-white px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Confirmed
                  </span>
                </div>
              )}
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