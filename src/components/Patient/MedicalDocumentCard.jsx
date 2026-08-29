import React, { useState } from 'react';
import { FileText, Droplet, Pill, FileImage, Syringe, Stethoscope, Sparkles, ArrowRight, FlaskConical, Building2 } from 'lucide-react';

const CATEGORY_META = {
  'Lab Reports':   { Icon: FlaskConical, color: 'text-sky-500',    border: 'border-sky-200/60', bg: 'bg-sky-50',    label: 'LAB REPORT', shape: 'bg-gradient-to-tl from-sky-200/40 to-transparent border-t border-l border-sky-100/50 rounded-tl-full' },
  'Prescriptions': { Icon: Pill,         color: 'text-orange-500', border: 'border-orange-200/60', bg: 'bg-orange-50', label: 'PRESCRIPTION', shape: 'bg-gradient-to-tl from-orange-200/40 to-transparent border-t border-l border-orange-100/50 rounded-tl-full' },
  'Scans':         { Icon: FileImage,    color: 'text-amber-500',  border: 'border-amber-200/60', bg: 'bg-amber-50',  label: 'SCAN & IMAGING', shape: 'bg-gradient-to-tl from-amber-200/40 to-transparent border-t border-l border-amber-100/50 rounded-tl-[100px]' },
  'Vaccination':   { Icon: Syringe,      color: 'text-emerald-500',border: 'border-emerald-200/60', bg: 'bg-emerald-50',label: 'VACCINATION', shape: 'bg-gradient-to-tl from-emerald-200/40 to-transparent border-t border-l border-emerald-100/50 rounded-tl-full' },
  'Hospital':      { Icon: Building2,    color: 'text-amber-600',  border: 'border-amber-200/60', bg: 'bg-amber-50',  label: 'HOSPITAL RECORD', shape: 'bg-gradient-to-tl from-amber-200/40 to-transparent border-t border-l border-amber-100/50 rounded-tl-[100px]' },
  'Other':         { Icon: FileText,     color: 'text-amber-600',  border: 'border-amber-200/60', bg: 'bg-amber-50',  label: 'DOCUMENT', shape: 'bg-gradient-to-tl from-amber-200/30 to-transparent border-t border-l border-amber-100/50 rounded-tl-[100px]' },
};

const SOURCE_STYLE = {
  'Self uploaded': 'text-amber-500',
  'ASHA':          'text-emerald-600',
  'PHC':           'text-sky-600',
  'Hospital':      'text-violet-600',
  'Clinical':      'text-amber-600',
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
  const meta = CATEGORY_META[doc.category] || CATEGORY_META['Other'];
  const sourceCls = SOURCE_STYLE[doc.source] || SOURCE_STYLE['Self uploaded'];
  const sizeStr = fmtBytes(doc.file_size);

  return (
    <>
      <div className="bg-white rounded-[24px] border border-amber-100/60 shadow-[0_8px_30px_-12px_rgba(251,191,36,0.15)] hover:shadow-[0_12px_40px_-12px_rgba(251,191,36,0.3)] transition-all duration-500 overflow-hidden relative group flex flex-col h-full">
        
        {/* Decorative inner background shape (corner) */}
        <div className={`absolute -right-2 -bottom-2 w-40 h-40 ${meta.shape} opacity-80 group-hover:scale-110 transition-transform duration-700 pointer-events-none`} />
        
        <div className="p-6 relative z-10 flex-1 flex flex-col">
          {/* Top Row - icon + category label + source badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${meta.bg} ${meta.border}`}>
              <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${meta.color}`}>{meta.label}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${sourceCls} bg-white px-2 py-1 rounded-md border border-slate-100/50 shadow-sm`}>
              {doc.source || 'SELF UPLOADED'}
            </span>
          </div>

          {/* Main Content */}
          <h4 className="text-[17px] font-black text-[#16324F] leading-snug mb-1.5">
            {doc.title || doc.file_name}
          </h4>
          <p className="text-[13px] text-[#64748B] font-medium truncate mb-auto">{doc.file_name}</p>
          
          {doc.notes && (
            <p className="text-[12px] text-[#94A3B8] mt-2 italic line-clamp-1">"{doc.notes}"</p>
          )}

          {/* Metadata row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-[12px] font-bold text-[#94A3B8]">{fmtDate(doc.created_at)}</span>
            {sizeStr && (
              <span className="text-[12px] font-bold text-[#94A3B8]">{sizeStr}</span>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row items-center gap-3 relative z-10" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onView(doc)}
            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-[#16324F] text-white text-[12px] font-bold py-3 rounded-[16px] hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 group/btn"
          >
            View document <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-100/80 py-3 rounded-[16px] hover:bg-amber-100 hover:border-amber-200 transition-all hover:shadow-md hover:shadow-amber-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Understand this
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAI && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16324F]/30 backdrop-blur-sm p-4"
          onClick={() => setShowAI(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-amber-100">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-[16px] font-black text-[#16324F] text-center mb-1">AI Health Summary</h3>
            <p className="text-[13px] text-center text-[#64748B] font-medium mb-5 leading-relaxed">
              RadVault will turn this document into an easy-to-understand summary while keeping the original medical record completely unchanged.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-5">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-[12px] text-[#64748B] font-medium">Identify key findings from reports</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-[12px] text-[#64748B] font-medium">Explain medical terms in plain language</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-[12px] text-[#64748B] font-medium">Never replace your doctor's advice</p>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl px-4 py-3 text-center border border-amber-100 mb-2">
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Coming Soon</p>
              <p className="text-[11px] text-amber-600 font-bold mt-0.5">Powered by Kimi Vision AI</p>
            </div>
            <button
              onClick={() => setShowAI(false)}
              className="w-full text-[13px] font-bold text-[#64748B] hover:text-[#16324F] transition-colors py-3"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}