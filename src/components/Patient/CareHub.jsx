import React, { useState, useEffect } from "react";
import {
  Stethoscope, Plus, X, AlertTriangle, Send, Clock, CheckCircle2, CheckCheck, 
  Calendar, Building2, HeartPulse, Baby, User, Loader2, History, MapPin,
  Phone, Shield, Sparkles, Navigation, Check
} from "lucide-react";
import { getCareRequests, createCareRequest } from "../../services/ashaService";
import { fetchGovHospitals, getCurrentLocation } from '../../services/locationService';

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const CARE_TRANSLATIONS = {
  en: {
    title: "Care Hub & Health Facilities",
    subtitle: "Active hospital referrals, appointments, and emergency care",
    bookAppointment: "Book PHC Appointment",
    activeCare: "Active Referrals & Care",
    noActiveTitle: "No active referrals",
    noActiveSub: "When your ASHA worker refers you to a hospital or specialist, the live tracker will appear here.",
    pastCare: "Past Hospital Visits",
    emergencyHelplines: "24x7 Emergency Helplines",
    callAmbulance: "Free Ambulance",
    teleConsult: "Medical Advice",
    maternalHelp: "Women Helpline",
    childHelp: "Childline",
    nearbyFacilities: "Nearby Government Health Centres",
    shirwalPhc: "Shirwal Primary Health Centre (PHC)",
    shirwalSub: "2.4 km away · Open 24 Hours · Free OPD & Emergency",
    sataraDistrict: "Satara District Civil Hospital",
    sataraSub: "Tertiary Referral Centre · Multi-Specialty",
    callNow: "Call",
    directions: "Map",
    steps: {
      SUBMITTED: "Submitted",
      PENDING_PHC: "PHC Review",
      ACCEPTED: "Confirmed",
      COMPLETED: "Visited"
    }
  },
  mr: {
    title: "आरोग्य केंद्र व सेवा केंद्र",
    subtitle: "सक्रिय रेफरल, रुग्णालय तपासणी व आपत्कालीन आरोग्य मदत",
    bookAppointment: "आरोग्य केंद्रात वेळ नोंदवा",
    activeCare: "सक्रिय रेफरल व उपचार",
    noActiveTitle: "सध्या कोणतेही सक्रिय रेफरल नाही",
    noActiveSub: "आशा कार्यकर्त्याने प्राथमिक आरोग्य केंद्रात किंवा रुग्णालयात पाठवल्यास त्याचे लाईव्ह स्टेटस येथे दिसेल.",
    pastCare: "मागील रुग्णालय भेटी",
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
    directions: "नकाशा",
    steps: {
      SUBMITTED: "नोंदणी झाली",
      PENDING_PHC: "तपासणी सुरू",
      ACCEPTED: "वेळ निश्चित",
      COMPLETED: "तपासणी पूर्ण"
    }
  },
  hi: {
    title: "स्वास्थ्य सेवा केंद्र",
    subtitle: "सक्रिय रेफरल, अस्पताल परामर्श एवं आपातकालीन स्वास्थ्य सहायता",
    bookAppointment: "अस्पताल में समय बुक करें",
    activeCare: "सक्रिय रेफरल व उपचार",
    noActiveTitle: "कोई सक्रिय रेफरल नहीं है",
    noActiveSub: "जब आपकी आशा कार्यकर्ता आपको अस्पताल रेफर करेंगी, तो उसका लाइव स्टेटस यहां दिखाई देगा।",
    pastCare: "पूर्व अस्पताल परामर्श",
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
    directions: "दिशा देखें",
    steps: {
      SUBMITTED: "दर्ज हुआ",
      PENDING_PHC: "समीक्षा जारी",
      ACCEPTED: "स्वीकृत",
      COMPLETED: "पूर्ण"
    }
  }
};

const DEPARTMENTS = [
  "General Medicine",
  "Maternal & Child Health",
  "Cardiology & Blood Pressure",
  "Pediatrics & Child Care",
  "Orthopaedics & Bone",
  "Eye & ENT Care",
];

const SLOTS = ["Morning (9:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 4:00 PM)"];

const PRIORITY_COLOR = {
  URGENT:  "bg-red-100 text-red-800 border-red-200",
  HIGH:    "bg-amber-100 text-amber-900 border-amber-200",
  ROUTINE: "bg-teal-50 text-teal-800 border-teal-200",
};

const STATUS_IDX = { SUBMITTED: 0, PENDING_PHC: 1, ACCEPTED: 2, COMPLETED: 3 };

function ReferralCard({ req, lang }) {
  const t = CARE_TRANSLATIONS[lang] || CARE_TRANSLATIONS.en;
  const stepIdx = STATUS_IDX[req.status] ?? 0;
  const isActive = req.status !== "COMPLETED";
  const priorityBg = PRIORITY_COLOR[req.priority] || PRIORITY_COLOR.ROUTINE;

  const STEPS = [
    { key: "SUBMITTED",   label: t.steps.SUBMITTED,   Icon: Send },
    { key: "PENDING_PHC", label: t.steps.PENDING_PHC, Icon: Clock },
    { key: "ACCEPTED",    label: t.steps.ACCEPTED,    Icon: CheckCircle2 },
    { key: "COMPLETED",   label: t.steps.COMPLETED,   Icon: CheckCheck },
  ];

  return (
    <div className={`bg-white rounded-[24px] border ${isActive ? "border-amber-200 shadow-md" : "border-slate-100 shadow-xs"} overflow-hidden transition-all`}>
      <div className={`px-5 pt-4 pb-3 ${isActive ? "border-b border-amber-100/60" : ""}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-sm font-black text-[#16324F] leading-tight">{req.facility || "Shirwal PHC"}</p>
            <p className="text-xs font-bold text-[#008F83] mt-0.5">{req.department || "General OPD"}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${priorityBg}`}>
              {req.priority || "ROUTINE"}
            </span>
            <span className="text-[9px] font-bold text-[#94A3B8] uppercase">
              {req.source === "ASHA_REFERRED" ? "ASHA Referral" : "Direct OPD"}
            </span>
          </div>
        </div>
        {req.reason && <p className="text-xs text-slate-600 mt-1 leading-relaxed italic">"{req.reason}"</p>}
        {req.created_by && <p className="text-[10px] text-amber-700 font-bold mt-1">Recorded by: {req.created_by}</p>}
      </div>

      <div className="px-4 py-4 bg-slate-50/50">
        <div className="flex items-start gap-0">
          {STEPS.map((step, i) => {
            const done = i < stepIdx;
            const current = i === stepIdx;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-0.5 ${i === 0 ? "invisible" : done || current ? "bg-amber-500" : "bg-slate-200"}`} />
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    done ? "bg-amber-500 border-amber-500" :
                    current ? "bg-white border-amber-500 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]" :
                    "bg-white border-slate-200"
                  }`}>
                    <step.Icon className={`w-3.5 h-3.5 ${done ? "text-white" : current ? "text-amber-600" : "text-slate-300"}`} strokeWidth={2.5} />
                  </div>
                  <div className={`flex-1 h-0.5 ${isLast ? "invisible" : done ? "bg-amber-500" : "bg-slate-200"}`} />
                </div>
                <p className={`text-[9px] font-bold text-center mt-1 leading-tight max-w-[64px] ${current ? "text-amber-800 font-black" : "text-slate-400"}`}>
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

function BookAppointmentModal({ member, onClose, onSaved }) {
  const [facility, setFacility] = useState("Shirwal Primary Health Centre");
  const [dept, setDept] = useState("General Medicine");
  const [slot, setSlot] = useState("Morning (9:00 AM - 12:00 PM)");
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
        priority: "ROUTINE",
        reason: `Self-scheduled appointment for ${slot}`,
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
      <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-amber-200">
        <div className="bg-gradient-to-br from-amber-50 to-[#FFF9ED] px-6 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[#16324F] text-base">Book PHC Consultation</h3>
              <p className="text-xs text-slate-500">Free Government Health OPD</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
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
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
            >
              <option value="Shirwal Primary Health Centre">Shirwal Primary Health Centre (PHC)</option>
              <option value="Khandala Rural Hospital">Khandala Rural Hospital</option>
              <option value="Satara District Civil Hospital">Satara District Civil Hospital</option>
            </select>
          </div>

          <div>
            <label className="font-black text-slate-700 block mb-1.5 uppercase tracking-wider text-[10px]">Select Department</label>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDept(d)}
                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                    dept === d ? "bg-amber-100 text-amber-950 border-amber-300 shadow-xs" : "bg-white border-slate-200 text-slate-600 hover:border-amber-200"
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
                  className={`w-full p-3 rounded-xl border text-left font-bold transition-all ${
                    slot === s ? "bg-amber-100 text-amber-950 border-amber-300 shadow-xs" : "bg-white border-slate-200 text-slate-600 hover:border-amber-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Booking</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CareHub({ member }) {
  const lang = localStorage.getItem("radvault_asha_lang") || localStorage.getItem("radvault_patient_lang") || "en";
  const t = CARE_TRANSLATIONS[lang] || CARE_TRANSLATIONS.en;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const load = async () => {
    if (!member?.id) return;
    setLoading(true);
    const { data } = await getCareRequests(member.id);
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [member?.id]);

  const active = requests.filter(r => r.status !== "COMPLETED");
  const past = requests.filter(r => r.status === "COMPLETED");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32 font-sans text-slate-800 space-y-6">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#16324F] flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-amber-500" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.subtitle}</p>
        </div>

        <button
          onClick={() => setBooking(true)}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-amber-300/40 hover:shadow-lg transition-all cursor-pointer uppercase tracking-wider shrink-0"
        >
          <Plus className="w-4 h-4" /> {t.bookAppointment}
        </button>
      </div>

      {/* ── 24x7 Emergency Helplines Strip ── */}
      <div className="bg-gradient-to-br from-rose-50 to-orange-50/60 rounded-3xl border border-rose-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">{t.emergencyHelplines}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a
            href="tel:108"
            className="p-3 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 shadow-xs flex flex-col items-center text-center group transition-all"
          >
            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Phone className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-sm">108</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.callAmbulance}</span>
          </a>

          <a
            href="tel:104"
            className="p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-xs flex flex-col items-center text-center group transition-all"
          >
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-sm">104</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.teleConsult}</span>
          </a>

          <a
            href="tel:181"
            className="p-3 bg-white rounded-2xl border border-teal-200 hover:border-teal-400 shadow-xs flex flex-col items-center text-center group transition-all"
          >
            <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <User className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-sm">181</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.maternalHelp}</span>
          </a>

          <a
            href="tel:1098"
            className="p-3 bg-white rounded-2xl border border-blue-200 hover:border-blue-400 shadow-xs flex flex-col items-center text-center group transition-all"
          >
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Baby className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-sm">1098</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.childHelp}</span>
          </a>
        </div>
      </div>

      {/* ── Active Care Tracker ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-white rounded-3xl border border-slate-100 h-36 animate-pulse" />)}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.activeCare}</h3>
              {active.map(r => <ReferralCard key={r.id} req={r} lang={lang} />)}
            </div>
          )}

          {active.length === 0 && (
            <div className="bg-white rounded-3xl border border-amber-200 p-8 text-center shadow-xs">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="font-black text-[#16324F] text-base">{t.noActiveTitle}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">{t.noActiveSub}</p>
              <button
                onClick={() => setBooking(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
              >
                + {t.bookAppointment}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Nearby Government Facilities ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.nearbyFacilities}</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-[#16324F]">{t.shirwalPhc}</p>
                <p className="text-[11px] text-slate-500">{t.shirwalSub}</p>
              </div>
            </div>
            <a
              href="tel:02169244222"
              className="px-3 py-1.5 bg-[#008F83] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{t.callNow}</span>
            </a>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-[#16324F]">{t.sataraDistrict}</p>
                <p className="text-[11px] text-slate-500">{t.sataraSub}</p>
              </div>
            </div>
            <a
              href="tel:02162233240"
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{t.callNow}</span>
            </a>
          </div>
        </div>
      </div>

      {booking && (
        <BookAppointmentModal
          member={member}
          onClose={() => setBooking(false)}
          onSaved={() => { setBooking(false); load(); }}
        />
      )}

    </div>
  );
}
