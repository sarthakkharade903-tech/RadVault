import React, { useState, useEffect } from "react";
import { HeartPulse, LogOut, FileText, Calendar, Home, Users, ChevronLeft, UploadCloud, Plus, Stethoscope, Syringe, Pill, FileImage, ShieldAlert, CheckCircle2, Droplet, Sparkles, Loader2 } from "lucide-react";
import PatientHome from "../dashboard/PatientHome";
import CareHub from "./CareHub";
import TimelineWrapper from './TimelineWrapper';
import MedicalDocumentCard from './MedicalDocumentCard';
import DocumentPreview from './DocumentPreview';
import UploadModal from './UploadModal';
import { getDocuments } from '../../services/vaultService';

const NAV = [
  { key: "home",    label: "Overview",      Icon: Home },
  { key: "timeline", label: "Timeline", Icon: Calendar },
  { key: "records", label: "Vault",         Icon: FileText },
  { key: "care",    label: "Care Hub",      Icon: Stethoscope },
  { key: "family",  label: "Family",         Icon: Users },
];

const RECORD_CATEGORIES = ["All", "Lab Reports", "Prescriptions", "Scans", "Hospital", "Vaccination", "Other"];

export default function FamilyDashboard({ family, members, onLogout, onBack }) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || null);
  const [activeTab, setActiveTab]               = useState("home");
  const [recordCat, setRecordCat]               = useState("All");

  // Vault State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const selectedMember = members.find(m => m.id === selectedMemberId) || members[0];

  useEffect(() => {
    async function loadDocs() {
      if (!selectedMember?.id || activeTab !== "records") return;
      setLoadingDocs(true);
      const { data } = await getDocuments(selectedMember.id, recordCat);
      setDocuments(data);
      setLoadingDocs(false);
    }
    loadDocs();
  }, [selectedMember?.id, recordCat, activeTab]);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#FCFBF8] flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Compact Header ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 z-10">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors -ml-1">
              <ChevronLeft className="w-4 h-4 text-[#64748B]" />
            </button>
            <div className="flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-[#008F83]" strokeWidth={2.5} />
              <span className="text-[15px] font-black text-[#16324F] tracking-tight">RadVault</span>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-[10px] text-[#64748B] font-bold hover:text-red-600 px-2 py-1.5 rounded-lg transition-colors">
            Sign Out <LogOut className="w-3 h-3" />
          </button>
        </div>

        {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Better Member Switcher ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
        <div className="px-4 pb-3 overflow-x-auto flex gap-2.5 scrollbar-hide">
          {members.map(m => {
            const isActive = m.id === selectedMemberId;
            return (
              <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 p-1.5 pr-4 rounded-full border transition-all duration-300 ${
                  isActive ? "border-amber-200 bg-amber-50 shadow-sm" : "border-transparent bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-100"
                }`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black shadow-sm transition-all ${
                  isActive ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" : "bg-slate-100 text-[#64748B]"
                }`}>
                  {m.name[0].toUpperCase()}
                </div>
                
                <div className="text-left flex flex-col justify-center">
                  <p className={`text-[11px] font-bold leading-none truncate max-w-[70px] ${isActive ? "text-amber-900" : "text-[#16324F]"}`}>
                    {m.name.split(" ")[0]}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${isActive ? "text-amber-600" : "text-[#94A3B8]"}`}>
                    {(m.relation_to_head || "MEMBER").split(" ")[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Main Content Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "home" && <PatientHome member={selectedMember} />}
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Timeline Tab Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "timeline" && <TimelineWrapper member={selectedMember} />}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Medical Vault Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {/* ── Medical Vault ── */}
        {activeTab === "records" && (
          <div className="min-h-full flex flex-col pb-10 bg-[#FCFBF8] relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl -z-10" />

            <div className="max-w-2xl mx-auto w-full px-4 pt-4 relative z-10">
              
              {/* Header */}
              <div className="flex items-start justify-between mb-8 pt-4">
                <div>
                  <h2 className="text-[22px] font-black text-[#16324F] tracking-tight uppercase">Medical Vault</h2>
                  <p className="text-[13px] font-medium text-[#64748B] mt-1.5">Your health records, organized in one place</p>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 bg-[#16324F] text-white px-5 py-3 rounded-xl text-[12px] font-black shadow-lg hover:bg-slate-800 transition-colors shrink-0 uppercase tracking-wide"
                >
                  <Plus className="w-4 h-4" /> Upload
                </button>
              </div>

              {/* ── Summary Strip ── */}
              {!loadingDocs && documents.length > 0 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-8 pb-2">
                  {[
                    { label: 'DOCUMENTS',    count: documents.length,                                       skip0: false },
                    { label: 'LAB',          count: documents.filter(d => d.category === 'Lab Reports').length,  skip0: true },
                    { label: 'PRESCRIP',     count: documents.filter(d => d.category === 'Prescriptions').length,skip0: true },
                    { label: 'SCANS',        count: documents.filter(d => d.category === 'Scans').length,        skip0: true },
                    { label: 'VACCINE',      count: documents.filter(d => d.category === 'Vaccination').length,  skip0: true },
                  ].filter(s => !s.skip0 || s.count > 0).map((s, idx) => (
                    <div key={s.label} className={`flex-shrink-0 relative overflow-hidden rounded-[20px] px-5 py-4 min-w-[100px] text-center ${idx === 0 ? "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 shadow-sm" : "bg-white border border-slate-200 shadow-sm"}`}>
                      {idx === 0 && <div className="absolute top-0 right-0 w-12 h-12 bg-amber-200/40 rounded-bl-full" />}
                      <p className={`text-[24px] font-black leading-none relative z-10 ${idx === 0 ? "text-amber-900" : "text-[#16324F]"}`}>{s.count}</p>
                      <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-2 relative z-10 ${idx === 0 ? "text-amber-700" : "text-[#64748B]"}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Category chips */}
              <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-2 mb-4">
                {RECORD_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setRecordCat(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                      recordCat === cat
                        ? "bg-[#16324F] text-white shadow-md"
                        : "bg-white text-[#64748B] border border-slate-200 hover:border-slate-300"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>

              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#008F83]" />
                  <p className="text-[13px] font-bold text-slate-400">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map(doc => (
                    <MedicalDocumentCard key={doc.id} doc={doc} onView={setPreviewDoc} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                  <div className="w-20 h-20 bg-white border border-dashed border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    {recordCat === "Lab Reports"   ? <Droplet    className="w-9 h-9 text-sky-300" />
                    : recordCat === "Prescriptions" ? <Pill        className="w-9 h-9 text-violet-300" />
                    : recordCat === "Scans"         ? <FileImage   className="w-9 h-9 text-amber-300" />
                    : recordCat === "Vaccination"   ? <Syringe     className="w-9 h-9 text-emerald-300" />
                    : recordCat === "Hospital"      ? <Stethoscope className="w-9 h-9 text-rose-300" />
                    :                                <FileText     className="w-9 h-9 text-slate-300" />}
                  </div>
                  <h3 className="text-[16px] font-black text-[#16324F] mb-2">
                    {recordCat === "All" ? "No documents yet" : `No ${recordCat.toLowerCase()} yet`}
                  </h3>
                  <p className="text-[13px] font-medium text-[#64748B] max-w-[240px] leading-relaxed mx-auto">
                    {recordCat === "Prescriptions" ? "Prescriptions shared by your doctor will appear here."
                    : recordCat === "Lab Reports"  ? "Upload or receive lab reports from your clinic."
                    : recordCat === "Vaccination"  ? "Vaccination records from your ASHA worker or PHC will show here."
                    : recordCat === "Scans"        ? "Scan and imaging reports will appear here once uploaded."
                    : "Upload prescriptions, lab reports, scans and other health documents to keep your medical history together."}
                  </p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-6 flex items-center gap-1.5 bg-white border border-slate-200 text-[#16324F] px-5 py-3 rounded-xl text-[13px] font-bold shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Upload document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Care Hub Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "care" && (
          <CareHub member={selectedMember} />
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Family Tab Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {/* ── Family Tab ── */}
        {activeTab === "family" && (
          <div className="min-h-full px-4 py-6 bg-[#FCFBF8] space-y-8 pb-24 relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-bl-[100px] -z-10" />
            <div className="absolute top-40 -left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -z-10" />

            {/* Header */}
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-[22px] font-black text-[#16324F] leading-none mb-1.5 tracking-tight">{family?.family_name || "Your Family"}</h2>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  {family?.village && `${family.village} • `}
                  {members.length} Member{members.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-[11px] font-black hover:bg-amber-100 transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            </div>
            
            {/* Quick Member List */}
            <div className="grid gap-3">
              {members.map(m => {
                const isSelected = m.id === selectedMemberId;
                return (
                  <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                    className={`relative w-full text-left flex items-center justify-between gap-3 p-4 rounded-3xl border transition-all duration-300 overflow-hidden ${
                      isSelected ? "border-amber-200 bg-white shadow-[0_8px_24px_-8px_rgba(251,191,36,0.2)]" : "border-[#E2E8F0] bg-white hover:border-slate-300 shadow-sm"
                    }`}>
                    
                    {/* Saffron accent geometric shape for selected */}
                    {isSelected && (
                      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-amber-50 to-transparent pointer-events-none" />
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[16px] font-black shrink-0 transition-all ${
                        isSelected ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200" : "bg-slate-100 text-[#64748B]"
                      }`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-black text-[15px] leading-tight mb-1 ${isSelected ? "text-[#16324F]" : "text-[#16324F]"}`}>{m.name}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isSelected ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                            {(m.relation_to_head || "MEMBER").split(" ")[0]}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-bold">{m.age_years}y • {m.gender}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10">
                      {isSelected ? <CheckCircle2 className="w-5 h-5 text-amber-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Government Benefits & Identity Section */}
            <div className="pt-6 relative">
              <h3 className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Government Identity
              </h3>

              {/* Safe ABHA Card - Geometric style */}
              <div className="bg-white rounded-[24px] border border-amber-100 shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] p-5 overflow-hidden relative mb-6">
                {/* Decorative Saffron Blobs */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl" />
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/20 rounded-bl-[100px]" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h4 className="text-[16px] font-black text-[#16324F] tracking-tight">ABHA Identity</h4>
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mt-0.5">Ayushman Bharat Health Account</p>
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1.5">ABHA Number</p>
                    {selectedMember?.abha_number ? (
                      <p className="text-[16px] font-black tracking-[0.1em] text-[#16324F] font-mono bg-slate-50 px-3 py-1.5 rounded-xl inline-block border border-slate-100">
                        {selectedMember.abha_number}
                      </p>
                    ) : (
                      <p className="text-[13px] font-bold text-slate-400 italic">Not linked yet</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1.5">ABHA Address</p>
                    {selectedMember?.abha_address ? (
                      <p className="text-[13px] font-bold text-[#16324F] bg-slate-50 px-3 py-1.5 rounded-xl inline-block border border-slate-100">
                        {selectedMember.abha_address}
                      </p>
                    ) : (
                      <p className="text-[13px] font-bold text-slate-400 italic">Not linked yet</p>
                    )}
                  </div>
                  
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Verification required</span>
                    </div>
                    {!selectedMember?.abha_number && (
                      <button className="text-[11px] font-black text-[#008F83] hover:text-[#007A70] transition-colors uppercase tracking-wide">
                        Link ABHA →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Government Health Schemes */}
              <h3 className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 mt-8">
                <HeartPulse className="w-4 h-4 text-[#008F83]" /> Health Schemes
              </h3>
              
              <div className="grid gap-3">
                {/* PM-JAY Card */}
                <div className="bg-white rounded-[20px] border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-amber-400 transition-colors" />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-[14px] font-black text-[#16324F]">PM-JAY</h4>
                      <p className="text-[11px] font-bold text-[#64748B] mt-0.5">Health coverage up to ₹5L</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification required</span>
                  </div>
                  <button className="w-full text-center text-[11px] font-black text-[#16324F] bg-slate-50 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                    Check Eligibility
                  </button>
                </div>

                {/* JSY Card */}
                {selectedMember?.is_pregnant && (
                  <div className="bg-white rounded-[20px] border border-emerald-100 p-4 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.1)] relative overflow-hidden group cursor-pointer">
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400" />
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full -z-10" />
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-[14px] font-black text-[#16324F]">Janani Suraksha Yojana</h4>
                        <p className="text-[11px] font-bold text-[#64748B] mt-0.5">Maternal health benefits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-4 bg-emerald-50 w-fit px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Eligibility Confirmed</span>
                    </div>
                    <button className="w-full text-center text-[11px] font-black text-[#16324F] bg-slate-50 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                      View details
                    </button>
                  </div>
                )}
                
                {/* Immunization */}
                {selectedMember?.is_child && (
                  <div className="bg-white rounded-[20px] border border-sky-100 p-4 shadow-[0_2px_10px_-4px_rgba(14,165,233,0.1)] relative overflow-hidden group cursor-pointer">
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-sky-400" />
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-[14px] font-black text-[#16324F]">Mission Indradhanush</h4>
                        <p className="text-[11px] font-bold text-[#64748B] mt-0.5">Child immunization</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-4 bg-sky-50 w-fit px-2.5 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Active Schedule</span>
                    </div>
                    <button className="w-full text-center text-[11px] font-black text-[#16324F] bg-slate-50 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                      View Schedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Native Mobile Bottom Nav ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <nav className="flex-shrink-0 bg-white border-t border-slate-200/60 px-2 pt-2 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.02)] z-20">
        <div className="flex items-center justify-around max-w-md mx-auto pb-2">
          {NAV.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl min-w-[70px] relative group">
                {active && (
                  <div className="absolute -top-3 w-8 h-1 bg-[#008F83] rounded-b-full transition-all" />
                )}
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-[#008F83]" : "text-[#94A3B8] group-hover:text-[#64748B]"}`} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-bold transition-colors ${active ? "text-[#008F83]" : "text-[#94A3B8]"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      {/* Modals */}
      {showUpload && (
        <UploadModal
          member={selectedMember}
          familyId={family?.id}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setRecordCat("All");
            getDocuments(selectedMember.id, "All").then(({ data }) => setDocuments(data));
          }}
        />
      )}
      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
      
    </div>
  );
}