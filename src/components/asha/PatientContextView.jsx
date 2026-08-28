import React from 'react';
import {
  Phone,
  MapPin,
  AlertTriangle,
  PlusCircle,
  ChevronLeft,
  Clock,
  Building2,
  ShieldAlert,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { getPatientEncounters, getEncounterSyncStatus, derivePatientNextAction } from '../../services/encounterService';

export default function PatientContextView({
  patient,
  onBack,
  onStartEncounter,
  onOpenPatientPortal
}) {
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
  const nextAction = derivePatientNextAction(patient, pastEncounters);

  const hasActiveConsultation = latestEncounter && latestEncounter.outcome === 'REFERRAL_CREATED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
            View Full Records Vault <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── 1. PATIENT HEADER & IDENTITY ── */}
      <div className="bg-white border-2 border-[#008080]/30 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#E6F2F2] border-2 border-[#008080]/40 rounded-2xl flex items-center justify-center text-[#008080] text-2xl font-black shrink-0 shadow-inner">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900">{name}</h1>
                <span className="font-mono text-xs font-extrabold bg-[#E6F2F2] text-[#008080] px-2.5 py-0.5 rounded-md border border-[#008080]/30">
                  ID: {patientId}
                </span>
                {bloodGroup && (
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    🩸 {bloodGroup}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                {age && <span>{age} yrs{gender ? `, ${gender}` : ''}</span>}
                {village && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {village}
                  </span>
                )}
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-center gap-1 hover:text-[#008080] font-bold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onStartEncounter}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-sm rounded-2xl transition-all shadow-md hover:scale-[1.02] active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-slate-950" />
            + Start New Encounter
          </button>
        </div>

        {/* Safety & Emergency Contacts Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">
            Safety & Emergency:
          </span>
          {emergencyPhoneNum ? (
            <a
              href={`tel:${emergencyPhoneNum}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-lg border border-rose-200 transition-colors"
            >
              <Phone className="w-3 h-3 text-rose-600" />
              Contact: {emergencyContactName || 'Family'} ({emergencyPhoneNum})
            </a>
          ) : (
            <span className="text-slate-400 italic">No emergency contact recorded</span>
          )}

          {allergies && (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3" />
              Allergy: {allergies}
            </span>
          )}

          {conditions.map((cond, idx) => (
            <span
              key={idx}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
            >
              ● {cond}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2. WHAT NEEDS ATTENTION NOW (Compact Action Panel) ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#008080]" />
            <span>Immediate Operational Next Action</span>
          </div>

          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
            nextAction.urgency === 'EMERGENCY'
              ? 'bg-rose-100 text-rose-800'
              : nextAction.urgency === 'OVERDUE'
              ? 'bg-amber-100 text-amber-900'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {nextAction.urgency}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900">{nextAction.actionLabel}</div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{nextAction.reason}</p>
          </div>

          <button
            type="button"
            onClick={onStartEncounter}
            className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-center cursor-pointer"
          >
            Take Action Now →
          </button>
        </div>
      </div>

      {/* ── 3. ACTIVE CARE & CONSULTATIONS ── */}
      {hasActiveConsultation && latestEncounter && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#008080]" />
              <h2 className="text-base font-extrabold text-slate-900">Active Hospital Consultation</h2>
            </div>

            <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
              Status: {latestEncounter.liveStatus || latestEncounter.referralStatus || 'Pending Intake'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Destination Facility</span>
              <span className="font-bold">{latestEncounter.destinationHospital || latestEncounter.hospital}</span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Department</span>
              <span className="font-bold">{latestEncounter.destinationDepartment || latestEncounter.department || 'Specialist'}</span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Priority</span>
              <span className="font-bold text-rose-700">{latestEncounter.priorityLabel || latestEncounter.priority}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. LONGITUDINAL CARE TIMELINE ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#008080]" />
            <h2 className="text-base font-extrabold text-slate-900">Care History Timeline</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {pastEncounters.length} {pastEncounters.length === 1 ? 'visit' : 'visits'} recorded
          </span>
        </div>

        {pastEncounters.length > 0 ? (
          <div className="space-y-3.5 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {pastEncounters.map((enc) => {
              const isHigh = enc.priority === 'HIGH' || enc.priority === 'RED';
              const isUrgent = enc.priority === 'ORANGE';
              const priorityClass = isHigh
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : isUrgent
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300';

              const syncStatus = getEncounterSyncStatus(enc);

              return (
                <div
                  key={enc.id}
                  className="relative pl-9 rounded-2xl p-4 bg-slate-50 border border-slate-200/80 transition-all hover:bg-white hover:border-slate-300"
                >
                  <span
                    className={`absolute left-2.5 top-5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                      isHigh ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900">
                        {enc.complaint || 'General Checkup'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-md border ${priorityClass}`}>
                        {enc.priorityLabel || enc.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md flex items-center gap-1 ${
                        syncStatus === 'SYNCED'
                          ? 'bg-teal-50 text-[#008080] border border-[#008080]/30'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {syncStatus === 'SYNCED' ? '☁ Synced' : '📱 Saved locally'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(enc.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Vitals Summary snippet */}
                  {enc.vitals && Object.keys(enc.vitals).length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-slate-600 my-1.5 flex-wrap">
                      {enc.vitals.bp && <span>BP: <strong>{enc.vitals.bp}</strong></span>}
                      {enc.vitals.pulse && <span>Pulse: <strong>{enc.vitals.pulse} bpm</strong></span>}
                      {enc.vitals.spo2 && <span>SpO₂: <strong>{enc.vitals.spo2}%</strong></span>}
                      {enc.vitals.temp && <span>Temp: <strong>{enc.vitals.temp}°F</strong></span>}
                    </div>
                  )}

                  {/* Danger signs alert if recorded */}
                  {enc.dangerSigns && enc.dangerSigns.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-700 font-bold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Danger Signs: {enc.dangerSigns.join(', ')}
                    </div>
                  )}

                  {/* Consultation status */}
                  {enc.outcome === 'REFERRAL_CREATED' && enc.hospital && (
                    <div className="mt-2 text-xs text-[#008080] font-bold flex items-center gap-1.5 bg-[#E6F2F2]/60 px-2.5 py-1 rounded-lg border border-[#008080]/20">
                      <Building2 className="w-3.5 h-3.5 text-[#008080]" />
                      Consultation: {enc.hospital} ({enc.department || 'Specialist'})
                    </div>
                  )}

                  {/* Follow-up Due Tag */}
                  {enc.followUpDate && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-[#FF9933]" />
                        <span>
                          Follow-up: <strong>{new Date(enc.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          {enc.followUpReason ? ` (${enc.followUpReason})` : ''}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        enc.followUpCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {enc.followUpCompleted ? '✓ Completed' : 'Pending Follow-up'}
                      </span>
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
            <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Start New Encounter" above to record the initial consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
