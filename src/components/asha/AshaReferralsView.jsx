import React, { useState } from 'react';
import { Building2, RefreshCw, ChevronRight } from 'lucide-react';

export default function AshaReferralsView({
  referrals = [],
  patients = [],
  onSelectPatient,
  onRefresh
}) {
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Accepted' | 'Completed'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setIsRefreshing(false);
  };

  const filteredReferrals = referrals.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return (r.liveStatus || r.referralStatus || 'Pending') === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Hospital Referrals Tracker</h1>
          <p className="text-xs text-slate-500 font-medium">
            Live coordination: Track status of patients referred to secondary and tertiary hospitals
          </p>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={handleManualRefresh}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Live Status</span>
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'Pending', 'Accepted', 'Completed'].map((status) => {
          const count = status === 'ALL'
            ? referrals.length
            : referrals.filter((r) => (r.liveStatus || r.referralStatus || 'Pending') === status).length;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-[#008080] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? 'All Referrals' : status} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Referrals List ── */}
      {filteredReferrals.length > 0 ? (
        <div className="space-y-3">
          {filteredReferrals.map((ref) => {
            const isHigh = ref.priority === 'HIGH' || ref.priority === 'RED';
            const isUrgent = ref.priority === 'ORANGE';
            const status = ref.liveStatus || ref.referralStatus || 'Pending';

            const statusClass =
              status === 'Accepted'
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : status === 'Completed'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-900 border-amber-300';

            return (
              <div
                key={ref.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 hover:border-[#008080]/60 transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-base text-slate-900">{ref.patientName}</span>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ref.patientUnifiedId}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isUrgent
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ref.priorityLabel || ref.priority}
                    </span>
                  </div>

                  {/* Hospital Status Pill */}
                  <span className={`text-xs font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 ${statusClass}`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    Hospital Intake: {status}
                  </span>
                </div>

                {/* Routing & Doctor Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Destination Facility</span>
                    <span className="font-bold">{ref.destinationHospital || ref.hospital || 'District Hospital'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Clinical Department</span>
                    <span className="font-bold">{ref.destinationDepartment || ref.department || 'Specialist Consultation'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Assigned Specialist</span>
                    <span className="font-bold">{ref.doctorAssigned || ref.doctor || 'On-Duty Specialist'}</span>
                  </div>
                </div>

                {/* Triage summary & symptoms */}
                {ref.symptoms && (
                  <p className="text-xs text-slate-600">
                    <strong>Handover Notes:</strong> {Array.isArray(ref.symptoms) ? ref.symptoms.join(', ') : ref.symptoms}
                  </p>
                )}

                {/* Footer action bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Referred on {new Date(ref.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const matched = patients.find(
                        (p) => p.id === ref.patientId || p.unified_id === ref.patientUnifiedId
                      ) || {
                        id: ref.patientId,
                        unified_id: ref.patientUnifiedId,
                        full_name: ref.patientName,
                        vitals: ref.vitals
                      };
                      onSelectPatient(matched);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#008080] hover:text-[#006666] cursor-pointer"
                  >
                    <span>View Care Record</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <Building2 className="w-9 h-9 text-slate-300 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-800">No referrals in this category</p>
          <p className="text-xs text-slate-400">Referrals created during encounters will appear here.</p>
        </div>
      )}
    </div>
  );
}
