import React, { useState, useEffect, useRef } from "react";
import { Home, Users, Send, AlertTriangle, BarChart2, ChevronLeft, UserCircle2, Menu, X, Pill, HeartPulse, Camera, Loader2 } from "lucide-react";
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
import { supabase } from "../../services/supabase";

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

  // Priya Deshmukh Avatar State & Supabase Storage Integration
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("radvault_asha_avatar") || null;
    }
    return null;
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function syncAshaAvatar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
          localStorage.setItem("radvault_asha_avatar", user.user_metadata.avatar_url);
        }
      } catch (err) {
        console.warn("[ASHAPortal] Avatar metadata sync notice:", err);
      }
    }
    syncAshaAvatar();
  }, []);

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingAvatar(true);
      setImgError(false);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement("canvas");
            const TARGET_SIZE = 320;
            canvas.width = TARGET_SIZE;
            canvas.height = TARGET_SIZE;
            const ctx = canvas.getContext("2d");

            // Center square crop
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

            const base64Data = canvas.toDataURL("image/jpeg", 0.88);
            let finalAvatarUrl = base64Data;

            // 1. Upload to Supabase Storage 'avatars' bucket
            try {
              const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
              if (blob) {
                const fileName = `asha_avatar_priya_${Date.now()}.jpg`;
                const { error: uploadErr } = await supabase.storage
                  .from("avatars")
                  .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

                if (!uploadErr) {
                  const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(fileName);
                  if (pubData?.publicUrl) {
                    finalAvatarUrl = pubData.publicUrl;
                  }
                } else {
                  console.warn("Storage upload notice (falling back to base64):", uploadErr.message);
                }
              }
            } catch (storageErr) {
              console.warn("Storage upload exception, using direct payload:", storageErr);
            }

            // 2. Persist to Supabase Auth user metadata
            try {
              await supabase.auth.updateUser({
                data: { avatar_url: finalAvatarUrl }
              });
            } catch (authErr) {
              console.warn("Auth metadata sync notice:", authErr);
            }

            // 3. Save to localStorage & update state
            localStorage.setItem("radvault_asha_avatar", finalAvatarUrl);
            setAvatarUrl(finalAvatarUrl);
            setImgError(false);
          } catch (err) {
            console.error("Avatar compression/upload failed:", err);
          } finally {
            setUploadingAvatar(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File selection error:", err);
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async (e) => {
    e?.stopPropagation();
    setUploadingAvatar(true);
    try {
      localStorage.removeItem("radvault_asha_avatar");
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: null }
        });
      } catch (_) {}
      setAvatarUrl(null);
      setImgError(false);
    } catch (err) {
      console.error("Failed to remove avatar:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

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
    <div className="h-screen w-full overflow-hidden bg-[#F5FBF9] flex flex-col md:flex-row font-sans">
      
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
          {avatarUrl && !imgError ? (
            <img src={avatarUrl} alt="Priya D." className="w-5 h-5 rounded-full object-cover border border-[#008F83]/40" onError={() => setImgError(true)} />
          ) : (
            <UserCircle2 className="w-4 h-4 text-[#008F83]" />
          )}
          <span className="text-[10px] font-bold text-[#008F83] tracking-wide uppercase">Priya D.</span>
        </div>
      </header>

      {/* ── Column Slider / Sidebar ── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!showNav ? 'hidden md:flex' : ''}`}
      >
        <div className="p-4 sm:p-5 flex flex-col h-full min-h-0 overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-5 shrink-0">
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
          <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
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
          <div className="mt-auto pt-3 border-t border-slate-100 shrink-0 space-y-2.5">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {/* Priya Deshmukh Interactive Profile Card with Big Avatar Circle */}
            <div className="p-2.5 rounded-2xl bg-gradient-to-b from-[#F0F9F8] to-[#E6F4F1] border border-[#CDEEE4] shadow-xs flex items-center gap-3">
              {/* Enlarged Avatar Circle */}
              <div
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full bg-white border-2 border-[#008F83]/40 shadow-xs flex items-center justify-center shrink-0 cursor-pointer group overflow-hidden hover:border-[#008F83] transition-all"
                title="Click to change Priya's profile photo"
              >
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt="Priya Deshmukh"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#008F83] to-[#00695F] text-white">
                    <span className="text-base font-black tracking-wider">PD</span>
                  </div>
                )}

                {/* Hover & Loading Overlay */}
                <div
                  className={`absolute inset-0 bg-black/45 flex flex-col items-center justify-center transition-opacity ${
                    uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-white" />
                      <span className="text-[8px] font-extrabold uppercase text-white mt-0.5 tracking-tighter">Edit</span>
                    </>
                  )}
                </div>

                {/* Camera Badge in bottom right corner */}
                {!uploadingAvatar && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#008F83] border border-white rounded-full flex items-center justify-center shadow-xs group-hover:hidden">
                    <Camera className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Name, Designation & Action buttons */}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 truncate" title="Priya Deshmukh">
                  Priya Deshmukh
                </div>
                <div className="text-[10px] text-[#007A70] font-bold truncate">
                  Sector 4 · ASHA
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-[9px] font-bold text-[#007A70] hover:text-[#00574F] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Camera className="w-2.5 h-2.5" />
                    <span>{uploadingAvatar ? "Saving..." : avatarUrl ? "Change" : "Upload photo"}</span>
                  </button>
                  {avatarUrl && (
                    <>
                      <span className="text-slate-300 text-[10px]">·</span>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="text-[9px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Exit to Portals Button - Elevated and Fully Clear */}
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors border border-slate-200 shadow-xs cursor-pointer mb-1"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Exit to Portals</span>
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