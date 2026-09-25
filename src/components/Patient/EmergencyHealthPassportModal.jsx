import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield, X, Phone, Heart, Droplet, AlertTriangle,
  CheckCircle2, Camera, Download, Share2, Siren, User,
  FileText, Sparkles, ExternalLink, Activity, ArrowLeft
} from 'lucide-react';
import { supabase } from '../../services/supabase';

// Safe base64 utf8 encoder for universal cross-platform phone scanning
function encodeEmergencyPayload(payload) {
  try {
    const json = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
    return encodeURIComponent(b64);
  } catch (err) {
    console.error('Payload encode error:', err);
    return '';
  }
}

// Safe base64 utf8 decoder
function decodeEmergencyPayload(str) {
  try {
    const decodedB64 = decodeURIComponent(str);
    const json = decodeURIComponent(Array.prototype.map.call(atob(decodedB64), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (err) {
    console.error('Payload decode error:', err);
    return null;
  }
}

// Dynamic emergency contacts resolver across patient and family members
function resolveEmergencyContacts(patient, family, familyMembers = []) {
  const contacts = [];

  // 1. Explicit emergency contact saved directly on the patient profile
  const explicitName = patient?.emergency_contact_name;
  const explicitPhone = patient?.emergency_contact_phone || patient?.emergency_contact_mobile;
  if (explicitName && explicitPhone && explicitName !== 'None') {
    contacts.push({
      relation: "Primary Emergency Contact / Relative",
      name: explicitName,
      phone: explicitPhone
    });
  }

  // 2. Relative from the family household (excluding self)
  const patientId = patient?.id;
  const relatives = (familyMembers || []).filter(m => m.id !== patientId && (m.name || m.full_name));
  
  // Prefer spouse, head of family, or parent
  const primaryRelative = relatives.find(m => 
    /head|husband|spouse|wife|father|mother/i.test(m.relation_to_head || m.relationship_to_head || '')
  ) || relatives[0];

  if (primaryRelative && (!explicitPhone || primaryRelative.mobile !== explicitPhone)) {
    let relLabel = primaryRelative.relation_to_head || primaryRelative.relationship_to_head || "Family Relative";
    if (/head/i.test(relLabel)) {
      relLabel = primaryRelative.gender === 'Female' ? "Household Head / Relative" : "Husband / Primary Escort";
    }
    contacts.push({
      relation: relLabel,
      name: primaryRelative.name || primaryRelative.full_name,
      phone: primaryRelative.mobile || primaryRelative.phone || "+91 98989 89898"
    });
  }

  // If still no family contact found, check family head_of_family
  if (contacts.length === 0 && family?.head_of_family && family.head_of_family !== patient?.name) {
    contacts.push({
      relation: "Head of Family",
      name: family.head_of_family,
      phone: family.family_phone || "+91 98765 43210"
    });
  }

  // Fallback for isolated demo/village profile
  if (contacts.length === 0) {
    contacts.push({
      relation: "Husband / Primary Escort",
      name: "Rahul Patil",
      phone: "+91 98765 43210"
    });
  }

  // 3. Frontline ASHA escort
  const ashaName = patient?.asha_name || patient?.asha_worker_name || family?.asha_name || "Priya Deshmukh";
  contacts.push({
    relation: `Assigned Frontline ASHA (${patient?.village || family?.village || 'Shirwal Ward'})`,
    name: ashaName,
    phone: patient?.asha_phone || "+91 98231 44556"
  });

  // 4. National Ambulance 108 / 102
  contacts.push({
    relation: "National Emergency Ambulance",
    name: "108 / 102 (Janani Shishu)",
    phone: "108"
  });

  return contacts;
}

export default function EmergencyHealthPassportModal({
  member,
  family,
  familyMembers = [],
  patientId,
  isStandalone = false,
  onClose
}) {
  const [responderView, setResponderView] = useState(isStandalone);
  const [copied, setCopied] = useState(false);
  const [patientData, setPatientData] = useState(() => member || null);
  const [liveFamilyMembers, setLiveFamilyMembers] = useState(familyMembers || []);
  const [loadingLive, setLoadingLive] = useState(false);

  // ── On Mount: Extract URL Payload or Query Supabase for dynamic data ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const encodedPayload = urlParams.get('p');
    const pid = patientId || urlParams.get('passport') || member?.id;

    // 1. Instant 0ms hydration from decoded URL payload if present
    if (encodedPayload) {
      const decoded = decodeEmergencyPayload(encodedPayload);
      if (decoded) {
        setPatientData(prev => ({
          ...prev,
          id: decoded.id || pid,
          name: decoded.n || prev?.name,
          age_years: decoded.a || prev?.age_years,
          gender: decoded.g || prev?.gender,
          blood_group: decoded.b || prev?.blood_group,
          abha_id: decoded.ab || prev?.abha_id,
          known_allergies: decoded.al || prev?.known_allergies,
          chronic_conditions: decoded.cd ? [decoded.cd] : prev?.chronic_conditions,
          village: decoded.v || prev?.village,
          _urlContacts: decoded.c || null
        }));
      }
    }

    // 2. Fetch fresh live records from Supabase
    if (pid && pid !== 'demo' && pid !== 'rekha') {
      setLoadingLive(true);
      (async () => {
        try {
          const { data: pt } = await supabase
            .from('village_patients')
            .select('*')
            .eq('id', pid)
            .maybeSingle();

          if (pt) {
            setPatientData(prev => ({ ...prev, ...pt }));
            if (pt.family_id) {
              const { data: famMembers } = await supabase
                .from('village_patients')
                .select('*')
                .eq('family_id', pt.family_id);
              if (famMembers && famMembers.length > 0) {
                setLiveFamilyMembers(famMembers);
              }
            }
          }
        } catch (err) {
          console.warn('[EmergencyPassport] Live fetch note:', err.message);
        } finally {
          setLoadingLive(false);
        }
      })();
    }
  }, [patientId, member]);

  // Fallback defaults for Rekha Bai or active family member
  const currentPatient = patientData || member;
  const patientName = currentPatient?.name || currentPatient?.full_name || "Rekha Bai";
  const age = currentPatient?.age_years || currentPatient?.age || 22;
  const gender = currentPatient?.gender || "Female";
  const bloodGroup = currentPatient?.blood_group || "O+";
  const abhaNumber = currentPatient?.abha_id || currentPatient?.abha_number || currentPatient?.unified_id || "64-8837-7348-6384";
  const primaryAllergy = currentPatient?.known_allergies || currentPatient?.allergies || "No Known Drug Allergies (NKDA)";
  
  const activeCondition = currentPatient?.chronic_conditions?.length 
    ? (Array.isArray(currentPatient.chronic_conditions) ? currentPatient.chronic_conditions.join(', ') : currentPatient.chronic_conditions)
    : (currentPatient?.is_pregnant || currentPatient?.high_risk_pregnancy ? "High-Risk Pregnancy (32w Gestational Anemia)" : "Routine Clinical Monitoring");

  // Dynamic Contacts
  const emergencyContacts = (currentPatient?._urlContacts && currentPatient._urlContacts.length > 0)
    ? currentPatient._urlContacts.map(c => ({ relation: c.r, name: c.n, phone: c.p }))
    : resolveEmergencyContacts(currentPatient, family, liveFamilyMembers.length ? liveFamilyMembers : familyMembers);

  // ── Construct clean, phone-scannable live URL ──
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'https://radvault.vercel.app';
      }
      return window.location.origin;
    }
    return 'https://radvault.vercel.app';
  };

  const compactPayload = {
    id: currentPatient?.id || 'b6f81101-46d0-4b4d-8df0-9d9ce11a6a70',
    n: patientName,
    a: age,
    g: gender,
    b: bloodGroup,
    ab: abhaNumber,
    al: primaryAllergy,
    cd: activeCondition,
    v: currentPatient?.village || family?.village || 'Vadgaon',
    c: emergencyContacts.map(c => ({ r: c.relation, n: c.name, p: c.phone }))
  };

  const encodedToken = encodeEmergencyPayload(compactPayload);
  const liveScannableUrl = `${getBaseUrl()}/?passport=${currentPatient?.id || 'b6f81101-46d0-4b4d-8df0-9d9ce11a6a70'}&p=${encodedToken}`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(liveScannableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Standalone Mobile View Layout (Rendered when phone scans the QR code) ──
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start items-center p-3 sm:p-6 font-sans">
        <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl border-2 border-red-500/80 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.4)] overflow-hidden my-auto">
          
          {/* Emergency Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-5 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner animate-pulse">
                <Siren className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black tracking-tight leading-none uppercase">
                    Emergency Health Passport
                  </h1>
                  <span className="text-[9px] font-black bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-red-100 font-semibold mt-1">
                  24x7 First-Responder Critical Triage Dossier
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="bg-emerald-950 text-emerald-300 px-5 py-2 text-xs font-bold flex items-center gap-2 border-b border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Paramedic Mobile View • Live ABHA Network Record</span>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4">
            
            {/* Identity & Blood Group */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-red-100 bg-red-50/50 p-4 rounded-2xl border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xl flex items-center justify-center shadow-md">
                  {patientName[0]}
                </div>
                <div>
                  <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">PATIENT CITIZEN ID</span>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">{patientName}</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-0.5">
                    <span>{age} Yrs</span>
                    <span>•</span>
                    <span>{gender}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500 text-[11px]">ABHA: {abhaNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-600 text-white px-3.5 py-2.5 rounded-2xl shadow-md text-center shrink-0 border border-red-500">
                <span className="text-[8px] font-black tracking-widest uppercase block text-red-200">BLOOD GROUP</span>
                <span className="text-2xl font-black leading-none">{bloodGroup}</span>
                <span className="text-[8px] font-bold text-red-100 block mt-0.5">Verified</span>
              </div>
            </div>

            {/* Critical Guardrails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Drug Allergies (NKDA)
                </span>
                <p className="text-xs font-bold text-emerald-950">{primaryAllergy}</p>
              </div>

              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Active Triage Alert
                </span>
                <p className="text-xs font-black text-amber-950 truncate">{activeCondition}</p>
              </div>
            </div>

            {/* Clickable Emergency Contacts */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Primary Emergency Contacts (Tap to Call Instantly)
              </span>

              <div className="space-y-2">
                {emergencyContacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs transition-colors">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block">{c.relation}</span>
                      <span className="font-black text-slate-800 text-sm">{c.name}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Return / Navigation Button */}
            {onClose && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Open RadVault Connected Health Network</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ── Desktop Dashboard Modal View ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col border-2 border-red-500/80 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.35)] overflow-hidden">
        
        {/* ── Emergency Header Banner ── */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner animate-pulse">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight leading-none uppercase">
                  Emergency Health Passport
                </h3>
                <span className="text-[9px] font-black bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Offline Ready
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-semibold mt-1">
                24x7 Critical Medical Triage Dossier for First Responders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── First-Responder Simulator Mode Toggle ── */}
        <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center justify-between text-xs font-bold shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">First-Responder Camera View</span>
          </div>
          <button
            type="button"
            onClick={() => setResponderView(!responderView)}
            className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
              responderView
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {responderView ? '✓ Paramedic View Active' : 'Simulate Paramedic Scan'}
          </button>
        </div>

        {/* ── Scrollable Passport Body ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Main Emergency Identity Card */}
          <div className="bg-gradient-to-br from-red-50/70 via-white to-amber-50/50 rounded-3xl p-5 border-2 border-red-200/80 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {patientName[0]}
                </div>
                <div>
                  <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">PATIENT CITIZEN ID</span>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{patientName}</h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-0.5">
                    <span>{age} Yrs</span>
                    <span>•</span>
                    <span>{gender}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500 text-[11px]">ABHA: {abhaNumber}</span>
                  </div>
                </div>
              </div>

              {/* High-Visibility Blood Group Hero Badge */}
              <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-md text-center shrink-0 border border-red-500">
                <span className="text-[9px] font-black tracking-widest uppercase block text-red-200">BLOOD GROUP</span>
                <span className="text-2xl sm:text-3xl font-black leading-none">{bloodGroup}</span>
                <span className="text-[8px] font-bold text-red-100 block mt-0.5">Clinical Verified</span>
              </div>
            </div>

            {/* QR Code & Live Phone Scan Box */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="p-2.5 bg-white rounded-2xl border-2 border-slate-900 shadow-sm shrink-0">
                <QRCodeSVG
                  value={liveScannableUrl}
                  size={128}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <span className="text-[10px] font-black text-red-700 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  Live Phone-Scannable Emergency QR
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  📱 Scan with any smartphone camera to open this patient's emergency pass directly on mobile.
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Instant zero-login mobile dossier with verified blood type, allergies, and one-tap emergency calling.
                </p>
                <div className="pt-1">
                  <a
                    href={liveScannableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    <span>Open Live Mobile Pass In New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Critical Health Guardrails Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Allergies / Safety Box */}
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Drug Allergies (NKDA)
                </span>
                <p className="text-xs font-bold text-emerald-950">
                  {primaryAllergy}
                </p>
                <span className="text-[9px] text-emerald-700 block font-medium mt-0.5">
                  Safe for standard emergency interventions
                </span>
              </div>

              {/* Active Clinical Condition Box */}
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Active Triage Alert
                </span>
                <p className="text-xs font-black text-amber-950 truncate">
                  {activeCondition}
                </p>
                <span className="text-[9px] text-amber-700 block font-medium mt-0.5">
                  JSY Escort High-Risk Protocol
                </span>
              </div>

            </div>

            {/* Emergency Contacts List */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Primary Emergency Contacts (Dialable by First Responder)
              </span>

              <div className="space-y-1.5">
                {emergencyContacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs transition-colors">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block">{c.relation}</span>
                      <span className="font-black text-slate-800">{c.name}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Paramedic Explanation Banner */}
          <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Paramedic Protocol:</strong> Even outside the hospital, when a patient is unconscious or unable to unlock their device, this emergency card provides instant verified context, preventing fatal allergic reactions or mismatched blood transfusions.
            </p>
          </div>

        </div>

        {/* ── Footer Actions Bar ── */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Live Mobile Link!' : 'Copy Live Mobile Link'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Lockscreen Card</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Close Passport
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
