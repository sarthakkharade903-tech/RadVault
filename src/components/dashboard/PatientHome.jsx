import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Heart, Droplet, Weight, Ruler, Thermometer, Wind, Activity, CheckCircle2, Clock, Phone, ChevronRight, ActivitySquare, Plus, ShieldAlert, Baby, Lock } from "lucide-react";
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
  const base = "text-[9px] font-black px-2 py-1 rounded-[6px] uppercase tracking-wider";
  if (source === "ASHA recorded") return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100/50`}>{source}</span>;
  if (source === "Clinical")      return <span className={`${base} bg-indigo-50 text-indigo-700 border border-indigo-100/50`}>{source}</span>;
  if (source === "SELF-REPORTED") return <span className={`${base} bg-amber-100 text-amber-700 border border-amber-200/50`}>{source}</span>;
  return <span className={`${base} bg-amber-50 text-amber-700 border border-amber-100/50`}>{source}</span>;
}

function VitalCard({ icon: Icon, iconColor, bgShapeColor, label, value, unit, source, recordedAt, onUpdate }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="relative bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] transition-all duration-300 p-5 flex flex-col gap-3 overflow-hidden group">
      
      {/* Subtle Geometric Background Watermark */}
      <div className={`absolute -bottom-6 -right-6 w-28 h-28 rounded-tl-full opacity-40 transition-transform duration-500 group-hover:scale-110 pointer-events-none ${bgShapeColor}`} />
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 rounded-bl-[100px] backdrop-blur-3xl z-0" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors">
             <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <span className="text-[11px] font-black text-[#64748B] uppercase tracking-[0.1em]">{label}</span>
        </div>
      </div>

      <div className="relative z-10">
        {hasValue ? (
          <>
            <div className="mt-1">
              <p className="text-[32px] font-black text-[#16324F] leading-none tracking-tight">
                {value}<span className="text-[13px] font-bold text-[#94A3B8] ml-1.5">{unit}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {sourceBadge(source)}
              {recordedAt && <span className="text-[10px] text-[#94A3B8] font-bold tracking-wide">{formatDate(recordedAt)}</span>}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            <p className="text-[13px] font-bold text-[#CBD5E1] italic">Not recorded yet</p>
            <button onClick={onUpdate}
              className="w-fit flex items-center gap-1.5 text-[11px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors uppercase tracking-wide">
              <Plus className="w-3 h-3" /> Add reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientHome({ member }) {
  const [latestVitals, setLatestVitals] = useState({});
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [updateMetric, setUpdateMetric] = useState(null);
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
  const heightSource = heightRow ? heightRow.source : (heightVal != null ? "SELF-REPORTED" : null);
  const heightDate = heightRow ? heightRow.recorded_at : member.last_visit_date;

  const tempRow = latestVitals.temperature_c;
  const tempVal = tempRow ? tempRow.temperature_c : null;
  const tempSource = tempRow ? tempRow.source : null;
  const tempDate = tempRow ? tempRow.recorded_at : null;

  const spo2Row = latestVitals.spo2_pct;
  const spo2Val = spo2Row ? spo2Row.spo2_pct : null;
  const spo2Source = spo2Row ? spo2Row.source : null;
  const spo2Date = spo2Row ? spo2Row.recorded_at : null;

  const lastVisitDate = member.last_visit_date;

  return (
    <div className="min-h-full pb-32 bg-[#FCFBF8] font-sans">

      {/* ── Patient Hero Card ── */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="relative rounded-[32px] overflow-hidden shadow-[0_8px_30px_-12px_rgba(251,191,36,0.3)] border border-amber-100 bg-gradient-to-r from-amber-50 via-[#FFF9ED] to-amber-100 p-6 sm:p-8">
          
          {/* Decorative Saffron Shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -translate-y-20 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 rounded-full blur-2xl translate-y-20 -translate-x-10" />
          
          {/* Organic arc */}
          <svg className="absolute bottom-0 right-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 800 400" preserveAspectRatio="none">
            <path d="M400,400 C600,400 800,200 800,0 L800,400 Z" fill="url(#saffronGrad)" />
            <defs>
              <linearGradient id="saffronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start justify-between">
            
            {/* Patient Info Left */}
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-200/50 flex flex-col items-center justify-center text-white relative">
                 <span className="text-3xl font-black">{member.name.charAt(0).toUpperCase()}</span>
                 <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                   <div className="w-4 h-4 bg-amber-400 rounded-full" />
                 </div>
              </div>

              <div>
                <span className="inline-block bg-amber-200 text-amber-900 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.2em] mb-2">
                  Primary Member
                </span>
                <h1 className="text-[28px] sm:text-[34px] font-black text-[#16324F] leading-none mb-2 tracking-tight">
                  {member.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#64748B]">
                  <span>{member.age_years ? `${member.age_years} yrs` : "Unknown"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  <span>{member.gender}</span>
                  {member.blood_group && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                      <span className="text-amber-600">{member.blood_group}</span>
                    </>
                  )}
                </div>

                <div className="mt-5 bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-amber-200/50 inline-block">
                   <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-1">ABHA Number</p>
                   <div className="flex items-center gap-3">
                     <p className="text-lg font-black text-[#16324F] tracking-[0.1em] font-mono leading-none">
                       {abhaDisplay}
                     </p>
                     {!member.abha_id && (
                       <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">Not linked yet</span>
                     )}
                   </div>
                </div>
              </div>
            </div>

            {/* Health ID Box Right */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] w-full md:w-72 shrink-0">
               <div className="flex items-center gap-2 mb-4">
                 <ShieldAlert className="w-4 h-4 text-amber-500" />
                 <span className="text-[10px] font-black text-[#16324F] uppercase tracking-[0.2em]">Health ID</span>
               </div>
               
               <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
                   <Lock className="w-8 h-8 text-amber-400" />
                 </div>
                 <h3 className="text-sm font-black text-[#16324F] mb-1">Secure your health identity</h3>
                 <p className="text-[11px] font-medium text-[#64748B] mb-4 leading-relaxed px-2">
                   Link your ABHA number to access complete health records and benefits.
                 </p>
                 <button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-[12px] py-3 rounded-xl shadow-lg shadow-amber-300/40 hover:shadow-xl transition-all uppercase tracking-wide">
                   Link ABHA Number
                 </button>
               </div>
            </div>

          </div>
          
          {/* Bottom ASHA verification strip */}
          <div className="relative z-10 mt-6 border-t border-amber-200/30 pt-4 flex items-center gap-3">
             <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
               <ShieldAlert className="w-5 h-5 text-amber-500" />
             </div>
             <div>
               <p className="text-xs font-black text-[#16324F]">Pending ASHA verification</p>
               <p className="text-[11px] font-medium text-[#64748B] mt-0.5">Your ASHA worker will verify and link your ABHA number.</p>
             </div>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10">

        {/* ── Latest Health Readings ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-[16px] font-black text-[#16324F] flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Latest Health Readings
            </h3>
            <button onClick={() => setUpdateMetric("all")}
              className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-[11px] font-black hover:bg-amber-200 transition-colors uppercase tracking-wide">
              <Plus className="w-3.5 h-3.5" /> Update Reading
            </button>
          </div>

          {loadingVitals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-[24px] border border-slate-100 h-36 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <VitalCard icon={Heart} iconColor="text-rose-500" bgShapeColor="bg-rose-50" label="Blood Pressure" value={bpVal} unit="mmHg" source={bpSource} recordedAt={bpDate} onUpdate={() => setUpdateMetric("bp")} />
              <VitalCard icon={Droplet} iconColor="text-amber-500" bgShapeColor="bg-orange-50" label="Blood Sugar" value={sugarVal} unit="mg/dL" source={sugarSource} recordedAt={sugarDate} onUpdate={() => setUpdateMetric("sugar")} />
              <VitalCard icon={Weight} iconColor="text-emerald-500" bgShapeColor="bg-emerald-50" label="Weight" value={weightVal} unit="kg" source={weightSource} recordedAt={weightDate} onUpdate={() => setUpdateMetric("weight")} />
              <VitalCard icon={Ruler} iconColor="text-purple-500" bgShapeColor="bg-purple-50" label="Height" value={heightVal} unit="cm" source={heightSource} recordedAt={heightDate} onUpdate={() => setUpdateMetric("height")} />
              
              <VitalCard icon={Thermometer} iconColor="text-orange-500" bgShapeColor="bg-amber-50" label="Temperature" value={tempVal} unit="°C" source={tempSource} recordedAt={tempDate} onUpdate={() => setUpdateMetric("temp")} />
              <VitalCard icon={Wind} iconColor="text-sky-500" bgShapeColor="bg-sky-50" label="SpO₂" value={spo2Val} unit="%" source={spo2Source} recordedAt={spo2Date} onUpdate={() => setUpdateMetric("spo2")} />
            </div>
          )}

          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 mt-5 text-[12px] font-black text-amber-500 hover:text-amber-600 hover:underline px-1 uppercase tracking-wide">
            View full history <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Recent Activity ── */}
        <div>
          <h3 className="text-[16px] font-black text-[#16324F] flex items-center gap-2 mb-5 px-1">
            <Clock className="w-5 h-5 text-amber-500" />
            Recent Activity
          </h3>
          
          <div className="bg-white rounded-[24px] border border-slate-200 px-6 py-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
            <div className="absolute top-0 bottom-0 left-[35px] w-0.5 bg-slate-100" />
            
            {lastVisitDate ? (
              <div className="relative flex items-center gap-5">
                <div className="w-8 h-8 rounded-full bg-white border-[3px] border-amber-200 flex items-center justify-center flex-shrink-0 z-10">
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                </div>
                
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 text-amber-500 border border-amber-100/50">
                   <ActivitySquare className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1">{fmtISO(lastVisitDate)}</p>
                  <p className="text-[15px] font-black text-[#16324F]">ASHA Home Visit</p>
                  <p className="text-[12px] font-medium text-[#64748B] mt-0.5 truncate">Vitals and health status recorded by ASHA worker.</p>
                </div>
                
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide">
                    Completed
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#94A3B8] italic text-center py-4">No recent activity recorded.</p>
            )}
          </div>
          
          <button className="flex items-center gap-1.5 mt-5 text-[12px] font-black text-amber-500 hover:text-amber-600 hover:underline px-1 uppercase tracking-wide">
            View full timeline <ChevronRight className="w-3.5 h-3.5" />
          </button>
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