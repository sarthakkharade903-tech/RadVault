import React, { useState } from 'react';
import {
  FileText,
  Pill,
  FileImage,
  Syringe,
  Building2,
  Share2,
  Eye,
  Check,
  Sparkles,
  FlaskConical
} from 'lucide-react';

const CATEGORY_META = {
  'Prescriptions': { Icon: Pill, color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50', label: 'PRESCRIPTION' },
  'Lab Reports': { Icon: FlaskConical, color: 'text-sky-700', border: 'border-sky-200', bg: 'bg-sky-50', label: 'LAB REPORT' },
  'Scans & X-Rays': { Icon: FileImage, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50', label: 'SCAN & X-RAY' },
  'XR': { Icon: FileImage, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50', label: 'X-RAY SCAN' },
  'CT': { Icon: FileImage, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50', label: 'CT SCAN' },
  'MRI': { Icon: FileImage, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50', label: 'MRI SCAN' },
  'Vaccination': { Icon: Syringe, color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50', label: 'VACCINE' },
  'Hospital Discharge': { Icon: Building2, color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50', label: 'HOSPITAL' },
  'Other': { Icon: FileText, color: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-50', label: 'DOCUMENT' },
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MedicalDocumentCard({ doc, onView }) {
  const [copied, setCopied] = useState(false);
  
  const categoryKey = doc.report?.category || doc.modality || doc.bodyRegion || 'Other';
  const meta = CATEGORY_META[categoryKey] || CATEGORY_META[doc.modality] || CATEGORY_META['Other'];
  const Icon = meta.Icon;

  const handleShare = (e) => {
    e.stopPropagation();
    const shareText = `RadVault Verified Medical Record: ${doc.title} (${meta.label}) from ${doc.facility || doc.facility_name || 'RadVault'}.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: doc.title,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#008080]/60 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${meta.bg} ${meta.border}`}>
            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-[#008080] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            title="Share Document"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Title & Metadata */}
        <h4 className="text-base font-black text-slate-900 group-hover:text-[#008080] transition-colors leading-snug mb-1">
          {doc.title}
        </h4>
        <p className="text-xs text-slate-500 font-medium">
          {doc.facility || doc.facility_name || 'Healthcare Facility'} · {doc.doctor || doc.doctor_name || 'Verified Clinician'}
        </p>

        {/* Impression / Notes */}
        {(doc.report?.impression || doc.patientFriendlySummary || doc.report?.notes) && (
          <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium line-clamp-2">
            "{doc.report?.impression || doc.patientFriendlySummary || doc.report?.notes}"
          </p>
        )}
      </div>

      {/* Date & Action Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-bold">
          {doc.date || fmtDate(doc.created_at)}
        </span>

        <button
          type="button"
          onClick={() => onView(doc)}
          className="px-3.5 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Record</span>
        </button>
      </div>
    </div>
  );
}
