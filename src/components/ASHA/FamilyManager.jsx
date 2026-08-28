import React, { useState, useEffect } from "react";
import { Users, Droplet, Zap, Home as HomeIcon, MapPin, Edit, Phone, Lock, ChevronRight, ChevronLeft, UserPlus, FileText, CheckCircle2, ActivitySquare } from "lucide-react";
import { getFamilyWithMembers } from "../../services/ashaService";

export default function FamilyManager({ family: initialFamily, onBack, onAddMember, onEditMember, onEditFamily, onLogVisit }) {
  const [family, setFamily] = useState(initialFamily);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getFamilyWithMembers(initialFamily.id);
      if (data) setFamily(data);
      setLoading(false);
    }
    load();
  }, [initialFamily.id]);

  const pts = family.village_patients || [];

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-5">
        <button onClick={onBack} className="flex items-center gap-1 text-[11px] font-bold text-[#64748B] hover:text-[#008F83] mb-3 -ml-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Village
        </button>
        <h1 className="text-2xl font-black text-[#16324F] tracking-tight">{family.family_name}</h1>
        <p className="text-sm font-semibold text-[#64748B] flex items-center gap-1.5 mt-1">
          <MapPin className="w-4 h-4 text-[#008F83]" /> {family.village}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* ── Quick Stats ── */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-[#16324F]">{pts.length}</p>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Members</p>
          </div>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-rose-500">{pts.filter(p => p.is_pregnant).length}</p>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Maternal</p>
          </div>
          <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-amber-500">{pts.filter(p => p.is_child).length}</p>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Children</p>
          </div>
        </div>

        {/* ── Household Profile Card ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#008F83]"></div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#16324F]">Household Profile</h2>
            <button onClick={onEditFamily} className="text-xs font-bold text-[#008F83] bg-[#E8F7F3] px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="flex items-start gap-2">
              <Droplet className="w-4 h-4 text-[#008F83] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Water Source</p>
                <p className="text-xs font-semibold text-[#16324F]">{family.water_source || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HomeIcon className="w-4 h-4 text-[#008F83] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Housing</p>
                <p className="text-xs font-semibold text-[#16324F]">{family.housing_type || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-[#008F83] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Ration Card</p>
                <p className="text-xs font-semibold text-[#16324F]">{family.ration_card || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#008F83] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8]">Electricity</p>
                <p className="text-xs font-semibold text-[#16324F]">{family.electricity === true ? 'Yes' : family.electricity === false ? 'No' : 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 bg-[#F5FBF9] border border-[#E2E8F0] rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="w-4 h-4 text-[#008F83]" />
              <p className="text-[10px] uppercase font-bold text-[#008F83]">Patient Portal Access</p>
            </div>
            {family.family_email ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase mb-0.5">Family Email</p>
                  <p className="text-xs font-black text-[#16324F] truncate">{family.family_email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase mb-0.5">Login PIN</p>
                  <p className="text-xs font-black text-[#16324F] tracking-widest">{family.family_pin || 'Not set'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">No portal access set up.</p>
            )}
          </div>
        </div>

        {/* ── Family Members List ── */}
        <div>
          <div className="flex items-center justify-between mb-3 mt-2">
            <h2 className="text-sm font-bold text-[#16324F]">Family Members ({pts.length})</h2>
          </div>
          
          <div className="space-y-4">
            {pts.map(p => (
              <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={"w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg " + (p.status === 'red' ? "bg-red-50 text-red-600" : "bg-[#F5FBF9] text-[#008F83]")}>
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#16324F] text-base truncate">{p.name}</p>
                      {p.status === 'red' && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs font-semibold text-[#64748B] mt-0.5">{p.relation_to_head || "Member"} · {p.age_years}y · {p.gender}</p>
                    <div className="flex gap-1.5 mt-2">
                      {p.is_pregnant && <span className="bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide">ANC</span>}
                      {p.is_child && <span className="bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide">Child</span>}
                      {p.status === 'red' && <span className="bg-red-50 border border-red-100 text-red-600 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide">Urgent</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => onLogVisit(p)} className="flex-1 bg-[#16324F] text-white py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 shadow-sm hover:bg-slate-800 transition-colors">
                    <ActivitySquare className="w-4 h-4 text-emerald-400" /> Log Visit
                  </button>
                  <button onClick={() => onEditMember(p)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => onAddMember(family)} className="w-full bg-[#F5FBF9] border-2 border-dashed border-[#008F83]/30 hover:border-[#008F83] hover:bg-[#E8F7F3] rounded-2xl py-4 flex flex-col items-center justify-center gap-2 transition-all">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#008F83]" />
              </div>
              <span className="text-xs font-bold text-[#008F83]">Add New Member</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}