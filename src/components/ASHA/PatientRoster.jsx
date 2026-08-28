import React, { useState } from "react";
import { mockPatients } from "../../data/mockASHAData";
import { Search, Plus, ChevronRight } from "lucide-react";

const STATUS_DOT = { red: "bg-red-500", yellow: "bg-amber-400", green: "bg-emerald-400" };
const STATUS_RING = { red: "ring-red-500/40", yellow: "ring-amber-400/40", green: "ring-emerald-400/40" };
const FILTERS = [
  { key: "all", label: "All" },
  { key: "pregnant", label: "Pregnant" },
  { key: "child", label: "Children" },
  { key: "chronic", label: "Chronic" },
  { key: "risk", label: "High Risk" },
];

export default function PatientRoster({ onViewPatient, onNewPatient }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = mockPatients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === "pregnant") return p.is_pregnant;
    if (activeFilter === "child") return p.is_child;
    if (activeFilter === "chronic") return p.has_chronic;
    if (activeFilter === "risk") return p.status === "red" || p.status === "yellow";
    return true;
  });

  const daysSince = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
    return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : diff + " days ago";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-24">
      <div className="bg-emerald-950 border-b border-emerald-800 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-white">Patient Roster</h1>
          <button onClick={onNewPatient}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or village..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className={"flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors " + (activeFilter === f.key ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white")}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 mb-2">
        <p className="text-xs text-slate-500">{filtered.length} patient{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">No patients found</div>}
        {filtered.map(p => (
          <button key={p.id} onClick={() => onViewPatient && onViewPatient(p.id)}
            className="w-full text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className={"w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm bg-slate-700 ring-2 flex-shrink-0 " + STATUS_RING[p.status]}>
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{p.name}</span>
                  <span className={"w-2 h-2 rounded-full flex-shrink-0 " + STATUS_DOT[p.status]} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{p.age}y {p.gender === "F" ? "Female" : "Male"} · {p.village}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {p.is_pregnant && <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-semibold">Pregnant</span>}
                  {p.is_child && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-semibold">Child</span>}
                  {p.has_chronic && (p.chronic_conditions || []).slice(0, 2).map(c => (
                    <span key={c} className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">{c}</span>
                  ))}
                  {p.activation_email && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">App Active</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-slate-500">{daysSince(p.last_visit)}</p>
                <ChevronRight className="w-4 h-4 text-slate-600 mt-1 ml-auto" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}