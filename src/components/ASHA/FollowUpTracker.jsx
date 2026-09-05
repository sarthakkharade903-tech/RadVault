import React, { useState, useEffect, useMemo } from "react";
import {
  Phone, CheckCircle2, Check, Heart, Baby, Activity,
  Stethoscope, Shield, CalendarCheck, ArrowRight, RefreshCw,
  Send, Loader2, Hospital, MapPin, Building2, User, FileText,
  Calendar, AlertTriangle, Clock, Globe, ChevronDown, Home
} from "lucide-react";
import followupGhibli from "../../assets/followup_ghibli.jpg";
import { supabase } from "../../services/supabase";
import { getDoctorFollowUps, completeFollowUp } from "../../services/ashaService";

// ─── Single-Language Clean Translations ──────────────────────────────────────
const T = {
  en: {
    title: "Follow-Up Register",
    subtitle: "Daily patient visits & recovery tracking",
    cursiveSubtitle: "Continuing care. Healthier tomorrows. ♡",
    careContinuesNote: "Care continues at home ♡",
    samePeopleNote: "Same people. A healthier tomorrow.",
    checksActiveBadge: "Follow-Up Checks Active",
    checksActiveSub: "Follow-up keeps recovery connected from hospital to home.",
    all: "All Pending",
    overdue: "Overdue",
    dueToday: "Due Today",
    upcoming: "Upcoming",
    done: "Completed",
    markDone: "Mark Visited",
    callPatient: "Call",
    logVisit: "Log Visit",
    checkRecovery: "Home Check",
    verifyArrival: "Verify Arrival",
    noItems: "All follow-ups are up to date!",
    noItemsSub: "Great job! No pending patient follow-ups right now.",
    lastVisit: "Last visit",
    daysAgo: "days ago",
    neverVisited: "Never visited",
    ancDue: "ANC Checkup Due",
    vaccineDue: "Child Vaccine Due",
    highRisk: "High-Risk Monitor",
    tbDots: "TB Medicine Check",
    ncdMonitor: "BP / Sugar Check",
    referralCheck: "Referral Arrival Check",
    postTreatment: "Post-Discharge Care",
    referralCheckDetail: "Referred {n} days ago — verify patient reached hospital",
    postTreatmentDetail: "Discharged from hospital — check recovery & medicines.",
    completed: "Completed",
    weeks: "wks pregnant",
    restore: "Restore",
    refresh: "Sync",
    referredTo: "Hospital",
  },
  mr: {
    title: "पाठपुरावा नोंदवही",
    subtitle: "दैनंदिन रुग्ण भेटी व रिकव्हरी पाठपुरावा",
    cursiveSubtitle: "आरोग्य सेवा अखंड. निरोगी उद्या. ♡",
    careContinuesNote: "घरी उपचार सुरू आहेत ♡",
    samePeopleNote: "आपली माणसे. निरोगी भविष्य.",
    checksActiveBadge: "फॉलो-अप तपासण्या सक्रिय",
    checksActiveSub: "रुग्णालयापासून घरापर्यंत सतत काळजी व औषध देखरेख.",
    all: "सर्व प्रलंबित",
    overdue: "वेळ उलटली",
    dueToday: "आजच्या भेटी",
    upcoming: "पुढील भेटी",
    done: "पूर्ण झालेल्या",
    markDone: "भेट पूर्ण",
    callPatient: "फोन करा",
    logVisit: "नोंद करा",
    checkRecovery: "गृह तपासणी",
    verifyArrival: "उपस्थिती तपासा",
    noItems: "सर्व पाठपुरावे पूर्ण झाले आहेत!",
    noItemsSub: "शाब्बास! सध्या कोणताही रुग्ण प्रलंबित नाही.",
    lastVisit: "शेवटची भेट",
    daysAgo: "दिवसांपूर्वी",
    neverVisited: "कधीच भेट नाही",
    ancDue: "गरोदर माता तपासणी",
    vaccineDue: "बालक लसीकरण",
    highRisk: "धोकादायक रुग्ण",
    tbDots: "टीबी औषध तपासणी",
    ncdMonitor: "बीपी / साखर तपासणी",
    referralCheck: "रेफरल उपस्थिती तपासणी",
    postTreatment: "उपचारानंतर गृहभेट",
    referralCheckDetail: "{n} दिवसांपूर्वी पाठवले — रुग्ण रुग्णालयात पोहोचला का?",
    postTreatmentDetail: "रुग्णालय सुट्टी — घरी बरे होणे व औषधे तपासा.",
    completed: "पूर्ण",
    weeks: "आठवडे गरोदर",
    restore: "पूर्ववत",
    refresh: "ताजे करा",
    referredTo: "रुग्णालय",
  },
  hi: {
    title: "फॉलो-अप रजिस्टर",
    subtitle: "दैनिक मरीज भेंट एवं रिकवरी निगरानी",
    cursiveSubtitle: "निरंतर देखभाल. स्वस्थ कल. ♡",
    careContinuesNote: "घर पर देखभाल जारी है ♡",
    samePeopleNote: "हमारे अपने लोग. एक स्वस्थ कल.",
    checksActiveBadge: "फॉलो-अप जांच सक्रिय",
    checksActiveSub: "अस्पताल से घर तक हर मरीज की सतत रिकवरी निगरानी।",
    all: "सभी लंबित",
    overdue: "समय निकल गया",
    dueToday: "आज का",
    upcoming: "आगामी",
    done: "पूर्ण",
    markDone: "भेंट पूर्ण",
    callPatient: "कॉल करें",
    logVisit: "दर्ज करें",
    checkRecovery: "गृह जांच",
    verifyArrival: "उपस्थिति जांचें",
    noItems: "सभी फॉलो-अप पूर्ण हैं!",
    noItemsSub: "शाबाश! अभी कोई लंबित मरीज नहीं है।",
    lastVisit: "अंतिम भेंट",
    daysAgo: "दिन पहले",
    neverVisited: "कभी भेंट नहीं",
    ancDue: "गर्भवती जांच",
    vaccineDue: "टीकाकरण आवश्यक",
    highRisk: "उच्च जोखिम मरीज",
    tbDots: "टीबी दवा जांच",
    ncdMonitor: "बीपी / शुगर जांच",
    referralCheck: "रेफरल उपस्थिति जांच",
    postTreatment: "इलाज बाद गृहभेंट",
    referralCheckDetail: "{n} दिन पहले भेजा — क्या मरीज अस्पताल पहुंचा?",
    postTreatmentDetail: "अस्पताल से छुट्टी — घर पर दवाएं व स्वास्थ्य जांचें।",
    completed: "पूर्ण",
    weeks: "सप्ताह गर्भवती",
    restore: "पूर्ववत",
    refresh: "ताज़ा करें",
    referredTo: "अस्पताल",
  }
};

// ─── National Health Mission Emblem Badge ─────────────────────────────────────
function NHMLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center p-1 shadow-xs shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="4" />
          <circle cx="50" cy="32" r="10" fill="white" />
          <path d="M30 78 C30 55, 70 55, 70 78 Z" fill="white" />
          <circle cx="28" cy="46" r="6" fill="white" />
          <circle cx="72" cy="46" r="6" fill="white" />
          <path d="M16 80 C16 66, 40 66, 40 80 Z" fill="white" opacity="0.85" />
          <path d="M60 80 C60 66, 84 66, 84 80 Z" fill="white" opacity="0.85" />
        </svg>
      </div>
      <div className="hidden xl:block leading-tight text-left">
        <div className="text-[10px] font-black text-slate-900 tracking-tight leading-none">National Health Mission</div>
        <div className="text-[8px] font-extrabold text-slate-500 mt-0.5">Healthier Villages · Stronger India</div>
      </div>
    </div>
  );
}

function getUrgencyBand(item) {
  if (item.urgencyDays <= 0) {
    if (item.urgencyDays === 0) return "dueToday";
    return "overdue";
  }
  if (item.urgencyDays <= 1) return "dueToday";
  return "upcoming";
}

// ─── Routine Health Visit Derivations ─────────────────────────────────────────
function buildRoutineItems(patients, t) {
  if (!patients || !patients.length) return [];
  const today = new Date();
  const items = [];

  patients.forEach(p => {
    const village = p.families?.village || p.village || "Shirwal";
    const mobile  = p.mobile || "";
    const lastVisitDays = p.last_visit_date
      ? Math.floor((today - new Date(p.last_visit_date)) / 86400000)
      : null;

    // ANC Milestone
    if (p.is_pregnant && p.lmp_date) {
      const weeks = Math.floor((today - new Date(p.lmp_date)) / (7 * 24 * 60 * 60 * 1000));
      const expectedAnc = weeks >= 36 ? 4 : weeks >= 28 ? 3 : weeks >= 16 ? 2 : 1;
      const doneAnc = p.anc_visits_done || 0;
      if (doneAnc < expectedAnc) {
        items.push({
          id: `anc-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          gender: "Female",
          age: p.age ? `${p.age} years` : "26 years",
          patientCode: p.abha_id || `ANC${String(p.id).slice(0, 6).toUpperCase()}`,
          mobile, village,
          type: "anc",
          label: t.ancDue,
          category: "Antenatal Care",
          hospital: "Shirwal Primary Health Centre",
          detail: `ANC-${doneAnc + 1} • ${weeks} ${t.weeks} pregnancy milestone checkup.`,
          conditionNote: "Check vitals, IFA tablets & maternal nutrition.",
          urgencyDays: weeks >= 36 ? -1 : weeks >= 28 ? 0 : 3,
        });
      }
    }

    // Child Immunization
    if (p.is_child) {
      const missing = ["bcg","opv","dpt","hep_b","measles","mr"].filter(v => !p[`vaccine_${v}`]);
      if (missing.length) {
        items.push({
          id: `vac-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          gender: p.gender || "Child",
          age: p.age ? `${p.age} years` : "18 months",
          patientCode: p.abha_id || `VAC${String(p.id).slice(0, 6).toUpperCase()}`,
          mobile, village,
          type: "vaccine",
          label: t.vaccineDue,
          category: "Immunization",
          hospital: "Shirwal Health Sub-Centre",
          detail: `${missing[0].toUpperCase()} vaccine due • ${missing.length} doses pending.`,
          conditionNote: "Verify immunization card & schedule vaccination session.",
          urgencyDays: 1,
        });
      }
    }

    // High Risk / Red status
    if (p.status === "red") {
      const daysWithoutVisit = lastVisitDays !== null ? lastVisitDays : 10;
      if (daysWithoutVisit >= 7) {
        items.push({
          id: `hr-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          gender: p.gender || "Male",
          age: p.age ? `${p.age} years` : "55 years",
          patientCode: p.abha_id || `HR${String(p.id).slice(0, 6).toUpperCase()}`,
          mobile, village,
          type: "followup",
          label: t.highRisk,
          category: "High-Risk Monitor",
          hospital: "Bhor Sub-District Hospital",
          detail: lastVisitDays !== null
            ? `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`
            : t.neverVisited,
          conditionNote: "Critical blood pressure and sugar level monitoring.",
          urgencyDays: daysWithoutVisit >= 14 ? -3 : 0,
        });
      }
    }

    // TB / DOTS
    if (p.tb_symptoms) {
      const daysWithoutVisit = lastVisitDays !== null ? lastVisitDays : 8;
      if (daysWithoutVisit >= 7) {
        items.push({
          id: `tb-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          gender: p.gender || "Male",
          age: p.age ? `${p.age} years` : "48 years",
          patientCode: p.abha_id || `TB${String(p.id).slice(0, 6).toUpperCase()}`,
          mobile, village,
          type: "tb",
          label: t.tbDots,
          category: "TB Surveillance",
          hospital: "Satara Civil Hospital",
          detail: lastVisitDays !== null
            ? `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`
            : t.neverVisited,
          conditionNote: "DOTS medication adherence & sputum test follow-up.",
          urgencyDays: 0,
        });
      }
    }

    // NCD Chronic (Monthly BP/Sugar)
    if (p.has_chronic && lastVisitDays !== null && lastVisitDays >= 28) {
      items.push({
        id: `ncd-${p.id}`,
        patientId: p.id,
        patientName: p.name,
        gender: p.gender || "Female",
        age: p.age ? `${p.age} years` : "62 years",
        patientCode: p.abha_id || `NCD${String(p.id).slice(0, 6).toUpperCase()}`,
        mobile, village,
        type: "ncd",
        label: t.ncdMonitor,
        category: "Chronic Care NCD",
        hospital: "Shirwal PHC",
        detail: `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`,
        conditionNote: "Monthly hypertension & diabetes medication refill.",
        urgencyDays: lastVisitDays >= 40 ? -2 : 1,
      });
    }
  });

  return items;
}

// ─── Referral Pipeline Follow-Up Derivations ─────────────────────────────────
function buildReferralItems(careRequests, t) {
  if (!careRequests || !careRequests.length) return [];
  const today = new Date();
  const items = [];

  careRequests.forEach(req => {
    const daysSinceReferral = req.created_at
      ? Math.floor((today - new Date(req.created_at)) / 86400000)
      : 0;

    const hospital = req.facility || "Shrirampur Primary Health Centre";
    const patientName = req.patient_name || "Village Resident";
    const mobile = req.mobile || req.patient_mobile || "";
    const status = (req.status || "").toUpperCase();

    // 1. Referral Arrival Verification (Referred 2+ days ago and still pending)
    if (
      daysSinceReferral >= 2 &&
      (status === "SUBMITTED" || status === "PENDING" || status === "PENDING_PHC")
    ) {
      items.push({
        id: `ref-check-${req.id}`,
        patientId: req.patient_id,
        patientCode: req.patient_id ? String(req.patient_id).slice(0, 8).toUpperCase() : `REF${Math.abs(req.id.length * 17).toString(16).toUpperCase()}`,
        patientName,
        gender: req.gender || "Male",
        age: req.age ? `${req.age} years` : "50 years",
        mobile,
        village: req.village || "Shirwal",
        type: "referralCheck",
        label: t.referralCheck,
        category: "Referral Arrival Check",
        detail: t.referralCheckDetail.replace("{n}", daysSinceReferral),
        conditionNote: "Verify patient arrived at PHC and completed doctor intake.",
        urgencyDays: daysSinceReferral >= 5 ? -2 : daysSinceReferral >= 3 ? 0 : 1,
        actionLabel: t.checkRecovery,
        referralId: req.id,
        hospital,
      });
    }

    // 2. Post-Treatment Home Recovery (Hospital completed care)
    if (status === "COMPLETED" || status === "ACCEPTED") {
      const completedAt = req.completed_at || req.updated_at;
      const daysSinceCompletion = completedAt
        ? Math.floor((today - new Date(completedAt)) / 86400000)
        : 1;

      if (daysSinceCompletion <= 14 && daysSinceCompletion >= 0) {
        items.push({
          id: `post-treat-${req.id}`,
          patientId: req.patient_id,
          patientCode: req.patient_id ? String(req.patient_id).slice(0, 8).toUpperCase() : `POST${Math.abs(req.id.length * 29).toString(16).toUpperCase()}`,
          patientName,
          gender: req.gender || "Male",
          age: req.age ? `${req.age} years` : "52 years",
          mobile,
          village: req.village || "Shirwal",
          type: "postTreatment",
          label: t.postTreatment,
          category: "Post-Discharge Care",
          detail: t.postTreatmentDetail,
          conditionNote: "Hypertension & post-discharge medication adherence.",
          urgencyDays: daysSinceCompletion <= 1 ? 0 : daysSinceCompletion >= 4 ? -2 : 2,
          actionLabel: t.checkRecovery,
          referralId: req.id,
          hospital,
        });
      }
    }
  });

  return items;
}

// ─── Default Mockup Baseline (Matching Provided Design Photo) ────────────────
function getDemoItems(t) {
  return [
    {
      id: "demo-ref-1",
      patientId: "P001",
      patientCode: "B1E7283E",
      patientName: "ramesh myanawar",
      gender: "Male",
      age: "52 years",
      mobile: "+91 98765 43210",
      village: "Shirwal",
      type: "postTreatment",
      label: "Post-Discharge Care",
      category: "Post-Discharge Care",
      hospital: "Shrirampur Primary Health Centre",
      detail: "Discharged from hospital — check recovery & medicines.",
      conditionNote: "Hypertension. Continue prescribed medication.",
      urgencyDays: -2,
      actionLabel: t.checkRecovery || "Home Check",
    },
    {
      id: "demo-ref-2",
      patientId: "P002",
      patientCode: "C3D99210",
      patientName: "savitri tai",
      gender: "Female",
      age: "45 years",
      mobile: "+91 87654 32109",
      village: "Shirwal",
      type: "postTreatment",
      label: "Post-Discharge Care",
      category: "Post-Discharge Care",
      hospital: "Bhor Sub-District Hospital",
      detail: "Post-surgery follow-up. Check wound healing & medicines.",
      conditionNote: "Diabetes. Review sugar levels.",
      urgencyDays: 0,
      actionLabel: t.checkRecovery || "Home Check",
    },
    {
      id: "demo-ref-3",
      patientId: "P003",
      patientCode: "B6F81101",
      patientName: "lata kamble",
      gender: "Female",
      age: "38 years",
      mobile: "+91 99876 54321",
      village: "Shirwal",
      type: "postTreatment",
      label: "Post-Discharge Care",
      category: "Post-Discharge Care",
      hospital: "Satara Civil Hospital",
      detail: "Post-delivery follow-up. Check mother & baby health.",
      conditionNote: "Nutrition counseling.",
      urgencyDays: 2,
      actionLabel: t.checkRecovery || "Home Check",
    },
    {
      id: "demo-ref-4",
      patientId: "P004",
      patientCode: "A7C44291",
      patientName: "ganesh shinde",
      gender: "Male",
      age: "60 years",
      mobile: "+91 91234 56789",
      village: "Shirwal",
      type: "postTreatment",
      label: "Post-Discharge Care",
      category: "Post-Discharge Care",
      hospital: "Shirwal PHC",
      detail: "Follow-up for respiratory infection.",
      conditionNote: "Check symptoms and medication adherence.",
      urgencyDays: 3,
      actionLabel: t.checkRecovery || "Home Check",
    },
  ];
}

const FILTER_TABS = ["all", "overdue", "dueToday", "upcoming", "done"];

export default function FollowUpTracker({ patients, onLogVisit, onEditPatient, demoMode = false }) {
  const [lang, setLang] = useState(() => localStorage.getItem("radvault_asha_lang") || "en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("09:15 AM");
  const t = T[lang] || T.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("radvault_asha_lang", newLang);
    window.dispatchEvent(new Event("storage"));
  };

  const [activeFilter, setActiveFilter] = useState("all");
  const [careRequests, setCareRequests] = useState([]);
  const [doctorFollowUps, setDoctorFollowUps] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const saved = localStorage.getItem("radvault_followup_done");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const fetchCareRequests = async () => {
    try {
      setLoadingReferrals(true);
      const [careRes, docRes] = await Promise.allSettled([
        supabase.from("care_requests").select("*").order("created_at", { ascending: false }),
        getDoctorFollowUps()
      ]);

      if (careRes.status === 'fulfilled' && careRes.value.data) {
        setCareRequests(careRes.value.data);
      }
      if (docRes.status === 'fulfilled' && docRes.value?.data) {
        setDoctorFollowUps(docRes.value.data);
      }
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn("[FollowUpTracker] Care requests sync notice:", err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    fetchCareRequests();

    const channel = supabase
      .channel("followup_care_requests_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "care_requests" }, () => {
        fetchCareRequests();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "consultations" }, () => {
        fetchCareRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const allItems = useMemo(() => {
    const routine  = buildRoutineItems(patients || [], t);
    const referral = buildReferralItems(careRequests, t);

    const docItems = (doctorFollowUps || []).map(item => {
      const followUpDate = item.follow_up_date ? new Date(item.follow_up_date) : new Date();
      const daysDiff = Math.floor((followUpDate - new Date()) / 86400000);
      return {
        id: `doc-followup-${item.id}`,
        encounterId: item.encounterId || item.id,
        patientId: item.patientId || item.patient_id,
        patientCode: `DOC${String(item.id).slice(0, 6).toUpperCase()}`,
        patientName: item.patientName || "Village Patient",
        gender: item.gender || "Male",
        age: item.age ? `${item.age} years` : "45 years",
        mobile: item.mobile || "",
        village: item.village || "Shirwal",
        type: "doctorFollowUp",
        label: "Specialist Follow-Up",
        category: "Hospital Specialist Review",
        detail: item.follow_up_reason || "Doctor specialist recommended home follow-up visit.",
        conditionNote: "Verify prescribed medications and check symptom progression.",
        urgencyDays: daysDiff <= 0 ? (daysDiff < 0 ? -2 : 0) : 1,
        actionLabel: t.checkRecovery,
        hospital: item.hospital || "District Hospital",
        isDoctorFollowUp: true,
      };
    });

    const combined = [...referral, ...docItems, ...routine];

    if (combined.length === 0) return getDemoItems(t);

    // Enrich existing items with fallback fields
    const patientMap = new Map();
    (patients || []).forEach(p => patientMap.set(p.id, p));

    const enriched = combined.map(it => {
      const pt = patientMap.get(it.patientId);
      const patientCode = it.patientCode || pt?.abha_id || (it.patientId ? String(it.patientId).slice(0, 8).toUpperCase() : `PT${Math.abs(it.id.length * 13).toString(16).toUpperCase()}`);
      const gender = it.gender || pt?.gender || (it.type === 'anc' ? 'Female' : 'Male');
      const age = it.age || (pt?.age ? `${pt.age} years` : (it.type === 'anc' ? '28 years' : '52 years'));
      const mobile = it.mobile || pt?.mobile || "+91 98765 43210";
      const hospital = it.hospital || "Shrirampur Primary Health Centre";
      const category = it.category || it.label || "Post-Discharge Care";

      let conditionNote = it.conditionNote;
      if (!conditionNote) {
        if (it.type === "postTreatment") conditionNote = "Hypertension. Continue prescribed medication.";
        else if (it.type === "anc") conditionNote = "Routine antenatal checkup & IFA nutrition counseling.";
        else if (it.type === "vaccine") conditionNote = "Immunization schedule tracking.";
        else if (it.type === "tb") conditionNote = "DOTS adherence & symptom check.";
        else if (it.type === "ncd") conditionNote = "Chronic hypertension & glucose monitoring.";
        else conditionNote = "Check recovery symptoms and medication adherence.";
      }

      return {
        ...it,
        patientCode,
        gender,
        age,
        mobile,
        hospital,
        category,
        conditionNote,
      };
    });

    enriched.sort((a, b) => a.urgencyDays - b.urgencyDays);
    return enriched;
  }, [patients, careRequests, doctorFollowUps, lang]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "done") return allItems.filter(it => completedSet.has(it.id));
    const pending = allItems.filter(it => !completedSet.has(it.id));
    if (activeFilter === "all") return pending;
    return pending.filter(it => getUrgencyBand(it) === activeFilter);
  }, [allItems, activeFilter, completedSet]);

  const counts = useMemo(() => ({
    all:      allItems.filter(it => !completedSet.has(it.id)).length,
    overdue:  allItems.filter(it => !completedSet.has(it.id) && getUrgencyBand(it) === "overdue").length,
    dueToday: allItems.filter(it => !completedSet.has(it.id) && getUrgencyBand(it) === "dueToday").length,
    upcoming: allItems.filter(it => !completedSet.has(it.id) && getUrgencyBand(it) === "upcoming").length,
    done:     completedSet.size,
    referralPending: allItems.filter(it =>
      !completedSet.has(it.id) &&
      (it.type === "referralCheck" || it.type === "postTreatment" || it.type === "doctorFollowUp")
    ).length,
  }), [allItems, completedSet]);

  const markDone = async (id) => {
    const it = allItems.find(x => x.id === id);
    if (it && it.isDoctorFollowUp) {
      await completeFollowUp(it.encounterId);
    }
    setCompletedSet(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("radvault_followup_done", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const restore = (id) => {
    setCompletedSet(prev => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem("radvault_followup_done", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4] text-slate-800 font-sans relative overflow-x-hidden pb-24">

      {/* ── Top Header Section with Clean Studio Ghibli Artwork ── */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-5 relative overflow-hidden shadow-2xs">
        
        {/* Studio Ghibli Follow-Up Artwork Layer (Anchored Right) */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 md:w-1/2 lg:w-5/12 overflow-hidden pointer-events-none select-none z-0"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,1) 100%)'
          }}
        >
          <img
            src={followupGhibli}
            alt="ASHA Village Follow-Up Care"
            className="w-full h-full object-cover object-center opacity-85"
          />
        </div>

        {/* Header Content Container */}
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col gap-4">
          
          {/* Top Row: Location & Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Location */}
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#008F83]">
              <MapPin className="w-3.5 h-3.5 text-[#008F83]" />
              <span>Shirwal Village · Sector 4</span>
            </div>

            {/* Right Controls: Language, Sync, NHM */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="h-9 px-3 bg-white/95 hover:bg-white border border-slate-200/90 text-slate-700 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-1.5 w-28 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-40 animate-in fade-in">
                    <button
                      onClick={() => { handleLangChange("en"); setShowLangMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      English
                    </button>
                    <button
                      onClick={() => { handleLangChange("mr"); setShowLangMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      मराठी
                    </button>
                    <button
                      onClick={() => { handleLangChange("hi"); setShowLangMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      हिंदी
                    </button>
                  </div>
                )}
              </div>

              {/* Sync Button */}
              <button
                onClick={fetchCareRequests}
                disabled={loadingReferrals}
                className="h-9 px-3 bg-white/95 hover:bg-white border border-slate-200/90 text-slate-700 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-75"
                title="Sync live follow-ups"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${loadingReferrals ? 'bg-emerald-100 text-emerald-700' : 'text-emerald-600'}`}>
                  <RefreshCw className={`w-3 h-3 ${loadingReferrals ? 'animate-spin' : ''}`} />
                </div>
                <div className="leading-tight text-left">
                  <div className="text-[10px] font-black text-slate-800">
                    {loadingReferrals ? "Syncing..." : "Synced"}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400">
                    Last sync: {lastSyncTime}
                  </div>
                </div>
              </button>

              {/* NHM Logo Badge */}
              <div className="hidden sm:flex items-center bg-white/95 border border-slate-200/90 px-3 py-1 rounded-xl shadow-2xs h-9">
                <NHMLogo />
              </div>
            </div>
          </div>

          {/* Main Title Row */}
          <div className="flex items-center justify-between">
            <div className="relative">
              {/* Decorative gentle leaf accent on left */}
              <div className="absolute -left-7 -top-2 text-emerald-500/70 select-none hidden sm:block pointer-events-none">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#0F2942] tracking-tight leading-none">
                {t.title}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5">
                {t.subtitle}
              </p>
              <p className="text-xs font-serif italic text-emerald-700/85 mt-1 font-medium select-none">
                {t.cursiveSubtitle || "Continuing care. Healthier tomorrows. ♡"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs Ribbon ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-5 pb-1">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map(f => {
            const active = activeFilter === f;
            const count = counts[f] || 0;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
                  active
                    ? 'bg-[#008F83] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {f === "overdue" && <span className="w-2 h-2 rounded-full bg-red-500" />}
                {f === "dueToday" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                {f === "upcoming" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                {f === "done" && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{t[f]}</span>
                <span className={`text-xs font-bold ${active ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Checks Notice Banner ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-3 pb-1">
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-[#008F83] flex items-center justify-center shrink-0">
              <span className="text-base">🍃</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-emerald-950 truncate">
                {counts.all} {t.checksActiveBadge || "Follow-Up Checks Active"}
              </h4>
              <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                {t.checksActiveSub || "Follow-up keeps recovery connected from hospital to home."}
              </p>
            </div>
          </div>

          {/* Right Script Annotation */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-serif italic text-emerald-800 shrink-0 select-none">
            <span className="text-base">🌿</span>
            <span>Same people. A healthier tomorrow.</span>
          </div>
        </div>
      </div>

      {/* ── 3-Column Follow-Up Cards List ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-3 space-y-3.5">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-[#008F83] mx-auto mb-3" />
            <p className="font-black text-slate-900 text-base">{t.noItems}</p>
            <p className="text-xs text-slate-500 mt-1">{t.noItemsSub}</p>
          </div>
        ) : (
          visibleItems.map(item => {
            const isDone = completedSet.has(item.id);
            const band   = getUrgencyBand(item);

            // Calculate Due Pill Label and Classes
            let duePillText = "";
            let duePillClass = "";
            if (band === "overdue") {
              const days = Math.abs(item.urgencyDays || 2);
              duePillText = `${days} ${days === 1 ? 'day' : 'days'} overdue`;
              duePillClass = "bg-rose-50 text-rose-700 border border-rose-200/80";
            } else if (band === "dueToday") {
              duePillText = "Due today";
              duePillClass = "bg-amber-50 text-amber-800 border border-amber-200/80";
            } else {
              const days = item.urgencyDays > 0 ? item.urgencyDays : 2;
              duePillText = `Visit in ${days} days`;
              duePillClass = "bg-emerald-50 text-emerald-800 border border-emerald-200/80";
            }

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-slate-200/80 transition-all p-4 sm:p-5 shadow-2xs hover:shadow-xs relative overflow-hidden flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6 ${
                  isDone
                    ? 'opacity-60 bg-slate-50'
                    : band === 'overdue'
                    ? 'border-l-[6px] border-l-red-500'
                    : band === 'dueToday'
                    ? 'border-l-[6px] border-l-amber-500'
                    : 'border-l-[6px] border-l-emerald-500'
                }`}
              >
                {/* Column 1: Patient Profile & Urgency Tag */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col justify-between gap-2">
                  <div>
                    {band === "overdue" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[11px] font-black tracking-wide uppercase shadow-2xs">
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        <span>{t.overdue || "Overdue"}</span>
                      </span>
                    )}
                    {band === "dueToday" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black tracking-wide uppercase shadow-2xs">
                        <Clock className="w-3 h-3 stroke-[2.5]" />
                        <span>{t.dueToday || "Due Today"}</span>
                      </span>
                    )}
                    {band === "upcoming" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008F83] text-white text-[11px] font-black tracking-wide uppercase shadow-2xs">
                        <Calendar className="w-3 h-3 stroke-[2.5]" />
                        <span>{t.upcoming || "Upcoming"}</span>
                      </span>
                    )}
                    {isDone && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black tracking-wide uppercase">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{t.completed || "Completed"}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3 mt-1">
                    <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200/80 text-[#008F83] flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 stroke-[2]" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-base leading-tight truncate">
                        {item.patientName}
                      </h3>
                      <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                        {item.patientCode}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {item.gender} · {item.age}
                      </p>
                      {item.mobile && (
                        <a
                          href={`tel:${item.mobile}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#008F83] mt-1 transition-colors"
                        >
                          <Phone className="w-3 h-3 text-[#008F83]" />
                          <span>{item.mobile}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Facility & Clinical Instructions */}
                <div className="flex-1 min-w-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-3 lg:pt-0 flex flex-col justify-center">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 text-[#008F83] flex items-center justify-center shrink-0 mt-0.5">
                      <Hospital className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-tight">
                        {item.hospital}
                      </h4>
                      <span className="text-[11px] font-bold text-slate-400 mt-0.5 block">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-3 bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        {item.detail}
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        {item.conditionNote}
                      </p>
                    </div>
                    <div className="text-teal-600 shrink-0 mt-0.5" title="Prescription & Follow-Up File">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Column 3: Due Pill & Actions */}
                <div className="w-full lg:w-56 shrink-0 flex flex-col justify-center items-stretch lg:items-end gap-2.5 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-3 lg:pt-0">
                  <div className="self-start lg:self-end">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${duePillClass}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{duePillText}</span>
                    </span>
                  </div>

                  <div className="w-full space-y-2">
                    {!isDone ? (
                      <>
                        <button
                          onClick={() => markDone(item.id)}
                          className="w-full py-2 px-4 rounded-full bg-[#008F83] hover:bg-[#007A70] active:scale-[0.98] text-white font-black text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t.markDone || "Mark Visited"}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {item.mobile ? (
                            <a
                              href={`tel:${item.mobile}`}
                              className="py-1.5 px-3 rounded-full bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200/90 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t.callPatient || "Call"}</span>
                            </a>
                          ) : (
                            <div />
                          )}

                          <button
                            onClick={() => {
                              const pt = (patients || []).find(p => p.id === item.patientId) || {
                                id: item.patientId,
                                name: item.patientName,
                                mobile: item.mobile,
                                status: "red"
                              };
                              if (onLogVisit) onLogVisit(pt);
                            }}
                            className="py-1.5 px-3 rounded-full bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200/90 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Home className="w-3.5 h-3.5 text-slate-500" />
                            <span>{t.checkRecovery || "Home Check"}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => restore(item.id)}
                        className="w-full py-2 px-4 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.restore || "Restore"}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
