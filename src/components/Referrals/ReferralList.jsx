import React, { useState, useMemo } from 'react';
import {
  MapPin, Globe, RefreshCw, Plus, ArrowLeft, Users, Flame,
  AlertTriangle, Activity, Clock, CheckCircle2, Video, Search,
  X, ChevronRight, ChevronLeft, ArrowRight, Phone, ShieldCheck, Heart,
  Trash2, Building2, User, Stethoscope, ChevronDown,
  Ambulance, Home, HeartPulse, Hospital, Calendar, Zap, Loader2
} from 'lucide-react';

// ─── DATE / SHIFT UTILITIES ───
const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalDateStr = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// ─── Multilingual Localization Dictionary ────────────────────
const TRANSLATIONS = {
  en: {
    location: "Shirwal Village · Sector 4",
    titleMain: "Connected Care",
    titleAccent: "Centre",
    subtitle: "From village care to specialist care — every step connected.",
    synced: "Synced",
    syncing: "Syncing...",
    connecting: "Connecting Supabase...",
    lastSyncPrefix: "Last: ",
    nhmTitle: "National Health Mission",
    nhmSub: "Healthier Villages · Stronger India",
    newReferralBtn: "Create New Referral",
    backBtn: "Back",
    doodleLeft: "Same people. A healthier tomorrow. ♡",
    doodleRight: "People, Places, Better Health ♡",
    discVillage: "Village",
    discVillageSub: "Community Care",
    discPHC: "PHC",
    discPHCSub: "Clinical Review",
    discSpecialist: "Specialist",
    discSpecialistSub: "Expert Care",
    stagePatient: "Patient at Home",
    stagePatientSub: "Community Need",
    stageAsha: "ASHA Didi",
    stageAshaSub: "Vitals & Triage",
    stagePHC: "Arogya Mandir / PHC",
    stagePHCSub: "Clinical Intake",
    stageHospital: "District Specialist",
    stageHospitalSub: "Expert Doctor",
    activeReferrals: "Active Referrals",
    emergency: "Emergency",
    urgent: "Urgent",
    routine: "Routine",
    awaitingIntake: "referrals awaiting hospital intake",
    allTriaged: "All active referrals triaged by hospital",
    searchPlaceholder: "Search patient, ABHA, facility or referral...",
    filterAll: "All Active",
    filterNeedsAttention: "Needs Attention",
    filterEmergency: "Emergency",
    filterUrgent: "Urgent",
    filterRoutine: "Routine",
    needsAttentionHeader: "NEEDS ATTENTION",
    pipelineHeader: "ACTIVE REFERRAL PIPELINE",
    pipelineSub: "Live cases moving through frontline triage, PHC intake, and doctor consult",
    viewReferral: "View Referral →",
    openReferral: "Open Referral →",
    ashaStage: "ASHA",
    phcStage: "PHC",
    specialistStage: "Specialist",
    triaged: "Triaged",
    awaiting: "Awaiting",
    reviewed: "Triaged",
    consulted: "Consulted",
    aiTriageNote: "Clinical Note",
    noActiveTitle: "All Referrals Up to Date",
    noActiveSub: "No unresolved referrals in the pipeline. Completed referrals are saved in Home > Past Referrals.",
    clearFilters: "Clear Filters",
    modalTitle: "Connected Care Dossier",
    patientDetails: "Patient Details",
    careRouteHistory: "Continuous Care Route Timeline",
    destinationHospital: "Destination Facility & Service",
    emergencyHelpline: "Emergency Helpline 108",
    closeBtn: "Close Dossier",
    confirmDelete: "Are you sure you want to remove this referral?",
    todayShift: "Today's Shift (24h)",
    prevDay: "Prev Day",
    nextDay: "Next Day",
    allArchive: "All Archive",
    shiftTitleToday: "Active Frontline Referrals (Last 24 Hours)",
    shiftSubToday: "Live cases automatically clearing after 24h to keep queue clear",
    shiftTitleDate: "Referral Shift Archive",
    shiftSubDate: "Showing cases dispatched on",
    shiftTitleArchive: "All-Time Referrals Archive",
    shiftSubArchive: "Showing all historical referral records across facility history",
    deleteReferralTitle: "Delete Patient Referral",
    deleteReferralSub: "Permanently remove this referral and unlink across hospital and doctor queues?",
    deleteImpactWarning: "Deleting this referral will remove the case from the frontline pipeline, unbind hospital intake records, and clean up doctor queues in Supabase. (Frontline demographic records in Patient register remain preserved).",
    cancelBtn: "Cancel",
    confirmDeleteBtn: "Confirm & Delete Referral"
  },
  mr: {
    location: "शिरवळ गाव · सेक्टर ४",
    titleMain: "कनेक्टेड केअर",
    titleAccent: "केंद्र",
    subtitle: "ग्रामीण सेवेपासून तज्ज्ञ उपचारांपर्यंत — प्रत्येक टप्पा जोडलेला.",
    synced: "सिंक झाले",
    syncing: "सिंक होत आहे...",
    connecting: "सर्व्हरशी जोडत आहे...",
    lastSyncPrefix: "वेळ: ",
    nhmTitle: "राष्ट्रीय आरोग्य अभियान",
    nhmSub: "निरोगी गावे · सशक्त भारत",
    newReferralBtn: "नवीन रेफरल तयार करा",
    backBtn: "मागे",
    doodleLeft: "आपली माणसे. निरोगी भविष्य. ♡",
    doodleRight: "आरोग्य संपन्न गाव आणि समाज ♡",
    discVillage: "गाव",
    discVillageSub: "आशा समुदाय सेवा",
    discPHC: "प्रा. आ. केंद्र",
    discPHCSub: "तपासणी व टोकन",
    discSpecialist: "तज्ज्ञ डॉक्टर",
    discSpecialistSub: "विशेषज्ञ सल्ला",
    stagePatient: "रुग्ण (घरी)",
    stagePatientSub: "शिरवळ गाव",
    stageAsha: "आशा ताई",
    stageAshaSub: "तपासणी व नोंदणी",
    stagePHC: "आरोग्य मंदिर / केंद्र",
    stagePHCSub: "डॉक्टर पुनरावलोकन",
    stageHospital: "जिल्हा रुग्णालय",
    stageHospitalSub: "विशेषज्ञ डॉक्टर",
    activeReferrals: "सक्रिय रेफरल",
    emergency: "अति तातडीचे",
    urgent: "तातडीचे",
    routine: "सर्वसाधारण",
    awaitingIntake: "रुग्णालय तपासणीच्या प्रतीक्षेत",
    allTriaged: "सर्व सक्रिय रेफरल रुग्णालयाने तपासले आहेत",
    searchPlaceholder: "रुग्णाचे नाव, आभा, रुग्णालय शोधा...",
    filterAll: "सर्व सक्रिय",
    filterNeedsAttention: "तातडीचे लक्ष आवश्यक",
    filterEmergency: "अति तातडीचे",
    filterUrgent: "तातडीचे",
    filterRoutine: "सर्वसाधारण",
    needsAttentionHeader: "तातडीचे लक्ष आवश्यक",
    pipelineHeader: "सक्रिय रेफरल पाइपलाइन",
    pipelineSub: "रुग्णालय व तज्ज्ञ डॉक्टरांकडे सध्या सुरू असणारी तपासणी प्रकरणे",
    viewReferral: "रेफरल पहा →",
    openReferral: "रेफरल उघडा →",
    ashaStage: "आशा",
    phcStage: "प्रा. आ. केंद्र",
    specialistStage: "तज्ज्ञ डॉक्टर",
    triaged: "तपासले",
    awaiting: "प्रलंबित",
    reviewed: "स्वीकृत",
    consulted: "सल्ला पूर्ण",
    aiTriageNote: "वैद्यकीय माहिती",
    noActiveTitle: "सर्व रेफरल अद्ययावत आहेत",
    noActiveSub: "सध्या कोणतीही प्रलंबित प्रकरणे नाहीत. पूर्ण झालेले सर्व रेफरल मुख्य पृष्ठावर उपलब्ध आहेत.",
    clearFilters: "फिल्टर साफ करा",
    modalTitle: "रेफरल तपशील पत्रिका",
    patientDetails: "रुग्णाची माहिती",
    careRouteHistory: "आरोग्य प्रवासाचा घटनाक्रम",
    destinationHospital: "पाठवलेले रुग्णालय व विभाग",
    emergencyHelpline: "तातडीची रुग्णवाहिका १०८",
    closeBtn: "बंद करा",
    confirmDelete: "तुम्हाला हे रेफरल खरोखर काढून टाकायचे आहे का?",
    todayShift: "आजची शिफ्ट (२४ तास)",
    prevDay: "मागील दिवस",
    nextDay: "पुढील दिवस",
    allArchive: "सर्व जुनी नोंद",
    shiftTitleToday: "सक्रिय रेफरल (मागील २४ तास)",
    shiftSubToday: "रांगेत गर्दी होऊ नये म्हणून २४ तासांनंतर प्रकरणे आपोआप इतिहासामध्ये जातात",
    shiftTitleDate: "रेफरल शिफ्ट नोंद",
    shiftSubDate: "या दिवशी पाठवलेली प्रकरणे:",
    shiftTitleArchive: "सर्वकालीन रेफरल दस्तऐवज",
    shiftSubArchive: "सर्व ऐतिहासिक रेफरल नोंदी दाखवत आहे",
    deleteReferralTitle: "रेफरल कायमचे काढून टाका",
    deleteReferralSub: "हे रेफरल काढून रुग्णालय व डॉक्टर रांगेतून अनलिंक करायचे आहे का?",
    deleteImpactWarning: "हे रेफरल काढून टाकल्यास रुग्णालय तपासणी व डॉक्टर रांगेतून ते हटवले जाईल. (रुग्णाची प्राथमिक नोंद कायम राहील).",
    cancelBtn: "रद्द करा",
    confirmDeleteBtn: "खात्री आहे, काढून टाका"
  },
  hi: {
    location: "शिरवल गांव · सेक्टर ४",
    titleMain: "कनेक्टेड केयर",
    titleAccent: "सेंटर",
    subtitle: "ग्रामीण देखभाल से विशेषज्ञ परामर्श तक — हर कदम जुड़ा हुआ।",
    synced: "सिंक हुआ",
    syncing: "सिंक हो रहा है...",
    connecting: "सर्वर से कनेक्ट हो रहा है...",
    lastSyncPrefix: "समय: ",
    nhmTitle: "राष्ट्रीय स्वास्थ्य मिशन",
    nhmSub: "स्वस्थ गांव · सशक्त भारत",
    newReferralBtn: "नया रेफरल बनाएं",
    backBtn: "पीछे",
    doodleLeft: "हमारे अपने लोग. एक स्वस्थ कल. ♡",
    doodleRight: "स्वस्थ लोग, सशक्त भारत ♡",
    discVillage: "गांव",
    discVillageSub: "सामुदायिक देखभाल",
    discPHC: "पीएचसी",
    discPHCSub: "चिकित्सीय समीक्षा",
    discSpecialist: "विशेषज्ञ",
    discSpecialistSub: "विशेषज्ञ परामर्श",
    activeReferrals: "सक्रिय रेफरल",
    emergency: "अति आवश्यक",
    urgent: "आवश्यक",
    routine: "सामान्य",
    awaitingIntake: "अस्पताल समीक्षा हेतु लंबित",
    allTriaged: "सभी सक्रिय रेफरल अस्पताल द्वारा देखे गए हैं",
    searchPlaceholder: "मरीज का नाम, आभा, अस्पताल खोजें...",
    filterAll: "सभी सक्रिय",
    filterNeedsAttention: "समीक्षा लंबित",
    filterEmergency: "अति आवश्यक",
    filterUrgent: "आवश्यक",
    filterRoutine: "सामान्य",
    needsAttentionHeader: "ध्यान देने योग्य रेफरल",
    pipelineHeader: "सक्रिय रेफरल पाइपलाइन",
    pipelineSub: "अस्पताल एवं डॉक्टर परामर्श में चल रहे सक्रिय मामले",
    viewReferral: "रेफरल देखें →",
    openReferral: "रेफरल खोलें →",
    ashaStage: "आशा",
    phcStage: "पीएचसी",
    specialistStage: "विशेषज्ञ",
    triaged: "जांच पूर्ण",
    awaiting: "लंबित",
    reviewed: "स्वीकृत",
    consulted: "परामर्शित",
    aiTriageNote: "डॉक्टर नोट",
    noActiveTitle: "सभी रेफरल अद्यतित हैं",
    noActiveSub: "वर्तमान में कोई लंबित रेफरल नहीं है। पूर्ण मामले होम > पास्ट रेफरल्स में उपलब्ध हैं।",
    clearFilters: "फ़िल्टर साफ़ करें",
    modalTitle: "रेफरल विवरण पत्रिका",
    patientDetails: "मरीज का विवरण",
    careRouteHistory: "निरंतर देखभाल समयरेखा",
    destinationHospital: "गंतव्य अस्पताल एवं विभाग",
    emergencyHelpline: "आपातकालीन एम्बुलेंस १०८",
    closeBtn: "बंद करें",
    confirmDelete: "क्या आप वाकई यह रेफरल हटाना चाहते हैं?",
    todayShift: "आज की शिफ्ट (24 घंटे)",
    prevDay: "पिछला दिन",
    nextDay: "अगला दिन",
    allArchive: "सभी पुरानी सूची",
    shiftTitleToday: "सक्रिय रेफरल (पिछले 24 घंटे)",
    shiftSubToday: "कतार साफ रखने के लिए 24 घंटे बाद मामले अपने आप इतिहास में चले जाते हैं",
    shiftTitleDate: "रेफरल शिफ्ट संग्रह",
    shiftSubDate: "इस तारीख को भेजे गए मामले:",
    shiftTitleArchive: "सर्वकालीन रेफरल संग्रह",
    shiftSubArchive: "सभी ऐतिहासिक रेफरल रिकॉर्ड दिखाए जा रहे हैं",
    deleteReferralTitle: "रेफरल हमेशा के लिए हटाएं",
    deleteReferralSub: "क्या आप यह रेफरल हटाकर अस्पताल और डॉक्टर कतार से अलग करना चाहते हैं?",
    deleteImpactWarning: "इस रेफरल को हटाने से अस्पताल और डॉक्टर कतार से यह हट जाएगा। (रोगी का मूल रिकॉर्ड सुरक्षित रहेगा)।",
    cancelBtn: "रद्द करें",
    confirmDeleteBtn: "पुष्टि करें और हटाएं"
  }
};

// ─── National Health Mission Emblem Badge ─────────────────────
function NHMLogo({ t }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center p-1 shadow-xs shrink-0">
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
      <div className="hidden lg:block leading-tight text-left">
        <div className="text-[11px] font-black text-slate-900 tracking-tight">{t.nhmTitle}</div>
        <div className="text-[9px] font-extrabold text-slate-500">{t.nhmSub}</div>
      </div>
    </div>
  );
}

// ─── 1. Fresh & Clean Panoramic Hero Theme Card ───────────────
function FreshThemeHero({
  activeReferrals,
  t,
  onCreateNew,
  onBack,
  lang,
  onLangChange,
  isSyncing,
  lastSyncTime,
  onManualSync
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Compute active metrics
  const counts = useMemo(() => {
    const res = { total: activeReferrals.length, RED: 0, ORANGE: 0, GREEN: 0, submitted: 0 };
    activeReferrals.forEach((r) => {
      if (r.priority === 'RED') res.RED++;
      else if (r.priority === 'ORANGE') res.ORANGE++;
      else res.GREEN++;

      if (r.rawStatus === 'SUBMITTED') res.submitted++;
    });
    return res;
  }, [activeReferrals]);

  return (
    <div className="w-full mb-6">
      
      {/* ── Top Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Left Title & Location */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#008F83] mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#008F83]" />
            <span>{t.location}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F2942] tracking-tight leading-none">
            {t.titleMain} <span className="text-[#008F83]">{t.titleAccent}</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5">
            {t.subtitle}
          </p>
        </div>

        {/* Right Controls: Language, Working Sync Button, NHM Badge, Back */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="h-10 flex items-center gap-1.5 px-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in">
                <button
                  onClick={() => { onLangChange("en"); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  English
                </button>
                <button
                  onClick={() => { onLangChange("mr"); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  मराठी
                </button>
                <button
                  onClick={() => { onLangChange("hi"); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  हिंदी
                </button>
              </div>
            )}
          </div>

          {/* Synced Status Button (h-10 with interactive refresh) */}
          <button 
            onClick={onManualSync}
            disabled={isSyncing}
            className="h-10 flex items-center gap-2.5 bg-white/95 hover:bg-white border border-slate-200/80 hover:border-emerald-400 px-3.5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-xs group active:scale-95 disabled:opacity-80"
            title="Click to refresh and sync live Supabase referrals"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              isSyncing ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
            }`}>
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </div>
            <div className="leading-tight text-left">
              <p className="text-[11px] font-black text-emerald-800 flex items-center gap-1.5">
                <span>{isSyncing ? t.syncing : t.synced}</span>
                {isSyncing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
              </p>
              <p className="text-[9px] font-semibold text-slate-400">
                {isSyncing ? t.connecting : `${t.lastSyncPrefix}${lastSyncTime}`}
              </p>
            </div>
          </button>

          {/* NHM Logo Badge */}
          <div className="hidden md:flex items-center bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs h-10">
            <NHMLogo t={t} />
          </div>

          {/* Action: Back */}
          {onBack && (
            <button
              onClick={onBack}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Fresh Theme Card: The Natural Care Journey ── */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#f8fbf8] via-[#eef8f1] to-[#f4faf5] border-2 border-emerald-200/90 shadow-sm p-4 sm:p-7 mb-6">
        
        {/* Soft Sunlit Countryside Ambient Accents */}
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Rolling Hills Scenic SVG at Base */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-40 overflow-hidden">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 C200,20 400,90 600,40 C800,-10 1000,70 1200,30 L1200,120 L0,120 Z" fill="#a7f3d0" />
            <path d="M0,80 C250,50 500,100 750,60 C950,20 1100,90 1200,70 L1200,120 L0,120 Z" fill="#6ee7b7" opacity="0.5" />
          </svg>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col gap-6">
          
          {/* Header Banner: Natural Title & Doodles */}
          <div className="flex items-center justify-between px-1 sm:px-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-black tracking-wide uppercase flex items-center gap-1.5 shadow-2xs">
                <span>🌿</span>
                <span>The Rural Care Pathway · शिरवळ गाव</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-700/80 select-none">
              <span>{t.doodleLeft}</span>
            </div>
          </div>

          {/* ── 4-Stage Natural Storybook Journey ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-3 relative items-center pt-2">
            
            {/* NODE 1: Patient at Home */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200 border-2 border-amber-300 text-amber-800 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 group-hover:-rotate-2">
                  <Home className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs border-2 border-white">
                  1
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black tracking-wider uppercase whitespace-nowrap shadow-2xs">
                  {t.stagePatient || "Patient"}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-black text-xs sm:text-sm text-slate-800 leading-tight">
                  {t.stagePatient || "Village Home"}
                </h4>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  {t.stagePatientSub || "Community Need"}
                </p>
              </div>
            </div>

            {/* CONNECTOR 1: Winding Dotted Curly Road (Hidden on Mobile) */}
            <div className="hidden md:flex absolute left-[18%] top-[30%] w-[16%] items-center justify-center pointer-events-none z-0">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
                <path d="M5,12 C25,2 35,22 55,10 C70,0 80,16 95,12" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
                <polygon points="93,8 100,12 93,16" fill="#10b981" />
              </svg>
            </div>

            {/* NODE 2: ASHA Didi Triage */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-200 border-2 border-emerald-400 text-emerald-800 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-2">
                  <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs border-2 border-white">
                  2
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black tracking-wider uppercase whitespace-nowrap shadow-2xs">
                  {t.stageAsha || "ASHA Didi"}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-black text-xs sm:text-sm text-slate-800 leading-tight">
                  {t.stageAsha || "ASHA Frontline"}
                </h4>
                <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                  {t.stageAshaSub || "Vitals & Triage"}
                </p>
              </div>
            </div>

            {/* CONNECTOR 2: Winding Road WITH ANIMATED AMBULANCE */}
            <div className="hidden md:flex absolute left-[43%] top-[24%] w-[16%] flex-col items-center justify-center pointer-events-none z-20">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
                <path d="M5,12 C25,20 40,2 65,14 C75,20 85,8 95,12" stroke="#059669" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
                <polygon points="93,8 100,12 93,16" fill="#059669" />
              </svg>
              {/* Cute 108 Ambulance Van traveling along road */}
              <div className="absolute -top-4 bg-white border-2 border-emerald-500 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1.5 animate-bounce pointer-events-auto cursor-pointer" style={{ animationDuration: '2.5s' }} title="108 Emergency Route">
                <div className="relative flex items-center">
                  <Ambulance className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <span className="text-[9px] font-black text-emerald-900 tracking-wider">108 VAN</span>
              </div>
            </div>

            {/* NODE 3: PHC Clinic / Arogya Mandir */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-100 via-teal-50 to-cyan-200 border-2 border-teal-400 text-teal-800 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 group-hover:-rotate-2">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs border-2 border-white">
                  3
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-teal-700 text-white text-[9px] font-black tracking-wider uppercase whitespace-nowrap shadow-2xs">
                  {t.stagePHC || "PHC Clinic"}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-black text-xs sm:text-sm text-slate-800 leading-tight">
                  {t.stagePHC || "Arogya Mandir"}
                </h4>
                <p className="text-[10px] font-semibold text-teal-700 mt-0.5">
                  {t.stagePHCSub || "Clinical Intake"}
                </p>
              </div>
            </div>

            {/* CONNECTOR 3: Winding Dotted Curly Road to Hospital */}
            <div className="hidden md:flex absolute left-[68%] top-[30%] w-[16%] items-center justify-center pointer-events-none z-0">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
                <path d="M5,12 C25,2 40,24 65,10 C75,2 85,18 95,12" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
                <polygon points="93,8 100,12 93,16" fill="#3b82f6" />
              </svg>
            </div>

            {/* NODE 4: District Hospital & Specialist */}
            <div className="flex flex-col items-center text-center group relative z-10">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-200 border-2 border-indigo-400 text-indigo-900 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-2">
                  <Hospital className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs border-2 border-white">
                  4
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-800 text-white text-[9px] font-black tracking-wider uppercase whitespace-nowrap shadow-2xs">
                  {t.stageHospital || "Specialist"}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-black text-xs sm:text-sm text-slate-800 leading-tight">
                  {t.stageHospital || "District Hospital"}
                </h4>
                <p className="text-[10px] font-semibold text-indigo-700 mt-0.5">
                  {t.stageHospitalSub || "Specialist Care"}
                </p>
              </div>
            </div>

          </div>

          {/* ── BIG BUTTON: NEW REFERRAL (Directly Below the Pathway) ── */}
          <div className="relative z-10 px-2 sm:px-6 mt-3 flex justify-center">
            <button
              onClick={onCreateNew}
              className="w-full max-w-xl py-3.5 sm:py-4 px-8 bg-gradient-to-r from-[#008F83] via-[#007A70] to-[#0A4D44] hover:from-[#007A70] hover:to-[#083E36] active:scale-[0.99] text-white font-black text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="tracking-wide uppercase text-xs sm:text-sm font-black">
                {t.newReferralBtn}
              </span>
            </button>
          </div>

          {/* ── 5-Tile Floating Metric Ribbon (Matching Reference Layout) ── */}
          <div className="relative z-10 px-1 sm:px-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-emerald-200/80 p-2.5 sm:p-3 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 items-center">
              
              {/* Tile 1: Active Referrals */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-teal-50/70 border border-teal-100">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#008F83] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                    {counts.total}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                    {t.activeReferrals}
                  </div>
                </div>
              </div>

              {/* Tile 2: Emergency */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-red-50/70 border border-red-100">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-red-600 leading-none">
                    {counts.RED}
                  </div>
                  <div className="text-[10px] font-bold text-red-700 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>{t.emergency}</span>
                  </div>
                </div>
              </div>

              {/* Tile 3: Urgent */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 leading-none">
                    {counts.ORANGE}
                  </div>
                  <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                    {t.urgent}
                  </div>
                </div>
              </div>

              {/* Tile 4: Routine */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#008F83] flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#008F83] leading-none">
                    {counts.GREEN}
                  </div>
                  <div className="text-[10px] font-bold text-teal-800 mt-0.5">
                    {t.routine}
                  </div>
                </div>
              </div>

              {/* Tile 5: Intake Status */}
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="text-xs font-black text-slate-800 leading-tight">
                  {counts.submitted > 0 ? (
                    <span><strong className="text-amber-700">{counts.submitted}</strong> {t.awaitingIntake}</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">{t.allTriaged}</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── 2. Needs Attention Card (Priority Route Highlight) ───────
function NeedsAttentionCard({ referral, t, onOpen, onDelete }) {
  const isEmergency = referral.priority === 'RED';
  const isUrgent = referral.priority === 'ORANGE';

  const isAshaEscorted =
    referral.is_pregnant ||
    referral.symptoms?.toLowerCase().includes('asha accompanying') ||
    referral.clinical_summary?.toLowerCase().includes('asha accompanying') ||
    referral.aiNote?.toLowerCase().includes('asha accompanying');

  // Dynamic Stepper Stage Computation
  const isReceivedByHospital =
    ['Accepted', 'Arrived', 'Assigned', 'In Consultation', 'Completed'].includes(referral.status) ||
    ['WAITING_FOR_DOCTOR', 'IN_CALL', 'IN_PROGRESS', 'COMPLETED'].includes(referral.rawStatus);

  const isDoctorComplete = referral.status === 'Completed' || referral.rawStatus === 'COMPLETED';
  const isDoctorInProgress =
    referral.status === 'In Consultation' ||
    referral.rawStatus === 'IN_CALL' ||
    referral.rawStatus === 'WAITING_FOR_DOCTOR';

  const cardBorder = isEmergency
    ? 'border-red-200 border-l-4 border-l-red-600'
    : isUrgent
    ? 'border-amber-200 border-l-4 border-l-amber-500'
    : 'border-slate-200 border-l-4 border-l-[#008F83]';

  return (
    <div
      data-referral-id={referral.id}
      className={`bg-white rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all mb-3.5 relative overflow-hidden border ${cardBorder}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        {/* Left: Indicator, Patient Name, Route */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isEmergency ? 'bg-red-600' : isUrgent ? 'bg-amber-500' : 'bg-[#008F83]'}`} />
          <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            {referral.patientName}
          </h4>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {referral.patientId}
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
            isEmergency ? 'bg-red-50 text-red-800 border-red-200' : isUrgent ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}>
            {isEmergency ? '🔴 EMERGENCY' : isUrgent ? '🟡 URGENT' : '🟢 ROUTINE'}
          </span>
          {isAshaEscorted && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
              👩‍⚕️ ASHA Escort
            </span>
          )}
          <span className="text-xs font-bold text-[#008F83] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            {referral.hospital ? `${referral.hospital} · ${referral.department || 'General'}` : 'PHC → Specialist'}
          </span>
        </div>

        {/* Right: Dynamic Status Tag */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
            isDoctorComplete
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : isDoctorInProgress
              ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
              : isReceivedByHospital
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{referral.status || 'Pending'}</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400">{referral.createdAt}</span>
        </div>
      </div>

      {/* Clinical Notes snippet */}
      {referral.aiNote && (
        <p className="text-xs text-slate-700 font-medium mb-3 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          "{referral.aiNote}"
        </p>
      )}

      {/* Route Stepper + Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {/* Dynamic Stepper */}
        <div className="flex items-center gap-2 text-xs font-black text-slate-700 flex-wrap">
          {/* Stage 1: ASHA (Always Complete) */}
          <div className="flex items-center gap-1 text-[#008F83]">
            <span className="w-4 h-4 rounded-full bg-[#008F83] text-white flex items-center justify-center text-[9px] font-black">✓</span>
            <span>ASHA</span>
          </div>

          <span className="text-slate-300">→</span>

          {/* Stage 2: PHC / Hospital Reception */}
          {isReceivedByHospital ? (
            <div className="flex items-center gap-1 text-[#008F83]">
              <span className="w-4 h-4 rounded-full bg-[#008F83] text-white flex items-center justify-center text-[9px] font-black">✓</span>
              <span>PHC Received</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold">PHC (Awaiting Reception)</span>
            </div>
          )}

          <span className="text-slate-300">→</span>

          {/* Stage 3: Specialist / Doctor Consultation */}
          {isDoctorComplete ? (
            <div className="flex items-center gap-1 text-[#008F83]">
              <span className="w-4 h-4 rounded-full bg-[#008F83] text-white flex items-center justify-center text-[9px] font-black">✓</span>
              <span>Specialist Done</span>
            </div>
          ) : isDoctorInProgress ? (
            <div className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-bold">🩺 In Consultation</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-black">●</span>
              <span>Specialist</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => onOpen(referral)}
            className="px-4 py-2 bg-[#0F2942] hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <span>{t.viewReferral}</span>
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(referral)}
              title={t.deleteReferralTitle || "Delete referral"}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── 3. Pipeline Referral Card (Compact In-Flight Cases) ───────
function PipelineReferralCard({ referral, t, onOpen, onDelete }) {
  const isEmergency = referral.priority === 'RED';
  const isUrgent = referral.priority === 'ORANGE';

  const isAshaEscorted =
    referral.is_pregnant ||
    referral.symptoms?.toLowerCase().includes('asha accompanying') ||
    referral.clinical_summary?.toLowerCase().includes('asha accompanying') ||
    referral.aiNote?.toLowerCase().includes('asha accompanying');

  const raw = referral.rawStatus || 'SUBMITTED';
  const isSubmitted = raw === 'SUBMITTED';
  const isWaitingDoctor = raw === 'WAITING_FOR_DOCTOR';
  const isInCall = raw === 'IN_CALL';

  return (
    <div
      data-referral-id={referral.id}
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      
      {/* Left: Info */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#008F83] flex items-center justify-center shrink-0 font-black mt-0.5">
          <User className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-slate-900 text-sm leading-tight truncate">
              {referral.patientName}
            </h4>
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {referral.patientId}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
              isEmergency ? 'bg-red-600 text-white' : isUrgent ? 'bg-amber-500 text-white' : 'bg-teal-700 text-white'
            }`}>
              {referral.priority}
            </span>
            {isAshaEscorted && (
              <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                👩‍⚕️ ASHA Escort
              </span>
            )}
            <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${
              isSubmitted ? 'bg-amber-50 text-amber-800 border-amber-200' :
              isInCall ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
              isWaitingDoctor ? 'bg-purple-50 text-purple-800 border-purple-200' :
              'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isSubmitted ? 'Awaiting Intake' : isInCall ? 'Live Consult' : isWaitingDoctor ? 'Doctor Queue' : 'Triaged'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap font-medium">
            <span className="text-slate-800 font-bold truncate">{referral.hospital}</span>
            <span>•</span>
            <span className="text-slate-600 truncate">{referral.department}</span>
            {referral.tokenNumber && (
              <span className="text-[#008F83] font-mono font-black">
                [Token: {referral.tokenNumber}]
              </span>
            )}
          </div>

          {referral.aiNote && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
              "{referral.aiNote}"
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
        <span className="text-[11px] text-slate-400 font-semibold hidden md:inline mr-1">
          {referral.createdAt}
        </span>
        <button
          onClick={() => onOpen(referral)}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#008F83] hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          {t.openReferral}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(referral)}
            title={t.deleteReferralTitle || "Delete referral"}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
}

// ─── 4. Referral Dossier Modal ────────────────────────────────
function ReferralDetailModal({ referral, t, onClose, onDelete }) {
  if (!referral) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#008F83]" />
            <h3 className="font-black text-slate-900 text-base">{t.modalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Core Card */}
        <div className="p-4 bg-[#F5FBF9] border border-teal-100 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-slate-900 text-lg leading-tight">{referral.patientName}</h4>
            <p className="text-xs font-mono font-bold text-teal-800">{referral.patientId}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Referred by: {referral.createdBy}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${
            referral.priority === 'RED' ? 'bg-red-600 text-white' : 'bg-[#008F83] text-white'
          }`}>
            {referral.priority}
          </span>
        </div>

        {/* Care Route Stepper */}
        <div className="space-y-2">
          <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            {t.careRouteHistory}
          </h5>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-5 h-5 rounded-full bg-[#008F83] text-white flex items-center justify-center text-[10px] font-black">1</span>
              <div>
                <span className="font-bold">ASHA Frontline Triage: </span>
                <span className="text-slate-500">{referral.createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-5 h-5 rounded-full bg-[#0F2942] text-white flex items-center justify-center text-[10px] font-black">2</span>
              <div>
                <span className="font-bold">Destination Facility: </span>
                <span>{referral.hospital}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-black">3</span>
              <div>
                <span className="font-bold">Clinical Service & Doctor: </span>
                <span>{referral.department} · {referral.doctor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Symptoms & Notes */}
        {referral.aiNote && (
          <div className="space-y-1.5">
            <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {t.aiTriageNote}
            </h5>
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium">
              {referral.aiNote}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <a
            href="tel:108"
            className="flex-1 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>{t.emergencyHelpline}</span>
          </a>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(referral);
              }}
              className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.deleteReferralTitle || "Delete"}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs transition-colors cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── 5. Main Connected Care Centre Component ──────────────────
export default function ReferralList({ referrals = [], onCreateNew, onDeleteReferral, onBack, onRefresh }) {
  const [lang, setLang] = useState(localStorage.getItem("radvault_asha_lang") || "en");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("radvault_asha_lang", newLang);
  };

  // Sync state & live timer (matching MyVillage.jsx)
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

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'NEEDS_ATTENTION' | 'RED' | 'ORANGE' | 'GREEN'
  const [selectedReferral, setSelectedReferral] = useState(null);

  // ─── Shift & Date Scope Filter ───
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dateViewMode, setDateViewMode] = useState('TODAY_SHIFT'); // 'TODAY_SHIFT' | 'CALENDAR_DATE' | 'ALL_ARCHIVE'
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day - 1);
    const prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(prevStr);
    setDateViewMode('CALENDAR_DATE');
  };

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day + 1);
    const nextStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(nextStr);
    setDateViewMode('CALENDAR_DATE');
  };

  // 1. Scoped referrals based on Selected Date or 24-Hour Active Shift
  const dateScopedReferrals = useMemo(() => {
    if (dateViewMode === 'ALL_ARCHIVE') {
      return referrals;
    }

    if (dateViewMode === 'TODAY_SHIFT') {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      return referrals.filter(r => {
        const createdRaw = r.rawCreatedAt || r.created_at;
        const created = createdRaw ? new Date(createdRaw).getTime() : now;
        return (now - created) <= ONE_DAY_MS;
      });
    }

    // CALENDAR_DATE mode: strictly matches selectedDate (YYYY-MM-DD)
    return referrals.filter(r => {
      const createdRaw = r.rawCreatedAt || r.created_at;
      return toLocalDateStr(createdRaw) === selectedDate;
    });
  }, [referrals, dateViewMode, selectedDate]);

  // STRICTLY ACTIVE NON-COMPLETED REFERRALS FROM SCOPED DATA
  const activeReferrals = useMemo(() => {
    return dateScopedReferrals.filter(r => 
      r.rawStatus !== 'COMPLETED' && 
      r.status !== 'Completed'
    );
  }, [dateScopedReferrals]);

  // Urgent/Attention referrals (RED priority or Awaiting Review)
  const needsAttentionList = useMemo(() => {
    return activeReferrals.filter(r => r.rawStatus === 'SUBMITTED' || r.priority === 'RED');
  }, [activeReferrals]);

  // Rest of Active Pipeline referrals
  const generalPipelineList = useMemo(() => {
    return activeReferrals.filter(r => !(r.rawStatus === 'SUBMITTED' || r.priority === 'RED'));
  }, [activeReferrals]);

  // Filtered List based on Search & Chips
  const filteredActiveReferrals = useMemo(() => {
    let result = [...activeReferrals];

    if (activeFilter === 'NEEDS_ATTENTION') {
      result = result.filter(r => r.rawStatus === 'SUBMITTED' || r.priority === 'RED');
    } else if (activeFilter === 'RED') {
      result = result.filter(r => r.priority === 'RED');
    } else if (activeFilter === 'ORANGE') {
      result = result.filter(r => r.priority === 'ORANGE');
    } else if (activeFilter === 'GREEN') {
      result = result.filter(r => r.priority === 'GREEN');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        (r.patientId && r.patientId.toLowerCase().includes(q)) ||
        (r.hospital && r.hospital.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.doctor && r.doctor.toLowerCase().includes(q)) ||
        (r.aiNote && r.aiNote.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeReferrals, activeFilter, searchQuery]);

  const handleDelete = (referral) => {
    setDeleteConfirmModal(referral);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28 font-sans text-slate-800">
      
      {/* ── 1. Top Panoramic Hero Banner with Theme Discs, Big Button & 5 Metrics ── */}
      <FreshThemeHero
        activeReferrals={activeReferrals}
        t={t}
        onCreateNew={onCreateNew}
        onBack={onBack}
        lang={lang}
        onLangChange={handleLangChange}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onManualSync={handleManualSync}
      />

      {/* ── 2. Interactive Calendar Date Navigator & 24h Shift Window ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 mb-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Quick Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDateViewMode('TODAY_SHIFT');
                setSelectedDate(todayStr);
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                dateViewMode === 'TODAY_SHIFT'
                  ? 'bg-[#008F83] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.todayShift || "Today's Shift (24h)"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrevDay}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t.prevDay || "Prev Day"}</span>
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDate >= todayStr}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
              title="Next Day"
            >
              <span>{t.nextDay || "Next Day"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Native HTML5 Calendar Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-[#008F83]" />
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setDateViewMode('CALENDAR_DATE');
                  }
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {/* All Archive Toggle */}
            <button
              type="button"
              onClick={() => setDateViewMode('ALL_ARCHIVE')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                dateViewMode === 'ALL_ARCHIVE'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>📂</span>
              <span>{t.allArchive || "All Archive"}</span>
            </button>
          </div>

          {/* Right: Active Date Scope Pill / Legend */}
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-500 block">
              {dateViewMode === 'TODAY_SHIFT' && (
                <span className="text-emerald-700 font-extrabold flex items-center justify-start md:justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.shiftTitleToday || "Active Frontline Referrals (Last 24 Hours)"}</span>
                </span>
              )}
              {dateViewMode === 'CALENDAR_DATE' && (
                <span className="text-indigo-700 font-extrabold flex items-center justify-start md:justify-end gap-1">
                  <span>📅</span>
                  <span>{formatDisplayDate(selectedDate)}</span>
                </span>
              )}
              {dateViewMode === 'ALL_ARCHIVE' && (
                <span className="text-amber-700 font-extrabold flex items-center justify-start md:justify-end gap-1">
                  <span>📂</span>
                  <span>{t.shiftTitleArchive || "All-Time Historical Archive"}</span>
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {dateViewMode === 'TODAY_SHIFT'
                ? (t.shiftSubToday || "Live cases automatically clearing after 24h to keep queue clear")
                : dateViewMode === 'CALENDAR_DATE'
                ? `${t.shiftSubDate || "Cases dispatched on"} ${formatDisplayDate(selectedDate)}`
                : (t.shiftSubArchive || "Showing all historical referral records across facility history")}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <div className="space-y-3 mb-6">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008F83] shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-black">
          {[
            { key: 'ALL', label: t.filterAll, count: activeReferrals.length },
            { key: 'NEEDS_ATTENTION', label: `⚡ ${t.filterNeedsAttention}`, count: needsAttentionList.length },
            { key: 'RED', label: `🔴 ${t.filterEmergency}`, count: activeReferrals.filter(r => r.priority === 'RED').length },
            { key: 'ORANGE', label: `🟡 ${t.filterUrgent}`, count: activeReferrals.filter(r => r.priority === 'ORANGE').length },
            { key: 'GREEN', label: `🟢 ${t.filterRoutine}`, count: activeReferrals.filter(r => r.priority === 'GREEN').length },
          ].map(({ key, label, count }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#008F83] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ── 4. Zero State (When All Cases Completed) ── */}
      {filteredActiveReferrals.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-900 text-base mb-1">{t.noActiveTitle}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{t.noActiveSub}</p>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            + {t.newReferralBtn}
          </button>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── TIER 1: ⚡ NEEDS ATTENTION (Only when applicable or filter active) ── */}
          {needsAttentionList.length > 0 && activeFilter !== 'GREEN' && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-red-500 font-black text-sm">⚡</span>
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  {t.needsAttentionHeader}
                </h3>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {needsAttentionList.length} Action Required
                </span>
              </div>

              <div className="space-y-3">
                {needsAttentionList.map((item) => (
                  <NeedsAttentionCard
                    key={`attention-${item.id}`}
                    referral={item}
                    t={t}
                    onOpen={setSelectedReferral}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── TIER 2: ACTIVE REFERRAL PIPELINE ── */}
          {(generalPipelineList.length > 0 || activeFilter !== 'ALL') && (
            <div>
              <div className="flex items-center justify-between gap-2 px-1 mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#008F83]" />
                    <span>{t.pipelineHeader}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({activeFilter === 'ALL' ? generalPipelineList.length : filteredActiveReferrals.length})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.pipelineSub}
                  </p>
                </div>

                {(searchQuery || activeFilter !== 'ALL') && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); }}
                    className="text-[11px] font-bold text-[#008F83] hover:underline cursor-pointer"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(activeFilter === 'ALL' ? generalPipelineList : filteredActiveReferrals).map((referral) => (
                  <PipelineReferralCard
                    key={`pipeline-${referral.id}`}
                    referral={referral}
                    t={t}
                    onOpen={setSelectedReferral}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Referral Dossier Detail Modal ── */}
      {selectedReferral && (
        <ReferralDetailModal
          referral={selectedReferral}
          t={t}
          onClose={() => setSelectedReferral(null)}
          onDelete={handleDelete}
        />
      )}

      {/* ─── MODAL: UPGRADED TWO-STEP DELETE CONFIRMATION ─── */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm text-slate-900">
                  {t.deleteReferralTitle || "Delete Patient Referral"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.deleteReferralSub || "Permanently remove this referral and unlink across hospital and doctor queues?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient details card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900">{deleteConfirmModal.patientName || 'Unknown Patient'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {deleteConfirmModal.status || 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {deleteConfirmModal.patientId}
              </p>
              <p className="text-[11px] text-slate-600 font-medium line-clamp-2 pt-1 border-t border-slate-200">
                {deleteConfirmModal.aiNote || 'General referral'}
              </p>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              ⚠️ <strong>Logical Links Impact:</strong> {t.deleteImpactWarning || "Deleting this referral will remove the case from the frontline pipeline, unbind hospital intake records, and clean up doctor queues in Supabase. (Frontline demographic records in Patient register remain preserved)."}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deletingId === deleteConfirmModal.id}
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {t.cancelBtn || "Cancel"}
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmModal.id}
                onClick={async () => {
                  setDeletingId(deleteConfirmModal.id);
                  try {
                    await onDeleteReferral(deleteConfirmModal);
                    setDeleteConfirmModal(null);
                  } finally {
                    setDeletingId(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingId === deleteConfirmModal.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{t.confirmDeleteBtn || "Confirm & Delete Referral"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
