import React, { useState, useEffect, useCallback } from "react";
import {
  Phone, ClipboardList, CheckCircle2, AlertTriangle, Check,
  User, MapPin, ArrowRight, ShieldAlert, Sparkles, Heart, Baby,
  Loader2, RefreshCw
} from "lucide-react";
import { computeDueList, getDoctorFollowUps, completeFollowUp } from "../../services/ashaService";

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const FOLLOWUP_TRANSLATIONS = {
  en: {
    title: "High-Risk Follow-Up Register",
    subtitle: "Critical village residents needing urgent home visits or care",
    allClearTitle: "All high-risk follow-ups are up to date!",
    allClearSub: "No urgent high-risk cases pending right now in your ward.",
    visitedBadge: "Visited",
    highRiskBadge: "High Risk",
    logVisitBtn: "Log Health Visit",
    markVisitedBtn: "Mark Visited",
    callBtn: "Call Patient",
    doneMessage: "Home visit completed & recorded for this patient",
    anemiaTitle: "Severe Anemia & Swollen Feet (ANC)",
    anemiaDetail: "28 Weeks Pregnant • Needs hemoglobin monitoring & iron tablets",
    feverTitle: "Persistent High Fever & Low SpO₂",
    feverDetail: "Chest infection suspected • Home vitals check needed"
  },
  mr: {
    title: "धोकादायक रुग्ण तपासणी नोंदवही",
    subtitle: "तातडीने गृहभेटी व तपासणी आवश्यक असणाऱ्या रुग्णांची यादी",
    allClearTitle: "सर्व तातडीच्या गृहभेटी पूर्ण झाल्या आहेत!",
    allClearSub: "सध्या तुमच्या विभागात कोणताही गंभीर रुग्ण प्रलंबित नाही.",
    visitedBadge: "भेट पूर्ण",
    highRiskBadge: "धोकादायक",
    logVisitBtn: "गृहभेट नोंदवा",
    markVisitedBtn: "भेट पूर्ण झाली",
    callBtn: "फोन करा",
    doneMessage: "या रुग्णाची गृहभेट पूर्ण झाली असून नोंद झाली आहे",
    anemiaTitle: "तीव्र रक्तक्षय व पायांवर सूज (गरोदर माता)",
    anemiaDetail: "२८ आठवडे गरोदर • हिमोग्लोबिन तपासणी व आयर्न गोळ्या आवश्यक",
    feverTitle: "सतत ताप व ऑक्सिजन कमतरता",
    feverDetail: "छातीत इन्फेक्शनची शक्यता • तातडीने गृहभेट आवश्यक"
  },
  hi: {
    title: "उच्च जोखिम मरीज निगरानी रजिस्टर",
    subtitle: "तत्काल गृहभेंट एवं स्वास्थ्य जांच हेतु चिन्हित मरीज",
    allClearTitle: "सभी जरूरी गृहभेंट पूर्ण हो चुकी हैं!",
    allClearSub: "वर्तमान में आपके क्षेत्र में कोई गंभीर मामला लंबित नहीं है।",
    visitedBadge: "भेंट पूर्ण",
    highRiskBadge: "उच्च जोखिम",
    logVisitBtn: "गृहभेंट दर्ज करें",
    markVisitedBtn: "भेंट पूर्ण मार्क करें",
    callBtn: "कॉल करें",
    doneMessage: "इस मरीज की गृहभेंट पूर्ण कर ली गई है",
    anemiaTitle: "गंभीर एनीमिया एवं पैरों में सूजन (गर्भवती)",
    anemiaDetail: "28 सप्ताह गर्भावस्था • हीमोग्लोबिन जांच एवं आयरन गोलियां आवश्यक",
    feverTitle: "लगातार तेज बुखार एवं कम ऑक्सीजन",
    feverDetail: "छाती में संक्रमण की आशंका • तत्काल गृहभेंट आवश्यक"
  }
};

export default function FollowUpTracker({ patients, onEditPatient, onLogVisit, demoMode = false }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = FOLLOWUP_TRANSLATIONS[lang] || FOLLOWUP_TRANSLATIONS.en;

  const [doctorFollowUps, setDoctorFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const saved = localStorage.getItem("radvault_completed_tasks");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const loadDoctorFollowUps = useCallback(async (isSilent = false) => {
    if (demoMode) return;
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const { data, error: err } = await getDoctorFollowUps();
      if (err) throw err;
      // getDoctorFollowUps now returns pre-formatted consultation objects
      const mapped = (data || []).map(item => ({
        id: item.id,
        encounterId: item.id,
        patientId: item.patientId || item.patient_id,
        patientName: item.patientName || item.patients?.full_name || 'Village Patient',
        label: `Specialist Follow-Up: ${item.follow_up_date ? new Date(item.follow_up_date).toLocaleDateString('en-IN') : 'Scheduled'}`,
        detail: item.follow_up_reason || 'Specialist consultation follow-up required.',
        mobile: item.patients?.phone_number || '',
        isDoctorFollowUp: true,
        priority: item.priority || 'HIGH'
      }));
      setDoctorFollowUps(mapped);
    } catch (err) {
      console.error('[FollowUpTracker] Failed to load follow-ups:', err);
      setError(`Unable to load doctor follow-ups from Supabase: ${err.message}`);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    loadDoctorFollowUps(false);
  }, [loadDoctorFollowUps]);

  const rawItems = computeDueList(patients).filter(d => d.urgent);

  // Default high-risk residents used ONLY in Demo ON mode
  const defaultItems = [
    {
      patientId: 'P002',
      patientName: 'Rekha Bai',
      label: t.anemiaTitle,
      detail: t.anemiaDetail,
      mobile: '+91 98451-88310',
      is_pregnant: true
    },
    {
      patientId: 'P001',
      patientName: 'Ramesh Patil',
      label: t.feverTitle,
      detail: t.feverDetail,
      mobile: '+91 97123-45678'
    }
  ];

  // In Demo OFF: strict combination of real doctor follow-ups and real village survey items
  // In Demo ON: fallback to defaultItems if empty
  const items = demoMode
    ? (rawItems.length > 0 ? rawItems : defaultItems)
    : [...doctorFollowUps, ...rawItems];

  const handleMarkVisited = async (item) => {
    const pId = typeof item === 'object' ? item.patientId : item;
    const encId = typeof item === 'object' ? item.encounterId : null;

    if (encId && !demoMode) {
      try {
        await completeFollowUp(encId, 'Follow-up visit completed by ASHA worker.');
      } catch (e) {
        console.error('Failed to complete follow up in DB:', e);
      }
    }

    setCompletedSet(prev => {
      const next = new Set(prev);
      if (pId) {
        next.add(pId);
        next.add(`task-${pId}`);
      }
      if (encId) {
        next.add(encId);
        next.add(`enc-${encId}`);
      }
      localStorage.setItem("radvault_completed_tasks", JSON.stringify(Array.from(next)));
      return next;
    });

    if (encId) {
      setDoctorFollowUps(prev => prev.filter(f => f.encounterId !== encId));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-24 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#16324F]">{t.title}</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.subtitle}</p>
          </div>
          <span className="text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full">
            {items.length} {t.highRiskBadge}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-5 space-y-3.5 max-w-3xl mx-auto">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDoctorFollowUps}
              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-7 h-7 text-[#008F83] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-[#008F83] mx-auto mb-3" />
            <p className="font-extrabold text-[#16324F] text-base">{t.allClearTitle}</p>
            <p className="text-xs text-slate-500 mt-1">{t.allClearSub}</p>
          </div>
        ) : (
          items.map((item, i) => {
            const patient = patients.find(p => p.id === item.patientId);
            const isVisited = completedSet.has(item.patientId) || completedSet.has(item.encounterId) || completedSet.has(`task-${item.patientId}`);

            return (
              <div
                key={item.id || i}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  isVisited
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-l-4 border-l-red-500 border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 ${isVisited ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 text-base">{item.patientName}</p>
                        {item.is_pregnant && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <Heart className="w-3 h-3" /> ANC
                          </span>
                        )}
                        {item.isDoctorFollowUp && (
                          <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                            SPECIALIST RX
                          </span>
                        )}
                      </div>

                      {isVisited ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {t.visitedBadge}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                          {t.highRiskBadge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-black text-red-600 mt-1.5">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {!isVisited ? (
                        <>
                          <button
                            onClick={() => {
                              if (onLogVisit && patient) onLogVisit(patient);
                              else if (onEditPatient && patient) onEditPatient(patient);
                              else handleMarkVisited(item);
                            }}
                            className="flex items-center gap-1.5 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>{t.logVisitBtn}</span>
                          </button>
                          
                          <button
                            onClick={() => handleMarkVisited(item)}
                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.markVisitedBtn}</span>
                          </button>

                          {(patient?.mobile || item.mobile) && (
                            <a
                              href={`tel:${patient?.mobile || item.mobile}`}
                              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{t.callBtn}</span>
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                          ✓ {t.doneMessage}
                        </span>
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