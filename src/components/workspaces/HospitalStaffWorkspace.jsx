import React from 'react';
import { Building2, Inbox, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HospitalStaffWorkspace({ onNavigateToPatientView }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Workspace Header */}
      <div className="bg-white border-2 border-[#008080]/40 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#E6F2F2] border-2 border-[#008080]/60 rounded-xl flex items-center justify-center text-2xl shadow-inner">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#212121]">
                  Hospital Staff / Operations Workspace
                </h1>
                <span className="text-[11px] font-extrabold bg-[#E6F2F2] text-[#008080] px-2 py-0.5 rounded-md border border-[#008080]/40">
                  Operational Role
                </span>
              </div>
              <p className="text-xs text-[#555555] font-medium mt-0.5">
                Hospital referral intake queue, specialist doctor routing, patient arrival marking & bed/OPD management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role Verified: Hospital Staff
            </span>
          </div>
        </div>
      </div>

      {/* Role Foundation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 bg-[#E6F2F2] rounded-lg flex items-center justify-center text-[#008080] font-bold text-sm">
            <Inbox className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#212121]">Incoming Referral Queue</h3>
          <p className="text-xs text-[#555555] leading-relaxed">
            Monitor incoming ASHA referrals filtered by clinical priority (RED Emergency, ORANGE Urgent, GREEN Routine).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 bg-[#E6F2F2] rounded-lg flex items-center justify-center text-[#008080] font-bold text-sm">
            <UserCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#212121]">Doctor Assignment</h3>
          <p className="text-xs text-[#555555] leading-relaxed">
            Assign cases to verified department specialists (Cardiology, Orthopedics, Neurology, General Medicine).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 bg-[#E6F2F2] rounded-lg flex items-center justify-center text-[#008080] font-bold text-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-[#212121]">Arrival & Status Tracking</h3>
          <p className="text-xs text-[#555555] leading-relaxed">
            Mark patient arrival at facility, track consultation progress, and coordinate discharge/referral closure.
          </p>
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#212121]">
          Hospital Operations routing established. Operational dashboards will be activated in subsequent phases.
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
