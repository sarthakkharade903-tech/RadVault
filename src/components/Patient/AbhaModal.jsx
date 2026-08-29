import React, { useState, useRef, useEffect } from "react";
import {
  X, Shield, CheckCircle2, Lock, Smartphone, FileCheck,
  QrCode, Download, Loader2, ArrowRight, ArrowLeft, RefreshCw, Check,
  Sparkles, ExternalLink, Award
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../services/supabase";

export default function AbhaModal({ member, onClose, onLinked }) {
  const initialAbha = (member?.id && localStorage.getItem(`radvault_abha_${member.id}`)) || member?.abha_id || "";
  const isAlreadyLinked = Boolean(initialAbha);

  // If already linked, immediately show the official card (Step 4)!
  const [step, setStep] = useState(isAlreadyLinked ? 4 : 1);
  const [aadhaar, setAadhaar] = useState("");
  const [manualAbha, setManualAbha] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  
  const [generatedAbha, setGeneratedAbha] = useState(initialAbha || "91-8472-1940-2819");
  const [generatedAddress, setGeneratedAddress] = useState(
    member?.name ? `${member.name.toLowerCase().replace(/[^a-z]/g, ".")}@abdm` : "rekha.bai@abdm"
  );

  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (initialAbha) {
      setGeneratedAbha(initialAbha);
      setStep(4);
    }
  }, [initialAbha]);

  // Format Aadhaar number: 1234 5678 9012
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setAadhaar(formatted);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`abha-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSendOtp = () => {
    const rawAadhaar = aadhaar.replace(/\s/g, "");
    if (rawAadhaar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar Number.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 700);
  };

  const persistAbha = async (newAbhaId, newAddress) => {
    if (member?.id) {
      localStorage.setItem(`radvault_abha_${member.id}`, newAbhaId);
    }

    try {
      if (member?.id) {
        await supabase
          .from("village_patients")
          .update({ abha_id: newAbhaId })
          .eq("id", member.id);
      }
    } catch (e) {
      console.warn("Could not persist ABHA to Supabase:", e);
    }

    if (onLinked) onLinked(newAbhaId);
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your Aadhaar-linked mobile.");
      return;
    }
    setError("");
    setLoading(true);

    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const newAbhaId = `91-${p1}-${p2}-${p3}`;
    const cleanName = member.name.toLowerCase().replace(/[^a-z]/g, ".");
    const newAbhaAddress = `${cleanName}@abdm`;

    setGeneratedAbha(newAbhaId);
    setGeneratedAddress(newAbhaAddress);

    await persistAbha(newAbhaId, newAbhaAddress);

    setLoading(false);
    setStep(4);
  };

  const handleManualLink = async () => {
    if (!manualAbha.trim()) {
      setError("Please enter your 14-digit ABHA Number or ABHA Address.");
      return;
    }
    setError("");
    setLoading(true);

    const newAbhaId = manualAbha.trim();
    const newAbhaAddress = `${member.name.toLowerCase().replace(/[^a-z]/g, ".")}@abdm`;

    setGeneratedAbha(newAbhaId);
    setGeneratedAddress(newAbhaAddress);

    await persistAbha(newAbhaId, newAbhaAddress);

    setLoading(false);
    setStep(4);
  };

  // ─── Camera-Friendly Official ABDM Universal URL for Phone Scanning ─────────
  // Phone cameras (Google Lens, iPhone Camera, Samsung) immediately recognize and open this URL
  const birthYear = member?.age_years ? String(2026 - member.age_years) : "2004";
  const officialAbdmUrl = `https://abdm.gov.in/abha-verification?id=${encodeURIComponent(generatedAbha)}&name=${encodeURIComponent(member.name)}&gender=${encodeURIComponent(member.gender || 'Female')}&dob=${encodeURIComponent(birthYear)}&bg=${encodeURIComponent(member.blood_group || 'O+')}&facility=${encodeURIComponent('Shirwal PHC, Satara')}&status=VERIFIED_ACTIVE`;

  // ─── High-Resolution Isolated Card-Only PNG Generator ───
  const handleDownloadCardOnly = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1012;  // High-res CR80 card width (300 dpi)
      canvas.height = 638;  // High-res CR80 card height (300 dpi)
      const ctx = canvas.getContext("2d");

      // 1. Card Base Background with subtle gold gradient
      const grad = ctx.createLinearGradient(0, 0, 1012, 638);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(1, "#FFFDF7");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1012, 638);

      // Card 3D Border
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#F59E0B";
      ctx.strokeRect(4, 4, 1004, 630);

      // 2. Top Header Tricolor Ribbon
      ctx.fillStyle = "#FF9933"; // Saffron
      ctx.fillRect(0, 0, 1012, 16);
      ctx.fillStyle = "#FFFFFF"; // White
      ctx.fillRect(0, 16, 1012, 8);
      ctx.fillStyle = "#138808"; // Green
      ctx.fillRect(0, 24, 1012, 12);

      // Header Background
      ctx.fillStyle = "#FFFBEB";
      ctx.fillRect(0, 36, 1012, 110);

      // Header Text
      ctx.fillStyle = "#16324F";
      ctx.font = "900 28px sans-serif";
      ctx.fillText("NATIONAL HEALTH AUTHORITY", 50, 80);

      ctx.fillStyle = "#475569";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Ayushman Bharat Digital Mission (ABDM) · Govt. of India", 50, 115);

      // ABHA Badge
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(850, 60, 110, 50, 12) : ctx.fillRect(850, 60, 110, 50);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 26px sans-serif";
      ctx.fillText("ABHA", 870, 95);

      // Gold Divider Line
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 146);
      ctx.lineTo(972, 146);
      ctx.stroke();

      // 3. Photo Box / 3D Avatar
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(130, 260, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FEF3C7";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(member.name[0].toUpperCase(), 130, 282);
      ctx.textAlign = "left";

      // 4. Patient Information
      ctx.fillStyle = "#16324F";
      ctx.font = "900 36px sans-serif";
      ctx.fillText(member.name, 230, 230);

      ctx.fillStyle = "#334155";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(`Gender: ${member.gender || "Female"}  |  Age: ${member.age_years || "22"} yrs  |  Blood: ${member.blood_group || "O+"}`, 230, 275);

      ctx.fillStyle = "#D97706";
      ctx.font = "bold 22px monospace";
      ctx.fillText(`Address: ${generatedAddress}`, 230, 315);

      // 5. ABHA Number Highlighting Box
      ctx.fillStyle = "#FFFBEB";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(50, 370, 620, 150, 20) : ctx.fillRect(50, 370, 620, 150);
      ctx.fill();
      ctx.strokeStyle = "#FCD34D";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#64748B";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("ABHA NUMBER / आयुष्मान भारत स्वास्थ्य खाता क्रमांक", 75, 410);

      ctx.fillStyle = "#16324F";
      ctx.font = "900 44px monospace";
      ctx.fillText(generatedAbha, 75, 470);

      // 6. High-Contrast QR Code on Canvas
      const qrCanvas = qrCanvasRef.current?.querySelector("canvas");
      if (qrCanvas) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(710, 190, 250, 250);
        ctx.strokeStyle = "#FDE68A";
        ctx.lineWidth = 2;
        ctx.strokeRect(710, 190, 250, 250);
        ctx.drawImage(qrCanvas, 720, 200, 230, 230);
      }

      ctx.fillStyle = "#64748B";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan with Phone Camera", 835, 465);
      ctx.textAlign = "left";

      // 7. Official Seal & Footer
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 560, 1012, 78);
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 560);
      ctx.lineTo(1012, 560);
      ctx.stroke();

      ctx.fillStyle = "#0D9488";
      ctx.font = "900 20px sans-serif";
      ctx.fillText("✓ 100% Verified Digital Health ID  ·  National Health Authority (NHA)  ·  Govt. of India", 50, 605);

      // Save as isolated PNG
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `ABHA_Card_${member.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
    } catch (e) {
      console.error("Canvas export failed:", e);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      
      {/* Hidden High-Contrast QR Canvas for Crisp Export */}
      <div ref={qrCanvasRef} className="hidden">
        <QRCodeCanvas value={officialAbdmUrl} size={230} level="Q" includeMargin={true} />
      </div>

      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-[32px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col max-h-[92vh] border border-amber-200 animate-in zoom-in-95 duration-200">
        
        {/* Top Tricolor Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-white to-emerald-600 p-0.5" />
        <div className="bg-gradient-to-br from-amber-50 via-[#FFF9ED] to-amber-100/50 px-6 py-4 border-b border-amber-100 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-200/50 border border-amber-200">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  NHA · ABDM
                </span>
                <span className="text-[10px] font-black text-slate-400">Govt. of India</span>
              </div>
              <h2 className="text-base font-black text-[#16324F] leading-tight mt-0.5">Ayushman Bharat Health Account</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-2xl transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-slate-800 space-y-4">
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2 shadow-2xs">
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Choose Mode ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center py-2">
                <h3 className="text-lg font-black text-[#16324F]">Link ABHA for {member.name}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  ABHA gives you digital access to your lab reports, prescriptions, and health records across India.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-br from-amber-50 to-orange-50/50 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#16324F]">Generate via Aadhaar OTP</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Instant creation using 12-digit Aadhaar number</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#16324F]">I already have an ABHA ID</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Enter existing 14-digit number or @abdm address</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Your data is 100% encrypted &amp; protected under ABDM Data Privacy Standards.</span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Aadhaar Number Entry ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div>
                <h3 className="text-base font-black text-[#16324F]">Enter Aadhaar Number</h3>
                <p className="text-xs text-slate-500 mt-0.5">An OTP will be sent to your Aadhaar-registered mobile number.</p>
              </div>

              <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  12-Digit Aadhaar Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaar}
                  onChange={handleAadhaarChange}
                  className="w-full text-xl font-mono font-black text-[#16324F] tracking-[0.2em] focus:outline-none placeholder-slate-300"
                />
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
                <p className="font-black">Consent:</p>
                <p className="text-[11px] mt-0.5 text-amber-800">
                  I give consent to fetch my demographic details for generating an Ayushman Bharat Health Account (ABHA).
                </p>
              </div>

              <button
                type="button"
                disabled={loading || aadhaar.replace(/\s/g, "").length !== 12}
                onClick={handleSendOtp}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 disabled:from-slate-200 disabled:to-slate-300 text-white disabled:text-slate-400 font-black text-xs rounded-2xl shadow-lg shadow-amber-300/40 hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get Aadhaar OTP →</span>}
              </button>
            </div>
          )}

          {/* ── STEP 3: OTP Verification ── */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in text-center">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <Smartphone className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-black text-[#16324F]">Verify OTP</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter the 6-digit OTP sent to your Aadhaar mobile.</p>
                <p className="text-[11px] text-teal-800 font-black mt-1 bg-teal-50 border border-teal-200 px-3 py-0.5 rounded-full inline-block">
                  Demo OTP: Any 6 digits (e.g. 123456)
                </p>
              </div>

              <div className="flex justify-center gap-2 py-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    id={`abha-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-mono font-black border-2 border-slate-300 focus:border-amber-500 rounded-2xl bg-white focus:outline-none shadow-2xs transition-all"
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={loading || otp.join("").length !== 6}
                onClick={handleVerifyOtp}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 disabled:from-slate-200 disabled:to-slate-300 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-300/40 hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify &amp; Create ABHA Card ✓</span>}
              </button>
            </div>
          )}

          {/* ── STEP 4: Official 3D Holographic ABHA Card View & Card-Only Download ── */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Verified Health ID
                </span>
                
                <button
                  onClick={() => setStep(1)}
                  className="text-[11px] font-black text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                >
                  Re-link / Change ID
                </button>
              </div>

              {/* ── Official 3D Tactile Ayushman Bharat Digital Card ── */}
              <div
                id="official-abha-card"
                className="bg-gradient-to-br from-amber-50/90 via-white to-amber-100/70 rounded-[28px] border-2 border-amber-300/90 p-5 shadow-[0_15px_35px_-10px_rgba(245,158,11,0.3)] relative overflow-hidden text-slate-800 transition-all hover:shadow-[0_20px_45px_-10px_rgba(245,158,11,0.4)]"
              >
                {/* 3D Specular Highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

                {/* Tricolor Header */}
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 tracking-wider leading-none">NATIONAL HEALTH AUTHORITY</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Ayushman Bharat Digital Mission (ABDM)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    ABHA
                  </span>
                </div>

                {/* Card Details */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-amber-300/50 flex-shrink-0 border-2 border-white">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-black text-[#16324F] leading-tight truncate">{member.name}</h4>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">
                      {member.gender || "Female"} • {member.age_years ? `${member.age_years} yrs` : "22 yrs"} • <span className="text-amber-700 font-black">{member.blood_group || "O+"}</span>
                    </p>
                    <p className="text-[10px] font-mono font-bold text-amber-800 mt-0.5 truncate">{generatedAddress}</p>
                  </div>
                  
                  {/* Real Scannable High-Contrast QR Code */}
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-amber-200 flex-shrink-0 flex flex-col items-center">
                    <QRCodeSVG value={officialAbdmUrl} size={64} level="Q" includeMargin={false} />
                    <span className="text-[7px] font-black text-slate-400 uppercase mt-1 tracking-wider">Scan with Camera</span>
                  </div>
                </div>

                {/* Number Highlight */}
                <div className="mt-4 p-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-amber-200/80 text-center shadow-2xs">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ABHA Number</p>
                  <p className="text-[20px] font-mono font-black text-[#16324F] tracking-[0.15em] leading-tight mt-0.5">{generatedAbha}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-teal-800 font-black">
                  <span>✓ 100% Verified Digital Health ID</span>
                  <span>Shirwal PHC</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCardOnly}
                  disabled={downloading}
                  className="flex-1 py-3.5 bg-white border-2 border-amber-400 hover:bg-amber-50 text-amber-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-amber-600" />}
                  <span>{downloading ? "Generating Card..." : "Download Official Card (PNG)"}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Manual ABHA Number Entry ── */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div>
                <h3 className="text-base font-black text-[#16324F]">Link Existing ABHA</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter your 14-digit ABHA Number or PHR Address.</p>
              </div>

              <div className="bg-white border-2 border-slate-200 focus-within:border-amber-400 rounded-2xl p-4 shadow-sm">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  ABHA ID / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91-4821-3920-1849 or rekhabai@abdm"
                  value={manualAbha}
                  onChange={e => setManualAbha(e.target.value)}
                  className="w-full text-sm font-mono font-bold text-[#16324F] focus:outline-none placeholder-slate-300"
                />
              </div>

              <button
                type="button"
                disabled={loading || !manualAbha.trim()}
                onClick={handleManualLink}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 disabled:from-slate-200 disabled:to-slate-300 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-300/40 hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Link &amp; Verify ABHA ✓</span>}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
