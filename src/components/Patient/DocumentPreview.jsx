import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileText, Loader2 } from 'lucide-react';
import { getDocumentById } from '../../services/vaultService';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtBytes(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const CATEGORY_LABELS = {
  'Lab Reports':   'LAB REPORT',
  'Prescriptions': 'PRESCRIPTION',
  'Scans':         'SCAN & IMAGING',
  'Vaccination':   'VACCINATION',
  'Hospital':      'HOSPITAL RECORD',
  'Other':         'DOCUMENT',
};

const SOURCE_STYLE = {
  'Self uploaded': 'bg-slate-100 text-slate-600',
  'ASHA':          'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'PHC':           'bg-sky-50 text-sky-700 border border-sky-200',
  'Hospital':      'bg-violet-50 text-violet-700 border border-violet-200',
  'Clinical':      'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function DocumentPreview({ doc, onClose }) {
  const [fullDoc, setFullDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFull() {
      setLoading(true);
      const { data, error: fetchErr } = await getDocumentById(doc.id);
      if (fetchErr || !data) setError('Could not load document.');
      else setFullDoc(data);
      setLoading(false);
    }
    fetchFull();
  }, [doc.id]);

  const isPDF   = doc.file_type === 'application/pdf';
  const isImage = doc.file_type?.startsWith('image/');
  const dataUrl = fullDoc?.file_data || null;
  const sizeStr = fmtBytes(doc.file_size);
  const catLabel = CATEGORY_LABELS[doc.category] || 'DOCUMENT';
  const sourceCls = SOURCE_STYLE[doc.source] || SOURCE_STYLE['Self uploaded'];

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = doc.file_name;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#16324F]/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '93dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div className="pr-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#008F83] mb-1">{catLabel}</p>
            <h2 className="text-[16px] font-black text-[#16324F] leading-snug">{doc.title || doc.file_name}</h2>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-[#94A3B8]">{fmtDate(doc.created_at)}</span>
              {sizeStr && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-[11px] font-bold text-[#94A3B8]">{sizeStr}</span>
                </>
              )}
            </div>
            <div className="mt-2">
              <span className={`text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${sourceCls}`}>
                {doc.source || 'Self uploaded'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* ── Document Preview Area ── */}
        <div className="flex-1 overflow-y-auto bg-[#F8F9FA] min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#008F83]" />
              <p className="text-[12px] font-bold text-slate-400">Loading document…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 p-6 text-center">
              <FileText className="w-12 h-12 text-slate-200" />
              <p className="text-[13px] font-black text-[#16324F]">Preview unavailable</p>
              <p className="text-[11px] text-slate-400">{error}</p>
            </div>
          ) : !dataUrl ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 p-6 text-center">
              <FileText className="w-12 h-12 text-slate-200" />
              <p className="text-[13px] font-black text-[#16324F]">No file data available</p>
              <p className="text-[11px] text-slate-400">Re-upload this document to view it.</p>
            </div>
          ) : isPDF ? (
            <iframe
              src={dataUrl}
              title={doc.file_name}
              className="w-full bg-white"
              style={{ height: 'min(540px, 60dvh)', border: 'none' }}
            />
          ) : isImage ? (
            <div className="p-4">
              <img
                src={dataUrl}
                alt={doc.title || doc.file_name}
                className="w-full rounded-2xl object-contain bg-white max-h-[55dvh]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3 p-6 text-center">
              <FileText className="w-12 h-12 text-slate-200" />
              <p className="text-[13px] font-black text-[#16324F]">Cannot preview this file type</p>
              <p className="text-[11px] text-slate-400">Download it to open in a compatible app.</p>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="bg-white border-t border-slate-100 px-5 py-4 flex gap-3 shrink-0">
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-slate-50 text-[#16324F] font-bold text-[12px] py-3 rounded-2xl hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            ↓ Download
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 font-bold text-[12px] py-3 rounded-2xl border border-amber-200 hover:from-amber-100 hover:to-amber-100 transition-colors"
            onClick={() => alert('AI Health Summaries — powered by Kimi Vision AI — are coming soon. RadVault will turn this document into a plain-language summary while keeping the original unchanged.')}
          >
            <Sparkles className="w-4 h-4" /> Understand this report
          </button>
        </div>
      </div>
    </div>
  );
}
