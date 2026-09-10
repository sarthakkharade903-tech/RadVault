import React, { useState } from 'react';
import { YesNo, Stepper, ColorBandSelector, TempInput, SectionLabel, DangerBanner, VitalsContainer, ClinicalVoiceScribe } from './SharedComponents';

const MUAC_OPTIONS = [
  {
    value: 'red',
    label: 'Red Zone — Severe Acute Malnutrition',
    hint: 'Tape reads below 11.5 cm',
    dotClass: 'bg-red-600',
    selectedClass: 'bg-red-50 border-red-400 text-red-800',
  },
  {
    value: 'yellow',
    label: 'Yellow Zone — Moderate Malnutrition',
    hint: 'Tape reads 11.5 to 12.5 cm',
    dotClass: 'bg-yellow-500',
    selectedClass: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  },
  {
    value: 'green',
    label: 'Green Zone — Normal Nutrition',
    hint: 'Tape reads above 12.5 cm',
    dotClass: 'bg-green-600',
    selectedClass: 'bg-green-50 border-green-400 text-green-800',
  },
  {
    value: 'not_measured',
    label: 'MUAC tape not available',
    hint: '',
    dotClass: 'bg-slate-400',
    selectedClass: 'bg-slate-50 border-slate-300 text-slate-600',
  },
];

export default function ChildScreen({ onComplete, initialVoiceNotes = '', initialAudioBlobUrl = null }) {
  const [answers, setAnswers] = useState({
    ageMonths: 12,
    weight: '',
    muac: null,
    temp: null,
    breastfeeding: null,
    convulsions: null,
    lethargic: null,
    cough: null,
    diarrhea: null,
    vaccinationUpToDate: null,
  });
  const [voiceNotes, setVoiceNotes] = useState(initialVoiceNotes);
  const [audioBlobUrl, setAudioBlobUrl] = useState(initialAudioBlobUrl);

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const isInstantRed = answers.convulsions === true || answers.lethargic === true;

  const handleContinue = () => {
    onComplete({
      ...answers,
      voiceNotes,
      audioBlobUrl
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
          👶
        </div>
        <div>
          <h3 className="font-black text-lg text-slate-900">Child Under 5 Intake (IMNCI)</h3>
          <p className="text-xs font-semibold text-slate-500">Screen pediatric danger signs, growth parameters, and nutrition</p>
        </div>
      </div>

      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <SectionLabel>Child's Age</SectionLabel>
        <Stepper label="Age in months" value={answers.ageMonths} onChange={(v) => set('ageMonths', v)} min={0} max={59} unit="months" />
      </div>

      <div className="space-y-3">
        <SectionLabel>Immediate Danger Signs — Check These First</SectionLabel>
        <YesNo label="Any convulsions, seizures, or fits today?" value={answers.convulsions} onChange={(v) => set('convulsions', v)} dangerOnYes />
        <YesNo label="Is the child unusually lethargic, limp, or difficult to wake?" value={answers.lethargic} onChange={(v) => set('lethargic', v)} dangerOnYes />
        {isInstantRed && <DangerBanner>Critical pediatric danger sign detected. EMERGENCY care required immediately.</DangerBanner>}

        <SectionLabel>General Health & Symptoms</SectionLabel>
        <YesNo label="Is the child breastfeeding, drinking, or eating normally?" value={answers.breastfeeding} onChange={(v) => set('breastfeeding', v)} />
        <YesNo label="Cough or fast / difficult chest-drawing breathing?" value={answers.cough} onChange={(v) => set('cough', v)} />
        <YesNo label="Diarrhea persisting for more than 2 days?" value={answers.diarrhea} onChange={(v) => set('diarrhea', v)} />
        <YesNo label="Are routine immunization shots up to date for age?" value={answers.vaccinationUpToDate} onChange={(v) => set('vaccinationUpToDate', v)} />
      </div>

      <VitalsContainer title="Growth & Temperature Vitals">
        <div>
          <label className="font-bold text-sm text-[#212121] block mb-2">Child Weight (kg)</label>
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
            <input
              type="number"
              step="0.1"
              value={answers.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder="e.g. 8.5"
              className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
            />
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
        </div>
        <TempInput value={answers.temp} onChange={(v) => set('temp', v)} />
      </VitalsContainer>

      <div>
        <SectionLabel>MUAC Nutrition Tape Measurement</SectionLabel>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Measure mid-upper left arm circumference and check colored zone.
        </p>
        <ColorBandSelector options={MUAC_OPTIONS} value={answers.muac} onChange={(v) => set('muac', v)} />
      </div>

      {/* Seamless Integrated Voice Scribe */}
      <ClinicalVoiceScribe
        notes={voiceNotes}
        onChangeNotes={setVoiceNotes}
        audioBlobUrl={audioBlobUrl}
        setAudioBlobUrl={setAudioBlobUrl}
        placeholder="Record observations, stool frequency, feeding history, or cough sound..."
      />

      <button
        type="button"
        onClick={handleContinue}
        className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <span>Continue to Triage Review →</span>
      </button>
    </div>
  );
}
