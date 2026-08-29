import React, { useState } from "react";
import {
  Shield, CheckCircle2, IndianRupee, Heart, Baby, Gift,
  ExternalLink, ChevronRight, HelpCircle, Phone, X, Check, Award
} from "lucide-react";

const SCHEMES_TRANSLATIONS = {
  en: {
    sectionTitle: "Eligible Government Health Schemes & Benefits",
    sectionSub: "Direct access to official Government of India and Maharashtra health schemes",
    claimAssistance: "Claim via ASHA",
    viewDetails: "Scheme Details & Portal",
    openPortal: "Open Official Government Portal",
    eligibleBadge: "Eligible",
    activeBadge: "Enrolled & Active",
    close: "Close",
    contactAshaNote: "Your ASHA worker (Priya Deshmukh) will assist in document submission and biometric e-KYC at Shirwal PHC."
  },
  mr: {
    sectionTitle: "पात्र शासकीय आरोग्य योजना व लाभ",
    sectionSub: "अधिकृत शासकीय आरोग्य योजनांची माहिती व थेट अर्ज करण्याची सुविधा",
    claimAssistance: "आशा कडून मदत घ्या",
    viewDetails: "योजनेची माहिती व पोर्टल",
    openPortal: "अधिकृत शासकीय पोर्टल उघडा",
    eligibleBadge: "पात्र आहात",
    activeBadge: "सक्रिय योजना",
    close: "बंद करा",
    contactAshaNote: "तुमच्या आशा कार्यकर्त्या (प्रिया देशमुख) शिरवळ प्राथमिक आरोग्य केंद्रात अर्ज व कागदपत्रे जमा करण्यास मदत करतील."
  },
  hi: {
    sectionTitle: "पात्र सरकारी स्वास्थ्य योजनाएं एवं लाभ",
    sectionSub: "आधिकारिक सरकारी स्वास्थ्य योजनाओं का संपूर्ण विवरण एवं सीधा आवेदन",
    claimAssistance: "आशा से सहायता लें",
    viewDetails: "योजना विवरण व पोर्टल",
    openPortal: "आधिकारिक सरकारी पोर्टल खोलें",
    eligibleBadge: "पात्र हैं",
    activeBadge: "सक्रिय योजना",
    close: "बंद करें",
    contactAshaNote: "आपकी आशा कार्यकर्ता (प्रिया देशमुख) शिरवल पीएचसी में आवश्यक दस्तावेज जमा कराने में पूरी मदद करेंगी।"
  }
};

export default function GovernmentSchemes({ family, members = [] }) {
  const lang = localStorage.getItem("radvault_asha_lang") || localStorage.getItem("radvault_patient_lang") || "en";
  const t = SCHEMES_TRANSLATIONS[lang] || SCHEMES_TRANSLATIONS.en;

  const [selectedScheme, setSelectedScheme] = useState(null);

  // Demographics matching
  const hasPregnant = members.some(m => m.is_pregnant);
  const hasChild = members.some(m => m.is_child || (m.age_years && m.age_years <= 5));
  const pregnantMember = members.find(m => m.is_pregnant);
  const childMember = members.find(m => m.is_child || (m.age_years && m.age_years <= 5));

  const schemes = [
    {
      id: "pmjay",
      name: "Ayushman Bharat (PM-JAY)",
      nameMr: "आयुष्मान भारत (PM-JAY)",
      nameHi: "आयुष्मान भारत (पीएम-जेएवाई)",
      badge: "National Health Authority",
      benefit: "₹5,00,000 / year",
      benefitSub: "Cashless Hospital Treatment Coverage",
      desc: "Covers secondary and tertiary hospitalisation across 27,000+ empanelled government and private hospitals in India.",
      eligibility: "All rural households with verified ABHA & Ration Card.",
      beneficiary: family?.family_name || "Entire Household",
      status: "ACTIVE",
      portalUrl: "https://beneficiary.nha.gov.in/",
      icon: Shield,
      color: "from-amber-400 to-amber-500",
      textColor: "text-amber-700",
      bgLight: "bg-amber-50 border-amber-200"
    },
    {
      id: "pmmvy",
      name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
      nameMr: "प्रधानमंत्री मातृ वंदना योजना (PMMVY)",
      nameHi: "प्रधानमंत्री मातृ वंदना योजना (पीएमएमवीवाई)",
      badge: "Maternal Benefit",
      benefit: "₹5,000",
      benefitSub: "Direct Cash Benefit for Nutrition",
      desc: "Financial incentive paid directly into Aadhaar-linked bank account in 3 installments for nutrition and health checkups during pregnancy.",
      eligibility: "Pregnant and lactating mothers registering with ASHA.",
      beneficiary: pregnantMember ? pregnantMember.name : "Eligible Mother",
      status: hasPregnant ? "ELIGIBLE" : "AVAILABLE",
      portalUrl: "https://pmmvy.wcd.gov.in/",
      icon: Heart,
      color: "from-rose-400 to-rose-500",
      textColor: "text-rose-700",
      bgLight: "bg-rose-50 border-rose-200"
    },
    {
      id: "jsy",
      name: "Janani Suraksha Yojana (JSY)",
      nameMr: "जननी सुरक्षा योजना (JSY)",
      nameHi: "जननी सुरक्षा योजना (जेएसवाई)",
      badge: "Institutional Delivery",
      benefit: "₹1,400",
      benefitSub: "Hospital Delivery Cash Assistance",
      desc: "Incentive provided to rural pregnant women who deliver in government health centres or accredited private hospitals.",
      eligibility: "All rural institutional deliveries with ASHA escort.",
      beneficiary: pregnantMember ? pregnantMember.name : "Eligible Mother",
      status: hasPregnant ? "ELIGIBLE" : "AVAILABLE",
      portalUrl: "https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309",
      icon: Award,
      color: "from-teal-400 to-teal-500",
      textColor: "text-teal-700",
      bgLight: "bg-teal-50 border-teal-200"
    },
    {
      id: "indradhanush",
      name: "Mission Indradhanush (Universal Immunization)",
      nameMr: "मिशन इंद्रधनुष (पूर्ण बाल लसीकरण)",
      nameHi: "मिशन इंद्रधनुष (संपूर्ण बाल टीकाकरण)",
      badge: "Child Health",
      benefit: "100% Free",
      benefitSub: "Free 12 Vaccine Schedule & Vitamin A",
      desc: "Free immunization against 12 life-threatening diseases (BCG, OPV, Pentavalent, Rotavirus, Measles-Rubella, DPT).",
      eligibility: "All infants and children up to 5 years of age.",
      beneficiary: childMember ? childMember.name : "Children <5y",
      status: hasChild ? "ELIGIBLE" : "AVAILABLE",
      portalUrl: "https://www.immunizeindia.org/",
      icon: Baby,
      color: "from-blue-400 to-blue-500",
      textColor: "text-blue-700",
      bgLight: "bg-blue-50 border-blue-200"
    },
    {
      id: "mjpjay",
      name: "Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)",
      nameMr: "महात्मा ज्योतिराव फुले जन आरोग्य योजना (MJPJAY)",
      nameHi: "महात्मा ज्योतिराव फुले जन आरोग्य योजना (एमजेपीजेएवाई)",
      badge: "Maharashtra State Scheme",
      benefit: "₹5,00,000",
      benefitSub: "996 Specialised Surgeries & Treatments",
      desc: "Government of Maharashtra cashless medical scheme covering cardiac, renal, cancer, and emergency surgeries.",
      eligibility: "Valid Ration Card / Domicile in Maharashtra.",
      beneficiary: family?.family_name || "Family",
      status: "ACTIVE",
      portalUrl: "https://www.jeevandayee.gov.in/",
      icon: Shield,
      color: "from-purple-400 to-purple-500",
      textColor: "text-purple-700",
      bgLight: "bg-purple-50 border-purple-200"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-[#16324F] flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <span>{t.sectionTitle}</span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{t.sectionSub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {schemes.map((s) => {
          const Icon = s.icon;
          const schemeName = lang === "mr" ? s.nameMr : lang === "hi" ? s.nameHi : s.name;

          return (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                s.status === "ELIGIBLE" ? "border-rose-200 bg-gradient-to-r from-white via-white to-rose-50/30" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${s.color} shadow-xs shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {s.badge}
                    </span>
                    {s.status === "ELIGIBLE" && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                        ★ {t.eligibleBadge} ({s.beneficiary})
                      </span>
                    )}
                    {s.status === "ACTIVE" && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ {t.activeBadge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-[#16324F] mt-1">{schemeName}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{s.benefitSub}</p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Benefit</span>
                  <span className="text-base font-black text-emerald-700 font-mono">{s.benefit}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={s.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    title="Open Official Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedScheme(s)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.viewDetails}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scheme Details & Direct Portal Modal ── */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-amber-200">
            
            <div className="bg-gradient-to-br from-amber-50 to-[#FFF9ED] p-5 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${selectedScheme.color}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                    {selectedScheme.badge}
                  </span>
                  <h3 className="font-black text-base text-[#16324F] leading-tight mt-0.5">
                    {lang === "mr" ? selectedScheme.nameMr : lang === "hi" ? selectedScheme.nameHi : selectedScheme.name}
                  </h3>
                </div>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-800 flex-1">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Financial Benefit</p>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{selectedScheme.benefit}</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-emerald-200">
                  {selectedScheme.benefitSub}
                </span>
              </div>

              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Description</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedScheme.desc}</p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Eligibility Criteria</h4>
                <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedScheme.eligibility}
                </p>
              </div>

              {/* Direct Link to Official Government Website */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-black text-slate-800 text-[11px]">Official Government Portal Link:</p>
                <a
                  href={selectedScheme.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#16324F] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t.openPortal} ↗</span>
                </a>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  {t.contactAshaNote}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => setSelectedScheme(null)}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
              >
                {t.close}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
