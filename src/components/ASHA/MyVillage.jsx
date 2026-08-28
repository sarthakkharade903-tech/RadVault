import React, { useState, useMemo } from "react";
import { Users, Search, Plus, UserPlus, Heart, Baby, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function MyVillage({ families, loading, onRefresh, onAddFamily, onOpenFamily, onAddMember }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedFamily, setExpandedFamily] = useState(null);

  const filteredFamilies = useMemo(() => {
    return families.filter(fam => {
      const matchSearch = fam.family_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fam.village.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      
      const pts = fam.village_patients || [];
      if (filter === "High Risk") return fam.high_risk_household || pts.some(p => p.status === 'red');
      if (filter === "Pregnant") return pts.some(p => p.is_pregnant);
      if (filter === "Children") return pts.some(p => p.is_child);
      return true;
    });
  }, [families, searchTerm, filter]);

  return (
    <div className="pb-24">
      {/* Header & Stats */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-6">
        <h1 className="text-2xl font-black text-[#16324F] tracking-tight">My Village</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 bg-[#F5FBF9] rounded-xl p-3 border border-[#E2E8F0]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Families</p>
            <p className="text-xl font-black text-[#16324F] leading-none">{families.length}</p>
          </div>
          <div className="flex-1 bg-[#F5FBF9] rounded-xl p-3 border border-[#E2E8F0]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">People</p>
            <p className="text-xl font-black text-[#16324F] leading-none">{families.reduce((sum, f) => sum + (f.village_patients?.length || 0), 0)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        {/* Actions */}
        <div className="flex gap-3 mb-5">
          <button onClick={onAddFamily} className="flex-1 bg-[#008F83] hover:bg-[#009E8E] text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-5 h-5" /> Register Family
          </button>
          <button onClick={() => onAddMember(null)} className="flex-1 bg-white border-2 border-[#008F83] text-[#008F83] hover:bg-[#E8F7F3] font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors">
            <UserPlus className="w-5 h-5" /> Add Member
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4 shadow-sm">
          <Search className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search families or villages..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-[#16324F] placeholder-[#94A3B8] focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {["All", "High Risk", "Pregnant", "Children"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={"whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-colors shadow-sm " + (filter === f ? "bg-[#008F83] text-white border-[#008F83]" : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#008F83] hover:text-[#008F83]")}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Family Cards */}
        <div className="space-y-4">
          {filteredFamilies.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-50" />
              <p className="text-[#16324F] font-bold">No families found</p>
              <p className="text-sm text-[#64748B] mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredFamilies.map(fam => {
              const pts = fam.village_patients || [];
              const hasRed = fam.high_risk_household || pts.some(p => p.status === 'red');
              const isExpanded = expandedFamily === fam.id;

              return (
                <div key={fam.id} className={"bg-white rounded-2xl shadow-sm border overflow-hidden transition-all " + (hasRed ? "border-l-4 border-l-red-500 border-[#E2E8F0]" : "border-l-4 border-l-[#008F83] border-[#E2E8F0]")}>
                  {/* Family Header (Clickable) */}
                  <div className="p-4" onClick={() => onOpenFamily(fam)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={"w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg " + (hasRed ? "bg-red-50 text-red-600" : "bg-[#F5FBF9] text-[#008F83]")}>
                          {fam.family_name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#16324F] text-base">{fam.family_name} <span className="text-xs text-[#94A3B8] font-normal">#{fam.family_pin}</span></h3>
                          <p className="text-xs font-semibold text-[#64748B] mt-0.5">{fam.village} • {pts.length} Member{pts.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setExpandedFamily(isExpanded ? null : fam.id); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5FBF9] text-[#008F83] hover:bg-[#E8F7F3]">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Members List */}
                  {isExpanded && (
                    <div className="bg-[#F5FBF9] border-t border-[#E2E8F0] px-4 py-3">
                      {pts.length === 0 ? (
                        <p className="text-xs text-[#64748B] italic py-2 text-center">No members added yet.</p>
                      ) : (
                        <div className="space-y-2 mb-3">
                          {pts.map(p => (
                            <div key={p.id} className="bg-white rounded-xl p-3 border border-[#E2E8F0] flex items-center justify-between shadow-sm">
                              <div>
                                <p className="text-sm font-bold text-[#16324F]">{p.name}</p>
                                <p className="text-[10px] font-semibold text-[#64748B] mt-0.5">{p.relation_to_head || "Member"} • {p.age_years}y</p>
                              </div>
                              <div className="flex gap-1.5">
                                {p.is_pregnant && <span className="bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide">ANC</span>}
                                {p.is_child && <span className="bg-amber-50 border border-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide">Child</span>}
                                {p.status === 'red' && <span className="bg-red-50 border border-red-100 text-red-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide">Urgent</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => onAddMember(fam)} className="w-full bg-white border border-[#E2E8F0] text-[#008F83] font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 hover:bg-[#E8F7F3] hover:border-[#008F83]/30 transition-all">
                        <UserPlus className="w-4 h-4" /> Add Member to {fam.family_name}
                      </button>
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