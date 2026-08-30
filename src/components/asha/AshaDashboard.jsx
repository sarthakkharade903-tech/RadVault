import React, { useMemo } from 'react';
import {
  Search,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Building2,
  Users,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

export default function AshaDashboard({
  user,
  stats,
  _patients = [],
  recentEncounters = [],
  followUpTasks = {},
  isOnline = true,
  isSyncing = false,
  onManualSync,
  onOpenSearch,
  onOpenRegister,
  onOpenSurvey,
  _onSelectPatient,
  onNavigateToTab,
  ashaProfile,
  _ashaArea,
  ashaVillages
}) {
  const { overdue = [], dueToday = [] } = followUpTasks;

  const urgentCases = useMemo(() => {
    return recentEncounters.filter(
      (e) => e.priority === 'HIGH' || e.priority === 'RED' || (e.dangerSigns && e.dangerSigns.length > 0)
    );
  }, [recentEncounters]);

  const workerName = ashaProfile?.name || (user?.email ? user.email.split('@')[0] : 'Sunita Deshmukh');
  const pendingSync = stats?.pendingSyncCount || 0;
  
  // Format assigned villages/area as a single string
  const villageNames = ashaVillages && ashaVillages.length > 0
    ? ashaVillages.map(v => v.name).join(', ')
    : 'Sector 4 Village Area';

  return (
    <div className="space-y-6 max-w-xl mx-auto py-4">
      {/* ── A. CALM HEADER & NETWORK INDICATOR ── */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Good morning, {workerName}
          </h1>
          <div className="text-xs text-slate-500 font-bold space-y-0.5">
            <div>📍 {villageNames}</div>
            <div>🏥 {ashaProfile?.phc_name || 'Shrirampur Primary Health Centre'}</div>
          </div>
        </div>

        {/* Small Connection/Sync Pill */}
        <div className="shrink-0">
          {isOnline ? (
            pendingSync > 0 ? (
              <button
                type="button"
                disabled={isSyncing}
                onClick={onManualSync}
                className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSync} to sync</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                <Wifi className="w-3 h-3 text-emerald-600" />
                <span>Synced</span>
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300">
              <WifiOff className="w-3 h-3 text-slate-500" />
              <span>Offline ({pendingSync} saved)</span>
            </span>
          )}
        </div>
      </div>

      {/* ── B. PRIMARY SEARCH, REGISTRATION & VILLAGE SURVEY ACTION CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-4 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-2xl transition-all shadow-sm hover:scale-[1.01] active:scale-99 flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-5 h-5 text-white" />
          <span>Find Patient</span>
        </button>

        <button
          type="button"
          onClick={onOpenRegister}
          className="p-4 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-2xl transition-all shadow-sm hover:scale-[1.01] active:scale-99 flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-5 h-5 text-slate-950" />
          <span>+ Single Patient</span>
        </button>

        <button
          type="button"
          onClick={onOpenSurvey}
          className="p-4 bg-teal-50 hover:bg-teal-100 text-[#006666] border-2 border-[#008080]/30 hover:border-[#008080] font-black text-xs rounded-2xl transition-all shadow-sm hover:scale-[1.01] active:scale-99 flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-5 h-5 text-[#008080]" />
          <span>📋 Village Survey</span>
        </button>
      </div>

      {/* ── VILLAGE SURVEY HIGHLIGHT CARD ── */}
      <div className="bg-white border-2 border-teal-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-lg">
            📋
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-900">Conduct Village Survey (गाव सर्वेक्षण)</h3>
              <span className="text-[9px] font-black uppercase bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono">
                CSV Bulk Import
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold">Import household survey data, deduplicate, and auto-group families</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSurvey}
          className="text-xs font-black text-white bg-[#008080] hover:bg-[#006666] px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <span>Start Survey →</span>
        </button>
      </div>

      {/* ── C. TODAY'S WORK COUNTERS ── */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Today's Work</h2>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Urgent Cases Counter */}
          <div
            onClick={() => onNavigateToTab('patients')}
            className="p-4 bg-white border border-slate-200 hover:border-rose-400 rounded-2xl cursor-pointer transition-colors space-y-1 group"
          >
            <span className="text-[10px] font-black uppercase text-slate-400 block">Urgent Cases</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-rose-700">{urgentCases.length}</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* Patients to see (Scheduled Work Queue) */}
          <div
            onClick={() => onNavigateToTab('followups')}
            className="p-4 bg-white border border-slate-200 hover:border-[#008080] rounded-2xl cursor-pointer transition-colors space-y-1 group"
          >
            <span className="text-[10px] font-black uppercase text-slate-400 block">Patients to see</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-slate-950">
                {overdue.length + dueToday.length}
              </span>
              <Users className="w-4 h-4 text-[#008080] group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* Follow-ups Due */}
          <div
            onClick={() => onNavigateToTab('followups')}
            className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-2xl cursor-pointer transition-colors space-y-1 group"
          >
            <span className="text-[10px] font-black uppercase text-slate-400 block">Follow-ups Due</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-amber-700">{stats?.followupsDue || 0}</span>
              <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* Pending referrals */}
          <div
            onClick={() => onNavigateToTab('referrals')}
            className="p-4 bg-white border border-slate-200 hover:border-sky-400 rounded-2xl cursor-pointer transition-colors space-y-1 group"
          >
            <span className="text-[10px] font-black uppercase text-slate-400 block">Pending Referrals</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-sky-700">{stats?.pendingReferrals || 0}</span>
              <Building2 className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ── D. COMPACT MEDICINE KIT STATUS SUMMARY ── */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF5EB] border border-[#FF9933]/40 flex items-center justify-center text-base shrink-0">
              💊
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-slate-900">Frontline Drug Kit (औषध किट)</h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NHM Field Stock
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold">Essential tablets, ORS, test & delivery kits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('medicine_kit')}
            className="text-xs font-black text-[#b35900] hover:text-[#FF9933] flex items-center gap-1 cursor-pointer bg-[#FFF5EB] hover:bg-[#ffe8d1] px-2.5 py-1.5 rounded-xl border border-[#FF9933]/30 transition-colors"
          >
            <span>Manage Kit →</span>
          </button>
        </div>
      </div>

      {/* ── E. QUICK ACTIONS SHORTCUTS ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
        <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Quick Actions</h2>
        
        <div className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
          <button
            onClick={onOpenSearch}
            className="w-full text-left py-2.5 flex items-center justify-between hover:text-[#008080] transition-colors"
          >
            <span>🔎 Find Patient Record</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          <button
            onClick={onOpenRegister}
            className="w-full text-left py-2.5 flex items-center justify-between hover:text-[#008080] transition-colors"
          >
            <span>+ Register New Patient</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateToTab('followups')}
            className="w-full text-left py-2.5 flex items-center justify-between hover:text-[#008080] transition-colors"
          >
            <span>📋 Today's Care Cases</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={onOpenSurvey}
            className="w-full text-left py-2.5 flex items-center justify-between hover:text-[#008080] transition-colors"
          >
            <span>📋 Village Survey & Onboarding</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateToTab('medicine_kit')}
            className="w-full text-left py-2.5 flex items-center justify-between hover:text-[#008080] transition-colors"
          >
            <span>💊 Dispense / Indent Medicines</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
