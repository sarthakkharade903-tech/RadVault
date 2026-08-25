import React, { useState } from 'react';
import { YesNo, Stepper, ColorBandSelector, TempInput, SectionLabel, DangerBanner } from './SharedComponents';

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

export default function ChildScreen({ onComplete }) {
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

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const isInstantRed = answers.convulsions === true || answers.lethargic === true;

  return (
    <div>
      <p className="text-2xl mb-1">👶</p>
      <h3 className="font-extrabold text-xl text-sky-700 mb-1">Child Under 5</h3>
      <p className="text-xs text-[#555555] mb-6">IMNCI Screening — Check danger signs first</p>

      <SectionLabel>Child's Age</SectionLabel>
      <Stepper label="Age in months" value={answers.ageMonths} onChange={(v) => set('ageMonths', v)} min={0} max={59} unit="months" />

      <SectionLabel>Immediate Danger Signs — Check These First</SectionLabel>
      <YesNo label="Any convulsions or fits today?" value={answers.convulsions} onChange={(v) => set('convulsions', v)} dangerOnYes />
      <YesNo label="Is the child unusually sleepy, stiff, or impossible to wake?" value={answers.lethargic} onChange={(v) => set('lethargic', v)} dangerOnYes />
      {isInstantRed && <DangerBanner message="Danger sign detected. This child needs EMERGENCY care right now. Refer immediately." />}

      <SectionLabel>General Health Check</SectionLabel>
      <YesNo label="Is the child breastfeeding or drinking/eating normally?" value={answers.breastfeeding} onChange={(v) => set('breastfeeding', v)} />
      <YesNo label="Cough or fast/difficult breathing?" value={answers.cough} onChange={(v) => set('cough', v)} />
      <YesNo label="Diarrhea for more than 2 days?" value={answers.diarrhea} onChange={(v) => set('diarrhea', v)} />
      <YesNo label="Are vaccinations up to date for the child's age?" value={answers.vaccinationUpToDate} onChange={(v) => set('vaccinationUpToDate', v)} />

      <SectionLabel>Measurements</SectionLabel>
      <div className="mb-5">
        <p className="font-bold text-sm text-[#212121] mb-2.5">Weight (kg)</p>
        <input type="number" step="0.1" value={answers.weight} onChange={(e) => set('weight', e.target.value)}
          placeholder="e.g. 8.5"
          className="w-full border-2 border-slate-200 focus:border-sky-400 rounded-xl px-4 py-3.5 text-base outline-none font-bold" />
      </div>
      <TempInput value={answers.temp} onChange={(v) => set('temp', v)} />

      <SectionLabel>MUAC — Mid Upper Arm Circumference</SectionLabel>
      <p className="text-xs text-[#555555] mb-3 leading-relaxed">
        Measure the left arm halfway between the shoulder and elbow. Use the MUAC tape and read the color it falls in.
      </p>
      <ColorBandSelector options={MUAC_OPTIONS} value={answers.muac} onChange={(v) => set('muac', v)} />

      <button type="button" onClick={() => onComplete(answers)}
        className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-base transition-colors mt-2">
        Continue to AI Triage →
      </button>
    </div>
  );
}
