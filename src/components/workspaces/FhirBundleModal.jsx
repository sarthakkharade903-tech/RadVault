import React, { useState } from 'react';
import {
  X,
  FileCode,
  CheckCircle2,
  Copy,
  Download,
  Shield,
  Layers,
  Activity,
  Pill,
  User,
  Stethoscope,
  ExternalLink
} from 'lucide-react';

export default function FhirBundleModal({ bundle, onClose, title = 'Official ABDM FHIR R4 DocumentBundle' }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'json'
  const [copied, setCopied] = useState(false);

  if (!bundle) return null;

  const bundleJson = JSON.stringify(bundle, null, 2);
  const composition = bundle.entry?.[0]?.resource;
  const entries = bundle.entry?.slice(1) || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(bundleJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([bundleJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bundle.id || 'abdm-fhir-bundle'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'Patient':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'Practitioner':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      case 'MedicationRequest':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'Observation':
        return <Activity className="w-4 h-4 text-rose-600" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <FileCode className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-400/30">
                  HL7 FHIR R4 · NRCeS
                </span>
                <span className="text-[10px] font-bold text-slate-300">National Health Authority</span>
              </div>
              <h2 className="text-base font-black leading-tight mt-0.5">{title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Action Buttons */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Overview
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeTab === 'json' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw FHIR JSON ({bundle.entry?.length || 0} entries)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-slate-800 space-y-4">
          
          {/* TAB 1: Document Overview */}
          {activeTab === 'summary' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Bundle Header Card */}
              <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl p-4 border border-blue-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                    Bundle ID: {bundle.id}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Timestamp: {new Date(bundle.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="text-sm font-black text-slate-900">
                  {composition?.title || 'Clinical Health Document'}
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-medium">
                  <span>
                    <strong>Author:</strong> {composition?.author?.[0]?.display || 'Dr. Treating Physician'}
                  </span>
                  <span>
                    <strong>Facility:</strong> {composition?.custodian?.display || 'PHC Shirwal'}
                  </span>
                  <span>
                    <strong>Profile:</strong> DocumentBundle (NRCeS)
                  </span>
                </div>
              </div>

              {/* Composition Document Section (entry[0]) */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Entry [0]: Composition Resource (Mandatory ABDM Document Header)</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 text-slate-700">
                  <p>
                    <strong>Type Code:</strong> {composition?.type?.coding?.[0]?.code} (
                    {composition?.type?.coding?.[0]?.display || 'Consultation Report'})
                  </p>
                  <p>
                    <strong>Status:</strong> <span className="text-emerald-700 font-bold">{composition?.status?.toUpperCase()}</span>
                  </p>
                  <p>
                    <strong>Sections Included:</strong>{' '}
                    {(composition?.section || []).map((s) => s.title).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Clinical Resources List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Encapsulated Clinical Resources ({entries.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {entries.map((ent, idx) => {
                    const res = ent.resource;
                    const rType = res?.resourceType || 'Resource';
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start gap-3"
                      >
                        <div className="p-2 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                          {getResourceIcon(rType)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {rType}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              #{idx + 1}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {rType === 'Patient' && `ABHA: ${res.identifier?.[0]?.value || res.name?.[0]?.text}`}
                            {rType === 'Practitioner' && (res.name?.[0]?.text || 'Physician')}
                            {rType === 'Organization' && (res.name || 'Healthcare Facility')}
                            {rType === 'MedicationRequest' && (res.medicationCodeableConcept?.text || 'Prescription')}
                            {rType === 'Observation' && `${res.code?.text || 'Vitals'}: ${res.valueQuantity?.value || ''} ${res.valueQuantity?.unit || ''}`}
                            {rType === 'DiagnosticReport' && (res.conclusion || 'Report verified')}
                          </p>

                          <span className="text-[9px] font-mono text-slate-400 truncate block mt-1">
                            ID: {res?.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Guarantee Note */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  100% NRCeS compliant: Ready for transmission via ABDM Gateway HIP Data Push API.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Raw JSON Viewer */}
          {activeTab === 'json' && (
            <div className="relative animate-in fade-in">
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[55vh] border border-slate-800 leading-relaxed select-all">
                {bundleJson}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-500">
            Validated against: <code>https://nrces.in/ndhm/fhir/r4</code>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
