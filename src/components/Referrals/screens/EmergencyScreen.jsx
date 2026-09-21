import React, { useState } from 'react';
import { ClinicalVoiceScribe } from './SharedComponents';
import { AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

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

export default function EmergencyScreen({ onComplete, initialVoiceNotes = '', initialAudioBlobUrl = null }) {
  const [confirmed, setConfirmed] = useState([]);
  const [voiceNotes, setVoiceNotes] = useState(initialVoiceNotes);
  const [audioBlobUrl, setAudioBlobUrl] = useState(initialAudioBlobUrl);

  const toggle = (sign) =>
    setConfirmed((prev) => prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]);

  const handleContinue = () => {
    onComplete({
      dangerSigns: confirmed,
      emergencyOverride: true,
      voiceNotes,
      audioBlobUrl
    });
  };

  return (
    <div className="space-y-5">
      {/* Emergency Header */}
      <div className="p-4.5 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-base sm:text-lg text-rose-950">Emergency Fast-Track Intake</h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
              RED Critical
            </span>
          </div>
          <p className="text-xs font-semibold text-rose-800/90 mt-1 leading-relaxed">
            Select any immediate danger signs present. This automatically assigns RED priority and prepares an emergency hospital dispatch route.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
          Signs Present in Patient (Tap all that apply):
        </label>
        <div className="space-y-2.5 mb-5">
          {DANGER_SIGNS.map((sign) => {
            const isChecked = confirmed.includes(sign);
            return (
              <button
                key={sign}
                type="button"
                onClick={() => toggle(sign)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs ${
                  isChecked
                    ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/30'
                }`}
              >
                <div className={`w-5 h-5 shrink-0 rounded-lg border-2 flex items-center justify-center text-xs font-black mt-0.5 transition-colors ${
                  isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {isChecked ? '✓' : ''}
                </div>
                <span className="leading-snug flex-1">{sign}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seamless Integrated Voice Scribe */}
      <ClinicalVoiceScribe
        notes={voiceNotes}
        onChangeNotes={setVoiceNotes}
        audioBlobUrl={audioBlobUrl}
        setAudioBlobUrl={setAudioBlobUrl}
        title="Emergency Audio Memo & Observations"
        placeholder="Record any acute trauma details, time of onset, or immediate first-aid administered..."
      />

      <button
        type="button"
        disabled={confirmed.length === 0 && !voiceNotes.trim()}
        onClick={handleContinue}
        className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl text-sm sm:text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <ShieldAlert className="w-5 h-5" />
        <span>Proceed to Emergency Triage Review →</span>
      </button>

      {confirmed.length === 0 && !voiceNotes.trim() && (
        <p className="text-center text-xs font-semibold text-slate-400">
          Select at least one danger sign or record voice notes to continue
        </p>
      )}
    </div>
  );
}
