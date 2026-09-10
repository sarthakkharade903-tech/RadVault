import React, { useState } from 'react';
import { YesNo, Stepper, ColorBandSelector, BPInput, SectionLabel, DangerBanner, VitalsContainer, ClinicalVoiceScribe } from './SharedComponents';

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

export default function PregnantScreen({ onComplete, initialVoiceNotes = '', initialAudioBlobUrl = null }) {
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
  const [voiceNotes, setVoiceNotes] = useState(initialVoiceNotes);
  const [audioBlobUrl, setAudioBlobUrl] = useState(initialAudioBlobUrl);

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const isInstantRed = answers.bleeding === true;
  const isHighRisk = answers.headacheVision === true || answers.swelling === true;

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
        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
          🤰
        </div>
        <div>
          <h3 className="font-black text-lg text-slate-900">Maternal & ANC Intake</h3>
          <p className="text-xs font-semibold text-slate-500">Antenatal screening, danger sign assessment, and vitals</p>
        </div>
      </div>

      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <SectionLabel>Pregnancy Details</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Stepper label="Month of Pregnancy" value={answers.monthOfPregnancy} onChange={(v) => set('monthOfPregnancy', v)} min={1} max={9} unit="months" />
          <Stepper label="Previous Deliveries" value={answers.previousDeliveries} onChange={(v) => set('previousDeliveries', v)} min={0} max={15} unit="deliveries" />
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Danger Signs — Check These First</SectionLabel>
        <YesNo label="Is there any vaginal bleeding today?" value={answers.bleeding} onChange={(v) => set('bleeding', v)} dangerOnYes />
        {isInstantRed && <DangerBanner>Active bleeding in pregnancy is an OBSTETRIC EMERGENCY. Immediate referral required.</DangerBanner>}

        <YesNo label="Severe headache or blurred vision?" value={answers.headacheVision} onChange={(v) => set('headacheVision', v)} dangerOnYes />
        <YesNo label="Swelling in hands, face, or feet?" value={answers.swelling} onChange={(v) => set('swelling', v)} />
        {isHighRisk && !isInstantRed && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold mb-4 flex items-center gap-2">
            <span>⚠️</span>
            <span>These symptoms may indicate Pre-eclampsia or gestational hypertension. Urgent referral required.</span>
          </div>
        )}
        <YesNo label="Has she felt baby move in the last 24 hours?" value={answers.babyMovement} onChange={(v) => set('babyMovement', v)} />
      </div>

      <VitalsContainer title="ANC Clinical Measurements">
        <BPInput value={answers.bp} onChange={(v) => set('bp', v)} />
        <div>
          <label className="font-bold text-sm text-[#212121] block mb-2">Patient Weight (kg)</label>
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
            <input
              type="number"
              value={answers.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder="e.g. 58"
              className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
            />
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
        </div>
      </VitalsContainer>

      <div>
        <SectionLabel>Hemoglobin — Nail & Eyelid Color Test</SectionLabel>
        <ColorBandSelector
          subtitle="Press the fingernail down and release. Check the color of the lower inside eyelid."
          options={HEMOGLOBIN_OPTIONS}
          value={answers.hemoglobin}
          onChange={(v) => set('hemoglobin', v)}
        />
      </div>

      {/* Seamless Integrated Voice Scribe */}
      <ClinicalVoiceScribe
        notes={voiceNotes}
        onChangeNotes={setVoiceNotes}
        audioBlobUrl={audioBlobUrl}
        setAudioBlobUrl={setAudioBlobUrl}
        placeholder="Record any pregnancy complications, LMP details, or observations..."
      />

      <button
        type="button"
        onClick={handleContinue}
        className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl text-sm sm:text-base shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <span>Continue to Triage Review →</span>
      </button>
    </div>
  );
}
