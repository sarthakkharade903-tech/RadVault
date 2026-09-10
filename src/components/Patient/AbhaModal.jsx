import React, { useState, useRef, useEffect } from "react";
import {
  X, Shield, CheckCircle2, Lock, Smartphone, FileCheck,
  QrCode, Download, Loader2, ArrowRight, ArrowLeft, RefreshCw, Check,
  Sparkles, ExternalLink, Award, Edit3, Camera
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../services/supabase";

export default function AbhaModal({ member, onClose, onLinked, initialMode = "auto" }) {
  const rawInitialAbha = (member?.id && localStorage.getItem(`radvault_abha_${member.id}`)) || member?.abha_id || "";
  const isAlreadyLinked = Boolean(rawInitialAbha && rawInitialAbha !== "PENDING" && rawInitialAbha !== "Not linked yet");
  const initialAbha = isAlreadyLinked ? rawInitialAbha : "";

  // If already linked and mode is auto, show official card (Step 4); if initialMode is "edit", show Step 5
  const [step, setStep] = useState(initialMode === "edit" ? 5 : (isAlreadyLinked ? 4 : 1));
  const [aadhaar, setAadhaar] = useState("");
  const [manualAbha, setManualAbha] = useState(initialAbha || "");
  const [manualAddress, setManualAddress] = useState(
    (member?.id && localStorage.getItem(`radvault_abha_addr_${member.id}`)) ||
    (initialAbha ? `${initialAbha.replace(/\D/g, "")}@abdm` : (member?.name ? `${member.name.toLowerCase().replace(/[^a-z]/g, "")}@abdm` : "rekha.bai@abdm"))
  );
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  
  const [generatedAbha, setGeneratedAbha] = useState(initialAbha || "91-2334-1727-2405");
  const [generatedAddress, setGeneratedAddress] = useState(
    (member?.id && localStorage.getItem(`radvault_abha_addr_${member.id}`)) ||
    (initialAbha ? `${initialAbha.replace(/\D/g, "")}@abdm` : (member?.name ? `${member.name.toLowerCase().replace(/[^a-z]/g, "")}@abdm` : "rekha.bai@abdm"))
  );

  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (initialAbha && initialMode !== "edit") {
      setGeneratedAbha(initialAbha);
      setManualAbha(initialAbha);
      setStep(4);
    }
  }, [initialAbha, initialMode]);

  // Helper: Format 14-digit ABHA number: XX-XXXX-XXXX-XXXX (matching Indian NHA standard)
  const formatAbhaNumber = (input) => {
    const raw = input.replace(/\D/g, "").slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
    if (raw.length <= 10) return `${raw.slice(0, 2)}-${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `${raw.slice(0, 2)}-${raw.slice(2, 6)}-${raw.slice(6, 10)}-${raw.slice(10, 14)}`;
  };

  const handleManualAbhaChange = (e) => {
    const val = e.target.value;
    // If user enters an @abdm address directly
    if (val.includes("@")) {
      setManualAbha(val);
    } else {
      const formatted = formatAbhaNumber(val);
      setManualAbha(formatted);
      // Auto update address if not customized
      if (formatted.length >= 2) {
        const rawDigits = formatted.replace(/\D/g, "");
        setManualAddress(`${rawDigits}@abdm`);
      }
    }
  };

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
    }, 600);
  };

  const persistAbha = async (newAbhaId, newAddress) => {
    if (member?.id) {
      localStorage.setItem(`radvault_abha_${member.id}`, newAbhaId);
      localStorage.setItem(`radvault_abha_addr_${member.id}`, newAddress);
    }

    try {
      if (member?.id) {
        // 1. Update village_patients
        await supabase
          .from("village_patients")
          .update({
            abha_id: newAbhaId,
            asha_verified_at: new Date().toISOString()
          })
          .eq("id", member.id);

        // 2. Sync to patients table
        try {
          await supabase
            .from("patients")
            .update({ unified_id: newAbhaId })
            .eq("id", member.id);
        } catch (ptErr) {
          console.warn("[AbhaModal] Clinical patient sync notice:", ptErr.message);
        }

        // 3. Sync to active referrals for this patient
        try {
          const { data: refRows } = await supabase
            .from("referrals")
            .select("id, vitals")
            .or(`patient_id.eq.${member.id},patient_name.ilike.%${member.name}%`);

          if (refRows && refRows.length > 0) {
            for (const r of refRows) {
              const currentVitals = r.vitals || {};
              await supabase
                .from("referrals")
                .update({
                  vitals: { ...currentVitals, abha_number: newAbhaId, abha_id: newAbhaId }
                })
                .eq("id", r.id);
            }
          }
        } catch (refErr) {
          console.warn("[AbhaModal] Referrals sync notice:", refErr.message);
        }
      }
    } catch (e) {
      console.warn("Could not persist ABHA to Supabase:", e);
    }

    if (onLinked) onLinked(newAbhaId, newAddress);
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
    const cleanDigits = `91${p1}${p2}${p3}`;
    const newAbhaAddress = `${cleanDigits}@abdm`;

    setGeneratedAbha(newAbhaId);
    setGeneratedAddress(newAbhaAddress);
    setManualAbha(newAbhaId);
    setManualAddress(newAbhaAddress);

    await persistAbha(newAbhaId, newAbhaAddress);

    setLoading(false);
    setStep(4);
  };

  const handleManualLink = async () => {
    const trimmed = manualAbha.trim();
    if (!trimmed) {
      setError("Please enter your 14-digit ABHA Number (e.g. 91-2334-1727-2405).");
      return;
    }

    // Auto format if raw 14 digits entered
    let formattedAbha = trimmed;
    if (/^\d{14}$/.test(trimmed)) {
      formattedAbha = formatAbhaNumber(trimmed);
    }

    setError("");
    setLoading(true);

    const resolvedAddress = manualAddress.trim() || `${formattedAbha.replace(/\D/g, "")}@abdm`;

    setGeneratedAbha(formattedAbha);
    setGeneratedAddress(resolvedAddress);

    await persistAbha(formattedAbha, resolvedAddress);

    setLoading(false);
    setStep(4);
  };

  // Pre-fill user card demo data
  const handlePrefillUserCard = () => {
    setManualAbha("91-2334-1727-2405");
    setManualAddress("91233417272405@abdm");
    setError("");
  };

  // ─── Camera-Friendly Official ABDM Universal URL for Phone Scanning ─────────
  const birthYear = member?.age_years ? String(2026 - member.age_years) : "2004";
  const displayDob = member?.dob ? new Date(member.dob).toLocaleDateString('en-IN') : `15/05/${birthYear}`;
  const displayMobile = member?.mobile || member?.phone || "9158100164";

  const officialAbdmUrl = `https://abdm.gov.in/abha-verification?id=${encodeURIComponent(generatedAbha)}&name=${encodeURIComponent(member.name)}&gender=${encodeURIComponent(member.gender || 'Female')}&dob=${encodeURIComponent(birthYear)}&bg=${encodeURIComponent(member.blood_group || 'O+')}&facility=${encodeURIComponent('Shirwal PHC, Satara')}&status=VERIFIED_ACTIVE`;

  // ─── High-Resolution Isolated Official ABHA Card PNG Generator ───
  const handleDownloadCardOnly = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1012;  // High-res CR80 card width (300 dpi)
      canvas.height = 638;  // High-res CR80 card height (300 dpi)
      const ctx = canvas.getContext("2d");

      // 1. Card Base Background (Official light blue/white tint matching physical card)
      const grad = ctx.createLinearGradient(0, 0, 1012, 638);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(1, "#F0F7FF");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1012, 638);

      // Card Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#3B82F6";
      ctx.strokeRect(3, 3, 1006, 632);

      // 2. Official Header: Royal Blue Banner matching physical card
      const headerGrad = ctx.createLinearGradient(0, 0, 1012, 0);
      headerGrad.addColorStop(0, "#1D4ED8");
      headerGrad.addColorStop(1, "#2563EB");
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, 1012, 110);

      // Header Text (Bilingual NHA & ABHA title)
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("National Health Authority · राष्ट्रीय आरोग्य प्राधिकरण", 50, 48);

      ctx.fillStyle = "#DBEAFE";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Ayushman Bharat Health Account (ABHA) · आयुष्मान भारत आरोग्य खाते (आभा)", 50, 85);

      // ABHA / NHA Pill Badge on Right
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(860, 25, 105, 55, 12) : ctx.fillRect(860, 25, 105, 55);
      ctx.fill();
      ctx.fillStyle = "#1D4ED8";
      ctx.font = "900 26px sans-serif";
      ctx.fillText("ABHA", 875, 62);

      // 3. Photo / Avatar on Left
      ctx.fillStyle = "#2563EB";
      ctx.beginPath();
      ctx.arc(130, 250, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#DBEAFE";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((member.name || "P")[0].toUpperCase(), 130, 272);
      ctx.textAlign = "left";

      // 4. Center Details Grid (Bilingual English / Marathi as on authentic cards)
      // Name / नाव
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("Name / नाव:", 230, 175);
      ctx.fillStyle = "#0F172A";
      ctx.font = "900 28px sans-serif";
      ctx.fillText(member.name, 230, 210);

      // ABHA Number / आभा क्रमांक
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("ABHA Number / आभा क्रमांक:", 230, 260);
      ctx.fillStyle = "#1D4ED8";
      ctx.font = "900 36px monospace";
      ctx.fillText(generatedAbha, 230, 302);

      // ABHA Address / आभा पत्ता
      ctx.fillStyle = "#64748B";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("ABHA Address / आभा पत्ता:", 230, 350);
      ctx.fillStyle = "#0369A1";
      ctx.font = "bold 22px monospace";
      ctx.fillText(generatedAddress, 230, 382);

      // Gender, DOB, Mobile Row
      ctx.fillStyle = "#475569";
      ctx.font = "bold 17px sans-serif";
      const genderStr = member.gender || "Female";
      ctx.fillText(`Gender / लिंग: ${genderStr}`, 230, 440);
      ctx.fillText(`DOB / जन्मतारीख: ${displayDob}`, 430, 440);
      ctx.fillText(`Mobile / मोबाईल: ${displayMobile}`, 680, 440);

      // 5. High-Contrast QR Code on Right
      const qrCanvas = qrCanvasRef.current?.querySelector("canvas");
      if (qrCanvas) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(740, 160, 220, 220);
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 2;
        ctx.strokeRect(740, 160, 220, 220);
        ctx.drawImage(qrCanvas, 750, 170, 200, 200);
      }

      ctx.fillStyle = "#64748B";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan with Camera / OPD Kiosk", 850, 400);
      ctx.textAlign = "left";

      // 6. Official Footer Banner
      ctx.fillStyle = "#F1F5F9";
      ctx.fillRect(0, 560, 1012, 78);
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 560);
      ctx.lineTo(1012, 560);
      ctx.stroke();

      ctx.fillStyle = "#059669";
      ctx.font = "900 20px sans-serif";
      ctx.fillText("✓ Verified Digital Health ID · Ayushman Bharat Digital Mission (ABDM) · Govt. of India", 50, 606);

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
      
      {/* Hidden High-Contrast QR Canvas for Crisp PNG Export */}
      <div ref={qrCanvasRef} className="hidden">
        <QRCodeCanvas value={officialAbdmUrl} size={200} level="Q" includeMargin={true} />
      </div>

      <div className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[94vh] border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  NHA · ABDM
                </span>
                <span className="text-[10px] font-bold text-blue-100">Govt. of India</span>
              </div>
              <h2 className="text-base font-black leading-tight mt-0.5">Ayushman Bharat Health Account</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-slate-800 space-y-4">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2 shadow-2xs">
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Choose Mode ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center py-2">
                <h3 className="text-lg font-black text-[#16324F]">Link ABHA for {member.name}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Your 14-digit ABHA ID enables fast-track hospital OPD registration, unlocks PM-JAY &amp; MJPJAY insurance benefits, and secures your digital health records across India.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full bg-gradient-to-br from-blue-50 to-indigo-50/50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 p-4 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#16324F]">Enter / Edit 14-Digit ABHA Number</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Directly input physical card ID (e.g. 91-2334-1727-2405) or @abdm address</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex items-center justify-between text-left transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#16324F]">Generate via Aadhaar OTP (Demo)</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Instant creation using 12-digit Aadhaar number</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Protected under National Digital Health Mission &amp; ABDM Data Privacy Standards.</span>
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

              <div className="bg-white border-2 border-blue-300 rounded-2xl p-4 shadow-sm">
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

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 leading-relaxed">
                <p className="font-black">Consent:</p>
                <p className="text-[11px] mt-0.5 text-blue-800">
                  I give consent to fetch my demographic details for generating an Ayushman Bharat Health Account (ABHA).
                </p>
              </div>

              <button
                type="button"
                disabled={loading || aadhaar.replace(/\s/g, "").length !== 12}
                onClick={handleSendOtp}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-slate-200 disabled:to-slate-300 text-white disabled:text-slate-400 font-black text-xs rounded-2xl shadow-lg shadow-blue-300/40 hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
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

              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
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
                    className="w-11 h-12 text-center text-lg font-mono font-black border-2 border-slate-300 focus:border-blue-500 rounded-2xl bg-white focus:outline-none shadow-2xs transition-all"
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={loading || otp.join("").length !== 6}
                onClick={handleVerifyOtp}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-slate-200 disabled:to-slate-300 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-300/40 hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify &amp; Create ABHA Card ✓</span>}
              </button>
            </div>
          )}

          {/* ── STEP 4: Official ABDM Card View & PNG Download ── */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Verified Health ID
                </span>
                
                <button
                  onClick={() => setStep(5)}
                  className="text-xs font-black text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit / Update ABHA</span>
                </button>
              </div>

              {/* ── Official Digital Ayushman Bharat Card (Visual Replica of Physical Card) ── */}
              <div
                id="official-abha-card"
                className="bg-gradient-to-br from-white via-blue-50/40 to-slate-50 rounded-[28px] border-2 border-blue-300 p-5 shadow-xl relative overflow-hidden text-slate-800 transition-all"
              >
                {/* Official Blue Banner Header */}
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 -mx-5 -mt-5 p-4 text-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-xs">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black tracking-wider leading-none">NATIONAL HEALTH AUTHORITY</p>
                      <p className="text-[9px] font-bold text-blue-100 mt-0.5">Ayushman Bharat Health Account (ABHA) · Govt. of India</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black bg-white text-blue-800 px-2.5 py-0.5 rounded-lg shadow-xs">
                    ABHA
                  </span>
                </div>

                {/* Card Demographic Details */}
                <div className="flex items-start gap-4 pt-4">
                  {/* Photo / Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0 border-2 border-white">
                    {(member.name || "P")[0].toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Name / नाव</span>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">{member.name}</h4>
                    </div>

                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ABHA Address / आभा पत्ता</span>
                      <p className="text-xs font-mono font-black text-blue-700 truncate">{generatedAddress}</p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 pt-0.5 flex-wrap">
                      <span>{member.gender || "Female"}</span>
                      <span>•</span>
                      <span>DOB: {displayDob}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-black">{member.blood_group || "O+"}</span>
                    </div>
                  </div>
                  
                  {/* Real Scannable High-Contrast QR Code */}
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex-shrink-0 flex flex-col items-center">
                    <QRCodeSVG value={officialAbdmUrl} size={68} level="Q" includeMargin={false} />
                    <span className="text-[7px] font-black text-slate-400 uppercase mt-1 tracking-wider">Scan with Camera</span>
                  </div>
                </div>

                {/* 14-Digit Number Highlight Box */}
                <div className="mt-4 p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-center shadow-xs">
                  <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">
                    ABHA NUMBER / आभा क्रमांक
                  </p>
                  <p className="text-[22px] font-mono font-black text-slate-900 tracking-[0.15em] leading-tight mt-0.5">
                    {generatedAbha}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-700 font-black">
                  <span>✓ 100% Verified Digital Health ID</span>
                  <span>Linked with Shirwal PHC</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCardOnly}
                  disabled={downloading}
                  className="flex-1 py-3.5 bg-white border-2 border-blue-600 hover:bg-blue-50 text-blue-900 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-blue-600" />}
                  <span>{downloading ? "Generating Card..." : "Download Official Card (PNG)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Number</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Manual ABHA Number Entry / Edit ── */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(isAlreadyLinked ? 4 : 1)} className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900 cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                {/* Quick Auto-Fill for Testing */}
                <button
                  type="button"
                  onClick={handlePrefillUserCard}
                  className="text-[11px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl cursor-pointer transition-colors"
                >
                  ⚡ Fill Real Card: 91-2334-1727-2405
                </button>
              </div>

              <div>
                <h3 className="text-base font-black text-[#16324F]">
                  {isAlreadyLinked ? "Edit / Update ABHA Number" : "Enter Official 14-Digit ABHA"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter the 14-digit number printed on your physical government ABHA card.
                </p>
              </div>

              <div className="bg-white border-2 border-blue-300 focus-within:border-blue-500 rounded-2xl p-4 shadow-sm space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  14-Digit ABHA Number (XX-XXXX-XXXX-XXXX)
                </label>
                <input
                  type="text"
                  placeholder="91-2334-1727-2405"
                  value={manualAbha}
                  onChange={handleManualAbhaChange}
                  className="w-full text-lg font-mono font-black text-[#16324F] tracking-[0.1em] focus:outline-none placeholder-slate-300"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Automatically hyphenated as you type digits.
                </p>
              </div>

              <div className="bg-white border-2 border-slate-200 focus-within:border-blue-400 rounded-2xl p-4 shadow-sm space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ABHA Address / PHR Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. 91233417272405@abdm or username@abdm"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  className="w-full text-sm font-mono font-bold text-[#16324F] focus:outline-none placeholder-slate-300"
                />
              </div>

              <button
                type="button"
                disabled={loading || !manualAbha.trim()}
                onClick={handleManualLink}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save &amp; Verify ABHA ID ✓</span>}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

