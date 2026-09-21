import React, { useState } from 'react';
import { YesNo, BPInput, SectionLabel, DangerBanner, VitalsContainer, ClinicalVoiceScribe } from './SharedComponents';

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

export default function ElderlyScreen({ onComplete, initialVoiceNotes = '', initialAudioBlobUrl = null }) {
  const [conditions, setConditions] = useState([]);
  const [bp, setBp] = useState('');
  const [bloodSugar, setBloodSugar] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [chestPain, setChestPain] = useState(null);
  const [breathingDifficulty, setBreathingDifficulty] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState(initialVoiceNotes);
  const [audioBlobUrl, setAudioBlobUrl] = useState(initialAudioBlobUrl);

  const toggleCondition = (c) =>
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const isInstantRed = chestPain === true || breathingDifficulty === true || bloodSugar === 'low';

  const handleContinue = () => {
    onComplete({
      conditions,
      bp,
      bloodSugar,
      chiefComplaint,
      chestPain,
      breathingDifficulty,
      voiceNotes,
      audioBlobUrl
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
          🧓
        </div>
        <div>
          <h3 className="font-black text-lg text-slate-900">Elderly & Chronic Intake</h3>
          <p className="text-xs font-semibold text-slate-500">Screen non-communicable disease risks, cardio-respiratory signs, and vitals</p>
        </div>
      </div>

      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <SectionLabel>Known Chronic Conditions (Tap all that apply)</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCondition(c)}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                conditions.includes(c)
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Today's Danger Signs</SectionLabel>
        <YesNo label="Any chest pain, chest pressure, or radiating shoulder pain?" value={chestPain} onChange={setChestPain} dangerOnYes />
        <YesNo label="Difficulty breathing, wheezing, or breathlessness at rest?" value={breathingDifficulty} onChange={setBreathingDifficulty} dangerOnYes />
        {isInstantRed && <DangerBanner>Suspected cardiac, severe respiratory distress, or acute hypoglycemia. Emergency care required.</DangerBanner>}
      </div>

      <VitalsContainer title="Chronic Disease Measurements">
        <BPInput value={bp} onChange={setBp} />
        <div>
          <label className="font-bold text-sm text-[#212121] block mb-2">Blood Sugar Level</label>
          <div className="space-y-2">
            {BLOOD_SUGAR.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBloodSugar(opt.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl border-2 text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  bloodSugar === opt.id
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="flex-1">{opt.label}</span>
                {opt.sub && <span className="text-[11px] font-normal text-slate-500 hidden sm:block">{opt.sub}</span>}
              </button>
            ))}
          </div>
        </div>
      </VitalsContainer>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
          Chief Complaint / Primary Discomfort
        </label>
        <input
          type="text"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="e.g. Knee swelling, unable to walk, persistent dizziness..."
          className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none shadow-2xs transition-colors"
        />
      </div>

      {/* Seamless Integrated Voice Scribe */}
      <ClinicalVoiceScribe
        notes={voiceNotes}
        onChangeNotes={setVoiceNotes}
        audioBlobUrl={audioBlobUrl}
        setAudioBlobUrl={setAudioBlobUrl}
        placeholder="Record observations, medication adherence, or elderly patient mobility..."
      />

      <button
        type="button"
        onClick={handleContinue}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <span>Continue to Triage Review →</span>
      </button>
    </div>
  );
}
