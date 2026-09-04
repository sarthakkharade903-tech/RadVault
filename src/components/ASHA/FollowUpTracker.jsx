import React, { useState, useEffect, useMemo } from "react";
import {
  Phone, CheckCircle2, Check, Heart, Baby, Activity,
  Stethoscope, Shield, CalendarCheck, ArrowRight, RefreshCw,
  AlertTriangle, Send, Loader2, Hospital
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { computeDueList } from "../../services/ashaService";

// ─── Translations ──────────────────────────────────────────────────────────
const T = {
  en: {
    title: "Follow-Up Register",
    subtitle: "Patients needing your attention today",
    overdue: "Overdue",
    dueToday: "Due Today",
    upcoming: "Upcoming",
    done: "Done",
    all: "All",
    markDone: "Mark Done",
    callPatient: "Call",
    logVisit: "Log Visit",
    noItems: "All follow-ups are complete!",
    noItemsSub: "Great work! No pending follow-ups right now.",
    lastVisit: "Last visited",
    daysAgo: "days ago",
    neverVisited: "Never visited",
    ancDue: "ANC Visit Due",
    vaccineDue: "Vaccine Due",
    highRisk: "High Risk Check",
    tbDots: "TB Medicine Check",
    ncdMonitor: "BP / Sugar Check",
    referralCheck: "Referral Follow-Up",
    postTreatment: "Post-Treatment Recovery",
    referralCheckDetail: "Referred {n} days ago — confirm patient reached hospital",
    postTreatmentDetail: "Treatment complete — verify home recovery & medicines",
    completed: "Done",
    weeks: "wks pregnant",
    restore: "Restore",
    refresh: "Refresh",
    referredTo: "Referred to",
    daysAgoReferred: "days since referral",
    verifyArrival: "Verify Arrival",
    checkRecovery: "Check Recovery",
  },
  mr: {
    title: "पाठपुरावा नोंदवही",
    subtitle: "आजच्या तपासणीसाठी रुग्ण",
    overdue: "वेळ उलटली",
    dueToday: "आजचे",
    upcoming: "येणारे",
    done: "पूर्ण",
    all: "सर्व",
    markDone: "पूर्ण करा",
    callPatient: "फोन",
    logVisit: "भेट नोंदवा",
    noItems: "सर्व पाठपुरावे पूर्ण!",
    noItemsSub: "शाब्बास! सध्या कोणताही प्रलंबित पाठपुरावा नाही.",
    lastVisit: "शेवटची भेट",
    daysAgo: "दिवसांपूर्वी",
    neverVisited: "कधीच भेट नाही",
    ancDue: "ANC भेट आवश्यक",
    vaccineDue: "लसीकरण आवश्यक",
    highRisk: "धोकादायक तपासणी",
    tbDots: "टीबी औषध तपासणी",
    ncdMonitor: "बीपी / साखर तपासणी",
    referralCheck: "रेफरल पाठपुरावा",
    postTreatment: "उपचारानंतर तपासणी",
    referralCheckDetail: "{n} दिवसांपूर्वी रेफर केले — रुग्ण रुग्णालयात पोहोचला का?",
    postTreatmentDetail: "उपचार पूर्ण — घरी बरे होणे व औषधे तपासा",
    completed: "पूर्ण",
    weeks: "आठवडे गरोदर",
    restore: "पूर्ववत करा",
    refresh: "ताजे करा",
    referredTo: "रेफर केले",
    daysAgoReferred: "दिवसांपूर्वी रेफर",
    verifyArrival: "उपस्थिती तपासा",
    checkRecovery: "बरे होणे तपासा",
  },
  hi: {
    title: "फॉलो-अप रजिस्टर",
    subtitle: "आज के लिए ध्यान देने योग्य मरीज",
    overdue: "समय निकल गया",
    dueToday: "आज का",
    upcoming: "आगामी",
    done: "पूर्ण",
    all: "सभी",
    markDone: "पूर्ण करें",
    callPatient: "कॉल",
    logVisit: "भेंट दर्ज करें",
    noItems: "सभी फॉलो-अप पूर्ण!",
    noItemsSub: "शाबाश! अभी कोई लंबित फॉलो-अप नहीं है।",
    lastVisit: "अंतिम भेंट",
    daysAgo: "दिन पहले",
    neverVisited: "कभी भेंट नहीं",
    ancDue: "ANC विजिट आवश्यक",
    vaccineDue: "टीका आवश्यक",
    highRisk: "उच्च जोखिम जांच",
    tbDots: "टीबी दवा जांच",
    ncdMonitor: "बीपी / शुगर जांच",
    referralCheck: "रेफरल फॉलो-अप",
    postTreatment: "उपचार के बाद रिकवरी",
    referralCheckDetail: "{n} दिन पहले रेफर किया — मरीज़ अस्पताल पहुंचा?",
    postTreatmentDetail: "इलाज पूरा हुआ — घर में दवाएं और रिकवरी जांचें",
    completed: "पूर्ण",
    weeks: "सप्ताह गर्भवती",
    restore: "पूर्ववत",
    refresh: "ताज़ा करें",
    referredTo: "रेफर किया",
    daysAgoReferred: "दिन पहले रेफर",
    verifyArrival: "उपस्थिति सत्यापित करें",
    checkRecovery: "रिकवरी जांचें",
  }
};

// ─── Type Config ───────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  anc:           { icon: Heart,         bg: "bg-rose-50",    border: "border-rose-400",    text: "text-rose-700",    badge: "bg-rose-100 text-rose-800 border-rose-200" },
  vaccine:       { icon: Shield,        bg: "bg-violet-50",  border: "border-violet-400",  text: "text-violet-700",  badge: "bg-violet-100 text-violet-800 border-violet-200" },
  followup:      { icon: Activity,      bg: "bg-red-50",     border: "border-red-500",     text: "text-red-700",     badge: "bg-red-100 text-red-800 border-red-200" },
  tb:            { icon: Stethoscope,   bg: "bg-amber-50",   border: "border-amber-400",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-800 border-amber-200" },
  ncd:           { icon: Baby,          bg: "bg-orange-50",  border: "border-orange-400",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-800 border-orange-200" },
  // ── Referral pipeline types (the real problem statement solvers) ──────────
  referralCheck: { icon: Send,          bg: "bg-blue-50",    border: "border-blue-500",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-800 border-blue-200" },
  postTreatment: { icon: Hospital,      bg: "bg-teal-50",    border: "border-teal-500",    text: "text-teal-700",    badge: "bg-teal-100 text-teal-800 border-teal-200" },
};

// ─── Urgency band ──────────────────────────────────────────────────────────
function getUrgencyBand(item) {
  if (item.urgencyDays <= 0) return "overdue";
  if (item.urgencyDays <= 1) return "dueToday";
  return "upcoming";
}

// ─── Build routine follow-up list from patients ────────────────────────────
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

    // ANC
    if (p.is_pregnant && p.lmp_date) {
      const weeks = Math.floor((today - new Date(p.lmp_date)) / (7 * 24 * 60 * 60 * 1000));
      const expectedAnc = weeks >= 36 ? 4 : weeks >= 28 ? 3 : weeks >= 16 ? 2 : 1;
      const doneAnc = p.anc_visits_done || 0;
      if (doneAnc < expectedAnc) {
        items.push({
          id: `anc-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile, village,
          type: "anc",
          label: t.ancDue,
          detail: `ANC-${doneAnc + 1} • ${weeks} ${t.weeks}`,
          urgencyDays: weeks >= 36 ? -1 : weeks >= 28 ? 0 : 3,
        });
      }
    }

    // Vaccine
    if (p.is_child) {
      const missing = ["bcg","opv","dpt","hep_b","measles","mr"].filter(v => !p[`vaccine_${v}`]);
      if (missing.length) {
        items.push({
          id: `vac-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile, village,
          type: "vaccine",
          label: t.vaccineDue,
          detail: `${missing[0].toUpperCase()} · ${missing.length} pending`,
          urgencyDays: 1,
        });
      }
    }

    // High Risk
    if (p.status === "red") {
      const daysWithoutVisit = lastVisitDays !== null ? lastVisitDays : 10;
      if (daysWithoutVisit >= 7) {
        items.push({
          id: `hr-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile, village,
          type: "followup",
          label: t.highRisk,
          detail: lastVisitDays !== null
            ? `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`
            : t.neverVisited,
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
          mobile, village,
          type: "tb",
          label: t.tbDots,
          detail: lastVisitDays !== null
            ? `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`
            : t.neverVisited,
          urgencyDays: 0,
        });
      }
    }

    // NCD monthly check
    if (p.has_chronic && lastVisitDays !== null && lastVisitDays >= 28) {
      items.push({
        id: `ncd-${p.id}`,
        patientId: p.id,
        patientName: p.name,
        mobile, village,
        type: "ncd",
        label: t.ncdMonitor,
        detail: `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`,
        urgencyDays: lastVisitDays >= 40 ? -2 : 1,
      });
    }
  });

  return items;
}

// ─── Build REFERRAL pipeline follow-up items from care_requests ────────────
// This is the real problem statement connection:
// 1. referralCheck  — Patient referred 48h+ ago, hospital hasn't accepted yet
//                     → ASHA must call patient to verify they went
// 2. postTreatment  — Hospital marked referral COMPLETED
//                     → ASHA must visit home to verify recovery + medicine compliance
function buildReferralItems(careRequests, t) {
  if (!careRequests || !careRequests.length) return [];
  const today = new Date();
  const items = [];

  careRequests.forEach(req => {
    const daysSinceReferral = req.created_at
      ? Math.floor((today - new Date(req.created_at)) / 86400000)
      : 0;

    const hospital = req.facility || "PHC Shirwal";
    const patientName = req.patient_name || "Village Resident";
    const mobile = req.mobile || req.patient_mobile || "";
    const status = (req.status || "").toUpperCase();

    // ── TYPE 1: Referral Check ─────────────────────────────────────────
    // Trigger: referred 2+ days ago AND status is still SUBMITTED/PENDING
    // (means hospital hasn't confirmed patient arrived)
    if (
      daysSinceReferral >= 2 &&
      (status === "SUBMITTED" || status === "PENDING" || status === "PENDING_PHC")
    ) {
      items.push({
        id: `ref-check-${req.id}`,
        patientId: req.patient_id,
        patientName,
        mobile,
        village: req.village || "Shirwal",
        type: "referralCheck",
        label: t.referralCheck,
        detail: t.referralCheckDetail.replace("{n}", daysSinceReferral) + ` · ${hospital}`,
        subDetail: `${t.referredTo}: ${hospital} · ${t.daysAgoReferred.replace ? daysSinceReferral + " " + t.daysAgoReferred : ""}`,
        urgencyDays: daysSinceReferral >= 5 ? -2 : daysSinceReferral >= 3 ? 0 : 1,
        actionLabel: t.verifyArrival,
        referralId: req.id,
        hospital,
      });
    }

    // ── TYPE 2: Post-Treatment Recovery ───────────────────────────────
    // Trigger: hospital/doctor marked status = COMPLETED
    // ASHA must do a home visit to check recovery
    if (status === "COMPLETED" || status === "ACCEPTED") {
      const completedAt = req.completed_at || req.updated_at;
      const daysSinceCompletion = completedAt
        ? Math.floor((today - new Date(completedAt)) / 86400000)
        : 1;

      // Only show for 10 days after completion
      if (daysSinceCompletion <= 10 && daysSinceCompletion >= 0) {
        items.push({
          id: `post-treat-${req.id}`,
          patientId: req.patient_id,
          patientName,
          mobile,
          village: req.village || "Shirwal",
          type: "postTreatment",
          label: t.postTreatment,
          detail: `${t.postTreatmentDetail} · ${hospital}`,
          urgencyDays: daysSinceCompletion <= 1 ? 0 : daysSinceCompletion >= 4 ? -1 : 1,
          actionLabel: t.checkRecovery,
          referralId: req.id,
          hospital,
        });
      }
    }
  });

  return items;
}

// ─── Demo data (only shown when no real data at all) ──────────────────────
function getDemoItems(t) {
  return [
    {
      id: "demo-ref-1",
      patientId: "P001", patientName: "Ramesh Patil",
      mobile: "+91 97123-45678", village: "Shirwal",
      type: "referralCheck", label: t.referralCheck,
      detail: t.referralCheckDetail.replace("{n}", "3") + " · PHC Shirwal",
      urgencyDays: 0,
      actionLabel: t.verifyArrival, hospital: "PHC Shirwal",
    },
    {
      id: "demo-post-1",
      patientId: "P004", patientName: "Sunita More",
      mobile: "+91 91234-56789", village: "Shirwal",
      type: "postTreatment", label: t.postTreatment,
      detail: t.postTreatmentDetail + " · District Hospital Satara",
      urgencyDays: -1,
      actionLabel: t.checkRecovery, hospital: "District Hospital",
    },
    {
      id: "demo-anc-1",
      patientId: "P002", patientName: "Rekha Bai",
      mobile: "+91 98451-88310", village: "Shirwal",
      type: "anc", label: t.ancDue,
      detail: `ANC-3 • 31 ${t.weeks}`,
      urgencyDays: -1,
    },
    {
      id: "demo-hr-1",
      patientId: "P007", patientName: "Bhimrao Salve",
      mobile: "+91 94567-11223", village: "Shirwal",
      type: "followup", label: t.highRisk,
      detail: `${t.lastVisit}: 10 ${t.daysAgo}`,
      urgencyDays: -3,
    },
    {
      id: "demo-tb-1",
      patientId: "P003", patientName: "Savita Kamble",
      mobile: "+91 99005-12340", village: "Shirwal",
      type: "tb", label: t.tbDots,
      detail: `${t.lastVisit}: 8 ${t.daysAgo}`,
      urgencyDays: 0,
    },
  ];
}

// ─── Urgency pill ──────────────────────────────────────────────────────────
function UrgencyPill({ band, t }) {
  if (band === "overdue")  return <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">🔴 {t.overdue}</span>;
  if (band === "dueToday") return <span className="text-[10px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full">🟡 {t.dueToday}</span>;
  return <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">🟢 {t.upcoming}</span>;
}

const FILTER_TABS = ["all", "overdue", "dueToday", "upcoming", "done"];

// ─── Main Component ────────────────────────────────────────────────────────
export default function FollowUpTracker({ patients, onLogVisit }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = T[lang] || T.en;

  const [activeFilter, setActiveFilter] = useState("all");
  const [careRequests, setCareRequests] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const saved = localStorage.getItem("radvault_followup_done");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // ── Fetch care_requests from Supabase (the referral pipeline) ────────────
  const fetchCareRequests = async () => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase
        .from("care_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) setCareRequests(data);
    } catch (err) {
      console.warn("[FollowUpTracker] Could not load care_requests:", err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    fetchCareRequests();

    // Real-time: if hospital updates a referral status, Follow-Up auto-updates
    const channel = supabase
      .channel("followup_care_requests_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "care_requests" }, () => {
        fetchCareRequests();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── Combine routine + referral pipeline items ────────────────────────────
  const allItems = useMemo(() => {
    const routine  = buildRoutineItems(patients || [], t);
    const referral = buildReferralItems(careRequests, t);
    const combined = [...referral, ...routine]; // referral items listed first

    // If nothing real, show demo
    if (combined.length === 0) return getDemoItems(t);

    // Sort: most overdue first
    combined.sort((a, b) => a.urgencyDays - b.urgencyDays);
    return combined;
  }, [patients, careRequests, lang]);

  // ── Filter logic ──────────────────────────────────────────────────────────
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
    // Referral-specific for the header badge
    referralPending: allItems.filter(it =>
      !completedSet.has(it.id) &&
      (it.type === "referralCheck" || it.type === "postTreatment")
    ).length,
  }), [allItems, completedSet]);

  const markDone = (id) => {
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

  const tabActive = {
    all:      "bg-slate-800 text-white",
    overdue:  "bg-red-600 text-white",
    dueToday: "bg-amber-500 text-white",
    upcoming: "bg-emerald-600 text-white",
    done:     "bg-slate-400 text-white",
  };
  const tabInactive = "bg-white text-slate-600 border border-slate-200 hover:border-slate-400";

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-24 font-sans text-slate-800">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-black text-[#16324F] flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#008F83]" />
                {t.title}
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.subtitle}</p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              {counts.referralPending > 0 && (
                <span className="text-[11px] font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Send className="w-2.5 h-2.5" /> {counts.referralPending} referral
                </span>
              )}
              {counts.overdue > 0 && (
                <span className="text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                  {counts.overdue} 🔴
                </span>
              )}
              <button
                onClick={fetchCareRequests}
                className="text-[10px] text-slate-400 hover:text-[#008F83] flex items-center gap-1 mt-0.5"
              >
                {loadingReferrals
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <RefreshCw className="w-3 h-3" />
                }
                {t.refresh}
              </button>
            </div>
          </div>

          {/* ── Filter Tabs ──────────────────────────────────────────── */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
            {FILTER_TABS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                  activeFilter === f ? tabActive[f] : tabInactive
                }`}
              >
                {f === "overdue"  && "🔴 "}
                {f === "dueToday" && "🟡 "}
                {f === "upcoming" && "🟢 "}
                {f === "done"     && "✅ "}
                {f === "all"      && "📋 "}
                {t[f]}
                {counts[f] > 0 && (
                  <span className={`ml-1 px-1.5 rounded-full text-[10px] font-black ${
                    activeFilter === f ? "bg-white/25" : "bg-slate-100 text-slate-600"
                  }`}>{counts[f]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Referral pipeline notice banner ──────────────────────────── */}
      {counts.referralPending > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-blue-800">
                {counts.referralPending} referral follow-up{counts.referralPending > 1 ? "s" : ""} pending
              </p>
              <p className="text-[11px] text-blue-600 mt-0.5">
                Verify that referred patients reached the hospital and are recovering at home.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Cards ────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 space-y-3 max-w-2xl mx-auto">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm mt-2">
            <CheckCircle2 className="w-14 h-14 text-[#008F83] mx-auto mb-3" />
            <p className="font-extrabold text-[#16324F] text-lg">{t.noItems}</p>
            <p className="text-sm text-slate-500 mt-1">{t.noItemsSub}</p>
          </div>
        ) : (
          visibleItems.map(item => {
            const cfg      = TYPE_CONFIG[item.type] || TYPE_CONFIG.followup;
            const TypeIcon = cfg.icon;
            const isDone   = completedSet.has(item.id);
            const band     = getUrgencyBand(item);
            const isReferralType = item.type === "referralCheck" || item.type === "postTreatment";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-l-4 ${cfg.border} border border-[#E2E8F0] p-4 sm:p-5 shadow-sm transition-all ${
                  isDone ? "opacity-50 bg-slate-50" : ""
                } ${isReferralType ? "ring-1 ring-blue-100" : ""}`}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${cfg.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-900 text-base leading-tight">{item.patientName}</p>
                      {!isDone && <UrgencyPill band={band} t={t} />}
                      {isDone && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t.completed}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {item.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{item.detail}</p>

                    {item.hospital && (
                      <p className="text-[11px] text-blue-500 font-semibold mt-0.5 flex items-center gap-1">
                        🏥 {item.hospital}
                      </p>
                    )}

                    {!item.hospital && item.village && (
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">📍 {item.village}</p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {!isDone ? (
                    <>
                      {/* Primary: Mark Done */}
                      <button
                        onClick={() => markDone(item.id)}
                        className="flex items-center gap-1.5 bg-[#008F83] hover:bg-[#007A70] active:scale-95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t.markDone}
                      </button>

                      {/* Call */}
                      {item.mobile && (
                        <a
                          href={`tel:${item.mobile}`}
                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {t.callPatient}
                        </a>
                      )}

                      {/* Log Visit (for referral types it becomes Verify / Log Recovery) */}
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
                        className={`flex items-center gap-1.5 active:scale-95 border text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                          isReferralType
                            ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        {item.actionLabel || t.logVisit}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => restore(item.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t.restore}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}