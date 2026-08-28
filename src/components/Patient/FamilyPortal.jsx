import React, { useState } from "react";
import { Users, ChevronRight, HeartPulse, Baby, Heart, AlertTriangle, ArrowLeft, LogOut } from "lucide-react";

const STATUS_CONFIG = {
  red:    { dot: "bg-red-500",   label: "High Risk",  badge: "bg-red-50 text-red-700 border border-red-200" },
  yellow: { dot: "bg-amber-400", label: "Moderate",   badge: "bg-amber-50 text-amber-700 border border-amber-200" },
  green:  { dot: "bg-green-500", label: "Healthy",    badge: "bg-green-50 text-green-700 border border-green-200" },
};

function MemberHealthCard({ member }) {
  const sc = STATUS_CONFIG[member.status] || STATUS_CONFIG.green;
  const age = member.age_years || "?";
  const gender = member.gender || "";
  
  const tags = [];
  if (member.is_pregnant) tags.push({ label: "Pregnant", color: "bg-rose-100 text-rose-700 border border-rose-200" });
  if (member.is_child)    tags.push({ label: "Child <5", color: "bg-purple-100 text-purple-700 border border-purple-200" });
  if (member.tb_symptoms) tags.push({ label: "TB Screen", color: "bg-red-100 text-red-700 border border-red-200" });
  if (member.has_chronic) tags.push({ label: "Chronic", color: "bg-amber-100 text-amber-700 border border-amber-200" });

  // ANC info
  const ancWeeks = member.lmp_date ? Math.floor((new Date() - new Date(member.lmp_date)) / (7*24*60*60*1000)) : null;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-700 text-lg">
              {member.name[0].toUpperCase()}
            </div>
            <div className={"absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white " + sc.dot} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base leading-tight">{member.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{age}y · {gender}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-md " + sc.badge}>{sc.label}</span>
              {tags.map((t, i) => (
                <span key={i} className={"text-[10px] font-semibold px-2 py-0.5 rounded-md " + t.color}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Health highlights */}
        {member.is_pregnant && ancWeeks !== null && (
          <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <p className="text-sm font-semibold text-rose-800">{ancWeeks} weeks pregnant</p>
            </div>
            <p className="text-xs text-rose-600 mt-1">ANC visits done: {member.anc_visits_done || 0}/4</p>
          </div>
        )}
        {member.is_child && member.muac_zone && (
          <div className={"mt-3 rounded-xl p-3 border " + (member.muac_zone==="red"?"bg-red-50 border-red-200":member.muac_zone==="yellow"?"bg-amber-50 border-amber-200":"bg-green-50 border-green-200")}>
            <div className="flex items-center gap-2">
              <Baby className={"w-4 h-4 " + (member.muac_zone==="red"?"text-red-600":member.muac_zone==="yellow"?"text-amber-600":"text-green-600")} />
              <p className={"text-sm font-semibold " + (member.muac_zone==="red"?"text-red-800":member.muac_zone==="yellow"?"text-amber-800":"text-green-800")}>
                MUAC: {member.muac_zone.toUpperCase()} zone
                {member.weight_kg ? " · " + member.weight_kg + " kg" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Key vitals row */}
      {(member.blood_group || member.mobile) && (
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-4 bg-gray-50">
          {member.blood_group && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Blood Group</span>
              <span className="text-sm font-bold text-gray-900">{member.blood_group}</span>
            </div>
          )}
          {member.mobile && (
            <a href={"tel:" + member.mobile} className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700">
              <span className="text-xs font-semibold">{member.mobile}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function FamilyPortal({ family, members: initialMembers, onLogout }) {
  const [members] = useState(initialMembers || []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-bold text-teal-600">RadVault Patient Portal</span>
            </div>
            <h1 className="text-xl font-black text-gray-900">{family.family_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{family.village} · {members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition-all">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* ASHA attribution banner */}
      <div className="bg-teal-50 border-b border-teal-100 px-4 py-2.5">
        <p className="text-xs text-teal-700 font-medium">
          Records verified by <span className="font-bold">{family.asha_name || "ASHA Worker"}</span> · Read-only view · Data managed by your ASHA
        </p>
      </div>

      <div className="px-4 py-5">
        {members.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No family members registered yet.</p>
            <p className="text-sm text-gray-400 mt-1">Ask your ASHA worker to add family members.</p>
          </div>
        )}

        <div className="space-y-4">
          {members.map(member => (
            <MemberHealthCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}