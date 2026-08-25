import React, { useState } from 'react';
import { YesNo, BPInput, SectionLabel, DangerBanner } from './SharedComponents';

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Heart Disease',
  'Kidney Disease', 'Asthma', 'TB / Tuberculosis', 'Arthritis', 'Stroke (past)',
];

const BLOOD_SUGAR = [
  { id: 'normal', label: '✅ Normal', sub: 'FBS 70–100 mg / RBS below 140 mg' },
  { id: 'high', label: '⚠️ High — Diabetic Concern', sub: 'FBS above 126 / RBS above 200 mg' },
  { id: 'low', label: '🚨 Low — Hypoglycemia Risk', sub: 'Patient feels dizzy, shaky, or confused' },
  { id: 'not_checked', label: '— Not Checked Today', sub: '' },
];

export default function ElderlyScreen({ onComplete }) {
  const [conditions, setConditions] = useState([]);
  const [bp, setBp] = useState('');
  const [bloodSugar, setBloodSugar] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [chestPain, setChestPain] = useState(null);
  const [breathingDifficulty, setBreathingDifficulty] = useState(null);

  const toggleCondition = (c) =>
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const isInstantRed = chestPain === true || breathingDifficulty === true || bloodSugar === 'low';

  return (
    <div>
      <p className="text-2xl mb-1">🧓</p>
      <h3 className="font-extrabold text-xl text-amber-700 mb-1">Elderly / Chronic Disease</h3>
      <p className="text-xs text-[#555555] mb-6">Tap all known conditions, then answer the checks below</p>

      <SectionLabel>Known Conditions (tap all that apply)</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-6">
        {CONDITIONS.map((c) => (
          <button key={c} type="button" onClick={() => toggleCondition(c)}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              conditions.includes(c)
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
            }`}>
            {c}
          </button>
        ))}
      </div>

      <SectionLabel>Today's Danger Signs</SectionLabel>
      <YesNo label="Any chest pain or chest tightness right now?" value={chestPain} onChange={setChestPain} dangerOnYes />
      <YesNo label="Difficulty breathing even at rest?" value={breathingDifficulty} onChange={setBreathingDifficulty} dangerOnYes />
      {isInstantRed && <DangerBanner message="Possible cardiac / respiratory emergency or severe hypoglycemia. Refer immediately." />}

      <SectionLabel>Vitals</SectionLabel>
      <BPInput value={bp} onChange={setBp} focusColor="focus:border-amber-400" />

      <div className="mb-5">
        <p className="font-bold text-sm text-[#212121] mb-2.5">Blood Sugar Level (if checked)</p>
        <div className="space-y-2">
          {BLOOD_SUGAR.map((opt) => (
            <button key={opt.id} type="button" onClick={() => setBloodSugar(opt.id)}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl border-2 text-left text-sm font-bold transition-all ${
                bloodSugar === opt.id
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              <span className="flex-1">{opt.label}</span>
              {opt.sub && <span className="text-xs font-normal ml-2 opacity-70 hidden sm:block">{opt.sub}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="font-bold text-sm text-[#212121] mb-2.5">Main complaint today (describe in your own words)</p>
        <textarea rows={3} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="e.g. Knee pain for a week, can't walk properly..."
          className="w-full border-2 border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
      </div>

      <button type="button" onClick={() => onComplete({ conditions, bp, bloodSugar, chiefComplaint, chestPain, breathingDifficulty })}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-base transition-colors">
        Continue to AI Triage →
      </button>
    </div>
  );
}
