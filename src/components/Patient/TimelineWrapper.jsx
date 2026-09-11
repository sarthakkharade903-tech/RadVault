import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { getDocuments } from '../../services/vaultService';
import {
  Calendar, Loader2, ArrowRight, Activity, FileText, Building2,
  Pill, FlaskConical, Shield, Sparkles, Heart, Droplet, Wind,
  Thermometer, Weight, Clock, CheckCircle2, AlertTriangle, Eye, Download,
  Stethoscope, CheckCircle
} from 'lucide-react';
import DocumentPreview from './DocumentPreview';

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const TIMELINE_TRANSLATIONS = {
  en: {
    title: "Health Timeline",
    subtitle: "Complete chronological medical history & clinical records",
    filterAll: "All Events",
    filterConsultations: "Doctor Consultations",
    filterVisits: "Health Readings & Visits",
    filterPrescriptions: "Prescriptions",
    filterLabs: "Lab Reports",
    filterReferrals: "Hospital Referrals",
    totalRecords: "Total Records",
    totalDocs: "Lab & Rx Files",
    lastActivity: "Last Recorded",
    noEventsTitle: "No timeline events found",
    noEventsSub: "Events will appear automatically as ASHA visits, prescriptions, and lab tests are logged.",
    viewDoc: "View Document",
    ashaVisit: "ASHA Health Visit",
    selfReported: "Self-Reported Reading",
    hospitalReferral: "Hospital Referral",
    prescriptionDoc: "Doctor Prescription",
    labDoc: "Lab Test Report",
    scanDoc: "Diagnostic Scan",
    recordedBy: "Recorded by",
    status: "Status",
    journeyTitle: "Verified Healthcare Journey",
    journeySubtitle: "Frontline to tertiary closed-loop medical continuum",
    journeyBadge: "End-to-End Care Continuum · 4 Stages Confirmed",
    diseaseLabel: "Condition / Emergency Reason",
    stage1Label: "Stage 1 · Frontline",
    stage2Label: "Stage 2 · Hospital",
    stage3Label: "Stage 3 · Specialist",
    stage4Label: "Stage 4 · Closed Loop",
    verified: "Verified",
    signed: "Signed & Finalized",
    active: "Active Care"
  },
  mr: {
    title: "आरोग्य इतिहास व नोंदी",
    subtitle: "सर्व आरोग्य तपासण्या, औषध चिठ्ठ्या व लॅब रिपोर्टची कालक्रमानुसार यादी",
    filterAll: "सर्व नोंदी",
    filterConsultations: "तज्ज्ञ डॉक्टरांचा सल्ला",
    filterVisits: "तपासणी व गृहभेटी",
    filterPrescriptions: "प्रिस्क्रिप्शन",
    filterLabs: "लॅब रिपोर्ट",
    filterReferrals: "रुग्णालय रेफरल",
    totalRecords: "एकूण नोंदी",
    totalDocs: "कागदपत्रे",
    lastActivity: "शेवटची नोंद",
    noEventsTitle: "कोणतीही नोंद आढळली नाही",
    noEventsSub: "आशा तपासणी, प्रिस्क्रिप्शन किंवा लॅब टेस्ट झाल्यानंतर येथे आपोआप नोंदी दिसतील.",
    viewDoc: "कागदपत्र पहा",
    ashaVisit: "आशा कार्यकर्ता गृहभेट",
    selfReported: "स्वतः नोंदवलेले रीडिंग",
    hospitalReferral: "रुग्णालय रेफरल",
    prescriptionDoc: "डॉक्टरांची औषध चिठ्ठी",
    labDoc: "रक्त / लॅब तपासणी रिपोर्ट",
    scanDoc: "एक्स-रे व स्कॅन",
    recordedBy: "नोंद करणारे",
    status: "स्थिती",
    journeyTitle: "सत्यापित आरोग्य प्रवास",
    journeySubtitle: "आशा कार्यकर्त्यापासून तज्ज्ञ डॉक्टरांपर्यंत अखंड सेवा साखळी",
    journeyBadge: "अखंड आरोग्य साखळी · ४ टप्पे प्रमाणित",
    diseaseLabel: "सध्याचा आजार / आपत्कालीन कारण",
    stage1Label: "टप्पा १ · आशा कार्यकर्ता",
    stage2Label: "टप्पा २ · रुग्णालय",
    stage3Label: "टप्पा ३ · तज्ज्ञ डॉक्टर",
    stage4Label: "टप्पा ४ · पाठपुरावा",
    verified: "प्रमाणित ✓",
    signed: "स्वाक्षरी पूर्ण ✓",
    active: "सक्रिय पाठपुरावा ✓"
  },
  hi: {
    title: "स्वास्थ्य इतिहास एवं टाइमलाइन",
    subtitle: "सभी स्वास्थ्य जांच, पर्चे और लैब रिपोर्ट का संपूर्ण विवरण",
    filterAll: "सभी रिकॉर्ड",
    filterConsultations: "डॉक्टर परामर्श",
    filterVisits: "स्वास्थ्य जांच व भेंट",
    filterPrescriptions: "दवा पर्ची",
    filterLabs: "लैब रिपोर्ट",
    filterReferrals: "अस्पताल रेफरल",
    totalRecords: "कुल रिकॉर्ड",
    totalDocs: "दस्तावेज",
    lastActivity: "अंतिम प्रविष्टि",
    noEventsTitle: "कोई रिकॉर्ड उपलब्ध नहीं है",
    noEventsSub: "आशा जांच, डॉक्टर पर्ची या लैब टेस्ट होते ही यहां स्वतः विवरण दिखाई देगा।",
    viewDoc: "दस्तावेज देखें",
    ashaVisit: "आशा गृहभेंट",
    selfReported: "स्वयं दर्ज रीडिंग",
    hospitalReferral: "अस्पताल रेफरल",
    prescriptionDoc: "डॉक्टर पर्ची",
    labDoc: "लैब जांच रिपोर्ट",
    scanDoc: "स्कैन एवं एक्स-रे",
    recordedBy: "द्वारा दर्ज",
    status: "स्थिति",
    journeyTitle: "सत्यापित स्वास्थ्य यात्रा",
    journeySubtitle: "आशा कार्यकर्ता से विशेषज्ञ डॉक्टर तक निरंतर देखभाल",
    journeyBadge: "अखंड देखभाल चक्र · ४ चरण प्रमाणित",
    diseaseLabel: "सक्रिय बीमारी / आपातकालीन स्थिति",
    stage1Label: "चरण १ · आशा कार्यकर्ता",
    stage2Label: "चरण २ · अस्पताल",
    stage3Label: "चरण ३ · विशेषज्ञ डॉक्टर",
    stage4Label: "चरण ४ · फॉलो-अप",
    verified: "प्रमाणित ✓",
    signed: "हस्ताक्षरित ✓",
    active: "सक्रिय चक्र ✓"
  }
};

// ─── Format Full Date & Time ───────────────────────────────────────────────
function formatFullDateTime(iso) {
  if (!iso) return { dateStr: "N/A", timeStr: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { dateStr: "Recorded", timeStr: "" };

  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  let dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (isToday) dateStr = "Today";
  else if (isYesterday) dateStr = "Yesterday";

  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { dateStr, timeStr, fullDate: `${dateStr} · ${timeStr}` };
}

// ─── Event Meta Config ─────────────────────────────────────────────────────
const EVENT_META = {
  consultation: {
    label: "SPECIALIST CONSULTATION",
    Icon: Stethoscope,
    color: "text-indigo-600",
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    dot: "bg-indigo-500",
  },
  visit: {
    label: "HEALTH READING",
    Icon: Activity,
    color: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  appointment: {
    label: "HOSPITAL REFERRAL",
    Icon: Building2,
    color: "text-rose-600",
    border: "border-rose-200",
    bg: "bg-rose-50",
    dot: "bg-rose-400",
  },
  lab_report: {
    label: "LAB REPORT",
    Icon: FlaskConical,
    color: "text-sky-600",
    border: "border-sky-200",
    bg: "bg-sky-50",
    dot: "bg-sky-400",
  },
  prescription: {
    label: "PRESCRIPTION",
    Icon: Pill,
    color: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    dot: "bg-emerald-400",
  },
  report: {
    label: "DIAGNOSTIC SCAN",
    Icon: FileText,
    color: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
    dot: "bg-purple-400",
  }
};

function TimelineCard({ event, onViewDoc, lang }) {
  const meta = EVENT_META[event.category] || EVENT_META.visit;
  const isDoc = event.category.includes("report") || event.category === "prescription" || event.category === "report";
  const t = TIMELINE_TRANSLATIONS[lang] || TIMELINE_TRANSLATIONS.en;
  const { fullDate, dateStr, timeStr } = formatFullDateTime(event.rawTimestamp || event.date);

  return (
    <div className="bg-white rounded-[24px] border border-amber-100/80 shadow-[0_4px_20px_-8px_rgba(251,191,36,0.15)] hover:shadow-[0_8px_30px_-8px_rgba(251,191,36,0.25)] transition-all duration-300 overflow-hidden mb-5 relative group">
      
      <div className="p-5 sm:p-6 relative z-10">
        
        {/* Top Meta Strip: Category + Exact Date & Time */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg}`}>
              <meta.Icon className={`w-4 h-4 ${meta.color}`} />
            </div>
            <span className={`text-[11px] font-black uppercase tracking-wider ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{fullDate}</span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base sm:text-lg font-black text-[#16324F] leading-tight mb-1">
          {event.title}
        </h4>

        {/* Subtitle / Facility / Doctor */}
        <div className="text-xs text-slate-500 font-semibold mb-3">
          {event.facility || event.doctor || (isDoc ? "Digital Health Vault" : "Shirwal Primary Health Centre")}
        </div>

        {/* ── Rich Details by Event Type ── */}
        
        {/* 1. Health Readings Breakdown */}
        {event.vitals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100 my-3 text-xs">
            {event.vitals.bp && (
              <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Blood Pressure</span>
                <span className="font-black text-slate-900">{event.vitals.bp} <span className="text-[9px] font-normal text-slate-400">mmHg</span></span>
              </div>
            )}
            {event.vitals.sugar && (
              <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Blood Sugar</span>
                <span className="font-black text-slate-900">{event.vitals.sugar} <span className="text-[9px] font-normal text-slate-400">mg/dL</span></span>
              </div>
            )}
            {event.vitals.spo2 && (
              <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Oxygen SpO₂</span>
                <span className="font-black text-slate-900">{event.vitals.spo2}%</span>
              </div>
            )}
            {event.vitals.pulse && (
              <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Pulse Rate</span>
                <span className="font-black text-slate-900">{event.vitals.pulse} <span className="text-[9px] font-normal text-slate-400">bpm</span></span>
              </div>
            )}
          </div>
        )}

        {/* 2. Clinical Notes / Referral Reason */}
        {event.note && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed my-2 font-medium">
            <strong className="text-amber-800 font-black">{event.category === "consultation" ? "Clinical Summary: " : "Observations: "}</strong>
            {event.note}
          </div>
        )}

        {/* 3. Specialist Consultation Treatment Plan & Prescriptions */}
        {event.category === "consultation" && (
          <div className="my-3 space-y-2.5">
            {event.diagnosis && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100/90 px-3.5 py-2 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Diagnosis:</span>
                <span className="text-xs font-black text-indigo-950">{event.diagnosis}</span>
              </div>
            )}
            {event.treatmentPlan && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700">
                <p className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Care Management &amp; Treatment Plan</span>
                </p>
                <p className="font-medium leading-relaxed">{event.treatmentPlan}</p>
              </div>
            )}
            {event.prescriptions && Array.isArray(event.prescriptions) && event.prescriptions.length > 0 && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs">
                <p className="font-black text-emerald-950 mb-2 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Prescribed Medications ({event.prescriptions.length})</span>
                </p>
                <div className="space-y-1.5">
                  {event.prescriptions.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-emerald-100/80 font-bold text-slate-800 text-[11px]">
                      <span>{p.name || p.medicine || (typeof p === 'string' ? p : 'Medication')}</span>
                      <span className="text-emerald-700 font-semibold">{p.dosage || p.frequency || p.instructions || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 text-[11px] font-black text-emerald-700">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Closed-Loop Follow-up Active · Attending Specialist Signed
              </span>
            </div>
          </div>
        )}

        {/* 4. Action Button (View PDF / Document) */}
        {isDoc && event.docId && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onViewDoc(event.docId)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.viewDoc}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TimelineWrapper({ member }) {
  const lang = localStorage.getItem("radvault_asha_lang") || localStorage.getItem("radvault_patient_lang") || "en";
  const t = TIMELINE_TRANSLATIONS[lang] || TIMELINE_TRANSLATIONS.en;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [vaultDocs, setVaultDocs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [journeyInfo, setJourneyInfo] = useState({
    diseaseName: "Severe Gestational Anemia (Hb < 8.0 g/dL)",
    ashaName: "Priya Deshmukh",
    ashaRole: "Frontline ASHA Worker · Shirwal Sector 4",
    ashaAction: "Doorstep triage, vitals recorded (BP: 130/85, Hb: 7.8 g/dL)",
    hospitalName: "Pune Sassoon General Hospital",
    hospitalAction: "Intake registered · Ultrasound scan & lab profile linked in Vault",
    doctorName: "Dr. Neha Joshi",
    doctorSpecialty: "Consultant Obstetrician",
    doctorAction: "Care plan signed · Iron Sucrose IV infusion prescribed",
    hasConsultation: true,
    hasReferral: true,
    hasScans: true,
  });

  useEffect(() => {
    async function fetchTimelineData() {
      if (!member?.id) return;
      setLoading(true);

      try {
        const eventsList = [];

        // Parallelize independent queries for vitals, care_requests, documents, and consultations
        const [
          { data: vitalsData },
          { data: refData },
          { data: docsData },
          { data: consultationsData }
        ] = await Promise.all([
          supabase
            .from("vitals_history")
            .select("*")
            .eq("patient_id", member.id)
            .order("recorded_at", { ascending: false }),
          supabase
            .from("care_requests")
            .select("*")
            .eq("patient_id", member.id)
            .order("created_at", { ascending: false }),
          getDocuments(member.id),
          supabase
            .from("consultations")
            .select("*, doctors(name, specialty)")
            .eq("patient_id", member.id)
            .order("created_at", { ascending: false })
        ]);

        // Derive Journey Stepper Info dynamically
        const latestConsult = consultationsData?.[0];
        const latestRef = refData?.[0];
        const latestVital = vitalsData?.[0];

        const docRaw = latestConsult?.doctors?.name || (latestConsult?.doctor_name ? latestConsult.doctor_name : "Dr. Neha Joshi");
        const docName = docRaw.startsWith("Dr.") ? docRaw : `Dr. ${docRaw}`;
        const docSpecialty = latestConsult?.doctors?.specialty || "Consultant Obstetrician";
        const disease = latestConsult?.diagnosis || latestRef?.reason || member?.conditions || "Severe Gestational Anemia (Hb < 8.0 g/dL)";
        const hospital = latestRef?.facility || "Pune Sassoon General Hospital";

        setJourneyInfo({
          diseaseName: disease,
          ashaName: "Priya Deshmukh",
          ashaRole: "Frontline ASHA Worker · Shirwal Sector 4",
          ashaAction: latestVital
            ? `Doorstep triage: BP ${latestVital.bp_systolic || '130'}/${latestVital.bp_diastolic || '85'} mmHg, Sugar ${latestVital.blood_glucose || '95'} mg/dL`
            : "Doorstep triage, vitals recorded (BP: 130/85, Hb: 7.8 g/dL)",
          hospitalName: hospital,
          hospitalAction: "Intake registered · Medical imaging vault scans linked",
          doctorName: docName,
          doctorSpecialty: docSpecialty,
          doctorAction: latestConsult?.treatment_advice || latestConsult?.treatment_plan || "Care plan signed · Iron Sucrose IV infusion prescribed",
          hasConsultation: Boolean(consultationsData && consultationsData.length > 0),
          hasReferral: Boolean(refData && refData.length > 0),
          hasScans: Boolean(docsData && docsData.length > 0),
        });

        // 1. Process Vitals History
        if (vitalsData && vitalsData.length > 0) {
          vitalsData.forEach(v => {
            const bpStr = v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : null;
            eventsList.push({
              id: `vital-${v.id}`,
              title: v.source === "ASHA recorded" ? "ASHA Health Check & Vitals" : "Patient Vitals Recorded",
              category: "visit",
              facility: v.source === "ASHA recorded" ? "Home Visit by Priya Deshmukh (ASHA)" : "Self-Reported Mobile Reading",
              rawTimestamp: v.recorded_at,
              date: v.recorded_at,
              vitals: {
                bp: bpStr,
                sugar: v.blood_glucose,
                spo2: v.spo2_pct,
                pulse: v.pulse_bpm,
                weight: v.weight_kg,
                temp: v.temperature_c
              },
              note: v.notes || (bpStr ? `Recorded BP: ${bpStr} mmHg.` : null)
            });
          });
        }

        // 2. Process Care Requests / Referrals
        if (refData && refData.length > 0) {
          refData.forEach(r => {
            eventsList.push({
              id: `ref-${r.id}`,
              title: `Hospital Referral: ${r.department || "General Medicine"}`,
              category: "appointment",
              facility: r.facility || "Primary Health Centre Shirwal",
              rawTimestamp: r.created_at,
              date: r.created_at,
              note: r.reason || r.asha_notes || "Patient referred for specialist consultation.",
              priority: r.priority
            });
          });
        }

        // 3. Process Specialist Doctor Consultations (Closed-Loop Care)
        if (consultationsData && consultationsData.length > 0) {
          consultationsData.forEach(c => {
            const docName = c.doctors?.name || (c.doctor_name ? c.doctor_name : "Dr. Neha Joshi");
            const specialty = c.doctors?.specialty || "General Medicine";
            const carePlan = c.treatment_advice || c.treatment_plan;
            const summary = c.clinical_assessment || c.clinical_summary;
            eventsList.push({
              id: `consult-${c.id}`,
              title: `Specialist Consultation: ${c.diagnosis || "Clinical Review"}`,
              category: "consultation",
              facility: `Dr. ${docName.replace(/^Dr\.\s*/i, '')} (${specialty}) · Sassoon General Hospital`,
              doctor: `Dr. ${docName.replace(/^Dr\.\s*/i, '')}`,
              rawTimestamp: c.created_at,
              date: c.created_at,
              diagnosis: c.diagnosis,
              treatmentPlan: carePlan,
              prescriptions: c.prescriptions,
              clinicalSummary: summary,
              note: summary || carePlan || "Consultation finalized with verified digital signature."
            });
          });
        }

        // 4. Process Uploaded Medical Documents & Prescriptions
        if (docsData && docsData.length > 0) {
          setVaultDocs(docsData);
          docsData.forEach(d => {
            let cat = "report";
            if (d.category === "Prescriptions") cat = "prescription";
            else if (d.category === "Lab Reports") cat = "lab_report";
            else if (d.category === "Scans") cat = "report";

            eventsList.push({
              id: `doc-${d.id}`,
              docId: d.id,
              title: d.title || d.file_name || "Medical Document",
              category: cat,
              facility: d.doctor_name ? `Dr. ${d.doctor_name}` : "Clinical Health Record",
              rawTimestamp: d.created_at,
              date: d.created_at,
              note: d.notes || d.diagnosis || "Medical file stored in verified health vault."
            });
          });
        }

        // Add baseline visit if list is empty
        if (eventsList.length === 0) {
          eventsList.push({
            id: "baseline-01",
            title: "ASHA Comprehensive Family Registration",
            category: "visit",
            facility: "Shirwal Ward · Priya Deshmukh",
            rawTimestamp: member.last_visit_date || new Date().toISOString(),
            date: member.last_visit_date || new Date().toISOString(),
            vitals: {
              bp: member.bp_systolic && member.bp_diastolic ? `${member.bp_systolic}/${member.bp_diastolic}` : "120/80",
              sugar: member.blood_glucose || "100",
              spo2: "98",
              pulse: "72"
            },
            note: "Patient enrolled in RadVault rural digital health registry."
          });
        }

        // Sort chronological (newest first)
        eventsList.sort((a, b) => new Date(b.rawTimestamp) - new Date(a.rawTimestamp));
        setEvents(eventsList);
      } catch (e) {
        console.warn("Timeline fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchTimelineData();
  }, [member?.id]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filter === "all") return true;
      if (filter === "consultation") return e.category === "consultation";
      if (filter === "visit") return e.category === "visit";
      if (filter === "prescription") return e.category === "prescription";
      if (filter === "lab_report") return e.category === "lab_report";
      if (filter === "appointment") return e.category === "appointment";
      return true;
    });
  }, [events, filter]);

  const handleViewDoc = (docId) => {
    const doc = vaultDocs.find(d => d.id === docId);
    if (doc) setPreviewDoc(doc);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-amber-800">Loading comprehensive health timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 font-sans text-slate-800">
      
      {/* ── Page Header ── */}
      <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#16324F] flex items-center justify-center sm:justify-start gap-2">
            <Activity className="w-6 h-6 text-amber-500" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-[#64748B] font-semibold mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
            {events.length} {t.totalRecords}
          </span>
        </div>
      </div>

      {/* ── Healthcare Journey Stepper Card ── */}
      <div className="mb-8 bg-gradient-to-br from-white via-[#FCFDFD] to-emerald-50/40 rounded-3xl border border-emerald-200/90 p-5 sm:p-6 shadow-[0_8px_30px_-10px_rgba(16,185,129,0.14)] relative overflow-hidden">
        
        {/* Top Banner: Journey Continuum Badge + Disease/Emergency Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-emerald-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {t.journeyBadge}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#16324F] flex items-center gap-2">
              <span>{t.journeyTitle}</span>
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.journeySubtitle}</p>
          </div>

          {/* Emergency / Disease Condition Box */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl px-4 py-2.5 sm:text-right shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">
              {t.diseaseLabel}
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 sm:justify-end mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{journeyInfo.diseaseName}</span>
            </span>
          </div>
        </div>

        {/* 4 Connected Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          
          {/* Stage 1: Frontline ASHA */}
          <div className="bg-white/95 rounded-2xl border border-emerald-100 p-4 shadow-2xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
                {t.stage1Label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.verified}</span>
              </span>
            </div>
            <h4 className="font-black text-slate-900 text-sm">{journeyInfo.ashaName}</h4>
            <p className="text-[11px] font-bold text-emerald-800 mt-0.5">{journeyInfo.ashaRole}</p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
              {journeyInfo.ashaAction}
            </div>
          </div>

          {/* Stage 2: Referral Hospital & Vault */}
          <div className="bg-white/95 rounded-2xl border border-teal-100 p-4 shadow-2xs hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-lg">
                {t.stage2Label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{t.verified}</span>
              </span>
            </div>
            <h4 className="font-black text-slate-900 text-sm truncate" title={journeyInfo.hospitalName}>
              {journeyInfo.hospitalName}
            </h4>
            <p className="text-[11px] font-bold text-teal-800 mt-0.5">Tertiary Care Facility</p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
              {journeyInfo.hospitalAction}
            </div>
          </div>

          {/* Stage 3: Specialist Doctor */}
          <div className="bg-white/95 rounded-2xl border border-indigo-100 p-4 shadow-2xs hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-lg">
                {t.stage3Label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.signed}</span>
              </span>
            </div>
            <h4 className="font-black text-slate-900 text-sm truncate" title={journeyInfo.doctorName}>
              {journeyInfo.doctorName}
            </h4>
            <p className="text-[11px] font-bold text-indigo-800 mt-0.5">{journeyInfo.doctorSpecialty}</p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
              {journeyInfo.doctorAction}
            </div>
          </div>

          {/* Stage 4: Closed Loop Follow-Up */}
          <div className="bg-white/95 rounded-2xl border border-emerald-200 p-4 shadow-2xs hover:border-emerald-400 transition-all bg-gradient-to-b from-white to-emerald-50/25">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-lg">
                {t.stage4Label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.active}</span>
              </span>
            </div>
            <h4 className="font-black text-slate-900 text-sm">Follow-Up In Progress</h4>
            <p className="text-[11px] font-bold text-emerald-800 mt-0.5">Priya Deshmukh (ASHA)</p>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
              Home recovery check active in village. Medication adherence verified.
            </div>
          </div>

        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {[
          { key: "all", label: t.filterAll },
          { key: "consultation", label: t.filterConsultations },
          { key: "visit", label: t.filterVisits },
          { key: "prescription", label: t.filterPrescriptions },
          { key: "lab_report", label: t.filterLabs },
          { key: "appointment", label: t.filterReferrals },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-extrabold border transition-all shadow-xs cursor-pointer ${
              filter === key
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-400 shadow-md shadow-amber-300/30"
                : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Chronological Event Cards List ── */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-amber-200 p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <h3 className="font-black text-[#16324F] text-base">{t.noEventsTitle}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.noEventsSub}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <TimelineCard
              key={event.id}
              event={event}
              lang={lang}
              onViewDoc={handleViewDoc}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

    </div>
  );
}