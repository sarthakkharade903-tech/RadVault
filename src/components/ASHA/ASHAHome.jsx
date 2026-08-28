import React, { useMemo } from "react";
import { Users, Heart, Baby, AlertTriangle, CloudOff, Cloud, RefreshCw, ChevronRight, Activity, Calendar } from "lucide-react";
import { computeStats, computeDueList } from "../../services/ashaService";

export default function ASHAHome({ patients, loading, onNavigate }) {
  const stats = useMemo(() => computeStats(patients), [patients]);
  const dueList = useMemo(() => computeDueList(patients), [patients]);
  
  // Format current date nicely
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="pb-8">
      {/* ── Dashboard Header ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-black text-[#16324F] tracking-tight">Overview</h1>
            <p className="text-sm font-semibold text-[#64748B] flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4" /> {today}
            </p>
          </div>
          {/* Sync Status Badge - Elegant Reassuring UI */}
          <div className="flex items-center gap-2 bg-[#F5FBF9] border border-[#E2E8F0] px-3 py-1.5 rounded-full shadow-sm">
            <Cloud className="w-4 h-4 text-[#008F83]" />
            <span className="text-[10px] font-bold text-[#008F83] tracking-wide uppercase">Synced</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        {/* ── Stat Cards Grid (Tactile & Semantic) ── */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => onNavigate("village")} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-[#E8F7F3] flex items-center justify-center mb-3 group-hover:bg-[#008F83] transition-colors">
              <Users className="w-5 h-5 text-[#008F83] group-hover:text-white" />
            </div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Members</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-black text-[#16324F] leading-none">{loading ? "-" : stats.total}</span>
            </div>
          </button>

          <button onClick={() => onNavigate("village")} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-3 group-hover:bg-rose-500 transition-colors">
              <Heart className="w-5 h-5 text-rose-500 group-hover:text-white" />
            </div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Maternal Care</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-black text-[#16324F] leading-none">{loading ? "-" : stats.pregnant}</span>
            </div>
          </button>

          <button onClick={() => onNavigate("village")} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-500 transition-colors">
              <Baby className="w-5 h-5 text-amber-500 group-hover:text-white" />
            </div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Under 5 Child</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-black text-[#16324F] leading-none">{loading ? "-" : stats.children}</span>
            </div>
          </button>

          <button onClick={() => onNavigate("followup")} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all text-left group">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-500 transition-colors">
              <AlertTriangle className="w-5 h-5 text-red-500 group-hover:text-white" />
            </div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">High Risk</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-black text-[#16324F] leading-none">{loading ? "-" : stats.highRisk}</span>
            </div>
          </button>
        </div>

        {/* ── Today's Due List (High Prominence) ── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#16324F] tracking-tight">Today's Due List</h2>
          <span className="text-xs font-bold text-[#008F83] bg-[#E8F7F3] px-2.5 py-1 rounded-full">{dueList.length} Tasks</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-[#008F83] animate-spin" />
          </div>
        ) : dueList.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0] p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#F5FBF9] rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-[#008F83]" />
            </div>
            <p className="text-[#16324F] font-bold text-lg mb-1">All caught up!</p>
            <p className="text-sm text-[#64748B]">No pending tasks or follow-ups for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dueList.map((item, i) => (
              <div key={i} className={"bg-white rounded-2xl p-4 border shadow-sm flex items-start gap-3 transition-colors hover:border-[#008F83]/40 " + (item.urgent ? "border-red-100" : "border-[#E2E8F0]")}>
                <div className={"w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 " + (item.urgent ? "bg-red-50" : "bg-[#F5FBF9]")}>
                  {item.type === 'anc' ? <Heart className={"w-5 h-5 " + (item.urgent ? "text-red-500" : "text-rose-500")} /> :
                   item.type === 'vaccine' ? <Baby className={"w-5 h-5 " + (item.urgent ? "text-red-500" : "text-amber-500")} /> :
                   <AlertTriangle className={"w-5 h-5 " + (item.urgent ? "text-red-500" : "text-amber-500")} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-bold text-[#16324F] truncate">{item.patientName}</p>
                    {item.urgent && <span className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">URGENT</span>}
                  </div>
                  <p className="text-[13px] font-semibold text-[#008F83] mb-0.5">{item.label}</p>
                  <p className="text-[11px] text-[#64748B] font-medium">{item.detail}</p>
                </div>
                <button onClick={() => onNavigate("village")} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5FBF9] text-[#008F83] hover:bg-[#E8F7F3] transition-colors self-center flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}