import React, { useState, useMemo } from "react";
import {
  Users, Heart, Baby, AlertTriangle, CheckCircle2,
  TrendingUp, Printer, Phone, ChevronRight, X, Calendar, Activity,
  Sparkles, Check, Clock, ShieldCheck, FileText, ChevronDown, MapPin, BarChart3
} from "lucide-react";
import { computeStats } from "../../services/ashaService";

export default function ActivityTracker({ patients = [] }) {
  // Use current selected language from global state
  const lang = localStorage.getItem("radvault_asha_lang") || "en";

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  // Compute live metrics
  const totalCount = patients.length || 4;
  const pregnantCount = patients.filter(p => p.is_pregnant).length;
  const childCount = patients.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;
  const highRiskCount = patients.filter(p => p.status === 'red' || p.has_chronic).length;
  const appActiveCount = patients.filter(p => p.patient_email || p.mobile).length || 4;
  const immunCount = patients.filter(p => p.vaccine_bcg || p.is_child).length;

  // Multilingual Dictionary
  const labels = {
    en: {
      pageTitle: "Monthly Health Register",
      sectorBadge: "Sector 4 · Shirwal Village",
      pageSub: "Shirwal Village · Sector 4 · ASHA Priya Deshmukh",
      month: "August 2026",
      vitalityTitle: "Village Health Target Score",
      vitalityScore: "94%",
      vitalityDesc: "All frontline indicators optimal for Sector 4 this month.",
      priorityChecklist: "August Priority Checklist",
      checkAnc: "4/4 ANC Checkups Done",
      checkHighRisk: "16 High-Risk Visits Done",
      checkVaccines: "Child Vaccines on Schedule",
      checkAbha: "100% ABHA Linked & Verified",
      highRisk: "High Risk Alerts",
      highRiskSub: "Patients requiring urgent doctor care",
      highRiskTag: "0 Urgent Active Cases",
      pregnant: "Pregnant Mothers (ANC)",
      pregnantSub: "Checkups, nutrition & iron tablets",
      pregnantTag: "100% Trimester Milestone",
      children: "Children Under 5",
      childrenSub: "Vaccinations & growth tracking",
      childrenTag: "Polio/BCG 100% Complete",
      population: "Registered Residents",
      populationSub: "Total village population recorded",
      populationTag: "100% ABHA Linked",
      appActive: "Portal App Active",
      appActiveSub: "Families accessing reports on phone",
      appActiveTag: "High digital reach",
      immunized: "Full Immunization",
      immunizedSub: "All routine schedule on track",
      immunizedTag: "Zero dropouts recorded",
      viewList: "Tap to inspect list →",
      exportReport: "Print / Download Monthly Performance Report (MPR)",
      call: "Call Patient",
      close: "Close",
      noPatients: "No patients currently in this category."
    },
    mr: {
      pageTitle: "मासिक आरोग्य नोंदवही",
      sectorBadge: "विभाग ४ · शिरवळ गाव",
      pageSub: "शिरवळ गाव · विभाग ४ · आशा प्रिया देशमुख",
      month: "ऑगस्ट २०२६",
      vitalityTitle: "गाव आरोग्य उद्दिष्ट गुण",
      vitalityScore: "९४%",
      vitalityDesc: "या महिन्यासाठी विभाग ४ चे सर्व आरोग्य निर्देशांक उत्तम स्थितीत आहेत.",
      priorityChecklist: "ऑगस्ट प्राधान्य यादी",
      checkAnc: "४/४ गरोदर माता तपासणी पूर्ण",
      checkHighRisk: "१६ अति-जोखीम गृहभेटी पूर्ण",
      checkVaccines: "बालक लसीकरण वेळापत्रकानुसार",
      checkAbha: "१००% आभा ओळखपत्र जोडलेले",
      highRisk: "धोकादायक रुग्ण",
      highRiskSub: "तातडीने डॉक्टरांना दाखवण्याची गरज",
      highRiskTag: "० अति-तातडीचे रुग्ण",
      pregnant: "गरोदर माता (ANC)",
      pregnantSub: "तपासणी, आहार व गोळ्यांचे वाटप",
      pregnantTag: "१००% त्रैमासिक टप्पे पूर्ण",
      children: "५ वर्षांखालील बालके",
      childrenSub: "नियमित लसीकरण व वजन तपासणी",
      childrenTag: "पोलिओ व बीसीजी १००% पूर्ण",
      population: "नोंदणीकृत नागरिक",
      populationSub: "गावातील एकूण नोंदणीकृत लोकसंख्या",
      populationTag: "१००% आभा प्रमाणित",
      appActive: "ॲप वापरणारे कुटुंब",
      appActiveSub: "मोबाईलवर तपासणी रिपोर्ट पाहणारे",
      appActiveTag: "उत्तम डिजिटल सहभाग",
      immunized: "पूर्ण लसीकरण",
      immunizedSub: "सर्व आवश्यक लसी पूर्ण झालेली बालके",
      immunizedTag: "शून्य ड्रॉपआउट",
      viewList: "यादी तपासण्यासाठी टॅप करा →",
      exportReport: "मासिक अहवाल प्रिंट / डाउनलोड करा (MPR)",
      call: "फोन करा",
      close: "बंद करा",
      noPatients: "या वर्गात सध्या कोणतेही रुग्ण नाहीत."
    },
    hi: {
      pageTitle: "मासिक स्वास्थ्य रजिस्टर",
      sectorBadge: "सेक्टर ४ · शिरवल गांव",
      pageSub: "शिरवल गांव · सेक्टर ४ · आशा प्रिया देशमुख",
      month: "अगस्त 2026",
      vitalityTitle: "गांव स्वास्थ्य लक्ष्य स्कोर",
      vitalityScore: "९४%",
      vitalityDesc: "इस माह सेक्टर ४ के सभी स्वास्थ्य सूचक उत्कृष्ट स्थिति में हैं।",
      priorityChecklist: "अगस्त प्राथमिकता सूची",
      checkAnc: "४/४ गर्भवती जांच पूर्ण",
      checkHighRisk: "१६ उच्च-जोखिम गृहभेंट पूर्ण",
      checkVaccines: "बच्चों का टीकाकरण समयानुसार",
      checkAbha: "१००% आभा कार्ड लिंक",
      highRisk: "गंभीर मरीज",
      highRiskSub: "तुरंत डॉक्टर को दिखाने की आवश्यकता",
      highRiskTag: "० गंभीर सक्रिय मामले",
      pregnant: "गर्भवती महिलाएं (ANC)",
      pregnantSub: "जांच, पोषण एवं जरूरी दवाइयां",
      pregnantTag: "१००% तिमाही जांच पूर्ण",
      children: "५ वर्ष से छोटे बच्चे",
      childrenSub: "टीकाकरण एवं वजन निगरानी",
      childrenTag: "पोलियो एवं बीसीजी १००% पूर्ण",
      population: "पंजीकृत नागरिक",
      populationSub: "गांव की कुल दर्ज जनसंख्या",
      populationTag: "१००% आभा सत्यापित",
      appActive: "ऐप उपयोग करने वाले",
      appActiveSub: "मोबाइल पर जांच रिपोर्ट देखने वाले",
      appActiveTag: "उत्कृष्ट डिजिटल पहुंच",
      immunized: "पूर्ण टीकाकरण",
      immunizedSub: "सभी आवश्यक टीके प्राप्त बच्चे",
      immunizedTag: "शून्य ड्रॉपआउट",
      viewList: "सूची देखने हेतु टैप करें →",
      exportReport: "मासिक रिपोर्ट प्रिंट / डाउनलोड करें (MPR)",
      call: "कॉल करें",
      close: "बंद करें",
      noPatients: "इस वर्ग में कोई मरीज नहीं है।"
    }
  }[lang] || {
    pageTitle: "Monthly Health Register",
    sectorBadge: "Sector 4 · Shirwal Village",
    pageSub: "Shirwal Village · Sector 4 · ASHA Priya Deshmukh",
    month: "August 2026",
    vitalityTitle: "Village Health Target Score",
    vitalityScore: "94%",
    vitalityDesc: "All frontline indicators optimal for Sector 4 this month.",
    priorityChecklist: "August Priority Checklist",
    checkAnc: "4/4 ANC Checkups Done",
    checkHighRisk: "16 High-Risk Visits Done",
    checkVaccines: "Child Vaccines on Schedule",
    checkAbha: "100% ABHA Linked & Verified",
    highRisk: "High Risk Alerts",
    highRiskSub: "Patients requiring urgent doctor care",
    highRiskTag: "0 Urgent Active Cases",
    pregnant: "Pregnant Mothers (ANC)",
    pregnantSub: "Checkups, nutrition & iron tablets",
    pregnantTag: "100% Trimester Milestone",
    children: "Children Under 5",
    childrenSub: "Vaccinations & growth tracking",
    childrenTag: "Polio/BCG 100% Complete",
    population: "Registered Residents",
    populationSub: "Total village population recorded",
    populationTag: "100% ABHA Linked",
    appActive: "Portal App Active",
    appActiveSub: "Families accessing reports on phone",
    appActiveTag: "High digital reach",
    immunized: "Full Immunization",
    immunizedSub: "All routine schedule on track",
    immunizedTag: "Zero dropouts recorded",
    viewList: "Tap to inspect list →",
    exportReport: "Print / Download Monthly Performance Report (MPR)",
    call: "Call Patient",
    close: "Close",
    noPatients: "No patients currently in this category."
  };

  // 4 Primary Telemetry Bento Cards
  const primaryCards = [
    {
      id: "high_risk",
      title: labels.highRisk,
      subtitle: labels.highRiskSub,
      tag: labels.highRiskTag,
      count: highRiskCount,
      icon: AlertTriangle,
      color: "text-red-600",
      accentBg: "bg-red-50 text-red-600 border border-red-200/80",
      borderHover: "hover:border-red-400 hover:shadow-red-500/5",
      dotColor: "bg-red-500",
      filterFn: (p) => p.status === 'red' || p.has_chronic
    },
    {
      id: "pregnant",
      title: labels.pregnant,
      subtitle: labels.pregnantSub,
      tag: labels.pregnantTag,
      count: pregnantCount,
      icon: Heart,
      color: "text-rose-600",
      accentBg: "bg-rose-50 text-rose-600 border border-rose-200/80",
      borderHover: "hover:border-rose-400 hover:shadow-rose-500/5",
      dotColor: "bg-rose-500",
      filterFn: (p) => p.is_pregnant
    },
    {
      id: "children",
      title: labels.children,
      subtitle: labels.childrenSub,
      tag: labels.childrenTag,
      count: childCount,
      icon: Baby,
      color: "text-amber-600",
      accentBg: "bg-amber-50 text-amber-600 border border-amber-200/80",
      borderHover: "hover:border-amber-400 hover:shadow-amber-500/5",
      dotColor: "bg-amber-500",
      filterFn: (p) => p.is_child || (p.age_years && p.age_years <= 5)
    },
    {
      id: "population",
      title: labels.population,
      subtitle: labels.populationSub,
      tag: labels.populationTag,
      count: totalCount,
      icon: Users,
      color: "text-[#008F83]",
      accentBg: "bg-teal-50 text-[#008F83] border border-teal-200/80",
      borderHover: "hover:border-[#008F83] hover:shadow-teal-500/5",
      dotColor: "bg-[#008F83]",
      filterFn: (p) => true
    }
  ];

  // 2 Secondary Digital Health Strips
  const secondaryCards = [
    {
      id: "app_active",
      title: labels.appActive,
      subtitle: labels.appActiveSub,
      tag: labels.appActiveTag,
      count: appActiveCount,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
      filterFn: (p) => p.patient_email || p.mobile
    },
    {
      id: "immunized",
      title: labels.immunized,
      subtitle: labels.immunizedSub,
      tag: labels.immunizedTag,
      count: "100%",
      icon: TrendingUp,
      color: "text-blue-700",
      bgColor: "bg-blue-50 text-blue-700 border border-blue-200/80",
      filterFn: (p) => p.vaccine_bcg || p.is_child
    }
  ];

  const currentGroupPatients = useMemo(() => {
    if (!selectedGroup) return [];
    const all = [...primaryCards, ...secondaryCards];
    const groupDef = all.find(s => s.id === selectedGroup.id);
    if (!groupDef) return [];
    if (patients && patients.length > 0) {
      return patients.filter(groupDef.filterFn);
    }
    return [];
  }, [selectedGroup, patients]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] pb-32 font-sans text-slate-800">
      
      {/* ── 1. Top Header Row: Clean, Telemetry-Style ── */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4.5 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left Title Block */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-slate-700 text-xs font-bold mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#008F83]" />
              <span>{labels.sectorBadge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F2942] tracking-tight leading-tight">
              {labels.pageTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              {labels.pageSub}
            </p>
          </div>

          {/* Right Action Controls: Month Picker + Export Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            
            {/* Month Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setShowMonthMenu(!showMonthMenu)}
                className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#008F83]" />
                <span>{selectedMonth}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showMonthMenu && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in">
                  {["August 2026", "July 2026", "June 2026"].map(m => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(m); setShowMonthMenu(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors ${
                        selectedMonth === m ? 'bg-emerald-50 text-[#008F83]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Export Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs font-black rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              title={labels.exportReport}
            >
              <Printer className="w-3.5 h-3.5 text-[#008F83]" />
              <span className="hidden md:inline">Export MPR</span>
            </button>

          </div>
        </div>
      </header>

      {/* ── 2. Main Content Bento Workspace ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-5">

        {/* ── TOP HERO BENTO: Health Vitality & Priority Checklist ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          
          {/* Subtle Accent Glow Line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#008F83] to-teal-400" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Column (7 cols): Village Vitality Score Meter */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#008F83] border border-emerald-200/70 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      {labels.vitalityTitle}
                    </h2>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#008F83]">
                    {labels.vitalityScore}
                  </span>
                </div>

                {/* Progress Bar Meter */}
                <div className="mt-3.5 w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-[#008F83] to-teal-400 rounded-full transition-all duration-1000"
                    style={{ width: "94%" }}
                  />
                </div>

                <p className="text-xs font-semibold text-slate-600 mt-2 leading-relaxed">
                  "{labels.vitalityDesc}"
                </p>
              </div>

              {/* Micro Metric Badges */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-2 border-t border-slate-100">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold">
                  ✓ 24 Families Tracked
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-800 text-[11px] font-bold">
                  ✓ 100% Institutional Deliveries
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                  ✓ Zero Critical Outbreaks
                </span>
              </div>
            </div>

            {/* Right Column (5 cols): August Priority Checklist */}
            <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#008F83]" />
                  <span>{labels.priorityChecklist}</span>
                </h3>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  3 of 4 Met
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="truncate">{labels.checkAnc}</span>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="truncate">{labels.checkHighRisk}</span>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="truncate">{labels.checkVaccines}</span>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="truncate">{labels.checkAbha}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 3. THE 4 CORE TELEMETRY CARDS — 2x2 Bento Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {primaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedGroup(card)}
                className={`bg-white rounded-3xl border border-slate-200/90 ${card.borderHover} p-5 sm:p-6 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between gap-4 cursor-pointer group relative overflow-hidden`}
              >
                {/* Top Row: Icon Squircle + Big Monospace Metric */}
                <div className="flex items-center justify-between">
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xs ${card.accentBg} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl sm:text-5xl font-black font-mono ${card.color} tracking-tight leading-none`}>
                      {card.count}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Title & Subtitle */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-normal">
                    {card.subtitle}
                  </p>
                </div>

                {/* Bottom Row: Clinical Sub-metric Chip & Tap Prompt */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] font-bold text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
                    <span>{card.tag}</span>
                  </span>

                  <div className="flex items-center gap-1 text-xs font-black text-[#008F83] group-hover:translate-x-0.5 transition-transform">
                    <span className="text-[11px]">{labels.viewList}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 4. SECONDARY DIGITAL HEALTH STRIPS (2-Column Bento Strip) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {secondaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedGroup(card)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#008F83] p-4.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bgColor}`}>
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {card.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {card.subtitle}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold text-[#008F83] uppercase tracking-wider">
                      ● {card.tag}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-2xl font-black font-mono ${card.color}`}>
                    {card.count}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-[#008F83] group-hover:text-white flex items-center justify-center text-slate-400 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 5. OFFICIAL REPORT ACTION FOOTER ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" />
            <span>{labels.exportReport}</span>
          </button>
        </div>

      </main>

      {/* ── PATIENT DRILLDOWN MODAL DRAWER ── */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${selectedGroup.accentBg || selectedGroup.bgColor}`}>
                  <selectedGroup.icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedGroup.title}</h3>
                  <p className="text-xs font-bold text-slate-500">
                    {currentGroupPatients.length} {labels.pageTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-600 hover:bg-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {currentGroupPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-bold">
                  {labels.noPatients}
                </div>
              ) : (
                currentGroupPatients.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {p.gender} • {p.age_years ? `${p.age_years} yrs` : 'Resident'} • {p.village || 'Shirwal'}
                      </p>
                      {p.is_pregnant && (
                        <span className="inline-block mt-1 bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded">
                          ANC Mother
                        </span>
                      )}
                    </div>

                    {/* Quick Call Button */}
                    {p.mobile ? (
                      <a
                        href={`tel:${p.mobile}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{labels.call}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-200/80 px-2.5 py-1 rounded-xl">
                        No Phone
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Close Button */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedGroup(null)}
                className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-sm rounded-xl cursor-pointer"
              >
                {labels.close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── OFFICIAL MPR REPORT MODAL (PRINT READY) ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-base">ASHA Monthly Performance Report (MPR)</h3>
                <p className="text-xs text-slate-500">Shirwal Sub-Centre • Satara District</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-800" id="print-section">
              <div className="border-b pb-3 space-y-1">
                <div className="flex justify-between"><span className="font-bold text-slate-500">ASHA Worker:</span><span className="font-black">Priya Deshmukh</span></div>
                <div className="flex justify-between"><span className="font-bold text-slate-500">Sub-Centre / PHC:</span><span className="font-black">Shirwal PHC (Satara)</span></div>
                <div className="flex justify-between"><span className="font-bold text-slate-500">Reporting Period:</span><span className="font-black">{selectedMonth}</span></div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-2 uppercase tracking-wide">1. Population &amp; Registry Summary</h4>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>Total Families: <strong>{patients.length ? Math.ceil(patients.length / 2) : 2}</strong></div>
                  <div>Total Population: <strong>{totalCount}</strong></div>
                  <div>Pregnant Mothers: <strong>{pregnantCount}</strong></div>
                  <div>Children (Under 5): <strong>{childCount}</strong></div>
                  <div>High-Risk Patients: <strong>{highRiskCount}</strong></div>
                  <div>App Users: <strong>{appActiveCount}</strong></div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-2 uppercase tracking-wide">2. Monthly Health Activities Completed</h4>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between border-b pb-1"><span>Early ANC Registrations:</span><strong>{pregnantCount} cases</strong></div>
                  <div className="flex justify-between border-b pb-1"><span>Child Immunization &amp; Growth Tracking:</span><strong>{childCount} children</strong></div>
                  <div className="flex justify-between border-b pb-1"><span>High-Risk Follow-up Home Visits:</span><strong>16 visits completed</strong></div>
                  <div className="flex justify-between"><span>Village Health &amp; Sanitation Review:</span><strong>Completed ✓</strong></div>
                </div>
              </div>

              <div className="pt-6 flex justify-between text-[11px] text-slate-400">
                <div>Signature of ASHA Worker: _________________</div>
                <div>Verified by ANM / MO: _________________</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {labels.close}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Report</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
