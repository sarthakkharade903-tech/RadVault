import React from 'react';
import { Stethoscope, FileText, Activity, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DoctorWorkspace({ onNavigateToPatientView }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Workspace Header */}
      <div className="bg-white border-2 border-[#800000]/40 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#FDF2F2] border-2 border-[#800000]/60 rounded-xl flex items-center justify-center text-2xl shadow-inner">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#212121]">
                  Doctor / Clinical Specialist Workspace
                </h1>
                <span className="text-[11px] font-extrabold bg-[#FDF2F2] text-[#800000] px-2 py-0.5 rounded-md border border-[#800000]/40">
                  Clinical Role
                </span>
              </div>
              <p className="text-xs text-[#555555] font-medium mt-0.5">
                Clinical case consultations, diagnostic imaging & report reviews, clinical assessment & follow-up recommendations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role Verified: Doctor
            </span>
          </div>
        </div>
      </div>

      {/* Role Foundation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 bg-[#FDF2F2] rounded-lg flex items-center justify-center text-[#800000] font-bold text-sm">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#212121]">Assigned Case Consultations</h3>
          <p className="text-xs text-[#555555] leading-relaxed">
            Review referral triage summaries, patient chief complaints, and frontline ASHA worker notes.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 bg-[#FDF2F2] rounded-lg flex items-center justify-center text-[#800000] font-bold text-sm">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#212121]">Imaging & Diagnostic Vault</h3>
          <p className="text-xs text-[#555555] leading-relaxed">
            Examine high-resolution MRI, CT, X-Ray scans, radiology reports, and longitudinal health history.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 bg-[#FDF2F2] rounded-lg flex items-center justify-center text-[#800000] font-bold text-sm">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#212121]">Assessment & Follow-up Advice</h3>
          <p className="text-xs text-[#555555] leading-relaxed">
            Record clinical diagnosis, prescribe treatment advice, and send structured follow-up instructions back to the ASHA worker.
          </p>
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#212121]">
          Clinical workspace routing established. Clinical case review will be integrated in subsequent phases.
        </span>
        {onNavigateToPatientView && (
          <button
            onClick={onNavigateToPatientView}
            className="text-xs font-bold text-[#008080] hover:text-[#006666] flex items-center gap-1 transition-colors"
          >
            Inspect Patient Records View <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
