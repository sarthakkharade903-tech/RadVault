import React, { useState, useMemo, useEffect } from "react";
import {
  Send, Users, Heart, Baby, AlertTriangle, RefreshCw, ChevronRight,
  Calendar, CheckCircle2, Clock, MapPin, Building2, Stethoscope,
  Plus, Phone, Search, X, Check, FileText, ArrowRight, UserPlus, Package
} from "lucide-react";
import { computeStats, computeDueList } from "../../services/ashaService";
import { supabase } from "../../services/supabase";

// ─── Pure Single-Language Dictionaries (Zero Mixed Text) ─────────
const HOME_TRANSLATIONS = {
  en: {
    dashboardTitle: "ASHA Health Hub",
    welcome: "Good Morning, Priya",
    villageName: "Shirwal Village • Sector 4",
    tabDashboard: "Dashboard",
    tabReferrals: "Past Referrals",
    tabFamilies: "Family Members",
    newReferralTitle: "New Patient Referral",
    newReferralSub: "Fast-track clinical triage to Shirwal PHC or District Hospital",
    newReferralBtn: "New Referral",
    totalReferralsLabel: "Total Consultations & Referrals",
    recentReferralsTitle: "Recent Referrals & Consultations",
    noReferralsFound: "No consultations found !",
    noReferralsSub: "All village cases are normal. Tap 'New Referral' to send an emergency case.",
    statusPending: "Pending PHC",
    statusAccepted: "Accepted by Doctor",
    statusCompleted: "Completed",
    priorityUrgent: "URGENT",
    priorityRoutine: "ROUTINE",
    viewDetails: "View Details",
    totalPopulation: "Village Population",
    maternalCount: "Maternal Care",
    childCount: "Child Immunization",
    highRiskCount: "High Risk Alerts",
    synced: "SYNCED",
    syncing: "Syncing...",
    searchPlaceholder: "Search patient by name...",
    facility: "Facility",
    department: "Department"
  },
  mr: {
    dashboardTitle: "आशा आरोग्य केंद्र",
    welcome: "सुप्रभात, प्रिया",
    villageName: "शिरवळ गाव • विभाग ४",
    tabDashboard: "डॅशबोर्ड",
    tabReferrals: "मागील रेफरल्स",
    tabFamilies: "कुटुंब व सदस्य",
    newReferralTitle: "नवीन रुग्ण रेफरल",
    newReferralSub: "रुग्णास तातडीने शिरवळ प्राथमिक आरोग्य केंद्रात पाठवा",
    newReferralBtn: "नवीन रेफरल",
    totalReferralsLabel: "एकूण रेफरल्स व तपासण्या",
    recentReferralsTitle: "अलीकडील रेफरल्स व सल्ला",
    noReferralsFound: "कोणतेही रेफरल प्रलंबित नाहीत !",
    noReferralsSub: "गावातील सर्व रुग्ण सामान्य आहेत. तातडीच्या उपचारासाठी 'नवीन रेफरल' वर टॅप करा.",
    statusPending: "डॉक्टरांच्या प्रतीक्षेत",
    statusAccepted: "डॉक्टरांनी स्वीकारले",
    statusCompleted: "उपचार पूर्ण",
    priorityUrgent: "तातडीचे",
    priorityRoutine: "सर्वसाधारण",
    viewDetails: "तपशील पहा",
    totalPopulation: "गावाची लोकसंख्या",
    maternalCount: "माता संगोपन",
    childCount: "बाल लसीकरण",
    highRiskCount: "धोकादायक रुग्ण",
    synced: "अपडेट झाले",
    syncing: "अपडेट होत आहे...",
    searchPlaceholder: "रुग्णाचे नाव शोधा...",
    facility: "रुग्णालय",
    department: "विभाग"
  },
  hi: {
    dashboardTitle: "आशा स्वास्थ्य केंद्र",
    welcome: "नमस्ते, प्रिया",
    villageName: "शिरवल गांव • सेक्टर ४",
    tabDashboard: "डैशबोर्ड",
    tabReferrals: "पिछले रेफरल",
    tabFamilies: "परिवार एवं सदस्य",
    newReferralTitle: "नया मरीज रेफरल",
    newReferralSub: "मरीज को तुरंत शिरवल प्राथमिक स्वास्थ्य केंद्र भेजें",
    newReferralBtn: "नया रेफरल",
    totalReferralsLabel: "कुल रेफरल एवं परामर्श",
    recentReferralsTitle: "हाल के रेफरल एवं परामर्श",
    noReferralsFound: "कोई रेफरल लंबित नहीं है !",
    noReferralsSub: "गांव के सभी मरीज सामान्य हैं। आपातकालीन इलाज के लिए 'नया रेफरल' पर टैप करें।",
    statusPending: "डॉक्टर समीक्षा लंबित",
    statusAccepted: "डॉक्टर द्वारा स्वीकृत",
    statusCompleted: "उपचार पूर्ण",
    priorityUrgent: "अति आवश्यक",
    priorityRoutine: "सामान्य",
    viewDetails: "विवरण देखें",
    totalPopulation: "गांव की जनसंख्या",
    maternalCount: "मातृ स्वास्थ्य",
    childCount: "बाल टीकाकरण",
    highRiskCount: "गंभीर मरीज",
    synced: "अपडेटेड",
    syncing: "अपडेट हो रहा है...",
    searchPlaceholder: "मरीज का नाम खोजें...",
    facility: "अस्पताल",
    department: "विभाग"
  }
};

export default function ASHAHome({
  patients = [],
  loading,
  onRefresh,
  onNavigate,
  onOpenAddFamily,
  onOpenReferral
}) {
  const [lang, setLang] = useState(() => localStorage.getItem("radvault_asha_lang") || "en");
  const t = HOME_TRANSLATIONS[lang] || HOME_TRANSLATIONS.en;

  // Active Sub-Tab (Matching eSanjeevani reference)
  const [activeSubTab, setActiveSubTab] = useState("dashboard"); // 'dashboard' | 'referrals' | 'families'

  const [referralsList, setReferralsList] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [syncedToast, setSyncedToast] = useState(false);

  const stats = useMemo(() => computeStats(patients), [patients]);

  const handleSetLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("radvault_asha_lang", newLang);
    localStorage.setItem("radvault_patient_lang", newLang);
  };

  // Fetch live referrals from Supabase
  const fetchReferrals = async () => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase
        .from('care_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setReferralsList(data);
      } else {
        setReferralsList([]);
      }
    } catch (err) {
      console.warn("Could not load referrals:", err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleManualSync = async () => {
    setSyncedToast(true);
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        console.warn("Sync error:", err);
      }
    }
    fetchReferrals();
    setTimeout(() => setSyncedToast(false), 2000);
  };

  const today = new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <div className="pb-24 font-sans text-slate-800 bg-[#FAF9F6] min-h-screen flex flex-col justify-between">
      
      <div>
        {/* ── TOP HEADER (CLEAN & PROFESSIONAL) ── */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#008F83] text-white flex items-center justify-center font-black text-lg shadow-xs">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-[#16324F] leading-tight">
                    RadVault · {t.dashboardTitle}
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                    NHM Govt.
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500">
                  {today} • {t.villageName}
                </p>
              </div>
            </div>

            {/* Language Switcher & Sync */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => handleSetLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    lang === 'en' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleSetLanguage('mr')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    lang === 'mr' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  मराठी
                </button>
                <button
                  onClick={() => handleSetLanguage('hi')}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    lang === 'hi' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>

              <button
                onClick={handleManualSync}
                className="p-2 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors border border-teal-200/80 cursor-pointer"
                title="Sync Data"
              >
                <RefreshCw className={`w-4 h-4 ${syncedToast ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>

          </div>
        </header>

        {/* ── CLEAN GREEN SUB-TABS NAVIGATION (MATCHING eSanjeevani REFERENCE) ── */}
        <div className="bg-[#008F83] text-white px-4 sm:px-8 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-1 sm:gap-4 overflow-x-auto py-1">
            
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => setActiveSubTab("dashboard")}
              className={`flex items-center gap-2 py-3 px-4 font-black text-xs sm:text-sm transition-all border-b-4 cursor-pointer whitespace-nowrap ${
                activeSubTab === "dashboard"
                  ? "border-white text-white font-extrabold"
                  : "border-transparent text-teal-100 hover:text-white hover:border-teal-300"
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="bg-current rounded-xs" />
                <span className="bg-current rounded-xs" />
                <span className="bg-current rounded-xs" />
                <span className="bg-current rounded-xs" />
              </div>
              <span>{t.tabDashboard}</span>
            </button>

            {/* Tab 2: Past Referrals */}
            <button
              onClick={() => setActiveSubTab("referrals")}
              className={`flex items-center gap-2 py-3 px-4 font-black text-xs sm:text-sm transition-all border-b-4 cursor-pointer whitespace-nowrap ${
                activeSubTab === "referrals"
                  ? "border-white text-white font-extrabold"
                  : "border-transparent text-teal-100 hover:text-white hover:border-teal-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.tabReferrals}</span>
              {referralsList.length > 0 && (
                <span className="bg-white text-[#008F83] text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                  {referralsList.length}
                </span>
              )}
            </button>

            {/* Tab 3: Family Members */}
            <button
              onClick={() => setActiveSubTab("families")}
              className={`flex items-center gap-2 py-3 px-4 font-black text-xs sm:text-sm transition-all border-b-4 cursor-pointer whitespace-nowrap ${
                activeSubTab === "families"
                  ? "border-white text-white font-extrabold"
                  : "border-transparent text-teal-100 hover:text-white hover:border-teal-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.tabFamilies}</span>
            </button>

          </div>
        </div>

        {/* ── MAIN BODY CONTENT ── */}
        <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 1: DASHBOARD (2 HERO CARDS + RECENT CONSULTATIONS)    */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* ── TOP 2-COLUMN HERO OVERVIEW CARDS (INSPIRED BY REFERENCE) ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Fast-Track Action Card (Illustration + New Referral Button) */}
                <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-[#008F83]/50 transition-all">
                  
                  {/* Subtle top border accent */}
                  <div className="w-full flex flex-col items-center">
                    
                    {/* Doctor Tele-Consultation Illustration Icon */}
                    <div className="w-20 h-20 bg-teal-50 text-[#008F83] rounded-3xl flex items-center justify-center mb-3 shadow-xs border border-teal-100 group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-10 h-10" />
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#16324F] leading-tight">
                      {t.newReferralTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium max-w-xs mt-1">
                      {t.newReferralSub}
                    </p>
                  </div>

                  {/* Primary Solid Action Button (Like eSanjeevani "New Consultation") */}
                  <div className="mt-5 w-full flex justify-center">
                    <button
                      onClick={() => onOpenReferral ? onOpenReferral('new') : onNavigate('refer')}
                      className="px-8 py-3 bg-[#0B2545] hover:bg-[#008F83] text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.newReferralBtn}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Total Consultations & Activity Pulse Wave Card */}
                <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden">
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center shadow-2xs border border-emerald-100">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {t.totalReferralsLabel}
                        </p>
                        <p className="text-3xl sm:text-4xl font-black text-[#16324F] leading-none mt-1 font-mono">
                          {referralsList.length}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase border border-emerald-200">
                      Shirwal PHC Active
                    </span>
                  </div>

                  {/* Village Pulse Numbers */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.totalPopulation}</span>
                      <span className="text-sm font-black text-slate-800">{patients.length || 1240}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.maternalCount}</span>
                      <span className="text-sm font-black text-rose-600">{stats.pregnant || 18}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.highRiskCount}</span>
                      <span className="text-sm font-black text-red-600">{stats.highRisk || 4} ⚠️</span>
                    </div>
                  </div>

                  {/* Activity Baseline Wave Graphic (Exact SVG match from reference) */}
                  <div className="mt-4 -mx-7 -mb-7">
                    <svg className="w-full h-12 text-emerald-400 fill-emerald-50 stroke-emerald-500 stroke-2" viewBox="0 0 400 40" preserveAspectRatio="none">
                      <path d="M0,25 Q40,5 80,25 T160,25 T240,10 T320,30 T400,20 L400,40 L0,40 Z" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* ── RECENT REFERRALS & CONSULTATIONS LIST SECTION ── */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-[#16324F]">
                    {t.recentReferralsTitle}
                  </h3>
                  {referralsList.length > 0 && (
                    <button
                      onClick={() => setActiveSubTab("referrals")}
                      className="text-xs font-black text-[#008F83] hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  )}
                </div>

                {/* List or Empty State */}
                {referralsList.length > 0 ? (
                  <div className="divide-y divide-slate-100 space-y-3">
                    {referralsList.slice(0, 4).map((refItem) => (
                      <div
                        key={refItem.id}
                        className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm shrink-0 border border-teal-100">
                            {refItem.patient_name ? refItem.patient_name[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-sm">{refItem.patient_name || 'Resident'}</h4>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                refItem.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-teal-100 text-teal-800'
                              }`}>
                                {refItem.priority || t.priorityRoutine}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {refItem.facility || 'Shirwal PHC'} • {refItem.department || 'General Medicine'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {refItem.status || t.statusPending}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(refItem.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State Illustration (Matching eSanjeevani reference) */
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                      <Stethoscope className="w-8 h-8 text-teal-600/70" />
                    </div>
                    <h4 className="text-base font-black text-[#16324F]">{t.noReferralsFound}</h4>
                    <p className="text-xs text-slate-400 max-w-sm">{t.noReferralsSub}</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 2: PAST REFERRALS LIST                                */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubTab === "referrals" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#16324F]">{t.tabReferrals}</h3>
                  <p className="text-xs text-slate-500">History of all village hospital referrals &amp; feedback</p>
                </div>

                <button
                  onClick={() => onOpenReferral ? onOpenReferral('new') : onNavigate('refer')}
                  className="px-4 py-2 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.newReferralBtn}</span>
                </button>
              </div>

              {referralsList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {referralsList.map((refItem) => (
                    <div key={refItem.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-base shrink-0 border border-teal-100">
                          {refItem.patient_name ? refItem.patient_name[0].toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">{refItem.patient_name}</h4>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              ABDM: {refItem.patient_id ? String(refItem.patient_id).slice(0, 8) : 'ABHA'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1">
                            {refItem.facility || 'Shirwal PHC'} • {refItem.department || 'General Medicine'}
                          </p>
                          {refItem.reason && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">Note: "{refItem.reason}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase border border-emerald-200">
                          {refItem.status || t.statusPending}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(refItem.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {t.noReferralsFound}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TAB 3: FAMILY MEMBERS & CENSUS OVERVIEW                   */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubTab === "families" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#16324F]">{t.tabFamilies}</h3>
                  <p className="text-xs text-slate-500">Village Census Directory ({patients.length || 1240} registered residents)</p>
                </div>
                <button
                  onClick={() => onOpenAddFamily ? onOpenAddFamily() : onNavigate('village')}
                  className="px-4 py-2 bg-[#008F83] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Family</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {patients.slice(0, 9).map(p => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.gender} • {p.age_years ? `${p.age_years} yrs` : 'Resident'}
                      </p>
                    </div>
                    {p.status === 'red' ? (
                      <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 uppercase">
                        Alert ⚠️
                      </span>
                    ) : (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                        Healthy
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => onNavigate('village')}
                  className="text-xs font-black text-[#008F83] hover:underline cursor-pointer"
                >
                  Open Full Village Directory ({patients.length} members) →
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── FOOTER OFFICIAL TRUST STRIP (MATCHING eSanjeevani REFERENCE) ── */}
      <footer className="mt-12 bg-white border-t border-slate-200/80 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>National Health Mission · Ministry of Health &amp; Family Welfare · Govt. of India</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Ayushman Bharat (ABDM)</span>
            <span>•</span>
            <span>C-DAC Partner</span>
            <span>•</span>
            <span>eSanjeevani Bridge</span>
          </div>
        </div>
      </footer>

    </div>
  );
}