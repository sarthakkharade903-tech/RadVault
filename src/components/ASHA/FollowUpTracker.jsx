import React, { useState, useEffect, useMemo } from "react";
import {
  Phone, CheckCircle2, Check, Heart, Baby, Activity,
  Stethoscope, Shield, CalendarCheck, ArrowRight, RefreshCw,
  Send, Loader2, Hospital, MapPin
} from "lucide-react";
import { supabase } from "../../services/supabase";

// ─── Single-Language Clean Translations (Read from global lang) ───────────
const T = {
  en: {
    title: "Follow-Up Register",
    subtitle: "Daily patient visits & referral recovery tracking",
    all: "All Pending",
    overdue: "Overdue",
    dueToday: "Due Today",
    upcoming: "Upcoming",
    done: "Completed",
    markDone: "Mark Visited",
    callPatient: "Call",
    logVisit: "Log Visit",
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
    postTreatmentDetail: "Discharged from hospital — check recovery & medicines",
    completed: "Completed",
    weeks: "wks pregnant",
    restore: "Restore",
    refresh: "Sync",
    referredTo: "Hospital",
    verifyArrival: "Verify Arrival",
    checkRecovery: "Home Check",
  },
  mr: {
    title: "पाठपुरावा नोंदवही",
    subtitle: "दैनंदिन गृहभेटी व रुग्ण तपासणी पाठपुरावा",
    all: "सर्व प्रलंबित",
    overdue: "वेळ उलटली",
    dueToday: "आजच्या भेटी",
    upcoming: "पुढील भेटी",
    done: "पूर्ण झालेल्या",
    markDone: "भेट पूर्ण",
    callPatient: "फोन करा",
    logVisit: "नोंद करा",
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
    postTreatmentDetail: "रुग्णालय सुट्टी — घरी बरे होणे व औषधे तपासा",
    completed: "पूर्ण",
    weeks: "आठवडे गरोदर",
    restore: "पूर्ववत",
    refresh: "ताजे करा",
    referredTo: "रुग्णालय",
    verifyArrival: "उपस्थिती तपासा",
    checkRecovery: "घरी भेट द्या",
  },
  hi: {
    title: "फॉलो-अप रजिस्टर",
    subtitle: "दैनिक गृहभेंट एवं रेफरल रिकवरी निगरानी",
    all: "सभी लंबित",
    overdue: "समय निकल गया",
    dueToday: "आज का",
    upcoming: "आगामी",
    done: "पूर्ण",
    markDone: "भेंट पूर्ण",
    callPatient: "कॉल करें",
    logVisit: "दर्ज करें",
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
    postTreatmentDetail: "अस्पताल से छुट्टी — घर पर दवाएं व स्वास्थ्य जांचें",
    completed: "पूर्ण",
    weeks: "सप्ताह गर्भवती",
    restore: "पूर्ववत",
    refresh: "ताज़ा करें",
    referredTo: "अस्पताल",
    verifyArrival: "उपस्थिति जांचें",
    checkRecovery: "गृह जांच",
  }
};

// ─── Unified Icon Map (Unified Signal Green theme) ───────────────────────────
const TYPE_ICONS = {
  anc: Heart,
  vaccine: Shield,
  followup: Activity,
  tb: Stethoscope,
  ncd: Baby,
  referralCheck: Send,
  postTreatment: Hospital,
};

function getUrgencyBand(item) {
  if (item.urgencyDays <= 0) return "overdue";
  if (item.urgencyDays <= 1) return "dueToday";
  return "upcoming";
}

// ─── Routine Health Visit Derivations ───────────────────────────────────────
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
          mobile, village,
          type: "anc",
          label: t.ancDue,
          detail: `ANC-${doneAnc + 1} • ${weeks} ${t.weeks}`,
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
          mobile, village,
          type: "vaccine",
          label: t.vaccineDue,
          detail: `${missing[0].toUpperCase()} • ${missing.length} pending`,
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

    // NCD Chronic (Monthly BP/Sugar)
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

// ─── Referral Pipeline Follow-Up Derivations ─────────────────────────────────
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

    // 1. Referral Arrival Verification (Referred 2+ days ago and still pending)
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
        detail: t.referralCheckDetail.replace("{n}", daysSinceReferral),
        urgencyDays: daysSinceReferral >= 5 ? -2 : daysSinceReferral >= 3 ? 0 : 1,
        actionLabel: t.verifyArrival,
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
          patientName,
          mobile,
          village: req.village || "Shirwal",
          type: "postTreatment",
          label: t.postTreatment,
          detail: t.postTreatmentDetail,
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

// ─── Default Village Baseline (Sector 4) ────────────────────────────────────
function getDemoItems(t) {
  return [
    {
      id: "demo-ref-1",
      patientId: "P001", patientName: "Ramesh Patil",
      mobile: "+91 97123-45678", village: "Shirwal",
      type: "referralCheck", label: t.referralCheck,
      detail: t.referralCheckDetail.replace("{n}", "3"),
      urgencyDays: 0,
      actionLabel: t.verifyArrival, hospital: "Primary Health Centre (PHC) - Shirwal",
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
      id: "demo-post-1",
      patientId: "P004", patientName: "Sunita More",
      mobile: "+91 91234-56789", village: "Shirwal",
      type: "postTreatment", label: t.postTreatment,
      detail: t.postTreatmentDetail,
      urgencyDays: -1,
      actionLabel: t.checkRecovery, hospital: "Satara District Civil Hospital",
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

const FILTER_TABS = ["all", "overdue", "dueToday", "upcoming", "done"];

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

  const fetchCareRequests = async () => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase
        .from("care_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) setCareRequests(data);
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
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const allItems = useMemo(() => {
    const routine  = buildRoutineItems(patients || [], t);
    const referral = buildReferralItems(careRequests, t);
    const combined = [...referral, ...routine];

    if (combined.length === 0) return getDemoItems(t);
    combined.sort((a, b) => a.urgencyDays - b.urgencyDays);
    return combined;
  }, [patients, careRequests, lang]);

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

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-24 font-sans text-slate-800">

      {/* ── Standard Signal Green Top Bar ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#008F83]" />
                {t.title}
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCareRequests}
                disabled={loadingReferrals}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                title={t.refresh}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReferrals ? 'animate-spin text-[#008F83]' : ''}`} />
                <span className="hidden sm:inline">{t.refresh}</span>
              </button>

              <div className="bg-[#E8F7F3] border border-[#008F83]/30 px-3 py-1.5 rounded-xl text-right">
                <span className="text-xs font-black text-[#008F83] block">
                  {counts.all} {lang === 'mr' ? 'प्रलंबित' : lang === 'hi' ? 'लंबित' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Clean Filter Tabs (Standard Signal Green theme) ── */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_TABS.map(f => {
              const active = activeFilter === f;
              const count = counts[f] || 0;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    active
                      ? 'bg-[#008F83] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f === "overdue"  && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  {f === "dueToday" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                  {f === "upcoming" && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  {f === "done"     && <Check className="w-3.5 h-3.5" />}
                  <span>{t[f]}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Referral Pipeline Notice (Signal Green Accent) ── */}
      {counts.referralPending > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-[#E8F7F3] border border-[#008F83]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#008F83] text-white flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#008F83] truncate">
                  {counts.referralPending} {lang === 'mr' ? 'रेफरल पाठपुरावा उपलब्ध' : lang === 'hi' ? 'रेफरल फॉलो-अप लंबित' : 'Referral Loop Checks Active'}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {lang === 'mr'
                    ? 'रुग्ण रुग्णालयात पोहोचल्याची खात्री करा व डिस्चार्ज नंतर औषध तपासणी करा.'
                    : lang === 'hi'
                    ? 'मरीज अस्पताल पहुंचा या नहीं जांचें एवं छुट्टी बाद दवाएं सत्यापित करें।'
                    : 'Verify patient arrived at PHC and confirm post-discharge medicine recovery.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-Up Cards List ── */}
      <div className="px-4 sm:px-6 pt-4 space-y-3 max-w-3xl mx-auto">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-[#008F83] mx-auto mb-3" />
            <p className="font-extrabold text-slate-900 text-base">{t.noItems}</p>
            <p className="text-xs text-slate-500 mt-1">{t.noItemsSub}</p>
          </div>
        ) : (
          visibleItems.map(item => {
            const isDone = completedSet.has(item.id);
            const band   = getUrgencyBand(item);
            const IconComponent = TYPE_ICONS[item.type] || Activity;
            const isUrgent = band === "overdue";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                  isDone
                    ? 'opacity-60 bg-slate-50 border-slate-200'
                    : isUrgent
                    ? 'border-[#E2E8F0] border-l-4 border-l-red-500'
                    : 'border-[#E2E8F0] border-l-4 border-l-[#008F83]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon Box in Signal Green Theme */}
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F7F3] border border-[#008F83]/20 text-[#008F83] flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header line: Name + Urgency indicator */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 text-base leading-tight">
                          {item.patientName}
                        </p>
                        <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>

                      {!isDone ? (
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          band === "overdue"
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : band === "dueToday"
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {band === "overdue" && "🔴 " + t.overdue}
                          {band === "dueToday" && "🟡 " + t.dueToday}
                          {band === "upcoming" && "🟢 " + t.upcoming}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t.completed}
                        </span>
                      )}
                    </div>

                    {/* Detail text */}
                    <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                      {item.detail}
                    </p>

                    {/* Associated hospital or village */}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-semibold flex-wrap">
                      {item.hospital ? (
                        <span className="flex items-center gap-1 text-[#008F83] font-bold">
                          <Hospital className="w-3.5 h-3.5" />
                          {item.hospital}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {item.village || "Shirwal"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      {!isDone ? (
                        <>
                          {/* 1. Mark Done (Standard Signal Green Button) */}
                          <button
                            onClick={() => markDone(item.id)}
                            className="flex items-center gap-1.5 bg-[#008F83] hover:bg-[#007A70] active:scale-95 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{t.markDone}</span>
                          </button>

                          {/* 2. Direct 1-Tap Call */}
                          {item.mobile ? (
                            <a
                              href={`tel:${item.mobile}`}
                              className="flex items-center gap-1.5 bg-[#E8F7F3] hover:bg-[#D4F0E8] active:scale-95 text-[#008F83] border border-[#008F83]/30 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{t.callPatient}</span>
                            </a>
                          ) : null}

                          {/* 3. Log Clinical Visit / Open Assessment */}
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
                            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>{item.actionLabel || t.logVisit}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => restore(item.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.restore}</span>
                        </button>
                      )}
                    </div>
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