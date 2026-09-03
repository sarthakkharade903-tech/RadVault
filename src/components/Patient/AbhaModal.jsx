import React, { useState, useMemo } from 'react';
import {
  Shield,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  Smartphone,
  FileCheck,
  ArrowLeft,
  Loader2,
  Info
} from 'lucide-react';

export default function AbhaModal({
  isOpen,
  onClose,
  patient = {}
}) {
  const [step, setStep] = useState(1); // 1: Card View, 2: Create / Link Choice, 3: Link Existing, 4: OTP Simulation
  const [authMethod, setAuthMethod] = useState('aadhaar'); // 'aadhaar' | 'mobile'
  const [inputVal, setInputVal] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAbha, setCustomAbha] = useState('');

  const patientName = patient.full_name || patient.name || 'Ramesh Deshmukh';
  const rawGender = patient.gender || 'Male';
  const age = patient.age ? `${patient.age} yrs` : '48 yrs';
  const bloodGroup = patient.blood_group || patient.bloodGroup || 'B+';
  const unifiedId = patient.unified_id || patient.id || 'MH-P-10042';

  // ABHA ID formatting derived cleanly from unified patient ID
  const generatedAbha = useMemo(() => {
    if (customAbha) return customAbha;
    if (patient.abha_id) return patient.abha_id;
    const hash = Math.abs(unifiedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000) % 9000 + 1000);
    return `91-${hash}-4821-3920`;
  }, [customAbha, patient.abha_id, unifiedId]);

  const abhaAddress = `${patientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@abdm`;

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (!inputVal.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 500);
  };

  const handleVerifyOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const hash = Math.abs(unifiedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 2000) % 9000 + 1000);
      setCustomAbha(`91-${hash}-7741-6204`);
      setStep(1);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50/80 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  ABHA Digital Health ID
                </h3>
                <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                  Prototype Demo
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                ABDM-Aligned Patient Identity Architecture
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* ══ STEP 1: DIGITAL ABHA CARD VIEW ══ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="bg-teal-50 text-teal-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-teal-200 shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Digital Health ID (Sandbox)
                </span>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                >
                  Link ID / Simulate OTP
                </button>
              </div>

              {/* ── Tactile Digital ABHA Card ── */}
              <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/60 rounded-3xl border-2 border-amber-300 p-5 shadow-lg relative overflow-hidden text-slate-800">
                {/* Tricolor Header */}
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs text-xs font-black">
                      🇮🇳
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 tracking-wider leading-none">NATIONAL HEALTH AUTHORITY</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Ayushman Bharat Digital Mission (ABDM Aligned)</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md shadow-2xs">
                    ABHA PROTOTYPE
                  </span>
                </div>

                {/* Card Main Body */}
                <div className="flex items-center gap-4 pt-4">
                  {/* Avatar Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-amber-300/40 shrink-0 border-2 border-white">
                    {patientName.charAt(0).toUpperCase()}
                  </div>

                  {/* Demographic Details */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black text-slate-900 leading-tight truncate">{patientName}</h4>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">
                      {rawGender} · {age} · <span className="text-rose-700 font-black">Blood Group: {bloodGroup}</span>
                    </p>
                    <p className="text-[10px] font-mono font-bold text-teal-800 mt-0.5 truncate">
                      PHR: {abhaAddress}
                    </p>
                  </div>

                  {/* Patient Health QR Code (Pure SVG) */}
                  <div className="p-2 bg-white rounded-2xl shadow-xs border border-amber-200 shrink-0 flex flex-col items-center">
                    <svg className="w-12 h-12 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm-4-2h2v4h-2v-4zm2 4h2v4h-2v-4zm2 0h2v2h-2v-2zm0 2v2h2v-2h-2zm-4 0h2v2h-2v-2z" />
                    </svg>
                    <span className="text-[7px] font-black text-slate-400 uppercase mt-0.5 tracking-wider">Patient QR</span>
                  </div>
                </div>

                {/* 14-Digit ABHA Number Box */}
                <div className="mt-4 p-3 bg-white/95 backdrop-blur-xs rounded-2xl border border-amber-200 text-center shadow-2xs">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">14-Digit ABHA Health ID (Prototype)</p>
                  <p className="text-lg font-mono font-black text-slate-900 tracking-[0.12em] leading-tight mt-0.5">
                    {generatedAbha}
                  </p>
                </div>

                {/* Footer Link */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-teal-800 font-bold">
                  <span>✓ Unified Patient Registry Linked</span>
                  <span>ID: {unifiedId}</span>
                </div>
              </div>

              {/* Honest ABDM Alignment Notice */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-950 font-medium space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Prototype Demonstration Notice</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  This digital card demonstrates how RadVault's Unified Patient Registry maps directly to national 14-digit ABHA identities. In production deployment, live identity issuance is performed via official NHA ABDM API gateways.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: LINK OR CREATE SELECTION (DEMO SIMULATION) ══ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Card
              </button>

              <div>
                <h3 className="text-base font-black text-slate-900">Simulate ABHA Linking (Demo)</h3>
                <p className="text-slate-500 font-medium text-xs mt-0.5">
                  Demonstrate how an existing ABHA or mobile verification workflow links to a patient record.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Enter Existing 14-Digit ABHA</h4>
                      <p className="text-[11px] text-slate-500">Attach an already issued Ayushman Bharat Health Account</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('aadhaar');
                    setStep(3);
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-[#008080] bg-white hover:bg-teal-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#008080] flex items-center justify-center font-bold">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Simulate Aadhaar / Mobile OTP Flow</h4>
                      <p className="text-[11px] text-slate-500">Walk through the standard ABDM authentication workflow</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#008080] group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: INPUT NUMBER ══ */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div>
                <h3 className="text-base font-black text-slate-900">Enter Identifier (Demo Simulation)</h3>
                <p className="text-slate-500 font-medium text-xs mt-0.5">
                  Enter Aadhaar or Mobile to simulate OTP delivery.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('aadhaar')}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'aadhaar' ? 'bg-[#008080] text-white border-[#008080]' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Aadhaar Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('mobile')}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'mobile' ? 'bg-[#008080] text-white border-[#008080]' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile OTP Demo</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  {authMethod === 'aadhaar' ? 'Aadhaar (12 Digits - Demo)' : 'Mobile Phone (10 Digits - Demo)'}
                </label>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={authMethod === 'aadhaar' ? 'XXXX-XXXX-XXXX' : '98XXXXXXXX'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <button
                type="button"
                disabled={loading || !inputVal.trim()}
                onClick={handleSendOtp}
                className="w-full py-3 bg-[#FF9933] hover:bg-[#e68a2e] disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Simulate Send OTP →</span>}
              </button>
            </div>
          )}

          {/* ══ STEP 4: OTP VERIFICATION SIMULATION ══ */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Identifier
              </button>

              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">Simulated OTP Verification</h3>
                <p className="text-slate-500 font-medium text-xs">
                  Demonstration of ABDM 6-digit OTP confirmation step.
                </p>
              </div>

              <div className="space-y-1 max-w-xs mx-auto text-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full p-3 text-center bg-slate-50 border-2 border-[#008080] focus:bg-white rounded-2xl text-lg font-mono font-black text-slate-900 tracking-[0.4em] outline-none"
                />
                <span className="text-[10px] text-slate-400 font-bold block pt-1">
                  Demo hint: Enter any 6 digits (e.g. 123456)
                </span>
              </div>

              <button
                type="button"
                disabled={loading || otp.length < 4}
                onClick={handleVerifyOtp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Demo Verification ✓</span>}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
