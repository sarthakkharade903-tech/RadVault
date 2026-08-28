import React, { useState, useEffect, useRef } from "react";
import { X, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { saveVitalsReading } from "../../services/ashaService";

// ─── Validation rules ─────────────────────────────────────────────────────
const WARNINGS = {
  bp_systolic:   v => (v < 70 || v > 200) ? "Blood pressure looks unusual. Please double-check." : null,
  bp_diastolic:  v => (v < 40 || v > 130) ? "Blood pressure looks unusual. Please double-check." : null,
  blood_glucose: v => (v < 40 || v > 600) ? "Blood sugar value looks unusual. Please check." : null,
  weight_kg:     v => (v < 1  || v > 300) ? "Weight seems outside normal range." : null,
  height_cm:     v => (v < 30 || v > 250) ? "Height seems outside normal range." : null,
  temperature_c: v => (v < 34 || v > 42)  ? "Temperature looks unusual. Check the reading." : null,
  spo2_pct:      v => (v < 70 || v > 100) ? "SpO₂ must be between 70–100%." : null,
  pulse_bpm:     v => (v < 30 || v > 220) ? "Pulse rate looks unusual. Please verify." : null,
};

function NumInput({ label, unit, value, onChange, placeholder, hint, autoFocus }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [autoFocus]);

  return (
    <div className="mb-5">
      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">
        {label} <span className="text-[#94A3B8] normal-case font-normal">{unit}</span>
      </label>
      {hint && <p className="text-[10px] text-[#94A3B8] mb-1.5">{hint}</p>}
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-lg font-black text-[#16324F] placeholder-[#CBD5E1] focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/10 bg-white transition-all"
      />
    </div>
  );
}

export default function UpdateVitalsModal({ patientId, metric = "all", onClose, onSaved }) {
  const [f, setF] = useState({
    bp_systolic: "", bp_diastolic: "",
    blood_glucose: "", weight_kg: "", height_cm: "",
    temperature_c: "", spo2_pct: "", pulse_bpm: "",
  });
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState([]);
  const [warnings, setWarnings] = useState([]);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  
  const bpRef = useRef(null);
  useEffect(() => {
    if (metric === "bp" && bpRef.current) {
      setTimeout(() => bpRef.current.focus(), 100);
    }
  }, [metric]);

  const validate = () => {
    const errs = [];
    const warns = [];

    if ((f.bp_systolic && !f.bp_diastolic) || (!f.bp_systolic && f.bp_diastolic)) {
      errs.push("Blood pressure requires both systolic and diastolic values.");
    }

    const numericFields = ["bp_systolic","bp_diastolic","blood_glucose","weight_kg","height_cm","temperature_c","spo2_pct","pulse_bpm"];
    numericFields.forEach(k => {
      const v = parseFloat(f[k]);
      if (f[k] !== "" && (isNaN(v) || v < 0)) {
        errs.push(`${k.replace(/_/g,' ')} must be a positive number.`);
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

    // If there are warnings and not yet confirmed, show them first
    if (warns.length > 0 && warnings.length === 0) {
      setWarnings(warns);
      return;
    }

    // Check that at least one value is filled
    const hasAny = Object.values(f).some(v => v !== "");
    if (!hasAny) {
      setErrors(["Please enter at least one reading before saving."]);
      return;
    }

    setSaving(true);
    const payload = {
      patient_id:    patientId,
      source:        "Self-reported",
      recorded_by:   null,
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
    if (error) { setErrors([error.message || "Failed to save. Please try again."]); return; }

    setDone(true);
    setTimeout(() => { onSaved(); onClose(); }, 1200);
  };

  const isAll = metric === "all";
  const show = (m) => isAll || metric === m;

  const title = isAll ? "Update Health Readings"
    : metric === "bp" ? "Update Blood Pressure"
    : metric === "sugar" ? "Update Blood Sugar"
    : metric === "weight" ? "Update Weight"
    : metric === "height" ? "Update Height"
    : metric === "temp" ? "Update Temperature"
    : metric === "spo2" ? "Update SpO₂"
    : metric === "pulse" ? "Update Pulse"
    : "Update Reading";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      
      <div className="bg-[#FCFBF8] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh]">
        
        {/* Handle */}
        <div className="flex-shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-[17px] font-black text-[#16324F]">{title}</h2>
            {isAll && <p className="text-[11px] text-[#64748B] mt-0.5">Fill only what you know. All fields optional.</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          
          {done ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-base font-black text-[#16324F]">Reading saved successfully!</p>
              <p className="text-xs text-[#64748B]">Self-reported · Just now</p>
            </div>
          ) : (
            <>
              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    {errors.map((e, i) => <p key={i} className="text-xs font-bold text-red-800">{e}</p>)}
                  </div>
                </div>
              )}

              {/* Unusual value warnings */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
                  <div className="flex gap-2.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-900 mb-1">These readings look unusual:</p>
                      {warnings.map((w, i) => <p key={i} className="text-xs text-amber-800">• {w}</p>)}
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium">Please verify before saving. Tap Save again to confirm.</p>
                </div>
              )}

              {/* Blood Pressure */}
              {show("bp") && (
                <div className="mb-5">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">
                    Blood Pressure <span className="text-[#94A3B8] normal-case font-normal">mmHg</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input ref={bpRef} type="number" inputMode="numeric" placeholder="Systolic" value={f.bp_systolic}
                      onChange={e => set("bp_systolic", e.target.value)}
                      className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-lg font-black text-[#16324F] placeholder-[#CBD5E1] focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/10 bg-white" />
                    <span className="text-xl font-black text-[#94A3B8]">/</span>
                    <input type="number" inputMode="numeric" placeholder="Diastolic" value={f.bp_diastolic}
                      onChange={e => set("bp_diastolic", e.target.value)}
                      className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3.5 text-lg font-black text-[#16324F] placeholder-[#CBD5E1] focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/10 bg-white" />
                  </div>
                </div>
              )}

              {show("sugar") && <NumInput autoFocus={metric === "sugar"} label="Blood Sugar" unit="mg/dL" value={f.blood_glucose} placeholder="e.g. 98" onChange={v => set("blood_glucose", v)} />}
              {show("weight") && <NumInput autoFocus={metric === "weight"} label="Weight" unit="kg" value={f.weight_kg} placeholder="e.g. 62" onChange={v => set("weight_kg", v)} />}
              {show("height") && <NumInput autoFocus={metric === "height"} label="Height" unit="cm" value={f.height_cm} placeholder="e.g. 162" onChange={v => set("height_cm", v)} />}
              {show("temp") && <NumInput autoFocus={metric === "temp"} label="Temperature" unit="°C" value={f.temperature_c} placeholder="e.g. 36.8" onChange={v => set("temperature_c", v)} />}
              {show("spo2") && <NumInput autoFocus={metric === "spo2"} label="SpO₂ / Oxygen Saturation" unit="%" value={f.spo2_pct} placeholder="e.g. 98" onChange={v => set("spo2_pct", v)} />}
              {show("pulse") && <NumInput autoFocus={metric === "pulse"} label="Pulse / Heart Rate" unit="bpm" value={f.pulse_bpm} placeholder="e.g. 72" onChange={v => set("pulse_bpm", v)} />}

              <p className="text-[10px] text-[#94A3B8] text-center mt-2">
                Reading will be saved as <strong>Self-reported</strong> and is not a substitute for professional medical advice.
              </p>
            </>
          )}
        </div>

        {/* Sticky Save Button */}
        {!done && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 bg-[#FCFBF8]">
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[#008F83] hover:bg-[#007A70] active:bg-[#006860] text-white font-black py-4 rounded-2xl shadow-sm transition-colors text-[15px] flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Reading"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}