import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Stethoscope, User, Clock, CheckCircle2, AlertCircle,
  FileText, Pill, Plus, Trash2, Printer, Download, X,
  ChevronDown, RefreshCw, Zap, Search, Calendar,
  MessageSquare, ShieldCheck, Heart, Video, PhoneCall,
  PhoneOff, Mic, MicOff, VideoOff, Truck, Sparkles, MapPin
} from 'lucide-react';
import { SAMPLE_PATIENTS } from './radvault/SampleData';

// ─── Pre-seeded Clinical Communication Threads ──────────────────────────────
const SAMPLE_THREADS = [
  {
    id: 'T001',
    patientId: 'MH-P-10482',
    patientName: 'Ramesh Patil',
    age: 54,
    gender: 'Male',
    village: 'Koregaon, Satara',
    lastMessage: 'Doctor, SpO2 stabilized at 94% with 2L nasal oxygen.',
    lastTime: '10:32 AM',
    unread: 1,
    urgency: 'urgent',
    messages: [
      { id: 'm1', from: 'asha', name: 'ASHA Sunita Gaikwad', text: 'Namaste Doctor. Ramesh Patil has 104°F fever since yesterday. He has completed 2 days of oral antibiotics.', time: '09:15 AM', type: 'text' },
      { id: 'm2', from: 'doctor', name: 'Dr. Medical Officer', text: 'Please check SpO2 immediately with pulse oximeter. If below 94%, start nasal oxygen.', time: '09:22 AM', type: 'text' },
      { id: 'm3', from: 'asha', name: 'ASHA Sunita Gaikwad', text: 'SpO2 is 92%. We started 2L oxygen as advised. Chest X-Ray scan uploaded to RadVault.', time: '09:30 AM', type: 'text' },
      { id: 'm4', from: 'asha', name: 'ASHA Sunita Gaikwad', text: 'Doctor, SpO2 stabilized at 94% with 2L nasal oxygen. Ready for tele-consultation.', time: '10:32 AM', type: 'text' }
    ]
  },
  {
    id: 'T002',
    patientId: 'MH-P-10492',
    patientName: 'Anil Deshmukh',
    age: 28,
    gender: 'Male',
    village: 'Patan, Satara',
    lastMessage: 'POP slab applied. Pain level reduced from 9/10 to 3/10.',
    lastTime: '09:45 AM',
    unread: 0,
    urgency: 'emergency',
    messages: [
      { id: 'm1', from: 'asha', name: 'ASHA Kavita Salunkhe', text: 'Emergency: Anil Deshmukh sustained acute fall from tractor. Right wrist deformity.', time: '08:45 AM', type: 'text' },
      { id: 'm2', from: 'doctor', name: 'Dr. Ortho Surgeon', text: 'Keep limb elevated and immobilized with splint. Perform digital X-ray AP/Lateral.', time: '08:50 AM', type: 'text' },
      { id: 'm3', from: 'asha', name: 'ASHA Kavita Salunkhe', text: 'POP slab applied. Pain level reduced from 9/10 to 3/10.', time: '09:45 AM', type: 'text' }
    ]
  },
  {
    id: 'T003',
    patientId: 'MH-P-10485',
    patientName: 'Sunita Shinde',
    age: 42,
    gender: 'Female',
    village: 'Wai, Satara',
    lastMessage: 'Migraine frequency has reduced slightly after starting Topiramate.',
    lastTime: 'Yesterday',
    unread: 0,
    urgency: 'normal',
    messages: [
      { id: 'm1', from: 'patient', name: 'Sunita Shinde', text: 'Doctor, should I take Topiramate with food or before bed?', time: 'Yesterday 04:10 PM', type: 'text' },
      { id: 'm2', from: 'doctor', name: 'Dr. Medical Officer', text: 'Take Topiramate 25mg after dinner at bedtime with a full glass of water.', time: 'Yesterday 04:45 PM', type: 'text' },
      { id: 'm3', from: 'patient', name: 'Sunita Shinde', text: 'Thank you Doctor. Migraine frequency has reduced slightly after starting Topiramate.', time: 'Yesterday 07:12 PM', type: 'text' }
    ]
  }
];

// ─── Quick Clinical Protocols / Prescriptions ──────────────────────────────
const PROTOCOLS = [
  {
    title: '🫁 Lobar Pneumonia Protocol',
    diagnosis: 'Acute Right Lower Lobe Bacterial Pneumonia',
    advice: 'Strict bed rest. Monitor SpO2 every 3 hours. Maintain hydration.',
    drugs: [
      { id: 1, drug: 'Amoxicillin 500mg', freq: 'Thrice daily (TDS)', duration: '7 days', instructions: 'Take with warm water after meals' },
      { id: 2, drug: 'Paracetamol 650mg', freq: 'Thrice daily (TDS)', duration: '3 days', instructions: 'Take if body temperature > 100°F' },
      { id: 3, drug: 'Pantoprazole 40mg', freq: 'Once daily (OD)', duration: '7 days', instructions: 'Take 30 mins before breakfast' }
    ]
  },
  {
    title: '🦴 Fracture Pain & Healing',
    diagnosis: 'Distal Radius Colles Fracture - Post Reduction Protocol',
    advice: 'Keep arm elevated on sling. Do not wet plaster. Report fingers numbness immediately.',
    drugs: [
      { id: 1, drug: 'Ibuprofen 400mg', freq: 'Twice daily (BD)', duration: '5 days', instructions: 'Take strictly after meals' },
      { id: 2, drug: 'Paracetamol 650mg', freq: 'Twice daily (BD)', duration: '5 days', instructions: 'For breakthrough pain' },
      { id: 3, drug: 'Vitamin D3 60000 IU', freq: 'Once weekly (Sun)', duration: '2 months', instructions: 'Take with milk after lunch' },
      { id: 4, drug: 'Calcium + Vitamin D', freq: 'Once daily (OD)', duration: '1 month', instructions: 'After dinner' }
    ]
  },
  {
    title: '🧠 Chronic Migraine Prophylaxis',
    diagnosis: 'Chronic Migraine with Visual Aura',
    advice: 'Maintain regular sleep schedule. Avoid sensory triggers and dehydration.',
    drugs: [
      { id: 1, drug: 'Topiramate 25mg', freq: 'At night (HS)', duration: '1 month', instructions: 'Take after dinner at bedtime' },
      { id: 2, drug: 'Pantoprazole 40mg', freq: 'Once daily (OD)', duration: '1 month', instructions: 'Before breakfast' }
    ]
  }
];

// ─── Prescription Slip Viewer ──────────────────────────────────────────────
function PrescriptionSlip({ rx, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden">
        {/* Letterhead */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-base tracking-tight">🏥 eSanjeevani Tele-Medicine Consultation</h2>
              <p className="text-xs text-blue-200 mt-0.5">Government of Maharashtra • Directorate of Health Services • ABDM</p>
            </div>
            <div className="text-right text-xs text-blue-200">
              <p>Rx ID: <span className="font-mono font-bold text-white">{rx.id}</span></p>
              <p>{rx.prescribedAt}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 font-sans text-slate-800 text-xs">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div><span className="text-slate-400 font-bold block">Patient Name</span><span className="font-extrabold text-slate-900 text-sm">{rx.patientName}</span></div>
            <div><span className="text-slate-400 font-bold block">ABHA ID</span><span className="font-mono font-bold text-blue-700">{rx.abhaId || '91-4829-1029-4820'}</span></div>
            <div><span className="text-slate-400 font-bold block">Age / Gender</span><span className="font-bold">{rx.patientAge} Yrs / {rx.patientGender}</span></div>
            <div><span className="text-slate-400 font-bold block">Clinical Diagnosis</span><span className="font-bold text-indigo-700">{rx.diagnosis}</span></div>
          </div>

          {/* Drugs */}
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Prescribed Medications (℞)</p>
            <div className="space-y-2">
              {rx.drugs.filter(d => d.drug).map((d, i) => (
                <div key={d.id || i} className="flex items-start gap-3 p-2.5 border border-slate-200 rounded-xl bg-blue-50/50">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{d.drug}</p>
                    <p className="text-[11px] text-slate-500">{d.freq} • {d.duration}</p>
                    {d.instructions && <p className="text-[11px] text-blue-700 italic mt-0.5">{d.instructions}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          {rx.advice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="font-bold text-emerald-800 mb-0.5">General Advice:</p>
              <p className="text-emerald-900 leading-relaxed">{rx.advice}</p>
            </div>
          )}

          {/* Signoff */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <div>
              <span className="text-slate-400 font-semibold">Follow-up:</span>
              <span className="font-bold text-slate-800 ml-1">{rx.followUp || '3 days'}</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">{rx.doctorName || 'Dr. Medical Officer (PHC)'}</p>
              <p className="text-slate-400 text-[10px]">Registered Medical Practitioner</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 flex gap-2 bg-slate-50">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-white transition-colors">
            Close
          </button>
          <button onClick={() => window.print()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print Official e-Prescription
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Doctor Terminal Component ─────────────────────────────────────────
export default function DoctorTerminal({ onBack }) {
  const [threads, setThreads] = useState(SAMPLE_THREADS);
  const [selectedThread, setSelectedThread] = useState(SAMPLE_THREADS[0]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [currentRx, setCurrentRx] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  // Live Call Controls
  const [isCalling, setIsCalling] = useState(false);
  const [callSecs, setCallSecs] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Prescription Form in Chat
  const [showRxDrawer, setShowRxDrawer] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState('Acute Bacterial Lobar Pneumonia');
  const [rxDrugs, setRxDrugs] = useState([
    { id: 1, drug: 'Amoxicillin 500mg', freq: 'Twice daily (BD)', duration: '5 days', instructions: 'Take with warm water after meals' }
  ]);
  const [rxAdvice, setRxAdvice] = useState('Keep oxygen saturation above 94%. Follow up in 3 days.');
  const messagesEndRef = useRef(null);

  const patient = SAMPLE_PATIENTS.find(p => p.id === selectedThread?.patientId) || SAMPLE_PATIENTS[0];

  useEffect(() => {
    let t;
    if (isCalling) {
      t = setInterval(() => setCallSecs(s => s + 1), 1000);
    } else {
      setCallSecs(0);
    }
    return () => clearInterval(t);
  }, [isCalling]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages?.length]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: `m-${Date.now()}`,
      from: 'doctor',
      name: 'Dr. Medical Officer',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setThreads(prev => prev.map(t => t.id === selectedThread.id
      ? { ...t, messages: [...t.messages, msg], lastMessage: msg.text, lastTime: msg.time, unread: 0 }
      : t
    ));

    setSelectedThread(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    setNewMessage('');
  };

  const handleApplyProtocol = (proto) => {
    setRxDiagnosis(proto.diagnosis);
    setRxAdvice(proto.advice);
    setRxDrugs(proto.drugs);
    setShowRxDrawer(true);
  };

  const handleDispatchPrescription = () => {
    const rx = {
      id: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      abhaId: patient.abhaId,
      diagnosis: rxDiagnosis,
      drugs: rxDrugs,
      advice: rxAdvice,
      followUp: '3 days',
      doctorName: 'Dr. Medical Officer (PHC)',
      prescribedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    setPrescriptions(prev => [rx, ...prev]);

    // Send in chat
    const msg = {
      id: `m-${Date.now()}`,
      from: 'doctor',
      name: 'Dr. Medical Officer',
      text: `📋 Official e-Prescription Dispatched: ${rx.diagnosis} (${rx.drugs.length} medications)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'prescription',
      rx
    };

    setThreads(prev => prev.map(t => t.id === selectedThread.id
      ? { ...t, messages: [...t.messages, msg], lastMessage: 'Prescription Dispatched', lastTime: msg.time }
      : t
    ));

    setSelectedThread(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    setShowRxDrawer(false);
    setCurrentRx(rx);
  };

  const filteredThreads = threads.filter(t =>
    t.patientName.toLowerCase().includes(search.toLowerCase()) ||
    t.patientId.toLowerCase().includes(search.toLowerCase()) ||
    t.village.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-sm">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-900 text-base tracking-tight">Doctor Tele-Consultation Terminal</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                eSanjeevani Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Direct Patient &amp; ASHA Worker Video/Audio Consult • e-Prescriptions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`108 Emergency Ambulance dispatched to ${patient.village} for patient ${patient.name}!`)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-red-200 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" /> Dispatch 108 Ambulance
          </button>
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ← Portals Home
          </button>
        </div>
      </header>

      {/* ── Body: 3-Column Workstation Layout ── */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-62px)]">

        {/* ── LEFT: Patient Thread List ── */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient, village..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedThread(t)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${
                  selectedThread?.id === t.id ? 'bg-blue-50/80 border-r-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-bold text-sm ${selectedThread?.id === t.id ? 'text-blue-700' : 'text-slate-800'}`}>
                    {t.patientName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {t.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {t.unread}
                      </span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${
                      t.urgency === 'emergency' ? 'bg-red-500' : t.urgency === 'urgent' ? 'bg-orange-400' : 'bg-emerald-500'
                    }`} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">{t.patientId} • {t.village}</p>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{t.lastMessage}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* ── CENTER: Consultation & Chat Terminal ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* Chat / Call Top Bar */}
          <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center font-black text-blue-700 text-base">
                {selectedThread?.patientName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedThread?.patientName}</h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 rounded text-slate-500">
                    {patient.abhaId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {patient.age}y {patient.gender} • {patient.village} • ASHA: <strong>{patient.ashaWorker}</strong>
                </p>
              </div>
            </div>

            {/* Call Trigger Buttons */}
            <div className="flex items-center gap-2">
              {!isCalling ? (
                <>
                  <button
                    onClick={() => setIsCalling(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" /> Start Tele-Consult
                  </button>
                  <button
                    onClick={() => setShowRxDrawer(!showRxDrawer)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Pill className="w-3.5 h-3.5" /> Write e-Rx
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-black text-emerald-400 px-2.5 py-1 rounded-lg animate-pulse">
                    🔴 {Math.floor(callSecs / 60)}:{(callSecs % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-1.5 rounded-lg text-white ${isMuted ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsCalling(false)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> End Call
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Clinical Protocol Chips */}
          <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Quick Protocols:</span>
            {PROTOCOLS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyProtocol(p)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold rounded-lg flex-shrink-0 transition-colors border border-slate-200/80"
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedThread?.messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] flex flex-col gap-0.5 ${msg.from === 'doctor' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 px-1">{msg.name} • {msg.time}</span>
                  {msg.type === 'prescription' ? (
                    <div
                      onClick={() => setCurrentRx(msg.rx)}
                      className="bg-blue-50 border-2 border-blue-200 rounded-2xl rounded-tr-none p-3.5 max-w-sm cursor-pointer hover:border-blue-400 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs mb-1">
                        <Pill className="w-4 h-4" /> e-Prescription Slip Generated
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{msg.rx?.diagnosis}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {msg.rx?.drugs?.filter(d => d.drug).map(d => d.drug).join(' • ')}
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 mt-1.5">Click to view &amp; print official slip →</p>
                    </div>
                  ) : (
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed max-w-md ${
                      msg.from === 'doctor'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs font-medium'
                    }`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Rx Drawer Form (When Open) */}
          {showRxDrawer && (
            <div className="bg-white border-t-2 border-blue-500 p-4 shadow-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>e-Prescription Builder — {patient.name}</span>
                </span>
                <button onClick={() => setShowRxDrawer(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Clinical Diagnosis</label>
                <input
                  value={rxDiagnosis}
                  onChange={e => setRxDiagnosis(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 block">Medications List</label>
                {rxDrugs.map((d, i) => (
                  <div key={d.id || i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <input
                      value={d.drug}
                      onChange={e => {
                        const val = e.target.value;
                        setRxDrugs(list => list.map(item => item.id === d.id ? { ...item, drug: val } : item));
                      }}
                      placeholder="Drug name (e.g. Amoxicillin 500mg)"
                      className="sm:col-span-5 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    />
                    <select
                      value={d.freq}
                      onChange={e => {
                        const val = e.target.value;
                        setRxDrugs(list => list.map(item => item.id === d.id ? { ...item, freq: val } : item));
                      }}
                      className="sm:col-span-3 border border-slate-300 rounded-lg px-2 py-1 bg-white"
                    >
                      <option>Once daily (OD)</option>
                      <option>Twice daily (BD)</option>
                      <option>Thrice daily (TDS)</option>
                      <option>At night (HS)</option>
                    </select>
                    <select
                      value={d.duration}
                      onChange={e => {
                        const val = e.target.value;
                        setRxDrugs(list => list.map(item => item.id === d.id ? { ...item, duration: val } : item));
                      }}
                      className="sm:col-span-2 border border-slate-300 rounded-lg px-2 py-1 bg-white"
                    >
                      <option>3 days</option>
                      <option>5 days</option>
                      <option>7 days</option>
                      <option>14 days</option>
                      <option>1 month</option>
                    </select>
                    <button
                      onClick={() => setRxDrugs(list => list.filter(item => item.id !== d.id))}
                      className="sm:col-span-2 text-red-500 font-bold hover:underline text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => setRxDrugs(prev => [...prev, { id: Date.now(), drug: '', freq: 'Twice daily (BD)', duration: '5 days', instructions: '' }])}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Drug
                </button>
                <button
                  onClick={handleDispatchPrescription}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch e-Prescription
                </button>
              </div>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 p-3 flex gap-2 flex-shrink-0">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type clinical advice or referral instructions to ASHA..."
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </main>

        {/* ── RIGHT: Patient Overview & History ── */}
        <aside className="w-64 bg-white border-l border-slate-200 p-4 space-y-4 flex-shrink-0 hidden lg:block overflow-y-auto">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Patient Vitals &amp; Triage</p>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold block">SpO2 Oxygen Level</span>
                <span className="font-black text-red-600 text-sm">92% (Low - On Oxygen)</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold block">Blood Pressure</span>
                <span className="font-bold text-slate-800">140/90 mmHg</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold block">Heart Rate</span>
                <span className="font-bold text-slate-800">88 bpm (Regular)</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold block">Emergency Contact</span>
                <span className="font-mono font-bold text-slate-700">{patient.phone}</span>
              </div>
            </div>
          </div>

          {/* Issued Prescriptions History */}
          {prescriptions.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Prescription History</p>
              <div className="space-y-2">
                {prescriptions.map(rx => (
                  <div
                    key={rx.id}
                    onClick={() => setCurrentRx(rx)}
                    className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 text-xs"
                  >
                    <span className="font-mono font-bold text-blue-700 text-[10px]">{rx.id}</span>
                    <p className="font-bold text-slate-800 text-[11px] mt-0.5 truncate">{rx.diagnosis}</p>
                    <p className="text-[10px] text-slate-400">{rx.prescribedAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

      </div>

      {/* Prescription Slip Modal */}
      {currentRx && (
        <PrescriptionSlip rx={currentRx} onClose={() => setCurrentRx(null)} />
      )}

    </div>
  );
}
