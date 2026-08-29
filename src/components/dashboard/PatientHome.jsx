import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Heart, Droplet, Weight, Ruler, Thermometer, Wind, Activity, CheckCircle2, Clock, Phone, ChevronRight, ActivitySquare, Plus, ShieldAlert, Baby, Lock, Camera, Loader2 } from "lucide-react";
import { getLatestVitals } from "../../services/ashaService";
import UpdateVitalsModal from "../Patient/UpdateVitalsModal";
import VitalsHistory from "../Patient/VitalsHistory";
import { supabase } from "../../services/supabase";

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
  const base = "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm";
  if (source === "ASHA recorded") return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200/60`}>{source}</span>;
  if (source === "Clinical")      return <span className={`${base} bg-indigo-50 text-indigo-700 border border-indigo-200/60`}>{source}</span>;
  if (source === "SELF-REPORTED") return <span className={`${base} bg-amber-50 text-amber-700 border border-amber-200/60`}>{source}</span>;
  return <span className={`${base} bg-slate-50 text-slate-700 border border-slate-200/60`}>{source}</span>;
}

function VitalCard({ icon: Icon, iconColor, bgShapeColor, label, value, unit, source, recordedAt, onUpdate }) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className="relative bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_-10px_rgba(251,191,36,0.2)] hover:border-amber-100 transition-all duration-500 p-6 flex flex-col gap-4 overflow-hidden group">
      
      {/* Expressive background pattern */}
      <div className={`absolute -bottom-8 -right-8 w-36 h-36 rounded-tl-[80px] opacity-[0.35] transition-transform duration-700 group-hover:scale-[1.2] group-hover:-rotate-12 pointer-events-none ${bgShapeColor}`} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
             <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <span className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.15em]">{label}</span>
        </div>
      </div>

      <div className="relative z-10 pt-2">
        {hasValue ? (
          <>
            <div>
              <p className="text-[38px] font-black text-[#16324F] leading-none tracking-tighter">
                {value}<span className="text-[14px] font-black text-[#94A3B8] ml-1.5 tracking-normal">{unit}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {sourceBadge(source)}
              {recordedAt && <span className="text-[10px] text-[#94A3B8] font-bold tracking-widest">{formatDate(recordedAt)}</span>}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-1">
            <p className="text-[14px] font-bold text-[#CBD5E1] italic">Not recorded yet</p>
            <button onClick={onUpdate}
              className="w-fit flex items-center gap-1.5 text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-100/50 px-4 py-2 rounded-xl hover:bg-amber-100 hover:shadow-sm transition-all uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5" /> Add reading
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
    setAvatarStr(member?.avatar_url || null);
    setImgError(false);
  }, [member?.avatar_url, member?.id]);

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !member?.id) return;
      
      setUploadingAvatar(true);
      setImgError(false);
      
      // We will bypass buckets and use highly-compressed Base64.
      // This avoids ALL Supabase permissions/RLS issues permanently.
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            // Compress image to max 200x200
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
              if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Highly compressed jpeg
            const base64Data = canvas.toDataURL('image/jpeg', 0.6);
            
            // Update the database
            const { error: dbError } = await supabase
              .from('village_patients')
              .update({ avatar_url: base64Data })
              .eq('id', member.id);
              
            if (dbError) throw dbError;
            
            // Fix: Update local storage so the image survives page refresh!
            const authDataRaw = localStorage.getItem("radvault_family_auth");
            if (authDataRaw) {
              const authData = JSON.parse(authDataRaw);
              if (authData && authData.members) {
                const memberIndex = authData.members.findIndex(m => m.id === member.id);
                if (memberIndex !== -1) {
                  authData.members[memberIndex].avatar_url = base64Data;
                  localStorage.setItem("radvault_family_auth", JSON.stringify(authData));
                }
              }
            }
            
            // Update UI instantly
            setAvatarStr(base64Data);
            setUploadingAvatar(false);
          } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save. Did you add the avatar_url column to village_patients?');
            setUploadingAvatar(false);
          }
        };
        img.onerror = () => {
          alert("Invalid image file.");
          setUploadingAvatar(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message);
      setUploadingAvatar(false);
    }
  };

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
    <div className="min-h-full pb-40 bg-[#FCFBF8] font-sans">
      
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
        className="hidden" 
      />

      {/* ── Patient Hero Card ── */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative rounded-[40px] overflow-hidden shadow-[0_8px_40px_-12px_rgba(251,191,36,0.35)] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-[#FFF8E7] to-orange-100/50 p-6 sm:p-10">
          
          {/* Saffron geometric patterns */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-2xl translate-y-32 -translate-x-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-yellow-300/10 rounded-full blur-xl pointer-events-none" />
          
          {/* Organic arc */}
          <svg className="absolute bottom-0 right-0 w-full h-[120%] opacity-20 pointer-events-none transform translate-x-[20%]" viewBox="0 0 800 400" preserveAspectRatio="none">
            <path d="M200,400 C400,300 600,400 800,0 L800,400 Z" fill="url(#saffronGradHero)" />
            <defs>
              <linearGradient id="saffronGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FCD34D" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 md:items-start justify-between">
            
            {/* Patient Info Left */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              
              {/* Avatar with Upload */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl shadow-amber-300/50 flex flex-col items-center justify-center text-white relative cursor-pointer group shrink-0 overflow-hidden border-4 border-white"
              >
                 {(avatarStr && !imgError) ? (
                   <img src={avatarStr} alt={member.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                 ) : (
                   <span className="text-4xl font-black">{member.name.charAt(0).toUpperCase()}</span>
                 )}
                 
                 {/* Upload Overlay */}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                 </div>

                 {/* Status indicator */}
                 <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                   <div className="w-4 h-4 bg-amber-400 rounded-full animate-pulse" />
                 </div>
              </div>

              <div className="pt-2">
                <span className="inline-block bg-amber-200 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-3 shadow-sm">
                  Primary Member
                </span>
                <h1 className="text-[32px] sm:text-[40px] font-black text-[#16324F] leading-none mb-3 tracking-tight drop-shadow-sm">
                  {member.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-[15px] font-bold text-[#64748B]">
                  <span>{member.age_years ? `${member.age_years} yrs` : "Unknown"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{member.gender}</span>
                  {member.blood_group && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-600 font-black">{member.blood_group}</span>
                    </>
                  )}
                </div>

                <div className="mt-6 bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-amber-200/60 inline-block shadow-sm">
                   <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1.5">ABHA Number</p>
                   <div className="flex items-center gap-3">
                     <p className="text-[20px] font-black text-[#16324F] tracking-[0.1em] font-mono leading-none">
                       {abhaDisplay}
                     </p>
                     {!member.abha_id && (
                       <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border border-amber-200">Not linked yet</span>
                     )}
                   </div>
                </div>
              </div>
            </div>

            {/* Health ID Box Right */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 border border-white shadow-[0_12px_40px_-12px_rgba(251,191,36,0.2)] w-full md:w-80 shrink-0 relative overflow-hidden group">
               {/* Internal Card Geometric Accent */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-[100px] pointer-events-none" />
               
               <div className="flex items-center gap-2 mb-6 relative z-10">
                 <ShieldAlert className="w-4 h-4 text-amber-500" />
                 <span className="text-[11px] font-black text-[#16324F] uppercase tracking-[0.2em]">Health ID</span>
               </div>
               
               <div className="flex flex-col items-center text-center relative z-10">
                 <div className="w-20 h-20 bg-amber-50 rounded-[20px] flex items-center justify-center mb-4 border border-amber-100/50 group-hover:scale-105 transition-transform duration-300">
                   <Lock className="w-10 h-10 text-amber-400" />
                 </div>
                 <h3 className="text-[16px] font-black text-[#16324F] mb-1.5">Secure your health identity</h3>
                 <p className="text-[12px] font-medium text-[#64748B] mb-5 leading-relaxed px-2">
                   Link your ABHA number to access complete health records and benefits.
                 </p>
                 <button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black text-[13px] py-3.5 rounded-xl shadow-lg shadow-amber-300/40 hover:shadow-amber-400/60 transition-all uppercase tracking-widest border border-amber-400">
                   Link ABHA Number
                 </button>
               </div>
            </div>

          </div>
          
          {/* Bottom ASHA verification strip */}
          <div className="relative z-10 mt-8 border-t border-amber-200/40 pt-5 flex items-center gap-4">
             <div className="w-12 h-12 bg-white/70 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border border-amber-200/50 backdrop-blur-sm">
               <ShieldAlert className="w-6 h-6 text-amber-500" />
             </div>
             <div>
               <p className="text-[14px] font-black text-[#16324F]">Pending ASHA verification</p>
               <p className="text-[12px] font-medium text-[#64748B] mt-0.5">Your ASHA worker will verify and link your ABHA number.</p>
             </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12">

        {/* ── Latest Health Readings ── */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[18px] font-black text-[#16324F] flex items-center gap-2">
              <Activity className="w-6 h-6 text-amber-500" />
              Latest Health Readings
            </h3>
            <button onClick={() => setUpdateMetric("all")}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-5 py-2.5 rounded-xl text-[12px] font-black hover:bg-amber-100 hover:border-amber-300 transition-all uppercase tracking-widest shadow-sm">
              <Plus className="w-4 h-4" /> Update Reading
            </button>
          </div>

          {loadingVitals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-[28px] border border-slate-100 h-40 animate-pulse shadow-sm" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <VitalCard icon={Heart} iconColor="text-rose-500" bgShapeColor="bg-rose-100" label="Blood Pressure" value={bpVal} unit="mmHg" source={bpSource} recordedAt={bpDate} onUpdate={() => setUpdateMetric("bp")} />
              <VitalCard icon={Droplet} iconColor="text-amber-500" bgShapeColor="bg-orange-100" label="Blood Sugar" value={sugarVal} unit="mg/dL" source={sugarSource} recordedAt={sugarDate} onUpdate={() => setUpdateMetric("sugar")} />
              <VitalCard icon={Weight} iconColor="text-emerald-500" bgShapeColor="bg-emerald-100" label="Weight" value={weightVal} unit="kg" source={weightSource} recordedAt={weightDate} onUpdate={() => setUpdateMetric("weight")} />
              <VitalCard icon={Ruler} iconColor="text-purple-500" bgShapeColor="bg-purple-100" label="Height" value={heightVal} unit="cm" source={heightSource} recordedAt={heightDate} onUpdate={() => setUpdateMetric("height")} />
              
              <VitalCard icon={Thermometer} iconColor="text-orange-500" bgShapeColor="bg-amber-100" label="Temperature" value={tempVal} unit="°C" source={tempSource} recordedAt={tempDate} onUpdate={() => setUpdateMetric("temp")} />
              <VitalCard icon={Wind} iconColor="text-sky-500" bgShapeColor="bg-sky-100" label="SpO₂" value={spo2Val} unit="%" source={spo2Source} recordedAt={spo2Date} onUpdate={() => setUpdateMetric("spo2")} />
            </div>
          )}

          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 mt-6 text-[13px] font-black text-amber-500 hover:text-amber-600 hover:underline px-2 uppercase tracking-widest">
            View full history <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Recent Activity ── */}
        <div>
          <h3 className="text-[18px] font-black text-[#16324F] flex items-center gap-2 mb-6 px-2">
            <Clock className="w-6 h-6 text-amber-500" />
            Recent Activity
          </h3>
          
          <div className="bg-white rounded-[32px] border border-slate-200 px-8 py-8 shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
            <div className="absolute top-0 bottom-0 left-[43px] w-1 bg-slate-100" />
            
            {lastVisitDate ? (
              <div className="relative flex items-center gap-6">
                <div className="w-10 h-10 rounded-full bg-white border-4 border-amber-200 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                  <div className="w-3 h-3 bg-amber-400 rounded-full" />
                </div>
                
                <div className="w-14 h-14 bg-amber-50 rounded-[20px] flex items-center justify-center shrink-0 text-amber-500 border border-amber-100/50 shadow-sm">
                   <ActivitySquare className="w-7 h-7" />
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.25em] mb-1.5">{fmtISO(lastVisitDate)}</p>
                  <p className="text-[17px] font-black text-[#16324F] tracking-tight">ASHA Home Visit</p>
                  <p className="text-[13px] font-medium text-[#64748B] mt-1 truncate">Vitals and health status recorded by ASHA worker.</p>
                </div>
                
                <div className="hidden sm:flex items-center gap-5 shrink-0">
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-sm">
                    Completed
                  </span>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[15px] font-medium text-[#94A3B8] italic text-center py-6">No recent activity recorded.</p>
            )}
          </div>
          
          <button className="flex items-center gap-1.5 mt-6 text-[13px] font-black text-amber-500 hover:text-amber-600 hover:underline px-2 uppercase tracking-widest">
            View full timeline <ChevronRight className="w-4 h-4" />
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