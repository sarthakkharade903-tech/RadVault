import React, { useState } from 'react';
import { Clock, AlertTriangle, Building2, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { derivePatientNextAction } from '../../services/encounterService';

export default function AshaTodayView({
  encounters = [],
  patients = [],
  followUpTasks = {},
  onSelectPatient,
  onCompleteFollowUp
}) {
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'URGENT' | 'DUE_TODAY' | 'WAITING' | 'UPCOMING'

  const { overdue = [], dueToday = [] } = followUpTasks;

  // 1. Urgent / High Medical Risk
  const urgentCases = encounters.filter(
    (e) => e.priority === 'HIGH' || e.priority === 'RED' || (e.dangerSigns && e.dangerSigns.length > 0)
  );

  // 2. Waiting for Hospital Response
  const waitingConsultations = encounters.filter(
    (e) => e.outcome === 'REFERRAL_CREATED' && (!e.liveStatus || e.liveStatus === 'Pending')
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Today's Field Work Queue</h1>
          <p className="text-xs text-slate-500 font-medium">
            Prioritized operational tasks: Emergency escalations, scheduled follow-ups, and pending hospital consultations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 p-2 rounded-xl self-start sm:self-auto shadow-2xs">
          <span className="text-slate-500">Tasks Due Today:</span>
          <span className="bg-[#008080] text-white px-2 py-0.5 rounded-md font-black">
            {urgentCases.length + overdue.length + dueToday.length}
          </span>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveCategory('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            activeCategory === 'ALL'
              ? 'bg-[#008080] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Items ({urgentCases.length + overdue.length + dueToday.length + waitingConsultations.length})
        </button>

        {urgentCases.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveCategory('URGENT')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'URGENT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Urgent ({urgentCases.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveCategory('DUE_TODAY')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeCategory === 'DUE_TODAY'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Due Today ({overdue.length + dueToday.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('WAITING')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeCategory === 'WAITING'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Waiting Response ({waitingConsultations.length})</span>
        </button>
      </div>

      {/* ── Section 1: Urgent Emergencies ── */}
      {(activeCategory === 'ALL' || activeCategory === 'URGENT') && urgentCases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-rose-700 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" />
            <span>Urgent Medical Attention ({urgentCases.length})</span>
          </div>

          <div className="space-y-2.5">
            {urgentCases.map((enc) => {
              const matched = patients.find((p) => p.id === enc.patientId || p.unified_id === enc.patientUnifiedId) || {
                id: enc.patientId,
                unified_id: enc.patientUnifiedId,
                full_name: enc.patientName,
                vitals: enc.vitals
              };

              const nextAction = derivePatientNextAction(matched, encounters);

              return (
                <div
                  key={enc.id}
                  className="p-4 sm:p-5 bg-rose-50/60 border-2 border-rose-300 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-slate-900">{enc.patientName}</span>
                      <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-rose-200">
                        {enc.patientUnifiedId}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                        🔴 EMERGENCY
                      </span>
                    </div>

                    <p className="text-xs text-rose-950 font-bold">
                      Reason: <span className="font-normal text-rose-800">{enc.complaint || 'Flagged danger signs'}</span>
                    </p>

                    <div className="p-2 bg-white rounded-xl border border-rose-200 text-xs text-rose-900 font-bold">
                      Next Action: <span className="font-extrabold text-rose-700">{nextAction.actionLabel}</span> ({nextAction.reason})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPatient(matched)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-colors shadow-xs self-start sm:self-center cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Open Patient Record</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 2: Overdue & Due Today Follow-ups ── */}
      {(activeCategory === 'ALL' || activeCategory === 'DUE_TODAY') && (overdue.length > 0 || dueToday.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wide">
            <Clock className="w-4 h-4" />
            <span>Follow-ups Requiring Action ({overdue.length + dueToday.length})</span>
          </div>

          <div className="space-y-2.5">
            {[...overdue, ...dueToday].map((task) => {
              const matched = patients.find((p) => p.id === task.patientId || p.unified_id === task.patientUnifiedId) || {
                id: task.patientId,
                unified_id: task.patientUnifiedId,
                full_name: task.patientName,
                vitals: task.vitals
              };

              const isOverdue = task.followUpDate < new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isOverdue ? 'bg-rose-50/40 border-rose-200' : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900">{task.patientName}</span>
                      <span className="font-mono text-xs font-bold text-slate-500">{task.patientUnifiedId}</span>
                      {isOverdue ? (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                          Overdue ({new Date(task.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                          Due Today
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      <strong>Task:</strong> {task.followUpReason || task.complaint || 'Follow-up health review'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectPatient(matched)}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Open Record</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => onCompleteFollowUp(task.id, e)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 3: Waiting for Consultation Response ── */}
      {(activeCategory === 'ALL' || activeCategory === 'WAITING') && waitingConsultations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-sky-800 uppercase tracking-wide">
            <Building2 className="w-4 h-4" />
            <span>Awaiting Hospital Intake Update ({waitingConsultations.length})</span>
          </div>

          <div className="space-y-2.5">
            {waitingConsultations.map((ref) => {
              const matched = patients.find((p) => p.id === ref.patientId || p.unified_id === ref.patientUnifiedId) || {
                id: ref.patientId,
                unified_id: ref.patientUnifiedId,
                full_name: ref.patientName,
                vitals: ref.vitals
              };

              return (
                <div
                  key={ref.id}
                  className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900">{ref.patientName}</span>
                      <span className="font-mono text-xs font-bold text-slate-400">{ref.patientUnifiedId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                        Awaiting Hospital Intake
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Dispatched to: <strong>{ref.destinationHospital || ref.hospital}</strong> ({ref.destinationDepartment || ref.department || 'Specialist'})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPatient(matched)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#008080] border border-[#008080]/30 font-bold text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-center cursor-pointer flex items-center gap-1"
                  >
                    <span>View Status</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {urgentCases.length === 0 && overdue.length === 0 && dueToday.length === 0 && waitingConsultations.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-base font-black text-slate-900">All Field Tasks Are Up to Date!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are no overdue reviews, emergency alerts, or pending hospital consultations requiring your attention today.
          </p>
        </div>
      )}
    </div>
  );
}
