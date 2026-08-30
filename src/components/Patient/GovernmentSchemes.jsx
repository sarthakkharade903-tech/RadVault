import React, { useState } from 'react';
import {
  Shield,
  ExternalLink,
  ChevronRight,
  Heart,
  Baby,
  Activity,
  Users,
  Building2,
  CheckCircle2,
  Phone,
  X,
  Sparkles,
  Info
} from 'lucide-react';

const SCHEMES = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat PM-JAY',
    nameMr: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
    nameHi: 'आयुष्मान भारत पीएम-जय',
    badge: 'National Health Protection',
    benefit: '₹5,00,000 / year',
    benefitSub: 'Per family for secondary & tertiary hospital care',
    icon: Shield,
    color: 'from-amber-500 to-amber-600',
    desc: 'Provides free secondary and tertiary care hospitalization coverage across public and empanelled private hospitals in India. Covers diagnostic scans, surgeries, and medicines.',
    eligibility: 'Deprived rural households identified by SECC database or active Ration Card (BPL/Antyodaya).',
    portalUrl: 'https://pmjay.gov.in/'
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    nameMr: 'जननी सुरक्षा योजना',
    nameHi: 'जननी सुरक्षा योजना',
    badge: 'Maternal & Newborn Care',
    benefit: '₹1,400 Cash Transfer',
    benefitSub: 'Direct benefit for rural institutional delivery',
    icon: Baby,
    color: 'from-rose-500 to-rose-600',
    desc: 'Promotes institutional delivery among pregnant women in rural areas to reduce maternal and neonatal mortality. ASHA workers assist with transport and ANC checkups.',
    eligibility: 'All pregnant rural women delivering in government health centres or accredited private facilities.',
    portalUrl: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309'
  },
  {
    id: 'pmsma',
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
    nameMr: 'प्रधानमंत्री सुरक्षित मातृत्व अभियान',
    nameHi: 'प्रधानमंत्री सुरक्षित मातृत्व अभियान',
    badge: 'Antenatal Checkups',
    benefit: 'Free Specialist ANC',
    benefitSub: 'On 9th of every month with free ultrasound & tests',
    icon: Heart,
    color: 'from-teal-500 to-teal-600',
    desc: 'Guarantees comprehensive and quality antenatal care (ANC) for all pregnant women in their 2nd and 3rd trimesters on the 9th day of every month by Obstetricians/Doctors.',
    eligibility: 'All pregnant women in 2nd/3rd trimester at PHCs, CHCs, and District Hospitals.',
    portalUrl: 'https://pmsma.nhp.gov.in/'
  },
  {
    id: 'nikshay',
    name: 'Nikshay Poshan Yojana',
    nameMr: 'निक्षय पोषण योजना (टीबी पोषण सहाय्य)',
    nameHi: 'निक्षय पोषण योजना',
    badge: 'Tuberculosis Support',
    benefit: '₹500 / month',
    benefitSub: 'Direct bank transfer for nutrition during treatment',
    icon: Activity,
    color: 'from-sky-500 to-sky-600',
    desc: 'Provides monthly financial incentive of ₹500 directly into the bank account of all notified TB patients throughout the duration of their medical treatment.',
    eligibility: 'All active TB patients registered in the national Nikshay health portal.',
    portalUrl: 'https://nikshay.in/'
  },
  {
    id: 'mjpjay',
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    nameMr: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना',
    nameHi: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना',
    badge: 'Maharashtra State Scheme',
    benefit: '₹5,00,000 / year',
    benefitSub: 'Comprehensive cashless medical treatment in Maharashtra',
    icon: Building2,
    color: 'from-indigo-500 to-indigo-600',
    desc: 'Flagship health insurance initiative of Maharashtra State Government covering 996 medical procedures, major surgeries, and post-operative medications.',
    eligibility: 'Residents of Maharashtra holding Yellow, Orange, or Antyodaya Ration Cards.',
    portalUrl: 'https://www.jeevandayee.gov.in/'
  }
];

export default function GovernmentSchemes({ onBack }) {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [lang, setLang] = useState('en'); // 'en' | 'mr' | 'hi'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[#008080] tracking-tight">
              Government Health Schemes & Benefits
            </h2>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
              Public Entitlements
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official central and state financial protection schemes available for rural beneficiaries.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              lang === 'en' ? 'bg-white text-[#008080] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('mr')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              lang === 'mr' ? 'bg-white text-[#008080] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            मराठी
          </button>
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              lang === 'hi' ? 'bg-white text-[#008080] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* ── Guidance Banner ── */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-950 font-medium">
        <Info className="w-5 h-5 text-[#008080] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">
            💡 How to utilize these government schemes:
          </p>
          <p className="text-slate-600 leading-relaxed">
            These benefits are available at all Primary Health Centres, Community Health Centres, and District Hospitals. Show your <strong>RadVault Unified ID / ABHA Card</strong> to your local ASHA worker to facilitate fast documentation.
          </p>
        </div>
      </div>

      {/* ── Schemes Grid ── */}
      <div className="grid grid-cols-1 gap-3.5">
        {SCHEMES.map((scheme) => {
          const Icon = scheme.icon;
          const schemeTitle = lang === 'mr' ? scheme.nameMr : lang === 'hi' ? scheme.nameHi : scheme.name;

          return (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-[#008080]/50 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${scheme.color} shadow-xs shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {scheme.badge}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">{schemeTitle}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{scheme.benefitSub}</p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Benefit</span>
                  <span className="text-base font-black text-emerald-700 font-mono">{scheme.benefit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={scheme.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    title="Open Official Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedScheme(scheme)}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#006666] border border-[#008080]/30 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Scheme Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Scheme Details Modal ── */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 text-xs">
            
            <div className="bg-gradient-to-br from-amber-50 to-white p-5 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${selectedScheme.color} shadow-xs`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                    {selectedScheme.badge}
                  </span>
                  <h3 className="font-black text-base text-slate-900 leading-tight mt-0.5">
                    {lang === 'mr' ? selectedScheme.nameMr : lang === 'hi' ? selectedScheme.nameHi : selectedScheme.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 flex-1">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Financial Entitlement</p>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{selectedScheme.benefit}</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl shadow-2xs border border-emerald-200">
                  {selectedScheme.benefitSub}
                </span>
              </div>

              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Scheme Overview</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedScheme.desc}</p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Beneficiary Eligibility</h4>
                <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedScheme.eligibility}
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  Need help applying? Connect with your village ASHA worker during home screening or visit the nearest Primary Health Centre.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={selectedScheme.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Official Government Portal ↗</span>
                </a>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
