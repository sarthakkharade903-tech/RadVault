import React, { useState } from 'react';
import { Clock, AlertTriangle, Calendar, CheckCircle2, User, X } from 'lucide-react';

export default function AshaFollowUpsView({
  followUpTasks,
  patients = [],
  onSelectPatient,
  onCompleteTask
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED'
  const [selectedTaskForResolution, setSelectedTaskForResolution] = useState(null);
  const [resolutionOutcome, setResolutionOutcome] = useState('COMPLETED');
  const [resolutionNote, setResolutionNote] = useState('');
  const [rescheduleDays, setRescheduleDays] = useState('7');

  const { overdue = [], dueToday = [], upcoming = [], completed = [] } = followUpTasks || {};

  const allActiveTasks = [...overdue, ...dueToday, ...upcoming];

  let displayTasks = [];
  if (filter === 'OVERDUE') displayTasks = overdue;
  else if (filter === 'TODAY') displayTasks = dueToday;
  else if (filter === 'UPCOMING') displayTasks = upcoming;
  else if (filter === 'COMPLETED') displayTasks = completed;
  else displayTasks = [...allActiveTasks, ...completed];

  const handleConfirmResolution = (e) => {
    e.preventDefault();
    if (!selectedTaskForResolution) return;

    let nextFollowUpDate = null;
    if (resolutionOutcome === 'RESCHEDULED') {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(rescheduleDays));
      nextFollowUpDate = d.toISOString().slice(0, 10);
    }

    if (onCompleteTask) {
      onCompleteTask(selectedTaskForResolution.id, {
        outcome: resolutionOutcome,
        note: resolutionNote,
        nextFollowUpDate
      });
    }

    setSelectedTaskForResolution(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Frontline Follow-up Queue</h1>
          <p className="text-xs text-slate-500 font-medium">
            Actionable follow-up tracking: Verify medication start, review BP, and check hospital visit outcomes
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
          <span className="text-slate-500 px-1.5">Actionable Tasks:</span>
          <span className="bg-[#008080] text-white px-2 py-0.5 rounded-md font-black">
            {allActiveTasks.length}
          </span>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
            filter === 'ALL'
              ? 'bg-[#008080] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Tasks ({allActiveTasks.length + completed.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('OVERDUE')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            filter === 'OVERDUE'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue ({overdue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('TODAY')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            filter === 'TODAY'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Due Today ({dueToday.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('UPCOMING')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            filter === 'UPCOMING'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming ({upcoming.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('COMPLETED')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            filter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({completed.length})</span>
        </button>
      </div>

      {/* ── Task List ── */}
      {displayTasks.length > 0 ? (
        <div className="space-y-3">
          {displayTasks.map((task) => {
            const isOverdue = overdue.some((o) => o.id === task.id);
            const isToday = dueToday.some((t) => t.id === task.id);
            const isDone = task.followUpCompleted;

            const cardBorder = isDone
              ? 'border-emerald-200 bg-emerald-50/20'
              : isOverdue
              ? 'border-rose-300 bg-rose-50/40'
              : isToday
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-slate-200 bg-white';
            const isTeleconsult = (task.followUpReason || '').includes('[Teleconsultation Signed]');
            const isInPerson = (task.followUpReason || '').includes('[Hospital Visit Required]');

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBorder}`}
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-slate-900">{task.patientName}</span>
                    <span className="font-mono text-xs font-bold text-slate-500">{task.patientUnifiedId}</span>
                    
                    {isDone ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ {task.followUpOutcome || 'Completed'}
                      </span>
                    ) : isOverdue ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        ⚠️ Overdue ({new Date(task.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                      </span>
                    ) : isToday ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        ⭐ Due Today
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Due: {new Date(task.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}

                    {isTeleconsult && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                        📡 Remote Tele-Advice · Local Dispense
                      </span>
                    )}

                    {isInPerson && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                        🏥 Hospital Visit Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 font-bold block mb-0.5">Specialist Follow-up Protocol:</strong>
                    {task.followUpReason || task.complaint || 'Follow-up health review'}
                  </p>

                  {task.hospital && (
                    <p className="text-[11px] text-slate-500">
                      Linked Specialist Facility: {task.hospital} ({task.department || 'Specialist'})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const matched = patients.find(
                        (p) => p.id === task.patientId || p.unified_id === task.patientUnifiedId
                      ) || {
                        id: task.patientId,
                        unified_id: task.patientUnifiedId,
                        full_name: task.patientName,
                        vitals: task.vitals
                      };
                      onSelectPatient(matched);
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Patient</span>
                  </button>

                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForResolution(task)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Record Outcome</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-800">No tasks in this category</p>
          <p className="text-xs text-slate-400">All follow-ups for this selection are up to date.</p>
        </div>
      )}

      {/* ── Follow-Up Outcome Resolution Modal ── */}
      {selectedTaskForResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Record Follow-up Outcome</h2>
                <p className="text-xs text-slate-500">{selectedTaskForResolution.patientName} ({selectedTaskForResolution.patientUnifiedId})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForResolution(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  What happened during the follow-up? *
                </label>
                <select
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
                >
                  <option value="IMPROVING">Improving — Under recovery</option>
                  <option value="RECOVERED">Recovered — Normal health</option>
                  <option value="NOT_IMPROVING">Not improving — Persistent issues</option>
                  <option value="MISSED">Missed — Did not attend hospital/visit</option>
                  <option value="REFERRED_AGAIN">Referred again — Needs new hospital consult</option>
                </select>
              </div>

              {(resolutionOutcome === 'REFERRED_AGAIN' || resolutionOutcome === 'RESCHEDULED') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Reschedule Target Date
                  </label>
                  <select
                    value={rescheduleDays}
                    onChange={(e) => setRescheduleDays(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="1">Tomorrow</option>
                    <option value="3">In 3 Days</option>
                    <option value="7">In 7 Days</option>
                    <option value="14">In 14 Days</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  ASHA Field Notes
                </label>
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Verified BP 124/82, taking morning tablets regularly..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForResolution(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Outcome & Close Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
