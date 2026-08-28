import React, { useState } from "react";
import { Check } from "lucide-react";

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function buildDate(d, m, y) {
  if (!d || !m || !y) return null;
  return String(y) + "-" + String(m).padStart(2,"0") + "-" + String(d).padStart(2,"0");
}
export function parseDateParts(iso) {
  if (!iso) return { d: "", m: "", y: "" };
  const parts = iso.split("-");
  return { y: parts[0], m: parseInt(parts[1]), d: parseInt(parts[2]) };
}

export const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-gray-700 mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export const TextInput = ({ className = "", ...props }) => (
  <input {...props} className={"w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white " + className} />
);

export function DatePicker({ value, onChange, label, required, maxYear = 2026, minYear = 1924 }) {
  const { d, m, y } = parseDateParts(value);
  const [day, setDay] = useState(d || "");
  const [month, setMonth] = useState(m || "");
  const [year, setYear] = useState(y || "");

  const update = (nd, nm, ny) => {
    setDay(nd); setMonth(nm); setYear(ny);
    const built = buildDate(nd, nm, ny);
    if (built) onChange(built);
    else onChange("");
  };

  const daysInMonth = month && year ? new Date(year, month, 0).getDate() : 31;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const selectClass = "flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal-500 bg-white cursor-pointer";

  return (
    <div className="mb-4">
      {label && <Label required={required}>{label}</Label>}
      <div className="flex gap-2">
        <select value={day} onChange={e => update(e.target.value, month, year)} className={selectClass}>
          <option value="">Day</option>
          {Array.from({ length: daysInMonth }, (_, i) => i+1).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={month} onChange={e => update(day, e.target.value, year)} className={selectClass}>
          <option value="">Month</option>
          {MONTHS.map((mn, i) => <option key={i} value={i+1}>{mn}</option>)}
        </select>
        <select value={year} onChange={e => { update(day, month, e.target.value); if (e.target.value && day && month) { const age = Math.floor((new Date() - new Date(buildDate(day, month, e.target.value))) / (365.25*24*60*60*1000)); if (age >= 0) onChange(buildDate(day, month, e.target.value), age); } }} className={selectClass + " flex-[1.5]"}>
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

export const Chip = ({ active, onClick, color = "teal", children }) => {
  const ac = color==="red" ? "bg-red-100 border-red-400 text-red-700 shadow-sm" : color==="amber" ? "bg-amber-100 border-amber-400 text-amber-700 shadow-sm" : "bg-teal-600 border-teal-600 text-white shadow-sm";
  return (
    <button type="button" onClick={onClick} className={"px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all " + (active ? ac : "bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50")}>
      {children}
    </button>
  );
};

export const Toggle = ({ checked, onChange, label, color = "teal", sublabel }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={"w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all mb-3 text-left " + (checked ? (color==="red"?"bg-red-50 border-red-400":"bg-teal-50 border-teal-400") : "bg-white border-gray-200 hover:border-gray-300")}>
    <div>
      <span className={"text-sm font-bold block " + (checked ? (color==="red"?"text-red-800":"text-teal-800") : "text-gray-900")}>{label}</span>
      {sublabel && <span className={"text-xs mt-0.5 block " + (checked ? (color==="red"?"text-red-600":"text-teal-600") : "text-gray-500")}>{sublabel}</span>}
    </div>
    <div className={"w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 " + (checked ? (color==="red"?"bg-red-600 border-red-600":"bg-teal-600 border-teal-600") : "border-gray-300")}>
      {checked && <Check className="w-3.5 h-3.5 text-white" />}
    </div>
  </button>
);