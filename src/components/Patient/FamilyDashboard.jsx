import React, { useState, useEffect } from "react";
import {
  HeartPulse, LogOut, FileText, Calendar, Home, Users, ChevronLeft,
  Plus, Stethoscope, Pill, FileImage, Droplet, Sparkles, Loader2,
  Globe, Shield, ArrowRight, Search
} from "lucide-react";
import PatientHome from "../dashboard/PatientHome";
import CareHub from "./CareHub";
import TimelineWrapper from './TimelineWrapper';
import MedicalDocumentCard from './MedicalDocumentCard';
import DocumentPreview from './DocumentPreview';
import UploadModal from './UploadModal';
import GovernmentSchemes from './GovernmentSchemes';
import { getDocuments } from '../../services/vaultService';

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const PORTAL_TRANSLATIONS = {
  en: {
    navOverview: "Overview",
    navTimeline: "Timeline",
    navVault: "Vault",
    navCare: "Care Hub",
    navFamily: "Family",
    signOut: "Sign Out",
    vaultTitle: "Medical Vault",
    vaultSub: "Your digital health records & reports organized in one place",
    uploadBtn: "Upload Document",
    searchPlaceholder: "Search reports, prescriptions, doctors...",
    catAll: "All Documents",
    catPrescriptions: "Prescriptions",
    catLabs: "Lab Reports",
    catScans: "Scans & X-Rays",
    statDocs: "Total Documents",
    statLabs: "Lab Reports",
    statRx: "Prescriptions",
    noDocsTitle: "No documents stored yet",
    noDocsSub: "Upload prescriptions, lab reports, and diagnostic scans to keep your health files safe.",
    familyTitle: "Family Profile & Members",
    membersCount: "Members"
  },
  mr: {
    navOverview: "मुख्य माहिती",
    navTimeline: "आरोग्य इतिहास",
    navVault: "डिजिटल व्हॉल्ट",
    navCare: "आरोग्य सेवा",
    navFamily: "कुटुंब",
    signOut: "बाहेर पडा",
    vaultTitle: "डिजिटल आरोग्य व्हॉल्ट",
    vaultSub: "तुमची सर्व औषध चिठ्ठी, लॅब रिपोर्ट व स्कॅन एकाच सुरक्षित ठिकाणी",
    uploadBtn: "कागदपत्र अपलोड करा",
    searchPlaceholder: "रिपोर्ट, औषध चिठ्ठी किंवा डॉक्टर शोधा...",
    catAll: "सर्व फाइल्स",
    catPrescriptions: "प्रिस्क्रिप्शन",
    catLabs: "लॅब रिपोर्ट",
    catScans: "एक्स-रे व स्कॅन",
    statDocs: "एकूण फाइल्स",
    statLabs: "लॅब रिपोर्ट",
    statRx: "प्रिस्क्रिप्शन",
    noDocsTitle: "कोणतेही कागदपत्र अपलोड केलेले नाही",
    noDocsSub: "तुमचे प्रिस्क्रिप्शन, रक्त तपासणी रिपोर्ट किंवा स्कॅन सुरक्षित ठेवण्यासाठी अपलोड करा.",
    familyTitle: "कुटुंबातील सदस्य",
    membersCount: "सदस्य"
  },
  hi: {
    navOverview: "मुख्य पृष्ठ",
    navTimeline: "टाइमलाइन",
    navVault: "हेल्थ वॉल्ट",
    navCare: "स्वास्थ्य सेवा",
    navFamily: "परिवार",
    signOut: "लॉग आउट",
    vaultTitle: "डिजिटल स्वास्थ्य वॉल्ट",
    vaultSub: "आपके सभी मेडिकल रिकॉर्ड, जांच रिपोर्ट और दवा पर्ची एक सुरक्षित स्थान पर",
    uploadBtn: "दस्तावेज अपलोड करें",
    searchPlaceholder: "जांच रिपोर्ट, पर्ची या डॉक्टर खोजें...",
    catAll: "सभी दस्तावेज",
    catPrescriptions: "दवा पर्ची",
    catLabs: "लैब रिपोर्ट",
    catScans: "स्कैन एवं एक्स-रे",
    statDocs: "कुल दस्तावेज",
    statLabs: "लैब रिपोर्ट",
    statRx: "दवा पर्ची",
    noDocsTitle: "कोई दस्तावेज अपलोड नहीं है",
    noDocsSub: "अपने पर्चे, लैब रिपोर्ट और एक्स-रे हमेशा सुरक्षित रखने के लिए यहां अपलोड करें।",
    familyTitle: "परिवार के सदस्य",
    membersCount: "सदस्य"
  }
};

export default function FamilyDashboard({ family, members, onLogout, onBack }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("radvault_asha_lang") || localStorage.getItem("radvault_patient_lang") || "en";
  });

  const t = PORTAL_TRANSLATIONS[lang] || PORTAL_TRANSLATIONS.en;

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("radvault_asha_lang", newLang);
    localStorage.setItem("radvault_patient_lang", newLang);
  };

  const NAV = [
    { key: "home",     label: t.navOverview,  Icon: Home },
    { key: "timeline", label: t.navTimeline,  Icon: Calendar },
    { key: "records",  label: t.navVault,     Icon: FileText },
    { key: "care",     label: t.navCare,      Icon: Stethoscope },
    { key: "family",   label: t.navFamily,    Icon: Users },
  ];

  const VAULT_CATEGORIES = [
    { id: "All",           label: t.catAll,           Icon: null },
    { id: "Prescriptions", label: t.catPrescriptions, Icon: Pill },
    { id: "Lab Reports",   label: t.catLabs,          Icon: Droplet },
    { id: "Scans",         label: t.catScans,         Icon: FileImage },
  ];

  const [activeTab, setActiveTab] = useState("home");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [recordCat, setRecordCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredDocs = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.title && doc.title.toLowerCase().includes(q)) ||
      (doc.file_name && doc.file_name.toLowerCase().includes(q)) ||
      (doc.doctor_name && doc.doctor_name.toLowerCase().includes(q)) ||
      (doc.notes && doc.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-screen bg-[#FCFAF5] font-sans text-slate-800 selection:bg-amber-100">
      
      {/* ── Header with Universal Language Selector ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-amber-100 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-50 transition-colors cursor-pointer">
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

        {/* Right Section: Universal Language Switcher & Sign Out */}
        <div className="flex items-center gap-3">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-amber-50/80 p-1 rounded-full border border-amber-200/70 shadow-2xs">
            <button
              onClick={() => handleLanguageChange("en")}
              className={`px-2.5 py-1 text-[11px] font-black rounded-full transition-all cursor-pointer ${
                lang === "en" ? "bg-amber-400 text-amber-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange("mr")}
              className={`px-2.5 py-1 text-[11px] font-black rounded-full transition-all cursor-pointer ${
                lang === "mr" ? "bg-amber-400 text-amber-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => handleLanguageChange("hi")}
              className={`px-2.5 py-1 text-[11px] font-black rounded-full transition-all cursor-pointer ${
                lang === "hi" ? "bg-amber-400 text-amber-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिंदी
            </button>
          </div>

          <button onClick={onLogout} className="flex items-center gap-1 text-[#64748B] hover:text-amber-600 text-xs font-black transition-colors uppercase tracking-wider cursor-pointer">
            <span className="hidden sm:inline">{t.signOut}</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Member Switcher Strip ── */}
      <div className="flex-shrink-0 bg-white/60 backdrop-blur-sm border-b border-amber-100/40 py-2.5 px-4 z-20">
        <div className="max-w-4xl mx-auto flex gap-3 overflow-x-auto scrollbar-hide">
          {members.map(m => {
            const isActive = m.id === selectedMember.id;
            return (
              <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-300 shrink-0 cursor-pointer ${
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
            <PatientHome member={selectedMember} onNavigateTab={(tab) => setActiveTab(tab)} />
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
            <div className="max-w-4xl mx-auto w-full px-4 pt-8 relative z-10">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-white border border-amber-200 rounded-2xl flex items-center justify-center shadow-xs text-amber-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#16324F] tracking-tight">{t.vaultTitle}</h2>
                    <p className="text-xs text-[#64748B] font-semibold">{t.vaultSub}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-5 py-3 rounded-full text-xs font-black shadow-md shadow-amber-300/40 hover:shadow-lg transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t.uploadBtn}
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="mb-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-amber-400 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>

              {/* Category Chips */}
              <div className="flex overflow-x-auto gap-2.5 scrollbar-hide pb-2 mb-6">
                {VAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setRecordCat(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      recordCat === cat.id
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-[#16324F] shadow-md shadow-amber-300/30 border border-amber-400"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-700"
                    }`}
                  >
                    {cat.Icon && <cat.Icon className="w-3.5 h-3.5" />}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs font-bold text-amber-800">Loading documents...</p>
                </div>
              ) : filteredDocs.length > 0 ? (
                <div className="space-y-4">
                  {filteredDocs.map(doc => (
                    <MedicalDocumentCard key={doc.id} doc={doc} onView={setPreviewDoc} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-10 text-center shadow-xs">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-500 border border-amber-100">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-[#16324F] mb-1">{t.noDocsTitle}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">{t.noDocsSub}</p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="inline-flex items-center gap-1.5 bg-[#008F83] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:bg-[#007A70] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> {t.uploadBtn}
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

        {/* ── Family & Schemes Tab ── */}
        {activeTab === "family" && (
          <div className="min-h-full px-4 py-8 bg-[#FCFAF5] space-y-8 pb-36 max-w-3xl mx-auto">
            
            {/* Family Members Section */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-black text-[#16324F]">{family?.family_name || t.familyTitle}</h2>
                  <p className="text-xs font-bold text-[#64748B] mt-0.5">
                    {family?.village && `${family.village} • `}
                    {members.length} {t.membersCount}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {members.map(m => {
                  const isSelected = m.id === selectedMember.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected 
                          ? "border-amber-300 shadow-md bg-gradient-to-r from-white via-white to-amber-50/40" 
                          : "border-slate-200 hover:border-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center flex-shrink-0">
                          {m.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{m.name}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {m.gender} • {m.age_years ? `${m.age_years} yrs` : "Resident"} • {m.relation_to_head || "Member"}
                          </p>
                        </div>
                      </div>

                      {m.abha_id && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          ABHA: {m.abha_id}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Government Health Schemes & Eligibility Section ── */}
            <div className="pt-2">
              <GovernmentSchemes family={family} members={members} />
            </div>

          </div>
        )}
      </main>

      {/* ── Floating Bottom Navigation ── */}
      <div className="fixed bottom-5 left-0 right-0 pointer-events-none z-50 px-4 flex justify-center">
        <nav className="bg-white/95 backdrop-blur-xl border border-amber-100 px-2 py-1.5 rounded-full shadow-[0_12px_40px_-8px_rgba(251,191,36,0.3)] pointer-events-auto flex items-center gap-1">
          {NAV.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer ${
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