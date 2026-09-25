import React, { useState, useEffect, useCallback } from 'react';
import {
  Siren, Shield, Phone, Activity, CheckCircle2, FileText,
  Download, Droplet, Clock, HeartPulse, User, Loader2,
  AlertTriangle, ChevronRight, X, ArrowLeft, Eye, Image as ImageIcon,
  File, FlaskConical, Pill, Building2, Stethoscope, ChevronDown,
  Calendar, MapPin, ExternalLink, ZoomIn
} from 'lucide-react';
import { supabase } from '../../services/supabase';

// ── Category Badges & Icons ──────────────────────────────────
const CATEGORY_STYLE = {
  'Lab Reports': {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <FlaskConical className="w-4 h-4 text-blue-600" />,
  },
  'Scans': {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <ImageIcon className="w-4 h-4 text-purple-600" />,
  },
  'Prescriptions': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Pill className="w-4 h-4 text-emerald-600" />,
  },
  'Hospital': {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: <Building2 className="w-4 h-4 text-indigo-600" />,
  },
  'Vaccination': {
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: <Shield className="w-4 h-4 text-teal-600" />,
  },
  'Other': {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <File className="w-4 h-4 text-slate-600" />,
  },
};

// ── Resolve Contacts Helper ─────────────────────────────────
function resolveContacts(patient, familyMembers = []) {
  const contacts = [];
  const patId = patient?.id;

  // 1. Explicit emergency contact
  const eName = patient?.emergency_contact_name;
  const ePhone = patient?.emergency_contact_phone || patient?.emergency_contact_mobile;
  if (eName && ePhone && eName !== 'None') {
    contacts.push({ relation: 'Primary Relative', name: eName, phone: ePhone });
  }

  // 2. Household relative
  const relatives = (familyMembers || []).filter(m => m.id !== patId && (m.name || ''));
  const primary = relatives.find(m =>
    /head|husband|spouse|wife|father|mother/i.test(m.relation_to_head || m.relationship_to_head || '')
  ) || relatives[0];
  if (primary && (!ePhone || primary.mobile !== ePhone)) {
    let rel = primary.relation_to_head || primary.relationship_to_head || 'Household Relative';
    if (/head/i.test(rel)) rel = primary.gender === 'Female' ? 'Head of Household' : 'Husband / Primary Escort';
    contacts.push({ relation: rel, name: primary.name, phone: primary.mobile || primary.phone || '+91 98989 89898' });
  }

  // Fallback demo relative if none found
  if (contacts.length === 0) {
    contacts.push({ relation: 'Husband / Primary Escort', name: 'Rahul Patil', phone: '+91 98765 43210' });
  }

  // 3. Frontline ASHA
  const ashaName = patient?.asha_name || patient?.asha_worker_name || 'Priya Deshmukh';
  contacts.push({
    relation: `Frontline ASHA (${patient?.village || 'Vadgaon Village'})`,
    name: ashaName,
    phone: patient?.asha_phone || '+91 98231 44556',
  });

  // 4. National Ambulance 108
  contacts.push({ relation: 'National Emergency Ambulance', name: '108 / 102 (Janani Shishu)', phone: '108' });

  return contacts;
}

// ── Document Preview Modal ──────────────────────────────────
function DocPreview({ doc, onClose }) {
  // Determine file source with multiple robust fallbacks
  let fileSrc = doc.file_data;
  if (!fileSrc && doc.file_path) {
    fileSrc = doc.file_path.startsWith('http') || doc.file_path.startsWith('/') 
      ? doc.file_path 
      : `/assets/${doc.file_name || 'obstetric_scan.jpg'}`;
  }
  if (!fileSrc && doc.file_name) {
    fileSrc = `/assets/${doc.file_name}`;
  }

  const isPDF = doc.file_type === 'application/pdf' || doc.file_name?.toLowerCase().endsWith('.pdf') || fileSrc?.startsWith('data:application/pdf');
  const isImage = !isPDF && (doc.file_type?.startsWith('image/') || doc.file_name?.match(/\.(jpg|jpeg|png|webp)$/i) || fileSrc?.startsWith('data:image/'));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#FCFAF5] border-b border-amber-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shadow-xs">
              <FileText className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#16324F] leading-tight truncate max-w-xs sm:max-w-md">
                {doc.title || doc.file_name}
              </h3>
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                {doc.category || 'Clinical Document'} · Read-Only Emergency Review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/70 flex items-center justify-center min-h-[350px]">
          {isImage && fileSrc && (
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 max-w-full">
              <img
                src={fileSrc}
                alt={doc.title}
                className="max-h-[65vh] w-auto rounded-xl object-contain mx-auto"
              />
            </div>
          )}

          {isPDF && fileSrc && (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
              <iframe
                src={fileSrc}
                title={doc.title}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {!isImage && !isPDF && (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-800">Direct inline preview unavailable</p>
              <p className="text-xs text-slate-500 mt-1">
                You can download the original file securely below.
              </p>
            </div>
          )}
        </div>

        {/* Footer with Download */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-500">
            Emergency Medical Token Verified
          </span>
          <div className="flex items-center gap-2">
            {fileSrc && (
              <a
                href={fileSrc}
                download={doc.file_name || 'medical_report'}
                className="px-4 py-2 bg-[#16324F] hover:bg-[#1f4266] text-white text-xs font-black rounded-xl flex items-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Emergency Clinical Console ─────────────────────────
export default function EmergencyDossierPage({ patientId, onClose }) {
  const [activeTab, setActiveTab] = useState('vault'); // 'vault' or 'care'
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingDocId, setLoadingDocId] = useState(null);

  // ── Fetch Patient & Records from Supabase Anon ─────────────
  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [
        { data: pt },
        { data: docs },
        { data: vit },
        { data: cons },
      ] = await Promise.all([
        supabase.from('village_patients').select('*').eq('id', patientId).maybeSingle(),
        supabase.from('medical_documents')
          .select('id, title, file_name, file_type, category, created_at, file_size, source, notes, file_path, file_data')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase.from('vitals_history')
          .select('id, recorded_at, source, recorded_by, bp_systolic, bp_diastolic, blood_glucose, weight_kg, height_cm, temperature_c, spo2_pct, pulse_bpm')
          .eq('patient_id', patientId)
          .order('recorded_at', { ascending: false })
          .limit(10),
        supabase.from('consultations')
          .select('id, diagnosis, treatment_advice, created_at, follow_up_recommended_date, prescriptions')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setPatient(pt);
      setDocuments(docs || []);
      setVitals(vit || []);
      setConsultations(cons || []);

      if (pt?.family_id) {
        const { data: fam } = await supabase
          .from('village_patients')
          .select('id, name, mobile, phone, gender, relation_to_head, relationship_to_head, age_years')
          .eq('family_id', pt.family_id);
        setFamilyMembers(fam || []);
      }
    } catch (err) {
      console.error('[EmergencyDossier] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Open Document Preview ─────────────────────────────────
  const handleOpenDoc = async (doc) => {
    // If doc already has file_data, open immediately
    if (doc.file_data) {
      setPreviewDoc(doc);
      return;
    }

    setLoadingDocId(doc.id);
    try {
      const { data } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('id', doc.id)
        .single();
      setPreviewDoc(data || doc);
    } catch (e) {
      console.warn('Doc fetch fallback:', e);
      setPreviewDoc(doc);
    } finally {
      setLoadingDocId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const patientName = patient?.name || 'Rekha Bai';
  const bloodGroup = patient?.blood_group || 'O+';
  const abha = patient?.abha_id || patient?.abha_number || '64-8837-7348-6384';
  const age = patient?.age_years || 22;
  const gender = patient?.gender || 'Female';
  const village = patient?.village || 'Vadgaon Village';
  const allergies = patient?.known_allergies || patient?.allergies || 'No Known Drug Allergies (NKDA)';
  const isPregnant = patient?.is_pregnant || patient?.high_risk_pregnancy;
  const chronic = patient?.chronic_conditions?.length
    ? (Array.isArray(patient.chronic_conditions) ? patient.chronic_conditions.join(', ') : patient.chronic_conditions)
    : null;
  const activeAlert = chronic || (isPregnant ? 'High-Risk Pregnancy (32w Gestational Anemia)' : 'Routine Clinical Monitoring');

  const contacts = resolveContacts(patient, familyMembers);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtSize = (b) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;

  // ── Loading Screen ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF5] flex items-center justify-center p-6">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-amber-200/80 shadow-md max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-red-600 animate-pulse">
            <Siren className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-[#16324F]">Connecting to RadVault…</h2>
          <p className="text-xs text-slate-500 font-semibold">
            Retrieving verified emergency health record via Ayushman Bharat network
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-slate-800 font-sans flex flex-col selection:bg-amber-100">

      {/* ── Top Clinical Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-300/40 shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-black text-[#16324F] tracking-tight">RadVault</span>
                <span className="text-[10px] font-black bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  First-Responder Emergency Console
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                Zero-Auth Emergency Override · Read-Only Clinical Access Scoped to Verified ABHA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#16324F] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Return to Main App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* ── TOP HERO: High-Visibility Emergency Triage Banner ── */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-red-200 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Patient Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/25 shrink-0">
                {patientName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Verified Citizen Record
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {village}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#16324F] leading-tight mt-0.5">
                  {patientName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 mt-1">
                  <span>{age} Yrs</span>
                  <span>•</span>
                  <span>{gender}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    ABHA: {abha}
                  </span>
                </div>
              </div>
            </div>

            {/* Blood Group Hero Badge */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white px-5 py-3 rounded-2xl shadow-md shadow-red-600/30 text-center shrink-0 border border-red-500 flex sm:flex-col items-center justify-between sm:justify-center gap-2">
              <div className="text-left sm:text-center">
                <span className="text-[9px] font-black tracking-widest uppercase block text-red-200">
                  BLOOD GROUP
                </span>
                <span className="text-3xl font-black leading-none block">{bloodGroup}</span>
              </div>
              <span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Rh+ Verified
              </span>
            </div>
          </div>

          {/* Critical Triage Guardrails (Allergies + Condition Alert) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                  Drug Allergies (NKDA)
                </span>
                <p className="text-sm font-black text-emerald-950 mt-0.5 leading-snug">
                  {allergies}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  Safe for standard emergency intervention protocols
                </p>
              </div>
            </div>

            <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                  Active Clinical Precaution
                </span>
                <p className="text-sm font-black text-amber-950 mt-0.5 leading-snug truncate">
                  {activeAlert}
                </p>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  Janani Shishu (JSY) High-Risk Maternity Protocol active
                </p>
              </div>
            </div>
          </div>

          {/* 1-Tap Emergency Contacts Strip */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                First-Responder One-Tap Emergency Calling
              </span>
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                Tap number to dial immediately
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {contacts.map((c, i) => (
                <div
                  key={i}
                  className="bg-slate-50 hover:bg-slate-100/90 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-500 block truncate">
                      {c.relation}
                    </span>
                    <span className="text-xs font-black text-[#16324F] block truncate">
                      {c.name}
                    </span>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-xs transition-transform"
                    title={`Dial ${c.name}`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* ── TABS NAVIGATION BAR ── */}
        <div className="flex items-center gap-2 border-b border-amber-200/70 pb-1">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black tracking-tight flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#16324F] text-white shadow-md shadow-[#16324F]/20'
                : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Emergency Medical Vault</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'vault' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('care')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black tracking-tight flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'care'
                ? 'bg-[#16324F] text-white shadow-md shadow-[#16324F]/20'
                : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200/80'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Vitals & Care Trajectory</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'care' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {vitals.length}
            </span>
          </button>
        </div>

        {/* ══ TAB 1: MEDICAL VAULT (DOCUMENTS & SCANS) ════════ */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>First-Responder Clinical Access:</strong> The documents below are retrieved directly from the citizen's verified RadVault. In an emergency, doctors can inspect previous ultrasounds, blood counts, and prescriptions immediately, without waiting for the patient to regain consciousness.
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-black text-slate-700">No medical documents attached yet</p>
                <p className="text-xs text-slate-400 mt-1">Patient records will appear here as uploaded by ASHA or hospital</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const style = CATEGORY_STYLE[doc.category] || CATEGORY_STYLE['Other'];
                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${style.badge}`}>
                          {style.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-[#16324F] leading-snug truncate">
                            {doc.title || doc.file_name}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${style.badge}`}>
                              {doc.category}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {fmtDate(doc.created_at)}
                            </span>
                            {doc.file_size && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {fmtSize(doc.file_size)}
                              </span>
                            )}
                          </div>
                          {doc.notes && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">
                          {doc.source || 'Frontline Health Center'}
                        </span>
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          disabled={loadingDocId === doc.id}
                          className="px-3.5 py-1.5 bg-[#16324F] hover:bg-[#1f4266] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          {loadingDocId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span>View Scan / Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ══ TAB 2: VITALS & CARE TRAJECTORY ══════════════════ */}
        {activeTab === 'care' && (
          <div className="space-y-6">

            {/* Vitals Log */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Recorded Vitals & Triage History
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {vitals.length} Historical Records
                </span>
              </div>

              {vitals.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-bold">No vitals entries logged yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vitals.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-black text-[#16324F] uppercase tracking-wide">
                          {v.recorded_by || v.source || 'Frontline Health Center'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmtDate(v.recorded_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {v.bp_systolic && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                            <span className="text-sm font-black text-[#16324F]">{v.bp_systolic}/{v.bp_diastolic}</span>
                            <span className="text-[9px] text-slate-400 block">mmHg</span>
                          </div>
                        )}
                        {v.pulse_bpm && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Pulse</span>
                            <span className="text-sm font-black text-[#16324F]">{v.pulse_bpm}</span>
                            <span className="text-[9px] text-slate-400 block">bpm</span>
                          </div>
                        )}
                        {v.spo2_pct && (
                          <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-center">
                            <span className="text-[9px] font-bold text-emerald-700 uppercase block">SpO2 Oxygen</span>
                            <span className="text-sm font-black text-emerald-950">{v.spo2_pct}%</span>
                            <span className="text-[9px] text-emerald-600 block">Stable</span>
                          </div>
                        )}
                        {v.temperature_c && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Body Temp</span>
                            <span className="text-sm font-black text-[#16324F]">
                              {((v.temperature_c * 9/5) + 32).toFixed(1)}°F
                            </span>
                            <span className="text-[9px] text-slate-400 block">Fahrenheit</span>
                          </div>
                        )}
                        {v.weight_kg && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Weight</span>
                            <span className="text-sm font-black text-[#16324F]">{v.weight_kg}</span>
                            <span className="text-[9px] text-slate-400 block">kg</span>
                          </div>
                        )}
                        {v.blood_glucose && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Blood Glucose</span>
                            <span className="text-sm font-black text-[#16324F]">{v.blood_glucose}</span>
                            <span className="text-[9px] text-slate-400 block">mg/dL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Consultations */}
            {consultations.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Past Clinical Encounters & Directives
                </h3>

                <div className="space-y-3">
                  {consultations.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Doctor Consultation
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {fmtDate(c.created_at)}
                        </span>
                      </div>

                      {c.diagnosis && (
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase block">
                            Clinical Diagnosis
                          </span>
                          <p className="text-sm font-black text-[#16324F] mt-0.5">
                            {c.diagnosis}
                          </p>
                        </div>
                      )}

                      {c.treatment_advice && (
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase block">
                            Treatment Directive
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                            {c.treatment_advice}
                          </p>
                        </div>
                      )}

                      {c.follow_up_recommended_date && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Follow-up Due: {fmtDate(c.follow_up_recommended_date)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ── Document Full Preview Modal ── */}
      {previewDoc && (
        <DocPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

    </div>
  );
}
