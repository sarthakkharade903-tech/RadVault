import React, { useState } from 'react';
import { BPInput, TempInput, SectionLabel } from './SharedComponents';

const SYMPTOMS = [
  { id: 'fever', label: '🌡️ Fever' },
  { id: 'headache', label: '🤕 Headache' },
  { id: 'chest_pain', label: '💔 Chest Pain' },
  { id: 'cough', label: '😮‍💨 Cough' },
  { id: 'vomiting', label: '🤢 Vomiting' },
  { id: 'diarrhea', label: '💧 Diarrhea' },
  { id: 'weakness', label: '😓 Weakness / Fatigue' },
  { id: 'body_pain', label: '🦴 Body / Joint Pain' },
  { id: 'skin_rash', label: '🔴 Skin Rash' },
  { id: 'breath_difficulty', label: '🫁 Difficulty Breathing' },
  { id: 'jaundice', label: '👁️ Yellow Eyes / Jaundice' },
  { id: 'abdominal_pain', label: '🫃 Stomach Pain' },
];

export default function AdultScreen({ onComplete }) {
  const [selected, setSelected] = useState([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState(null);

  const toggle = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const isHighRisk = selected.includes('chest_pain') || selected.includes('breath_difficulty');

  return (
    <div>
      <p className="text-2xl mb-1">🧑</p>
      <h3 className="font-extrabold text-xl text-[#008080] mb-1">General Adult</h3>
      <p className="text-xs text-[#555555] mb-6">Tap every symptom the patient is experiencing</p>

      <SectionLabel>Symptoms (tap all that apply)</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SYMPTOMS.map((s) => (
          <button key={s.id} type="button" onClick={() => toggle(s.id)}
            className={`px-3 py-3.5 rounded-xl text-sm font-bold border-2 transition-all text-left leading-tight ${
              selected.includes(s.id)
                ? 'bg-[#008080] border-[#008080] text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-[#008080]/30'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {isHighRisk && (
        <div className="p-4 bg-[#D32F2F] text-white rounded-2xl font-bold text-sm mb-5">
          🚨 Chest pain or breathing difficulty — possible emergency. AI will likely flag RED.
        </div>
      )}

      <input type="text" value={otherSymptom} onChange={(e) => setOtherSymptom(e.target.value)}
        placeholder="Any other symptom not listed? (optional)"
        className="w-full border-2 border-dashed border-slate-300 focus:border-[#008080] rounded-xl px-4 py-3 text-sm outline-none mb-6" />

      <SectionLabel>Vitals (if measured)</SectionLabel>
      <BPInput value={bp} onChange={setBp} />
      <TempInput value={temp} onChange={setTemp} />

      <button type="button"
        disabled={selected.length === 0 && !otherSymptom.trim()}
        onClick={() => onComplete({ symptoms: selected, otherSymptom, bp, temp })}
        className="w-full py-4 bg-[#008080] hover:bg-[#006666] disabled:bg-slate-300 text-white font-extrabold rounded-2xl text-base transition-colors mt-2">
        Continue to AI Triage →
      </button>
    </div>
  );
}
