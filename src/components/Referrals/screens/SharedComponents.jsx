import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, AlertTriangle, CheckCircle2, Heart, Activity, Mic, Square, Volume2, Trash2, Globe, Sparkles } from 'lucide-react';

// ─── Section Label ───────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 mt-5 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#008F83]" />
      <span>{children}</span>
    </p>
  );
}

// ─── Vitals Container (Generous Spacing & Visual Rhythm) ─────────────────────
export function VitalsContainer({ children, title = "Clinical Vitals (If measured)" }) {
  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 mb-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#008F83]" />
          <span>{title}</span>
        </h4>
        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
          Field Vitals
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Danger Banner ────────────────────────────────────────────────────────────
export function DangerBanner({ children }) {
  return (
    <div className="p-3.5 bg-red-600 text-white rounded-2xl font-bold text-xs mb-4 flex items-center gap-2 shadow-xs">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ─── Big YES / NO Tap Buttons ─────────────────────────────────────────────────
export function YesNo({ label, value, onChange, dangerOnYes = false }) {
  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5 leading-snug">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onChange(true)}
          className={`py-4 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
            value === true
              ? dangerOnYes ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-xs' : 'bg-[#008F83] border-[#008F83] text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          ✓ Yes
        </button>
        <button type="button" onClick={() => onChange(false)}
          className={`py-4 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
            value === false ? 'bg-slate-700 border-slate-700 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}>
          ✗ No
        </button>
      </div>
    </div>
  );
}

// ─── Number Stepper (Constrained 2-3 digits) ───────────────────────────────────
export function Stepper({ label, value, onChange, min = 0, max = 999, unit = '' }) {
  const currentVal = value !== undefined && value !== null && value !== '' ? Number(value) : min;

  return (
    <div className="mb-5">
      <p className="font-bold text-sm text-[#212121] mb-2.5">{label}</p>
      <div className="flex items-center gap-4 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 shadow-xs">
        <button type="button" onClick={() => onChange(Math.max(min, currentVal - 1))}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer">
          <Minus className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-3xl font-black text-[#008F83]">{currentVal}</span>
          {unit && <span className="text-xs text-slate-500 font-bold ml-1.5">{unit}</span>}
        </div>
        <button type="button" onClick={() => onChange(Math.min(max, currentVal + 1))}
          className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Color Band Selector (Hemoglobin, MUAC) ───────────────────────────────────
export function ColorBandSelector({ label, subtitle, options, value, onChange }) {
  return (
    <div className="mb-5">
      {label && <p className="font-bold text-sm text-[#212121] mb-1">{label}</p>}
      {subtitle && <p className="text-xs text-[#555555] mb-2.5 leading-relaxed">{subtitle}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-bold text-sm transition-all text-left cursor-pointer ${
              value === opt.value ? opt.selectedClass : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            <span className={`w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-sm ${opt.dotClass}`} />
            <div className="flex-1">
              <span className="block">{opt.label}</span>
              {opt.hint && <span className="block text-xs font-normal opacity-75 mt-0.5">{opt.hint}</span>}
            </div>
            {value === opt.value && <span className="ml-auto font-black">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Blood Pressure Input (Strict 2-3 Digits with High/Normal/Low Badge) ──────
export function BPInput({ value = '', onChange }) {
  const parts = String(value).split('/');
  const sys = parts[0] || '';
  const dia = parts[1] || '';

  const handleSysChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
    onChange(dia ? `${digitsOnly}/${dia}` : digitsOnly);
  };

  const handleDiaChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
    onChange(sys ? `${sys}/${digitsOnly}` : `/${digitsOnly}`);
  };

  const sysNum = parseInt(sys, 10);
  const diaNum = parseInt(dia, 10);

  let bpStatus = null;
  if (!isNaN(sysNum) && !isNaN(diaNum) && sysNum > 0 && diaNum > 0) {
    if (sysNum >= 140 || diaNum >= 90) {
      bpStatus = { text: 'HIGH BP', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (sysNum < 90 || diaNum < 60) {
      bpStatus = { text: 'LOW BP', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      bpStatus = { text: 'NORMAL BP', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Blood Pressure (mmHg)</label>
        {bpStatus && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${bpStatus.color}`}>
            {bpStatus.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border-2 border-slate-200">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">SYS (Max 3 digits)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={sys}
            onChange={handleSysChange}
            placeholder="120"
            className="w-full text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300"
          />
        </div>
        <span className="text-2xl font-black text-slate-300">/</span>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">DIA (Max 3 digits)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={dia}
            onChange={handleDiaChange}
            placeholder="80"
            className="w-full text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Blood Sugar Input (Strict 2-3 Digits with High/Normal/Low Badge) ─────────
export function SugarInput({ value = '', onChange }) {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 3);
  const num = parseInt(digitsOnly, 10);

  let sugarStatus = null;
  if (!isNaN(num) && num > 0) {
    if (num > 140) {
      sugarStatus = { text: 'HIGH SUGAR (>140)', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (num < 70) {
      sugarStatus = { text: 'LOW SUGAR (<70)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      sugarStatus = { text: 'NORMAL (70-140)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Blood Sugar (mg/dL)</label>
        {sugarStatus && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${sugarStatus.color}`}>
            {sugarStatus.text}
          </span>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={digitsOnly}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 110"
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400">mg/dL</span>
      </div>
    </div>
  );
}

// ─── Pulse / Heart Rate Input (Strict 2-3 Digits) ─────────────────────────────
export function PulseInput({ value = '', onChange }) {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 3);
  const num = parseInt(digitsOnly, 10);

  let pulseStatus = null;
  if (!isNaN(num) && num > 0) {
    if (num > 100) {
      pulseStatus = { text: 'FAST PULSE (>100)', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (num < 60) {
      pulseStatus = { text: 'SLOW PULSE (<60)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      pulseStatus = { text: 'NORMAL (60-100)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Pulse / Heart Rate (bpm)</label>
        {pulseStatus && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${pulseStatus.color}`}>
            {pulseStatus.text}
          </span>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={digitsOnly}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 72"
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400">bpm</span>
      </div>
    </div>
  );
}

// ─── SpO2 Oxygen Saturation Input (Strict 2-3 Digits) ─────────────────────────
export function SpO2Input({ value = '', onChange }) {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 3);
  const num = parseInt(digitsOnly, 10);

  let spo2Status = null;
  if (!isNaN(num) && num > 0) {
    if (num < 90) {
      spo2Status = { text: 'CRITICAL LOW (<90%)', color: 'bg-red-600 text-white' };
    } else if (num < 95) {
      spo2Status = { text: 'LOW OXYGEN (90-94%)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      spo2Status = { text: 'NORMAL (95-100%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Oxygen Level - SpO₂ (%)</label>
        {spo2Status && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${spo2Status.color}`}>
            {spo2Status.text}
          </span>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={digitsOnly}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 98"
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400">%</span>
      </div>
    </div>
  );
}

// ─── Temperature Selector ─────────────────────────────────────────────────────
export function TempInput({ value, onChange }) {
  const isNumeric = value && !isNaN(parseFloat(value));
  const isNormal = value === '98.4' || value === 'No Fever' || (isNumeric && parseFloat(value) < 100);
  const isFever = value === '101.2' || value === 'Fever' || (isNumeric && parseFloat(value) >= 100);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm text-[#212121]">Body Temperature (°F)</label>
        {value && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
            isFever ? 'bg-red-100 text-red-800 border-red-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}>
            {isFever ? 'FEVER (>=100°F)' : 'NORMAL (<100°F)'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          type="button"
          onClick={() => onChange('98.4')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition-all cursor-pointer ${
            isNormal && value
              ? 'bg-[#008F83] border-[#008F83] text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          🟢 Normal (98.4°F)
        </button>
        <button
          type="button"
          onClick={() => onChange('101.2')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition-all cursor-pointer ${
            isFever
              ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          🔥 Fever (101.2°F)
        </button>
      </div>

      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
        <input
          type="text"
          inputMode="decimal"
          value={isNumeric ? value : ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, '').slice(0, 5);
            onChange(val);
          }}
          placeholder="Or type exact °F (e.g. 99.2)"
          className="text-xs font-bold text-slate-900 focus:outline-none placeholder-slate-400 w-full"
        />
        <span className="text-xs font-bold text-slate-400 shrink-0">°F</span>
      </div>
    </div>
  );
}

// ─── Patient / Child Weight Input (No Spinners, Smooth Fast Typing) ───────────
export function WeightInput({ value = '', onChange, label = 'Patient Weight (kg)', placeholder = 'e.g. 58' }) {
  const handleWeightChange = (e) => {
    let raw = e.target.value;
    // Allow only digits and at most one decimal point
    raw = raw.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) {
      raw = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 5 chars max (e.g. "120.5" or "90")
    if (raw.length > 5) {
      raw = raw.slice(0, 5);
    }
    onChange(raw);
  };

  return (
    <div>
      <label className="font-bold text-sm text-[#212121] block mb-2">{label}</label>
      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between focus-within:border-[#008F83] transition-colors">
        <input
          type="text"
          inputMode="decimal"
          value={value ?? ''}
          onChange={handleWeightChange}
          placeholder={placeholder}
          className="text-lg font-black text-slate-900 focus:outline-none placeholder-slate-300 w-full"
        />
        <span className="text-xs font-bold text-slate-400 select-none">kg</span>
      </div>
    </div>
  );
}


// ─── Integrated Clinical Voice Scribe (Marathi / Hindi / English) ─────────────
export function ClinicalVoiceScribe({
  notes = '',
  onChangeNotes,
  audioBlobUrl,
  setAudioBlobUrl,
  title = 'Clinical Notes & Voice Scribe',
  placeholder = 'Type patient complaints or tap the mic to speak in Marathi, Hindi, or English...'
}) {
  const defaultLang = localStorage.getItem('radvault_asha_lang') || 'en';
  const [speechLang, setSpeechLang] = useState(
    defaultLang === 'mr' ? 'mr-IN' : defaultLang === 'hi' ? 'hi-IN' : 'en-IN'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  // Multi-tier speech accumulators to ensure zero word loss across pauses:
  // baseNotesRef: text present in the textarea before current recording session started
  const baseNotesRef = useRef('');
  // sessionFinalTextRef: all finalized chunks from previous speech-recognition cycles in this session
  const sessionFinalTextRef = useRef('');
  // currentRunFinalRef: finalized chunks from the currently running speech-recognition instance
  const currentRunFinalRef = useRef('');

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Helper to construct a clean SpeechRecognition instance
  const initSpeechRecognition = (lang) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      let currentRunFinal = '';
      let currentRunInterim = '';

      for (let i = 0; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          currentRunFinal += piece + ' ';
        } else {
          currentRunInterim += piece + ' ';
        }
      }

      currentRunFinalRef.current = currentRunFinal;

      const finalizedSoFar = [sessionFinalTextRef.current, currentRunFinal]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const combined = [
        baseNotesRef.current,
        finalizedSoFar,
        currentRunInterim.trim()
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (onChangeNotes && combined) {
        onChangeNotes(combined);
      }
    };

    recognition.onerror = (err) => {
      // Benign pause/silence events in Web Speech API
      if (err.error === 'no-speech' || err.error === 'aborted') {
        return;
      }
      console.warn('[ClinicalVoiceScribe] Speech recognition notice:', err.error);
    };

    recognition.onend = () => {
      // Commit finalized text from this run so far into the session accumulator
      if (currentRunFinalRef.current) {
        sessionFinalTextRef.current = [sessionFinalTextRef.current, currentRunFinalRef.current]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        currentRunFinalRef.current = '';
      }

      // If user is still recording, seamlessly restart (auto-reconnect on silence timeout)
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (_) {
          // Ignore if already starting or active
        }
      }
    };

    return recognition;
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (setAudioBlobUrl) setAudioBlobUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      // Initialize text state for this session
      baseNotesRef.current = notes ? notes.trim() : '';
      sessionFinalTextRef.current = '';
      currentRunFinalRef.current = '';
      isRecordingRef.current = true;

      // Start Web Speech Recognition
      const recognition = initSpeechRecognition(speechLang);
      if (recognition) {
        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[ClinicalVoiceScribe] Mic access failed:', err);
      alert('Microphone access is required for voice scribe. Please grant permission in your browser.');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Detach onend before stopping to avoid auto-restart
        recognitionRef.current.stop();
      } catch (_) {}
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  const handleLanguageChange = (newLang) => {
    setSpeechLang(newLang);
    // If actively recording, switch language on-the-fly without losing text
    if (isRecordingRef.current && recognitionRef.current) {
      try {
        if (currentRunFinalRef.current) {
          sessionFinalTextRef.current = [sessionFinalTextRef.current, currentRunFinalRef.current]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          currentRunFinalRef.current = '';
        }
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();

        const newRec = initSpeechRecognition(newLang);
        if (newRec) {
          newRec.start();
          recognitionRef.current = newRec;
        }
      } catch (err) {
        console.warn('[ClinicalVoiceScribe] Language hot-reload notice:', err);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 mb-6 shadow-2xs">
      {/* Scribe Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                Live Speech-to-Text
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">Record frontline observations in your preferred language</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Globe className="w-3.5 h-3.5 text-indigo-700" />
          <select
            value={speechLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-xs font-bold bg-white text-indigo-950 border border-indigo-200 rounded-xl px-2.5 py-1.5 shadow-2xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="mr-IN">मराठी (Marathi)</option>
            <option value="hi-IN">हिंदी (Hindi)</option>
            <option value="en-IN">English (India)</option>
          </select>
        </div>
      </div>

      {/* Mic Record Trigger Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-indigo-100">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Start Voice Recording</span>
          </button>
        ) : (
          <div className="w-full sm:w-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
              <span className="font-mono font-black text-rose-700 text-xs">
                Recording... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop & Save Voice Note</span>
            </button>
          </div>
        )}

        <span className="text-[11px] text-slate-500 font-medium text-center sm:text-right">
          {isRecording ? 'Listening and transcribing...' : 'Tap mic and speak, or type notes below'}
        </span>
      </div>

      {/* Audio Memo Playback Chip */}
      {audioBlobUrl && (
        <div className="bg-white p-2.5 rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <audio controls src={audioBlobUrl} className="w-full h-7" />
          </div>
          {setAudioBlobUrl && (
            <button
              type="button"
              onClick={() => setAudioBlobUrl(null)}
              title="Delete audio memo"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Textarea for Transcription & Editing */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
          Clinical Notes / Symptoms Transcript
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onChangeNotes && onChangeNotes(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-2xs leading-relaxed transition-colors resize-none"
        />
      </div>
    </div>
  );
}
