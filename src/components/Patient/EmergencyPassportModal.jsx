import React, { useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  ShieldAlert, Phone, Heart, Baby, AlertTriangle, Download, X,
  CheckCircle2, Siren, User, MapPin, Pill, Activity, Stethoscope,
  Building2, Sparkles, Loader2, ArrowRight
} from "lucide-react";

export default function EmergencyPassportModal({
  member,
  latestVitals = {},
  recentPrescriptions = [],
  onClose,
  onOpenEmergency
}) {
  const [downloading, setDownloading] = useState(false);
  const printCanvasRef = useRef(null);

  if (!member) return null;

  const bloodGroup = member.blood_group || "O+";
  const village = member.village || "Shirwal Village · Sector 4";
  const familyPhone = member.phone || member.mobile || member.family_phone || "9822114433";
  const ashaName = "Priya Deshmukh (ASHA)";
  const ashaPhone = "9822334455";
  const phcName = "Shirwal Primary Health Centre";
  const phcPhone = "02169-244222";

  // Critical health tags
  const isAnc = member.is_pregnant || false;
  const isChild = member.is_child || false;
  const isHighRisk = member.status === "red" || member.is_high_risk || false;
  const allergies = member.allergies || "Penicillin Allergy (High Risk)";
  const chronic = member.chronic_condition || (isHighRisk ? "Hypertension & Gestational Risk" : "None reported");

  // Format emergency payload for QR scanner (instant offline JSON data readable by any smartphone camera)
  const emergencyPayload = JSON.stringify({
    type: "RADVAULT_EMERGENCY_PASSPORT",
    name: member.name,
    age: member.age_years || 24,
    gender: member.gender || "Female",
    blood: bloodGroup,
    village: village,
    emergency_contacts: {
      family: familyPhone,
      asha: ashaPhone,
      phc: phcPhone,
      ambulance: "108"
    },
    critical_alerts: {
      pregnant_anc: isAnc ? "YES (ANC Follow-Up)" : "NO",
      allergies: allergies,
      chronic_condition: chronic
    },
    latest_vitals: {
      bp: latestVitals?.bp_systolic ? `${latestVitals.bp_systolic.bp_systolic}/${latestVitals.bp_systolic.bp_diastolic}` : "120/80",
      pulse: latestVitals?.pulse_bpm?.pulse_bpm || 78,
      spo2: latestVitals?.spo2_pct?.spo2_pct ? `${latestVitals.spo2_pct.spo2_pct}%` : "98%"
    },
    portal: `https://radvault.gov.in/emergency/${member.id || 'pat-demo'}`
  });

  // Export printable PNG emergency card
  const handleDownloadCard = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
      bgGrad.addColorStop(0, "#16324F");
      bgGrad.addColorStop(1, "#0B2545");
      ctx.fillStyle = bgGrad;
      ctx.roundRect(0, 0, 800, 500, 32);
      ctx.fill();

      // Top Red Emergency Stripe
      ctx.fillStyle = "#DC2626";
      ctx.roundRect(0, 0, 800, 70, [32, 32, 0, 0]);
      ctx.fill();

      // Header Text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("RADVAULT · EMERGENCY MEDICAL PASSPORT", 30, 44);

      ctx.fillStyle = "#FEE2E2";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("24x7 FIRST RESPONDER TRIAGE CARD", 500, 44);

      // Patient Name & Blood Group
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(member.name, 40, 130);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`${member.gender || "Female"} • ${member.age_years || 24} yrs • Village: ${village}`, 40, 160);

      // Blood Group Highlight Box
      ctx.fillStyle = "#DC2626";
      ctx.roundRect(40, 185, 120, 50, 12);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(bloodGroup, 70, 220);

      // Critical flags
      ctx.fillStyle = "#F87171";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("⚠️ ALLERGIES: " + allergies, 180, 205);
      ctx.fillStyle = "#FCD34D";
      ctx.fillText("🩺 CONDITION: " + chronic, 180, 230);

      // Contacts Box
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.roundRect(40, 260, 480, 190, 16);
      ctx.fill();

      ctx.fillStyle = "#38BDF8";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("EMERGENCY DIRECT CONTACTS", 60, 295);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(`• Family Contact: ${familyPhone}`, 60, 330);
      ctx.fillText(`• ASHA Worker: ${ashaName} (${ashaPhone})`, 60, 365);
      ctx.fillText(`• PHC Reception: ${phcName} (${phcPhone})`, 60, 400);
      ctx.fillText(`• Ambulance Dispatch: 108 (Toll Free)`, 60, 435);

      // Draw QR Code from hidden canvas
      const qrCanvas = printCanvasRef.current?.querySelector("canvas");
      if (qrCanvas) {
        ctx.fillStyle = "#FFFFFF";
        ctx.roundRect(550, 180, 210, 210, 16);
        ctx.fill();
        ctx.drawImage(qrCanvas, 560, 190, 190, 190);
        ctx.fillStyle = "#64748B";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("SCAN WITH ANY PHONE", 580, 415);
      }

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `RadVault_Emergency_Passport_${(member.name || "Patient").replace(/\s+/g, "_")}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate emergency card:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
      
      {/* Hidden high-contrast QR canvas for clean PNG download */}
      <div ref={printCanvasRef} className="hidden">
        <QRCodeCanvas value={emergencyPayload} size={250} level="M" includeMargin={true} />
      </div>

      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* ── Top Red Emergency Header ── */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
              <Siren className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-wide">
                  Emergency Medical Passport
                </h3>
                <span className="text-[9px] font-black bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Triage QR
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-medium">
                Scannable by 108 Ambulance paramedics, ASHA workers & bystanders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-800 flex-1">
          
          {/* Patient Core Summary & QR Code Grid */}
          <div className="bg-gradient-to-br from-slate-900 via-[#16324F] to-slate-800 text-white rounded-3xl p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="space-y-2 relative z-10 text-center sm:text-left">
              <span className="inline-block bg-red-500/30 text-red-200 border border-red-400/40 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Life-Critical Medical ID
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{member.name}</h2>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-300">
                <span>{member.gender || "Female"}</span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span>{member.age_years ? `${member.age_years} yrs` : "24 yrs"}</span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-teal-300">{village}</span>
              </div>

              {/* Big Blood Group Badge */}
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                <div className="bg-red-600 text-white px-3.5 py-1.5 rounded-xl text-sm font-black flex items-center gap-1.5 shadow-md border border-red-400">
                  <Heart className="w-4 h-4 fill-white" />
                  <span>BLOOD: {bloodGroup}</span>
                </div>
                {isAnc && (
                  <span className="bg-rose-500/40 text-rose-200 border border-rose-300/40 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase">
                    ANC Mother (Pregnant)
                  </span>
                )}
              </div>
            </div>

            {/* Scannable Live QR Code Box */}
            <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0 border-2 border-amber-300 relative z-10">
              <QRCodeSVG value={emergencyPayload} size={110} level="M" includeMargin={false} />
              <span className="text-[9px] font-black text-slate-600 uppercase mt-1.5 tracking-wider">
                Scan for Vitals & Rx
              </span>
            </div>
          </div>

          {/* ── Critical Medical Alerts (Red Strip) ── */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Critical Allergies & Warnings</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-red-100">
                <span className="text-[10px] text-red-500 font-bold block uppercase">Severe Allergies</span>
                <span className="font-extrabold text-red-950">{allergies}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-red-100">
                <span className="text-[10px] text-red-500 font-bold block uppercase">Underlying Condition</span>
                <span className="font-extrabold text-red-950">{chronic}</span>
              </div>
            </div>
          </div>

          {/* ── Active Prescriptions & Doctor Advice (Connecting Doctor & Imaging Vault) ── */}
          <div className="bg-teal-50/70 border border-[#008F83]/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#008F83] font-black text-xs uppercase tracking-wider">
                <Pill className="w-4 h-4" />
                <span>Active Doctor Prescriptions & Regimen</span>
              </div>
              <span className="text-[9px] font-black bg-[#008F83] text-white px-2 py-0.5 rounded">
                PHC Verified
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 bg-white rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">Tab. Paracetamol 500mg</span>
                  <span className="text-[11px] text-slate-500">1 tab thrice daily after food (3 days)</span>
                </div>
                <span className="text-[10px] font-black text-[#008F83]">Fever / Pain</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">Sachet ORS (Oral Rehydration)</span>
                  <span className="text-[11px] text-slate-500">1 pack in 1 litre water daily</span>
                </div>
                <span className="text-[10px] font-black text-emerald-700">Hydration</span>
              </div>
            </div>
          </div>

          {/* ── 1-Tap Ground-Root Emergency Helplines ── */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              1-Tap Emergency Dispatch & Ground Contacts
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 108 Ambulance */}
              <a
                href="tel:108"
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xs flex flex-col items-center text-center transition-colors cursor-pointer"
              >
                <span className="text-xl mb-1">🚑</span>
                <span className="font-black text-xs leading-tight">108</span>
                <span className="text-[9px] text-red-100 font-bold mt-0.5">Ambulance</span>
              </a>

              {/* Family Member */}
              <a
                href={`tel:${familyPhone}`}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex flex-col items-center text-center transition-colors cursor-pointer"
              >
                <span className="text-xl mb-1">🏠</span>
                <span className="font-black text-xs text-slate-900 leading-tight">Family</span>
                <span className="text-[9px] text-slate-500 font-bold mt-0.5">{familyPhone.slice(-4)}</span>
              </a>

              {/* ASHA Worker */}
              <a
                href={`tel:${ashaPhone}`}
                className="p-3 bg-[#E8F7F3] hover:bg-teal-100 border border-[#008F83]/30 text-[#008F83] rounded-2xl shadow-xs flex flex-col items-center text-center transition-colors cursor-pointer"
              >
                <span className="text-xl mb-1">👩‍⚕️</span>
                <span className="font-black text-xs leading-tight">ASHA</span>
                <span className="text-[9px] text-[#008F83] font-bold mt-0.5">Priya D.</span>
              </a>

              {/* Shirwal PHC */}
              <a
                href={`tel:${phcPhone}`}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex flex-col items-center text-center transition-colors cursor-pointer"
              >
                <span className="text-xl mb-1">🏥</span>
                <span className="font-black text-xs text-slate-900 leading-tight">PHC</span>
                <span className="text-[9px] text-slate-500 font-bold mt-0.5">24x7 Desk</span>
              </a>
            </div>
          </div>

          {/* ── Broadcast Emergency SOS Trigger ── */}
          {onOpenEmergency && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEmergency();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider animate-pulse"
              >
                <Siren className="w-4 h-4" />
                <span>🚨 Broadcast Emergency SOS with GPS to PHC</span>
              </button>
            </div>
          )}

        </div>

        {/* ── Footer Actions ── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex-1 py-3 bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-800 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#008F83]" />}
            <span>{downloading ? "Generating PNG..." : "Download Emergency Card (PNG)"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
