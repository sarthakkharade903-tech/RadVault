import React, { useState, useMemo } from "react";
import {
  Users, Search, Plus, Heart, Baby, ChevronDown, ChevronUp,
  MapPin, FolderOpen, ArrowRight, ShieldAlert, Filter,
  RefreshCw, Globe, HeartHandshake, MoreVertical, SlidersHorizontal,
  ChevronRight, Sparkles, UserPlus, FileText, CheckCircle2,
  Calendar, Check, ShieldCheck
} from "lucide-react";
import villageGhibli from "../../assets/village_ghibli.jpg";

// ─── Single Language Dictionaries (No Mixed Text) ─────────
const VILLAGE_TRANSLATIONS = {
  en: {
    title: "Village Families Register",
    subtitle: "Family-wise health directory for a healthier tomorrow.",
    locationBadge: "Shirwal Village • Sector 4",
    familiesCount: "Registered in village",
    totalFamilies: "TOTAL FAMILIES",
    totalPopulation: "TOTAL POPULATION",
    maternalCare: "MATERNAL CARE",
    under5Child: "UNDER 5 CHILDREN",
    populationDesc: "Village residents",
    maternalDesc: "Pregnant women & mothers under care",
    childDesc: "Children with immunization schedule",
    registerFamilyBtn: "Register New Family",
    registerFamilyDesc: "Add a new household to the village health register",
    registerQuote: "Every Family A Healthier Tomorrow",
    searchPlaceholder: "Search family name, head of household, PIN or village...",
    filterAll: "All Families",
    filterHighRisk: "High Risk",
    filterPregnant: "Maternal Care",
    filterChildren: "Children Under 5",
    sortBy: "Sort by: Family Name",
    sectionTitle: "Village Families",
    noFamiliesFound: "No village families found",
    noFamiliesDesc: "Try searching with a different name or clear the filter.",
    headOfHousehold: "Head of Household",
    registeredMembers: "Members",
    openFolder: "Open Family Folder",
    membersTitle: "Family Members",
    noMembersYet: "No members registered yet. Click 'Open Family Folder' to add members.",
    manageMembersBtn: "Manage All Members & Add New Member →",
    ancTag: "Maternal Care",
    childTag: "Under 5",
    urgentTag: "High Risk",
    routineTag: "Routine Care",
    synced: "Synced",
    lastSync: "Last sync: 09:15 AM",
    nhmTitle: "National Health Mission",
    nhmSubtitle: "Healthier Villages, Stronger India",
    bottomTitle: "Stronger Families, Healthier Villages",
    bottomQuote: "Healthy families build stronger communities."
  },
  mr: {
    title: "गावातील कुटुंब नोंदवही",
    subtitle: "निरोगी उद्यासाठी कुटुंबनिहाय आरोग्य निर्देशिका.",
    locationBadge: "शिरवळ गाव • सेक्टर 4",
    familiesCount: "गावात नोंदणीकृत",
    totalFamilies: "एकूण कुटुंबे",
    totalPopulation: "एकूण लोकसंख्या",
    maternalCare: "माता संगोपन",
    under5Child: "५ वर्षांखालील बालके",
    populationDesc: "गावातील रहिवासी",
    maternalDesc: "गरोदर व स्तनदा माता काळजी",
    childDesc: "लसीकरण वेळापत्रकातील बालके",
    registerFamilyBtn: "नवीन कुटुंब नोंदणी करा",
    registerFamilyDesc: "गाव आरोग्य नोंदवहीत नवीन कुटुंब जोडा",
    registerQuote: "प्रत्येक कुटुंब, निरोगी भविष्य",
    searchPlaceholder: "कुटुंबाचे नाव, कुटुंबप्रमुख, पिन किंवा गाव शोधा...",
    filterAll: "सर्व कुटुंबे",
    filterHighRisk: "धोकादायक",
    filterPregnant: "माता संगोपन",
    filterChildren: "५ वर्षांखालील बालके",
    sortBy: "क्रमवारी: कुटुंबाचे नाव",
    sectionTitle: "गावातील कुटुंबे",
    noFamiliesFound: "कुटुंब सापडले नाही",
    noFamiliesDesc: "कृपया वेगळे नाव शोधून पहा किंवा फिल्टर बदला.",
    headOfHousehold: "कुटुंबप्रमुख",
    registeredMembers: "सदस्य",
    openFolder: "कुटुंब फोल्डर उघडा",
    membersTitle: "कुटुंबातील सदस्य",
    noMembersYet: "अद्याप सदस्य जोडलेले नाहीत. सदस्य जोडण्यासाठी 'कुटुंब फोल्डर उघडा' वर टॅप करा.",
    manageMembersBtn: "सर्व सदस्य पहा व नवीन सदस्य जोडा →",
    ancTag: "माता संगोपन",
    childTag: "५ वर्षांखालील",
    urgentTag: "धोकादायक",
    routineTag: "नियमित काळजी",
    synced: "सिंक झाले",
    lastSync: "शेवटचे सिंक: 09:15 AM",
    nhmTitle: "राष्ट्रीय आरोग्य अभियान",
    nhmSubtitle: "निरोगी गावे, सशक्त भारत",
    bottomTitle: "सशक्त कुटुंबे, निरोगी गावे",
    bottomQuote: "निरोगी कुटुंबांतूनच सशक्त समाज घडतो."
  },
  hi: {
    title: "गांव परिवार रजिस्टर",
    subtitle: "स्वस्थ कल के लिए परिवार अनुसार स्वास्थ्य निर्देशिका।",
    locationBadge: "शिरवल गांव • सेक्टर 4",
    familiesCount: "गांव में पंजीकृत",
    totalFamilies: "कुल परिवार",
    totalPopulation: "कुल जनसंख्या",
    maternalCare: "मातृ देखभाल",
    under5Child: "5 वर्ष से छोटे बच्चे",
    populationDesc: "गांव के निवासी",
    maternalDesc: "गर्भवती एवं धात्री माताएं",
    childDesc: "टीकाकरण अनुसूची वाले बच्चे",
    registerFamilyBtn: "नया परिवार पंजीकृत करें",
    registerFamilyDesc: "गांव स्वास्थ्य रजिस्टर में नया परिवार जोड़ें",
    registerQuote: "हर परिवार, स्वस्थ कल",
    searchPlaceholder: "परिवार का नाम, मुखिया, पिन या गांव खोजें...",
    filterAll: "सभी परिवार",
    filterHighRisk: "उच्च जोखिम",
    filterPregnant: "मातृ देखभाल",
    filterChildren: "5 वर्ष से छोटे बच्चे",
    sortBy: "क्रम: परिवार का नाम",
    sectionTitle: "गांव के परिवार",
    noFamiliesFound: "कोई परिवार नहीं मिला",
    noFamiliesDesc: "कृपया अन्य नाम से खोजें या फ़िल्टर बदलें।",
    headOfHousehold: "परिवार के मुखिया",
    registeredMembers: "सदस्य",
    openFolder: "परिवार फोल्डर खोलें",
    membersTitle: "परिवार के सदस्य",
    noMembersYet: "अभी तक कोई सदस्य दर्ज नहीं है। सदस्य जोड़ने के लिए 'परिवार फोल्डर खोलें' पर क्लिक करें।",
    manageMembersBtn: "सभी सदस्य देखें एवं नया सदस्य जोड़ें →",
    ancTag: "मातृ देखभाल",
    childTag: "5 वर्ष से छोटे",
    urgentTag: "उच्च जोखिम",
    routineTag: "नियमित देखभाल",
    synced: "सिंक हुआ",
    lastSync: "अंतिम सिंक: 09:15 AM",
    nhmTitle: "राष्ट्रीय स्वास्थ्य मिशन",
    nhmSubtitle: "स्वस्थ गांव, सशक्त भारत",
    bottomTitle: "सशक्त परिवार, स्वस्थ गांव",
    bottomQuote: "स्वस्थ परिवारों से ही सशक्त समाज का निर्माण होता है।"
  }
};

export default function MyVillage({
  families = [],
  loading,
  onRefresh,
  onAddFamily,
  onOpenFamily,
  onAddMember
}) {
  const [lang, setLang] = useState(() => localStorage.getItem("radvault_asha_lang") || "en");
  const t = VILLAGE_TRANSLATIONS[lang] || VILLAGE_TRANSLATIONS.en;

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedFamily, setExpandedFamily] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [sortBy, setSortBy] = useState("name");

  // Sync state & live timer
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 700);
    }
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("radvault_asha_lang", newLang);
    setShowLanguageMenu(false);
  };

  // Compute village level summary metrics
  const totalPeople = useMemo(() => {
    return families.reduce((sum, f) => sum + (f.village_patients?.length || 0), 0);
  }, [families]);

  const totalPregnant = useMemo(() => {
    return families.reduce((sum, f) => {
      const pts = f.village_patients || [];
      return sum + pts.filter(p => p.is_pregnant).length;
    }, 0);
  }, [families]);

  const totalChildren = useMemo(() => {
    return families.reduce((sum, f) => {
      const pts = f.village_patients || [];
      return sum + pts.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;
    }, 0);
  }, [families]);

  // Live filter counts for pills
  const highRiskCount = useMemo(() => {
    return families.filter(f => f.high_risk_household || (f.village_patients || []).some(p => p.status === 'red')).length;
  }, [families]);

  const pregnantFamiliesCount = useMemo(() => {
    return families.filter(f => (f.village_patients || []).some(p => p.is_pregnant)).length;
  }, [families]);

  const childFamiliesCount = useMemo(() => {
    return families.filter(f => (f.village_patients || []).some(p => p.is_child || (p.age_years && p.age_years <= 5))).length;
  }, [families]);

  const filteredFamilies = useMemo(() => {
    let list = families.filter(fam => {
      const nameMatch = fam.family_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const headMatch = fam.head_of_family?.toLowerCase().includes(searchTerm.toLowerCase());
      const villageMatch = fam.village?.toLowerCase().includes(searchTerm.toLowerCase());
      const pinMatch = fam.family_pin?.includes(searchTerm);

      if (!nameMatch && !headMatch && !villageMatch && !pinMatch && searchTerm.trim()) return false;
      
      const pts = fam.village_patients || [];
      if (filter === "High Risk") return fam.high_risk_household || pts.some(p => p.status === 'red');
      if (filter === "Pregnant") return pts.some(p => p.is_pregnant);
      if (filter === "Children") return pts.some(p => p.is_child || (p.age_years && p.age_years <= 5));
      return true;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => (a.family_name || "").localeCompare(b.family_name || ""));
    } else if (sortBy === "members") {
      list = [...list].sort((a, b) => (b.village_patients?.length || 0) - (a.village_patients?.length || 0));
    }
    return list;
  }, [families, searchTerm, filter, sortBy]);

  return (
    <div className="min-h-full bg-[#F0F7F4] text-slate-800 font-sans relative overflow-x-hidden pb-16">
      
      {/* ── 1. Upper Hero Canopy with Studio Ghibli Artwork (Clean Fade Above Register Banner) ── */}
      <div 
        className="absolute top-0 left-0 right-0 w-full h-[320px] sm:h-[350px] pointer-events-none select-none z-0 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 65%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 65%, transparent 100%)"
        }}
      >
        <img 
          src={villageGhibli} 
          alt="Indian Village Landscape" 
          className="w-full h-full object-cover object-top sm:object-center opacity-[0.38] lg:opacity-[0.42] filter saturate-[1.2] contrast-[1.05]"
        />
        {/* Soft gradient wash on the left to guarantee optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F0F7F4] via-[#F0F7F4]/40 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 space-y-6">

        {/* ── Top Bar: Location, Title & Aligned Header Badges ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          {/* Left: Location & Title */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-2xs backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.locationBadge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#132B3E] tracking-tight mt-2.5">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#007A70]/85 mt-1">
              {t.subtitle}
            </p>
          </div>

          {/* Right: Uniform Height Header Badges (h-10) */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            
            {/* Language Selector (h-10) */}
            <div className="relative">
              <button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="h-10 flex items-center gap-1.5 px-3.5 bg-white/95 hover:bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer backdrop-blur-xs"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in">
                  <button onClick={() => changeLanguage("en")} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">English</button>
                  <button onClick={() => changeLanguage("mr")} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">मराठी</button>
                  <button onClick={() => changeLanguage("hi")} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">हिंदी</button>
                </div>
              )}
            </div>

            {/* Synced Status Button (h-10 with interactive refresh) */}
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-10 flex items-center gap-2.5 bg-white/95 hover:bg-white border border-slate-200/80 hover:border-emerald-400 px-3.5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-xs group active:scale-95 disabled:opacity-80"
              title="Click to refresh and sync village data"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                isSyncing ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
              }`}>
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              </div>
              <div className="leading-tight text-left">
                <p className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5">
                  <span>{isSyncing ? "Syncing..." : t.synced}</span>
                  {isSyncing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                </p>
                <p className="text-[9px] font-semibold text-slate-400">
                  Last sync: {lastSyncTime}
                </p>
              </div>
            </button>

            {/* National Health Mission Emblem Badge (h-10) */}
            <div className="h-10 flex items-center gap-2.5 bg-white/95 border border-slate-200/80 px-3.5 rounded-xl shadow-2xs backdrop-blur-xs">
              <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="leading-tight text-left hidden sm:block">
                <p className="text-[10px] font-black text-slate-900">{t.nhmTitle}</p>
                <p className="text-[8px] font-bold text-slate-400">{t.nhmSubtitle}</p>
              </div>
            </div>

          </div>

        </div>

        {/* ── 2. Four Distinctive Metric Cards (No Text Truncation) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. Total Families (Mint) */}
          <div className="bg-[#EAF7F3]/95 backdrop-blur-md border border-[#CDEEE4] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D7F2EB] text-[#007A70] flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-[#007A70] uppercase tracking-wider">{t.totalFamilies}</p>
              <p className="text-2xl sm:text-3xl font-black text-[#132B3E] leading-tight mt-0.5">{families.length}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-snug mt-0.5">{t.familiesCount}</p>
            </div>
          </div>

          {/* 2. Total Population (Sky Blue) */}
          <div className="bg-[#EEF6FB]/95 backdrop-blur-md border border-[#D2E7F6] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#DDEEF8] text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-[#0284C7] uppercase tracking-wider">{t.totalPopulation}</p>
              <p className="text-2xl sm:text-3xl font-black text-[#132B3E] leading-tight mt-0.5">{totalPeople}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-snug mt-0.5">{t.populationDesc}</p>
            </div>
          </div>

          {/* 3. Maternal Care (Soft Rose - Real Database Count) */}
          <div className="bg-[#FDF1F3]/95 backdrop-blur-md border border-[#FAD2DA] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FCE1E7] text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
              <Heart className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-[#E11D48] uppercase tracking-wider">{t.maternalCare}</p>
              <p className="text-2xl sm:text-3xl font-black text-[#132B3E] leading-tight mt-0.5">{totalPregnant}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-snug mt-0.5">
                {t.maternalDesc}
              </p>
            </div>
          </div>

          {/* 4. Under 5 Children (Soft Amber - Real Database Count) */}
          <div className="bg-[#FEF7EC]/95 backdrop-blur-md border border-[#FDE3C2] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FDEBD0] text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
              <Baby className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-[#D97706] uppercase tracking-wider">{t.under5Child}</p>
              <p className="text-2xl sm:text-3xl font-black text-[#132B3E] leading-tight mt-0.5">{totalChildren}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-snug mt-0.5">
                {t.childDesc}
              </p>
            </div>
          </div>

        </div>

        {/* ── 3. Primary CTA: "Register New Family" Clean Hero Banner (Zero Overlap) ── */}
        <div 
          onClick={onAddFamily}
          className="group relative overflow-hidden bg-gradient-to-r from-[#00665E] via-[#007A70] to-[#0A887E] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-600/30"
        >
          {/* Left: Icon + Title & Subtitle */}
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {t.registerFamilyBtn}
              </h2>
              <p className="text-xs text-teal-100/90 font-medium">
                {t.registerFamilyDesc}
              </p>
            </div>
          </div>

          {/* Right: Slogan Pill & Action Trigger */}
          <div className="flex items-center gap-3 relative z-10 self-end sm:self-auto">
            <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-teal-50 border border-white/15">
              "{t.registerQuote}"
            </span>
            <div className="w-10 h-10 rounded-full bg-white text-[#007A70] flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* Subtle Village Silhouette on far right edge (Non-overlapping) */}
          <div 
            className="absolute right-0 top-0 h-full w-60 pointer-events-none hidden lg:block opacity-20 overflow-hidden"
            style={{
              maskImage: "linear-gradient(to left, rgba(0,0,0,1) 10%, transparent 90%)",
              WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 10%, transparent 90%)"
            }}
          >
            <img 
              src={villageGhibli} 
              alt="Village Silhouette" 
              className="w-full h-full object-cover object-right"
            />
          </div>
        </div>

        {/* ── 4. Search and Filter Bar with Live Counts ── */}
        <div className="space-y-3">
          
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-11 py-3.5 text-xs sm:text-sm font-semibold text-[#132B3E] placeholder-slate-400 focus:outline-none focus:border-[#007A70] focus:ring-2 focus:ring-[#007A70]/20 shadow-2xs transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007A70] cursor-pointer">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Filter Pills with Live Category Counts */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-2">
              {[
                { 
                  key: "All", 
                  label: t.filterAll, 
                  count: families.length,
                  icon: Plus, 
                  activeColor: "bg-[#007A70] text-white border-[#007A70]" 
                },
                { 
                  key: "High Risk", 
                  label: t.filterHighRisk, 
                  count: highRiskCount,
                  icon: ShieldAlert, 
                  activeColor: "bg-rose-600 text-white border-rose-600" 
                },
                { 
                  key: "Pregnant", 
                  label: t.filterPregnant, 
                  count: pregnantFamiliesCount,
                  icon: Heart, 
                  activeColor: "bg-rose-500 text-white border-rose-500" 
                },
                { 
                  key: "Children", 
                  label: t.filterChildren, 
                  count: childFamiliesCount,
                  icon: Baby, 
                  activeColor: "bg-amber-500 text-white border-amber-500" 
                }
              ].map(({ key, label, count, icon: Icon, activeColor }) => {
                const isActive = filter === key;
                return (
                  <button 
                    key={key} 
                    onClick={() => setFilter(key)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? `${activeColor} shadow-xs`
                        : "bg-white text-slate-600 border-slate-200/80 hover:border-[#007A70] hover:text-[#007A70]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="shrink-0">
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="name">Sort by: Family Name</option>
                <option value="members">Sort by: Member Count</option>
              </select>
            </div>
          </div>

        </div>

        {/* ── 5. Village Families Dossier Cards (Balanced 3-Column Layout, No Dead Space) ── */}
        <div className="space-y-3.5 pt-1">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#132B3E] tracking-tight">
              {t.sectionTitle} ({filteredFamilies.length})
            </h3>
          </div>

          {filteredFamilies.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center shadow-2xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-[#132B3E] font-black text-base">{t.noFamiliesFound}</p>
              <p className="text-xs text-slate-500 mt-1">{t.noFamiliesDesc}</p>
            </div>
          ) : (
            filteredFamilies.map(fam => {
              const pts = fam.village_patients || [];
              const hasRed = fam.high_risk_household || pts.some(p => p.status === 'red');
              const isExpanded = expandedFamily === fam.id;
              const pregnantCount = pts.filter(p => p.is_pregnant).length;
              const childCount = pts.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;
              const initialLetter = fam.family_name ? fam.family_name.trim()[0].toUpperCase() : "F";

              return (
                <div
                  key={fam.id}
                  className="bg-white rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md border border-slate-200/80 transition-all overflow-hidden group"
                >
                  {/* Family Card Row: Balanced 3-Section Dossier */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                    
                    {/* Left (Col 1-5): Avatar + Family Identity */}
                    <div className="md:col-span-5 flex items-start gap-3.5 min-w-0">
                      
                      {/* Family Initial Avatar with Cottage Badge */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#EAF7F3] border border-[#CDEEE4] flex items-center justify-center font-black text-xl text-[#007A70] shadow-inner">
                          {initialLetter}
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] shadow-2xs">
                          🏡
                        </div>
                      </div>

                      {/* Name, Head & Location */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-[#132B3E] text-base tracking-tight truncate">
                            {fam.family_name}
                          </h4>
                          {fam.family_pin && (
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              #{fam.family_pin}
                            </span>
                          )}
                          {hasRed && (
                            <span className="text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
                              {t.urgentTag}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                          {t.headOfHousehold}: <strong className="font-black text-slate-900">{fam.head_of_family || "Ramu Patil"}</strong>
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{fam.village || "Vadgaon"}</span>
                        </div>
                      </div>

                    </div>

                    {/* Center (Col 6-8): Health Indicators Strip */}
                    <div className="md:col-span-3 flex md:justify-center items-center gap-1.5 flex-wrap">
                      {pregnantCount > 0 && (
                        <span className="bg-[#FDF1F3] text-[#E11D48] border border-[#FCD6DE] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                          <Heart className="w-3 h-3 text-[#E11D48]" />
                          <span>{pregnantCount} {t.ancTag}</span>
                        </span>
                      )}

                      {childCount > 0 && (
                        <span className="bg-[#FEF7EC] text-[#D97706] border border-[#FDE3C2] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                          <Baby className="w-3 h-3 text-[#D97706]" />
                          <span>{childCount} {t.childTag}</span>
                        </span>
                      )}

                      <span className="bg-[#EAF7F3] text-[#007A70] border border-[#CDEEE4] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                        <Users className="w-3 h-3 text-[#007A70]" />
                        <span>{pts.length} {t.registeredMembers}</span>
                      </span>

                      {pregnantCount === 0 && childCount === 0 && (
                        <span className="bg-emerald-50/80 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{t.routineTag}</span>
                        </span>
                      )}
                    </div>

                    {/* Right (Col 9-12): Actions */}
                    <div className="md:col-span-4 flex items-center justify-end gap-2 shrink-0">
                      <button
                        onClick={() => onOpenFamily(fam)}
                        className="px-4 sm:px-5 py-2.5 bg-[#007A70] hover:bg-[#00665E] text-white font-extrabold text-xs rounded-2xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>{t.openFolder}</span>
                      </button>

                      <button
                        onClick={() => setExpandedFamily(isExpanded ? null : fam.id)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200/60"
                        title="Toggle quick member preview"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                  {/* Expandable Member Preview */}
                  {isExpanded && (
                    <div className="bg-[#F8FDFB] border-t border-slate-100 px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                          {t.membersTitle} ({pts.length}):
                        </p>
                        <button
                          onClick={() => onOpenFamily(fam)}
                          className="text-xs font-extrabold text-[#007A70] hover:underline cursor-pointer"
                        >
                          {t.manageMembersBtn}
                        </button>
                      </div>

                      {pts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">
                          {t.noMembersYet}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {pts.map(p => (
                            <div
                              key={p.id}
                              className="bg-white rounded-xl p-3 border border-slate-200/70 shadow-2xs flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-extrabold text-slate-900">{p.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">
                                  {p.relation_to_head || "Member"} • {p.age_years}y • {p.gender || "Gender"}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                {p.is_pregnant && (
                                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    ANC
                                  </span>
                                )}
                                {p.is_child && (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    Child
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>

        {/* ── 6. Bottom Banner: "Stronger Families, Healthier Villages" ── */}
        <div className="bg-gradient-to-r from-[#EAF7F3] via-white to-[#F1F9F5] border border-[#CDEEE4] rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
              🌿
            </div>
            <div>
              <p className="font-black text-xs sm:text-sm text-[#132B3E]">
                {t.bottomTitle}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                "{t.bottomQuote}"
              </p>
            </div>
          </div>

          <div className="text-[10px] font-extrabold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
            RadVault Public Health Network
          </div>
        </div>

      </div>

    </div>
  );
}
