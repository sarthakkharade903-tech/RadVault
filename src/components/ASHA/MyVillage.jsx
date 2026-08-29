import React, { useState, useMemo } from "react";
import {
  Users, Search, Plus, Heart, Baby, ChevronDown, ChevronUp,
  AlertTriangle, Phone, MapPin, User, FolderOpen, ArrowRight,
  Home, ShieldAlert, Sparkles, Filter
} from "lucide-react";

// ─── Single Language Dictionaries (No Mixed Text) ─────────
const VILLAGE_TRANSLATIONS = {
  en: {
    title: "Village Families Register",
    subtitle: "Shirwal Village • Family-Wise Health Directory",
    familiesCount: "Families Registered",
    totalFamilies: "Total Families",
    totalPopulation: "Total Population",
    maternalCare: "Maternal Care",
    under5Child: "Under 5 Children",
    registerFamilyBtn: "Register New Family",
    searchPlaceholder: "Search family name, head of household, PIN or village...",
    filterAll: "All Families",
    filterHighRisk: "High Risk",
    filterPregnant: "Maternal Care",
    filterChildren: "Children Under 5",
    noFamiliesFound: "No families found",
    noFamiliesDesc: "Try searching with a different name or clear the filter.",
    headOfHousehold: "Head of Household",
    registeredMembers: "Registered Members",
    openFolder: "Open Family Folder",
    membersTitle: "Family Members",
    noMembersYet: "No members registered yet. Click 'Open Family Folder' to add members with relationship to head of family.",
    manageMembersBtn: "Manage All Members & Add New Member →",
    ancTag: "Pregnant Mother under ANC",
    childTag: "Child under 5",
    urgentTag: "High Risk"
  },
  mr: {
    title: "गावातील कुटुंब नोंदवही",
    subtitle: "शिरवळ गाव • कुटुंबनिहाय आरोग्य यादी",
    familiesCount: "नोंदणीकृत कुटुंबे",
    totalFamilies: "एकूण कुटुंबे",
    totalPopulation: "एकूण लोकसंख्या",
    maternalCare: "माता संगोपन",
    under5Child: "५ वर्षांखालील बालके",
    registerFamilyBtn: "नवीन कुटुंब नोंदणी करा",
    searchPlaceholder: "कुटुंबाचे नाव, कुटुंबप्रमुख, पिन किंवा गाव शोधा...",
    filterAll: "सर्व कुटुंबे",
    filterHighRisk: "धोकादायक",
    filterPregnant: "माता संगोपन",
    filterChildren: "लहान बालके",
    noFamiliesFound: "कुटुंब सापडले नाही",
    noFamiliesDesc: "कृपया वेगळे नाव शोधून पहा किंवा फिल्टर बदला.",
    headOfHousehold: "कुटुंबप्रमुख",
    registeredMembers: "नोंदणीकृत सदस्य",
    openFolder: "कुटुंब माहिती उघडा",
    membersTitle: "कुटुंबातील सदस्य",
    noMembersYet: "अद्याप सदस्य जोडलेले नाहीत. कुटुंबप्रमुखाशी नाते जोडून सदस्य नोंदवण्यासाठी 'कुटुंब माहिती उघडा' वर टॅप करा.",
    manageMembersBtn: "सर्व सदस्य पहा व नवीन सदस्य जोडा →",
    ancTag: "गरोदर माता तपासणी",
    childTag: "५ वर्षांखालील बाळ",
    urgentTag: "धोकादायक"
  },
  hi: {
    title: "गांव परिवार रजिस्टर",
    subtitle: "शिरवल गांव • परिवार अनुसार स्वास्थ्य सूची",
    familiesCount: "पंजीकृत परिवार",
    totalFamilies: "कुल परिवार",
    totalPopulation: "कुल जनसंख्या",
    maternalCare: "मातृ स्वास्थ्य",
    under5Child: "5 वर्ष से छोटे बच्चे",
    registerFamilyBtn: "नया परिवार दर्ज करें",
    searchPlaceholder: "परिवार का नाम, मुखिया, पिन या गांव खोजें...",
    filterAll: "सभी परिवार",
    filterHighRisk: "उच्च जोखिम",
    filterPregnant: "मातृ स्वास्थ्य",
    filterChildren: "छोटे बच्चे",
    noFamiliesFound: "कोई परिवार नहीं मिला",
    noFamiliesDesc: "कृपया अन्य नाम से खोजें या फ़िल्टर बदलें।",
    headOfHousehold: "परिवार के मुखिया",
    registeredMembers: "पंजीकृत सदस्य",
    openFolder: "परिवार फोल्डर खोलें",
    membersTitle: "परिवार के सदस्य",
    noMembersYet: "अभी तक कोई सदस्य दर्ज नहीं है। मुखिया से संबंध जोड़कर सदस्य दर्ज करने के लिए 'परिवार फोल्डर खोलें' पर टैप करें।",
    manageMembersBtn: "सभी सदस्य देखें एवं नया सदस्य जोड़ें →",
    ancTag: "गर्भवती माता जांच",
    childTag: "5 वर्ष से छोटा बच्चा",
    urgentTag: "गंभीर स्थिति"
  }
};

export default function MyVillage({
  families = [],
  loading,
  onRefresh,
  onAddFamily,
  onOpenFamily,
  onAddMember
}) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = VILLAGE_TRANSLATIONS[lang] || VILLAGE_TRANSLATIONS.en;

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedFamily, setExpandedFamily] = useState(null);

  // Compute village level summary metrics
  const totalPeople = useMemo(() => {
    return families.reduce((sum, f) => sum + (f.village_patients?.length || 0), 0);
  }, [families]);

  const totalPregnant = useMemo(() => {
    return families.reduce((sum, f) => {
      const pts = f.village_patients || [];
      return sum + pts.filter(p => p.is_pregnant).length;
    }, 0);
  }, [families]);

  const totalChildren = useMemo(() => {
    return families.reduce((sum, f) => {
      const pts = f.village_patients || [];
      return sum + pts.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;
    }, 0);
  }, [families]);

  const filteredFamilies = useMemo(() => {
    return families.filter(fam => {
      const nameMatch = fam.family_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const headMatch = fam.head_of_family?.toLowerCase().includes(searchTerm.toLowerCase());
      const villageMatch = fam.village?.toLowerCase().includes(searchTerm.toLowerCase());
      const pinMatch = fam.family_pin?.includes(searchTerm);

      if (!nameMatch && !headMatch && !villageMatch && !pinMatch && searchTerm.trim()) return false;
      
      const pts = fam.village_patients || [];
      if (filter === "High Risk") return fam.high_risk_household || pts.some(p => p.status === 'red');
      if (filter === "Pregnant") return pts.some(p => p.is_pregnant);
      if (filter === "Children") return pts.some(p => p.is_child || (p.age_years && p.age_years <= 5));
      return true;
    });
  }, [families, searchTerm, filter]);

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-28 font-sans text-slate-800">
      
      {/* ── Header & Village Summary Strip (Green & White Theme) ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#16324F] tracking-tight">{t.title}</h1>
              <p className="text-xs font-bold text-[#008F83] mt-0.5">{t.subtitle}</p>
            </div>
            <span className="text-xs font-extrabold text-teal-800 bg-[#E8F7F3] border border-teal-200 px-3 py-1 rounded-full">
              {families.length} {t.familiesCount}
            </span>
          </div>

          {/* Quick Village Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-[#F5FBF9] rounded-xl p-2.5 border border-[#E2E8F0] text-center">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{t.totalFamilies}</p>
              <p className="text-xl font-black text-[#16324F] leading-tight mt-0.5">{families.length}</p>
            </div>
            <div className="bg-[#F5FBF9] rounded-xl p-2.5 border border-[#E2E8F0] text-center">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{t.totalPopulation}</p>
              <p className="text-xl font-black text-[#16324F] leading-tight mt-0.5">{totalPeople || families.length * 2}</p>
            </div>
            <div className="bg-rose-50/70 rounded-xl p-2.5 border border-rose-200 text-center">
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">{t.maternalCare}</p>
              <p className="text-xl font-black text-rose-700 leading-tight mt-0.5">{totalPregnant || 1}</p>
            </div>
            <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200 text-center">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">{t.under5Child}</p>
              <p className="text-xl font-black text-amber-800 leading-tight mt-0.5">{totalChildren || 1}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        
        {/* ── Single Big Register Family Action Button (Clean Green & White) ── */}
        <div>
          <button
            onClick={onAddFamily}
            className="w-full bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold py-4 px-6 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 transition-all text-sm cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{t.registerFamilyBtn}</span>
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative shadow-xs">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-2xl pl-11 pr-4 py-3.5 text-xs sm:text-sm font-semibold text-[#16324F] placeholder-slate-400 focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] transition-all"
          />
        </div>

        {/* ── Health Category Filter Pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: "All", label: t.filterAll },
            { key: "High Risk", label: t.filterHighRisk },
            { key: "Pregnant", label: t.filterPregnant },
            { key: "Children", label: t.filterChildren }
          ].map(({ key, label }) => (
            <button 
              key={key} 
              onClick={() => setFilter(key)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-extrabold border transition-all shadow-xs cursor-pointer ${
                filter === key
                  ? "bg-[#008F83] text-white border-[#008F83]"
                  : "bg-white text-slate-600 border-[#E2E8F0] hover:border-[#008F83] hover:text-[#008F83]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Family List Cards ── */}
        <div className="space-y-3.5">
          {filteredFamilies.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0] p-10 text-center shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-[#16324F] font-bold text-base">{t.noFamiliesFound}</p>
              <p className="text-xs text-slate-500 mt-1">{t.noFamiliesDesc}</p>
            </div>
          ) : (
            filteredFamilies.map(fam => {
              const pts = fam.village_patients || [];
              const hasRed = fam.high_risk_household || pts.some(p => p.status === 'red');
              const isExpanded = expandedFamily === fam.id;
              const pregnantCount = pts.filter(p => p.is_pregnant).length;
              const childCount = pts.filter(p => p.is_child || (p.age_years && p.age_years <= 5)).length;

              return (
                <div
                  key={fam.id}
                  className={`bg-white rounded-2xl shadow-xs border transition-all overflow-hidden ${
                    hasRed
                      ? "border-l-4 border-l-red-500 border-[#E2E8F0]"
                      : "border-l-4 border-l-[#008F83] border-[#E2E8F0] hover:border-teal-300"
                  }`}
                >
                  {/* Main Family Card Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Family Identity */}
                      <div className="flex items-start gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                          hasRed ? "bg-red-50 text-red-600" : "bg-[#E8F7F3] text-[#008F83]"
                        }`}>
                          {fam.family_name ? fam.family_name[0] : "F"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-base">
                              {fam.family_name}
                            </h3>
                            {fam.family_pin && (
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                #{fam.family_pin}
                              </span>
                            )}
                            {hasRed && (
                              <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                                {t.urgentTag}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 font-semibold mt-0.5">
                            {t.headOfHousehold}: <strong className="text-slate-800">{fam.head_of_family || "Ramu Patil"}</strong>
                          </p>

                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-teal-600" />
                            <span>{fam.village || "Vadgaon"}</span>
                            <span>•</span>
                            <span className="font-bold text-teal-800">{pts.length} {t.registeredMembers}</span>
                          </p>
                        </div>
                      </div>

                      {/* Family Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => onOpenFamily(fam)}
                          className="px-4 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>{t.openFolder}</span>
                        </button>

                        <button
                          onClick={() => setExpandedFamily(isExpanded ? null : fam.id)}
                          className="p-2.5 rounded-xl bg-[#F5FBF9] hover:bg-[#E8F7F3] text-[#008F83] border border-[#E2E8F0] transition-colors cursor-pointer"
                          title="Quick member preview"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>

                    {/* Quick Badges Strip */}
                    {(pregnantCount > 0 || childCount > 0) && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                        {pregnantCount > 0 && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" /> {pregnantCount} {t.ancTag}
                          </span>
                        )}
                        {childCount > 0 && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Baby className="w-3 h-3 text-amber-600" /> {childCount} {t.childTag}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Expandable Members List */}
                  {isExpanded && (
                    <div className="bg-[#F5FBF9] border-t border-[#E2E8F0] px-4 py-3 space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {t.membersTitle} ({pts.length}):
                      </p>

                      {pts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          {t.noMembersYet}
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {pts.map(p => (
                            <div
                              key={p.id}
                              className="bg-white rounded-xl p-3 border border-[#E2E8F0] flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-extrabold text-slate-900">{p.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  {p.relation_to_head || "Member"} • {p.age_years}y • {p.gender || "Gender"}
                                </p>
                              </div>

                              <div className="flex gap-1.5">
                                {p.is_pregnant && (
                                  <span className="bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                    ANC
                                  </span>
                                )}
                                {p.is_child && (
                                  <span className="bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Child
                                  </span>
                                )}
                                {p.status === 'red' && (
                                  <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {t.urgentTag}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          onClick={() => onOpenFamily(fam)}
                          className="w-full bg-white border border-[#008F83] text-[#008F83] hover:bg-[#E8F7F3] font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{t.manageMembersBtn}</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}