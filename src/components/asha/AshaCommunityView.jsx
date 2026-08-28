import React from 'react';
import { MapPin, Users, Clock, Building2, AlertTriangle, ChevronRight } from 'lucide-react';
import { getCommunityAreaSummary } from '../../services/encounterService';

export default function AshaCommunityView({
  patients = [],
  encounters = [],
  onSelectVillage,
  onSelectPatient
}) {
  const summaries = getCommunityAreaSummary(patients, encounters);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Today in My Area</h1>
          <p className="text-xs text-slate-500 font-medium">
            Community-level breakdown by village and ward in Sector 4
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 p-2 rounded-xl self-start sm:self-auto shadow-2xs">
          <MapPin className="w-4 h-4 text-[#008080]" />
          <span>Active Villages: <strong>{summaries.length}</strong></span>
        </div>
      </div>

      {/* ── Village Summary Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((village) => (
          <div
            key={village.villageName}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-[#008080]/60 transition-colors space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E6F2F2] text-[#008080] flex items-center justify-center font-black">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">{village.villageName}</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {village.totalPatients} {village.totalPatients === 1 ? 'Beneficiary' : 'Beneficiaries'} Registered
                  </span>
                </div>
              </div>

              {village.highAttentionCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {village.highAttentionCount} Urgent
                </span>
              )}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Follow-ups</span>
                <span className="text-sm font-black text-amber-900">{village.followUpsDue}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Consultations</span>
                <span className="text-sm font-black text-sky-900">{village.pendingConsultations}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">High Attention</span>
                <span className="text-sm font-black text-rose-700">{village.highAttentionCount}</span>
              </div>
            </div>

            {/* Quick Beneficiary Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Recent Beneficiaries in this Village:
              </span>
              <div className="divide-y divide-slate-100">
                {village.patientList.slice(0, 3).map((p) => (
                  <div
                    key={p.id || p.unified_id}
                    onClick={() => onSelectPatient(p)}
                    className="py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50/80 px-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 group-hover:text-[#008080]">
                        {p.full_name || p.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {p.unified_id}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-[#008080] flex items-center gap-0.5">
                      Open <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onSelectVillage(village.villageName)}
                className="text-xs font-bold text-[#008080] hover:text-[#006666] flex items-center gap-1 cursor-pointer"
              >
                <span>View all {village.totalPatients} patients in {village.villageName} →</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
