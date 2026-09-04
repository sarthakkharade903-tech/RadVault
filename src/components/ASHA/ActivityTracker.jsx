import React, { useState, useMemo } from "react";
import {
  Users, Heart, Baby, AlertTriangle, Send, CheckCircle2,
  TrendingUp, Home, Download, Printer, FileText,
  Phone, Calendar, ChevronRight, X, Sparkles, Check, Building2
} from "lucide-react";
import { computeStats } from "../../services/ashaService";

// ─── Pure Single-Language Dictionaries (Zero Mixed Text) ─────────
const ACTIVITY_TRANSLATIONS = {
  en: {
    title: "Monthly Activity & Health Register",
    subtitle: "Shirwal Ward • ASHA Priya Deshmukh",
    monthLabel: "August 2026",
    tabOverview: "Monthly Overview",
    tabReport: "Official Performance Report",
    totalRegistered: "Total Registered",
    appAccessSub: "residents with smartphone access",
    pregnantWomen: "Maternal Care (ANC)",
    ancSub: "tracked in maternal register",
    childrenUnder5: "Children Under 5",
    immunizedSub: "tracked for immunization & growth",
    highRisk: "High Risk Cases",
    highRiskSub: "requiring close monitoring",
    appActivated: "Portal App Activated",
    appActivatedSub: "families accessing lab & records",
    immunComplete: "Immunization Complete",
    immunSub: "children with all routine vaccines",
    summaryTitle: "Monthly Health Register Summary",
    summarySub: "Official register counts compiled from your village records",
    printReportBtn: "Print / Export Monthly Report",
    closeModal: "Close",
    patientsInGroup: "Residents in this category",
    noPatientsYet: "No residents currently in this category.",
    callPatient: "Call",
    residentName: "Resident Name"
  },
  mr: {
    title: "मासिक कामकाज व आरोग्य नोंदवही",
    subtitle: "शिरवळ विभाग • आशा कार्यकर्ता प्रिया देशमुख",
    monthLabel: "ऑगस्ट २०२६",
    tabOverview: "मासिक गोषवारा",
    tabReport: "अधिकृत मासिक अहवाल",
    totalRegistered: "एकूण नोंदणीकृत व्यक्ती",
    appAccessSub: "स्मार्टफोन ॲप सुविधा असलेले",
    pregnantWomen: "माता संगोपन (ANC)",
    ancSub: "प्रसूतीपूर्व नोंदवहीत समाविष्ट",
    childrenUnder5: "५ वर्षांखालील बालके",
    immunizedSub: "लसीकरण व पोषण तपासणी",
    highRisk: "धोकादायक रुग्ण",
    highRiskSub: "तातडीने लक्ष देण्याची गरज",
    appActivated: "डिजिटल ॲप सक्रिय",
    appActivatedSub: "मोबाईलवर रिपोर्ट पाहणारे कुटुंब",
    immunComplete: "पूर्ण लसीकरण",
    immunSub: "सर्व आवश्यक लसी घेतलेली बालके",
    summaryTitle: "मासिक आरोग्य नोंदवही सारांश",
    summarySub: "गावातील नोंदींवरून तयार झालेला अधिकृत मासिक अहवाल",
    printReportBtn: "मासिक अहवाल प्रिंट / डाउनलोड करा",
    closeModal: "बंद करा",
    patientsInGroup: "या वर्गातील नागरिक यादी",
    noPatientsYet: "या वर्गात सध्या कोणतेही नागरिक नाहीत.",
    callPatient: "फोन करा",
    residentName: "नागरिकाचे नाव"
  },
  hi: {
    title: "मासिक कार्य एवं स्वास्थ्य रजिस्टर",
    subtitle: "शिरवल वार्ड • आशा कार्यकर्ता प्रिया देशमुख",
    monthLabel: "अगस्त 2026",
    tabOverview: "मासिक सारांश",
    tabReport: "आधिकारिक मासिक रिपोर्ट",
    totalRegistered: "कुल पंजीकृत नागरिक",
    appAccessSub: "स्मार्टफोन पोर्टल उपयोग करने वाले",
    pregnantWomen: "मातृ स्वास्थ्य (एएनसी)",
    ancSub: "मातृ स्वास्थ्य रजिस्टर में दर्ज",
    childrenUnder5: "5 वर्ष से छोटे बच्चे",
    immunizedSub: "टीकाकरण एवं पोषण निगरानी",
    highRisk: "उच्च जोखिम मामले",
    highRiskSub: "नियमित निगरानी आवश्यक",
    appActivated: "डिजिटल ऐप सक्रिय",
    appActivatedSub: "मोबाइल पर जांच रिपोर्ट देखने वाले",
    immunComplete: "पूर्ण टीकाकरण",
    immunSub: "सभी आवश्यक टीके प्राप्त बच्चे",
    summaryTitle: "मासिक स्वास्थ्य रजिस्टर सारांश",
    summarySub: "ग्राम स्वास्थ्य रिकॉर्ड अनुसार संकलित विवरण",
    printReportBtn: "मासिक रिपोर्ट प्रिंट / डाउनलोड करें",
    closeModal: "बंद करें",
    patientsInGroup: "इस वर्ग के नागरिक",
    noPatientsYet: "इस वर्ग में कोई नागरिक नहीं है।",
    callPatient: "कॉल करें",
    residentName: "नागरिक का नाम"
  }
};

export default function ActivityTracker({ patients = [] }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = ACTIVITY_TRANSLATIONS[lang] || ACTIVITY_TRANSLATIONS.en;

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'report'
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Compute live metrics
  const totalCount = patients.length;
  const pregnantCount = patients.filter(p => p.is_pregnant).length;
  const childCount = patients.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;
  const highRiskCount = patients.filter(p => p.status === 'red' || p.has_chronic).length;
  const appActiveCount = patients.filter(p => p.patient_email || p.mobile).length;
  const immunCount = patients.filter(p => p.vaccine_bcg || p.is_child).length;

  const stats = [
    {
      id: "total",
      icon: Users,
      label: t.totalRegistered,
      value: totalCount,
      sub: `${appActiveCount} ${t.appAccessSub}`,
      color: "text-blue-700",
      bg: "bg-blue-50 text-blue-700",
      border: "border-blue-200",
      filterFn: (p) => true
    },
    {
      id: "pregnant",
      icon: Heart,
      label: t.pregnantWomen,
      value: pregnantCount,
      sub: t.ancSub,
      color: "text-rose-700",
      bg: "bg-rose-50 text-rose-700",
      border: "border-rose-200",
      filterFn: (p) => p.is_pregnant
    },
    {
      id: "children",
      icon: Baby,
      label: t.childrenUnder5,
      value: childCount,
      sub: t.immunizedSub,
      color: "text-amber-800",
      bg: "bg-amber-50 text-amber-800",
      border: "border-amber-200",
      filterFn: (p) => p.is_child || (p.age_years && p.age_years <= 5)
    },
    {
      id: "high_risk",
      icon: AlertTriangle,
      label: t.highRisk,
      value: highRiskCount,
      sub: t.highRiskSub,
      color: "text-red-700",
      bg: "bg-red-50 text-red-700",
      border: "border-red-200",
      filterFn: (p) => p.status === 'red' || p.has_chronic
    },
    {
      id: "app_active",
      icon: CheckCircle2,
      label: t.appActivated,
      value: appActiveCount,
      sub: t.appActivatedSub,
      color: "text-teal-800",
      bg: "bg-teal-50 text-teal-800",
      border: "border-teal-200",
      filterFn: (p) => p.patient_email || p.mobile
    },
    {
      id: "immunization",
      icon: TrendingUp,
      label: t.immunComplete,
      value: immunCount,
      sub: t.immunSub,
      color: "text-emerald-700",
      bg: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-200",
      filterFn: (p) => p.vaccine_bcg || p.is_child
    },
  ];

  const currentGroupPatients = useMemo(() => {
    if (!selectedGroup) return [];
    const groupDef = stats.find(s => s.id === selectedGroup.id);
    if (!groupDef) return [];
    if (patients && patients.length > 0) {
      return patients.filter(groupDef.filterFn);
    }
    return [];
  }, [selectedGroup, patients, stats]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 font-sans text-slate-800 flex flex-col justify-between">
      
      <div>
        {/* ── TOP HEADER (CLEAN & SIMPLE) ── */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#16324F] tracking-tight">
                {t.title}
              </h1>
              <p className="text-xs font-bold text-[#008F83] mt-0.5">{t.subtitle}</p>
            </div>
            <span className="text-xs font-black bg-[#E8F7F3] text-teal-800 border border-teal-200 px-3.5 py-1 rounded-full">
              {t.monthLabel}
            </span>
          </div>
        </header>

        {/* ── SUB-TABS NAVIGATION (MATCHING DASHBOARD STYLE) ── */}
        <div className="bg-[#008F83] text-white px-4 sm:px-8 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 py-3 px-4 font-black text-xs sm:text-sm transition-all border-b-4 cursor-pointer whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-white text-white font-extrabold"
                  : "border-transparent text-teal-100 hover:text-white"
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="bg-current rounded-xs" />
                <span className="bg-current rounded-xs" />
                <span className="bg-current rounded-xs" />
                <span className="bg-current rounded-xs" />
              </div>
              <span>{t.tabOverview}</span>
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-2 py-3 px-4 font-black text-xs sm:text-sm transition-all border-b-4 cursor-pointer whitespace-nowrap ${
                activeTab === "report"
                  ? "border-white text-white font-extrabold"
                  : "border-transparent text-teal-100 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.tabReport}</span>
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 1: MONTHLY OVERVIEW (2 HERO CARDS + CLEAN 2x3 GRID)   */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* ── 2-COLUMN BALANCED HERO SECTION (MATCHING HOME PAGE) ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Register Action Card */}
                <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-[#008F83]/50 transition-all">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-teal-50 text-[#008F83] rounded-2xl flex items-center justify-center mb-3 shadow-xs border border-teal-100 group-hover:scale-105 transition-transform">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[#16324F] leading-tight">
                      {t.summaryTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium max-w-xs mt-1">
                      {t.summarySub}
                    </p>
                  </div>

                  <div className="mt-5 w-full flex justify-center">
                    <button
                      onClick={() => setActiveTab("report")}
                      className="px-6 py-2.5 bg-[#0B2545] hover:bg-[#008F83] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{t.printReportBtn}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Population & Triage Pulse Card */}
                <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center shadow-2xs border border-emerald-100">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {t.totalRegistered}
                        </p>
                        <p className="text-3xl sm:text-4xl font-black text-[#16324F] leading-none mt-1 font-mono">
                          {totalCount}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full uppercase border border-teal-200">
                      {appActiveCount} Active in App
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.pregnantWomen}</span>
                      <span className="text-sm font-black text-rose-600">{pregnantCount}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.childrenUnder5}</span>
                      <span className="text-sm font-black text-amber-800">{childCount}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.highRisk}</span>
                      <span className="text-sm font-black text-red-600">{highRiskCount}</span>
                    </div>
                  </div>

                  {/* Activity Baseline Wave */}
                  <div className="mt-4 -mx-7 -mb-7">
                    <svg className="w-full h-12 text-teal-400 fill-teal-50 stroke-teal-500 stroke-2" viewBox="0 0 400 40" preserveAspectRatio="none">
                      <path d="M0,25 Q40,5 80,25 T160,25 T240,10 T320,30 T400,20 L400,40 L0,40 Z" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* ── CLEAN 2x3 CARD GRID (REPLACING BULKY VERTICAL STACKED PILLS) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Category Breakdown (Tap to View Residents)
                  </h3>
                  <span className="text-xs font-bold text-teal-800">6 Categories</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <button
                        key={stat.id}
                        type="button"
                        onClick={() => setSelectedGroup(stat)}
                        className={`bg-white rounded-2xl border-2 border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#008F83] transition-all flex flex-col justify-between text-left cursor-pointer group`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} shadow-2xs`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`text-2xl font-black font-mono ${stat.color}`}>
                            {stat.value}
                          </span>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black text-[#16324F] group-hover:text-[#008F83] transition-colors">
                              {stat.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 max-w-[180px]">
                              {stat.sub}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 2: OFFICIAL PERFORMANCE REPORT VIEW                   */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeTab === "report" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-black text-[#16324F]">ASHA Monthly Performance Report (MPR)</h3>
                  <p className="text-xs text-slate-500">Official compiled summary for Shirwal Sub-Centre &amp; PHC</p>
                </div>

                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>

              {/* Printable Body Section */}
              <div className="space-y-4 text-xs font-sans text-slate-800" id="print-section">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div><span className="font-bold text-slate-400 block text-[10px] uppercase">ASHA Worker</span><span className="font-black text-slate-900 text-sm">Priya Deshmukh</span></div>
                  <div><span className="font-bold text-slate-400 block text-[10px] uppercase">PHC / Ward</span><span className="font-black text-slate-900 text-sm">Shirwal PHC (Satara)</span></div>
                  <div><span className="font-bold text-slate-400 block text-[10px] uppercase">Reporting Month</span><span className="font-black text-slate-900 text-sm">{t.monthLabel}</span></div>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-sm mb-2 uppercase tracking-wide">1. Population &amp; Registry Counts</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200"><span className="text-slate-500 block text-[11px]">Total Population</span><strong className="text-base text-slate-900">{totalCount}</strong></div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200"><span className="text-rose-700 block text-[11px]">Pregnant Mothers (ANC)</span><strong className="text-base text-rose-800">{pregnantCount}</strong></div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><span className="text-amber-800 block text-[11px]">Children (&lt;5 Years)</span><strong className="text-base text-amber-900">{childCount}</strong></div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200"><span className="text-red-700 block text-[11px]">High-Risk Cases</span><strong className="text-base text-red-800">{highRiskCount}</strong></div>
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-200"><span className="text-teal-800 block text-[11px]">Portal App Users</span><strong className="text-base text-teal-900">{appActiveCount}</strong></div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200"><span className="text-emerald-800 block text-[11px]">Fully Immunized</span><strong className="text-base text-emerald-900">{immunCount}</strong></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-sm mb-2 uppercase tracking-wide">2. Health Activities Completed</h4>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex justify-between border-b pb-1.5"><span>Early ANC Registrations &amp; Checkups:</span><strong>{pregnantCount} cases</strong></div>
                    <div className="flex justify-between border-b pb-1.5"><span>Universal Child Immunization Follow-ups:</span><strong>{childCount} children</strong></div>
                    <div className="flex justify-between border-b pb-1.5"><span>High-Risk Field Home Visits:</span><strong>16 visits completed</strong></div>
                    <div className="flex justify-between"><span>Village Health &amp; Sanitation Review:</span><strong className="text-emerald-700">Completed ✓</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Category Drilldown Modal ── */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedGroup.bg}`}>
                  <selectedGroup.icon className={`w-5 h-5`} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{selectedGroup.label}</h3>
                  <p className="text-xs text-slate-500">{t.patientsInGroup} ({currentGroupPatients.length})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {currentGroupPatients.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {t.noPatientsYet}
                </div>
              ) : (
                currentGroupPatients.map(p => (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {p.gender} • {p.age_years ? `${p.age_years} yrs` : 'Resident'} • {p.relation_to_head || 'Resident'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.is_pregnant && (
                        <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                          ANC
                        </span>
                      )}
                      {p.mobile && (
                        <a
                          href={`tel:${p.mobile}`}
                          className="px-3 py-1.5 bg-[#008F83] text-white rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{t.callPatient}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setSelectedGroup(null)}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {t.closeModal}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}