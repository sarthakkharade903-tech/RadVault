import React, { useEffect, useState } from "react";
import { X, ActivitySquare } from "lucide-react";
import { getVitalsHistory } from "../../services/ashaService";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
}
function groupByDay(rows) {
  const map = {};
  rows.forEach(r => {
    const day = fmtDay(r.recorded_at);
    if (!map[day]) map[day] = [];
    map[day].push(r);
  });
  return map;
}

function sourceBadge(source) {
  const base = "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide";
  if (source === "ASHA recorded") return <span className={`${base} bg-teal-50 text-teal-700 border-teal-200`}>{source}</span>;
  if (source === "Clinical")      return <span className={`${base} bg-indigo-50 text-indigo-700 border-indigo-200`}>{source}</span>;
  return <span className={`${base} bg-amber-50 text-amber-700 border-amber-100`}>{source}</span>;
}

function HistoryEntry({ label, value, unit, source, time }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-[11px] font-bold text-[#16324F]">{label}</p>
        <p className="text-base font-black text-[#16324F] mt-0.5">
          {value} <span className="text-xs font-semibold text-[#94A3B8]">{unit}</span>
        </p>
      </div>
      <div className="text-right flex flex-col gap-1 items-end">
        {sourceBadge(source)}
        <span className="text-[10px] text-[#94A3B8] font-medium">{time}</span>
      </div>
    </div>
  );
}

function extractEntries(row) {
  const entries = [];
  if (row.bp_systolic && row.bp_diastolic) entries.push({ label: "Blood Pressure", value: `${row.bp_systolic} / ${row.bp_diastolic}`, unit: "mmHg" });
  if (row.blood_glucose != null) entries.push({ label: "Blood Sugar", value: row.blood_glucose, unit: "mg/dL" });
  if (row.weight_kg    != null) entries.push({ label: "Weight", value: row.weight_kg, unit: "kg" });
  if (row.height_cm    != null) entries.push({ label: "Height", value: row.height_cm, unit: "cm" });
  if (row.temperature_c!= null) entries.push({ label: "Temperature", value: row.temperature_c, unit: "°C" });
  if (row.spo2_pct     != null) entries.push({ label: "SpO₂", value: row.spo2_pct, unit: "%" });
  if (row.pulse_bpm    != null) entries.push({ label: "Pulse", value: row.pulse_bpm, unit: "bpm" });
  return entries;
}

export default function VitalsHistory({ patientId, onClose }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await getVitalsHistory(patientId);
      setRows(data || []);
      setLoading(false);
    })();
  }, [patientId]);

  const grouped = groupByDay(rows);
  const days = Object.keys(grouped);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#FCFBF8] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh]">
        
        {/* Handle */}
        <div className="flex-shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[17px] font-black text-[#16324F]">Health History</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <span className="animate-spin w-6 h-6 border-2 border-[#008F83] border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <ActivitySquare className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-bold text-[#64748B]">No readings recorded yet.</p>
              <p className="text-xs text-[#94A3B8]">Your health readings will appear here once added.</p>
            </div>
          )}

          {!loading && days.map(day => (
            <div key={day} className="mb-6">
              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">{day}</p>
              {grouped[day].map(row => {
                const entries = extractEntries(row);
                if (entries.length === 0) return null;
                const time = fmtTime(row.recorded_at);
                return (
                  <div key={row.id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-3 px-4 py-2 divide-y divide-slate-50">
                    {entries.map((e, i) => (
                      <HistoryEntry key={i} {...e} source={row.source} time={time} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}