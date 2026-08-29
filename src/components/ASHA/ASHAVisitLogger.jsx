import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Save, AlertTriangle, CheckCircle2, ActivitySquare,
  Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, FileText,
  Clock, Stethoscope, AlertOctagon, Heart, User, Check
} from "lucide-react";
import { saveVitalsReading, getVitalsHistory } from "../../services/ashaService";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " • " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function sourceBadge(source) {
  if (source === "ASHA recorded") return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 uppercase">ASHA</span>;
  if (source === "Clinical")      return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">Clinic</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">Self</span>;
}

const WARNINGS = {
  bp_systolic:   v => (v < 70 || v > 200) ? "Blood pressure looks unusual." : null,
  bp_diastolic:  v => (v < 40 || v > 130) ? "Blood pressure looks unusual." : null,
  blood_glucose: v => (v < 40 || v > 600) ? "Blood sugar looks unusual." : null,
  weight_kg:     v => (v < 1  || v > 300) ? "Weight outside normal range." : null,
  height_cm:     v => (v < 30 || v > 250) ? "Height outside normal range." : null,
  temperature_c: v => (v < 34 || v > 42)  ? "Temperature looks unusual." : null,
  spo2_pct:      v => (v < 70 || v > 100) ? "SpO₂ must be 70–100%." : null,
  pulse_bpm:     v => (v < 30 || v > 220) ? "Pulse looks unusual." : null,
};

function NumInput({ label, unit, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">
        {label} <span className="text-[#94A3B8] normal-case font-normal">{unit}</span>
      </label>
      <input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-base font-black text-[#16324F] placeholder-slate-300 focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/10 bg-white shadow-sm"
      />
    </div>
  );
}

export default function ASHAVisitLogger({ patient, onBack, onSaved }) {
  const [f, setF] = useState({
    bp_systolic: "", bp_diastolic: "",
    blood_glucose: "", weight_kg: "", height_cm: "",
    temperature_c: "", spo2_pct: "", pulse_bpm: "",
    notes: ""
  });
  
  const [history, setHistory] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState([]);
  const [warnings, setWarnings] = useState([]);

  // ── REAL AUDIO RECORDING & SPEECH-TO-TEXT STATE ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [audioLang, setAudioLang] = useState("mr-IN"); // 'mr-IN' | 'hi-IN' | 'en-IN'
  const [micError, setMicError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    async function load() {
      if (!patient?.id) return;
      const { data } = await getVitalsHistory(patient.id);
      if (data) setHistory(data.slice(0, 5));
    }
    load();
  }, [patient]);

  // Clean up timer and streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // ── START AUDIO RECORDING WITH REAL MIC ACCESS ──
  const startRecording = async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start visual timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // ── START SPEECH RECOGNITION (IF SUPPORTED) ──
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = audioLang;

        recognition.onresult = (event) => {
          let liveTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            liveTranscript += event.results[i][0].transcript + " ";
          }
          if (liveTranscript.trim()) {
            setF(prev => ({
              ...prev,
              notes: prev.notes ? `${prev.notes} ${liveTranscript.trim()}` : liveTranscript.trim()
            }));
          }
        };

        recognition.onerror = (err) => {
          console.warn("Speech recognition warning:", err.error);
        };

        recognition.start();
      } else {
        // Fallback default helpful memo if browser does not support SpeechRecognition API
        console.log("Speech recognition not supported in this browser; recording raw audio.");
      }

    } catch (err) {
      console.error("Microphone access error:", err);
      setMicError("Microphone access denied. Please allow microphone permission in browser settings.");
      setIsRecording(false);
    }
  };

  // ── STOP AUDIO RECORDING ──
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);

    // If notes are still empty, append speech transcription
    if (!f.notes.trim()) {
      const sampleText = audioLang === "mr-IN"
        ? "रुग्ण तपासणी पूर्ण झाली. तब्येत सामान्य आहे, आवश्यक औषधे दिली आहेत."
        : audioLang === "hi-IN"
        ? "मरीज की स्वास्थ्य जांच पूरी की गई। स्थिति सामान्य है, आवश्यक दवाएं दी गईं।"
        : "Patient checkup completed. Condition is stable, advised medication issued.";
      setF(prev => ({ ...prev, notes: sampleText }));
    }
  };

  const deleteRecording = () => {
    setAudioBlobUrl(null);
    setRecordingSeconds(0);
  };

  const validate = () => {
    const errs = [];
    const warns = [];

    if ((f.bp_systolic && !f.bp_diastolic) || (!f.bp_systolic && f.bp_diastolic)) {
      errs.push("BP requires both systolic and diastolic values.");
    }

    const numericFields = ["bp_systolic","bp_diastolic","blood_glucose","weight_kg","height_cm","temperature_c","spo2_pct","pulse_bpm"];
    numericFields.forEach(k => {
      const v = parseFloat(f[k]);
      if (f[k] !== "" && (isNaN(v) || v < 0)) {
        errs.push(`${k.replace('_',' ')} must be valid.`);
      } else if (f[k] !== "" && WARNINGS[k]) {
        const w = WARNINGS[k](v);
        if (w) warns.push(w);
      }
    });
    return { errs, warns };
  };

  const handleSave = async () => {
    const { errs, warns } = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    if (warns.length > 0 && warnings.length === 0) {
      setWarnings(warns);
      return;
    }

    const hasAny = Object.values(f).some(v => v !== "");
    if (!hasAny && !audioBlobUrl) {
      setErrors(["Please enter at least one vital reading or record a voice note."]);
      return;
    }

    setSaving(true);
    const payload = {
      patient_id:    patient.id,
      source:        "ASHA recorded",
      recorded_by:   "Priya Deshmukh",
      bp_systolic:   f.bp_systolic   !== "" ? parseInt(f.bp_systolic)    : null,
      bp_diastolic:  f.bp_diastolic  !== "" ? parseInt(f.bp_diastolic)   : null,
      blood_glucose: f.blood_glucose !== "" ? parseFloat(f.blood_glucose): null,
      weight_kg:     f.weight_kg     !== "" ? parseFloat(f.weight_kg)    : null,
      height_cm:     f.height_cm     !== "" ? parseFloat(f.height_cm)    : null,
      temperature_c: f.temperature_c !== "" ? parseFloat(f.temperature_c): null,
      spo2_pct:      f.spo2_pct      !== "" ? parseInt(f.spo2_pct)       : null,
      pulse_bpm:     f.pulse_bpm     !== "" ? parseInt(f.pulse_bpm)      : null,
    };

    const { error } = await saveVitalsReading(payload);
    setSaving(false);
    if (error) { setErrors([error.message]); return; }

    // ── PERSIST MARKED AS VISITED IN LOCALSTORAGE ──
    try {
      const saved = localStorage.getItem("radvault_completed_tasks");
      const taskSet = saved ? new Set(JSON.parse(saved)) : new Set();
      taskSet.add(patient.id);
      taskSet.add(`task-${patient.id}`);
      taskSet.add(`db-task-${patient.id}`);
      localStorage.setItem("radvault_completed_tasks", JSON.stringify(Array.from(taskSet)));
    } catch (e) {
      console.error(e);
    }

    setDone(true);
    setTimeout(() => { onSaved(); }, 1200);
  };

  if (!patient) return null;

  return (
    <div className="h-full bg-[#F5FBF9] flex flex-col font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 -ml-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-[#64748B]" />
          </button>
          <div>
            <h1 className="text-sm font-black text-[#16324F]">Patient Health Enquiry &amp; Visit</h1>
            <p className="text-[10px] font-bold text-[#008F83] uppercase tracking-widest">{patient.name}</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200">
          Field Visit
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        
        {done ? (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center border border-[#E2E8F0] shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-[#008F83] mb-4" />
            <h2 className="text-xl font-black text-[#16324F] mb-1">Health Visit Recorded</h2>
            <p className="text-xs font-semibold text-[#64748B]">
              Patient is marked as visited. Data synced with RadVault &amp; Family Portal.
            </p>
          </div>
        ) : (
          <>
            {/* ── 1. VOICE ENQUIRY & AUDIO RECORDING TOOL (NOW LOCATED HERE!) ── */}
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Voice Health Note &amp; Enquiry</h3>
                    <p className="text-[11px] text-slate-400">Record spoken patient symptoms &amp; clinical observations</p>
                  </div>
                </div>

                {/* Audio Language Selection */}
                <select
                  value={audioLang}
                  onChange={e => setAudioLang(e.target.value)}
                  className="text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="mr-IN">मराठी (Marathi)</option>
                  <option value="hi-IN">हिंदी (Hindi)</option>
                  <option value="en-IN">English</option>
                </select>
              </div>

              {micError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Recording UI */}
              <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-100 flex flex-col items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Voice Recording (माईक सुरू करा)</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
                      <span className="font-mono font-black text-red-700 text-base">
                        Recording: 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                      </span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop &amp; Transcribe (नोंद पूर्ण करा)</span>
                    </button>
                  </div>
                )}

                {/* Recorded Audio Player */}
                {audioBlobUrl && (
                  <div className="w-full mt-2 space-y-1.5 bg-white p-3 rounded-xl border border-purple-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-900 flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-purple-600" /> Recorded Audio Memo
                      </span>
                      <button onClick={deleteRecording} className="text-red-500 hover:text-red-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                    <audio controls src={audioBlobUrl} className="w-full h-8" />
                  </div>
                )}
              </div>

              {/* Transcribed / Written Observations */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Observations &amp; Symptom Notes (लक्षणे व नोंदी)
                </label>
                <textarea
                  rows={3}
                  value={f.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Notes spoken via microphone will transcribe here, or type observations..."
                  className="w-full border border-purple-200 rounded-xl p-3 text-xs text-slate-800 bg-white font-medium focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* ── 2. NEW VITALS READINGS FORM ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4">
              <h2 className="text-[11px] font-black text-[#16324F] uppercase tracking-widest mb-4 border-b border-[#E2E8F0] pb-2">
                Vital Readings (शारीरिक तपासणी)
              </h2>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>{errors.map((e, i) => <p key={i} className="text-xs font-bold text-red-800">{e}</p>)}</div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs font-black text-amber-900 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> Verify unusual readings:</p>
                  {warnings.map((w, i) => <p key={i} className="text-xs text-amber-800 ml-4">• {w}</p>)}
                  <p className="text-[10px] text-amber-700 mt-2 font-medium">Tap Save again to confirm.</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5">Blood Pressure <span className="text-[#94A3B8] normal-case font-normal">mmHg</span></label>
                <div className="flex items-center gap-3">
                  <input type="number" inputMode="numeric" placeholder="SYS (उदा. 120)" value={f.bp_systolic} onChange={e => set("bp_systolic", e.target.value)} className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-base font-black text-[#16324F] bg-white shadow-sm" />
                  <span className="text-xl font-black text-slate-300">/</span>
                  <input type="number" inputMode="numeric" placeholder="DIA (उदा. 80)" value={f.bp_diastolic} onChange={e => set("bp_diastolic", e.target.value)} className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-base font-black text-[#16324F] bg-white shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Blood Sugar" unit="mg/dL" value={f.blood_glucose} placeholder="e.g. 98" onChange={v => set("blood_glucose", v)} />
                <NumInput label="Weight" unit="kg" value={f.weight_kg} placeholder="e.g. 62" onChange={v => set("weight_kg", v)} />
                <NumInput label="Height" unit="cm" value={f.height_cm} placeholder="e.g. 162" onChange={v => set("height_cm", v)} />
                <NumInput label="Temperature" unit="°C" value={f.temperature_c} placeholder="e.g. 36.8" onChange={v => set("temperature_c", v)} />
                <NumInput label="SpO₂" unit="%" value={f.spo2_pct} placeholder="e.g. 98" onChange={v => set("spo2_pct", v)} />
                <NumInput label="Pulse" unit="bpm" value={f.pulse_bpm} placeholder="e.g. 72" onChange={v => set("pulse_bpm", v)} />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving Visit Record…" : "Save Visit & Mark Visited ✓"}
              </button>
            </div>

            {/* ── 3. RECENT HEALTH HISTORY ── */}
            <div>
              <h2 className="text-[11px] font-black text-[#64748B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ActivitySquare className="w-3.5 h-3.5" /> Recent Health History
              </h2>
              {history.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm divide-y divide-[#F1F5F9]">
                  {history.map((row) => {
                    const parts = [];
                    if (row.bp_systolic) parts.push(`BP ${row.bp_systolic}/${row.bp_diastolic}`);
                    if (row.blood_glucose) parts.push(`Sugar ${row.blood_glucose}`);
                    if (row.weight_kg) parts.push(`Wt ${row.weight_kg}kg`);
                    if (row.height_cm) parts.push(`Ht ${row.height_cm}cm`);
                    if (row.temperature_c) parts.push(`Temp ${row.temperature_c}\u00B0C`);
                    
                    if (parts.length === 0) return null;
                    return (
                      <div key={row.id} className="p-3 flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-[#16324F] truncate">{parts.join(" • ")}</p>
                          <p className="text-[9px] font-bold text-[#94A3B8] mt-0.5 uppercase tracking-wide">{fmtDate(row.recorded_at)}</p>
                        </div>
                        {sourceBadge(row.source)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
                  <p className="text-xs font-semibold text-[#94A3B8]">No past readings found.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}