import React, { useState, useMemo } from "react";
import {
  Phone, CheckCircle2, AlertTriangle, Check,
  Heart, Baby, Activity, Stethoscope, Shield,
  CalendarCheck, ArrowRight, Clock, RefreshCw
} from "lucide-react";
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
    refer: "Refer",
    noItems: "All follow-ups are complete!",
    noItemsSub: "Great work! No pending follow-ups right now.",
    lastVisit: "Last visited",
    daysAgo: "days ago",
    neverVisited: "Never visited",
    ancDue: "ANC Visit Due",
    vaccineDue: "Vaccine Due",
    highRisk: "High Risk Check",
    tbDots: "TB Medicine Check",
    postDischarge: "Post-Discharge Follow-Up",
    ncdMonitor: "BP/Sugar Check",
    completed: "Completed",
    weeks: "wks pregnant",
    village: "Village",
    restore: "Restore",
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
    refer: "रेफर",
    noItems: "सर्व पाठपुरावे पूर्ण!",
    noItemsSub: "शाब्बास! सध्या कोणताही प्रलंबित पाठपुरावा नाही.",
    lastVisit: "शेवटची भेट",
    daysAgo: "दिवसांपूर्वी",
    neverVisited: "कधीच भेट नाही",
    ancDue: "ANC भेट आवश्यक",
    vaccineDue: "लसीकरण आवश्यक",
    highRisk: "धोकादायक तपासणी",
    tbDots: "टीबी औषध तपासणी",
    postDischarge: "रुग्णालयातून सुटल्यावर पाठपुरावा",
    ncdMonitor: "बीपी/साखर तपासणी",
    completed: "पूर्ण",
    weeks: "आठवडे गरोदर",
    village: "गाव",
    restore: "पूर्ववत करा",
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
    refer: "रेफर",
    noItems: "सभी फॉलो-अप पूर्ण!",
    noItemsSub: "शाबाश! अभी कोई लंबित फॉलो-अप नहीं है।",
    lastVisit: "अंतिम भेंट",
    daysAgo: "दिन पहले",
    neverVisited: "कभी भेंट नहीं",
    ancDue: "ANC विजिट आवश्यक",
    vaccineDue: "टीका आवश्यक",
    highRisk: "उच्च जोखिम जांच",
    tbDots: "टीबी दवा जांच",
    postDischarge: "अस्पताल से छुट्टी के बाद",
    ncdMonitor: "बीपी/शुगर जांच",
    completed: "पूर्ण",
    weeks: "सप्ताह गर्भवती",
    village: "गांव",
    restore: "पूर्वावस्था",
  }
};

// ─── Type config: icon, color, label ──────────────────────────────────────
const TYPE_CONFIG = {
  anc:          { icon: Heart,        color: "rose",   bg: "bg-rose-50",   border: "border-rose-400",   text: "text-rose-700",   badge: "bg-rose-100 text-rose-800 border-rose-200" },
  vaccine:      { icon: Shield,       color: "violet", bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-700", badge: "bg-violet-100 text-violet-800 border-violet-200" },
  followup:     { icon: Activity,     color: "red",    bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    badge: "bg-red-100 text-red-800 border-red-200" },
  tb:           { icon: Stethoscope,  color: "amber",  bg: "bg-amber-50",  border: "border-amber-400",  text: "text-amber-700",  badge: "bg-amber-100 text-amber-800 border-amber-200" },
  postdischarge:{ icon: CalendarCheck,color: "blue",   bg: "bg-blue-50",   border: "border-blue-400",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-800 border-blue-200" },
  ncd:          { icon: Baby,         color: "orange", bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-700", badge: "bg-orange-100 text-orange-800 border-orange-200" },
};

// ─── Urgency band helper ───────────────────────────────────────────────────
function getUrgencyBand(item) {
  if (item.urgencyDays <= 0)  return "overdue";
  if (item.urgencyDays <= 1)  return "dueToday";
  return "upcoming";
}

// ─── Build follow-up list from patients array ──────────────────────────────
function buildFollowUpList(patients, t) {
  if (!patients || !patients.length) return [];
  const today = new Date();
  const items = [];

  patients.forEach(p => {
    const village = p.families?.village || p.village || "Shirwal";
    const mobile  = p.mobile || "";
    const lastVisitDays = p.last_visit_date
      ? Math.floor((today - new Date(p.last_visit_date)) / 86400000)
      : null;

    // ── ANC follow-up ──────────────────────────────────────────────────
    if (p.is_pregnant && p.lmp_date) {
      const weeks = Math.floor((today - new Date(p.lmp_date)) / (7 * 24 * 60 * 60 * 1000));
      const expectedAnc = weeks >= 36 ? 4 : weeks >= 28 ? 3 : weeks >= 16 ? 2 : 1;
      const doneAnc = p.anc_visits_done || 0;
      if (doneAnc < expectedAnc) {
        items.push({
          id: `anc-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          type: "anc",
          label: t.ancDue,
          detail: `ANC-${doneAnc + 1} • ${weeks} ${t.weeks}`,
          urgencyDays: weeks >= 36 ? -1 : weeks >= 28 ? 0 : 3,
        });
      }
    }

    // ── Vaccine follow-up ──────────────────────────────────────────────
    if (p.is_child) {
      const missing = ["bcg","opv","dpt","hep_b","measles","mr"].filter(v => !p[`vaccine_${v}`]);
      if (missing.length) {
        items.push({
          id: `vac-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          type: "vaccine",
          label: t.vaccineDue,
          detail: `${missing[0].toUpperCase()} · ${missing.length} pending`,
          urgencyDays: 1,
        });
      }
    }

    // ── High-risk / Red status ─────────────────────────────────────────
    if (p.status === "red") {
      const daysWithoutVisit = lastVisitDays !== null ? lastVisitDays : 10;
      if (daysWithoutVisit >= 7) {
        items.push({
          id: `hr-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          type: "followup",
          label: t.highRisk,
          detail: lastVisitDays !== null
            ? `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`
            : t.neverVisited,
          urgencyDays: daysWithoutVisit >= 14 ? -3 : 0,
        });
      }
    }

    // ── TB / DOTS check ────────────────────────────────────────────────
    if (p.tb_symptoms) {
      const daysWithoutVisit = lastVisitDays !== null ? lastVisitDays : 8;
      if (daysWithoutVisit >= 7) {
        items.push({
          id: `tb-${p.id}`,
          patientId: p.id,
          patientName: p.name,
          mobile,
          village,
          type: "tb",
          label: t.tbDots,
          detail: lastVisitDays !== null
            ? `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`
            : t.neverVisited,
          urgencyDays: 0,
        });
      }
    }

    // ── NCD (chronic BP/sugar) monthly check ───────────────────────────
    if (p.has_chronic && lastVisitDays !== null && lastVisitDays >= 28) {
      items.push({
        id: `ncd-${p.id}`,
        patientId: p.id,
        patientName: p.name,
        mobile,
        village,
        type: "ncd",
        label: t.ncdMonitor,
        detail: `${t.lastVisit}: ${lastVisitDays} ${t.daysAgo}`,
        urgencyDays: lastVisitDays >= 40 ? -2 : 1,
      });
    }
  });

  // Sort: overdue first → dueToday → upcoming
  items.sort((a, b) => a.urgencyDays - b.urgencyDays);
  return items;
}

// ─── Demo fallback if no real patient data yet ─────────────────────────────
function getDemoItems(t) {
  return [
    {
      id: "demo-1", patientId: "P002", patientName: "Rekha Bai",
      mobile: "+91 98451-88310", village: "Shirwal",
      type: "anc", label: t.ancDue,
      detail: `ANC-3 • 31 ${t.weeks}`,
      urgencyDays: -1,
    },
    {
      id: "demo-2", patientId: "P001", patientName: "Ramesh Patil",
      mobile: "+91 97123-45678", village: "Shirwal",
      type: "followup", label: t.highRisk,
      detail: `${t.lastVisit}: 10 ${t.daysAgo}`,
      urgencyDays: -3,
    },
    {
      id: "demo-3", patientId: "P003", patientName: "Savita Kamble",
      mobile: "+91 99005-12340", village: "Shirwal",
      type: "tb", label: t.tbDots,
      detail: `${t.lastVisit}: 8 ${t.daysAgo}`,
      urgencyDays: 0,
    },
    {
      id: "demo-4", patientId: "P005", patientName: "Sunita More",
      mobile: "+91 91234-56789", village: "Pargaon",
      type: "vaccine", label: t.vaccineDue,
      detail: "BCG · 3 pending",
      urgencyDays: 1,
    },
    {
      id: "demo-5", patientId: "P007", patientName: "Bhimrao Salve",
      mobile: "+91 94567-11223", village: "Shirwal",
      type: "ncd", label: t.ncdMonitor,
      detail: `${t.lastVisit}: 35 ${t.daysAgo}`,
      urgencyDays: -2,
    },
  ];
}

// ─── Urgency pill component ────────────────────────────────────────────────
function UrgencyPill({ band, t }) {
  if (band === "overdue")  return <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">🔴 {t.overdue}</span>;
  if (band === "dueToday") return <span className="text-[10px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">🟡 {t.dueToday}</span>;
  return <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">🟢 {t.upcoming}</span>;
}

// ─── Filter tabs ───────────────────────────────────────────────────────────
const FILTER_TABS = ["all", "overdue", "dueToday", "upcoming", "done"];

export default function FollowUpTracker({ patients, onLogVisit, onEditPatient }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = T[lang] || T.en;

  const [activeFilter, setActiveFilter] = useState("all");

  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const saved = localStorage.getItem("radvault_followup_done");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Build list from real data or demo
  const rawItems = useMemo(() => {
    const computed = buildFollowUpList(patients || [], t);
    return computed.length > 0 ? computed : getDemoItems(t);
  }, [patients, lang]);

  const allItems = rawItems;

  // Apply filter
  const visibleItems = useMemo(() => {
    if (activeFilter === "done") return allItems.filter(it => completedSet.has(it.id));
    const pending = allItems.filter(it => !completedSet.has(it.id));
    if (activeFilter === "all") return pending;
    return pending.filter(it => getUrgencyBand(it) === activeFilter);
  }, [allItems, activeFilter, completedSet]);

  const countByBand = useMemo(() => ({
    all:      allItems.filter(it => !completedSet.has(it.id)).length,
    overdue:  allItems.filter(it => !completedSet.has(it.id) && getUrgencyBand(it) === "overdue").length,
    dueToday: allItems.filter(it => !completedSet.has(it.id) && getUrgencyBand(it) === "dueToday").length,
    upcoming: allItems.filter(it => !completedSet.has(it.id) && getUrgencyBand(it) === "upcoming").length,
    done:     completedSet.size,
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

  const tabColors = {
    all:      "bg-slate-700 text-white",
    overdue:  "bg-red-600 text-white",
    dueToday: "bg-amber-500 text-white",
    upcoming: "bg-emerald-600 text-white",
    done:     "bg-slate-400 text-white",
  };
  const tabInactive = "bg-white text-slate-600 border border-slate-200 hover:border-slate-400";

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-24 font-sans text-slate-800">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-[#16324F] flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#008F83]" />
                {t.title}
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.subtitle}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {countByBand.overdue > 0 && (
                <span className="text-[11px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                  {countByBand.overdue} 🔴
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-500">{countByBand.all} pending</span>
            </div>
          </div>

          {/* ── Filter tabs ─────────────────────────────────────────── */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
            {FILTER_TABS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                  activeFilter === f ? tabColors[f] : tabInactive
                }`}
              >
                {f === "overdue"  && "🔴 "}
                {f === "dueToday" && "🟡 "}
                {f === "upcoming" && "🟢 "}
                {f === "done"     && "✅ "}
                {f === "all"      && "📋 "}
                {t[f]}
                {countByBand[f] > 0 && (
                  <span className={`ml-1 px-1.5 py-0 rounded-full text-[10px] font-black ${
                    activeFilter === f ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}>{countByBand[f]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 space-y-3 max-w-2xl mx-auto">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <CheckCircle2 className="w-14 h-14 text-[#008F83] mx-auto mb-3" />
            <p className="font-extrabold text-[#16324F] text-lg">{t.noItems}</p>
            <p className="text-sm text-slate-500 mt-1">{t.noItemsSub}</p>
          </div>
        ) : (
          visibleItems.map(item => {
            const cfg     = TYPE_CONFIG[item.type] || TYPE_CONFIG.followup;
            const TypeIcon = cfg.icon;
            const isDone  = completedSet.has(item.id);
            const band    = getUrgencyBand(item);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-l-4 ${cfg.border} border border-[#E2E8F0] p-4 sm:p-5 shadow-sm transition-all ${isDone ? "opacity-55 bg-slate-50" : ""}`}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${cfg.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + urgency pill */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-slate-900 text-base leading-tight">{item.patientName}</p>
                      {!isDone && <UrgencyPill band={band} t={t} />}
                      {isDone && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t.completed}
                        </span>
                      )}
                    </div>

                    {/* Type badge + detail */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{item.detail}</span>
                    </div>

                    {/* Village */}
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">📍 {item.village}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {!isDone ? (
                    <>
                      {/* Mark Done */}
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
                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {t.callPatient}
                        </a>
                      )}

                      {/* Log Visit / Refer */}
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
                        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 border border-blue-200 text-blue-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        {t.refer}
                      </button>
                    </>
                  ) : (
                    /* Restore option for done items */
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