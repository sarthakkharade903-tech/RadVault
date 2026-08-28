import React, { useState } from 'react';
import { Share2, Link2, Copy, X, CheckCircle2, Lock } from 'lucide-react';

export default function ShareModal({ record, isOpen, onClose }) {
  if (!isOpen) return null;
  const [copied, setCopied] = useState(false);
  const shareLink = `https://radvault.care/shared/${record.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#008080]/10 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#008080]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Share Record</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4 truncate">{record.title}</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 text-slate-500">
              <Link2 className="w-4 h-4 shrink-0" />
              <span className="text-xs truncate">{shareLink}</span>
            </div>
            <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-[#008080] hover:bg-[#008080]/10 rounded-md shrink-0">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-4 flex items-start gap-2 bg-[#FF9933]/10 p-3 rounded-lg border border-[#FF9933]/20">
            <Lock className="w-4 h-4 text-[#855B00] shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-[#855B00] font-medium">Link expires in 7 days. Anyone with the link can view this document securely.</p>
          </div>
        </div>
      </div>
    </div>
  );
}