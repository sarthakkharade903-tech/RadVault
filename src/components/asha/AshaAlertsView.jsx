import React from 'react';
import { AlertTriangle, ShieldAlert, Phone, ChevronRight, CheckCircle } from 'lucide-react';

export default function AshaAlertsView({
  encounters = [],
  patients = [],
  onSelectPatient
}) {
  const highPriorityEncounters = encounters.filter(
    (e) => e.priority === 'HIGH' || e.priority === 'RED' || (e.dangerSigns && e.dangerSigns.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clinical Emergency Alerts</h1>
          <p className="text-xs text-slate-500 font-medium">
            High-risk cases, critical danger signs, and immediate clinical escalations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-xl self-start sm:self-auto">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Active Flagged Cases: <strong>{highPriorityEncounters.length}</strong></span>
        </div>
      </div>

      {/* ── High Risk Encounters List ── */}
      {highPriorityEncounters.length > 0 ? (
        <div className="space-y-3.5">
          {highPriorityEncounters.map((enc) => {
            const matchedPatient = patients.find(
              (p) => p.id === enc.patientId || p.unified_id === enc.patientUnifiedId
            ) || {
              id: enc.patientId,
              unified_id: enc.patientUnifiedId,
              full_name: enc.patientName,
              vitals: enc.vitals
            };

            const vitalsObj = typeof matchedPatient.vitals === 'object' && matchedPatient.vitals !== null ? matchedPatient.vitals : {};
            const emergencyPhone = vitalsObj.emergencyPhone || matchedPatient.phone_number;

            return (
              <div
                key={enc.id}
                className="p-5 bg-rose-50/40 border-2 border-rose-300 rounded-2xl shadow-2xs space-y-3 hover:border-rose-500 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-base text-slate-900">{enc.patientName}</span>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-rose-200">
                      {enc.patientUnifiedId}
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-600 text-white">
                      🔴 EMERGENCY / HIGH PRIORITY
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(enc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Chief complaint & danger signs */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">
                    Chief Complaint: <span className="font-normal text-slate-700">{enc.complaint || 'Acute distress'}</span>
                  </p>

                  {enc.dangerSigns && enc.dangerSigns.length > 0 && (
                    <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="uppercase text-[10px] tracking-wider block text-rose-500 font-black">Flagged Danger Signs:</span>
                        <span>{enc.dangerSigns.join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vitals snapshot */}
                {enc.vitals && Object.keys(enc.vitals).length > 0 && (
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 flex-wrap">
                    {enc.vitals.bp && <span>BP: <strong>{enc.vitals.bp}</strong></span>}
                    {enc.vitals.pulse && <span>Pulse: <strong>{enc.vitals.pulse} bpm</strong></span>}
                    {enc.vitals.spo2 && <span>SpO₂: <strong>{enc.vitals.spo2}%</strong></span>}
                    {enc.vitals.temp && <span>Temp: <strong>{enc.vitals.temp}°F</strong></span>}
                  </div>
                )}

                {/* Destination if referred */}
                {enc.hospital && (
                  <p className="text-xs text-[#008080] font-bold">
                    → Referral Routed to: {enc.hospital} ({enc.department || 'Emergency'})
                  </p>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-200/60">
                  {emergencyPhone ? (
                    <a
                      href={`tel:${emergencyPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Emergency Contact ({emergencyPhone})</span>
                    </a>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={() => onSelectPatient(matchedPatient)}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Open Patient Care Record</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <CheckCircle className="w-9 h-9 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-800">No active emergency alerts</p>
          <p className="text-xs text-slate-400">All evaluated beneficiaries in this sector are clinically stable.</p>
        </div>
      )}
    </div>
  );
}
