import React, { useState } from 'react';
import { X, Sparkles, FileText, Download, ShieldCheck, Calendar, Building2, Check, Share2 } from 'lucide-react';

export default function DocumentPreview({ doc, onClose }) {
  const [showAI, setShowAI] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const dataUrl = doc.previewUrl || doc.record_url || doc.report?.fileData || null;
  const isImage = dataUrl && (dataUrl.startsWith('data:image/') || dataUrl.startsWith('http') || doc.report?.fileType?.startsWith('image/'));
  const isPDF = dataUrl && (dataUrl.startsWith('data:application/pdf') || doc.report?.fileType === 'application/pdf');

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = doc.report?.fileName || `${doc.title || 'medical_record'}.png`;
    a.click();
  };

  const handleShare = () => {
    const shareText = `RadVault Verified Medical Record: ${doc.title} (${doc.bodyRegion || doc.report?.category || 'Clinical Document'}) at ${doc.facility || doc.facility_name || 'Healthcare Facility'}.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: doc.title,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl border-2 border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between shrink-0 bg-slate-50">
          <div className="pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                {doc.modality || doc.report?.category || 'MEDICAL RECORD'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {doc.date || (doc.created_at && new Date(doc.created_at).toLocaleDateString('en-IN'))}
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 leading-tight">
              {doc.title || doc.report?.fileName || 'Document Preview'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>📍 {doc.facility || doc.facility_name || 'Healthcare Facility'}</span>
              <span>·</span>
              <span>👨‍⚕️ {doc.doctor || doc.doctor_name || 'Treating Doctor'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* ── Preview Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 flex flex-col items-center justify-center min-h-[300px]">
          {isPDF ? (
            <iframe
              src={dataUrl}
              title={doc.title}
              className="w-full h-[450px] bg-white rounded-2xl border border-slate-200 shadow-xs"
            />
          ) : isImage ? (
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs max-h-[460px] flex items-center justify-center overflow-hidden">
              <img
                src={dataUrl}
                alt={doc.title}
                className="max-h-[440px] max-w-full rounded-xl object-contain"
              />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm space-y-3">
              <FileText className="w-12 h-12 text-[#008080] mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-800">{doc.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {doc.patientFriendlySummary || doc.report?.patientFriendlySummary || 'Diagnostic scan and structured clinical notes safely stored in vault.'}
              </p>
            </div>
          )}

          {/* Clinical Impression Snippet if present */}
          {(doc.report?.impression || doc.patientFriendlySummary) && (
            <div className="w-full mt-4 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#008080] block">
                Clinical Impression & Patient Summary
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {doc.report?.impression || doc.patientFriendlySummary}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => setShowAI(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI Explain</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {dataUrl && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* AI Plain-Language Explainer Modal */}
      {showAI && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowAI(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-amber-300 space-y-4 text-slate-800 animate-in fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Plain-Language Medical Summary</h3>
                <p className="text-[11px] text-slate-500 font-bold">RadVault AI Health Assistant</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900">• Document: {doc.title}</p>
              <p className="text-slate-600">
                {doc.patientFriendlySummary ||
                  doc.report?.patientFriendlySummary ||
                  'This document has been safely cataloged in your longitudinal health locker. You can securely share it with any doctor or ASHA worker during consultations.'}
              </p>
              <p className="text-[10px] text-slate-400 italic">
                * Note: AI summaries are for informational guidance. Consult your PHC medical officer for clinical diagnosis.
              </p>
            </div>

            <button
              onClick={() => setShowAI(false)}
              className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
