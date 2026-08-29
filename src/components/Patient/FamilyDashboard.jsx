import React, { useState, useEffect } from "react";
import { HeartPulse, LogOut, FileText, Calendar, Home, Users, ChevronLeft, UploadCloud, Plus, Stethoscope, Syringe, Pill, FileImage, ShieldAlert, CheckCircle2, Droplet, Sparkles, Loader2, Building2, Shield, ArrowRight } from "lucide-react";
import PatientHome from "../dashboard/PatientHome";
import CareHub from "./CareHub";
import TimelineWrapper from './TimelineWrapper';
import MedicalDocumentCard from './MedicalDocumentCard';
import DocumentPreview from './DocumentPreview';
import UploadModal from './UploadModal';
import { getDocuments } from '../../services/vaultService';

const NAV = [
  { key: "home",     label: "Overview",  Icon: Home },
  { key: "timeline", label: "Timeline",  Icon: Calendar },
  { key: "records",  label: "Vault",     Icon: FileText },
  { key: "care",     label: "Care Hub",  Icon: Stethoscope },
  { key: "family",   label: "Family",    Icon: Users },
];

const RECORD_CATEGORIES = ["All", "Lab Reports", "Prescriptions", "Scans", "Hospital", "Vaccination", "Other"];

export default function FamilyDashboard({ family, members, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [recordCat, setRecordCat] = useState("All");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId) || members[0];

  useEffect(() => {
    if (selectedMember) {
      setSelectedMemberId(selectedMember.id);
    }
  }, [members]);

  useEffect(() => {
    if (activeTab === "records" && selectedMember) {
      setLoadingDocs(true);
      getDocuments(selectedMember.id, recordCat === "All" ? null : recordCat)
        .then(({ data }) => setDocuments(data || []))
        .finally(() => setLoadingDocs(false));
    }
  }, [activeTab, selectedMember, recordCat]);

  return (
    <div className="flex flex-col h-screen bg-[#FCFAF5] font-sans text-slate-800 selection:bg-amber-100">
      
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border-b border-amber-100/60 z-30">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#16324F]" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-300/40">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[18px] font-black text-[#16324F] tracking-tight">RadVault</h1>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-[#64748B] hover:text-amber-600 text-[11px] font-black transition-colors tracking-widest uppercase">
          Sign Out <LogOut className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* ── Member Switcher Strip ── */}
      <div className="flex-shrink-0 bg-white/60 backdrop-blur-sm border-b border-amber-100/40 py-2.5 px-4 z-20">
        <div className="max-w-4xl mx-auto flex gap-3 overflow-x-auto scrollbar-hide">
          {members.map(m => {
            const isActive = m.id === selectedMember.id;
            return (
              <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-300 shrink-0 ${
                  isActive 
                    ? "border-amber-300 bg-amber-50/90 shadow-sm" 
                    : "border-transparent bg-white shadow-sm hover:border-slate-200 opacity-70 hover:opacity-100"
                }`}>
                
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.name} className={`w-8 h-8 rounded-full object-cover shadow-sm ${isActive ? "ring-2 ring-amber-400" : ""}`} />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black ${
                    isActive ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" : "bg-slate-100 text-[#64748B]"
                  }`}>
                    {m.name[0].toUpperCase()}
                  </div>
                )}
                
                <div className="text-left flex flex-col justify-center">
                  <p className={`text-[12px] font-bold leading-none truncate max-w-[80px] ${isActive ? "text-[#16324F]" : "text-[#64748B]"}`}>
                    {m.name.split(" ")[0]}
                  </p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? "text-amber-700" : "text-[#94A3B8]"}`}>
                    {m.relation_to_head === "Head" ? "HEAD" : (m.relation_to_head || "Member").toUpperCase()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto relative">
        {/* ── Overview Tab ── */}
        {activeTab === "home" && (
          <div className="pb-36">
            <PatientHome member={selectedMember} />
          </div>
        )}
        
        {/* ── Timeline Tab ── */}
        {activeTab === "timeline" && (
          <div className="pb-36">
            <TimelineWrapper member={selectedMember} />
          </div>
        )}

        {/* ── Medical Vault Tab ── */}
        {activeTab === "records" && (
          <div className="min-h-full flex flex-col pb-36 bg-[#FCFAF5] relative overflow-hidden">
            {/* Background art */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-radial from-amber-200/20 to-transparent blur-[80px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-gradient-radial from-orange-200/10 to-transparent blur-[60px] pointer-events-none" />

            <div className="max-w-4xl mx-auto w-full px-4 pt-10 relative z-10">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white border border-amber-200 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_-8px_rgba(251,191,36,0.3)] text-amber-500 relative">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[28px] font-black text-[#16324F] tracking-tight uppercase">Medical Vault</h2>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <p className="text-[14px] font-medium text-[#64748B]">Your health records, organized in one place</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-6 py-3.5 rounded-full text-[13px] font-black shadow-lg shadow-amber-300/40 hover:shadow-xl hover:shadow-amber-400/50 transition-all uppercase tracking-widest shrink-0"
                >
                  <Plus className="w-4 h-4" /> Upload
                </button>
              </div>

              {/* Summary Strip */}
              {!loadingDocs && documents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  <div className="bg-white/90 backdrop-blur-md border border-amber-100/80 rounded-[24px] p-6 shadow-[0_8px_30px_-12px_rgba(251,191,36,0.15)] relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tl from-amber-100/60 to-transparent rounded-tl-[100px] pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[32px] font-black text-[#16324F] leading-none">{documents.length}</span>
                        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest mt-1 mb-0.5">Documents</p>
                        <p className="text-[10px] text-slate-400">Total documents</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-md border border-sky-100/80 rounded-[24px] p-6 shadow-[0_8px_30px_-12px_rgba(56,189,248,0.1)] relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tl from-sky-100/60 to-transparent rounded-tl-[100px] pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                        <Droplet className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[32px] font-black text-[#16324F] leading-none">{documents.filter(d => d.category === 'Lab Reports').length}</span>
                        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest mt-1 mb-0.5">Lab Report</p>
                        <p className="text-[10px] text-slate-400">Total lab reports</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-md border border-orange-100/80 rounded-[24px] p-6 shadow-[0_8px_30px_-12px_rgba(249,115,22,0.1)] relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tl from-orange-100/60 to-transparent rounded-tl-[100px] pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                        <Pill className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[32px] font-black text-[#16324F] leading-none">{documents.filter(d => d.category === 'Prescriptions').length}</span>
                        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest mt-1 mb-0.5">Prescription</p>
                        <p className="text-[10px] text-slate-400">Total prescriptions</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category chips */}
              <div className="flex overflow-x-auto gap-3 scrollbar-hide pb-2 mb-8">
                {[
                  { id: 'All',           label: 'All',           Icon: null },
                  { id: 'Lab Reports',   label: 'Lab Reports',   Icon: Droplet },
                  { id: 'Prescriptions', label: 'Prescriptions', Icon: Pill },
                  { id: 'Scans',         label: 'Scans',         Icon: FileImage },
                  { id: 'Hospital',      label: 'Hospital',      Icon: Building2 },
                  { id: 'Vaccination',   label: 'Vaccination',   Icon: Shield },
                  { id: 'Other',         label: 'Other',         Icon: FileText },
                ].map(cat => (
                  <button key={cat.id} onClick={() => setRecordCat(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-black tracking-widest uppercase transition-all duration-300 ${
                      recordCat === cat.id
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-[#16324F] shadow-lg shadow-amber-300/40 border border-amber-400"
                        : "bg-white text-[#64748B] border border-slate-200 hover:border-amber-200 hover:text-amber-600 hover:shadow-sm"
                    }`}>
                    {cat.Icon && <cat.Icon className="w-3.5 h-3.5" />}
                    {cat.label}
                  </button>
                ))}
              </div>

              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-[13px] font-black text-amber-700 tracking-widest uppercase">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-6">
                  {documents.map(doc => (
                    <MedicalDocumentCard key={doc.id} doc={doc} onView={setPreviewDoc} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                  <div className="w-24 h-24 bg-white border border-dashed border-amber-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <FileText className="w-10 h-10 text-amber-400" />
                  </div>
                  <h3 className="text-[18px] font-black text-[#16324F] mb-2">
                    {recordCat === "All" ? "No documents yet" : `No ${recordCat.toLowerCase()} yet`}
                  </h3>
                  <p className="text-[14px] font-medium text-[#64748B] max-w-[280px] leading-relaxed mx-auto">
                    Upload prescriptions, lab reports, scans and other health documents to keep your medical history together.
                  </p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-8 flex items-center gap-1.5 bg-white border border-slate-200 text-[#16324F] px-6 py-3 rounded-full text-[13px] font-black shadow-sm hover:bg-slate-50 transition-colors tracking-widest uppercase"
                  >
                    <Plus className="w-4 h-4" /> Upload document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Care Hub Tab ── */}
        {activeTab === "care" && (
          <div className="pb-36">
            <CareHub member={selectedMember} />
          </div>
        )}

        {/* ── Complete Family Tab ── */}
        {activeTab === "family" && (
          <div className="min-h-full px-4 py-8 bg-[#FCFAF5] space-y-8 pb-36 relative overflow-hidden">
            {/* Background art */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/10 rounded-full blur-3xl -z-10" />
            <div className="absolute top-60 left-[-50px] w-64 h-64 bg-amber-200/15 rounded-full blur-3xl -z-10" />

            <div className="max-w-2xl mx-auto relative z-10">
              
              {/* Header */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-[26px] font-black text-[#16324F] tracking-tight uppercase">{family?.family_name || "Your Family"}</h2>
                  <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                    {family?.village && `${family.village} • `}
                    {members.length} Member{members.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-2 rounded-full text-[11px] font-black shadow-md shadow-amber-300/40 hover:shadow-lg transition-all tracking-widest uppercase">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Family Members Grid */}
              <div className="grid gap-3.5 mb-8">
                {members.map(m => {
                  const isSelected = m.id === selectedMember.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`bg-white rounded-[24px] p-5 border transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "border-amber-300 shadow-[0_8px_30px_-12px_rgba(251,191,36,0.3)] bg-gradient-to-r from-white via-white to-amber-50/50" 
                          : "border-slate-200/80 shadow-sm hover:border-amber-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt={m.name} className={`w-14 h-14 rounded-2xl object-cover shadow-sm ${isSelected ? "ring-2 ring-amber-400" : ""}`} />
                        ) : (
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-black shrink-0 transition-all ${
                            isSelected ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-200" : "bg-slate-100 text-[#64748B]"
                          }`}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-[16px] text-[#16324F] leading-tight mb-1">{m.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                              isSelected ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-500"
                            }`}>
                              {(m.relation_to_head || "MEMBER").split(" ")[0]}
                            </span>
                            <span className="text-[12px] text-[#64748B] font-bold">{m.age_years}y • {m.gender}</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 pr-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md shadow-amber-300">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Government Identity Section (ABHA) ── */}
              <div className="pt-2">
                <h3 className="text-[12px] font-black text-[#16324F] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Government Identity
                </h3>

                <div className="bg-white rounded-[24px] border border-amber-100 shadow-[0_8px_30px_-12px_rgba(251,191,36,0.2)] p-6 overflow-hidden relative mb-8">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-100/60 to-transparent rounded-bl-[80px] pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div>
                      <h4 className="text-[17px] font-black text-[#16324F] tracking-tight">ABHA Identity</h4>
                      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mt-0.5">Ayushman Bharat Health Account</p>
                    </div>
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {selectedMember?.name}
                    </span>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5">ABHA Number</p>
                      {selectedMember?.abha_number ? (
                        <p className="text-[16px] font-black tracking-[0.1em] text-[#16324F] font-mono bg-slate-50 px-3.5 py-2 rounded-xl inline-block border border-slate-100">
                          {selectedMember.abha_number}
                        </p>
                      ) : (
                        <p className="text-[13px] font-bold text-slate-400 italic">Not linked yet</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1.5">ABHA Address</p>
                      {selectedMember?.abha_address ? (
                        <p className="text-[13px] font-bold text-[#16324F] bg-slate-50 px-3.5 py-2 rounded-xl inline-block border border-slate-100">
                          {selectedMember.abha_address}
                        </p>
                      ) : (
                        <p className="text-[13px] font-bold text-slate-400 italic">Not linked yet</p>
                      )}
                    </div>
                    
                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Verification required</span>
                      </div>
                      {!selectedMember?.abha_number && (
                        <button className="text-[12px] font-black text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                          Link ABHA <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Government Health Schemes ── */}
              <div>
                <h3 className="text-[12px] font-black text-[#16324F] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-amber-500" /> Health Schemes
                </h3>
                
                <div className="grid gap-4">
                  {/* PM-JAY Card */}
                  <div className="bg-white rounded-[24px] border border-amber-100/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-[16px] font-black text-[#16324F]">PM-JAY (Ayushman Bharat)</h4>
                        <p className="text-[12px] font-medium text-[#64748B] mt-0.5">Government health coverage up to ₹5,00,000 / year</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4 bg-amber-50 w-fit px-3 py-1 rounded-full border border-amber-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Verification required</span>
                    </div>
                    <button className="w-full text-center text-[12px] font-black text-[#16324F] bg-slate-50 border border-slate-200 py-3 rounded-2xl hover:bg-amber-50 hover:border-amber-200 transition-colors uppercase tracking-wider">
                      Check Eligibility
                    </button>
                  </div>

                  {/* JSY Card */}
                  {selectedMember?.is_pregnant && (
                    <div className="bg-white rounded-[24px] border border-emerald-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-[16px] font-black text-[#16324F]">Janani Suraksha Yojana</h4>
                          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">Direct benefit transfer for safe institutional delivery</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-4 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Eligibility Confirmed</span>
                      </div>
                      <button className="w-full text-center text-[12px] font-black text-[#16324F] bg-emerald-50/50 border border-emerald-200 py-3 rounded-2xl hover:bg-emerald-100/50 transition-colors uppercase tracking-wider">
                        View details
                      </button>
                    </div>
                  )}
                  
                  {/* Immunization */}
                  {selectedMember?.is_child && (
                    <div className="bg-white rounded-[24px] border border-sky-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-[16px] font-black text-[#16324F]">Mission Indradhanush</h4>
                          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">Full child immunization schedule & tracking</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-4 bg-sky-50 w-fit px-3 py-1 rounded-full border border-sky-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Active Schedule</span>
                      </div>
                      <button className="w-full text-center text-[12px] font-black text-[#16324F] bg-sky-50/50 border border-sky-200 py-3 rounded-2xl hover:bg-sky-100/50 transition-colors uppercase tracking-wider">
                        View Schedule
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ── Premium Floating Bottom Nav ── */}
      <div className="fixed bottom-5 left-0 right-0 pointer-events-none z-50 px-4 flex justify-center">
        <nav className="bg-white/95 backdrop-blur-xl border border-amber-100/80 px-2 py-1.5 rounded-full shadow-[0_12px_40px_-8px_rgba(251,191,36,0.3)] pointer-events-auto flex items-center gap-1">
          {NAV.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-full transition-all duration-300 whitespace-nowrap ${
                  active 
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-300/40" 
                    : "text-[#64748B] hover:text-[#16324F] hover:bg-amber-50/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[12px] font-black tracking-wide ${active ? "inline-block" : "hidden sm:inline-block"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

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