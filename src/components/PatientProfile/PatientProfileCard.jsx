import React, { useState } from 'react';
import { Copy, Check, Phone, MapPin } from 'lucide-react';

export default function PatientProfileCard({ patient, onTriggerEmergencyQR: _onTriggerEmergencyQR }) {
  const [copied, setCopied] = useState(false);

  const abha = patient.abhaId || patient.unified_id || '91-8921-4402-9912';

  const handleCopyAbha = () => {
    navigator.clipboard.writeText(abha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xs space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl">
            {patient.fullName?.[0] || 'P'}
          </div>
          <div>
            <h3 className="font-black text-lg text-[#16324F] leading-tight">{patient.fullName}</h3>
            <p className="text-xs text-slate-500 font-bold">
              {patient.age} yrs • {patient.gender} • {patient.bloodGroup || 'Blood Group O+'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
          ● {patient.consentStatus || 'Verified Record'}
        </span>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            ABHA ID / Unified Identity
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono font-black text-sm text-[#16324F]">{abha}</span>
            <button
              onClick={handleCopyAbha}
              className="p-1 text-slate-400 hover:text-[#008F83] rounded-lg transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Contact Number
          </span>
          <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#008F83]" />
            {patient.phone || '+91 98765 43210'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Date of Birth
          </span>
          <span className="font-bold text-slate-800">{patient.dob || '15 Aug 1980'}</span>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Ayushman / Health Scheme
          </span>
          <span className="font-bold text-slate-800">
            {patient.insurance?.provider || 'PM-JAY Eligible'} (Active)
          </span>
        </div>
      </div>

      {/* Address */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
          Village / Residential Address
        </span>
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          {patient.address || 'Shirwal Village, Khandala Block, Satara District, Maharashtra'}
        </span>
      </div>

      {/* Emergency Contact */}
      <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
            Primary Emergency Contact
          </span>
          <p className="font-black text-slate-900 mt-0.5">
            {patient.emergencyContact?.name || 'Suresh Kumar'} ({patient.emergencyContact?.relationship || 'Spouse'})
          </p>
          <p className="text-slate-500 font-bold">{patient.emergencyContact?.phone || '+91 98765 11223'}</p>
        </div>

        <a
          href={`tel:${patient.emergencyContact?.phone || '9876511223'}`}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer w-fit"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Contact</span>
        </a>
      </div>
    </div>
  );
}
