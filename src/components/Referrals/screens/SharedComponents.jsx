import React from 'react';
import { Plus, Minus, AlertTriangle, CheckCircle2, Heart, Activity } from 'lucide-react';

// ─── Section Label ───────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 mt-4">
      {children}
    </p>
  );
}

// ─── Danger Banner ────────────────────────────────────────────────────────────
export function DangerBanner({ children }) {
  return (
    <div className="p-3.5 bg-red-600 text-white rounded-2xl font-bold text-xs mb-4 flex items-center gap-2 shadow-xs">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ─── Big YES / NO Tap Buttons ─────────────────────────────────────────────────
export function YesNo({ label, value, onChange, dangerOnYes = false }) {
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5 leading-snug">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onChange(true)}
          className={`py-4 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
            value === true
              ? dangerOnYes ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-xs' : 'bg-[#008F83] border-[#008F83] text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          ✓ Yes
        </button>
        <button type="button" onClick={() => onChange(false)}
          className={`py-4 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
            value === false ? 'bg-slate-700 border-slate-700 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          ✗ No
        </button>
      </div>
    </div>
  );
}

// ─── Number Stepper (Constrained 2-3 digits) ───────────────────────────────────
export function Stepper({ label, value, onChange, min = 0, max = 999, unit = '' }) {
  const currentVal = value !== undefined && value !== null && value !== '' ? Number(value) : min;

  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5">{label}</p>
      <div className="flex items-center gap-4 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 shadow-xs">
        <button type="button" onClick={() => onChange(Math.max(min, currentVal - 1))}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer">
          <Minus className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-3xl font-black text-[#008F83]">{currentVal}</span>
          {unit && <span className="text-xs text-slate-500 font-bold ml-1.5">{unit}</span>}
        </div>
        <button type="button" onClick={() => onChange(Math.min(max, currentVal + 1))}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Color Band Selector (Hemoglobin, MUAC) ───────────────────────────────────
export function ColorBandSelector({ label, subtitle, options, value, onChange }) {
  return (
    <div className="mb-5">
      {label && <p className="font-bold text-sm text-[#212121] mb-1">{label}</p>}
      {subtitle && <p className="text-xs text-[#555555] mb-2.5 leading-relaxed">{subtitle}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-bold text-sm transition-all text-left cursor-pointer ${
              value === opt.value ? opt.selectedClass : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            <span className={`w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-sm ${opt.dotClass}`} />
            <div className="flex-1">
              <span className="block">{opt.label}</span>
              {opt.hint && <span className="block text-xs font-normal opacity-75 mt-0.5">{opt.hint}</span>}
            </div>
            {value === opt.value && <span className="ml-auto font-black">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Blood Pressure Input (Strict 2-3 Digits with High/Normal/Low Badge) ──────
export function BPInput({ value = '', onChange }) {
  const parts = String(value).split('/');
  const sys = parts[0] || '';
  const dia = parts[1] || '';

  const handleSysChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
    onChange(dia ? `${digitsOnly}/${dia}` : digitsOnly);
  };

  const handleDiaChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
    onChange(sys ? `${sys}/${digitsOnly}` : `/${digitsOnly}`);
  };

  const sysNum = parseInt(sys, 10);
  const diaNum = parseInt(dia, 10);

  let bpStatus = null;
  if (!isNaN(sysNum) && !isNaN(diaNum) && sysNum > 0 && diaNum > 0) {
    if (sysNum >= 140 || diaNum >= 90) {
      bpStatus = { text: 'HIGH BP', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (sysNum < 90 || diaNum < 60) {
      bpStatus = { text: 'LOW BP', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      bpStatus = { text: 'NORMAL BP', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Blood Pressure (mmHg)</label>
        {bpStatus && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${bpStatus.color}`}>
            {bpStatus.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border-2 border-slate-200">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">SYS (Max 3 digits)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={sys}
            onChange={handleSysChange}
            placeholder="120"
            className="w-full text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300"
          />
        </div>
        <span className="text-2xl font-black text-slate-300">/</span>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">DIA (Max 3 digits)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={dia}
            onChange={handleDiaChange}
            placeholder="80"
            className="w-full text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Blood Sugar Input (Strict 2-3 Digits with High/Normal/Low Badge) ─────────
export function SugarInput({ value = '', onChange }) {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 3);
  const num = parseInt(digitsOnly, 10);

  let sugarStatus = null;
  if (!isNaN(num) && num > 0) {
    if (num > 140) {
      sugarStatus = { text: 'HIGH SUGAR (>140)', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (num < 70) {
      sugarStatus = { text: 'LOW SUGAR (<70)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      sugarStatus = { text: 'NORMAL (70-140)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Blood Sugar (mg/dL)</label>
        {sugarStatus && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${sugarStatus.color}`}>
            {sugarStatus.text}
          </span>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={digitsOnly}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 110"
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400">mg/dL</span>
      </div>
    </div>
  );
}

// ─── Pulse / Heart Rate Input (Strict 2-3 Digits) ─────────────────────────────
export function PulseInput({ value = '', onChange }) {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 3);
  const num = parseInt(digitsOnly, 10);

  let pulseStatus = null;
  if (!isNaN(num) && num > 0) {
    if (num > 100) {
      pulseStatus = { text: 'FAST PULSE (>100)', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (num < 60) {
      pulseStatus = { text: 'SLOW PULSE (<60)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      pulseStatus = { text: 'NORMAL (60-100)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Pulse / Heart Rate (bpm)</label>
        {pulseStatus && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${pulseStatus.color}`}>
            {pulseStatus.text}
          </span>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={digitsOnly}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 72"
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400">bpm</span>
      </div>
    </div>
  );
}

// ─── SpO2 Oxygen Saturation Input (Strict 2-3 Digits) ─────────────────────────
export function SpO2Input({ value = '', onChange }) {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 3);
  const num = parseInt(digitsOnly, 10);

  let spo2Status = null;
  if (!isNaN(num) && num > 0) {
    if (num < 90) {
      spo2Status = { text: 'CRITICAL LOW (<90%)', color: 'bg-red-600 text-white' };
    } else if (num < 95) {
      spo2Status = { text: 'LOW OXYGEN (90-94%)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      spo2Status = { text: 'NORMAL (95-100%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Oxygen Level - SpO₂ (%)</label>
        {spo2Status && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${spo2Status.color}`}>
            {spo2Status.text}
          </span>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={digitsOnly}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 98"
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400">%</span>
      </div>
    </div>
  );
}

// ─── Temperature Selector ─────────────────────────────────────────────────────
export function TempInput({ value, onChange }) {
  const isFever = value && value !== 'No Fever';
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5">Body Temperature</p>
      <div className="grid grid-cols-2 gap-3">
        {['No Fever', 'Fever Present'].map((label) => (
          <button key={label} type="button" onClick={() => onChange(label === 'Fever Present' ? 'Fever' : 'No Fever')}
            className={`py-3.5 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
              (label === 'Fever Present' && isFever) || (label === 'No Fever' && value === 'No Fever')
                ? label === 'Fever Present' ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-xs' : 'bg-[#008F83] border-[#008F83] text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            {label === 'Fever Present' ? '🔥 High Fever' : '🟢 Normal Temp'}
          </button>
        ))}
      </div>
    </div>
  );
}
