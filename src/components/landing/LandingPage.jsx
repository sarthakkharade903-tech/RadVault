import React, { useState } from 'react';
import {
  HeartPulse,
  Leaf,
  Users,
  Building2,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import { ROLES } from '../../constants/roles';
import illusAsha from '../../assets/illus_asha.jpg';
import illusHospital from '../../assets/illus_hospital.jpg';
import illusFamily from '../../assets/illus_family.jpg';

export const PORTAL_ITEMS = [
  {
    key: 'asha',
    role: ROLES.ASHA,
    label: 'ASHA Worker',
    marathi: 'आशा कार्यकर्ती',
    desc: 'Grassroots health & triage',
    fullDesc: 'Frontline community screening, vital signs & emergency referrals',
    icon: Leaf,
    illus: illusAsha,
    theme: {
      text: 'text-[#008F83]',
      activeBorder: 'border-[#008F83]',
      iconBg: 'bg-[#F0F9F8]',
      shadow: '0 8px 30px rgba(0,143,131,0.15)',
      accent: '#008F83',
    },
    caption: 'Community Care Begins Here'
  },
  {
    key: 'hospital',
    role: ROLES.HOSPITAL_STAFF,
    label: 'Hospital Reception',
    marathi: 'प्राथमिक आरोग्य केंद्र',
    desc: 'Diagnostic workspace',
    fullDesc: 'Patient intake desk, referral check-in & specialist routing',
    icon: Building2,
    illus: illusHospital,
    theme: {
      text: 'text-[#008080]',
      activeBorder: 'border-[#008080]',
      iconBg: 'bg-[#E6F2F2]',
      shadow: '0 8px 30px rgba(0,128,128,0.15)',
      accent: '#008080',
    },
    caption: 'Community Care Connects to Clinical Care'
  },
  {
    key: 'doctor',
    role: ROLES.DOCTOR,
    label: 'Specialist Doctor',
    marathi: 'विशेषज्ञ डॉक्टर',
    desc: 'Clinical OPD consultation',
    fullDesc: 'Case review, examination, digital prescription & follow-up',
    icon: Stethoscope,
    illus: illusHospital,
    theme: {
      text: 'text-[#800000]',
      activeBorder: 'border-[#800000]',
      iconBg: 'bg-[#FDF2F2]',
      shadow: '0 8px 30px rgba(128,0,0,0.15)',
      accent: '#800000',
    },
    caption: 'Specialist Care & Consultation Registry'
  },
  {
    key: 'patient',
    role: ROLES.PATIENT,
    label: 'Patient & Family',
    marathi: 'रुग्ण आणि कुटुंब',
    desc: 'Personal health records',
    fullDesc: 'Longitudinal record vault, dynamic consent & emergency ID',
    icon: Users,
    illus: illusFamily,
    theme: {
      text: 'text-[#D97706]',
      activeBorder: 'border-[#D97706]',
      iconBg: 'bg-[#FFF9F0]',
      shadow: '0 8px 30px rgba(217,119,6,0.15)',
      accent: '#D97706',
    },
    caption: 'Health Stays Connected with Family'
  },
];

export default function LandingPage({ onSelectPortal }) {
  const [hoveredPortal, setHoveredPortal] = useState('asha');
  const activePortal = PORTAL_ITEMS.find((p) => p.key === hoveredPortal) || PORTAL_ITEMS[0];

  return (
    <div
      className="min-h-screen bg-[#FAFCFB] font-sans relative flex flex-col justify-center overflow-x-hidden selection:bg-[#008F83]/20 selection:text-[#008F83]"
      style={{
        background:
          'radial-gradient(ellipse at 70% 10%, #eaf7f4 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, #fff8ed 0%, transparent 50%), #FAFCFB',
      }}
    >
      {/* Subtle identity mark */}
      <div className="absolute top-6 right-8 hidden lg:flex items-center gap-2 opacity-60">
        <div className="w-1.5 h-1.5 rounded-full bg-[#008F83] animate-pulse" />
        <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">
          National Health Mission · Connected Care
        </span>
      </div>

      <div className="max-w-[1360px] mx-auto w-full min-h-screen px-6 lg:px-16 py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* ── LEFT: Identity + Cards ── */}
          <div className="lg:col-span-5 flex flex-col">

            {/* Brand */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <HeartPulse className="w-7 h-7 text-[#008F83]" strokeWidth={2.5} />
                <h1 className="text-[2.4rem] font-black text-[#16324F] tracking-tight leading-none">
                  RadVault
                </h1>
              </div>
              <p className="text-base font-medium text-slate-500 ml-0.5">
                One connected health network
              </p>
            </div>

            {/* Journey Indicator */}
            <div className="flex items-center gap-2 mb-8">
              {PORTAL_ITEMS.map((p, i) => (
                <React.Fragment key={p.key}>
                  <span
                    className={
                      'text-[11px] font-bold uppercase tracking-widest transition-all duration-400 ' +
                      (hoveredPortal === p.key ? 'opacity-100' : 'opacity-30 text-slate-500')
                    }
                    style={hoveredPortal === p.key ? { color: p.theme.accent } : {}}
                  >
                    {p.label.split(' ')[0]}
                  </span>
                  {i < PORTAL_ITEMS.length - 1 && (
                    <div className="flex-1 h-[1.5px] bg-slate-200 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{
                          width:
                            (hoveredPortal === 'hospital' && i === 0) ||
                            (hoveredPortal === 'doctor' && i <= 1) ||
                            (hoveredPortal === 'patient' && i <= 2)
                              ? '100%'
                              : '0%',
                          backgroundColor: '#008F83',
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Portal Cards */}
            <div className="flex flex-col gap-3">
              {PORTAL_ITEMS.map(({ key, label, desc, icon: Icon, theme }) => {
                const isActive = hoveredPortal === key;
                const isOther = hoveredPortal !== key && hoveredPortal !== null;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectPortal(key)}
                    onMouseEnter={() => setHoveredPortal(key)}
                    onFocus={() => setHoveredPortal(key)}
                    className={
                      'group w-full text-left p-4.5 sm:p-5 rounded-[1.25rem] border-2 bg-white transition-all duration-300 ease-out cursor-pointer ' +
                      (isActive ? theme.activeBorder : 'border-transparent') +
                      ' ' +
                      (isOther ? 'opacity-60 scale-[0.98]' : 'opacity-100')
                    }
                    style={
                      isActive
                        ? { boxShadow: theme.shadow }
                        : { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={
                          'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ' +
                          (isActive ? theme.iconBg : 'bg-slate-50')
                        }
                      >
                        <Icon
                          className={
                            'w-5 h-5 transition-colors duration-300 ' +
                            (isActive ? theme.text : 'text-slate-400')
                          }
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={
                            'font-black text-[15px] transition-colors duration-300 ' +
                            (isActive ? 'text-[#16324F]' : 'text-slate-700')
                          }
                        >
                          {label}
                        </p>
                        <p
                          className={
                            'text-[12px] font-medium mt-0.5 transition-colors duration-300 ' +
                            (isActive ? theme.text : 'text-slate-400')
                          }
                        >
                          {desc}
                        </p>
                      </div>
                      <div
                        className={
                          'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ' +
                          (isActive
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-3')
                        }
                      >
                        <ArrowRight
                          className={'w-4 h-4 ' + theme.text}
                          strokeWidth={2.5}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Real Illustration ── */}
          <div className="lg:col-span-7 flex items-center justify-end">
            <div className="w-full max-w-[720px] relative">

              {/* Main Illustration Frame */}
              <div
                className="rounded-[2rem] overflow-hidden border border-slate-200/70 bg-white"
                style={{
                  boxShadow:
                    '0 24px 60px rgba(15,23,42,0.08), 0 4px 12px rgba(15,23,42,0.04)',
                }}
              >
                {/* Illustration Crossfade Stack */}
                <div className="relative w-full" style={{ paddingBottom: '68%' }}>
                  {PORTAL_ITEMS.map(({ key, illus }) => (
                    <div
                      key={key}
                      className="absolute inset-0 transition-all duration-500 ease-in-out"
                      style={{
                        opacity: hoveredPortal === key ? 1 : 0,
                        transform: hoveredPortal === key ? 'scale(1)' : 'scale(1.03)',
                      }}
                    >
                      <img
                        src={illus}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>

                {/* Caption Strip */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: activePortal.theme.accent }}
                    />
                    <span
                      className="text-[11px] font-black tracking-wider uppercase"
                      style={{ color: activePortal.theme.accent }}
                    >
                      {activePortal.caption}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {PORTAL_ITEMS.map((p) => (
                      <div
                        key={p.key}
                        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            hoveredPortal === p.key ? p.theme.accent : '#E2E8F0',
                          transform:
                            hoveredPortal === p.key ? 'scale(1.4)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center gap-4 text-[11px] font-semibold text-slate-400">
          <span>Community-first</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Connected care</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Built for continuity</span>
        </div>

      </div>
    </div>
  );
}
