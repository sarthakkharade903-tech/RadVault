import React, { useState } from 'react';
import { YesNo, Stepper, ColorBandSelector, BPInput, SectionLabel, DangerBanner } from './SharedComponents';

const HEMOGLOBIN_OPTIONS = [
  {
    value: 'severe',
    label: 'Severe Anemia',
    hint: 'Nails, eyelids, tongue look very white or pale — No pink at all',
    dotClass: 'bg-red-600',
    selectedClass: 'bg-red-50 border-red-400 text-red-800',
  },
  {
    value: 'mild',
    label: 'Mild Anemia',
    hint: 'Slightly pale. Some pink visible in nails and eyelids',
    dotClass: 'bg-yellow-500',
    selectedClass: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  },
  {
    value: 'normal',
    label: 'Normal',
    hint: 'Nails and eyelids have good pink color',
    dotClass: 'bg-green-600',
    selectedClass: 'bg-green-50 border-green-400 text-green-800',
  },
];

export default function PregnantScreen({ onComplete }) {
  const [answers, setAnswers] = useState({
    monthOfPregnancy: 4,
    previousDeliveries: 0,
    bp: '',
    weight: '',
    hemoglobin: null,
    bleeding: null,
    swelling: null,
    babyMovement: null,
    headacheVision: null,
  });

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const isInstantRed = answers.bleeding === true;
  const isHighRisk = answers.headacheVision === true || answers.swelling === true;

  return (
    <div>
      <p className="text-2xl mb-1">🤰</p>
      <h3 className="font-extrabold text-xl text-pink-700 mb-1">Pregnant Woman</h3>
      <p className="text-xs text-[#555555] mb-6">ANC Screening — Follow the questions in order</p>

      <SectionLabel>Pregnancy Details</SectionLabel>
      <Stepper label="Month of Pregnancy" value={answers.monthOfPregnancy} onChange={(v) => set('monthOfPregnancy', v)} min={1} max={9} unit="months" />
      <Stepper label="Number of Previous Deliveries" value={answers.previousDeliveries} onChange={(v) => set('previousDeliveries', v)} min={0} max={15} unit="deliveries" />

      <SectionLabel>Danger Signs — Check These First</SectionLabel>
      <YesNo label="Is there any vaginal bleeding today?" value={answers.bleeding} onChange={(v) => set('bleeding', v)} dangerOnYes />
      {isInstantRed && <DangerBanner message="Active bleeding in pregnancy is a medical emergency. Refer immediately — do not delay." />}

      <YesNo label="Severe headache or blurred vision?" value={answers.headacheVision} onChange={(v) => set('headacheVision', v)} dangerOnYes />
      <YesNo label="Swelling in hands, face, or feet?" value={answers.swelling} onChange={(v) => set('swelling', v)} />
      {isHighRisk && !isInstantRed && (
        <div className="p-3 bg-[#FFF5EB] border border-[#FF9933]/40 rounded-xl text-xs text-[#b35900] font-bold mb-5">
          ⚠️ These signs may indicate Pre-eclampsia. Urgent referral may be needed.
        </div>
      )}
      <YesNo label="Has she felt baby move in the last 24 hours?" value={answers.babyMovement} onChange={(v) => set('babyMovement', v)} />

      <SectionLabel>Measurements</SectionLabel>
      <BPInput value={answers.bp} onChange={(v) => set('bp', v)} focusColor="focus:border-pink-400" />
      <div className="mb-5">
        <p className="font-bold text-sm text-[#212121] mb-2.5">Weight (kg)</p>
        <input type="number" value={answers.weight} onChange={(e) => set('weight', e.target.value)}
          placeholder="e.g. 58"
          className="w-full border-2 border-slate-200 focus:border-pink-400 rounded-xl px-4 py-3.5 text-base outline-none font-bold" />
      </div>

      <SectionLabel>Hemoglobin — Nail & Eyelid Color Test</SectionLabel>
      <ColorBandSelector
        subtitle="Press the fingernail down and release. Check the color of the lower inside eyelid."
        options={HEMOGLOBIN_OPTIONS}
        value={answers.hemoglobin}
        onChange={(v) => set('hemoglobin', v)}
      />

      <button type="button" onClick={() => onComplete(answers)}
        className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold rounded-2xl text-base transition-colors mt-2">
        Continue to AI Triage →
      </button>
    </div>
  );
}
