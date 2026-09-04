import React, { useState } from "react";
import { HeartPulse, Leaf, Users, Building2, ArrowRight } from "lucide-react";
import ASHAPortal from "./components/ASHA/ASHAPortal";
import PatientLogin from "./components/Patient/PatientLogin";
import FamilyDashboard from "./components/Patient/FamilyDashboard";
import illusAsha from "./assets/illus_asha.jpg";
import illusFamily from "./assets/illus_family.jpg";
import illusHospital from "./assets/illus_hospital.jpg";
import HospitalStaffWorkspace from './components/workspaces/HospitalStaffWorkspace';

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
    desc: "Diagnostic workspace",
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
];

function LandingPage({ onSelectPortal }) {
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
                          width: (hoveredPortal === 'patient' && i === 0) || (hoveredPortal === 'reception' && i <= 1) ? '100%' : '0%',
                          backgroundColor: "#008F83"
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
                      {activePortal.key === "asha" ? "Community Care Begins Here" : activePortal.key === "patient" ? "Health Stays Connected with Family" : "Community Care Connects to Clinical Care"}
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
  const [activePortal, setActivePortal] = useState(() => localStorage.getItem("radvault_portal") || "home");
  const [familyAuthData, setFamilyAuthData] = useState(() => {
    const saved = localStorage.getItem("radvault_family_auth");
    return saved ? JSON.parse(saved) : null;
  });

  React.useEffect(() => {
    localStorage.setItem("radvault_portal", activePortal);
  }, [activePortal]);

  React.useEffect(() => {
    if (familyAuthData) {
      localStorage.setItem("radvault_family_auth", JSON.stringify(familyAuthData));
    } else {
      localStorage.removeItem("radvault_family_auth");
    }
  }, [familyAuthData]);

  const goHome = () => setActivePortal("home");

  if (activePortal === "asha") return <ASHAPortal onBack={goHome} />;
  if (activePortal === "patient") {
    if (!familyAuthData) return <PatientLogin onLoggedIn={setFamilyAuthData} onBack={goHome} />;
    return <FamilyDashboard family={familyAuthData.family} members={familyAuthData.members} onLogout={() => setFamilyAuthData(null)} onBack={goHome} />;
  }
  if (activePortal === "reception") {
    return <HospitalStaffWorkspace onBack={goHome} goHome={goHome} />;
  }

  return <LandingPage onSelectPortal={setActivePortal} />;
}

export default App;