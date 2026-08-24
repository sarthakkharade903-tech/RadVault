import React, { useState, useEffect, useRef } from 'react';
import {
  Search, User, Clock, AlertCircle, Activity, Heart,
  FileText, Zap, Calendar, ChevronRight, Stethoscope,
  Shield, UploadCloud, RefreshCw, CheckCircle2, Layers,
  Phone, MapPin, Droplet, Cpu, X, Printer, Video,
  PhoneCall, PhoneOff, Mic, MicOff, VideoOff, MessageSquare,
  Send, Plus, Trash2, Pill, Check, Download, AlertTriangle,
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Sliders, Eye, EyeOff,
  Radio, Sparkles, ExternalLink, Share2, Paperclip, Volume2,
  Copy, CheckCheck, History, Package, AlertOctagon, HeartPulse,
  Thermometer, ShoppingCart, Truck, QrCode
} from 'lucide-react';
import { SAMPLE_PATIENTS, INITIAL_STUDIES, GOVT_METADATA } from './SampleData';
import {
  isSupabaseConfigured,
  fetchAllStudiesFromSupabase,
  subscribeToRealtimeStudies,
  updateStudyInSupabase
} from '../../lib/supabase';

// ─── Urgency Visual Color Helpers ──────────────────────────────────────────
const urgencyDot = (u) =>
  u === 'emergency' ? 'bg-red-500' : u === 'urgent' ? 'bg-orange-400' : 'bg-emerald-500';

const urgencyBadge = (u) =>
  u === 'emergency'
    ? 'bg-red-50 text-red-600 border-red-200'
    : u === 'urgent'
    ? 'bg-orange-50 text-orange-600 border-orange-200'
    : 'bg-emerald-50 text-emerald-600 border-emerald-200';

// ─── High-Fidelity Printable Prescription Slip Component ───────────────────
function PrintablePrescriptionModal({ patient, rxList, diagnosis, advice, doctorName, onClose, onOrderPharmacy }) {
  const rxId = `RX-MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">

        {/* Modal Controls (Hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold">Official Government Medical Prescription &amp; Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── ACTUAL PRINTABLE MEDICAL PRESCRIPTION SHEET ── */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto text-slate-900 bg-white font-sans text-xs" id="printable-receipt">

          {/* Letterhead Header */}
          <div className="border-b-2 border-blue-900 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black text-sm flex items-center justify-center">
                  🏛️
                </div>
                <div>
                  <h2 className="font-black text-base tracking-tight text-blue-950 uppercase">
                    Directorate of Health Services • Government of Maharashtra
                  </h2>
                  <p className="text-[11px] font-bold text-slate-600">
                    Ayushman Bharat Digital Mission (ABDM) • eSanjeevani Tele-Medicine
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                {patient.phcCenter} • Satara District Tele-Consultation Hub
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block">
                Official e-Prescription (℞)
              </span>
              <p className="font-mono font-bold text-xs text-slate-800">Rx ID: {rxId}</p>
              <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Patient Name</span>
              <span className="font-extrabold text-sm text-slate-950">{patient.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">ABHA ID (Health ID)</span>
              <span className="font-mono font-bold text-blue-800 text-xs">{patient.abhaId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Age / Gender / Blood</span>
              <span className="font-bold text-slate-900">{patient.age}y / {patient.gender} • <strong className="text-red-600">{patient.bloodGroup}</strong></span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Village / Contact</span>
              <span className="font-semibold text-slate-800">{patient.village.split(',')[0]} • {patient.phone}</span>
            </div>
          </div>

          {/* Clinical Vitals at Time of Prescription */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px]">
            <span><strong>BP:</strong> {patient.vitals?.bp} mmHg</span>
            <span><strong>SpO2:</strong> {patient.vitals?.spo2}% ({patient.vitals?.spo2Status})</span>
            <span><strong>Heart Rate:</strong> {patient.vitals?.heartRate} bpm</span>
            <span><strong>Temp:</strong> {patient.vitals?.temp}</span>
            <span><strong>ASHA Worker:</strong> {patient.ashaWorker}</span>
          </div>

          {/* Clinical Diagnosis */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Provisional Clinical Diagnosis</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">{diagnosis}</p>
          </div>

          {/* ℞ Medicines Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <span>℞ Prescribed Medicines &amp; Dosage Schedule</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Generic Equivalent Eligible (PMBJP Jan Aushadhi)</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="text-left p-2.5 w-8">#</th>
                    <th className="text-left p-2.5">Medicine Name &amp; Strength</th>
                    <th className="text-left p-2.5">Dosage Frequency</th>
                    <th className="text-left p-2.5">Duration</th>
                    <th className="text-left p-2.5">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rxList.map((rx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-black text-slate-900 text-xs">
                        💊 {rx.drug}
                      </td>
                      <td className="p-2.5 font-bold text-blue-800">
                        {rx.freq}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">
                        {rx.duration}
                      </td>
                      <td className="p-2.5 text-slate-600 font-medium">
                        {rx.instructions || 'Take with water after food'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special Advice & Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">General Advice &amp; Follow-up:</span>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">{advice}</p>
          </div>

          {/* Signatures & QR Validation Footer */}
          <div className="border-t border-slate-200 pt-4 flex justify-between items-end">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg p-1 flex flex-col items-center justify-center text-center">
                <QrCode className="w-10 h-10 text-slate-700" />
                <span className="text-[7px] font-mono text-slate-500 mt-0.5">ABDM QR</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <p>Digital Token: <span className="font-mono text-slate-600">NHA-MH-2026-SECURE</span></p>
                <p>Valid at all Government PHC &amp; PMBJP Jan Aushadhi Stores</p>
                <p className="text-emerald-700 font-bold">✓ Digitally Signed by Medical Officer</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-black text-slate-900 text-sm">{doctorName || 'Dr. Medical Officer, MBBS, DNB'}</p>
              <p className="text-[10px] text-slate-500">Reg. No: MCI-MH-2018-84291</p>
              <p className="text-[10px] text-blue-700 font-bold">Satara District Tele-Health Officer</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl text-slate-700"
          >
            Close Preview
          </button>

          <div className="flex items-center gap-2">
            {onOrderPharmacy && (
              <button
                onClick={() => {
                  onClose();
                  onOrderPharmacy();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Dispatch Order to Pharmacy Portal</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Official Slip
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Online Pharmacy Order Dispatch Modal ───────────────────────────────────
function PharmacyOrderDispatchModal({ patient, rxList, diagnosis, onClose, onConfirmOrder, onGoToPharmacy }) {
  const [orderSent, setOrderSent] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleConfirm = () => {
    const newOrdId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
    setOrderId(newOrdId);
    setOrderSent(true);
    if (onConfirmOrder) onConfirmOrder(newOrdId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-300" />
            <h3 className="font-black text-base">Online Pharmacy Order Dispatch</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderSent ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg">Order Successfully Sent to Pharmacy Hub!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Order ID: <strong className="font-mono text-blue-700">{orderId}</strong> for patient <strong>{patient.name}</strong>
              </p>
              <p className="text-xs text-emerald-700 font-bold mt-2">
                The druggist at PHC Jan Aushadhi Store has received the prescription for automated packaging.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              {onGoToPharmacy && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToPharmacy();
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Package className="w-3.5 h-3.5" /> Open Pharmacy Dashboard →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 text-xs text-slate-800">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Selected Patient</p>
              <p className="font-extrabold text-sm text-slate-900">{patient.name} ({patient.gender}, {patient.age}y) — {patient.village}</p>
              <p className="text-slate-600 text-xs">Diagnosis: <strong>{diagnosis}</strong></p>
            </div>

            <div>
              <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Prescription Items to Dispatch (℞):</p>
              <div className="space-y-1.5">
                {rxList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800">💊 {item.drug}</span>
                    <span className="text-slate-500">{item.freq} • {item.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900 text-xs">PMBJP Jan Aushadhi Generic Savings:</p>
                <p className="text-[11px] text-emerald-700">Patient saves ₹240 with government subsidized generic salts</p>
              </div>
              <span className="text-sm font-black text-emerald-800">₹65 Total</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel / Manual Dispense
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" /> Confirm &amp; Dispatch Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Modal ───────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploadComplete }) {
  const [patientId, setPatientId] = useState(SAMPLE_PATIENTS[0].id);
  const [modality, setModality] = useState('X-Ray');
  const [bodyRegion, setBodyRegion] = useState('Chest / Thorax');
  const [urgency, setUrgency] = useState('urgent');
  const [facility, setFacility] = useState('Satara District Tele-Radiology Hub');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [newStudyId, setNewStudyId] = useState('');
  const fileRef = useRef();

  const handleFileChange = (picked) => {
    if (picked) setFile(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setUploading(true);
    setProgress(25);
    await new Promise(r => setTimeout(r, 200));
    setProgress(60);
    await new Promise(r => setTimeout(r, 250));
    setProgress(90);
    await new Promise(r => setTimeout(r, 150));

    const patient = SAMPLE_PATIENTS.find(p => p.id === patientId) || SAMPLE_PATIENTS[0];

    let localFileUrl = null;
    if (file) {
      try { localFileUrl = URL.createObjectURL(file); } catch (_) {}
    }

    const studyId = `RV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudy = {
      id: studyId,
      patientId,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      abhaId: patient.abhaId || patientId,
      modality,
      bodyRegion,
      studyDate: new Date().toISOString().split('T')[0],
      facility,
      technicianName: 'Suresh More (Cert. Radiographer #88)',
      urgency,
      fileUrl: localFileUrl,
      thumbnail: localFileUrl,
      fileName: file?.name || `${modality.toLowerCase()}_scan.dcm`,
      fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '12.4 MB',
      technicianNotes: notes || 'Diagnostic scan processed and uploaded to patient medical history.',
      doctorFindings: '',
      aiAnalysis: { detected: urgency !== 'normal', confidence: 92, condition: 'High Density Infiltration - Review Recommended' },
      measurements: [],
      pins: []
    };

    setProgress(100);
    setNewStudyId(studyId);
    setUploading(false);
    setDone(true);
    if (onUploadComplete) onUploadComplete(newStudy);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span>Upload Radiology Scan to RadVault PACS</span>
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3 text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-base text-slate-800">Scan Uploaded to RadVault!</p>
              <p className="text-xs text-slate-400">Study ID: <span className="font-mono font-bold text-blue-600">{newStudyId}</span></p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Patient</label>
              <select
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white font-semibold"
              >
                {SAMPLE_PATIENTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.gender}, {p.age}y) — ID: {p.id} • {p.village}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Modality</label>
                <select value={modality} onChange={e => setModality(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                  <option>X-Ray</option>
                  <option>CT Scan</option>
                  <option>MRI</option>
                  <option>Ultrasound</option>
                  <option>Lab Report / PDF</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Priority</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white font-bold">
                  <option value="normal">🟢 Normal</option>
                  <option value="urgent">🟠 Urgent</option>
                  <option value="emergency">🔴 Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Anatomical Region</label>
              <select value={bodyRegion} onChange={e => setBodyRegion(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-white">
                <option>Chest / Thorax PA View</option>
                <option>Head / Brain (Non-Contrast)</option>
                <option>Spine (Lumbosacral L4-L5)</option>
                <option>Right Wrist (AP &amp; Lateral)</option>
                <option>Both Hands &amp; Wrists (PA)</option>
              </select>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files?.[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".dcm,.dicom,image/*,.pdf"
                onChange={e => handleFileChange(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-700">{file.name}</p>
                  <p className="text-[10px] text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-bold text-slate-700">Drop DICOM image or radiology scan here</p>
                  <p className="text-[10px] text-slate-400">or click to browse local storage</p>
                </>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Technician Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Preliminary findings or patient position notes..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none placeholder-slate-400 bg-white"
              />
            </div>

            {uploading && (
              <div className="space-y-1 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                <div className="flex justify-between text-[11px] text-blue-800 font-bold">
                  <span>Uploading to ABDM PACS...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs shadow-sm"
            >
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>{uploading ? 'Processing Scan...' : 'Upload & Save to RadVault'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Doctor & RadVault Workstation Component ───────────────────────────
export default function RadVaultManager({ onBackToHome, onNavigateToPharmacy, onNavigateToDiagnostic }) {
  const [studies, setStudies] = useState(INITIAL_STUDIES);
  const [selectedPatientId, setSelectedPatientId] = useState(SAMPLE_PATIENTS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'history' | 'scans' | 'telecom' | 'rx' | 'labs' | 'vitals'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummaryVisible, setAiSummaryVisible] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [showPharmacyOrderModal, setShowPharmacyOrderModal] = useState(false);
  const [copiedAbha, setCopiedAbha] = useState(false);

  // Track Reviewed / Actioned patients so Action Needed counter decreases
  const [reviewedPatientIds, setReviewedPatientIds] = useState(new Set());

  // PACS Viewer Controls State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contrastMode, setContrastMode] = useState('default');
  const [caliperActive, setCaliperActive] = useState(false);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [doctorNoteInput, setDoctorNoteInput] = useState('');
  const [savedDoctorNotes, setSavedDoctorNotes] = useState({});
  const [saveToast, setSaveToast] = useState(false);

  // Tele-Consultation State
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 'msg-1', sender: 'asha', text: 'Namaste Doctor! Patient is with me at PHC. Vitals recorded.', time: '10:14 AM' },
    { id: 'msg-2', sender: 'doctor', text: 'Thank you. I am reviewing the patient history, scans and lab tests in RadVault.', time: '10:15 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Prescription Form State
  const [rxList, setRxList] = useState([
    { id: 1, drug: 'Amoxicillin 500mg', freq: 'Twice daily (BD)', duration: '5 days', instructions: 'Take after meals with warm water' },
    { id: 2, drug: 'Paracetamol 650mg', freq: 'Thrice daily (TDS)', duration: '3 days', instructions: 'Take if fever > 100°F' }
  ]);
  const [rxDiagnosis, setRxDiagnosis] = useState('Acute Right Lower Lobe Bacterial Pneumonia');
  const [rxAdvice, setRxAdvice] = useState('Strict bed rest. Keep oxygen saturation above 94%. Follow up in 3 days.');
  const [rxSentSuccess, setRxSentSuccess] = useState(false);

  // Timeline Filter State
  const [timelineFilter, setTimelineFilter] = useState('all');

  // Selected patient object
  const patient = SAMPLE_PATIENTS.find(p => p.id === selectedPatientId) || SAMPLE_PATIENTS[0];
  const patientStudies = studies.filter(s => s.patientId === selectedPatientId);
  const activeStudy = patientStudies[0] || INITIAL_STUDIES[0];

  // Mark patient as reviewed whenever selected
  const handleSelectPatient = (pId) => {
    setSelectedPatientId(pId);
    setReviewedPatientIds(prev => new Set(prev).add(pId));
  };

  // Urgent referrals
  const urgentPatients = SAMPLE_PATIENTS.filter(p =>
    p.urgency === 'emergency' || p.urgency === 'urgent'
  );

  // Action needed count
  const actionNeededCount = urgentPatients.filter(p => !reviewedPatientIds.has(p.id)).length;

  useEffect(() => {
    let timer;
    if (callActive) {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const referrals = SAMPLE_PATIENTS.map(p => {
    const latestStudy = studies.filter(s => s.patientId === p.id)
      .sort((a, b) => (b.studyDate || '').localeCompare(a.studyDate || ''))[0];
    return { patient: p, latestStudy };
  }).sort((a, b) => {
    const order = { emergency: 0, urgent: 1, normal: 2 };
    return (order[a.latestStudy?.urgency || 'normal'] || 2) - (order[b.latestStudy?.urgency || 'normal'] || 2);
  });

  const executeSearch = () => {
    if (!searchQuery.trim()) return;
    const match = SAMPLE_PATIENTS.find(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abhaId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      handleSelectPatient(match.id);
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient.abhaId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateAI = () => {
    setAiLoading(true);
    setAiSummaryVisible(false);
    setTimeout(() => { setAiLoading(false); setAiSummaryVisible(true); }, 1200);
  };

  const handleUploadComplete = (newStudy) => {
    setStudies(prev => [newStudy, ...prev]);
    handleSelectPatient(newStudy.patientId);
    setActiveTab('scans');
  };

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'doctor',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleCopyAbha = () => {
    navigator.clipboard.writeText(patient.abhaId);
    setCopiedAbha(true);
    setTimeout(() => setCopiedAbha(false), 2000);
  };

  const handleSaveDoctorNotes = () => {
    setSavedDoctorNotes(prev => ({ ...prev, [selectedPatientId]: doctorNoteInput }));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleQuickProtocol = (protocolName) => {
    if (protocolName === 'pneumonia') {
      setRxDiagnosis('Acute Right Lower Lobe Bacterial Pneumonia');
      setRxAdvice('Strict bed rest. Monitor SpO2 every 3 hours. Continue oxygen 2L/min.');
      setRxList([
        { id: 1, drug: 'Amoxicillin 500mg', freq: 'Thrice daily (TDS)', duration: '7 days', instructions: 'Take after meals' },
        { id: 2, drug: 'Paracetamol 650mg', freq: 'Thrice daily (TDS)', duration: '3 days', instructions: 'Take if fever > 100°F' },
        { id: 3, drug: 'Pantoprazole 40mg', freq: 'Once daily (OD)', duration: '7 days', instructions: 'Before breakfast' }
      ]);
    } else if (protocolName === 'fracture') {
      setRxDiagnosis('Colles Fracture Right Radius - Pain Management');
      setRxAdvice('Keep arm elevated in sling. Check fingers sensation.');
      setRxList([
        { id: 1, drug: 'Ibuprofen 400mg', freq: 'Twice daily (BD)', duration: '5 days', instructions: 'Strictly after food' },
        { id: 2, drug: 'Vitamin D3 60000 IU', freq: 'Once weekly (Sun)', duration: '2 months', instructions: 'With milk' }
      ]);
    } else if (protocolName === 'migraine') {
      setRxDiagnosis('Chronic Migraine Evaluation & Prophylaxis');
      setRxAdvice('Avoid sensory triggers, maintain hydration and sleep schedule.');
      setRxList([
        { id: 1, drug: 'Topiramate 25mg', freq: 'At night (HS)', duration: '1 month', instructions: 'After dinner at bedtime' }
      ]);
    }
  };

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Build clinical timeline
  const rawTimeline = [
    ...patientStudies.map(s => ({
      id: s.id,
      type: s.modality === 'Lab Report / PDF' ? 'LAB' : 'SCAN',
      date: s.studyDate,
      time: '09:30 AM',
      title: `${s.modality} — ${s.bodyRegion}`,
      description: s.technicianNotes || s.doctorFindings || 'Diagnostic radiology study completed.',
      urgency: s.urgency,
      facility: s.facility,
      aiDetected: s.aiAnalysis?.detected,
      aiCondition: s.aiAnalysis?.condition,
    })),
    {
      id: 'telecom-init',
      type: 'TELE_CONSULT',
      date: '2026-08-22',
      time: '10:15 AM',
      title: 'eSanjeevani Tele-Consultation',
      description: `Remote triage tele-connect with ${patient.ashaWorker}. Vitals verified.`,
      urgency: 'urgent',
      facility: patient.phcCenter
    },
    {
      id: 'triage-init',
      type: 'TRIAGE',
      date: patientStudies[0]?.studyDate || '2026-08-20',
      time: '08:45 AM',
      title: 'Village Frontline Triage (ASHA Worker)',
      description: `Patient registered by ${patient.ashaWorker}. Alert: ${patient.criticalAlert}`,
      urgency: 'urgent',
      facility: patient.phcCenter
    }
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const timeline = rawTimeline.filter(item => {
    if (timelineFilter === 'scan') return item.type === 'SCAN';
    if (timelineFilter === 'lab') return item.type === 'LAB';
    if (timelineFilter === 'triage') return item.type === 'TRIAGE' || item.type === 'TELE_CONSULT';
    return true;
  });

  const typeIcon = (type) => {
    if (type === 'TRIAGE') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (type === 'SCAN') return <FileText className="w-4 h-4 text-blue-600" />;
    if (type === 'TELE_CONSULT') return <PhoneCall className="w-4 h-4 text-emerald-600" />;
    return <Activity className="w-4 h-4 text-purple-500" />;
  };

  const typeColor = (type) => {
    if (type === 'TRIAGE') return 'border-red-300 bg-red-50';
    if (type === 'SCAN') return 'border-blue-200 bg-blue-50';
    if (type === 'TELE_CONSULT') return 'border-emerald-200 bg-emerald-50';
    return 'border-purple-200 bg-purple-50';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">

      {/* ── Top Nav Bar ── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
            <span className="text-lg font-black text-slate-900 tracking-tight">RadVault</span>
          </div>
          <span className="hidden sm:block text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Doctor &amp; Clinical Workstation
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToPharmacy && (
            <button
              onClick={onNavigateToPharmacy}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors border border-emerald-200"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Pharmacy Hub →</span>
            </button>
          )}

          {onNavigateToDiagnostic && (
            <button
              onClick={onNavigateToDiagnostic}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors border border-teal-200"
            >
              <span>🔬 Diagnostic Hub →</span>
            </button>
          )}

          <button
            onClick={() => setShowPrintSlip(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-300"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Slip</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Scan</span>
          </button>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              ← Home
            </button>
          )}
        </div>
      </header>

      {/* ── URGENT PATIENT QUICK ACTION BAR ── */}
      <section className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-4 sm:px-6 py-2 shadow-md flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider">
            🚨 Immediate Action Referrals ({actionNeededCount} Pending Review):
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto py-0.5">
          {urgentPatients.map(up => {
            const isReviewed = reviewedPatientIds.has(up.id);

            return (
              <div
                key={up.id}
                onClick={() => {
                  handleSelectPatient(up.id);
                  setActiveTab('telecom');
                }}
                className={`flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl px-3 py-1 text-xs cursor-pointer transition-all duration-200 ${
                  selectedPatientId === up.id ? 'ring-2 ring-white bg-white/35 font-black' : ''
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white text-red-600 font-black text-[10px] flex items-center justify-center">
                  {up.name.charAt(0)}
                </div>
                <div className="text-left">
                  <span className="font-bold">{up.name}</span>
                  <span className="text-red-100 text-[10px] ml-1.5">({up.criticalAlert.split('(')[0]})</span>
                </div>
                {isReviewed ? (
                  <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white font-extrabold text-[9px] rounded-md flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Reviewed
                  </span>
                ) : (
                  <button
                    title="Direct Tele-Connect"
                    className="ml-1 px-2 py-0.5 bg-white text-red-600 font-extrabold text-[10px] rounded-lg hover:bg-red-50 flex items-center gap-1 shadow-sm"
                  >
                    <PhoneCall className="w-2.5 h-2.5" /> Call
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR: Referral Patient Queue ── */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Incoming Referrals</h2>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full text-white shadow-xs transition-all ${
                actionNeededCount > 0 ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {actionNeededCount > 0 ? `${actionNeededCount} Action Needed` : 'All Reviewed ✅'}
              </span>
            </div>

            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && executeSearch()}
                  placeholder="Search name, ABHA, village..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
              <button
                onClick={executeSearch}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                title="Search patient"
              >
                Find
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredReferrals.map(({ patient: p, latestStudy }) => {
              const isReviewed = reviewedPatientIds.has(p.id);

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 relative ${
                    selectedPatientId === p.id ? 'bg-blue-50/80 border-r-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <span className={`font-bold text-sm ${selectedPatientId === p.id ? 'text-blue-700' : 'text-slate-800'}`}>
                      {p.name}
                    </span>
                    {isReviewed ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        ✅ Visited
                      </span>
                    ) : (
                      <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${urgencyDot(latestStudy?.urgency || 'normal')}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{p.id}</span>
                    <span>•</span>
                    <span>{p.gender}, {p.age}y</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium line-clamp-1">{p.criticalAlert}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {latestStudy?.studyDate || 'Today'}
                    </span>
                    <span className="text-blue-600 font-semibold">{p.village.split(',')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── MAIN WORKSTATION ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Patient Profile & Banner Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-700 font-black text-lg">
                {patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-slate-900 text-lg">{patient.name}</h2>
                  <button
                    onClick={handleCopyAbha}
                    title="Click to Copy ABHA ID"
                    className="flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <span>ABHA: {patient.abhaId}</span>
                    {copiedAbha ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-blue-500" />}
                  </button>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${urgencyBadge(patient.urgency || 'urgent')}`}>
                    {patient.urgency || 'urgent'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {patient.age} Yrs • {patient.gender} • Blood: <strong className="text-red-600 font-bold">{patient.bloodGroup}</strong> • {patient.village} • ASHA: <strong>{patient.ashaWorker}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowPharmacyOrderModal(true)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Order via Pharmacy Hub</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-200"
              >
                <History className="w-3.5 h-3.5" />
                <span>History &amp; Meds</span>
              </button>
              <button
                onClick={() => setActiveTab('telecom')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Tele-Consult</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC Vitals Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <HeartPulse className="w-3 h-3 text-red-500" /> Blood Pressure
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {patient.vitals?.bp} <span className={`text-[10px] font-bold ${patient.vitals?.bpColor}`}>{patient.vitals?.bpStatus}</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" /> SpO2 Oxygen
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {patient.vitals?.spo2}% <span className={`text-[10px] font-bold ${patient.vitals?.spo2Color}`}>{patient.vitals?.spo2Status}</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" /> Heart Rate
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {patient.vitals?.heartRate} bpm <span className={`text-[10px] font-bold ${patient.vitals?.heartRateColor}`}>{patient.vitals?.heartRateStatus}</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-500" /> Temperature
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {patient.vitals?.temp} <span className={`text-[10px] font-bold ${patient.vitals?.tempColor}`}>{patient.vitals?.tempStatus}</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Primary Center</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{patient.phcCenter.split('(')[0]}</p>
            </div>
          </div>

          {/* AI CADx Diagnostic Banner */}
          <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>AI Clinical Diagnostic Summary (Neural CADx Engine)</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-full">Active</span>
              </h3>
              {!aiSummaryVisible && !aiLoading && (
                <button
                  onClick={handleGenerateAI}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Analyze Records for {patient.name}
                </button>
              )}
            </div>

            {aiLoading && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-purple-700 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                <span>Processing CADx analysis on {patient.name}'s medical records and imaging...</span>
              </div>
            )}

            {aiSummaryVisible && (
              <div className="space-y-2 mt-2 pt-2 border-t border-purple-100">
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900">
                      Primary AI CADx Finding for {patient.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-black rounded uppercase">
                      Urgent Action
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1">{patient.criticalAlert}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Clinical findings, vitals (SpO2 {patient.vitals?.spo2}%, BP {patient.vitals?.bp}) and laboratory parameters evaluated. Correlate with active patient home medications and radiology series.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── ALL-IN-ONE INTERACTIVE MINI TABS ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Tab Headers */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200 overflow-x-auto bg-slate-50/80">
              {[
                { key: 'timeline', label: '📅 Clinical Timeline', count: timeline.length },
                { key: 'history', label: '📋 Medical History & Active Stock', count: patient.currentMedicationsStock?.length || 3 },
                { key: 'scans', label: '🩻 PACS Scan Viewer', count: patientStudies.length },
                { key: 'telecom', label: '📞 Telecommunication & Call', count: chatMessages.length },
                { key: 'rx', label: '💊 Digital Prescription (e-Rx)', count: rxList.length },
                { key: 'labs', label: '🔬 Lab & Pathology', count: patient.labResults?.length || 6 },
                { key: 'vitals', label: '📈 Vitals Trajectory', count: 5 }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    activeTab === t.key
                      ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-t-xl'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-5">

              {/* ── TAB 1: CLINICAL TIMELINE ── */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 mr-1">Filter:</span>
                      {[
                        { id: 'all', label: 'All Events' },
                        { id: 'scan', label: '🩻 Radiology' },
                        { id: 'lab', label: '🩸 Labs' },
                        { id: 'triage', label: '🚨 Village Triage' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setTimelineFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            timelineFilter === f.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">{timeline.length} records shown for {patient.name}</span>
                  </div>

                  <div className="space-y-3.5 pl-1">
                    {timeline.map((item, idx) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${typeColor(item.type)}`}>
                            {typeIcon(item.type)}
                          </div>
                          {idx < timeline.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[28px]" />
                          )}
                        </div>

                        <div className="pb-3 flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-blue-200 transition-colors">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.type}</span>
                              <h5 className="font-bold text-slate-900 text-sm mt-0.5">{item.title}</h5>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.urgency !== 'normal' && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border uppercase ${urgencyBadge(item.urgency)}`}>
                                  {item.urgency}
                                </span>
                              )}
                              <span className="text-xs text-slate-400 font-medium">{item.date} • {item.time}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.description}</p>

                          {item.aiDetected && (
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-700 font-bold bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1">
                              <Zap className="w-3.5 h-3.5 text-purple-600" />
                              <span>AI Flag: {item.aiCondition}</span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-200 pt-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.facility}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 2: PAST MEDICAL HISTORY & CURRENT MEDICINE STOCK ── */}
              {activeTab === 'history' && (
                <div className="space-y-5">

                  {/* Section 1: Chronic Conditions & Known Diagnoses */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-indigo-600" />
                        <span>Past Diagnosed Diseases &amp; Chronic Conditions ({patient.name})</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Linked to ABHA: {patient.abhaId}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {patient.pastMedicalHistory?.chronicDiseases.map((cd, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-1">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {cd.since}
                          </span>
                          <p className="font-extrabold text-slate-900 text-xs mt-1">{cd.name}</p>
                          <p className="text-[11px] text-slate-500">Status: {cd.status}</p>
                        </div>
                      ))}
                    </div>

                    {/* Allergies & Surgical History Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-red-50/70 border border-red-200 rounded-xl p-3 text-xs">
                        <span className="font-bold text-red-700 block text-[10px] uppercase">Drug &amp; Food Allergies</span>
                        <p className="font-bold text-red-900 mt-0.5">{patient.pastMedicalHistory?.allergies.join(', ')}</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Past Surgeries / Procedures</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{patient.pastMedicalHistory?.surgicalHistory.join(', ')}</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Family Medical History</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{patient.pastMedicalHistory?.familyHistory.join(', ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Current Medicine Stock Remaining at Patient's Home */}
                  <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                      <div>
                        <h4 className="font-black text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-indigo-700" />
                          <span>Current Active Medications &amp; Patient Home Stock Inventory</span>
                        </h4>
                        <p className="text-[11px] text-indigo-700">Real-time stock balance tracked via rural ASHA worker surveys</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowPharmacyOrderModal(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Order Refill via Pharmacy Portal
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {patient.currentMedicationsStock?.map((med, i) => {
                        const isLow = med.daysLeft <= 5;

                        return (
                          <div key={i} className={`bg-white rounded-xl p-3.5 border-2 shadow-xs space-y-2 ${
                            isLow ? 'border-amber-300' : 'border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-black text-slate-900 text-sm">{med.name}</p>
                                <p className="text-xs text-slate-500">{med.dose}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                isLow ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {med.refillStatus}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-semibold">Home Balance:</span>
                              <span className="font-black text-slate-900">{med.stockRemaining} {med.unit} ({med.daysLeft} days left)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Past Doctor Prescriptions History */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Past Doctor Prescriptions &amp; Treatment Records</span>
                    </h4>

                    <div className="space-y-3">
                      {patient.pastPrescriptions?.map(rx => (
                        <div key={rx.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono font-bold text-blue-700 text-xs">{rx.id}</span>
                              <span className="font-extrabold text-slate-900 text-sm ml-2">{rx.diagnosis}</span>
                            </div>
                            <span className="text-slate-400 font-medium">{rx.date} • {rx.doctor}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {rx.drugs.map((d, di) => (
                              <span key={di} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 text-xs">
                                💊 {d.name} — <span className="font-normal text-slate-500">{d.dose} ({d.days})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ── TAB 3: PACS SCAN VIEWER ── */}
              {activeTab === 'scans' && (
                <div className="space-y-4">
                  {/* PACS Toolbar */}
                  <div className="bg-slate-900 text-white rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 mr-1">Windowing:</span>
                      {[
                        { id: 'default', label: 'Default' },
                        { id: 'lung', label: '🫁 Lung (W:1500, L:-600)' },
                        { id: 'bone', label: '🦴 Bone (W:2000, L:350)' },
                        { id: 'invert', label: 'Invert' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setContrastMode(mode.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                            contrastMode === mode.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.2))}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-300 min-w-[3rem] text-center">
                        {(zoomLevel * 100).toFixed(0)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.2))}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setZoomLevel(1); setContrastMode('default'); }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                        title="Reset Viewport"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCaliperActive(!caliperActive)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                          caliperActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" /> Caliper (3.4cm)
                      </button>
                      <button
                        onClick={() => setShowAiOverlay(!showAiOverlay)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                          showAiOverlay ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {showAiOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} AI Overlay
                      </button>
                    </div>
                  </div>

                  {/* Viewport Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden min-h-[380px] relative flex items-center justify-center border border-slate-800">
                      <div
                        style={{
                          transform: `scale(${zoomLevel})`,
                          filter: contrastMode === 'lung' ? 'contrast(1.7) brightness(1.1)' :
                                  contrastMode === 'bone' ? 'contrast(2.2) brightness(0.9)' :
                                  contrastMode === 'invert' ? 'invert(1)' : 'none',
                          transition: 'transform 0.15s ease, filter 0.2s ease'
                        }}
                        className="max-h-[360px] max-w-full flex items-center justify-center p-4"
                      >
                        {activeStudy.fileUrl ? (
                          <img src={activeStudy.fileUrl} alt="PACS DICOM" className="max-h-[340px] object-contain rounded-md" />
                        ) : (
                          <div className="text-slate-600 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">High-Resolution DICOM Preview Mode</p>
                          </div>
                        )}
                      </div>

                      {/* AI CADx Bounding Box Overlay */}
                      {showAiOverlay && (
                        <div className="absolute top-[35%] right-[28%] border-2 border-red-500 bg-red-500/10 rounded-lg px-3 py-2 pointer-events-none animate-pulse">
                          <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded shadow">
                            CADx: Anomaly Detected ({activeStudy.aiAnalysis?.confidence || 92}%)
                          </span>
                        </div>
                      )}

                      {/* Caliper Overlay */}
                      {caliperActive && (
                        <div className="absolute inset-0 pointer-events-none">
                          <svg className="w-full h-full">
                            <line x1="120" y1="140" x2="260" y2="220" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                            <circle cx="120" cy="140" r="5" fill="#10b981" />
                            <circle cx="260" cy="220" r="5" fill="#10b981" />
                            <text x="190" y="170" fill="#10b981" fontSize="11" fontWeight="bold">
                              3.42 cm (Lesion Span)
                            </text>
                          </svg>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 text-[10px] font-mono text-emerald-400 bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs">
                        <span>{patient.name} • {patient.id}</span>
                        <br />
                        <span>MOD: {activeStudy.modality} • {activeStudy.bodyRegion}</span>
                      </div>
                    </div>

                    {/* Diagnostic Reporting */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Radiology Investigation Details</h4>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p><strong className="text-slate-700">Patient:</strong> {patient.name} ({patient.id})</p>
                          <p><strong className="text-slate-700">Study Date:</strong> {activeStudy.studyDate}</p>
                          <p><strong className="text-slate-700">Facility:</strong> {activeStudy.facility}</p>
                          <p><strong className="text-slate-700">Priority:</strong> <span className="font-bold text-red-600 uppercase">{activeStudy.urgency}</span></p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Doctor's Clinical Findings &amp; Impression</label>
                          <textarea
                            rows={4}
                            value={doctorNoteInput || savedDoctorNotes[selectedPatientId] || activeStudy.doctorFindings || ''}
                            onChange={e => setDoctorNoteInput(e.target.value)}
                            placeholder="Type radiologist impressions and diagnostic notes..."
                            className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      {saveToast && (
                        <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved to patient health record!
                        </div>
                      )}

                      <button
                        onClick={handleSaveDoctorNotes}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Save Diagnostic Impression
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: TELECOMMUNICATION & LIVE CONSULT ── */}
              {activeTab === 'telecom' && (
                <div className="space-y-4">
                  {/* Tele-Connect Control Strip */}
                  <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                        📡
                      </div>
                      <div>
                        <h4 className="font-black text-sm">eSanjeevani Telecommunication Terminal</h4>
                        <p className="text-xs text-emerald-200">
                          Direct rural tele-consult with {patient.name} &amp; {patient.ashaWorker}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!callActive ? (
                        <>
                          <button
                            onClick={() => setCallActive(true)}
                            className="px-4 py-2 bg-white text-emerald-800 font-extrabold text-xs rounded-xl hover:bg-emerald-50 flex items-center gap-2 transition-colors shadow-sm"
                          >
                            <Video className="w-4 h-4 text-emerald-600" />
                            <span>Start Video Tele-Consult</span>
                          </button>
                          <a
                            href={`tel:${patient.phone}`}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-400"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Audio Call ({patient.phone})</span>
                          </a>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-black/40 px-3 py-1.5 rounded-lg text-emerald-300 animate-pulse">
                            🔴 LIVE: {formatCallTime(callDuration)}
                          </span>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-2 rounded-xl text-white ${isMuted ? 'bg-amber-600' : 'bg-white/20 hover:bg-white/30'}`}
                          >
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`p-2 rounded-xl text-white ${isVideoOff ? 'bg-amber-600' : 'bg-white/20 hover:bg-white/30'}`}
                          >
                            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setCallActive(false)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            <PhoneOff className="w-4 h-4" />
                            <span>End Call</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Live Video Feed Simulator */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-2xl overflow-hidden min-h-[340px] flex flex-col justify-between p-4 relative border border-slate-800">
                      {callActive ? (
                        <>
                          <div className="flex items-center justify-between text-xs text-white z-10">
                            <span className="font-bold flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              {patient.name} ({patient.phcCenter})
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">WebRTC HD Stream</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center my-4">
                            {!isVideoOff ? (
                              <div className="text-center text-slate-300">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-4xl mx-auto mb-3">
                                  👨‍⚕️
                                </div>
                                <p className="font-bold text-sm text-white">Live Tele-Consultation with {patient.name}</p>
                                <p className="text-xs text-slate-400 mt-1">Audio &amp; Video Streams Connected with Rural PHC</p>
                              </div>
                            ) : (
                              <div className="text-center text-amber-300">
                                <VideoOff className="w-12 h-12 mx-auto mb-2 text-amber-400" />
                                <p className="text-xs">Camera Turned Off</p>
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-4 right-4 w-28 h-20 bg-slate-800 border-2 border-emerald-400 rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-slate-300">Doctor Feed</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
                            📱
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">Instant Tele-Consult Ready</h4>
                            <p className="text-xs text-slate-400 max-w-sm mt-1">
                              Initiate a secure ABDM-compliant tele-consultation with ASHA Worker <strong>{patient.ashaWorker}</strong> and patient <strong>{patient.name}</strong>.
                            </p>
                          </div>
                          <button
                            onClick={() => setCallActive(true)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" /> Start Video Consultation
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chat Messenger */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col h-[340px]">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>ASHA &amp; Patient Messenger</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Online
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 text-xs">
                        {chatMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] p-2.5 rounded-xl ${
                              msg.sender === 'doctor'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                            }`}>
                              <p className="text-[10px] font-bold opacity-75 mb-0.5">
                                {msg.sender === 'doctor' ? 'Dr. Medical Officer' : patient.ashaWorker.split('(')[0]} • {msg.time}
                              </p>
                              <p className="leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-200">
                        <input
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type clinical advice to ASHA..."
                          className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 5: DIGITAL PRESCRIPTION (e-Rx) ── */}
              {activeTab === 'rx' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Ayushman Bharat Digital Prescription (e-Rx)
                      </h4>
                      <p className="text-xs text-slate-500">Auto-routes directly to the PHC Pharmacy Dispensing Hub</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickProtocol('pneumonia')}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100 border border-blue-200"
                      >
                        ⚡ Pneumonia Protocol
                      </button>
                      <button
                        onClick={() => handleQuickProtocol('fracture')}
                        className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg hover:bg-amber-100 border border-amber-200"
                      >
                        ⚡ Fracture Protocol
                      </button>
                      <button
                        onClick={() => handleQuickProtocol('migraine')}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg hover:bg-purple-100 border border-purple-200"
                      >
                        ⚡ Migraine Relief
                      </button>
                    </div>
                  </div>

                  {rxSentSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Prescription signed with ABDM Digital Token &amp; sent to Pharmacy Hub!</span>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Diagnosis for {patient.name}</label>
                      <input
                        value={rxDiagnosis}
                        onChange={e => setRxDiagnosis(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-semibold"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 block">Prescribed Medicines (℞)</label>
                      {rxList.map((rx) => (
                        <div key={rx.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="sm:col-span-4">
                            <input
                              value={rx.drug}
                              onChange={e => {
                                const val = e.target.value;
                                setRxList(list => list.map(item => item.id === rx.id ? { ...item, drug: val } : item));
                              }}
                              placeholder="Drug name (e.g. Amoxicillin 500mg)"
                              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <select
                              value={rx.freq}
                              onChange={e => {
                                const val = e.target.value;
                                setRxList(list => list.map(item => item.id === rx.id ? { ...item, freq: val } : item));
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                            >
                              <option>Once daily (OD)</option>
                              <option>Twice daily (BD)</option>
                              <option>Thrice daily (TDS)</option>
                              <option>Four times daily (QID)</option>
                              <option>At bedtime (HS)</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <select
                              value={rx.duration}
                              onChange={e => {
                                const val = e.target.value;
                                setRxList(list => list.map(item => item.id === rx.id ? { ...item, duration: val } : item));
                              }}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                            >
                              <option>3 days</option>
                              <option>5 days</option>
                              <option>7 days</option>
                              <option>10 days</option>
                              <option>14 days</option>
                              <option>1 month</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              value={rx.instructions}
                              onChange={e => {
                                const val = e.target.value;
                                setRxList(list => list.map(item => item.id === rx.id ? { ...item, instructions: val } : item));
                              }}
                              placeholder="Instructions"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="sm:col-span-1 flex items-center justify-center">
                            {rxList.length > 1 && (
                              <button
                                onClick={() => setRxList(list => list.filter(item => item.id !== rx.id))}
                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">General Advice &amp; Warning Flags</label>
                      <textarea
                        rows={2}
                        value={rxAdvice}
                        onChange={e => setRxAdvice(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button
                        onClick={() => setShowPharmacyOrderModal(true)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-w-[200px]"
                      >
                        <ShoppingCart className="w-4 h-4" /> Ask Patient &amp; Order via Pharmacy Portal
                      </button>

                      <button
                        onClick={() => setShowPrintSlip(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" /> Print Official Slip &amp; Receipt
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 6: DYNAMIC LAB & PATHOLOGY ── */}
              {activeTab === 'labs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Pathology &amp; Biochemistry Investigations ({patient.name})
                      </h4>
                      <p className="text-xs text-slate-400">Diagnostic reports linked to ABHA ID: {patient.abhaId}</p>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">Facility: {patient.phcCenter}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="text-left p-3">Investigation Parameter</th>
                            <th className="text-left p-3">Observed Value</th>
                            <th className="text-left p-3 hidden sm:table-cell">Reference Biological Range</th>
                            <th className="text-right p-3">Clinical Evaluation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patient.labResults?.map((lab, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{lab.name}</td>
                              <td className="p-3 font-extrabold text-sm">
                                <span className={lab.status === 'critical' ? 'text-red-600' : lab.status === 'borderline' ? 'text-amber-600' : 'text-slate-800'}>
                                  {lab.value}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 hidden sm:table-cell">{lab.ref}</td>
                              <td className="p-3 text-right">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                                  lab.status === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                  lab.status === 'borderline' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {lab.alert}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 7: DYNAMIC VITALS TRAJECTORY ── */}
              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Vitals Trajectory &amp; Biomarker Monitoring for {patient.name}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">SpO2 Oxygen Trajectory</p>
                      <p className={`text-3xl font-black my-1 ${patient.vitals?.spo2Color}`}>
                        {patient.vitals?.spo2}%
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold">{patient.vitals?.spo2Status}</p>
                      <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${patient.vitals?.spo2 < 94 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${patient.vitals?.spo2}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">Blood Pressure Trend</p>
                      <p className="text-3xl font-black text-slate-900 my-1">
                        {patient.vitals?.bp}
                      </p>
                      <p className="text-[11px] text-amber-600 font-bold">{patient.vitals?.bpStatus}</p>
                      <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">Heart Rate Range</p>
                      <p className="text-3xl font-black text-slate-900 my-1">
                        {patient.vitals?.heartRate} bpm
                      </p>
                      <p className="text-[11px] text-emerald-600 font-bold">{patient.vitals?.heartRateStatus}</p>
                      <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Official Printable Prescription Slip & Receipt Modal */}
      {showPrintSlip && (
        <PrintablePrescriptionModal
          patient={patient}
          rxList={rxList}
          diagnosis={rxDiagnosis}
          advice={rxAdvice}
          doctorName="Dr. Medical Officer, MBBS, DNB"
          onClose={() => setShowPrintSlip(false)}
          onOrderPharmacy={() => setShowPharmacyOrderModal(true)}
        />
      )}

      {/* Online Pharmacy Order Dispatch Modal */}
      {showPharmacyOrderModal && (
        <PharmacyOrderDispatchModal
          patient={patient}
          rxList={rxList}
          diagnosis={rxDiagnosis}
          onClose={() => setShowPharmacyOrderModal(false)}
          onConfirmOrder={(ordId) => {
            setRxSentSuccess(true);
            setTimeout(() => setRxSentSuccess(false), 3500);
          }}
          onGoToPharmacy={onNavigateToPharmacy}
        />
      )}

    </div>
  );
}
