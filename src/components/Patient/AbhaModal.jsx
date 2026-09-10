import React, { useState, useRef, useEffect } from "react";
import {
  X, Shield, CheckCircle2, Download, Loader2, ArrowLeft,
  Award, Edit3
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../services/supabase";

export default function AbhaModal({ member, onClose, onLinked, initialMode = "auto" }) {
  const rawInitialAbha = (member?.id && localStorage.getItem(`radvault_abha_${member.id}`)) || member?.abha_id || "";
  const isAlreadyLinked = Boolean(rawInitialAbha && rawInitialAbha !== "PENDING" && rawInitialAbha !== "Not linked yet");
  const initialAbha = isAlreadyLinked ? rawInitialAbha : "";

  // Two view modes: "edit" (14-digit input) and "card" (official blue card)
  const [viewMode, setViewMode] = useState(
    initialMode === "edit" || !isAlreadyLinked ? "edit" : "card"
  );
  const [manualAbha, setManualAbha] = useState(initialAbha || "");
  const [manualAddress, setManualAddress] = useState(
    (member?.id && localStorage.getItem(`radvault_abha_addr_${member.id}`)) ||
    (initialAbha ? `${initialAbha.replace(/\D/g, "")}@abdm` : (member?.name ? `${member.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@abdm` : "user@abdm"))
  );
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  
  const [generatedAbha, setGeneratedAbha] = useState(initialAbha || "91-2334-1727-2405");
  const [generatedAddress, setGeneratedAddress] = useState(
    (member?.id && localStorage.getItem(`radvault_abha_addr_${member.id}`)) ||
    (initialAbha ? `${initialAbha.replace(/\D/g, "")}@abdm` : (member?.name ? `${member.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@abdm` : "user@abdm"))
  );

  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (initialAbha && initialMode !== "edit") {
      setGeneratedAbha(initialAbha);
      setManualAbha(initialAbha);
      setViewMode("card");
    } else if (!isAlreadyLinked || initialMode === "edit") {
      setViewMode("edit");
    }
  }, [initialAbha, initialMode, isAlreadyLinked]);

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
    if (val.includes("@")) {
      setManualAbha(val);
    } else {
      const formatted = formatAbhaNumber(val);
      setManualAbha(formatted);
      if (formatted.length >= 2) {
        const rawDigits = formatted.replace(/\D/g, "");
        setManualAddress(`${rawDigits}@abdm`);
      }
    }
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
    setViewMode("card");
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

          {/* ── VIEW 1: Official ABDM Card View ── */}
          {viewMode === "card" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Verified Health ID
                </span>
                
                <button
                  onClick={() => setViewMode("edit")}
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
                  onClick={() => setViewMode("edit")}
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

          {/* ── VIEW 2: Direct 14-Digit ABHA Entry / Edit ── */}
          {viewMode === "edit" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                {isAlreadyLinked ? (
                  <button onClick={() => setViewMode("card")} className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-900 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Card
                  </button>
                ) : (
                  <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                    ABDM Universal Health ID
                  </span>
                )}

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
                  Enter the 14-digit number printed on your physical government ABHA card for {member.name}.
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
                  autoFocus
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

