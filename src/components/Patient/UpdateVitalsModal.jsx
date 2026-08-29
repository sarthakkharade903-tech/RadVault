import React, { useState, useEffect, useRef } from "react";
import { X, Save, AlertTriangle, CheckCircle2, Heart, Droplet, Weight, Ruler, Thermometer, Wind, Activity } from "lucide-react";
import { saveVitalsReading } from "../../services/ashaService";

export default function UpdateVitalsModal({ patientId, metric = "all", onClose, onSaved }) {
  const [f, setF] = useState({
    bp_systolic: "",
    bp_diastolic: "",
    blood_glucose: "",
    weight_kg: "",
    height_cm: "",
    temperature_c: "",
    spo2_pct: "",
    pulse_bpm: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Constrain numeric inputs strictly to 2-3 digits
  const handleDigitChange = (field, val, maxLen = 3) => {
    const digitsOnly = String(val).replace(/\D/g, "").slice(0, maxLen);
    set(field, digitsOnly);
  };

  // Status badges calculation
  const sysNum = parseInt(f.bp_systolic, 10);
  const diaNum = parseInt(f.bp_diastolic, 10);
  let bpStatus = null;
  if (!isNaN(sysNum) && !isNaN(diaNum) && sysNum > 0 && diaNum > 0) {
    if (sysNum >= 140 || diaNum >= 90) bpStatus = { text: "HIGH BP (>140/90)", color: "bg-red-100 text-red-800" };
    else if (sysNum < 90 || diaNum < 60) bpStatus = { text: "LOW BP (<90/60)", color: "bg-amber-100 text-amber-800" };
    else bpStatus = { text: "NORMAL (120/80)", color: "bg-emerald-100 text-emerald-800" };
  }

  const sugarNum = parseInt(f.blood_glucose, 10);
  let sugarStatus = null;
  if (!isNaN(sugarNum) && sugarNum > 0) {
    if (sugarNum > 140) sugarStatus = { text: "HIGH SUGAR (>140)", color: "bg-red-100 text-red-800" };
    else if (sugarNum < 70) sugarStatus = { text: "LOW SUGAR (<70)", color: "bg-amber-100 text-amber-800" };
    else sugarStatus = { text: "NORMAL (70-140)", color: "bg-emerald-100 text-emerald-800" };
  }

  const spo2Num = parseInt(f.spo2_pct, 10);
  let spo2Status = null;
  if (!isNaN(spo2Num) && spo2Num > 0) {
    if (spo2Num < 90) spo2Status = { text: "CRITICAL LOW (<90%)", color: "bg-red-600 text-white" };
    else if (spo2Num < 95) spo2Status = { text: "LOW OXYGEN (90-94%)", color: "bg-amber-100 text-amber-800" };
    else spo2Status = { text: "NORMAL (95-100%)", color: "bg-emerald-100 text-emerald-800" };
  }

  const pulseNum = parseInt(f.pulse_bpm, 10);
  let pulseStatus = null;
  if (!isNaN(pulseNum) && pulseNum > 0) {
    if (pulseNum > 100) pulseStatus = { text: "FAST (>100)", color: "bg-red-100 text-red-800" };
    else if (pulseNum < 60) pulseStatus = { text: "SLOW (<60)", color: "bg-amber-100 text-amber-800" };
    else pulseStatus = { text: "NORMAL (60-100)", color: "bg-emerald-100 text-emerald-800" };
  }

  const handleSave = async () => {
    // Basic verification
    if ((f.bp_systolic && !f.bp_diastolic) || (!f.bp_systolic && f.bp_diastolic)) {
      setError("Blood pressure requires both Systolic and Diastolic values.");
      return;
    }

    const hasAny = Object.values(f).some(v => v !== "");
    if (!hasAny) {
      setError("Please fill in at least one health reading before saving.");
      return;
    }

    setError("");
    setSaving(true);

    const payload = {};
    if (f.bp_systolic)   payload.bp_systolic   = parseInt(f.bp_systolic, 10);
    if (f.bp_diastolic)  payload.bp_diastolic  = parseInt(f.bp_diastolic, 10);
    if (f.blood_glucose) payload.blood_glucose = parseFloat(f.blood_glucose);
    if (f.weight_kg)     payload.weight_kg     = parseFloat(f.weight_kg);
    if (f.height_cm)     payload.height_cm     = parseFloat(f.height_cm);
    if (f.temperature_c) payload.temperature_c = parseFloat(f.temperature_c);
    if (f.spo2_pct)      payload.spo2_pct      = parseInt(f.spo2_pct, 10);
    if (f.pulse_bpm)     payload.pulse_bpm     = parseInt(f.pulse_bpm, 10);

    const { error: saveErr } = await saveVitalsReading(patientId, payload, "SELF-REPORTED");
    setSaving(false);

    if (saveErr) {
      setError(saveErr.message || "Failed to save vitals.");
      return;
    }

    setDone(true);
    setTimeout(() => {
      onSaved();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-amber-200 animate-in slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-[#FFF9ED] px-6 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-300/40">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#16324F]">Update Health Readings</h2>
              <p className="text-xs text-slate-500">Record current vitals (Max 2–3 digits)</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 font-sans text-slate-800">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {done && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Vitals updated successfully!</span>
            </div>
          )}

          {/* Blood Pressure (SYS / DIA) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Blood Pressure (mmHg)</span>
              </label>
              {bpStatus && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${bpStatus.color}`}>
                  {bpStatus.text}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">SYS (Max 3 digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="120"
                  value={f.bp_systolic}
                  onChange={e => handleDigitChange("bp_systolic", e.target.value, 3)}
                  className="w-full bg-white border border-slate-200 focus:border-amber-400 rounded-xl px-3 py-2.5 text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">DIA (Max 3 digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="80"
                  value={f.bp_diastolic}
                  onChange={e => handleDigitChange("bp_diastolic", e.target.value, 3)}
                  className="w-full bg-white border border-slate-200 focus:border-amber-400 rounded-xl px-3 py-2.5 text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Blood Sugar & SpO2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Blood Sugar */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-amber-500" />
                  <span>Blood Sugar</span>
                </label>
                {sugarStatus && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${sugarStatus.color}`}>
                    {sugarStatus.text}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-amber-400 rounded-xl px-3 py-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="100"
                  value={f.blood_glucose}
                  onChange={e => handleDigitChange("blood_glucose", e.target.value, 3)}
                  className="w-full text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
                <span className="text-xs font-bold text-slate-400">mg/dL</span>
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-sky-500" />
                  <span>Oxygen SpO₂</span>
                </label>
                {spo2Status && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${spo2Status.color}`}>
                    {spo2Status.text}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-amber-400 rounded-xl px-3 py-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="98"
                  value={f.spo2_pct}
                  onChange={e => handleDigitChange("spo2_pct", e.target.value, 3)}
                  className="w-full text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Weight */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                <Weight className="w-4 h-4 text-emerald-500" />
                <span>Weight (kg)</span>
              </label>
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-amber-400 rounded-xl px-3 py-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="55"
                  value={f.weight_kg}
                  onChange={e => handleDigitChange("weight_kg", e.target.value, 3)}
                  className="w-full text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
                <span className="text-xs font-bold text-slate-400">kg</span>
              </div>
            </div>

            {/* Height */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-purple-500" />
                <span>Height (cm)</span>
              </label>
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-amber-400 rounded-xl px-3 py-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="165"
                  value={f.height_cm}
                  onChange={e => handleDigitChange("height_cm", e.target.value, 3)}
                  className="w-full text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
                <span className="text-xs font-bold text-slate-400">cm</span>
              </div>
            </div>
          </div>

          {/* Temperature & Pulse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Temperature */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <span>Temperature (°C)</span>
              </label>
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-amber-400 rounded-xl px-3 py-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="37.0"
                  value={f.temperature_c}
                  onChange={e => set("temperature_c", e.target.value.slice(0, 4))}
                  className="w-full text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
                <span className="text-xs font-bold text-slate-400">°C</span>
              </div>
            </div>

            {/* Pulse */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#16324F] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>Pulse Rate</span>
                </label>
                {pulseStatus && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${pulseStatus.color}`}>
                    {pulseStatus.text}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-amber-400 rounded-xl px-3 py-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="72"
                  value={f.pulse_bpm}
                  onChange={e => handleDigitChange("pulse_bpm", e.target.value, 3)}
                  className="w-full text-base font-black text-slate-900 focus:outline-none placeholder-slate-300"
                />
                <span className="text-xs font-bold text-slate-400">bpm</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Readings"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}