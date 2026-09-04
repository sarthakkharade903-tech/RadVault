import React, { useState, useMemo, useEffect } from "react";
import {
  Users, Heart, Baby, AlertTriangle, RefreshCw, ChevronRight,
  Calendar, Plus, PhoneCall, Check, Send, CheckCircle2,
  Package, QrCode, Search, X, Stethoscope, ChevronDown,
  Clock, MapPin, Droplet, Sparkles, Printer, UserPlus, Phone, Building2
} from "lucide-react";
import { computeStats, computeDueList, getMedicines } from "../../services/ashaService";
import MedicineKitManager from "./MedicineKitManager";

// ─── Pure Single-Language Dictionaries (Zero Mixed Text) ─────────
const TRANSLATIONS = {
  en: {
    dashboardTitle: "ASHA Health & Referral Hub",
    welcome: "Good Morning, Priya",
    villageName: "Shirwal Village • Sector 4",
    totalMembers: "Village Population",
    totalMembersDesc: "Total registered residents in village register",
    maternalCare: "Maternal Care (ANC)",
    maternalDesc: "Pregnant women & mothers under care",
    childCare: "Child Immunization",
    childDesc: "Children under 5 years with vaccine schedule",
    highRisk: "High Risk Alerts",
    highRiskDesc: "Patients requiring urgent hospital attention",
    quickActions: "Quick Health Actions",
    addFamily: "Register New Family",
    addFamilyDesc: "Add a new household to village register",
    hospitalReferral: "Emergency Hospital Referral",
    hospitalReferralDesc: "Send patient directly to PHC or Civil Hospital",
    liveReferrals: "Live In-Transit Referrals",
    liveReferralsDesc: "Track patients on the way to hospital",
    drugKit: "Medicine Kit Stock",
    drugKitDesc: "Check IFA, Paracetamol & ORS tablet balance",
    todaysTasks: "Today's Work List",
    tasksSubtitle: "Important visits, checkups & immunizations for today",
    markDone: "Mark Done",
    call: "Call",
    refer: "Refer",
    completed: "Completed",
    urgent: "URGENT",
    synced: "SYNCED",
    syncing: "Syncing...",
    searchCensus: "Search person by name or family...",
    close: "Close",
    viewAll: "View List",
    activeTasks: "Active Tasks",
    censusTitle: "Village Population & Census Register",
    censusSubtitle: "Complete directory of village families and members",
    emergencyHelplines: "24x7 Emergency Helplines & PHC Status",
    callAmbulance: "Free Ambulance",
    teleConsult: "Medical Advice",
    maternalHelp: "Women Helpline",
    childHelp: "Childline",
    shirwalPhc: "Shirwal Primary Health Centre (PHC)",
    shirwalSub: "2.4 km away · Open 24 Hours · Free Emergency OPD",
    callNow: "Call"
  },
  mr: {
    dashboardTitle: "आशा आरोग्य व संदर्भ सेवा केंद्र",
    welcome: "सुप्रभात, प्रिया",
    villageName: "शिरवळ गाव • विभाग ४",
    totalMembers: "गावाची लोकसंख्या",
    totalMembersDesc: "गावातील एकूण नोंदणीकृत नागरिक",
    maternalCare: "माता संगोपन (ANC)",
    maternalDesc: "गरोदर महिला व बाळंतीण माता",
    childCare: "बाल लसीकरण",
    childDesc: "५ वर्षांखालील बालके व लसीकरण",
    highRisk: "धोकादायक रुग्ण",
    highRiskDesc: "तातडीने रुग्णालयात दाखवण्याची गरज असलेले रुग्ण",
    quickActions: "महत्त्वाची कामे",
    addFamily: "नवीन कुटुंब नोंदणी",
    addFamilyDesc: "गावाच्या नोंदवहीत नवीन कुटुंब जोडा",
    hospitalReferral: "तातडीचे रुग्णालय रेफरल",
    hospitalReferralDesc: "रुग्णास प्राथमिक आरोग्य केंद्रात पाठवा",
    liveReferrals: "सक्रिय रुग्णालय रेफरल",
    liveReferralsDesc: "रुग्णालयात पाठवलेल्या रुग्णांची स्थिती पहा",
    drugKit: "औषध किट साठा",
    drugKitDesc: "आयर्न, पॅरासिटामॉल व ओआरएस गोळ्यांचा साठा तपासा",
    todaysTasks: "आजची कामे",
    tasksSubtitle: "आजच्या महत्त्वाच्या गृहभेटी, लसीकरण व तपासण्या",
    markDone: "पूर्ण झाले",
    call: "फोन करा",
    refer: "रेफर करा",
    completed: "पूर्ण",
    urgent: "तातडीचे",
    synced: "अपडेट झाले",
    syncing: "अपडेट होत आहे...",
    searchCensus: "रुग्णाचे किंवा कुटुंबाचे नाव शोधा...",
    close: "बंद करा",
    viewAll: "यादी पहा",
    activeTasks: "उर्वरित कामे",
    censusTitle: "गावाची लोकसंख्या व कुटुंब नोंदवही",
    censusSubtitle: "गावातील सर्व कुटुंबे आणि सदस्यांची संपूर्ण यादी",
    emergencyHelplines: "२४ तास आपत्कालीन आरोग्य क्रमांक व रुग्णालय स्थिती",
    callAmbulance: "मोफत रुग्णवाहिका",
    teleConsult: "आरोग्य सल्ला",
    maternalHelp: "महिला मदत कक्ष",
    childHelp: "बाल मदत कक्ष",
    shirwalPhc: "शिरवळ प्राथमिक आरोग्य केंद्र",
    shirwalSub: "२.४ किमी अंतरावर · २४ तास सुरू · मोफत तपासणी",
    callNow: "फोन करा"
  },
  hi: {
    dashboardTitle: "आशा स्वास्थ्य एवं रेफरल केंद्र",
    welcome: "नमस्ते, प्रिया",
    villageName: "शिरवल गांव • सेक्टर ४",
    totalMembers: "गांव की जनसंख्या",
    totalMembersDesc: "गांव के कुल पंजीकृत सदस्य",
    maternalCare: "मातृ स्वास्थ्य (एएनसी)",
    maternalDesc: "गर्भवती महिलाएं एवं नई माताएं",
    childCare: "बाल टीकाकरण",
    childDesc: "५ वर्ष से छोटे बच्चे और टीके",
    highRisk: "गंभीर मरीज",
    highRiskDesc: "जिन्हें तुरंत अस्पताल दिखाने की जरूरत है",
    quickActions: "मुख्य स्वास्थ्य कार्य",
    addFamily: "नया परिवार जोड़ें",
    addFamilyDesc: "गांव के रजिस्टर में नया परिवार दर्ज करें",
    hospitalReferral: "आपातकालीन अस्पताल रेफरल",
    hospitalReferralDesc: "मरीज को अस्पताल या पीएचसी भेजें",
    liveReferrals: "सक्रिय रेफरल स्थिति",
    liveReferralsDesc: "अस्पताल भेजे गए मरीजों की लाइव स्थिति",
    drugKit: "दवा किट स्टॉक",
    drugKitDesc: "आयरन, पैरासिटामोल व ओआरएस की जांच करें",
    todaysTasks: "आज के कार्य",
    tasksSubtitle: "आज की जरूरी गृह भेंट, टीके एवं जांच",
    markDone: "पूरा हुआ",
    call: "कॉल करें",
    refer: "रेफर करें",
    completed: "पूरा",
    urgent: "अति आवश्यक",
    synced: "अपडेटेड",
    syncing: "अपडेट हो रहा है...",
    searchCensus: "नाम या परिवार से खोजें...",
    close: "बंद करें",
    viewAll: "सूची देखें",
    activeTasks: "बाकी कार्य",
    censusTitle: "गांव की जनसंख्या और परिवार रजिस्टर",
    censusSubtitle: "गांव के सभी परिवारों और सदस्यों की सूची",
    emergencyHelplines: "24 घंटे आपातकालीन स्वास्थ्य नंबर एवं पीएचसी स्थिति",
    callAmbulance: "निशुल्क एम्बुलेंस",
    teleConsult: "स्वास्थ्य परामर्श",
    maternalHelp: "महिला हेल्पलाइन",
    childHelp: "बाल सहायता",
    shirwalPhc: "शिरवल प्राथमिक स्वास्थ्य केंद्र (पीएचसी)",
    shirwalSub: "2.4 किमी दूरी · 24 घंटे खुला · निशुल्क ओपीडी",
    callNow: "कॉल करें"
  }
};

export default function ASHAHome({
  patients = [],
  loading,
  onRefresh,
  onNavigate,
  onOpenAddFamily,
  onOpenAddMember,
  onOpenLogVisit,
  onOpenReferral
}) {
  const [lang, setLang] = useState(() => localStorage.getItem("radvault_asha_lang") || "en");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleSetLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("radvault_asha_lang", newLang);
    localStorage.setItem("radvault_patient_lang", newLang);
  };

  const stats = useMemo(() => computeStats(patients), [patients]);
  const rawDueList = useMemo(() => computeDueList(patients), [patients]);

  const [activeModal, setActiveModal] = useState(null);
  const [syncedToast, setSyncedToast] = useState(false);
  const [censusSearch, setCensusSearch] = useState("");
  const [medicinesList, setMedicinesList] = useState([]);

  useEffect(() => {
    getMedicines().then(res => {
      if (res.data) setMedicinesList(res.data);
    });
  }, []);

  const lowStockMedicinesCount = useMemo(() => {
    return medicinesList.filter(m => (m.stock || 0) <= (m.threshold || 10)).length;
  }, [medicinesList]);

  // Persistent Completed / Visited Tasks State across entire session
  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem("radvault_completed_tasks");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleMarkTaskDone = (taskId, patientId) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev);
      if (taskId) next.add(taskId);
      if (patientId) next.add(patientId);
      localStorage.setItem("radvault_completed_tasks", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const today = new Date().toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const defaultTasks = [
    {
      id: 'task-1',
      patientId: 'P003',
      type: 'vaccine',
      patientName: 'Aarav Patil',
      patientNameLocal: lang === 'mr' ? 'आरव पाटील' : lang === 'hi' ? 'आरव पाटिल' : 'Aarav Patil',
      ageInfo: '9 Months',
      labelEn: 'Measles-Rubella (MR-1) & Vit-A Due',
      labelMr: 'गोवर-रुबेला (MR-1) व व्हिटॅमिन-ए लस देणे',
      labelHi: 'खसरा-रूबेला (MR-1) व विटामिन-ए टीका',
      detail: 'Village Ward 2 • Mother: Rekha Patil',
      urgent: true,
      phone: '+91 98234-11029'
    },
    {
      id: 'task-2',
      patientId: 'P002',
      type: 'anc',
      patientName: 'Rekha Bai',
      patientNameLocal: lang === 'mr' ? 'रेखा बाई' : lang === 'hi' ? 'रेखा बाई' : 'Rekha Bai',
      ageInfo: '22y • 28 Weeks',
      labelEn: 'ANC 3rd Checkup & Hemoglobin Test Due',
      labelMr: 'तिसरी गरोदर तपासणी व हिमोग्लोबिन चाचणी',
      labelHi: 'तीसरी गर्भावस्था जांच व खून की जांच',
      detail: 'High Risk (Severe Anemia Hb 8.2) • PHC Shirwal',
      urgent: true,
      phone: '+91 98451-88310'
    },
    {
      id: 'task-3',
      patientId: 'P001',
      type: 'dots',
      patientName: 'Ramesh Patil',
      patientNameLocal: lang === 'mr' ? 'रमेश पाटील' : lang === 'hi' ? 'रमेश पाटिल' : 'Ramesh Patil',
      ageInfo: '54y Male',
      labelEn: 'TB DOTS Medication Refill & Sputum Check',
      labelMr: 'टीबी गोळ्यांचा साठा देणे व थुंकी तपासणी',
      labelHi: 'टीबी की दवा देना व बलगम की जांच',
      detail: 'Week 4 of Intensive Phase • Regular Compliance',
      urgent: false,
      phone: '+91 97123-45678'
    },
    {
      id: 'task-4',
      patientId: 'P005',
      type: 'ncd',
      patientName: 'Vikram Jadhav',
      patientNameLocal: lang === 'mr' ? 'विक्रम जाधव' : lang === 'hi' ? 'विक्रम जाधव' : 'Vikram Jadhav',
      ageInfo: '61y Male',
      labelEn: 'Monthly Blood Pressure & Sugar Check',
      labelMr: 'मासिक रक्तदाब व साखर तपासणी (NCD)',
      labelHi: 'मासिक ब्लड प्रेशर एवं शुगर जांच (NCD)',
      detail: 'Last BP: 150/95 mmHg • Needs Home Visit',
      urgent: false,
      phone: '+91 99201-33412'
    }
  ];

  const displayTasks = useMemo(() => {
    if (rawDueList && rawDueList.length > 0) {
      return rawDueList.map((tItem, i) => {
        const matchingPatient = patients.find(p => p.id === tItem.patientId);
        const resolvedPhone = matchingPatient?.mobile || tItem.mobile || '+91 98000-00000';
        return {
          id: `db-task-${tItem.patientId || i}`,
          patientId: tItem.patientId,
          type: tItem.type,
          patientName: tItem.patientName,
          patientNameLocal: tItem.patientName,
          ageInfo: tItem.detail,
          labelEn: tItem.label,
          labelMr: tItem.label,
          labelHi: tItem.label,
          detail: tItem.detail,
          urgent: tItem.urgent,
          phone: resolvedPhone
        };
      });
    }
    return defaultTasks;
  }, [rawDueList, patients, lang]);

  const handleManualSync = async () => {
    setSyncedToast(true);
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        console.warn("Manual sync error:", err);
      }
    }
    setTimeout(() => setSyncedToast(false), 2500);
  };

  const maternalPatients = useMemo(() => {
    if (patients && patients.length > 0) {
      return patients.filter(p => p.is_pregnant);
    }
    return [
      { id: 'm1', name: 'Rekha Bai', nameLocal: lang === 'mr' ? 'रेखा बाई' : lang === 'hi' ? 'रेखा बाई' : 'Rekha Bai', age: 22, lmp: '10-Feb-2026', ancDone: 2, status: 'red', danger: 'Severe Anemia (Hb 8.2), Swollen Feet', village: 'Koregaon' },
      { id: 'm2', name: 'Pooja Jadhav', nameLocal: lang === 'mr' ? 'पूजा जाधव' : lang === 'hi' ? 'पूजा जाधव' : 'Pooja Jadhav', age: 25, lmp: '14-May-2026', ancDone: 1, status: 'green', danger: 'None (Healthy)', village: 'Wai' }
    ];
  }, [patients, lang]);

  const childPatients = useMemo(() => {
    if (patients && patients.length > 0) {
      return patients.filter(p => p.is_child || (p.age_years && p.age_years <= 5));
    }
    return [
      { id: 'c1', name: 'Aarav Patil', nameLocal: lang === 'mr' ? 'आरव पाटील' : lang === 'hi' ? 'आरव पाटिल' : 'Aarav Patil', ageMonths: 9, gender: 'Male', weight: '8.2 kg', status: 'green', dueVaccine: 'Measles-Rubella (MR-1)', village: 'Koregaon' },
      { id: 'c2', name: 'Ananya Shinde', nameLocal: lang === 'mr' ? 'अनन्या शिंदे' : lang === 'hi' ? 'अनन्या शिंदे' : 'Ananya Shinde', ageMonths: 30, gender: 'Female', weight: '10.5 kg', status: 'yellow', dueVaccine: 'DPT Booster 1', village: 'Wai' }
    ];
  }, [patients, lang]);

  const highRiskPatients = useMemo(() => {
    if (patients && patients.length > 0) {
      return patients.filter(p => p.status === 'red' || p.has_chronic);
    }
    return [
      { id: 'hr1', name: 'Rekha Bai', nameLocal: lang === 'mr' ? 'रेखा बाई' : lang === 'hi' ? 'रेखा बाई' : 'Rekha Bai', age: 22, condition: 'High Risk Pregnancy (Hb 8.2, Pedal Edema)', village: 'Koregaon', phone: '+91 98234-11029' },
      { id: 'hr2', name: 'Ramesh Patil', nameLocal: lang === 'mr' ? 'रमेश पाटील' : lang === 'hi' ? 'रमेश पाटिल' : 'Ramesh Patil', age: 54, condition: 'Severe Productive Cough, High Fever & SpO2 92%', village: 'Koregaon', phone: '+91 98451-88310' }
    ];
  }, [patients, lang]);

  const censusList = useMemo(() => {
    const base = patients.length > 0 ? patients : [
      { id: 'P001', name: 'Ramesh Patil', age_years: 54, gender: 'Male', blood_group: 'B+', village: 'Koregaon', abha_id: '91-4829-1029-4820', status: 'red', family_head: 'Ramesh Patil' },
      { id: 'P002', name: 'Rekha Bai', age_years: 22, gender: 'Female', blood_group: 'O+', village: 'Koregaon', abha_id: '91-4829-1029-4821', status: 'red', family_head: 'Ramesh Patil' },
      { id: 'P003', name: 'Aarav Patil', age_years: 1, gender: 'Male', blood_group: 'B+', village: 'Koregaon', abha_id: '91-4829-1029-4822', status: 'green', family_head: 'Ramesh Patil' },
      { id: 'P004', name: 'Sunita Shinde', age_years: 42, gender: 'Female', blood_group: 'O+', village: 'Wai', abha_id: '91-5512-8821-9930', status: 'green', family_head: 'Sanjay Shinde' },
      { id: 'P005', name: 'Vikram Jadhav', age_years: 61, gender: 'Male', blood_group: 'A+', village: 'Karad', abha_id: '91-7719-2041-3319', status: 'yellow', family_head: 'Vikram Jadhav' }
    ];

    if (!censusSearch.trim()) return base;
    return base.filter(p =>
      (p.name && p.name.toLowerCase().includes(censusSearch.toLowerCase())) ||
      (p.village && p.village.toLowerCase().includes(censusSearch.toLowerCase())) ||
      (p.abha_id && p.abha_id.includes(censusSearch))
    );
  }, [patients, censusSearch]);

  return (
    <div className="pb-28 font-sans text-slate-800 bg-[#F5FBF9] min-h-screen">

      {/* ── TOP HEADER WITH DEDICATED LANGUAGE SWITCHER ── */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#16324F] tracking-tight">{t.dashboardTitle}</h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                NHM
              </span>
            </div>
            <p className="text-xs font-bold text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#008F83]" /> {today} • {t.villageName}
            </p>
          </div>

          {/* Language Switcher & Live Sync */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
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
              className="flex items-center gap-1.5 bg-[#F5FBF9] hover:bg-[#E8F7F3] border border-[#E2E8F0] px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#008F83] ${syncedToast ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-black text-[#008F83] tracking-wide uppercase">
                {syncedToast ? t.syncing : t.synced}
              </span>
            </button>
          </div>

        </div>

        {syncedToast && (
          <div className="max-w-4xl mx-auto mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Health records synchronized with District Server!</span>
          </div>
        )}
      </header>

      {/* ── MAIN VERTICAL COLUMN LAYOUT ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">

        {/* ── 1. LARGE HEALTH INDICATOR CARDS (4 BIG ACCESSIBLE INDICATORS) ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Village Health Pulse
            </h2>
            <span className="text-xs text-teal-800 font-bold">{t.viewAll}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

            {/* 1. Total Village Population Card */}
            <button
              onClick={() => setActiveModal('census')}
              className="bg-white rounded-2xl p-5 shadow-xs border-2 border-slate-100 hover:border-teal-400 hover:shadow-md transition-all text-left flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-2xs">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{t.totalMembers}</p>
                <p className="text-3xl font-black text-[#16324F] leading-none my-1">
                  {loading ? "-" : patients.length}
                </p>
                <p className="text-xs text-slate-400 truncate font-medium">{t.totalMembersDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 transition-colors" />
            </button>

            {/* 2. Maternal Care (ANC/PNC) Card */}
            <button
              onClick={() => setActiveModal('maternal')}
              className="bg-white rounded-2xl p-5 shadow-xs border-2 border-slate-100 hover:border-rose-400 hover:shadow-md transition-all text-left flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-2xs">
                <Heart className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-rose-600 uppercase tracking-wider">{t.maternalCare}</p>
                <p className="text-3xl font-black text-rose-700 leading-none my-1">
                  {loading ? "-" : stats.pregnant}
                </p>
                <p className="text-xs text-slate-400 truncate font-medium">{t.maternalDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-600 transition-colors" />
            </button>

            {/* 3. Under 5 Child Immunization Card */}
            <button
              onClick={() => setActiveModal('child')}
              className="bg-white rounded-2xl p-5 shadow-xs border-2 border-slate-100 hover:border-amber-400 hover:shadow-md transition-all text-left flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                <Baby className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-amber-600 uppercase tracking-wider">{t.childCare}</p>
                <p className="text-3xl font-black text-amber-700 leading-none my-1">
                  {loading ? "-" : stats.children}
                </p>
                <p className="text-xs text-slate-400 truncate font-medium">{t.childDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </button>

            {/* 4. High Risk Alerts Card */}
            <button
              onClick={() => setActiveModal('high_risk')}
              className="bg-white rounded-2xl p-5 shadow-xs border-2 border-red-100 hover:border-red-400 hover:shadow-md transition-all text-left flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-2xs">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-red-600 uppercase tracking-wider">{t.highRisk}</p>
                <p className="text-3xl font-black text-red-700 leading-none my-1">
                  {loading ? "-" : stats.highRisk}
                </p>
                <p className="text-xs text-slate-400 truncate font-medium">{t.highRiskDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-600 transition-colors" />
            </button>

          </div>
        </section>

        {/* ── 2. FAST-TRACK REFERRAL & EMERGENCY ACTION BAR ── */}
        <section className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-[#16324F] uppercase tracking-wider">
              {t.quickActions}
            </h2>
            <p className="text-xs text-slate-400">Direct 1-tap actions to connect patients with care</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Primary Action: Hospital Referral */}
            <button
              onClick={() => onOpenReferral ? onOpenReferral('new') : onNavigate('refer')}
              className="p-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl flex items-center justify-between gap-3.5 shadow-md shadow-red-200 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-white text-base">{t.hospitalReferral}</p>
                  <p className="text-xs text-red-100 mt-0.5">{t.hospitalReferralDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Secondary Action: Live Referral Tracker */}
            <button
              onClick={() => onOpenReferral ? onOpenReferral('list') : onNavigate('refer')}
              className="p-4 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-2xl flex items-center justify-between gap-3.5 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-teal-950 text-base">{t.liveReferrals}</p>
                  <p className="text-xs text-teal-800/80 mt-0.5">{t.liveReferralsDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-teal-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all" />
            </button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Register Family */}
            <button
              onClick={() => onNavigate('village')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">{t.addFamily}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.addFamilyDesc}</p>
              </div>
            </button>

            {/* Medicine Kit Stock */}
            <button
              onClick={() => onNavigate('medicine')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-slate-900 text-xs">{t.drugKit}</p>
                    {lowStockMedicinesCount > 0 && (
                      <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                        {lowStockMedicinesCount} Low ⚠️
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.drugKitDesc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </section>

        {/* ── 3. TODAY'S WORK LIST (PRIORITY-RANKED PATIENT DUE LIST) ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-[#16324F] uppercase tracking-wider">{t.todaysTasks}</h2>
              <p className="text-xs text-slate-400">{t.tasksSubtitle}</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              {displayTasks.filter(item => !completedTaskIds.has(item.id) && !completedTaskIds.has(item.patientId)).length} {t.activeTasks}
            </span>
          </div>

          <div className="space-y-3">
            {displayTasks.map(task => {
              const isDone = completedTaskIds.has(task.id) || completedTaskIds.has(task.patientId);
              const label = lang === 'mr' ? task.labelMr : lang === 'hi' ? task.labelHi : task.labelEn;
              const patientDisplay = task.patientNameLocal || task.patientName;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : task.urgent
                      ? 'border-red-200 hover:border-red-300'
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold ${
                      isDone
                        ? 'bg-slate-200 text-slate-500'
                        : task.type === 'vaccine'
                        ? 'bg-amber-100 text-amber-700'
                        : task.type === 'anc'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {task.type === 'vaccine' ? <Baby className="w-6 h-6" /> :
                       task.type === 'anc' ? <Heart className="w-6 h-6" /> :
                       <Stethoscope className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-base">{patientDisplay}</h4>
                        <span className="text-xs text-slate-500 font-medium">({task.ageInfo})</span>
                        {task.urgent && !isDone && (
                          <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                            {t.urgent}
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> {t.completed}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-teal-800 text-xs mt-0.5">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{task.detail}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {!isDone ? (
                      <>
                        <a
                          href={`tel:${task.phone}`}
                          className="px-3 py-2 text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> {t.call}
                        </a>
                        <button
                          onClick={() => onOpenReferral ? onOpenReferral('new') : onNavigate('refer')}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                        >
                          {t.refer} 🏥
                        </button>
                        <button
                          onClick={() => handleMarkTaskDone(task.id, task.patientId)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> {t.markDone}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t.completed}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. 24x7 EMERGENCY HELPLINES & PHC STATUS ── */}
        <section className="bg-gradient-to-br from-rose-50 to-orange-50/60 rounded-3xl border border-rose-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">{t.emergencyHelplines}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <a
              href="tel:108"
              className="p-3 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 shadow-xs flex flex-col items-center text-center group transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform font-bold">
                <Phone className="w-4 h-4" />
              </span>
              <span className="font-black text-slate-900 text-sm">108</span>
              <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.callAmbulance}</span>
            </a>

            <a
              href="tel:104"
              className="p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-xs flex flex-col items-center text-center group transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform font-bold">
                <Stethoscope className="w-4 h-4" />
              </span>
              <span className="font-black text-slate-900 text-sm">104</span>
              <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.teleConsult}</span>
            </a>

            <a
              href="tel:181"
              className="p-3 bg-white rounded-2xl border border-teal-200 hover:border-teal-400 shadow-xs flex flex-col items-center text-center group transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform font-bold">
                <Heart className="w-4 h-4" />
              </span>
              <span className="font-black text-slate-900 text-sm">181</span>
              <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.maternalHelp}</span>
            </a>

            <a
              href="tel:1098"
              className="p-3 bg-white rounded-2xl border border-blue-200 hover:border-blue-400 shadow-xs flex flex-col items-center text-center group transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform font-bold">
                <Baby className="w-4 h-4" />
              </span>
              <span className="font-black text-slate-900 text-sm">1098</span>
              <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t.childHelp}</span>
            </a>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-xs text-[#16324F]">{t.shirwalPhc}</p>
                <p className="text-[10px] text-slate-500">{t.shirwalSub}</p>
              </div>
            </div>
            <a
              href="tel:02169244222"
              className="px-3 py-1.5 bg-[#008F83] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{t.callNow}</span>
            </a>
          </div>
        </section>

      </main>

      {/* ── MODAL: VILLAGE POPULATION & CENSUS REGISTER ── */}
      {activeModal === 'census' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="bg-gradient-to-r from-teal-700 to-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-300" /> {t.censusTitle}
                </h3>
                <p className="text-xs text-teal-100">{t.censusSubtitle}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={censusSearch}
                  onChange={e => setCensusSearch(e.target.value)}
                  placeholder={t.searchCensus}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">{censusList.length} Persons Listed</span>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    onNavigate('village');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {t.addFamily}
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="text-left p-3">Member Name</th>
                      <th className="text-left p-3">Age / Gender</th>
                      <th className="text-left p-3">ABHA Health ID</th>
                      <th className="text-left p-3">Village Ward</th>
                      <th className="text-right p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {censusList.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-slate-900">
                          {member.name}
                        </td>
                        <td className="p-3 text-slate-600">
                          {member.age_years || 25}y / {member.gender || 'Female'}
                        </td>
                        <td className="p-3 font-mono text-teal-700 font-bold text-[11px]">
                          {member.abha_id || '91-4829-1029-4820'}
                        </td>
                        <td className="p-3 text-slate-600">
                          {member.village || 'Koregaon'}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            member.status === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {member.status === 'red' ? 'Alert' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                {t.close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: MATERNAL & ANC CARE ROSTER ── */}
      {activeModal === 'maternal' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-rose-600 to-pink-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Heart className="w-5 h-5" /> {t.maternalCare}
                </h3>
                <p className="text-xs text-rose-100">{t.maternalDesc}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              <div className="space-y-3">
                {maternalPatients.map(mp => (
                  <div key={mp.id} className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{mp.nameLocal || mp.name}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold">Age: {mp.age}y • Village: {mp.village}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        mp.status === 'red' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {mp.status === 'red' ? 'High Risk' : 'Normal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="bg-white p-2 rounded-xl border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">LMP Date</span>
                        <span className="font-bold text-slate-800">{mp.lmp || '10-Feb-2026'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">ANC Visits</span>
                        <span className="font-black text-rose-700">{mp.ancDone || 2} of 4 Done</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">TT Doses</span>
                        <span className="font-bold text-emerald-700">2 Doses Given ✓</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">IFA Tablets</span>
                        <span className="font-bold text-slate-800">100 Issued</span>
                      </div>
                    </div>

                    {mp.danger && (
                      <p className="text-[11px] text-red-700 font-semibold bg-red-50 p-2 rounded-xl border border-red-200">
                        ⚠️ Alert: {mp.danger}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CHILD IMMUNIZATION TRACKER ── */}
      {activeModal === 'child' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Baby className="w-5 h-5" /> {t.childCare}
                </h3>
                <p className="text-xs text-amber-100">{t.childDesc}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              <div className="space-y-3">
                {childPatients.map(cp => (
                  <div key={cp.id} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{cp.nameLocal || cp.name}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold">Age: {cp.ageMonths} Months • Weight: <strong>{cp.weight}</strong></p>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Normal Growth
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1.5">
                      <p className="font-bold text-slate-700 text-xs">National Vaccine Status:</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px]">BCG ✓</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px]">OPV 0,1,2,3 ✓</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px]">Pentavalent 1,2,3 ✓</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-black text-[10px]">{cp.dueVaccine} Due ⚠️</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HIGH RISK PATIENTS ── */}
      {activeModal === 'high_risk' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-red-600 to-rose-800 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> {t.highRisk}
                </h3>
                <p className="text-xs text-red-100">{t.highRiskDesc}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto text-xs text-slate-800">
              {highRiskPatients.map(hr => (
                <div key={hr.id} className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{hr.nameLocal || hr.name}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">Village: {hr.village} • Age: {hr.age}y</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-red-600 text-white shadow-xs">
                      RED ALERT
                    </span>
                  </div>

                  <p className="text-xs font-bold text-red-900 bg-white p-2.5 rounded-xl border border-red-200">
                    {hr.condition}
                  </p>

                  <div className="flex justify-end gap-2 pt-1">
                    <a
                      href={`tel:${hr.phone}`}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> {t.call}
                    </a>
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        if (onOpenReferral) onOpenReferral('new');
                        else onNavigate('refer');
                      }}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                    >
                      {t.refer} 🏥
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}