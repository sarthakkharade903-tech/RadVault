import React, { useState, useEffect } from "react";
import { Home, Users, Send, AlertTriangle, BarChart2, ChevronLeft, UserCircle2, Menu, X, Pill, HeartPulse } from "lucide-react";
import ASHAHome from "./ASHAHome";
import MyVillage from "./MyVillage";
import AddFamilyForm from "./AddFamilyForm";
import FamilyManager from "./FamilyManager";
import PatientProfileBuilder from "./PatientProfileBuilder";
import FollowUpTracker from "./FollowUpTracker";
import ActivityTracker from "./ActivityTracker";
import ReferralsDashboard from "../Referrals/ReferralsDashboard";
import ASHAVisitLogger from "./ASHAVisitLogger";
import MedicineKitManager from "./MedicineKitManager";
import { getVillagePatients, getFamilies } from "../../services/ashaService";

const NAV = [
  { key: "home",     label: "Home",         Icon: Home },
  { key: "village",  label: "Village",      Icon: Users },
  { key: "refer",    label: "Refer",        Icon: Send },
  { key: "followup", label: "Follow-Up",    Icon: AlertTriangle },
  { key: "activity", label: "Activity",     Icon: BarChart2 },
  { key: "medicine", label: "Medicine Kit", Icon: Pill },
];
const MAIN_SCREENS = ["home","village","refer","followup","activity","medicine"];

export default function ASHAPortal({ onBack, demoMode = false }) {
  const [screen, setScreen]               = useState(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("screen");
      if (q && MAIN_SCREENS.includes(q)) return q;
    }
    return "home";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patients, setPatients]           = useState([]);
  const [families, setFamilies]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [addMemberFamily, setAddMemberFamily] = useState(null);
  const [editingFamily, setEditingFamily]   = useState(null);
  const [logVisitPatient, setLogVisitPatient] = useState(null);
  const [logVisitReturnScreen, setLogVisitReturnScreen] = useState("manage_family");
  const [referralInitialTab, setReferralInitialTab] = useState("list");

  const loadData = async () => {
    setLoading(true);
    const [pRes, fRes] = await Promise.all([getVillagePatients(), getFamilies()]);
    if (pRes.data) setPatients(pRes.data);
    if (fRes.data) setFamilies(fRes.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const showNav = MAIN_SCREENS.includes(screen);

  return (
    <div className="h-[calc(100vh-37px)] w-full overflow-hidden bg-[#F5FBF9] flex flex-col md:flex-row font-sans">
      
      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-black text-sm text-[#008F83]">ASHA Portal</span>
        </div>
        <div className="flex items-center gap-2 bg-[#E8F7F3] px-3 py-1.5 rounded-full border border-[#008F83]/20">
          <UserCircle2 className="w-4 h-4 text-[#008F83]" />
          <span className="text-[10px] font-bold text-[#008F83] tracking-wide uppercase">Priya D.</span>
        </div>
      </header>

      {/* ── Column Slider / Sidebar ── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!showNav ? 'hidden md:flex' : ''}`}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF7F3] border border-[#CDEEE4] text-[#007A70] flex items-center justify-center font-black shadow-inner">
                <HeartPulse className="w-5 h-5 text-[#007A70]" />
              </div>
              <div>
                <div className="font-black text-base leading-tight text-[#132B3E]">RadVault</div>
                <div className="text-[10px] font-extrabold text-[#007A70] uppercase tracking-wider">
                  ASHA CARE
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="flex-1 space-y-1.5">
            {NAV.map(({ key, label, Icon }) => {
              const active = screen === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "refer") setReferralInitialTab("list");
                    setScreen(key);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-[#007A70] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#EAF7F3]/70 hover:text-[#007A70]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
             <div className="flex items-center gap-3 px-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#EAF7F3] border border-[#CDEEE4] flex items-center justify-center text-sm font-bold text-[#007A70] shrink-0 shadow-inner">
                  👩‍⚕️
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">Priya Deshmukh</div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">Sector 4 · ASHA</div>
                </div>
              </div>
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Exit to Portals
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto h-full w-full">
        {screen === "home"    && (
          <ASHAHome
            patients={patients}
            loading={loading}
            demoMode={demoMode}
            onRefresh={loadData}
            onNavigate={setScreen}
            onOpenAddFamily={() => { setEditingFamily(null); setScreen("add_family"); }}
            onOpenAddMember={() => { setAddMemberFamily(null); setEditingPatient(null); setScreen("add_member"); }}
            onOpenReferral={(mode = "new") => { setReferralInitialTab(mode); setScreen("refer"); }}
          />
        )}
        {screen === "village" && (
          <MyVillage
            families={families}
            loading={loading}
            onRefresh={loadData}
            onAddFamily={() => { setEditingFamily(null); setScreen("add_family"); }}
            onOpenFamily={(fam) => { setSelectedFamily(fam); setScreen("manage_family"); }}
            onAddMember={(fam) => { setAddMemberFamily(fam); setEditingPatient(null); setScreen("add_member"); }}
          />
        )}
        {screen === "refer"    && (
          <ReferralsDashboard
            initialTab={referralInitialTab}
            onBack={() => setScreen("home")}
            demoMode={demoMode}
          />
        )}
        {screen === "followup" && (
          <FollowUpTracker
            patients={patients}
            demoMode={demoMode}
            onLogVisit={(p) => {
              setLogVisitPatient(p);
              setLogVisitReturnScreen("followup");
              setScreen("log_visit");
            }}
            onEditPatient={p => {
              setEditingPatient(p);
              setSelectedFamily(p.families || null);
              setScreen("edit_member");
            }}
          />
        )}
        {screen === "activity" && <ActivityTracker patients={patients} />}
        {screen === "medicine" && <MedicineKitManager isFullPage={true} />}

        {screen === "add_family" && (
          <AddFamilyForm
            family={editingFamily}
            onBack={() => { editingFamily ? setScreen("manage_family") : setScreen("village"); }}
            onSaved={(savedFam) => { loadData(); setSelectedFamily(savedFam); setScreen("manage_family"); }}
          />
        )}
        {screen === "manage_family" && selectedFamily && (
          <FamilyManager
            family={selectedFamily}
            onBack={() => { loadData(); setScreen("village"); }}
            onAddMember={(fam) => { setAddMemberFamily(fam); setEditingPatient(null); setScreen("add_member"); }}
            onEditMember={(p) => { setEditingPatient(p); setAddMemberFamily(selectedFamily); setScreen("edit_member"); }}
            onEditFamily={() => { setEditingFamily(selectedFamily); setScreen("add_family"); }}
            onLogVisit={(p) => {
              setLogVisitPatient(p);
              setLogVisitReturnScreen("manage_family");
              setScreen("log_visit");
            }}
          />
        )}
        {screen === "add_member" && (
          <PatientProfileBuilder
            patient={null}
            family={addMemberFamily}
            onBack={() => { addMemberFamily ? setScreen("manage_family") : setScreen("village"); }}
            onSaved={() => { loadData(); if(addMemberFamily){ setSelectedFamily(addMemberFamily); setScreen("manage_family"); } else { setScreen("village"); } }}
          />
        )}
        {screen === "edit_member" && (
          <PatientProfileBuilder
            patient={editingPatient}
            family={addMemberFamily || selectedFamily}
            onBack={() => { selectedFamily ? setScreen("manage_family") : setScreen("village"); }}
            onSaved={() => { loadData(); selectedFamily ? setScreen("manage_family") : setScreen("village"); }}
          />
        )}
        {screen === "log_visit" && logVisitPatient && (
          <ASHAVisitLogger
            patient={logVisitPatient}
            onBack={() => setScreen(logVisitReturnScreen || "manage_family")}
            onSaved={() => { loadData(); setScreen(logVisitReturnScreen || "manage_family"); }}
          />
        )}
      </main>
    </div>
  );
}