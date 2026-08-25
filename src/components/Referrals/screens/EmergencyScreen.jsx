import React, { useState } from 'react';

const DANGER_SIGNS = [
  'Unconscious or not responding to voice or touch',
  'Severe difficulty breathing or gasping',
  'Active uncontrolled bleeding',
  'Suspected heart attack (chest pain + sweating + arm pain)',
  'Suspected stroke (face drooping, arm weak, speech slurred)',
  'Pregnancy complication with heavy bleeding',
  'Severe burns or crush injury',
  'Suspected poisoning or snake bite',
  'Newborn not breathing after birth',
];

export default function EmergencyScreen({ onComplete }) {
  const [confirmed, setConfirmed] = useState([]);

  const toggle = (sign) =>
    setConfirmed((prev) => prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]);

  return (
    <div>
      <div className="p-5 bg-[#D32F2F] rounded-2xl text-white mb-6">
        <p className="text-3xl mb-2">🚨</p>
        <h3 className="font-extrabold text-xl mb-1">Emergency Fast Track</h3>
        <p className="text-sm opacity-90 leading-relaxed">
          Mark which danger signs are present. This will immediately create a RED emergency referral and skip all other steps.
        </p>
      </div>

      <p className="font-bold text-sm text-[#212121] mb-3">Signs present in this patient (tap all that apply):</p>
      <div className="space-y-2 mb-6">
        {DANGER_SIGNS.map((sign) => (
          <button key={sign} type="button" onClick={() => toggle(sign)}
            className={`w-full flex items-start gap-3 px-4 py-4 rounded-xl border-2 text-left text-sm font-bold transition-all ${
              confirmed.includes(sign)
                ? 'bg-[#D32F2F] border-[#D32F2F] text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50'
            }`}>
            <span className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center text-xs font-black mt-0.5 ${
              confirmed.includes(sign) ? 'bg-white border-white text-[#D32F2F]' : 'border-slate-300'
            }`}>
              {confirmed.includes(sign) ? '✓' : ''}
            </span>
            <span className="leading-snug">{sign}</span>
          </button>
        ))}
      </div>

      <button type="button"
        disabled={confirmed.length === 0}
        onClick={() => onComplete({ dangerSigns: confirmed, emergencyOverride: true })}
        className="w-full py-4 bg-[#D32F2F] hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
        🚨 Generate Emergency Referral Now
      </button>
      {confirmed.length === 0 && (
        <p className="text-center text-xs text-[#555555] mt-2">Select at least one danger sign to continue</p>
      )}
    </div>
  );
}
