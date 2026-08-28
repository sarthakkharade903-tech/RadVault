import React, { useState, useEffect } from "react";
import { Home, Users, Send, AlertTriangle, BarChart2, ChevronLeft, UserCircle2 } from "lucide-react";
import ASHAHome from "./ASHAHome";
import MyVillage from "./MyVillage";
import AddFamilyForm from "./AddFamilyForm";
import FamilyManager from "./FamilyManager";
import PatientProfileBuilder from "./PatientProfileBuilder";
import FollowUpTracker from "./FollowUpTracker";
import ActivityTracker from "./ActivityTracker";
import ReferralsDashboard from "../Referrals/ReferralsDashboard";
import ASHAVisitLogger from "./ASHAVisitLogger";
import { getVillagePatients, getFamilies } from "../../services/ashaService";

const NAV = [
  { key: "home",     label: "Home",      Icon: Home },
  { key: "village",  label: "Village",   Icon: Users },
  { key: "refer",    label: "Refer",     Icon: Send },
  { key: "followup", label: "Follow-Up", Icon: AlertTriangle },
  { key: "activity", label: "Activity",  Icon: BarChart2 },
];
const MAIN_SCREENS = ["home","village","refer","followup","activity"];

export default function ASHAPortal({ onBack }) {
  const [screen, setScreen]               = useState("home");
  const [patients, setPatients]           = useState([]);
  const [families, setFamilies]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [addMemberFamily, setAddMemberFamily] = useState(null);
  const [editingFamily, setEditingFamily]   = useState(null);
  const [logVisitPatient, setLogVisitPatient] = useState(null);

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
    <div className="h-[100dvh] w-full overflow-hidden bg-[#F5FBF9] flex flex-col font-sans">
      {/* ── Top Bar (Polished) ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#008F83] font-bold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Portals
        </button>
        <div className="flex items-center gap-2 bg-[#E8F7F3] px-3 py-1.5 rounded-full border border-[#008F83]/20">
          <UserCircle2 className="w-4 h-4 text-[#008F83]" />
          <span className="text-[11px] font-bold text-[#008F83] tracking-wide uppercase">Priya D.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {screen === "home"    && <ASHAHome patients={patients} loading={loading} onNavigate={setScreen} />}
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
        {screen === "refer"    && <ReferralsDashboard onBack={() => setScreen("home")} />}
        {screen === "followup" && <FollowUpTracker patients={patients} onEditPatient={p => { setEditingPatient(p); setSelectedFamily(p.families || null); setScreen("edit_member"); }} />}
        {screen === "activity" && <ActivityTracker patients={patients} />}
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
            onLogVisit={(p) => { setLogVisitPatient(p); setScreen("log_visit"); }}
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
            onBack={() => setScreen("manage_family")}
            onSaved={() => { loadData(); setScreen("manage_family"); }}
          />
        )}
      </div>

      {/* ── Bottom Nav (Tactile & Clean) ── */}
      {showNav && (
        <nav className="bg-white border-t border-[#E2E8F0] px-2 pb-safe pt-2 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {NAV.map(({ key, label, Icon }) => {
              const active = screen === key;
              return (
                <button key={key} onClick={() => setScreen(key)}
                  className={"flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 rounded-2xl transition-all " + (active ? "bg-[#E8F7F3]" : "hover:bg-gray-50")}>
                  <Icon className={"w-5 h-5 " + (active ? "text-[#008F83]" : "text-[#64748B]")} strokeWidth={active ? 2.5 : 2} />
                  <span className={"text-[10px] font-bold tracking-tight " + (active ? "text-[#008F83]" : "text-[#64748B]")}>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}