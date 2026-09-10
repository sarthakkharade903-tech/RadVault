import React, { useState } from 'react';
import { BPInput, PulseInput, SpO2Input, TempInput, SectionLabel, VitalsContainer, ClinicalVoiceScribe } from './SharedComponents';

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

export default function AdultScreen({ onComplete, initialVoiceNotes = '', initialAudioBlobUrl = null }) {
  const [selected, setSelected] = useState([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  const [voiceNotes, setVoiceNotes] = useState(initialVoiceNotes);
  const [audioBlobUrl, setAudioBlobUrl] = useState(initialAudioBlobUrl);

  const toggle = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const isHighRisk = selected.includes('chest_pain') || selected.includes('breath_difficulty');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#008F83] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
          🧑
        </div>
        <div>
          <h3 className="font-black text-lg text-slate-900">General Adult Intake</h3>
          <p className="text-xs font-semibold text-slate-500">Tap observed symptoms, record vitals, and add voice notes</p>
        </div>
      </div>

      <div>
        <SectionLabel>Symptoms Observed (Tap all that apply)</SectionLabel>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {SYMPTOMS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all text-left leading-snug cursor-pointer shadow-2xs hover:shadow-xs ${
                selected.includes(s.id)
                  ? 'bg-[#008F83] border-[#008F83] text-white shadow-xs scale-[1.01]'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#008F83]/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isHighRisk && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl font-bold text-xs sm:text-sm mb-4 flex items-center gap-2.5">
            <span className="text-xl">🚨</span>
            <span>Chest pain or breathing difficulty detected. Emergency triage priority will be recommended.</span>
          </div>
        )}

        <input
          type="text"
          value={otherSymptom}
          onChange={(e) => setOtherSymptom(e.target.value)}
          placeholder="Any other complaint or symptom not listed above? (optional)"
          className="w-full bg-white border border-slate-200 focus:border-[#008F83] rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none shadow-2xs transition-colors"
        />
      </div>

      {/* Clinical Vitals Section with generous spacing */}
      <VitalsContainer title="Clinical Vitals (If measured by ASHA)">
        <BPInput value={bp} onChange={setBp} />
        <PulseInput value={pulse} onChange={setPulse} />
        <SpO2Input value={spo2} onChange={setSpo2} />
        <TempInput value={temp} onChange={setTemp} />
      </VitalsContainer>

      {/* Seamless Integrated Voice Scribe */}
      <ClinicalVoiceScribe
        notes={voiceNotes}
        onChangeNotes={setVoiceNotes}
        audioBlobUrl={audioBlobUrl}
        setAudioBlobUrl={setAudioBlobUrl}
      />

      {/* Primary Action Button */}
      <button
        type="button"
        disabled={selected.length === 0 && !otherSymptom.trim() && !voiceNotes.trim()}
        onClick={() => onComplete({ symptoms: selected, otherSymptom, bp, temp, pulse, spo2, voiceNotes, audioBlobUrl })}
        className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <span>Continue to Triage Review →</span>
      </button>
    </div>
  );
}
