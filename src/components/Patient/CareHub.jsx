import React, { useState, useEffect } from "react";
import {
  Stethoscope, Plus, X, AlertTriangle, Send, Clock, CheckCircle2, CheckCheck, 
  Calendar, Building2, HeartPulse, Baby, User, Loader2, MapPin,
  Phone, Video, VideoOff, Mic, MicOff, PhoneOff, PhoneCall, Shield,
  Sparkles, Check, ArrowRight, Download, FileText, Activity
} from "lucide-react";
import { getCareRequests, createCareRequest } from "../../services/ashaService";

// ─── Translations for Care Hub ──────────────────────────────
const CARE_TRANSLATIONS = {
  en: {
    title: "Care Hub & Health Facilities",
    subtitle: "Teleconsultation, hospital appointments, and emergency care",
    startTeleconsult: "Instant Teleconsult",
    bookAppointment: "Book PHC Visit",
    activeCare: "Active Referrals & Consultations",
    noActiveTitle: "No active care requests",
    noActiveSub: "Your appointments, ASHA clinical referrals, and virtual teleconsultations will appear here with live tracking.",
    emergencyHelplines: "24x7 Emergency Helplines",
    callAmbulance: "Free Ambulance",
    teleConsult: "Medical Helpline",
    maternalHelp: "Women Helpline",
    childHelp: "Childline",
    nearbyFacilities: "Nearby Government Health Centres",
    shirwalPhc: "Shirwal Primary Health Centre (PHC)",
    shirwalSub: "2.4 km away · Open 24 Hours · Free OPD & Emergency",
    sataraDistrict: "Satara District Civil Hospital",
    sataraSub: "Tertiary Referral Centre · Multi-Specialty",
    callNow: "Call",
    filterAll: "All Care",
    filterAsha: "ASHA Referrals",
    filterAppointments: "In-Person Bookings",
    filterTeleconsult: "Teleconsults",
    steps: {
      SUBMITTED: "Submitted",
      PENDING_PHC: "PHC Review",
      ACCEPTED: "Confirmed",
      COMPLETED: "Visited"
    }
  },
  mr: {
    title: "आरोग्य केंद्र व सेवा केंद्र",
    subtitle: "व्हर्च्युअल डॉक्टर सल्ला, रुग्णालय तपासणी व आपत्कालीन मदत",
    startTeleconsult: "थेट डॉक्टर सल्ला",
    bookAppointment: "आरोग्य केंद्रात वेळ नोंदवा",
    activeCare: "सक्रिय संदर्भ व उपचार",
    noActiveTitle: "सध्या कोणतीही सक्रिय मागणी नाही",
    noActiveSub: "आशा कार्यकर्त्याने केलेले रेफरल, थेट घेतलेली वेळ आणि व्हिडिओ सल्ला येथे दिसतील.",
    emergencyHelplines: "२४ तास आपत्कालीन आरोग्य क्रमांक",
    callAmbulance: "मोफत रुग्णवाहिका",
    teleConsult: "आरोग्य सल्ला",
    maternalHelp: "महिला मदत कक्ष",
    childHelp: "बाल मदत कक्ष",
    nearbyFacilities: "जवळचे शासकीय रुग्णालय व आरोग्य केंद्र",
    shirwalPhc: "शिरवळ प्राथमिक आरोग्य केंद्र",
    shirwalSub: "२.४ किमी अंतरावर · २४ तास सुरू · मोफत तपासणी",
    sataraDistrict: "सातारा जिल्हा शासकीय रुग्णालय",
    sataraSub: "जिल्हास्तरीय संदर्भ सेवा रुग्णालय",
    callNow: "फोन करा",
    filterAll: "सर्व",
    filterAsha: "आशा रेफरल",
    filterAppointments: "थेट भेटी",
    filterTeleconsult: "व्हिडिओ सल्ला",
    steps: {
      SUBMITTED: "नोंदणी झाली",
      PENDING_PHC: "तपासणी सुरू",
      ACCEPTED: "वेळ निश्चित",
      COMPLETED: "तपासणी पूर्ण"
    }
  },
  hi: {
    title: "स्वास्थ्य सेवा केंद्र",
    subtitle: "टेली-परामर्श, अस्पताल समय एवं आपातकालीन स्वास्थ्य सहायता",
    startTeleconsult: "डॉक्टर से बात करें",
    bookAppointment: "अस्पताल में समय बुक करें",
    activeCare: "सक्रिय रेफरल व परामर्श",
    noActiveTitle: "कोई सक्रिय सेवा अनुरोध नहीं है",
    noActiveSub: "आशा कार्यकर्ता के रेफरल, अस्पताल अपॉइंटमेंट और टेली-परामर्श का लाइव स्टेटस यहां दिखेगा।",
    emergencyHelplines: "24 घंटे आपातकालीन स्वास्थ्य नंबर",
    callAmbulance: "निशुल्क एम्बुलेंस",
    teleConsult: "स्वास्थ्य परामर्श",
    maternalHelp: "महिला हेल्पलाइन",
    childHelp: "बाल सहायता",
    nearbyFacilities: "निकटतम सरकारी स्वास्थ्य केंद्र",
    shirwalPhc: "शिरवल प्राथमिक स्वास्थ्य केंद्र (पीएचसी)",
    shirwalSub: "2.4 किमी दूरी · 24 घंटे खुला · निशुल्क ओपीडी",
    sataraDistrict: "सतारा जिला सामान्य अस्पताल",
    sataraSub: "जिला स्तरीय सुपर स्पेशियलिटी केंद्र",
    callNow: "कॉल करें",
    filterAll: "सभी",
    filterAsha: "आशा रेफरल",
    filterAppointments: "अस्पताल अपॉइंटमेंट",
    filterTeleconsult: "टेली-परामर्श",
    steps: {
      SUBMITTED: "दर्ज हुआ",
      PENDING_PHC: "समीक्षा जारी",
      ACCEPTED: "स्वीकृत",
      COMPLETED: "पूर्ण"
    }
  }
};

const DEPARTMENTS = [
  "General Medicine & OPD",
  "Maternal Health & ANC",
  "Pediatrics & Child Care",
  "Cardiology & Blood Pressure",
  "Chest, Cough & TB DOTS",
  "Orthopedics & Bone Care"
];

const SLOTS = ["Morning (9:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 4:00 PM)"];

const STATUS_IDX = { SUBMITTED: 0, PENDING_PHC: 1, ACCEPTED: 2, COMPLETED: 3 };

// ─── Referral Card with Source Badging ────────────────────────
function ReferralCard({ req, lang, onViewRx }) {
  const t = CARE_TRANSLATIONS[lang] || CARE_TRANSLATIONS.en;
  const stepIdx = STATUS_IDX[req.status] ?? 0;
  const isActive = req.status !== "COMPLETED";

  const isAsha = req.source === "ASHA_REFERRED";
  const isTele = req.source === "TELECONSULT";

  const STEPS = [
    { key: "SUBMITTED",   label: t.steps.SUBMITTED,   Icon: Send },
    { key: "PENDING_PHC", label: t.steps.PENDING_PHC, Icon: Clock },
    { key: "ACCEPTED",    label: t.steps.ACCEPTED,    Icon: CheckCircle2 },
    { key: "COMPLETED",   label: t.steps.COMPLETED,   Icon: CheckCheck },
  ];

  return (
    <div className={`bg-white rounded-2xl border transition-all overflow-hidden ${
      isAsha
        ? "border-l-4 border-l-red-500 border-slate-200 shadow-xs"
        : isTele
        ? "border-l-4 border-l-[#008F83] border-slate-200 shadow-xs"
        : "border-l-4 border-l-slate-400 border-slate-200 shadow-xs"
    }`}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-slate-900 leading-tight">
                {req.facility || "Shirwal Primary Health Centre"}
              </p>
              {/* Origin Badge */}
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isAsha
                  ? "bg-red-50 text-red-700 border-red-200"
                  : isTele
                  ? "bg-[#E8F7F3] text-[#008F83] border-[#008F83]/30"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {isAsha ? "🚨 ASHA Clinical Referral" : isTele ? "📹 Virtual Teleconsult" : "👤 Direct OPD Booking"}
              </span>
            </div>
            <p className="text-xs font-bold text-[#008F83] mt-0.5">{req.department || "General OPD"}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              req.priority === "URGENT" || req.priority === "HIGH" || req.priority === "RED"
                ? "bg-red-100 text-red-800"
                : req.priority === "ORANGE" || req.priority === "MEDIUM"
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-50 text-emerald-800"
            }`}>
              {req.priority || "ROUTINE"}
            </span>
          </div>
        </div>

        {req.reason && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
            "{req.reason}"
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-500 font-semibold flex-wrap gap-2">
          <span>{req.created_by ? `Origin: ${req.created_by}` : "Self-scheduled"}</span>
          {isTele && req.status === "COMPLETED" && (
            <button
              onClick={() => onViewRx && onViewRx(req)}
              className="text-[11px] font-extrabold text-[#008F83] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View e-Prescription (Rx)</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100">
        <div className="flex items-start gap-0">
          {STEPS.map((step, i) => {
            const done = i < stepIdx;
            const current = i === stepIdx;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-0.5 ${i === 0 ? "invisible" : done || current ? "bg-[#008F83]" : "bg-slate-200"}`} />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    done ? "bg-[#008F83] border-[#008F83]" :
                    current ? "bg-white border-[#008F83] shadow-xs ring-2 ring-[#008F83]/20" :
                    "bg-white border-slate-200"
                  }`}>
                    <step.Icon className={`w-3 h-3 ${done ? "text-white" : current ? "text-[#008F83]" : "text-slate-300"}`} strokeWidth={2.5} />
                  </div>
                  <div className={`flex-1 h-0.5 ${isLast ? "invisible" : done ? "bg-[#008F83]" : "bg-slate-200"}`} />
                </div>
                <p className={`text-[9px] font-bold text-center mt-1 leading-tight max-w-[64px] ${current ? "text-[#008F83] font-black" : "text-slate-400"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Virtual Teleconsultation Modal (eSanjeevani / KRY Model) ─
function TeleconsultModal({ member, onClose, onCompleted }) {
  const [step, setStep] = useState("intake"); // 'intake' | 'waiting' | 'call' | 'rx'
  const [symptom, setSymptom] = useState("Fever, headache & body aches");
  const [customNotes, setCustomNotes] = useState("");
  const [queuePos, setQueuePos] = useState(2);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [rxSummary, setRxSummary] = useState(null);

  // Call timer
  useEffect(() => {
    let interval = null;
    if (step === "call") {
      interval = setInterval(() => {
        setCallDuration(c => c + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Waiting room auto-advance simulation
  useEffect(() => {
    let timer = null;
    if (step === "waiting") {
      timer = setTimeout(() => {
        setQueuePos(1);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  const handleStartWaiting = () => {
    setStep("waiting");
  };

  const handleAcceptDoctorCall = () => {
    setStep("call");
    setCallDuration(0);
  };

  const handleEndCall = async () => {
    const rx = {
      doctorName: "Dr. Priya Sharma (MBBS)",
      facility: "Primary Health Centre - Shirwal",
      date: new Date().toLocaleDateString("en-IN"),
      diagnosis: "Acute Viral Febrile Illness with mild upper respiratory inflammation",
      medicines: [
        { name: "Tab. Paracetamol 500mg", dosage: "1 tablet thrice daily after food (3 days)" },
        { name: "Sachet ORS (Oral Rehydration)", dosage: "1 packet in 1 litre boiled cool water (daily)" },
        { name: "Tab. Cetirizine 10mg", dosage: "1 tablet at bedtime if nasal congestion persists" }
      ],
      advice: "Take adequate rest, monitor temperature every 6 hours, inform ASHA Priya Deshmukh if fever exceeds 102°F."
    };
    setRxSummary(rx);

    // Save to care_requests as COMPLETED teleconsultation
    try {
      await createCareRequest({
        patient_id: member?.id,
        patient_name: member?.name || "Village Patient",
        facility: "Primary Health Centre - Shirwal",
        department: "General Medicine & OPD",
        priority: "ROUTINE",
        reason: `Teleconsultation: ${symptom}. Dr. Priya Sharma prescribed Paracetamol & ORS.`,
        source: "TELECONSULT",
        created_by: "eSanjeevani Teleconsult (Dr. Priya Sharma)",
        status: "COMPLETED"
      });
    } catch (e) {
      console.warn("Teleconsult care_request log notice:", e);
    }

    setStep("rx");
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#16324F] to-[#008F83] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                eSanjeevani Virtual OPD
                <span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">LIVE</span>
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">PHC Shirwal Tele-Health Service</p>
            </div>
          </div>
          {step !== "call" && (
            <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs font-sans text-slate-800">
          
          {/* STEP 1: INTAKE */}
          {step === "intake" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#E8F7F3] border border-[#008F83]/30 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#008F83] text-white flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-xs text-slate-900">Dr. Priya Sharma (MBBS, DGO)</p>
                  <p className="text-[11px] text-slate-600">On-Duty Medical Officer · Shirwal PHC</p>
                  <p className="text-[10px] text-[#008F83] font-bold mt-0.5">🟢 Online & Accepting Patients</p>
                </div>
              </div>

              {/* Patient Profile & Vitals preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-700">Patient: {member?.name || "Village Patient"}</span>
                  <span className="text-[10px] font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded">ABHA Linked</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-slate-200">
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold">BP</p>
                    <p className="font-black text-xs text-slate-800">120/80</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold">Pulse</p>
                    <p className="font-black text-xs text-slate-800">76 bpm</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold">SpO2</p>
                    <p className="font-black text-xs text-slate-800">98%</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold">Temp</p>
                    <p className="font-black text-xs text-slate-800">98.6°F</p>
                  </div>
                </div>
              </div>

              {/* Chief Concern */}
              <div>
                <label className="font-black text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wider">
                  Select Reason for Consultation
                </label>
                <div className="space-y-1.5">
                  {[
                    "Fever, headache & body aches",
                    "Cough, cold & throat irritation",
                    "Antenatal pregnancy check & nausea review",
                    "Blood pressure / Sugar routine review",
                    "Skin rash or wound evaluation"
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSymptom(s)}
                      className={`w-full p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                        symptom === s
                          ? "bg-[#E8F7F3] border-[#008F83] text-[#008F83] ring-1 ring-[#008F83]"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional description for doctor (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Symptoms started 2 days ago after exposure to rain..."
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-[#008F83]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartWaiting}
                  className="w-full py-3.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Join Virtual Waiting Room</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VIRTUAL WAITING ROOM (KRY / eSanjeevani style) */}
          {step === "waiting" && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-[#E8F7F3] text-[#008F83] flex items-center justify-center mx-auto border border-[#008F83]/30 shadow-xs animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full uppercase tracking-wider">
                  Token: eS-SHIR-248
                </span>
                <h4 className="font-black text-slate-900 text-lg mt-2">
                  {queuePos === 1 ? "You are next in queue!" : "Doctor is consulting with previous patient"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Queue Position: <b className="text-slate-800">#{queuePos}</b> · Estimated wait: <b className="text-[#008F83]">{queuePos === 1 ? "~1 min" : "~3 mins"}</b>
                </p>
              </div>

              {/* Device Test Confirmation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase">Hardware Check</p>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-emerald-600" /> Microphone</span>
                  <span className="text-emerald-600 text-[10px]">🟢 Ready</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-emerald-600" /> Camera</span>
                  <span className="text-emerald-600 text-[10px]">🟢 Ready</span>
                </div>
              </div>

              {/* Ready to Connect Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAcceptDoctorCall}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer animate-bounce"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Doctor is Ready · Connect Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INTERACTIVE TELECONSULTATION CALL */}
          {step === "call" && (
            <div className="space-y-3">
              {/* Main Simulated Video Screen */}
              <div className="relative w-full h-64 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {/* Doctor Avatar & Video Frame */}
                <div className="text-center text-white space-y-2">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-teal-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                    👩‍⚕️
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-white">Dr. Priya Sharma</p>
                    <p className="text-[10px] text-teal-300">Shirwal PHC Tele-OPD</p>
                  </div>
                  {/* Live audio indicator */}
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-3 bg-teal-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-5 bg-teal-400 rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-4 bg-teal-400 rounded-full animate-pulse delay-150" />
                  </div>
                </div>

                {/* Patient Self-View PIP */}
                <div className="absolute top-3 right-3 w-20 h-24 bg-slate-800 border border-white/20 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white shadow-md">
                  <span className="text-xl">{isVideoOff ? "🚫" : "👤"}</span>
                  <span className="text-[9px] font-bold mt-1 text-slate-300">You</span>
                </div>

                {/* Call Timer Overlay */}
                <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-white text-[11px] font-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{formatTimer(callDuration)}</span>
                </div>
              </div>

              {/* Doctor Consultation Live Notes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Doctor's Observation</span>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  "Hello {member?.name || "Patient"}, I have reviewed your vitals and chief symptoms. Your blood pressure is normal. Recommending symptomatic fever management and oral hydration."
                </p>
              </div>

              {/* Call Control Toolbar */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                    isMuted ? "bg-red-100 text-red-600 border border-red-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                    isVideoOff ? "bg-red-100 text-red-600 border border-red-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                  title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End & Receive Prescription</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: POST-CONSULTATION e-PRESCRIPTION (Rx) */}
          {step === "rx" && rxSummary && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black text-xs text-emerald-900">Consultation Successfully Completed</p>
                  <p className="text-[11px] text-emerald-700">e-Prescription signed by Dr. Priya Sharma and saved to your health record.</p>
                </div>
              </div>

              {/* Prescription Document Card */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{rxSummary.facility}</h4>
                    <p className="text-[10px] text-slate-500">{rxSummary.doctorName} · {rxSummary.date}</p>
                  </div>
                  <span className="text-[9px] font-black bg-[#E8F7F3] text-[#008F83] px-2 py-0.5 rounded border border-[#008F83]/30 uppercase">
                    ABDM Verified Rx
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Diagnosis</p>
                  <p className="text-xs font-bold text-slate-800">{rxSummary.diagnosis}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prescribed Medicines (Free at PHC)</p>
                  <div className="space-y-1.5">
                    {rxSummary.medicines.map((m, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-extrabold text-xs text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.dosage}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-800 uppercase">Doctor's Advice</p>
                  <p className="text-[11px] text-amber-900 mt-0.5">{rxSummary.advice}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onCompleted && onCompleted();
                    onClose();
                  }}
                  className="flex-1 py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── In-Person Appointment Booking Modal (NHS DBS Model) ─────
function BookAppointmentModal({ member, onClose, onSaved }) {
  const [facility, setFacility] = useState("Shirwal Primary Health Centre (PHC)");
  const [dept, setDept] = useState("General Medicine & OPD");
  const [slot, setSlot] = useState("Morning (9:00 AM - 12:00 PM)");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!facility || !dept || !slot) {
      setError("Please select a facility, department, and time slot.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      await createCareRequest({
        patient_id: member.id,
        patient_name: member.name,
        facility,
        department: dept,
        slot_preference: slot,
        appointment_date: appointmentDate,
        priority: "ROUTINE",
        reason: `Self-scheduled in-person visit on ${appointmentDate} (${slot})`,
        source: "PATIENT_DIRECT"
      });
      setSaving(false);
      onSaved();
    } catch (e) {
      console.error(e);
      setError("Could not complete booking. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
        <div className="bg-gradient-to-r from-[#16324F] to-[#008F83] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 text-white rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Book In-Person PHC Consultation</h3>
              <p className="text-xs text-teal-100">Free Government Health OPD Registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-800 flex-1">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl font-bold">{error}</div>}

          <div>
            <label className="font-black text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">Select Hospital / PHC</label>
            <select
              value={facility}
              onChange={e => setFacility(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#008F83]"
            >
              <option value="Shirwal Primary Health Centre (PHC)">Primary Health Centre (PHC) - Shirwal</option>
              <option value="Rural Hospital - Khandala">Rural Hospital - Khandala</option>
              <option value="Sub-District Hospital - Wai">Sub-District Hospital - Wai</option>
              <option value="Satara District Civil Hospital">Satara District Civil Hospital</option>
            </select>
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">Appointment Date</label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setAppointmentDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#008F83]"
            />
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">Select Clinical Department</label>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDept(d)}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    dept === d ? "bg-[#E8F7F3] text-[#008F83] border-[#008F83] ring-1 ring-[#008F83]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">Preferred Time Slot</label>
            <div className="space-y-2">
              {SLOTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`w-full p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    slot === s ? "bg-[#E8F7F3] text-[#008F83] border-[#008F83] ring-1 ring-[#008F83]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Booking</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CareHub Component ──────────────────────────────────
export default function CareHub({ member }) {
  const lang = localStorage.getItem("radvault_asha_lang") || localStorage.getItem("radvault_patient_lang") || "en";
  const t = CARE_TRANSLATIONS[lang] || CARE_TRANSLATIONS.en;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showTeleconsult, setShowTeleconsult] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL"); // 'ALL' | 'ASHA' | 'DIRECT' | 'TELE'

  const load = async () => {
    if (!member?.id) return;
    setLoading(true);
    const { data } = await getCareRequests(member.id);
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [member?.id]);

  const filteredRequests = requests.filter(r => {
    if (activeFilter === "ASHA") return r.source === "ASHA_REFERRED";
    if (activeFilter === "DIRECT") return r.source === "PATIENT_DIRECT";
    if (activeFilter === "TELE") return r.source === "TELECONSULT";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32 font-sans text-slate-800 space-y-6">
      
      {/* ── Top Header with Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#008F83]" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Virtual Teleconsultation Button */}
          <button
            onClick={() => setShowTeleconsult(true)}
            className="flex items-center justify-center gap-1.5 bg-[#008F83] hover:bg-[#007A70] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>{t.startTeleconsult}</span>
          </button>

          {/* In-Person PHC Booking Button */}
          <button
            onClick={() => setShowBooking(true)}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#008F83]" />
            <span>{t.bookAppointment}</span>
          </button>
        </div>
      </div>

      {/* ── 24x7 Emergency Helplines Strip ── */}
      <div className="bg-[#E8F7F3] rounded-2xl border border-[#008F83]/30 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2.5">
          <Shield className="w-4 h-4 text-[#008F83]" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{t.emergencyHelplines}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a href="tel:108" className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#008F83] shadow-xs flex flex-col items-center text-center transition-all cursor-pointer">
            <span className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1"><Phone className="w-3.5 h-3.5" /></span>
            <span className="font-black text-slate-900 text-sm">108</span>
            <span className="text-[10px] text-slate-500 font-bold">{t.callAmbulance}</span>
          </a>
          <a href="tel:104" className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#008F83] shadow-xs flex flex-col items-center text-center transition-all cursor-pointer">
            <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-1"><HeartPulse className="w-3.5 h-3.5" /></span>
            <span className="font-black text-slate-900 text-sm">104</span>
            <span className="text-[10px] text-slate-500 font-bold">{t.teleConsult}</span>
          </a>
          <a href="tel:181" className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#008F83] shadow-xs flex flex-col items-center text-center transition-all cursor-pointer">
            <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-1"><User className="w-3.5 h-3.5" /></span>
            <span className="font-black text-slate-900 text-sm">181</span>
            <span className="text-[10px] text-slate-500 font-bold">{t.maternalHelp}</span>
          </a>
          <a href="tel:1098" className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#008F83] shadow-xs flex flex-col items-center text-center transition-all cursor-pointer">
            <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1"><Baby className="w-3.5 h-3.5" /></span>
            <span className="font-black text-slate-900 text-sm">1098</span>
            <span className="text-[10px] text-slate-500 font-bold">{t.childHelp}</span>
          </a>
        </div>
      </div>

      {/* ── Active Care & Referrals Section with Source Filters ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.activeCare}</h3>
          
          {/* Source Segregation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { key: "ALL", label: t.filterAll },
              { key: "ASHA", label: t.filterAsha },
              { key: "DIRECT", label: t.filterAppointments },
              { key: "TELE", label: t.filterTeleconsult },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                  activeFilter === f.key
                    ? "bg-[#008F83] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />)}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 bg-[#E8F7F3] text-[#008F83] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm">{t.noActiveTitle}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">{t.noActiveSub}</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowTeleconsult(true)}
                className="px-4 py-2 bg-[#008F83] hover:bg-[#007A70] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                + {t.startTeleconsult}
              </button>
              <button
                onClick={() => setShowBooking(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                + {t.bookAppointment}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(r => (
              <ReferralCard key={r.id} req={r} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* ── Nearby Government Facilities ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.nearbyFacilities}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F7F3] text-[#008F83] flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">{t.shirwalPhc}</p>
                <p className="text-[11px] text-slate-500">{t.shirwalSub}</p>
              </div>
            </div>
            <a href="tel:02169244222" className="px-3 py-1.5 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer">
              <Phone className="w-3 h-3" />
              <span>{t.callNow}</span>
            </a>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">{t.sataraDistrict}</p>
                <p className="text-[11px] text-slate-500">{t.sataraSub}</p>
              </div>
            </div>
            <a href="tel:02162233240" className="px-3 py-1.5 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer">
              <Phone className="w-3 h-3" />
              <span>{t.callNow}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showTeleconsult && (
        <TeleconsultModal
          member={member}
          onClose={() => setShowTeleconsult(false)}
          onCompleted={() => { load(); }}
        />
      )}

      {showBooking && (
        <BookAppointmentModal
          member={member}
          onClose={() => setShowBooking(false)}
          onSaved={() => { setShowBooking(false); load(); }}
        />
      )}

    </div>
  );
}
