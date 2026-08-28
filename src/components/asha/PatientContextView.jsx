import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  PlusCircle,
  ChevronLeft,
  Clock,
  Building2,
  ShieldAlert,
  ArrowRight,
  Calendar,
  X
} from 'lucide-react';
import { getPatientEncounters, getEncounterSyncStatus } from '../../services/encounterService';

export default function PatientContextView({
  patient,
  onBack,
  onStartEncounter,
  onOpenPatientPortal,
  onCompleteFollowUp,
  onRequestReferral,
  _isDemoMode = false
}) {
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpOutcome, setFollowUpOutcome] = useState('IMPROVING');
  const [followUpNote, setFollowUpNote] = useState('');
  const [rescheduleDays, setRescheduleDays] = useState('7');
  const [selectedEncounterForFollowUp, setSelectedEncounterForFollowUp] = useState(null);

  if (!patient) return null;

  const patientId = patient.unified_id || patient.id;
  const name = patient.full_name || patient.name || 'Beneficiary';
  const age = patient.age;
  const gender = patient.gender;
  const phone = patient.phone_number || patient.phone;
  const village = patient.address || patient.village || 'Village Sector';
  const bloodGroup = patient.blood_group || patient.bloodGroup;

  // Extract vitals/conditions metadata if present
  const metadataVitals = typeof patient.vitals === 'object' && patient.vitals !== null ? patient.vitals : {};
  const allergies = metadataVitals.allergies || patient.critical_allergies;
  const conditions = metadataVitals.conditions || [];
  const emergencyContactName = metadataVitals.emergencyContact;
  const emergencyPhoneNum = metadataVitals.emergencyPhone;

  // Fetch past encounters for this patient
  const pastEncounters = getPatientEncounters(patient.id, patient.unified_id);
  const latestEncounter = pastEncounters[0];
  const refStatus = latestEncounter?.liveStatus || latestEncounter?.referralStatus || '';

  // ── A. Care Journey Progress Calculation ──
  const hasAssessment = pastEncounters.length > 0;
  const isReferral = latestEncounter && latestEncounter.outcome === 'REFERRAL_CREATED';
  const isConsultationDone = isReferral && (refStatus === 'Accepted' || refStatus === 'Completed' || refStatus === 'In consultation');
  const isFollowUpDue = latestEncounter && latestEncounter.followUpDate && !latestEncounter.followUpCompleted;
  const isFollowUpDone = latestEncounter && latestEncounter.followUpCompleted;

  const journeySteps = [
    { label: 'Registration', status: 'completed' },
    { label: 'Assessment', status: hasAssessment ? 'completed' : 'pending' },
    { label: 'Referral', status: isReferral ? 'completed' : 'not_started' },
    { label: 'Consultation', status: isConsultationDone ? 'completed' : 'not_started' },
    { label: 'Follow-up', status: isFollowUpDone ? 'completed' : isFollowUpDue ? 'due' : 'not_started' }
  ];

  const handleOpenFollowUpModal = (enc) => {
    setSelectedEncounterForFollowUp(enc);
    setFollowUpOutcome('IMPROVING');
    setFollowUpNote('');
    setShowFollowUpModal(true);
  };

  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!selectedEncounterForFollowUp) return;

    let nextFollowUpDate = null;
    if (followUpOutcome === 'RESCHEDULED' || followUpOutcome === 'REFERRED_AGAIN') {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(rescheduleDays));
      nextFollowUpDate = d.toISOString().slice(0, 10);
    }

    if (onCompleteFollowUp) {
      onCompleteFollowUp(selectedEncounterForFollowUp.id, {
        outcome: followUpOutcome,
        note: followUpNote,
        nextFollowUpDate
      });
    }

    setShowFollowUpModal(false);
    setSelectedEncounterForFollowUp(null);
  };

  // ── B. Next Action Evaluator ──
  const renderNextActionContainer = () => {
    let title = 'Routine Monitoring';
    let description = 'Beneficiary is currently stable. No immediate clinical action is required.';
    let buttonLabel = 'Start New Assessment';
    let actionCallback = onStartEncounter;
    let urgencyClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';

    if (!hasAssessment) {
      title = 'Assess Patient';
      description = 'No baseline health checks have been performed for this beneficiary yet. Record vital signs and symptoms.';
      buttonLabel = 'Start Assessment';
      actionCallback = onStartEncounter;
      urgencyClass = 'bg-[#E6F2F2] border-[#008080]/30 text-[#008080]';
    } else if (latestEncounter.priority === 'HIGH' && latestEncounter.outcome !== 'REFERRAL_CREATED') {
      title = 'Create Urgent Hospital Referral';
      description = 'Emergency indicators require immediate transfer to secondary/tertiary hospital.';
      buttonLabel = 'Refer Patient';
      actionCallback = () => onRequestReferral(latestEncounter);
      urgencyClass = 'bg-rose-50 border-rose-200 text-rose-800';
    } else if (isReferral && (refStatus === 'Pending' || refStatus === 'Accepted')) {
      title = 'Awaiting Hospital Consultation';
      description = `Referral submitted to ${latestEncounter.destinationHospital || latestEncounter.hospital}. Status: ${refStatus}.`;
      buttonLabel = null;
      urgencyClass = 'bg-sky-50 border-sky-200 text-sky-800';
    } else if (isFollowUpDue) {
      title = 'Conduct Scheduled Follow-up';
      description = `Review health status and outcome for visit scheduled on ${latestEncounter.followUpDate}. Reason: ${latestEncounter.followUpReason || 'Routine check'}.`;
      buttonLabel = 'Start Follow-up';
      actionCallback = () => handleOpenFollowUpModal(latestEncounter);
      urgencyClass = 'bg-amber-50 border-amber-200 text-amber-900';
    }

    return (
      <div className={`border-2 rounded-3xl p-5 shadow-2xs space-y-3.5 ${urgencyClass}`}>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>Operational Next Action</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-sm font-black text-slate-900">{title}</div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{description}</p>
          </div>

          {buttonLabel && (
            <button
              type="button"
              onClick={actionCallback}
              className="px-5 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* ── Back Navigation Bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Overview
        </button>

        {onOpenPatientPortal && (
          <button
            onClick={onOpenPatientPortal}
            className="text-xs font-bold text-[#008080] hover:text-[#006666] flex items-center gap-1 transition-colors cursor-pointer"
          >
            View Records Vault <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── 1. PATIENT HEADER & IDENTITY ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 bg-[#E6F2F2] border border-[#008080]/30 rounded-2xl flex items-center justify-center text-[#008080] text-xl font-black shrink-0 shadow-inner">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black text-slate-900">{name}</h1>
                {bloodGroup && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {bloodGroup}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                {age && <span>{age} yrs{gender ? `, ${gender}` : ''}</span>}
                {village && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {village}
                  </span>
                )}
                {phone && (
                  <span className="flex items-center gap-1 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {phone}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 font-bold">
                ID: {patientId}
              </div>
            </div>
          </div>

          <button
            onClick={onStartEncounter}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + New Encounter
          </button>
        </div>

        {/* Safety & Contacts Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center text-xs">
          {emergencyPhoneNum ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 font-bold rounded-lg border border-rose-100 text-[11px]">
              🚨 Emergency: {emergencyContactName || 'Family'} ({emergencyPhoneNum})
            </div>
          ) : (
            <span className="text-slate-400 italic text-[11px]">No emergency contact</span>
          )}

          {allergies && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              ⚠️ Allergy: {allergies}
            </span>
          )}

          {conditions.map((cond, idx) => (
            <span
              key={idx}
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
            >
              ● {cond}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2. VISUAL CARE JOURNEY TRACK ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Care Journey</h3>
        <div className="grid grid-cols-5 gap-1 text-center">
          {journeySteps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isDue = step.status === 'due';
            
            let statusBg = 'bg-slate-100 text-slate-400 border-slate-200';
            let mark = '○';

            if (isCompleted) {
              statusBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              mark = '✓';
            } else if (isDue) {
              statusBg = 'bg-amber-50 text-amber-800 border-amber-300';
              mark = '⭐';
            }

            return (
              <div key={idx} className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-inner ${statusBg}`}>
                  {mark}
                </div>
                <span className="text-[10px] font-black text-slate-900 block leading-tight">{step.label}</span>
                <span className="text-[9px] text-slate-400 font-medium block">
                  {isCompleted ? 'Done' : isDue ? 'Action' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. OPERATIONAL NEXT ACTION PANELS ── */}
      {renderNextActionContainer()}

      {/* ── 4. LONGITUDINAL TIMELINE ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#008080]" />
            <h2 className="text-sm font-extrabold text-slate-900">Care Timeline</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {pastEncounters.length} {pastEncounters.length === 1 ? 'visit' : 'visits'}
          </span>
        </div>

        {pastEncounters.length > 0 ? (
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {pastEncounters.map((enc) => {
              const isHigh = enc.priority === 'HIGH' || enc.priority === 'RED';
              const isUrgent = enc.priority === 'ORANGE';
              const priorityClass = isHigh
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isUrgent
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              const syncStatus = getEncounterSyncStatus(enc);

              return (
                <div
                  key={enc.id}
                  className="relative pl-8 space-y-1.5"
                >
                  <span
                    className={`absolute left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                      isHigh ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-950">
                        {enc.complaint || 'General Checkup'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${priorityClass}`}>
                        {enc.priorityLabel || enc.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {syncStatus === 'SYNCED' ? '☁ Synced' : '📱 Saved locally'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-bold">
                      {new Date(enc.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Vitals summary */}
                  {enc.vitals && Object.keys(enc.vitals).length > 0 && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap">
                      {enc.vitals.bp && <span>BP: <strong>{enc.vitals.bp}</strong></span>}
                      {enc.vitals.pulse && <span>Pulse: <strong>{enc.vitals.pulse} bpm</strong></span>}
                      {enc.vitals.spo2 && <span>SpO₂: <strong>{enc.vitals.spo2}%</strong></span>}
                      {enc.vitals.temp && <span>Temp: <strong>{enc.vitals.temp}°F</strong></span>}
                    </div>
                  )}

                  {/* Danger signs */}
                  {enc.dangerSigns && enc.dangerSigns.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-700 font-bold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Danger Signs: {enc.dangerSigns.join(', ')}</span>
                    </div>
                  )}

                  {/* Referral link */}
                  {enc.outcome === 'REFERRAL_CREATED' && enc.hospital && (
                    <div className="text-[11px] text-sky-800 font-bold flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 max-w-fit">
                      <Building2 className="w-3 h-3 text-sky-600" />
                      <span>Consultation: {enc.destinationHospital || enc.hospital} ({enc.destinationDepartment || enc.department || 'Specialist'})</span>
                    </div>
                  )}

                  {/* Follow-up controls */}
                  {enc.followUpDate && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-medium">
                        ⏰ Follow-up Target: <strong>{new Date(enc.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
                      </span>
                      {enc.followUpCompleted ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          ✓ Completed ({enc.followUpOutcome || 'Improving'})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenFollowUpModal(enc)}
                          className="text-[#008080] hover:underline font-black cursor-pointer"
                        >
                          Record Outcome
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No previous care encounters recorded yet.</p>
          </div>
        )}
      </div>

      {/* ── 5. FOLLOW-UP OUTCOME MODAL ── */}
      {showFollowUpModal && selectedEncounterForFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Record Follow-up Outcome</h2>
                <p className="text-xs text-slate-500">{name} ({patientId})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Follow-up Status *
                </label>
                <select
                  value={followUpOutcome}
                  onChange={(e) => setFollowUpOutcome(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
                >
                  <option value="IMPROVING">Improving — Stable recovery</option>
                  <option value="RECOVERED">Recovered — Normal health condition</option>
                  <option value="NOT_IMPROVING">Not improving — Deteriorating symptoms</option>
                  <option value="MISSED">Missed — Did not attend hospital visit</option>
                  <option value="REFERRED_AGAIN">Referred again — Needs escalation</option>
                </select>
              </div>

              {(followUpOutcome === 'RESCHEDULED' || followUpOutcome === 'REFERRED_AGAIN') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Target Date Offset
                  </label>
                  <select
                    value={rescheduleDays}
                    onChange={(e) => setRescheduleDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
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
                  Field Notes
                </label>
                <input
                  type="text"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g. Taking tablets regularly, BP check normal..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#008080] rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
