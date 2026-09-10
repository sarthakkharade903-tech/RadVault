import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Heart, Droplet, Weight, Ruler, Thermometer, Wind, Activity,
  CheckCircle2, Clock, Phone, ChevronRight, ActivitySquare, Plus,
  ShieldAlert, Baby, Lock, Camera, Loader2, ShieldCheck, Sparkles,
  Award, QrCode
} from "lucide-react";
import { getLatestVitals } from "../../services/ashaService";
import UpdateVitalsModal from "../Patient/UpdateVitalsModal";
import VitalsHistory from "../Patient/VitalsHistory";
import AbhaModal from "../Patient/AbhaModal";

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
  const base = "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs";
  if (source === "ASHA recorded") return <span className={`${base} bg-emerald-50 text-emerald-800 border border-emerald-200/80`}>ASHA RECORDED</span>;
  if (source === "Clinical")      return <span className={`${base} bg-indigo-50 text-indigo-800 border border-indigo-200/80`}>CLINICAL</span>;
  if (source === "SELF-REPORTED") return <span className={`${base} bg-amber-100 text-amber-900 border border-amber-200`}>SELF REPORTED</span>;
  return <span className={`${base} bg-amber-50 text-amber-800 border border-amber-200/80`}>{source}</span>;
}

function VitalCard({ icon: Icon, iconColor, bgShapeColor, label, value, unit, source, recordedAt, onUpdate }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="relative bg-white/95 backdrop-blur-sm rounded-[24px] border border-amber-200/70 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.08)] hover:shadow-[0_20px_35px_-8px_rgba(245,158,11,0.2)] hover:-translate-y-1.5 transition-all duration-300 p-5 sm:p-6 flex flex-col gap-3 overflow-hidden group">
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:bg-amber-100/60 group-hover:scale-110 transition-all shadow-2xs">
             <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <span className="text-[11px] font-black text-[#64748B] uppercase tracking-[0.1em]">{label}</span>
        </div>
      </div>

      <div className="relative z-10">
        {hasValue ? (
          <>
            <div className="mt-1">
              <p className="text-[30px] sm:text-[34px] font-black text-[#16324F] leading-none tracking-tight">
                {value}<span className="text-[13px] font-bold text-[#94A3B8] ml-1.5">{unit}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              {sourceBadge(source)}
              {recordedAt && <span className="text-[10px] text-[#94A3B8] font-black tracking-wide">{formatDate(recordedAt)}</span>}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            <p className="text-[13px] font-bold text-[#CBD5E1] italic">Not recorded yet</p>
            <button onClick={onUpdate}
              className="w-fit flex items-center gap-1.5 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200/70 px-3.5 py-2 rounded-xl hover:bg-amber-100 hover:shadow-xs transition-all uppercase tracking-wider cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientHome({ member, onNavigateTab }) {
  const [latestVitals, setLatestVitals] = useState({});
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [updateMetric, setUpdateMetric] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  
  // Stored ABHA ID with localStorage persistence
  const savedAbha = (member?.id && localStorage.getItem(`radvault_abha_${member.id}`)) || member?.abha_id || "";
  const [currentAbha, setCurrentAbha] = useState(savedAbha);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const fetchVitals = useCallback(async () => {
    if (!member?.id) return;
    setLoadingVitals(true);
    const { data } = await getLatestVitals(member.id);
    setLatestVitals(data || {});
    setLoadingVitals(false);
  }, [member?.id]);

  useEffect(() => { fetchVitals(); }, [fetchVitals]);

  const [avatarStr, setAvatarStr] = useState(member?.avatar_url || null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const stored = (member?.id && localStorage.getItem(`radvault_abha_${member.id}`)) || member?.abha_id || "";
    setCurrentAbha(stored);
    setAvatarStr(member?.avatar_url || null);
    setImgError(false);
  }, [member]);

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !member?.id) return;
      
      setUploadingAvatar(true);
      setImgError(false);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const base64Data = canvas.toDataURL('image/jpeg', 0.8);
            
            setAvatarStr(base64Data);
            setUploadingAvatar(false);
          } catch (err) {
            console.error("Avatar compression failed:", err);
            setUploadingAvatar(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingAvatar(false);
    }
  };

  if (!member) return null;

  const abhaDisplay = currentAbha || member.abha_id || "PENDING";
  const isAbhaLinked = Boolean(currentAbha || member.abha_id);
  
  // Pull vitals
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

  const lastVisitDate = member.last_visit_date || new Date().toISOString();

  return (
    <div className="min-h-full pb-40 bg-[#FCFBF8] font-sans">
      
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
        className="hidden" 
      />

      {/* ── 3D Tactile Patient Hero Card ── */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative rounded-[32px] border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-[#FFF8E7] to-amber-100/70 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(245,158,11,0.25)] overflow-hidden">
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start justify-between">
            
            {/* Patient Info Left */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              
              {/* Avatar with Camera Icon & 3D Specular Ring */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-[0_12px_30px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center text-white relative cursor-pointer group shrink-0 overflow-hidden border-4 border-white hover:scale-105 transition-transform"
              >
                 {(avatarStr && !imgError) ? (
                   <img src={avatarStr} alt={member.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                 ) : (
                   <span className="text-4xl font-black">{member.name.charAt(0).toUpperCase()}</span>
                 )}
                 
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                 </div>

                 <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-xs">
                   <div className="w-3.5 h-3.5 bg-amber-400 rounded-full animate-pulse" />
                 </div>
              </div>

              <div className="pt-1">
                <span className="inline-block bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-[0.2em] mb-2.5 shadow-xs border border-amber-300">
                  Primary Member
                </span>
                <h1 className="text-[28px] sm:text-[38px] font-black text-[#16324F] leading-none mb-2 tracking-tight">
                  {member.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-sm font-bold text-[#64748B]">
                  <span>{member.age_years ? `${member.age_years} yrs` : "Resident"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{member.gender}</span>
                  {member.blood_group && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-700 font-black">{member.blood_group}</span>
                    </>
                  )}
                </div>

                {/* 3D ABHA Number Badge */}
                <div
                  onClick={() => setShowAbhaModal(true)}
                  className="mt-4 bg-white/95 rounded-2xl p-3.5 border-2 border-amber-200 inline-flex items-center gap-3 shadow-sm hover:shadow-md hover:border-amber-400 hover:scale-102 transition-all cursor-pointer group"
                >
                   <div>
                     <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-0.5">ABHA Number</p>
                     <p className="text-[18px] font-black text-[#16324F] tracking-[0.1em] font-mono leading-none">
                       {abhaDisplay}
                     </p>
                   </div>
                   {isAbhaLinked ? (
                     <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                     </span>
                   ) : (
                     <span className="bg-amber-100 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-amber-200">
                       Not linked yet
                     </span>
                   )}
                </div>
              </div>
            </div>

            {/* Health ID Box Right (3D Card) */}
            <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 border-2 border-amber-200/80 shadow-[0_15px_30px_-10px_rgba(245,158,11,0.2)] w-full md:w-80 shrink-0 relative overflow-hidden group hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] transition-all">
               <div className="flex items-center gap-2 mb-4 relative z-10">
                 <ShieldAlert className="w-4 h-4 text-amber-500" />
                 <span className="text-[10px] font-black text-[#16324F] uppercase tracking-[0.2em]">Health ID</span>
               </div>
               
               <div className="flex flex-col items-center text-center relative z-10">
                 <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 border border-amber-100 group-hover:scale-110 transition-transform shadow-xs">
                   {isAbhaLinked ? <ShieldCheck className="w-8 h-8 text-emerald-600" /> : <Lock className="w-8 h-8 text-amber-400" />}
                 </div>
                 <h3 className="text-sm font-black text-[#16324F] mb-1">
                   {isAbhaLinked ? "ABHA Account Active" : "Secure your health identity"}
                 </h3>
                 <p className="text-[11px] font-medium text-[#64748B] mb-4 leading-relaxed px-1">
                   {isAbhaLinked
                     ? "Your verified ABDM Health Account is linked for digital hospital prescriptions & lab results."
                     : "Link your ABHA number to access complete health records and government health benefits."}
                 </p>
                 <button
                   type="button"
                   onClick={() => setShowAbhaModal(true)}
                   className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs py-3.5 rounded-xl shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:shadow-lg transition-all uppercase tracking-wider cursor-pointer"
                 >
                   {isAbhaLinked ? "View Official ABHA Card" : "Link ABHA Number"}
                 </button>
               </div>
            </div>

          </div>
          
          {/* Bottom ASHA verification strip */}
          <div className="relative z-10 mt-6 border-t border-amber-200/50 pt-4 flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-2xs border border-amber-200/50">
               {isAbhaLinked ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-amber-500" />}
             </div>
             <div>
               <p className="text-xs font-black text-[#16324F]">
                 {isAbhaLinked ? "Verified by ASHA & ABDM" : "Pending ASHA verification"}
               </p>
               <p className="text-[11px] font-medium text-[#64748B]">
                 {isAbhaLinked ? "Your health identity is linked with Shirwal PHC." : "Your ASHA worker will verify and link your ABHA number."}
               </p>
             </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">

        {/* ── Latest Health Readings ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5 px-2">
            <h3 className="text-base sm:text-lg font-black text-[#16324F] flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Latest Health Readings
            </h3>
            <button
              onClick={() => setUpdateMetric("all")}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl text-[11px] font-black hover:bg-amber-100 hover:shadow-xs transition-all uppercase tracking-wider shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Update Reading
            </button>
          </div>

          {loadingVitals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-[24px] border border-slate-100 h-36 animate-pulse shadow-xs" />)}
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

          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 mt-5 text-xs font-black text-amber-600 hover:text-amber-700 hover:underline px-2 uppercase tracking-wide cursor-pointer"
          >
            View full history <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Recent Activity ── */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#16324F] flex items-center gap-2 mb-5 px-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Recent Activity
          </h3>
          
          <div
            onClick={() => onNavigateTab && onNavigateTab("timeline")}
            className="bg-white rounded-[24px] border border-slate-200 px-6 py-6 shadow-xs relative overflow-hidden group hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
          >
            <div className="absolute top-0 bottom-0 left-[35px] w-0.5 bg-slate-100" />
            
            {lastVisitDate ? (
              <div className="relative flex items-center gap-5">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                </div>
                
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 text-amber-500 border border-amber-100/60 shadow-xs">
                   <ActivitySquare className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1">{fmtISO(lastVisitDate)}</p>
                  <p className="text-[15px] font-black text-[#16324F] tracking-tight">ASHA Home Visit</p>
                  <p className="text-[12px] font-medium text-[#64748B] mt-0.5 truncate">Vitals and health status recorded by ASHA worker.</p>
                </div>
                
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider">
                    Completed
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#94A3B8] italic text-center py-4">No recent activity recorded.</p>
            )}
          </div>
          
          <button
            onClick={() => onNavigateTab && onNavigateTab("timeline")}
            className="flex items-center gap-1.5 mt-5 text-xs font-black text-amber-600 hover:text-amber-700 hover:underline px-2 uppercase tracking-wide cursor-pointer"
          >
            View full timeline <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ── Modals ── */}
      {showAbhaModal && (
        <AbhaModal
          member={member}
          onClose={() => setShowAbhaModal(false)}
          onLinked={(newAbha) => {
            setCurrentAbha(newAbha);
            fetchVitals();
          }}
        />
      )}

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