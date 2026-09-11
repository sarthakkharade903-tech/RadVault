import React, { useState } from 'react';
import { Activity, Calendar, UserCheck, AlertTriangle, Heart, Thermometer, Droplet, Clock } from 'lucide-react';

export default function DoctorVitalsTimeline({ vitalsHistory = [], triageVitals = null, patientName = 'Patient' }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'table'

  // Normalize and combine triage vitals if available and not duplicated
  const readings = [...(vitalsHistory || [])];

  const formatReadingDate = (isoStr) => {
    if (!isoStr) return 'Recent Check';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#008F83] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Recorded Vitals History
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold">
              Longitudinal biometrics with recording timestamps & source attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-black bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chronological
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Table Matrix
          </button>
        </div>
      </div>

      {readings.length === 0 && !triageVitals ? (
        <div className="py-6 text-center text-xs text-slate-400 font-medium">
          No previous vitals recordings found on file.
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
          {readings.map((reading, idx) => {
            const hasBP = reading.bp_systolic && reading.bp_diastolic;
            const isBPHigh = reading.bp_systolic >= 135 || reading.bp_diastolic >= 88;
            const isSpO2Low = reading.spo2_pct && reading.spo2_pct < 94;
            const isTempHigh = reading.temperature_c && reading.temperature_c > 37.5;
            const tempF = reading.temperature_c ? ((reading.temperature_c * 9/5) + 32).toFixed(1) : null;

            return (
              <div
                key={reading.id || idx}
                className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                  idx === 0
                    ? 'bg-purple-50/40 border-purple-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatReadingDate(reading.recorded_at)}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-[#7C3AED] text-white">
                        Latest Reading
                      </span>
                    )}
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    reading.source?.toLowerCase().includes('asha')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {reading.source || 'ASHA recorded'}
                    {reading.recorded_by ? ` · ${reading.recorded_by}` : ''}
                  </span>
                </div>

                {/* Vitals Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  {/* Blood Pressure */}
                  <div className={`p-2 rounded-xl border text-[11px] font-bold ${
                    isBPHigh
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">BP</span>
                    <span className="font-extrabold">{hasBP ? `${reading.bp_systolic}/${reading.bp_diastolic} mmHg` : reading.bp_systolic || '—'}</span>
                  </div>

                  {/* Pulse Rate */}
                  <div className="p-2 rounded-xl border bg-white border-slate-200 text-slate-800 text-[11px] font-bold">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Pulse</span>
                    <span className="font-extrabold">{reading.pulse_bpm ? `${reading.pulse_bpm} bpm` : '—'}</span>
                  </div>

                  {/* SpO2 */}
                  <div className={`p-2 rounded-xl border text-[11px] font-bold ${
                    isSpO2Low
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">SpO2</span>
                    <span className="font-extrabold">{reading.spo2_pct ? `${reading.spo2_pct}%` : '—'}</span>
                  </div>

                  {/* Temperature */}
                  <div className={`p-2 rounded-xl border text-[11px] font-bold ${
                    isTempHigh
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Temp</span>
                    <span className="font-extrabold">{tempF ? `${tempF}°F` : '—'}</span>
                  </div>
                </div>

                {(reading.weight_kg || reading.blood_glucose) && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 pt-0.5">
                    {reading.weight_kg && <span>Weight: <strong className="text-slate-800">{reading.weight_kg} kg</strong></span>}
                    {reading.blood_glucose && <span>Blood Sugar: <strong className="text-slate-800">{reading.blood_glucose} mg/dL</strong></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Matrix View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-700">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 text-[10px] uppercase font-black">
                <th className="pb-2 pr-3">Recorded Date</th>
                <th className="pb-2 pr-3">BP</th>
                <th className="pb-2 pr-3">Pulse</th>
                <th className="pb-2 pr-3">SpO2</th>
                <th className="pb-2 pr-3">Temp</th>
                <th className="pb-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map((r, i) => (
                <tr key={i} className={i === 0 ? 'text-[#7C3AED] bg-purple-50/30' : 'text-slate-700'}>
                  <td className="py-2 pr-3 font-mono text-[11px]">{formatReadingDate(r.recorded_at)}</td>
                  <td className="py-2 pr-3">{r.bp_systolic && r.bp_diastolic ? `${r.bp_systolic}/${r.bp_diastolic}` : r.bp_systolic || '—'}</td>
                  <td className="py-2 pr-3">{r.pulse_bpm ? `${r.pulse_bpm} bpm` : '—'}</td>
                  <td className={`py-2 pr-3 ${r.spo2_pct && r.spo2_pct < 94 ? 'text-rose-600 font-black' : ''}`}>
                    {r.spo2_pct ? `${r.spo2_pct}%` : '—'}
                  </td>
                  <td className="py-2 pr-3">{r.temperature_c ? `${((r.temperature_c * 9/5) + 32).toFixed(1)}°F` : '—'}</td>
                  <td className="py-2 text-[10px] text-slate-400">{r.source || 'ASHA'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
