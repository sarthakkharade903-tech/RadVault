import React, { useState, useEffect } from "react";
import { ChevronLeft, Save, AlertTriangle, CheckCircle2, ActivitySquare, Plus } from "lucide-react";
import { saveVitalsReading, getVitalsHistory } from "../../services/ashaService";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " \u00B7 " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function sourceBadge(source) {
  if (source === "ASHA recorded") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 uppercase">ASHA</span>;
  if (source === "Clinical")      return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">Clinic</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">Self</span>;
}

const WARNINGS = {
  bp_systolic:   v => (v < 70 || v > 200) ? "Blood pressure looks unusual." : null,
  bp_diastolic:  v => (v < 40 || v > 130) ? "Blood pressure looks unusual." : null,
  blood_glucose: v => (v < 40 || v > 600) ? "Blood sugar looks unusual." : null,
  weight_kg:     v => (v < 1  || v > 300) ? "Weight outside normal range." : null,
  height_cm:     v => (v < 30 || v > 250) ? "Height outside normal range." : null,
  temperature_c: v => (v < 34 || v > 42)  ? "Temperature looks unusual." : null,
  spo2_pct:      v => (v < 70 || v > 100) ? "SpO₂ must be 70–100%." : null,
  pulse_bpm:     v => (v < 30 || v > 220) ? "Pulse looks unusual." : null,
};

function NumInput({ label, unit, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">
        {label} <span className="text-[#94A3B8] normal-case font-normal">{unit}</span>
      </label>
      <input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-base font-black text-[#16324F] placeholder-slate-300 focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/10 bg-white shadow-sm"
      />
    </div>
  );
}

export default function ASHAVisitLogger({ patient, onBack, onSaved }) {
  const [f, setF] = useState({
    bp_systolic: "", bp_diastolic: "",
    blood_glucose: "", weight_kg: "", height_cm: "",
    temperature_c: "", spo2_pct: "", pulse_bpm: "",
  });
  
  const [history, setHistory] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    async function load() {
      if (!patient?.id) return;
      const { data } = await getVitalsHistory(patient.id);
      if (data) setHistory(data.slice(0, 5)); // show last 5 entries for context
    }
    load();
  }, [patient]);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const validate = () => {
    const errs = [];
    const warns = [];

    if ((f.bp_systolic && !f.bp_diastolic) || (!f.bp_systolic && f.bp_diastolic)) {
      errs.push("BP requires both systolic and diastolic values.");
    }

    const numericFields = ["bp_systolic","bp_diastolic","blood_glucose","weight_kg","height_cm","temperature_c","spo2_pct","pulse_bpm"];
    numericFields.forEach(k => {
      const v = parseFloat(f[k]);
      if (f[k] !== "" && (isNaN(v) || v < 0)) {
        errs.push(`${k.replace('_',' ')} must be valid.`);
      } else if (f[k] !== "" && WARNINGS[k]) {
        const w = WARNINGS[k](v);
        if (w) warns.push(w);
      }
    });
    return { errs, warns };
  };

  const handleSave = async () => {
    const { errs, warns } = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    if (warns.length > 0 && warnings.length === 0) {
      setWarnings(warns);
      return;
    }

    const hasAny = Object.values(f).some(v => v !== "");
    if (!hasAny) {
      setErrors(["Please enter at least one reading."]);
      return;
    }

    setSaving(true);
    const payload = {
      patient_id:    patient.id,
      source:        "ASHA recorded",
      recorded_by:   "Priya Deshmukh",
      bp_systolic:   f.bp_systolic   !== "" ? parseInt(f.bp_systolic)    : null,
      bp_diastolic:  f.bp_diastolic  !== "" ? parseInt(f.bp_diastolic)   : null,
      blood_glucose: f.blood_glucose !== "" ? parseFloat(f.blood_glucose): null,
      weight_kg:     f.weight_kg     !== "" ? parseFloat(f.weight_kg)    : null,
      height_cm:     f.height_cm     !== "" ? parseFloat(f.height_cm)    : null,
      temperature_c: f.temperature_c !== "" ? parseFloat(f.temperature_c): null,
      spo2_pct:      f.spo2_pct      !== "" ? parseInt(f.spo2_pct)       : null,
      pulse_bpm:     f.pulse_bpm     !== "" ? parseInt(f.pulse_bpm)      : null,
    };

    const { error } = await saveVitalsReading(payload);
    setSaving(false);
    if (error) { setErrors([error.message]); return; }

    setDone(true);
    setTimeout(() => { onSaved(); }, 1200);
  };

  if (!patient) return null;

  return (
    <div className="h-full bg-[#F5FBF9] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <button onClick={onBack} className="p-1.5 -ml-1.5 hover:bg-slate-50 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#64748B]" />
        </button>
        <div>
          <h1 className="text-sm font-black text-[#16324F]">Log Health Visit</h1>
          <p className="text-[10px] font-bold text-[#008F83] uppercase tracking-widest">{patient.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        
        {done ? (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center border border-[#E2E8F0] shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-[#008F83] mb-4" />
            <h2 className="text-xl font-black text-[#16324F] mb-1">Visit Recorded</h2>
            <p className="text-xs font-semibold text-[#64748B]">Data synced with Family Portal.</p>
          </div>
        ) : (
          <>
            {/* Context / History Section */}
            <div>
              <h2 className="text-[11px] font-black text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ActivitySquare className="w-3.5 h-3.5" /> Recent Health History
              </h2>
              {history.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm divide-y divide-[#F1F5F9]">
                  {history.map((row, i) => {
                    const parts = [];
                    if (row.bp_systolic) parts.push(`BP ${row.bp_systolic}/${row.bp_diastolic}`);
                    if (row.blood_glucose) parts.push(`Sugar ${row.blood_glucose}`);
                    if (row.weight_kg) parts.push(`Wt ${row.weight_kg}kg`);
                    if (row.height_cm) parts.push(`Ht ${row.height_cm}cm`);
                    if (row.temperature_c) parts.push(`Temp ${row.temperature_c}\u00B0C`);
                    
                    if (parts.length === 0) return null;
                    return (
                      <div key={row.id} className="p-3 flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-[#16324F] truncate">{parts.join(" \u00B7 ")}</p>
                          <p className="text-[9px] font-bold text-[#94A3B8] mt-0.5 uppercase tracking-wide">{fmtDate(row.recorded_at)}</p>
                        </div>
                        {sourceBadge(row.source)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
                  <p className="text-xs font-semibold text-[#94A3B8]">No past readings found.</p>
                </div>
              )}
            </div>

            {/* Form Section */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4">
              <h2 className="text-[11px] font-black text-[#16324F] uppercase tracking-widest mb-4 border-b border-[#E2E8F0] pb-2">New Readings</h2>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>{errors.map((e, i) => <p key={i} className="text-xs font-bold text-red-800">{e}</p>)}</div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs font-black text-amber-900 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> Verify unusual readings:</p>
                  {warnings.map((w, i) => <p key={i} className="text-xs text-amber-800 ml-4">• {w}</p>)}
                  <p className="text-[10px] text-amber-700 mt-2 font-medium">Tap Save again to confirm.</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">Blood Pressure <span className="text-[#94A3B8] normal-case font-normal">mmHg</span></label>
                <div className="flex items-center gap-3">
                  <input type="number" inputMode="numeric" placeholder="SYS" value={f.bp_systolic} onChange={e => set("bp_systolic", e.target.value)} className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-base font-black text-[#16324F] bg-white shadow-sm" />
                  <span className="text-xl font-black text-slate-300">/</span>
                  <input type="number" inputMode="numeric" placeholder="DIA" value={f.bp_diastolic} onChange={e => set("bp_diastolic", e.target.value)} className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-base font-black text-[#16324F] bg-white shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Blood Sugar" unit="mg/dL" value={f.blood_glucose} placeholder="e.g. 98" onChange={v => set("blood_glucose", v)} />
                <NumInput label="Weight" unit="kg" value={f.weight_kg} placeholder="e.g. 62" onChange={v => set("weight_kg", v)} />
                <NumInput label="Height" unit="cm" value={f.height_cm} placeholder="e.g. 162" onChange={v => set("height_cm", v)} />
                <NumInput label="Temperature" unit="°C" value={f.temperature_c} placeholder="e.g. 36.8" onChange={v => set("temperature_c", v)} />
                <NumInput label="SpO₂" unit="%" value={f.spo2_pct} placeholder="e.g. 98" onChange={v => set("spo2_pct", v)} />
                <NumInput label="Pulse" unit="bpm" value={f.pulse_bpm} placeholder="e.g. 72" onChange={v => set("pulse_bpm", v)} />
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full mt-4 bg-[#16324F] hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Visit Record"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}