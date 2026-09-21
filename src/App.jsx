import React, { useState, useEffect } from "react";
import { HeartPulse, Leaf, Users, Building2, ArrowRight, Stethoscope, Database, Sparkles } from "lucide-react";
import ASHAPortal from "./components/ASHA/ASHAPortal";
import PatientLogin from "./components/Patient/PatientLogin";
import FamilyDashboard from "./components/Patient/FamilyDashboard";
import EmergencySOSModal from "./components/Patient/EmergencySOSModal";
import illusAsha from "./assets/illus_asha.jpg";
import illusFamily from "./assets/illus_family.jpg";
import illusHospital from "./assets/illus_hospital.jpg";
import illusDoctor from "./assets/illus_doctor.jpg";
import HospitalStaffWorkspace from './components/workspaces/HospitalStaffWorkspace';
import DoctorWorkspace from './components/workspaces/DoctorWorkspace';
import { ensureRoleAuth } from './services/supabase';

const PORTALS = [
  {
    key: "asha",
    label: "ASHA Worker",
    desc: "Grassroots health & triage",
    icon: Leaf,
    illus: illusAsha,
    theme: {
      text: "text-[#008F83]",
      activeBorder: "border-[#008F83]",
      iconBg: "bg-[#F0F9F8]",
      shadow: "0 8px 30px rgba(0,143,131,0.15)",
      accent: "#008F83",
    },
  },
  {
    key: "patient",
    label: "Patient & Family",
    desc: "Personal health records",
    icon: Users,
    illus: illusFamily,
    theme: {
      text: "text-[#D97706]",
      activeBorder: "border-[#D97706]",
      iconBg: "bg-[#FFF9F0]",
      shadow: "0 8px 30px rgba(217,119,6,0.15)",
      accent: "#D97706",
    },
  },
  {
    key: "reception",
    label: "Hospital Reception",
    desc: "Diagnostic intake & doctor routing",
    icon: Building2,
    illus: illusHospital,
    theme: {
      text: "text-[#3F51B5]",
      activeBorder: "border-[#3F51B5]",
      iconBg: "bg-[#F2F4FB]",
      shadow: "0 8px 30px rgba(63,81,181,0.15)",
      accent: "#3F51B5",
    },
  },
  {
    key: "doctor",
    label: "Doctor / Specialist",
    desc: "Clinical case review & consultation",
    icon: Stethoscope,
    illus: illusDoctor,
    theme: {
      text: "text-[#7C3AED]",
      activeBorder: "border-[#7C3AED]",
      iconBg: "bg-[#F5F3FF]",
      shadow: "0 8px 30px rgba(124,58,237,0.18)",
      accent: "#7C3AED",
    },
  },
];

function LandingPage({ onSelectPortal, onOpenEmergencySOS }) {
  const [hoveredPortal, setHoveredPortal] = useState("asha");
  const activePortal = PORTALS.find(p => p.key === hoveredPortal) || PORTALS[0];

  return (
    <div className="min-h-screen bg-[#FAFCFB] font-sans" style={{ background: "radial-gradient(ellipse at 70% 10%, #eaf7f4 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, #fff8ed 0%, transparent 50%), #FAFCFB" }}>

      {/* Subtle identity mark */}
      <div className="absolute top-6 right-8 hidden lg:flex items-center gap-2 opacity-50">
        <div className="w-1.5 h-1.5 rounded-full bg-[#008F83]" />
        <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">Connected Health Network</span>
      </div>

      <div className="max-w-[1360px] mx-auto min-h-screen px-6 lg:px-16 py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* â”€â”€ LEFT: Identity + Cards â”€â”€ */}
          <div className="lg:col-span-5 flex flex-col">

            {/* Brand */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <HeartPulse className="w-7 h-7 text-[#008F83]" strokeWidth={2.5} />
                <h1 className="text-[2.4rem] font-black text-[#16324F] tracking-tight leading-none">RadVault</h1>
              </div>
              <p className="text-base font-medium text-slate-500 ml-0.5">One connected health network</p>
            </div>

            {/* Journey Indicator */}
            <div className="flex items-center gap-2 mb-10">
              {PORTALS.map((p, i) => (
                <React.Fragment key={p.key}>
                  <span className={"text-[11px] font-bold uppercase tracking-widest transition-all duration-400 " + (hoveredPortal === p.key ? "opacity-100" : "opacity-30 text-slate-500")}
                    style={hoveredPortal === p.key ? { color: p.theme.accent } : {}}>
                    {p.label.split(" ")[0]}
                  </span>
                  {i < PORTALS.length - 1 && (
                    <div className="flex-1 h-[1.5px] bg-slate-200 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{
                          width: (hoveredPortal === 'patient' && i === 0) || (hoveredPortal === 'reception' && i <= 1) || (hoveredPortal === 'doctor' && i <= 2) ? '100%' : '0%',
                          backgroundColor: hoveredPortal === 'doctor' ? '#7C3AED' : hoveredPortal === 'reception' ? '#3F51B5' : hoveredPortal === 'patient' ? '#D97706' : '#008F83'
                        }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Portal Cards */}
            <div className="flex flex-col gap-3.5">
              {PORTALS.map(({ key, label, desc, icon: Icon, theme }) => {
                const isActive = hoveredPortal === key;
                const isOther = hoveredPortal !== key && hoveredPortal !== null;
                return (
                  <button
                    key={key}
                    data-portal={key}
                    onClick={() => onSelectPortal(key)}
                    onMouseEnter={() => setHoveredPortal(key)}
                    onFocus={() => setHoveredPortal(key)}
                    className={"group w-full text-left p-5 rounded-[1.25rem] border-2 bg-white transition-all duration-500 ease-out " + (isActive ? theme.activeBorder : "border-transparent") + " " + (isOther ? "opacity-40 scale-[0.98]" : "opacity-100")}
                    style={isActive ? { boxShadow: theme.shadow } : { boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={"w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-400 " + (isActive ? theme.iconBg : "bg-slate-50")}>
                        <Icon className={"w-5 h-5 transition-colors duration-400 " + (isActive ? theme.text : "text-slate-400")} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={"font-bold text-[15px] transition-colors duration-400 " + (isActive ? "text-[#16324F]" : "text-slate-600")}>{label}</p>
                        <p className={"text-[12px] font-medium mt-0.5 transition-colors duration-400 " + (isActive ? theme.text : "text-slate-400")}>{desc}</p>
                      </div>
                      <div className={"w-8 h-8 rounded-full flex items-center justify-center transition-all duration-400 " + (isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3")}>
                        <ArrowRight className={"w-4 h-4 " + theme.text} strokeWidth={2.5} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Public 24x7 Emergency SOS Lifeline Strip (Subtle & Space-Efficient) ── */}
            <button
              onClick={onOpenEmergencySOS}
              type="button"
              className="mt-3.5 w-full group p-2.5 sm:p-3 rounded-2xl bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/80 hover:border-rose-300 transition-all duration-300 flex items-center justify-between gap-3 text-left cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                </div>
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-extrabold text-[12px] tracking-tight text-rose-950 shrink-0">
                    24x7 Emergency SOS
                  </span>
                  <span className="text-rose-300 hidden sm:inline">•</span>
                  <span className="text-[11px] font-medium text-rose-700 truncate hidden sm:inline">
                    108 Ambulance & PHC Dispatch
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-white/80 group-hover:bg-rose-600 group-hover:text-white px-2 py-0.5 rounded-lg border border-rose-200/60 transition-colors">
                  No Login
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-rose-600 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          </div>

          {/* â”€â”€ RIGHT: Real Illustration â”€â”€ */}
          <div className="lg:col-span-7 flex items-center justify-end">
            <div className="w-full max-w-[720px] relative">

              {/* Main Illustration Frame */}
              <div className="rounded-[2rem] overflow-hidden border border-slate-200/70 bg-white"
                style={{ boxShadow: "0 24px 60px rgba(15,23,42,0.08), 0 4px 12px rgba(15,23,42,0.04)" }}>
                
                {/* Illustration Crossfade Stack */}
                <div className="relative w-full" style={{ paddingBottom: "68%" }}>
                  {PORTALS.map(({ key, illus }) => (
                    <div key={key} className="absolute inset-0 transition-all duration-700 ease-in-out"
                      style={{
                        opacity: hoveredPortal === key ? 1 : 0,
                        transform: hoveredPortal === key ? "scale(1)" : "scale(1.04)",
                      }}>
                      <img src={illus} alt="" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  ))}
                </div>

                {/* Caption Strip */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activePortal.theme.accent }} />
                    <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: activePortal.theme.accent }}>
                      {activePortal.key === "asha" ? "Community Care Begins Here" : activePortal.key === "patient" ? "Health Stays Connected with Family" : activePortal.key === "reception" ? "Community Care Connects to Clinical Care" : "Specialist Consultation & Tele-Clinical Review"}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {PORTALS.map(p => (
                      <div key={p.key} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{ backgroundColor: hoveredPortal === p.key ? p.theme.accent : "#E2E8F0", transform: hoveredPortal === p.key ? "scale(1.4)" : "scale(1)" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-14 flex items-center gap-4 text-[11px] font-semibold text-slate-400">
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

function App() {
  const [activePortal, setActivePortal] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("portal");
      if (p) return p;
    }
    return localStorage.getItem("radvault_portal") || "home";
  });
  const [familyAuthData, setFamilyAuthData] = useState(() => {
    const defaultPatilFamily = {
      family: {
        id: "d9568f85-3c12-4a51-89c1-26d0c4c638ee",
        family_name: "Patil Family",
        head_name: "Rahul Patil",
        head_of_family: "Rahul Patil",
        village: "Vadgaon",
        family_email: "sarthakkharade903@gmail.com"
      },
      members: [
        {
          id: "b6f81101-46d0-4b4d-8df0-9d9ce11a6a70",
          name: "Rekha Bai",
          age_years: 22,
          gender: "Female",
          blood_group: "O+",
          phone: "9797979797",
          mobile: "9797979797",
          village: "Vadgaon",
          relation_to_head: "Wife",
          is_pregnant: true,
          abha_id: "64-8837-7348-6384",
          asha_verified_at: "2026-09-11T07:19:13.499Z"
        },
        {
          id: "b1e7283e-388a-468b-a992-2b3520a77912",
          name: "Rahul Patil",
          age_years: 26,
          gender: "Male",
          blood_group: "B-",
          phone: "9898989898",
          mobile: "9898989898",
          village: "Vadgaon",
          relation_to_head: "Head of Family",
          is_pregnant: false,
          abha_id: "72-9104-5821-3940",
          asha_verified_at: "2026-09-11T07:19:13.499Z"
        }
      ]
    };

    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("family");
      if (p === "demo") return defaultPatilFamily;
    }
    const saved = localStorage.getItem("radvault_family_auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.family?.id === "f1111111-1111-1111-1111-111111111111" || !parsed?.members?.some(m => m.id === "b6f81101-46d0-4b4d-8df0-9d9ce11a6a70")) {
          // Auto-upgrade legacy demo session to Patil Family with Rekha Bai
          localStorage.setItem("radvault_family_auth", JSON.stringify(defaultPatilFamily));
          return defaultPatilFamily;
        }
        return parsed;
      } catch (_) {}
    }
    return null;
  });
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem("radvault_demo_mode") === "true";
  });
  const [showEmergencySOS, setShowEmergencySOS] = useState(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("sos");
      if (q === "1" || q === "true") return true;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("radvault_portal", activePortal);
  }, [activePortal]);

  useEffect(() => {
    localStorage.setItem("radvault_demo_mode", String(demoMode));
  }, [demoMode]);

  useEffect(() => {
    if (familyAuthData) {
      localStorage.setItem("radvault_family_auth", JSON.stringify(familyAuthData));
    } else {
      localStorage.removeItem("radvault_family_auth");
    }
  }, [familyAuthData]);

  // Clean role authentication on portal switch in Live Supabase mode
  useEffect(() => {
    if (demoMode) return;
    if (activePortal === "asha") {
      ensureRoleAuth("asha");
    } else if (activePortal === "reception") {
      ensureRoleAuth("reception");
    } else if (activePortal === "doctor") {
      ensureRoleAuth("doctor");
    }
  }, [activePortal, demoMode]);

  const goHome = () => setActivePortal("home");

  const openPatientJourneyForMember = (patientId, patientName) => {
    const defaultFamily = {
      family: {
        id: "d9568f85-3c12-4a51-89c1-26d0c4c638ee",
        family_name: "Patil Family",
        head_name: "Rahul Patil",
        head_of_family: "Rahul Patil",
        village: "Vadgaon",
        family_email: "sarthakkharade903@gmail.com"
      },
      members: [
        {
          id: patientId || "b6f81101-46d0-4b4d-8df0-9d9ce11a6a70",
          name: patientName || "Rekha Bai",
          age_years: 22,
          age: 22,
          gender: "Female",
          blood_group: "B+",
          relation_to_head: "Spouse",
          phone: "9797979797",
          mobile: "9797979797",
          abha_id: "91-4567-8901-2345",
          emergencyContact: { name: "Rahul Patil (Husband)", phone: "9876543210" }
        },
        {
          id: "m2222222-2222-2222-2222-222222222222",
          name: "Rahul Patil",
          age_years: 26,
          age: 26,
          gender: "Male",
          blood_group: "O+",
          relation_to_head: "Head",
          phone: "9876543210",
          mobile: "9876543210",
          abha_id: "91-1234-5678-9012"
        },
        {
          id: "m3333333-3333-3333-3333-333333333333",
          name: "Aarav Patil",
          age_years: 3,
          age: 3,
          gender: "Male",
          blood_group: "B+",
          relation_to_head: "Child",
          abha_id: "91-9988-7766-5544"
        }
      ]
    };
    setFamilyAuthData(prev => prev || defaultFamily);
    setActivePortal("patient");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ── Global Mode Bar: Always visible across all portals ── */}
      <div className="w-full bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs border-b border-slate-800 z-50 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="font-extrabold tracking-wider text-teal-400 uppercase text-[10px]">RADVAULT</span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            {demoMode ? (
              <span className="text-amber-300 font-bold">DEMO MODE (Sample Data Active)</span>
            ) : (
              <span className="text-emerald-400 font-bold">LIVE SUPABASE (Demo Mode OFF — 100% Real DB)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <button
            onClick={() => setShowEmergencySOS(true)}
            className="px-3 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/40 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Open 24x7 Emergency SOS"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="tracking-wide font-extrabold">24x7 Emergency SOS</span>
          </button>

          <button
            onClick={() => setDemoMode(prev => !prev)}
            className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer border ${
              demoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
            }`}
          >
            {demoMode ? <Sparkles className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
            <span>{demoMode ? "Switch to Live DB (Demo OFF)" : "Switch to Demo Mode"}</span>
          </button>

          {activePortal !== "home" && (
            <button
              data-action="all-portals"
              onClick={goHome}
              className="text-slate-400 hover:text-white font-semibold text-[11px] underline ml-1 cursor-pointer"
            >
              All Portals
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        {activePortal === "asha" && (
          <ASHAPortal onBack={goHome} demoMode={demoMode} />
        )}
        {activePortal === "patient" && (
          !familyAuthData ? (
            <PatientLogin onLoggedIn={setFamilyAuthData} onBack={goHome} />
          ) : (
            <FamilyDashboard
              family={familyAuthData.family}
              members={familyAuthData.members}
              onLogout={() => setFamilyAuthData(null)}
              onBack={goHome}
              onOpenEmergencySOS={() => setShowEmergencySOS(true)}
            />
          )
        )}
        {activePortal === "reception" && (
          <HospitalStaffWorkspace
            onBack={goHome}
            goHome={goHome}
            isDemoMode={demoMode}
            demoDataEnabled={demoMode}
          />
        )}
        {activePortal === "doctor" && (
          <DoctorWorkspace
            onBack={goHome}
            goHome={goHome}
            isDemoMode={demoMode}
            demoDataEnabled={demoMode}
            onOpenPatientJourney={openPatientJourneyForMember}
          />
        )}
        {activePortal === "home" && (
          <LandingPage
            onSelectPortal={setActivePortal}
            onOpenEmergencySOS={() => setShowEmergencySOS(true)}
          />
        )}
      </div>

      {showEmergencySOS && (
        <EmergencySOSModal onClose={() => setShowEmergencySOS(false)} />
      )}
    </div>
  );
}

export default App;