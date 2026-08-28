import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Phone, MapPin, ChevronRight, AlertTriangle, Clock, Building2 } from 'lucide-react';
import { derivePatientNextAction } from '../../services/encounterService';

export default function AshaPatientsView({
  patients = [],
  encounters = [],
  onSelectPatient,
  onOpenRegister,
  initialVillageFilter = 'ALL'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NEEDS_ATTENTION' | 'FOLLOW_UP_DUE' | 'ACTIVE_CONSULTATION' | 'RECENTLY_SEEN'
  const [selectedVillage, setSelectedVillage] = useState(initialVillageFilter);

  // Extract unique villages
  const villages = useMemo(() => {
    const set = new Set();
    patients.forEach((p) => {
      if (p.address) set.add(p.address.trim());
    });
    return Array.from(set);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const todayStr = new Date().toISOString().slice(0, 10);

    return patients.filter((p) => {
      const nameMatch = (p.full_name || p.name || '').toLowerCase().includes(q);
      const idMatch = (p.unified_id || p.id || '').toLowerCase().includes(q);
      const phoneMatch = (p.phone_number || p.phone || '').includes(q);
      const villageMatch = (p.address || '').toLowerCase().includes(q);

      const matchesQuery = !q || nameMatch || idMatch || phoneMatch || villageMatch;
      const matchesVillage = selectedVillage === 'ALL' || (p.address || '').trim() === selectedVillage;

      if (!matchesQuery || !matchesVillage) return false;

      const pEncounters = encounters.filter(
        (e) => e.patientId === p.id || e.patientUnifiedId === p.unified_id
      );
      const latest = pEncounters[0];

      if (statusFilter === 'NEEDS_ATTENTION') {
        const vitalsObj = typeof p.vitals === 'object' && p.vitals !== null ? p.vitals : {};
        const isChronic = (vitalsObj.conditions || []).length > 0;
        const isEmergency = latest && (latest.priority === 'HIGH' || latest.priority === 'RED');
        const isOverdue = latest && latest.followUpDate && !latest.followUpCompleted && latest.followUpDate < todayStr;
        return isEmergency || isOverdue || isChronic;
      }

      if (statusFilter === 'FOLLOW_UP_DUE') {
        return latest && latest.followUpDate && !latest.followUpCompleted && latest.followUpDate <= todayStr;
      }

      if (statusFilter === 'ACTIVE_CONSULTATION') {
        return latest && latest.outcome === 'REFERRAL_CREATED' && (!latest.liveStatus || latest.liveStatus === 'Pending' || latest.liveStatus === 'Accepted');
      }

      if (statusFilter === 'RECENTLY_SEEN') {
        return pEncounters.length > 0;
      }

      return true;
    });
  }, [patients, encounters, searchQuery, selectedVillage, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Village Beneficiary Directory</h1>
          <p className="text-xs text-slate-500 font-medium">
            Registry of all registered patients in Shrirampur Sector 4
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenRegister(searchQuery)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register New Patient</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, Unified ID (MH-P-...), phone number, or village..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-colors"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Filter:</span>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'NEEDS_ATTENTION', label: 'Needs Attention' },
            { key: 'FOLLOW_UP_DUE', label: 'Follow-up Due' },
            { key: 'ACTIVE_CONSULTATION', label: 'Active Consultation' },
            { key: 'RECENTLY_SEEN', label: 'Recently Seen' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-[#008080] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Village Filter Chips */}
        {villages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">
              Village:
            </span>
            <button
              type="button"
              onClick={() => setSelectedVillage('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                selectedVillage === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Villages ({patients.length})
            </button>
            {villages.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedVillage(v)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                  selectedVillage === v
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Patient List Table / Cards ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50">
          <span>
            {filteredPatients.length} {filteredPatients.length === 1 ? 'Beneficiary' : 'Beneficiaries'} found
          </span>
          {(searchQuery || selectedVillage !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedVillage('ALL');
                setStatusFilter('ALL');
              }}
              className="text-[#008080] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredPatients.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredPatients.map((p) => {
              const name = p.full_name || p.name || 'Unknown Patient';
              const unifiedId = p.unified_id || p.id || 'N/A';
              const age = p.age;
              const gender = p.gender;
              const phone = p.phone_number || p.phone;
              const address = p.address;
              const nextAction = derivePatientNextAction(p, encounters);

              return (
                <div
                  key={p.id || unifiedId}
                  onClick={() => onSelectPatient(p)}
                  role="button"
                  tabIndex={0}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#008080]/15 flex items-center justify-center font-black text-slate-700 group-hover:text-[#008080] shrink-0 text-sm">
                      {name.charAt(0)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 group-hover:text-[#008080] transition-colors">
                          {name}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.2 rounded">
                          {unifiedId}
                        </span>
                        {p.blood_group && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {p.blood_group}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        {age && <span>{age} yrs{gender ? `, ${gender}` : ''}</span>}
                        {address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {address}
                          </span>
                        )}
                        {phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {phone}
                          </span>
                        )}
                      </div>

                      {/* Next Action Pill */}
                      <div className="pt-0.5 flex items-center gap-2 text-xs">
                        <span className="text-[10px] font-black uppercase text-slate-400">Next Action:</span>
                        <span className={`font-bold text-[11px] px-2 py-0.2 rounded-md ${
                          nextAction.urgency === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800 font-black'
                            : nextAction.urgency === 'OVERDUE'
                            ? 'bg-amber-100 text-amber-900 font-black'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {nextAction.actionLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-[#008080] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Open Record <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-sm font-bold text-slate-700">No beneficiary found matching your criteria</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              If this is a new patient, register them immediately to record their baseline health data.
            </p>
            <button
              type="button"
              onClick={() => onOpenRegister(searchQuery)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register "{searchQuery || 'New Patient'}"
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
