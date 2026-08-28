import React, { useMemo } from 'react';
import {
  Search,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  MapPin,
  Clock,
  Building2
} from 'lucide-react';
import { getHighAttentionWatchlist, getCommunityAreaSummary } from '../../services/encounterService';

export default function AshaDashboard({
  user,
  stats,
  patients = [],
  recentEncounters = [],
  followUpTasks = {},
  isOnline = true,
  isSyncing = false,
  onManualSync,
  onOpenSearch,
  onOpenRegister,
  onSelectPatient,
  onNavigateToTab,
  ashaProfile,
  ashaArea,
  ashaVillages
}) {
  const { overdue = [], dueToday = [] } = followUpTasks;

  const urgentCases = useMemo(() => {
    return recentEncounters.filter(
      (e) => e.priority === 'HIGH' || e.priority === 'RED' || (e.dangerSigns && e.dangerSigns.length > 0)
    );
  }, [recentEncounters]);

  const actionableTasks = useMemo(() => {
    return [...overdue, ...dueToday].slice(0, 4);
  }, [overdue, dueToday]);

  const watchlist = useMemo(() => {
    return getHighAttentionWatchlist(patients, recentEncounters).slice(0, 3);
  }, [patients, recentEncounters]);

  const communitySummaries = useMemo(() => {
    return getCommunityAreaSummary(patients, recentEncounters).slice(0, 2);
  }, [patients, recentEncounters]);

  const workerName = ashaProfile?.name || (user?.email ? user.email.split('@')[0] : 'Sunita Deshmukh');
  const pendingSync = stats?.pendingSyncCount || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── A. Header Area ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Good day, {workerName}
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#008080]" />
            <span>
              {ashaArea?.name || 'Sector 4'} · {ashaProfile?.phc_name || 'Shrirampur Primary Healthcare Network'}
            </span>
          </p>
        </div>

        {/* Small Network & Sync Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isOnline ? (
            pendingSync > 0 ? (
              <button
                type="button"
                disabled={isSyncing}
                onClick={onManualSync}
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>⚡ {pendingSync} to sync</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online · Synced</span>
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-300">
              <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Offline ({pendingSync} saved locally)</span>
            </span>
          )}
        </div>
      </div>

      {/* ── B. Urgent Attention Area ── */}
      {urgentCases.length > 0 ? (
        <div className="p-4 sm:p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-rose-700 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              <span>{urgentCases.length} Urgent {urgentCases.length === 1 ? 'Case Needs' : 'Cases Need'} Immediate Action</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('alerts')}
              className="text-xs font-bold text-rose-700 hover:underline"
            >
              View all emergencies →
            </button>
          </div>

          <div className="space-y-2">
            {urgentCases.slice(0, 2).map((enc) => (
              <div
                key={enc.id}
                className="p-3 bg-white border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{enc.patientName}</span>
                    <span className="font-mono text-xs font-bold text-slate-400">{enc.patientUnifiedId}</span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                      Emergency Alert
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {enc.complaint || 'Acute distress'} {enc.hospital ? `→ ${enc.hospital}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPatient({ id: enc.patientId, unified_id: enc.patientUnifiedId, full_name: enc.patientName })}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-center cursor-pointer"
                >
                  View Case
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-600 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ No urgent emergency alerts right now. All evaluated patients are clinically stable.</span>
        </div>
      )}

      {/* ── C. Primary Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-4 bg-[#008080] hover:bg-[#006666] text-white font-black text-sm rounded-2xl transition-all shadow-md hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Search className="w-5 h-5 text-white" />
          <span>Find Beneficiary (Search)</span>
        </button>

        <button
          type="button"
          onClick={onOpenRegister}
          className="p-4 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-sm rounded-2xl transition-all shadow-md hover:scale-[1.01] active:scale-99 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <UserPlus className="w-5 h-5 text-slate-950" />
          <span>+ Register New Patient</span>
        </button>
      </div>

      {/* ── D. Today's Work Summary ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
          Today's Field Activity
        </span>

        <div className="flex items-center gap-6 text-xs font-extrabold text-slate-700 flex-wrap">
          <div
            onClick={() => onNavigateToTab('today')}
            className="cursor-pointer hover:text-[#008080] transition-colors"
          >
            <span className="text-base text-slate-900 font-black mr-1.5">{stats?.todayEncounters || 0}</span>
            <span className="text-slate-500 font-medium">Visits Today</span>
          </div>

          <div
            onClick={() => onNavigateToTab('followups')}
            className="cursor-pointer hover:text-[#008080] transition-colors"
          >
            <span className="text-base text-amber-900 font-black mr-1.5">{stats?.followupsDue || 0}</span>
            <span className="text-slate-500 font-medium">Follow-ups Due</span>
          </div>

          <div
            onClick={() => onNavigateToTab('referrals')}
            className="cursor-pointer hover:text-[#008080] transition-colors"
          >
            <span className="text-base text-sky-900 font-black mr-1.5">{stats?.pendingReferrals || 0}</span>
            <span className="text-slate-500 font-medium">Active Consultations</span>
          </div>
        </div>
      </div>

      {/* ── E. Today's Actionable Tasks ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Today's Work Queue</h2>
            <p className="text-[11px] text-slate-400 font-medium">Prioritized reviews and scheduled follow-ups</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('today')}
            className="text-xs font-bold text-[#008080] hover:underline flex items-center gap-0.5"
          >
            <span>Open queue ({overdue.length + dueToday.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {actionableTasks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {actionableTasks.map((task) => (
              <div
                key={task.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-slate-900">{task.patientName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{task.patientUnifiedId}</span>
                    {task.followUpDate < new Date().toISOString().slice(0, 10) ? (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                        Overdue
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                        Due Today
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                    {task.followUpReason || task.complaint}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPatient({ id: task.patientId, unified_id: task.patientUnifiedId, full_name: task.patientName })}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-auto flex items-center gap-1 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">
            ✓ No pending follow-up tasks due today.
          </div>
        )}
      </div>

      {/* ── F. High-Attention Watchlist Preview ── */}
      {watchlist.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">High-Attention Watchlist</h2>
              <p className="text-[11px] text-slate-400 font-medium">Beneficiaries with chronic conditions or recent clinical alerts</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('patients')}
              className="text-xs font-bold text-[#008080] hover:underline"
            >
              All patients →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {watchlist.map((item) => (
              <div
                key={item.patient.id || item.patient.unified_id}
                onClick={() => onSelectPatient(item.patient)}
                className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 rounded-xl px-2 -mx-2 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#008080]">
                      {item.patient.full_name || item.patient.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{item.patient.unified_id}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{item.reasons[0]}</p>
                </div>

                <span className="text-xs font-bold text-[#008080] flex items-center gap-0.5">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── G. Today in My Area Preview ── */}
      {communitySummaries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#008080]" />
              <h2 className="text-sm font-extrabold text-slate-900">Today in My Area</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('community')}
              className="text-xs font-bold text-[#008080] hover:underline"
            >
              Full area breakdown →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {communitySummaries.map((v) => (
              <div
                key={v.villageName}
                onClick={() => onNavigateToTab('community')}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:border-[#008080] transition-colors"
              >
                <div className="font-bold text-xs text-slate-900">{v.villageName}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                  <span>{v.totalPatients} patients</span>
                  <span>·</span>
                  <span>{v.followUpsDue} follow-ups</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
