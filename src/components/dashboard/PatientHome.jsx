import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Heart, Droplet, Weight, Ruler, Thermometer, Wind, Activity, CheckCircle2, Clock, Phone, ChevronRight, ActivitySquare, Plus, ShieldAlert, Baby } from "lucide-react";
import { getLatestVitals } from "../../services/ashaService";
import UpdateVitalsModal from "../Patient/UpdateVitalsModal";
import VitalsHistory from "../Patient/VitalsHistory";

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return `Today · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtISO(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function sourceBadge(source) {
  if (!source) return null;
  const base = "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide";
  if (source === "ASHA recorded") return <span className={`${base} bg-teal-50 text-teal-700`}>{source}</span>;
  if (source === "Clinical")      return <span className={`${base} bg-indigo-50 text-indigo-700`}>{source}</span>;
  return <span className={`${base} bg-amber-50 text-amber-700`}>{source}</span>;
}

function VitalCard({ icon: Icon, iconColor, label, value, unit, source, recordedAt, onUpdate }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
        </div>
      </div>

      {hasValue ? (
        <>
          <div className="mt-1">
            <p className="text-[22px] font-black text-[#16324F] leading-none">
              {value}<span className="text-[12px] font-semibold text-[#94A3B8] ml-1">{unit}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {sourceBadge(source)}
            {recordedAt && <span className="text-[9px] text-[#94A3B8] font-medium">{formatDate(recordedAt)}</span>}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold text-[#CBD5E1] italic mt-1">Not recorded yet</p>
          <button onClick={onUpdate}
            className="flex items-center gap-1 text-[10px] font-bold text-[#008F83] mt-0.5 hover:underline">
            <Plus className="w-3 h-3" /> Add reading
          </button>
        </>
      )}
    </div>
  );
}

export default function PatientHome({ member }) {
  const [latestVitals, setLatestVitals] = useState({});
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [updateMetric, setUpdateMetric] = useState(null); // null | "all" | "bp" | "sugar" | "weight" | "height"
  const [showHistory, setShowHistory] = useState(false);

  const fetchVitals = useCallback(async () => {
    if (!member?.id) return;
    setLoadingVitals(true);
    const { data } = await getLatestVitals(member.id);
    setLatestVitals(data || {});
    setLoadingVitals(false);
  }, [member?.id]);

  useEffect(() => { fetchVitals(); }, [fetchVitals]);

  if (!member) return null;

  const abhaDisplay = member.abha_id || "PENDING";
  const verifiedAt  = member.asha_verified_at ? fmtISO(member.asha_verified_at) : null;
  const qrValue     = `ABHA:${member.abha_id || "pending"}|Name:${member.name}|DOB:${member.dob || ""}`;

  // Pull vitals: prefer history table values, fall back to ASHA baseline on member row
  const bp = latestVitals.bp_systolic;
  const bpVal = bp ? `${bp.bp_systolic} / ${bp.bp_diastolic}` : (member.bp_systolic && member.bp_diastolic ? `${member.bp_systolic}/${member.bp_diastolic}` : null);
  const bpSource = bp ? bp.source : (bpVal ? "ASHA recorded" : null);
  const bpDate = bp ? bp.recorded_at : member.last_visit_date;

  const sugarRow = latestVitals.blood_glucose;
  const sugarVal = sugarRow ? sugarRow.blood_glucose : (member.blood_glucose ?? null);
  const sugarSource = sugarRow ? sugarRow.source : (sugarVal != null ? "ASHA recorded" : null);
  const sugarDate = sugarRow ? sugarRow.recorded_at : member.last_visit_date;

  const weightRow = latestVitals.weight_kg;
  const weightVal = weightRow ? weightRow.weight_kg : (member.weight_kg ?? null);
  const weightSource = weightRow ? weightRow.source : (weightVal != null ? "ASHA recorded" : null);
  const weightDate = weightRow ? weightRow.recorded_at : member.last_visit_date;

  const heightRow = latestVitals.height_cm;
  const heightVal = heightRow ? heightRow.height_cm : (member.height_cm ?? null);
  const heightSource = heightRow ? heightRow.source : (heightVal != null ? "ASHA recorded" : null);
  const heightDate = heightRow ? heightRow.recorded_at : member.last_visit_date;

  const tempRow = latestVitals.temperature_c;
  const tempVal = tempRow ? tempRow.temperature_c : null;
  const tempSource = tempRow ? tempRow.source : null;
  const tempDate = tempRow ? tempRow.recorded_at : null;

  const spo2Row = latestVitals.spo2_pct;
  const spo2Val = spo2Row ? spo2Row.spo2_pct : null;
  const spo2Source = spo2Row ? spo2Row.source : null;
  const spo2Date = spo2Row ? spo2Row.recorded_at : null;

  const pulseRow = latestVitals.pulse_bpm;
  const pulseVal = pulseRow ? pulseRow.pulse_bpm : null;
  const pulseSource = pulseRow ? pulseRow.source : null;
  const pulseDate = pulseRow ? pulseRow.recorded_at : null;

  const hasAllergies = member.allergies && member.allergies.trim() !== "";
  const hasChronics  = member.chronic_conditions && member.chronic_conditions.length > 0;
  const hasEmergency = member.emergency_contact_name || member.emergency_contact_phone;
  const ancDone = member.anc_visits_done || 0;
  const ancTotal = 4;
  const allVaccines = ["bcg","opv","dpt","hep_b","measles","mr"];
  const givenVaccines = allVaccines.filter(v => member[`vaccine_${v}`]);
  const lastVisitDate = member.last_visit_date;

  return (
    <div className="min-h-full pb-10 bg-[#FCFBF8]">

      {/* ── ABHA Health Card ── */}
      <div className="mx-4 mt-5">
        <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,143,131,0.12)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#008F83] to-[#005D55] z-0" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-20 translate-x-12 blur-2xl z-0" />
          <div className="relative z-10">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-white text-xs font-black tracking-wide">RadVault</span>
              </div>
              <p className="text-[8px] text-teal-100 font-bold tracking-[0.2em] uppercase">Health ID</p>
            </div>
            <div className="px-5 py-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white leading-tight truncate mb-1">{member.name}</h2>
                <div className="flex items-center gap-2 text-xs font-medium text-teal-100 mb-3">
                  <span>{member.age_years ? `${member.age_years} yrs` : "Unknown Age"}</span>
                  <span className="w-1 h-1 rounded-full bg-teal-300/50" />
                  <span>{member.gender}</span>
                  {member.blood_group && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-teal-300/50" />
                      <span className="text-amber-300 font-bold">{member.blood_group}</span>
                    </>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-[9px] font-bold text-teal-200/80 uppercase tracking-widest mb-0.5">ABHA Number</p>
                  <p className="text-[17px] font-black text-white tracking-[0.15em] font-mono">{abhaDisplay}</p>
                </div>
              </div>
              {member.abha_id ? (
                <div className="flex-shrink-0 bg-white p-1.5 rounded-xl shadow-lg">
                  <QRCodeSVG value={qrValue} size={64} level="M" fgColor="#005D55" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/50" />
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-black/10 backdrop-blur-sm flex items-center gap-2">
              {verifiedAt ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <p className="text-[10px] font-medium text-teal-50">
                    <strong className="text-white">Verified by ASHA</strong> · {verifiedAt}
                  </p>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] font-medium text-teal-50">Pending ASHA verification</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 flex flex-col gap-5">

        {/* ── Emergency Strip ── */}
        {(hasAllergies || hasEmergency) && (
          <div className="bg-rose-50/60 rounded-2xl border border-rose-100 px-4 py-3 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider mb-1.5">Emergency Profile</p>
              {hasAllergies && <p className="text-[11px] text-rose-900 mb-1"><span className="font-bold opacity-60">Allergies: </span>{member.allergies}</p>}
              {hasEmergency && (
                <p className="text-[11px] text-rose-900">
                  <span className="font-bold opacity-60">Contact: </span>
                  {member.emergency_contact_name || "—"}
                  {member.emergency_contact_phone && (
                    <a href={`tel:${member.emergency_contact_phone}`} className="ml-2 font-bold text-rose-600">
                      {member.emergency_contact_phone}
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Latest Health Readings ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h3 className="text-[13px] font-black text-[#16324F]">Latest Health Readings</h3>
            <button onClick={() => setUpdateMetric("all")}
              className="flex items-center gap-1.5 bg-[#008F83] text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm hover:bg-[#007A70] transition-colors">
              <Plus className="w-3 h-3" /> Update
            </button>
          </div>

          {loadingVitals ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <VitalCard icon={Heart} iconColor="text-rose-500" label="Blood Pressure" value={bpVal} unit="mmHg" source={bpSource} recordedAt={bpDate} onUpdate={() => setUpdateMetric("bp")} />
              <VitalCard icon={Droplet} iconColor="text-amber-500" label="Blood Sugar" value={sugarVal} unit="mg/dL" source={sugarSource} recordedAt={sugarDate} onUpdate={() => setUpdateMetric("sugar")} />
              <VitalCard icon={Weight} iconColor="text-[#008F83]" label="Weight" value={weightVal} unit="kg" source={weightSource} recordedAt={weightDate} onUpdate={() => setUpdateMetric("weight")} />
              <VitalCard icon={Ruler} iconColor="text-indigo-500" label="Height" value={heightVal} unit="cm" source={heightSource} recordedAt={heightDate} onUpdate={() => setUpdateMetric("height")} />
              {(tempVal || spo2Val || pulseVal) && (
                <>
                  {tempVal  && <VitalCard icon={Thermometer} iconColor="text-orange-500" label="Temperature" value={tempVal} unit="°C" source={tempSource} recordedAt={tempDate} onUpdate={() => setUpdateMetric("temp")} />}
                  {spo2Val  && <VitalCard icon={Wind} iconColor="text-sky-500" label="SpO₂" value={spo2Val} unit="%" source={spo2Source} recordedAt={spo2Date} onUpdate={() => setUpdateMetric("spo2")} />}
                  {pulseVal && <VitalCard icon={Activity} iconColor="text-purple-500" label="Pulse" value={pulseVal} unit="bpm" source={pulseSource} recordedAt={pulseDate} onUpdate={() => setUpdateMetric("pulse")} />}
                </>
              )}
            </div>
          )}

          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-[#008F83] hover:underline px-0.5">
            View history <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Maternal Care ── */}
        {member.is_pregnant && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-100" />
                <span className="text-[11px] font-black text-[#16324F] uppercase tracking-wider">Antenatal Care</span>
              </div>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{ancDone}/{ancTotal} Visits</span>
            </div>
            <div className="p-4 space-y-3">
              {member.edd && <div><p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-0.5">Expected Delivery</p><p className="text-sm font-black text-[#16324F]">{fmtISO(member.edd)}</p></div>}
              {(member.ifa_given || member.tt_dose1 || member.tt_dose2) && (
                <div className="flex flex-wrap gap-1.5">
                  {member.ifa_given && <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">IFA Tablets</span>}
                  {member.tt_dose1  && <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">TT Dose 1</span>}
                  {member.tt_dose2  && <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-200">TT Dose 2</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Child Care ── */}
        {member.is_child && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
              <Baby className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-black text-[#16324F] uppercase tracking-wider">Child Health</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B]">MUAC Screening</span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase
                  ${member.muac_zone === "red" ? "bg-red-50 text-red-700 border-red-200"
                  : member.muac_zone === "yellow" ? "bg-amber-50 text-amber-700 border-amber-200"
                  : member.muac_zone === "green"  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  {member.muac_zone || "Not recorded"}
                </span>
              </div>
              {givenVaccines.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1.5">Vaccines Received</p>
                  <div className="flex flex-wrap gap-1.5">
                    {givenVaccines.map(v => <span key={v} className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 uppercase">{v.replace("_"," ")}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chronic Conditions ── */}
        {hasChronics && (
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2.5">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2">
              {member.chronic_conditions.map(c => <span key={c} className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">{c}</span>)}
            </div>
          </div>
        )}

        {/* ── Recent Activity ── */}
        <div>
          <h3 className="text-[13px] font-black text-[#16324F] mb-3 px-0.5">Recent Activity</h3>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] px-4 py-4 shadow-sm relative">
            <div className="absolute top-0 left-[27px] bottom-0 w-0.5 bg-slate-50" />
            {lastVisitDate ? (
              <div className="relative flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#E8F7F3] border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                  <ActivitySquare className="w-3.5 h-3.5 text-[#008F83]" />
                </div>
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide mb-0.5">{fmtISO(lastVisitDate)}</p>
                  <p className="text-xs font-black text-[#16324F]">ASHA Home Visit</p>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">Vitals and health status recorded by ASHA worker.</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8] italic text-center py-2">No recent activity recorded.</p>
            )}
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {updateMetric && (
        <UpdateVitalsModal
          patientId={member.id}
          metric={updateMetric}
          onClose={() => setUpdateMetric(null)}
          onSaved={() => { setUpdateMetric(null); fetchVitals(); }}
        />
      )}
      {showHistory && (
        <VitalsHistory
          patientId={member.id}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}