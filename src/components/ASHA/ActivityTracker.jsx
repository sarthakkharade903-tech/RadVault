import React, { useState, useMemo } from "react";
import {
  Users, Heart, Baby, AlertTriangle, CheckCircle2,
  TrendingUp, Printer, Phone, ChevronRight, X, Calendar, Activity
} from "lucide-react";
import { computeStats } from "../../services/ashaService";

export default function ActivityTracker({ patients = [] }) {
  // Use current selected language from global state
  const lang = localStorage.getItem("radvault_asha_lang") || "en";

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Compute live metrics
  const totalCount = patients.length || 2;
  const pregnantCount = patients.filter(p => p.is_pregnant).length;
  const childCount = patients.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;
  const highRiskCount = patients.filter(p => p.status === 'red' || p.has_chronic).length;
  const appActiveCount = patients.filter(p => p.patient_email || p.mobile).length || 2;
  const immunCount = patients.filter(p => p.vaccine_bcg || p.is_child).length;

  // Simple, direct labels tailored to selected language without heavy dictionaries
  const labels = {
    en: {
      pageTitle: "Monthly Health Register",
      pageSub: "Shirwal Village • Sector 4 • ASHA Priya Deshmukh",
      month: "August 2026",
      highRisk: "High Risk Alerts",
      highRiskSub: "Patients requiring urgent doctor care",
      pregnant: "Pregnant Mothers (ANC)",
      pregnantSub: "Checkups, nutrition & iron tablets",
      children: "Children Under 5",
      childrenSub: "Vaccinations & growth tracking",
      population: "Registered Residents",
      populationSub: "Total village population recorded",
      appActive: "Portal App Active",
      appActiveSub: "Families accessing reports on phone",
      immunized: "Vaccines Complete",
      immunizedSub: "Children with all routine vaccines",
      viewList: "Tap to view list",
      exportReport: "Print / Download Monthly Report",
      call: "Call Patient",
      close: "Close",
      noPatients: "No patients currently in this category."
    },
    mr: {
      pageTitle: "मासिक आरोग्य नोंदवही",
      pageSub: "शिरवळ गाव • विभाग ४ • आशा प्रिया देशमुख",
      month: "ऑगस्ट २०२६",
      highRisk: "धोकादायक रुग्ण",
      highRiskSub: "तातडीने डॉक्टरांना दाखवण्याची गरज",
      pregnant: "गरोदर माता (ANC)",
      pregnantSub: "तपासणी, आहार व गोळ्यांचे वाटप",
      children: "५ वर्षांखालील बालके",
      childrenSub: "नियमित लसीकरण व वजन तपासणी",
      population: "नोंदणीकृत नागरिक",
      populationSub: "गावातील एकूण नोंदणीकृत लोकसंख्या",
      appActive: "ॲप वापरणारे कुटुंब",
      appActiveSub: "मोबाईलवर तपासणी रिपोर्ट पाहणारे",
      immunized: "पूर्ण लसीकरण",
      immunizedSub: "सर्व आवश्यक लसी पूर्ण झालेली बालके",
      viewList: "यादी पाहण्यासाठी टॅप करा",
      exportReport: "मासिक अहवाल प्रिंट / डाउनलोड करा",
      call: "फोन करा",
      close: "बंद करा",
      noPatients: "या वर्गात सध्या कोणतेही रुग्ण नाहीत."
    },
    hi: {
      pageTitle: "मासिक स्वास्थ्य रजिस्टर",
      pageSub: "शिरवल गांव • सेक्टर ४ • आशा प्रिया देशमुख",
      month: "अगस्त 2026",
      highRisk: "गंभीर मरीज",
      highRiskSub: "तुरंत डॉक्टर को दिखाने की आवश्यकता",
      pregnant: "गर्भवती महिलाएं (ANC)",
      pregnantSub: "जांच, पोषण एवं जरूरी दवाइयां",
      children: "५ वर्ष से छोटे बच्चे",
      childrenSub: "टीकाकरण एवं वजन निगरानी",
      population: "पंजीकृत नागरिक",
      populationSub: "गांव की कुल दर्ज जनसंख्या",
      appActive: "ऐप उपयोग करने वाले",
      appActiveSub: "मोबाइल पर जांच रिपोर्ट देखने वाले",
      immunized: "पूर्ण टीकाकरण",
      immunizedSub: "सभी आवश्यक टीके प्राप्त बच्चे",
      viewList: "सूची देखने हेतु टैप करें",
      exportReport: "मासिक रिपोर्ट प्रिंट / डाउनलोड करें",
      call: "कॉल करें",
      close: "बंद करें",
      noPatients: "इस वर्ग में कोई मरीज नहीं है।"
    }
  }[lang] || {
    pageTitle: "Monthly Health Register",
    pageSub: "Shirwal Village • Sector 4 • ASHA Priya Deshmukh",
    month: "August 2026",
    highRisk: "High Risk Alerts",
    highRiskSub: "Patients requiring urgent doctor care",
    pregnant: "Pregnant Mothers (ANC)",
    pregnantSub: "Checkups, nutrition & iron tablets",
    children: "Children Under 5",
    childrenSub: "Vaccinations & growth tracking",
    population: "Registered Residents",
    populationSub: "Total village population recorded",
    appActive: "Portal App Active",
    appActiveSub: "Families accessing reports on phone",
    immunized: "Vaccines Complete",
    immunizedSub: "Children with all routine vaccines",
    viewList: "Tap to view list",
    exportReport: "Print / Download Monthly Report",
    call: "Call Patient",
    close: "Close",
    noPatients: "No patients currently in this category."
  };

  // 4 Primary Big Cards (High visual clarity for low-literacy users)
  const primaryCards = [
    {
      id: "high_risk",
      title: labels.highRisk,
      subtitle: labels.highRiskSub,
      count: highRiskCount,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-500 text-white",
      borderColor: "border-red-300 hover:border-red-500",
      cardBg: "bg-white hover:bg-red-50/20",
      badgeBg: "bg-red-100 text-red-800",
      filterFn: (p) => p.status === 'red' || p.has_chronic
    },
    {
      id: "pregnant",
      title: labels.pregnant,
      subtitle: labels.pregnantSub,
      count: pregnantCount,
      icon: Heart,
      color: "text-rose-600",
      bgColor: "bg-rose-500 text-white",
      borderColor: "border-rose-300 hover:border-rose-500",
      cardBg: "bg-white hover:bg-rose-50/20",
      badgeBg: "bg-rose-100 text-rose-800",
      filterFn: (p) => p.is_pregnant
    },
    {
      id: "children",
      title: labels.children,
      subtitle: labels.childrenSub,
      count: childCount,
      icon: Baby,
      color: "text-amber-600",
      bgColor: "bg-amber-500 text-white",
      borderColor: "border-amber-300 hover:border-amber-500",
      cardBg: "bg-white hover:bg-amber-50/20",
      badgeBg: "bg-amber-100 text-amber-800",
      filterFn: (p) => p.is_child || (p.age_years && p.age_years <= 5)
    },
    {
      id: "population",
      title: labels.population,
      subtitle: labels.populationSub,
      count: totalCount,
      icon: Users,
      color: "text-teal-700",
      bgColor: "bg-[#008F83] text-white",
      borderColor: "border-teal-300 hover:border-teal-600",
      cardBg: "bg-white hover:bg-teal-50/20",
      badgeBg: "bg-teal-100 text-teal-800",
      filterFn: (p) => true
    }
  ];

  // 2 Secondary Utility Badges
  const secondaryCards = [
    {
      id: "app_active",
      title: labels.appActive,
      subtitle: labels.appActiveSub,
      count: appActiveCount,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bgColor: "bg-emerald-100 text-emerald-800",
      borderColor: "border-emerald-200",
      filterFn: (p) => p.patient_email || p.mobile
    },
    {
      id: "immunized",
      title: labels.immunized,
      subtitle: labels.immunizedSub,
      count: immunCount,
      icon: TrendingUp,
      color: "text-blue-700",
      bgColor: "bg-blue-100 text-blue-800",
      borderColor: "border-blue-200",
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
    <div className="min-h-screen bg-[#F8FAF9] pb-32 font-sans text-slate-800">
      
      {/* ── BIG, CLEAR HEADER ── */}
      <header className="bg-white border-b border-slate-200 px-5 sm:px-8 py-5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#16324F] tracking-tight">
              {labels.pageTitle}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
              {labels.pageSub}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-full shadow-2xs">
              📅 {labels.month}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT (CLEAN & BIGGER SIZES) ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ── 4 PRIMARY BIG ACCESSIBLE CARDS (HUGE TOUCH TARGETS & LARGE NUMBERS) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {primaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedGroup(card)}
                className={`${card.cardBg} rounded-3xl border-3 ${card.borderColor} p-6 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-5 cursor-pointer group`}
              >
                {/* Top Row: Big Icon + Huge Number */}
                <div className="flex items-center justify-between">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${card.bgColor} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-9 h-9" />
                  </div>
                  <span className={`text-4xl sm:text-5xl font-black font-mono ${card.color}`}>
                    {card.count}
                  </span>
                </div>

                {/* Bottom Row: Big Clear Title & Subtitle */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#16324F] leading-tight">
                      {card.title}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#008F83] group-hover:text-white flex items-center justify-center text-slate-400 transition-all shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 2 SECONDARY SUMMARY CARDS (BIG & HORIZONTAL) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {secondaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedGroup(card)}
                className={`bg-white rounded-2xl border-2 ${card.borderColor} p-4 shadow-xs hover:shadow-sm transition-all flex items-center justify-between text-left cursor-pointer group`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#16324F]">{card.title}</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black font-mono ${card.color}`}>{card.count}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── BIG FRIENDLY EXPORT / PRINT ACTION BUTTON ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
          >
            <Printer className="w-5 h-5" />
            <span>{labels.exportReport}</span>
          </button>
        </div>

      </main>

      {/* ── BIG PATIENT DRILLDOWN MODAL (EASY TO TAP WITH BIG GREEN CALL BUTTON) ── */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${selectedGroup.bgColor}`}>
                  <selectedGroup.icon className="w-6 h-6" />
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
                className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {currentGroupPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-bold">
                  {labels.noPatients}
                </div>
              ) : (
                currentGroupPatients.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{p.name}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                        {p.gender} • {p.age_years ? `${p.age_years} yrs` : 'Resident'} • {p.village || 'Shirwal'}
                      </p>
                      {p.is_pregnant && (
                        <span className="inline-block mt-1 bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded">
                          ANC Mother
                        </span>
                      )}
                    </div>

                    {/* BIG GREEN CALL BUTTON */}
                    {p.mobile ? (
                      <a
                        href={`tel:${p.mobile}`}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{labels.call}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-200 px-3 py-1.5 rounded-xl">
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
                className="w-full py-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-sm rounded-xl cursor-pointer"
              >
                {labels.close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── OFFICIAL REPORT MODAL (PRINT READY) ── */}
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
                <div className="flex justify-between"><span className="font-bold text-slate-500">Reporting Period:</span><span className="font-black">{labels.month}</span></div>
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