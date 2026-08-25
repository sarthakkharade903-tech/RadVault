import React from 'react';
import { Plus, Minus } from 'lucide-react';

// ─── Big YES / NO Tap Buttons ─────────────────────────────────────────────────
export function YesNo({ label, value, onChange, dangerOnYes = false }) {
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5 leading-snug">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onChange(true)}
          className={`py-4 rounded-xl font-extrabold text-sm border-2 transition-all ${
            value === true
              ? dangerOnYes ? 'bg-[#D32F2F] border-[#D32F2F] text-white' : 'bg-[#008080] border-[#008080] text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          ✅ Yes
        </button>
        <button type="button" onClick={() => onChange(false)}
          className={`py-4 rounded-xl font-extrabold text-sm border-2 transition-all ${
            value === false ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          ❌ No
        </button>
      </div>
    </div>
  );
}

// ─── Number Stepper ───────────────────────────────────────────────────────────
export function Stepper({ label, value, onChange, min = 0, max = 100, unit = '' }) {
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5">{label}</p>
      <div className="flex items-center gap-4 bg-white border-2 border-slate-200 rounded-xl px-4 py-3">
        <button type="button" onClick={() => onChange(Math.max(min, (value || 0) - 1))}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold transition-colors">
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-4xl font-extrabold text-[#008080]">{value ?? 0}</span>
          {unit && <span className="text-sm text-[#555555] ml-1.5">{unit}</span>}
        </div>
        <button type="button" onClick={() => onChange(Math.min(max, (value || 0) + 1))}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold transition-colors">
          <Plus className="w-4 h-4" />
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
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-bold text-sm transition-all text-left ${
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

// ─── Blood Pressure Input ─────────────────────────────────────────────────────
export function BPInput({ value, onChange, focusColor = 'focus:border-[#008080]' }) {
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5">Blood Pressure (mmHg)</p>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 120/80"
        className={`w-full border-2 border-slate-200 ${focusColor} rounded-xl px-4 py-3.5 text-base outline-none text-[#212121] font-bold placeholder:font-normal`}
      />
    </div>
  );
}

// ─── Temperature Selector ─────────────────────────────────────────────────────
export function TempInput({ value, onChange }) {
  const isFever = value && value !== 'No Fever';
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5">Temperature</p>
      <div className="grid grid-cols-2 gap-3">
        {['No Fever', 'Fever Present'].map((label) => (
          <button key={label} type="button" onClick={() => onChange(label === 'Fever Present' ? 'Fever' : 'No Fever')}
            className={`py-3.5 rounded-xl font-extrabold text-sm border-2 transition-all ${
              (label === 'Fever Present' && isFever) || (label === 'No Fever' && value === 'No Fever')
                ? label === 'Fever Present' ? 'bg-[#FF9933] border-[#FF9933] text-white' : 'bg-[#008080] border-[#008080] text-white'
                : 'bg-white border-slate-200 text-slate-600'
            }`}>
            {label === 'No Fever' ? '✅ No Fever' : '🌡️ Fever'}
          </button>
        ))}
      </div>
      {isFever && (
        <input type="number" step="0.1" placeholder="Record temperature in °F (optional)"
          className="mt-2 w-full border-2 border-[#FF9933]/50 focus:border-[#FF9933] rounded-xl px-4 py-2.5 text-sm outline-none"
          onChange={(e) => onChange(`Fever (${e.target.value}°F)`)} />
      )}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-extrabold text-[#555555] uppercase tracking-widest mb-3 mt-5 pb-1 border-b border-slate-100">
      {children}
    </p>
  );
}

// ─── Danger Alert Banner ──────────────────────────────────────────────────────
export function DangerBanner({ message }) {
  return (
    <div className="p-4 bg-[#D32F2F] text-white rounded-2xl font-bold text-sm mb-5">
      🚨 {message}
    </div>
  );
}
