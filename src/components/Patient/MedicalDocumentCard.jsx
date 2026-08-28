import React, { useState } from 'react';
import { FileText, Droplet, Pill, FileImage, Syringe, Stethoscope, Sparkles } from 'lucide-react';

const CATEGORY_META = {
  'Lab Reports':   { emoji: 'ðŸ§ª', color: 'text-sky-600',     label: 'LAB REPORT' },
  'Prescriptions': { emoji: 'ðŸ’Š', color: 'text-violet-600',  label: 'PRESCRIPTION' },
  'Scans':         { emoji: 'ðŸ©»', color: 'text-amber-600',   label: 'SCAN & IMAGING' },
  'Vaccination':   { emoji: 'ðŸ’‰', color: 'text-emerald-600', label: 'VACCINATION' },
  'Hospital':      { emoji: 'ðŸ¥', color: 'text-rose-600',    label: 'HOSPITAL RECORD' },
  'Other':         { emoji: 'ðŸ“„', color: 'text-slate-500',   label: 'DOCUMENT' },
};

const SOURCE_STYLE = {
  'Self uploaded': 'text-slate-500',
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
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_-8px_rgba(251,191,36,0.15)] hover:border-amber-100 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col relative group">
        
        {/* Subtle geometric hover accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/0 group-hover:bg-amber-400/10 rounded-bl-[100px] transition-colors duration-500 pointer-events-none" />
        
        <div className="p-5 flex-1 relative z-10">
          {/* Top Row â€” emoji + category label + source badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{meta.emoji}</span>
              <span className={`text-[11px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${sourceCls}`}>
              {doc.source || 'SELF UPLOADED'}
            </span>
          </div>

          {/* Main Content */}
          <h4 className="text-[16px] font-black text-[#16324F] leading-snug mb-1">
            {doc.title || doc.file_name}
          </h4>
          <p className="text-[13px] text-[#64748B] font-medium truncate">{doc.file_name}</p>
          
          {doc.notes && (
            <p className="text-[12px] text-slate-400 mt-2 italic line-clamp-1">"{doc.notes}"</p>
          )}

          {/* Metadata row */}
          <div className="flex items-center justify-between mt-6">
            <span className="text-[12px] font-bold text-[#94A3B8]">{fmtDate(doc.created_at)}</span>
            {sizeStr && (
              <span className="text-[12px] font-bold text-[#94A3B8]">{sizeStr}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-slate-100" />

        {/* Action Row */}
        <div className="px-3 py-3 flex items-center gap-2 bg-slate-50/50" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onView(doc)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#16324F] text-white text-[12px] font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            View document â†’
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-100 py-2.5 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Understand this
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
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-[16px] font-black text-[#16324F] text-center mb-1">AI Health Summary</h3>
            <p className="text-[12px] text-center text-[#64748B] font-medium mb-5 leading-relaxed">
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