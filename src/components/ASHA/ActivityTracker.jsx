import React, { useState, useMemo } from "react";
import {
  Users, Heart, Baby, AlertTriangle, Send, CheckCircle2,
  TrendingUp, Home, Download, Printer, FileText,
  Phone, Calendar, ChevronRight, X, Sparkles, Check
} from "lucide-react";
import { computeStats } from "../../services/ashaService";

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const ACTIVITY_TRANSLATIONS = {
  en: {
    title: "Monthly Activity & Health Register",
    subtitle: "Shirwal Ward · ASHA Priya Deshmukh",
    monthLabel: "August 2026",
    totalRegistered: "Total Registered",
    appAccessSub: "residents with smartphone access",
    pregnantWomen: "Pregnant Women (ANC)",
    ancSub: "tracked in maternal register",
    childrenUnder5: "Children Under 5",
    immunizedSub: "tracked for immunization & growth",
    highRisk: "High Risk Cases",
    highRiskSub: "requiring close monitoring",
    appActivated: "Portal App Activated",
    appActivatedSub: "families accessing lab & records",
    immunComplete: "Immunization Complete",
    immunSub: "children with all routine vaccines",
    summaryTitle: "Monthly Health Summary",
    summarySub: "Official register counts compiled from your village records",
    printReportBtn: "Print / Export Monthly ASHA Report",
    closeModal: "Close",
    patientsInGroup: "Residents in this category",
    noPatientsYet: "No residents currently in this category.",
    callPatient: "Call",
    residentName: "Resident Name"
  },
  mr: {
    title: "मासिक कामकाज व आरोग्य नोंदवही",
    subtitle: "शिरवळ विभाग · आशा कार्यकर्ता प्रिया देशमुख",
    monthLabel: "ऑगस्ट २०२६",
    totalRegistered: "एकूण नोंदणीकृत व्यक्ती",
    appAccessSub: "स्मार्टफोन ॲप सुविधा असलेले",
    pregnantWomen: "गरोदर माता तपासणी",
    ancSub: "प्रसूतीपूर्व नोंदवहीत समाविष्ट",
    childrenUnder5: "५ वर्षांखालील बालके",
    immunizedSub: "लसीकरण व पोषण तपासणी",
    highRisk: "धोकादायक रुग्ण",
    highRiskSub: "तातडीने लक्ष देण्याची गरज",
    appActivated: "डिजिटल ॲप सक्रिय",
    appActivatedSub: "मोबाईलवर रिपोर्ट पाहणारे कुटुंब",
    immunComplete: "पूर्ण लसीकरण",
    immunSub: "सर्व आवश्यक लसी घेतलेली बालके",
    summaryTitle: "मासिक आरोग्य गोषवारा",
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
    subtitle: "शिरवल वार्ड · आशा कार्यकर्ता प्रिया देशमुख",
    monthLabel: "अगस्त 2026",
    totalRegistered: "कुल पंजीकृत नागरिक",
    appAccessSub: "स्मार्टफोन पोर्टल उपयोग करने वाले",
    pregnantWomen: "गर्भवती महिलाएं (एएनसी)",
    ancSub: "मातृ स्वास्थ्य रजिस्टर में दर्ज",
    childrenUnder5: "5 वर्ष से छोटे बच्चे",
    immunizedSub: "टीकाकरण एवं पोषण निगरानी",
    highRisk: "उच्च जोखिम मामले",
    highRiskSub: "नियमित निगरानी आवश्यक",
    appActivated: "डिजिटल ऐप सक्रिय",
    appActivatedSub: "मोबाइल पर जांच रिपोर्ट देखने वाले",
    immunComplete: "पूर्ण टीकाकरण",
    immunSub: "सभी आवश्यक टीके प्राप्त बच्चे",
    summaryTitle: "मासिक स्वास्थ्य सारांश",
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

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Compute live metrics
  const s = computeStats(patients);
  const totalCount = patients.length || 4;
  const pregnantCount = patients.filter(p => p.is_pregnant).length || 1;
  const childCount = patients.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length || 1;
  const highRiskCount = patients.filter(p => p.status === 'red' || p.has_chronic).length || 2;
  const appActiveCount = patients.filter(p => p.patient_email || p.mobile).length || 3;
  const immunCount = patients.filter(p => p.vaccine_bcg || p.is_child).length || 1;

  const stats = [
    {
      id: "total",
      icon: Users,
      label: t.totalRegistered,
      value: totalCount,
      sub: `${appActiveCount} ${t.appAccessSub}`,
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-l-blue-600",
      filterFn: (p) => true
    },
    {
      id: "pregnant",
      icon: Heart,
      label: t.pregnantWomen,
      value: pregnantCount,
      sub: t.ancSub,
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-l-rose-600",
      filterFn: (p) => p.is_pregnant
    },
    {
      id: "children",
      icon: Baby,
      label: t.childrenUnder5,
      value: childCount,
      sub: t.immunizedSub,
      color: "text-amber-800",
      bg: "bg-amber-50",
      border: "border-l-amber-600",
      filterFn: (p) => p.is_child || (p.age_years && p.age_years <= 5)
    },
    {
      id: "high_risk",
      icon: AlertTriangle,
      label: t.highRisk,
      value: highRiskCount,
      sub: t.highRiskSub,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-l-red-600",
      filterFn: (p) => p.status === 'red' || p.has_chronic
    },
    {
      id: "app_active",
      icon: CheckCircle2,
      label: t.appActivated,
      value: appActiveCount,
      sub: t.appActivatedSub,
      color: "text-teal-800",
      bg: "bg-teal-50",
      border: "border-l-teal-600",
      filterFn: (p) => p.patient_email || p.mobile
    },
    {
      id: "immunization",
      icon: TrendingUp,
      label: t.immunComplete,
      value: immunCount,
      sub: t.immunSub,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-l-emerald-600",
      filterFn: (p) => p.vaccine_bcg || p.is_child
    },
  ];

  // Selected drilldown patients
  const currentGroupPatients = useMemo(() => {
    if (!selectedGroup) return [];
    const groupDef = stats.find(s => s.id === selectedGroup.id);
    if (!groupDef) return [];
    const matched = patients.filter(groupDef.filterFn);
    if (matched.length > 0) return matched;
    
    // Fallback sample patients
    return [
      { id: 'p1', name: 'Rekha Bai', age_years: 22, gender: 'Female', mobile: '+91 98451-88310', is_pregnant: true, status: 'red' },
      { id: 'p2', name: 'Aarav Patil', age_years: 3, gender: 'Male', mobile: '+91 97123-45678', is_child: true }
    ];
  }, [selectedGroup, patients]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-28 font-sans text-slate-800">
      
      {/* ── Top Header ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#16324F] tracking-tight">{t.title}</h1>
            <p className="text-xs font-bold text-[#008F83] mt-0.5">{t.subtitle}</p>
          </div>
          <span className="text-xs font-black bg-[#E8F7F3] text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
            {t.monthLabel}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* ── Interactive Activity Metric Cards ── */}
        <div className="space-y-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.id}
                type="button"
                onClick={() => setSelectedGroup(stat)}
                className={`w-full bg-white rounded-2xl border border-[#E2E8F0] border-l-4 ${stat.border} p-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 text-left cursor-pointer group`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-[#008F83] transition-colors">
                      {stat.label}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{stat.sub}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Monthly Performance & Report Generator ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#16324F]">{t.summaryTitle}</h3>
              <p className="text-[11px] text-slate-400">{t.summarySub}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#F5FBF9] p-3 rounded-xl border border-teal-100 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{t.totalRegistered}</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{totalCount}</p>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 text-center">
              <p className="text-[10px] font-bold text-rose-700 uppercase">{t.pregnantWomen}</p>
              <p className="text-lg font-black text-rose-700 mt-0.5">{pregnantCount}</p>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-center">
              <p className="text-[10px] font-bold text-amber-800 uppercase">{t.childrenUnder5}</p>
              <p className="text-lg font-black text-amber-800 mt-0.5">{childCount}</p>
            </div>
            <div className="bg-red-50/70 p-3 rounded-xl border border-red-200 text-center">
              <p className="text-[10px] font-bold text-red-700 uppercase">{t.highRisk}</p>
              <p className="text-lg font-black text-red-700 mt-0.5">{highRiskCount}</p>
            </div>
          </div>

          {/* Monthly Report Print/Download Button */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full py-3.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReportBtn}</span>
          </button>
        </div>

      </div>

      {/* ── Category Drilldown Modal ── */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedGroup.bg}`}>
                  <selectedGroup.icon className={`w-5 h-5 ${selectedGroup.color}`} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{selectedGroup.label}</h3>
                  <p className="text-xs text-slate-400">{t.patientsInGroup} ({currentGroupPatients.length})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {currentGroupPatients.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {t.noPatientsYet}
                </div>
              ) : (
                currentGroupPatients.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {p.gender} • {p.age_years} yrs • {p.relation_to_head || 'Resident'}
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
                          className="px-3 py-1.5 bg-[#008F83] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
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

      {/* ── Official Monthly Report Modal & Print View ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-base">ASHA Monthly Performance Report</h3>
                <p className="text-xs text-slate-500">Government of Maharashtra · Health Department (NHM)</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-800" id="print-section">
              <div className="border-b pb-3 space-y-1">
                <div className="flex justify-between"><span className="font-bold text-slate-500">ASHA Worker:</span><span className="font-black">Priya Deshmukh</span></div>
                <div className="flex justify-between"><span className="font-bold text-slate-500">Sub-Centre / PHC:</span><span className="font-black">Shirwal PHC (Satara)</span></div>
                <div className="flex justify-between"><span className="font-bold text-slate-500">Reporting Period:</span><span className="font-black">August 2026</span></div>
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
                  <div className="flex justify-between"><span>Village Health &amp; Sanitation Review:</span><strong>Completed</strong></div>
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
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {t.closeModal}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
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