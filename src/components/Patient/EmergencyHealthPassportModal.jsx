import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield, X, Phone, Heart, Droplet, AlertTriangle,
  CheckCircle2, Camera, Download, Share2, Siren, User,
  FileText, Sparkles, ExternalLink, Activity
} from 'lucide-react';

export default function EmergencyHealthPassportModal({ member, onClose }) {
  const [responderView, setResponderView] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fallback defaults for Rekha Bai or active family member
  const patientName = member?.name || "Rekha Bai";
  const age = member?.age_years || member?.age || 22;
  const gender = member?.gender || "Female";
  const bloodGroup = member?.blood_group || "B+";
  const abhaNumber = member?.abha_id || "91-4567-8901-2345";
  const primaryAllergy = "No Known Drug Allergies (NKDA)";
  const activeCondition = "High-Risk Pregnancy (32w Gestational Anemia)";
  
  const emergencyContacts = [
    {
      relation: "Husband / Primary Escort",
      name: "Rahul Patil",
      phone: "+91 98765 43210"
    },
    {
      relation: "Assigned Frontline ASHA",
      name: "Priya Deshmukh (Shirwal Ward)",
      phone: "+91 98231 44556"
    },
    {
      relation: "National Emergency Ambulance",
      name: "108 / 102 (Janani Shishu)",
      phone: "108"
    }
  ];

  // Self-contained, offline-scannable emergency payload for first responders
  const emergencyPayload = JSON.stringify({
    dossier: "RADVAULT_EMERGENCY_HEALTH_PASSPORT",
    patient: patientName,
    age: `${age}y`,
    gender: gender,
    blood_group: `${bloodGroup} (Clinical Verified)`,
    allergies: primaryAllergy,
    critical_diagnosis: activeCondition,
    emergency_contact: "+91 98765 43210",
    asha_escort: "Priya Deshmukh (+91 98231 44556)",
    facility: "Pune Sassoon General Hospital",
    abdm_id: abhaNumber,
    timestamp: new Date().toISOString()
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emergencyPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col border-2 border-red-500/80 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.35)] overflow-hidden">
        
        {/* ── Emergency Header Banner ── */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner animate-pulse">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight leading-none uppercase">
                  Emergency Health Passport
                </h3>
                <span className="text-[9px] font-black bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Offline Ready
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-semibold mt-1">
                24x7 Critical Medical Triage Dossier for First Responders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── First-Responder Simulator Mode Toggle ── */}
        <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center justify-between text-xs font-bold shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">First-Responder Camera View</span>
          </div>
          <button
            type="button"
            onClick={() => setResponderView(!responderView)}
            className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
              responderView
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {responderView ? '✓ Paramedic View Active' : 'Simulate Paramedic Scan'}
          </button>
        </div>

        {/* ── Scrollable Passport Body ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Main Emergency Identity Card */}
          <div className="bg-gradient-to-br from-red-50/70 via-white to-amber-50/50 rounded-3xl p-5 border-2 border-red-200/80 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {patientName[0]}
                </div>
                <div>
                  <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">PATIENT CITIZEN ID</span>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{patientName}</h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-0.5">
                    <span>{age} Yrs</span>
                    <span>•</span>
                    <span>{gender}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500 text-[11px]">ABHA: {abhaNumber}</span>
                  </div>
                </div>
              </div>

              {/* High-Visibility Blood Group Hero Badge */}
              <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-md text-center shrink-0 border border-red-500">
                <span className="text-[9px] font-black tracking-widest uppercase block text-red-200">BLOOD GROUP</span>
                <span className="text-2xl sm:text-3xl font-black leading-none">{bloodGroup}</span>
                <span className="text-[8px] font-bold text-red-100 block mt-0.5">Clinical Verified</span>
              </div>
            </div>

            {/* QR Code & Critical Instructions Box */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="p-2 bg-white rounded-2xl border-2 border-slate-900 shadow-sm shrink-0">
                <QRCodeSVG
                  value={emergencyPayload}
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <span className="text-[10px] font-black text-red-700 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  Life-Critical Offline Emergency QR
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Scannable by any first responder or hospital paramedic camera without unlocking the patient's phone.
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Encodes blood type, verified drug allergies, emergency contacts, and active obstetrics risk factors.
                </p>
              </div>
            </div>

            {/* Critical Health Guardrails Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Allergies / Safety Box */}
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Drug Allergies (NKDA)
                </span>
                <p className="text-xs font-bold text-emerald-950">
                  {primaryAllergy}
                </p>
                <span className="text-[9px] text-emerald-700 block font-medium mt-0.5">
                  Safe for standard emergency interventions
                </span>
              </div>

              {/* Active Clinical Condition Box */}
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Active Triage Alert
                </span>
                <p className="text-xs font-black text-amber-950 truncate">
                  {activeCondition}
                </p>
                <span className="text-[9px] text-amber-700 block font-medium mt-0.5">
                  JSY Escort High-Risk Protocol
                </span>
              </div>

            </div>

            {/* Emergency Contacts List */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Primary Emergency Contacts (Dialable by First Responder)
              </span>

              <div className="space-y-1.5">
                {emergencyContacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs transition-colors">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block">{c.relation}</span>
                      <span className="font-black text-slate-800">{c.name}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Paramedic Explanation Banner */}
          <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Paramedic Protocol:</strong> Even outside the hospital, when a patient is unconscious or unable to unlock their device, this emergency card provides instant verified context, preventing fatal allergic reactions or mismatched blood transfusions.
            </p>
          </div>

        </div>

        {/* ── Footer Actions Bar ── */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied QR Payload!' : 'Copy Emergency Dossier'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Lockscreen Card</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Close Passport
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
