import React, { useState } from 'react';
import {
  FileText, Droplet, Pill, FileImage, Syringe, Stethoscope, Sparkles,
  ArrowRight, FlaskConical, Building2, Share2, Eye, Download, Check
} from 'lucide-react';

const CATEGORY_META = {
  'Lab Reports':   { Icon: FlaskConical, color: 'text-sky-600',    border: 'border-sky-200', bg: 'bg-sky-50',    label: 'LAB REPORT' },
  'Prescriptions': { Icon: Pill,         color: 'text-amber-600',  border: 'border-amber-200', bg: 'bg-amber-50', label: 'PRESCRIPTION' },
  'Scans':         { Icon: FileImage,    color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50',  label: 'SCAN & X-RAY' },
  'Vaccination':   { Icon: Syringe,      color: 'text-emerald-600',border: 'border-emerald-200', bg: 'bg-emerald-50',label: 'VACCINE' },
  'Hospital':      { Icon: Building2,    color: 'text-blue-600',   border: 'border-blue-200', bg: 'bg-blue-50',  label: 'HOSPITAL' },
  'Other':         { Icon: FileText,     color: 'text-slate-600',  border: 'border-slate-200', bg: 'bg-slate-50',  label: 'DOCUMENT' },
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBytes(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MedicalDocumentCard({ doc, onView }) {
  const [showAI, setShowAI] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = CATEGORY_META[doc.category] || CATEGORY_META['Other'];
  const sizeStr = fmtBytes(doc.file_size);

  const handleShare = (e) => {
    e.stopPropagation();
    const shareText = `RadVault Verified Health Document: ${doc.title || doc.file_name} (${doc.category}). Category: ${doc.category}.`;
    if (navigator.share) {
      navigator.share({
        title: doc.title || doc.file_name,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="bg-white rounded-[24px] border border-amber-100/80 shadow-[0_4px_20px_-8px_rgba(251,191,36,0.15)] hover:shadow-[0_8px_30px_-8px_rgba(251,191,36,0.25)] transition-all duration-300 overflow-hidden relative group flex flex-col h-full">
        
        <div className="p-5 sm:p-6 relative z-10 flex-1 flex flex-col">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${meta.bg} ${meta.border}`}>
              <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
            </div>
            
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              title="Share Document"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>

          {/* Main Content */}
          <h4 className="text-base sm:text-lg font-black text-[#16324F] leading-snug mb-1">
            {doc.title || doc.file_name}
          </h4>
          <p className="text-xs text-slate-500 font-medium truncate">{doc.file_name}</p>
          
          {doc.notes && (
            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic line-clamp-2">
              "{doc.notes}"
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 font-semibold">
            <span>{fmtDate(doc.created_at)}</span>
            {sizeStr && <span>{sizeStr}</span>}
          </div>
        </div>

        {/* Action Row */}
        <div className="px-5 pb-5 pt-0 flex items-center gap-2 relative z-10" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onView(doc)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-black py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View File</span>
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Explain</span>
          </button>
        </div>
      </div>

      {/* AI Explanation Modal */}
      {showAI && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowAI(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-200 space-y-4 text-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#16324F]">Medical Document Summary</h3>
                <p className="text-xs text-slate-400">{doc.category} · RadVault AI Assistant</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900">• Document Type: {doc.category}</p>
              <p className="text-slate-600">
                {doc.category === 'Prescriptions'
                  ? 'This prescription contains doctor-ordered medications. Ensure you follow dosage times and complete the prescribed course.'
                  : doc.category === 'Lab Reports'
                  ? 'This laboratory test report has been safely cataloged in your digital health locker. You can show it directly to your doctor during consultations.'
                  : 'Diagnostic imaging/scan record safely stored with high fidelity.'}
              </p>
            </div>

            <button
              onClick={() => setShowAI(false)}
              className="w-full py-3 bg-[#008F83] text-white font-extrabold text-xs rounded-xl shadow-xs"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}
    </>
  );
}