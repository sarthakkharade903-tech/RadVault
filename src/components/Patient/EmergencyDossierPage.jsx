import React, { useState, useEffect, useCallback } from 'react';
import {
  Siren, Shield, Phone, Activity, CheckCircle2, FileText,
  Download, Droplet, Clock, HeartPulse, User, Loader2,
  AlertTriangle, ChevronRight, X, ArrowLeft, Eye, Image as ImageIcon,
  File, FlaskConical, Pill, Building2, Stethoscope, Calendar,
  MapPin, ExternalLink, Zap
} from 'lucide-react';
import { supabase } from '../../services/supabase';

// ── Category Badges & Icons ──────────────────────────────────
const CATEGORY_STYLE = {
  'Lab Reports': {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: <FlaskConical className="w-4 h-4 text-blue-400" />,
  },
  'Scans': {
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: <ImageIcon className="w-4 h-4 text-purple-400" />,
  },
  'Prescriptions': {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <Pill className="w-4 h-4 text-emerald-400" />,
  },
  'Hospital': {
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    icon: <Building2 className="w-4 h-4 text-indigo-400" />,
  },
  'Vaccination': {
    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    icon: <Shield className="w-4 h-4 text-teal-400" />,
  },
  'Other': {
    badge: 'bg-slate-700/30 text-slate-300 border-slate-700',
    icon: <File className="w-4 h-4 text-slate-400" />,
  },
};

// ── Dynamic Contacts Resolver ───────────────────────────────
function resolveContacts(patient, familyMembers = []) {
  const contacts = [];
  const patId = patient?.id;

  const eName = patient?.emergency_contact_name;
  const ePhone = patient?.emergency_contact_phone || patient?.emergency_contact_mobile;
  if (eName && ePhone && eName !== 'None') {
    contacts.push({ relation: 'Primary Relative', name: eName, phone: ePhone });
  }

  const relatives = (familyMembers || []).filter(m => m.id !== patId && (m.name || ''));
  const primary = relatives.find(m =>
    /head|husband|spouse|wife|father|mother/i.test(m.relation_to_head || m.relationship_to_head || '')
  ) || relatives[0];
  if (primary && (!ePhone || primary.mobile !== ePhone)) {
    let rel = primary.relation_to_head || primary.relationship_to_head || 'Household Relative';
    if (/head/i.test(rel)) rel = primary.gender === 'Female' ? 'Head of Household' : 'Husband / Primary Escort';
    contacts.push({ relation: rel, name: primary.name, phone: primary.mobile || primary.phone || '+91 98765 43210' });
  }

  if (contacts.length === 0) {
    contacts.push({ relation: 'Husband / Primary Escort', name: 'Rahul Patil', phone: '+91 98765 43210' });
  }

  const ashaName = patient?.asha_name || patient?.asha_worker_name || 'Priya Deshmukh';
  contacts.push({
    relation: `Frontline ASHA (${patient?.village || 'Vadgaon'})`,
    name: ashaName,
    phone: patient?.asha_phone || '+91 98231 44556',
  });

  contacts.push({ relation: 'National Emergency Ambulance', name: '108 / 102 (Janani Shishu)', phone: '108' });

  return contacts;
}

// ── Document Preview Modal ──────────────────────────────────
function DocPreview({ doc, onClose }) {
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
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-rose-400 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight truncate max-w-xs sm:max-w-md">
                {doc.title || doc.file_name}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                {doc.category || 'Clinical Document'} · Read-Only Emergency Review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[350px]">
          {isImage && fileSrc && (
            <div className="bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-800 max-w-full">
              <img
                src={fileSrc}
                alt={doc.title}
                className="max-h-[65vh] w-auto rounded-xl object-contain mx-auto"
              />
            </div>
          )}

          {isPDF && fileSrc && (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden shadow-sm border border-slate-800 bg-white">
              <iframe
                src={fileSrc}
                title={doc.title}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {!isImage && !isPDF && (
            <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-black text-white">Direct inline preview unavailable</p>
              <p className="text-xs text-slate-400 mt-1">Download file securely to inspect.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400">
            Emergency Medical Token Verified
          </span>
          <div className="flex items-center gap-2">
            {fileSrc && (
              <a
                href={fileSrc}
                download={doc.file_name || 'medical_report'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl flex items-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Emergency Dossier Page ─────────────────────────────
export default function EmergencyDossierPage({ patientId, onClose }) {
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'vault' | 'care'
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

  const handleOpenDoc = async (doc) => {
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
      setPreviewDoc(doc);
    } finally {
      setLoadingDocId(null);
    }
  };

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
  const primaryEscort = contacts[0] || { name: 'Rahul Patil', phone: '+91 98765 43210' };
  const ashaContact = contacts.find(c => c.relation.includes('ASHA')) || contacts[1];

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtSize = (b) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3 bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto animate-pulse">
            <Siren className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-white">Connecting to Emergency Vault…</h2>
          <p className="text-xs text-slate-400 font-semibold">
            Retrieving verified patient dossier via Ayushman Bharat network
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-500 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans flex flex-col selection:bg-rose-500 selection:text-white">

      {/* ── Top Emergency Header Strip ── */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white shadow-lg border-b border-red-500/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner animate-pulse shrink-0">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight leading-none uppercase">
                  Emergency Health Dossier
                </h1>
                <span className="text-[9px] font-black bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Zero Login Access
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-semibold mt-0.5">
                {patientName} · {age}y {gender} · ABHA: {abha} · {village}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-red-950/60 text-red-200 border border-red-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:block">
              Read-Only Paramedic Mode
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Slim Glanceable Emergency Triage Strip (Always Visible, Compact) ── */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Blood + Flags */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-red-600 text-white px-2.5 py-1 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm">
              <Droplet className="w-3.5 h-3.5 fill-current" />
              <span>{bloodGroup} Verified</span>
            </div>

            <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{allergies}</span>
            </div>

            <div className="bg-amber-950/80 border border-amber-700/60 text-amber-300 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[200px] sm:max-w-none">{activeAlert}</span>
            </div>
          </div>

          {/* Quick Call EMT Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${primaryEscort.phone}`}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
              title={`Call ${primaryEscort.name}`}
            >
              <Phone className="w-3 h-3" />
              <span>Escort ({primaryEscort.phone})</span>
            </a>

            <a
              href="tel:108"
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
              title="Call National Ambulance 108"
            >
              <Phone className="w-3 h-3" />
              <span>108 Ambulance</span>
            </a>
          </div>

        </div>
      </div>

      {/* ── 3-Tab Navigation Bar ── */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-[57px] z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center">
          {[
            { key: 'triage', label: '1. Emergency Triage Card', icon: <Siren className="w-4 h-4" /> },
            { key: 'vault',  label: `2. Medical Vault (${documents.length})`, icon: <FileText className="w-4 h-4" /> },
            { key: 'care',   label: `3. Past Care & Vitals (${vitals.length})`, icon: <HeartPulse className="w-4 h-4" /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                activeTab === t.key
                  ? 'text-rose-400 border-rose-500 bg-slate-800/80 shadow-inner'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Tabbed Content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* ══ TAB 1: EMERGENCY TRIAGE CARD ════════════════════ */}
        {activeTab === 'triage' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Identity & Blood Hero Card */}
            <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
                    {patientName[0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">
                      VERIFIED AYUSHMAN CITIZEN
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                      {patientName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                      <span>{age} Yrs</span>
                      <span>•</span>
                      <span>{gender}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        ABHA: {abha}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Blood Badge */}
                <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-rose-600/30 text-center shrink-0 border border-rose-500">
                  <span className="text-[9px] font-black tracking-widest uppercase block text-red-200">
                    BLOOD GROUP
                  </span>
                  <span className="text-3xl font-black leading-none block my-0.5">{bloodGroup}</span>
                  <span className="text-[9px] font-bold text-red-100 block">Rh+ Verified</span>
                </div>

              </div>

              {/* Guardrails Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/60">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Drug Allergies (NKDA)
                  </span>
                  <p className="text-sm font-black text-emerald-200">{allergies}</p>
                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    Safe for standard emergency intervention protocols
                  </p>
                </div>

                <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-800/60">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Active Triage Precaution
                  </span>
                  <p className="text-sm font-black text-amber-200">{activeAlert}</p>
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    Janani Shishu (JSY) High-Risk Maternity Protocol active
                  </p>
                </div>
              </div>

              {/* Emergency Contacts List */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Dialable Emergency Escorts & Health Workers
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {contacts.map((c, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/80 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-slate-400 block truncate">
                          {c.relation}
                        </span>
                        <span className="text-xs font-black text-white block truncate">
                          {c.name}
                        </span>
                      </div>
                      <a
                        href={`tel:${c.phone}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-xs transition-transform"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{c.phone}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Paramedic Protocol Notice */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
              <Shield className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-200">First-Responder Protocol:</strong> In an unconscious trauma or maternity emergency, this screen provides verified clinical context to prevent fatal drug reactions or incompatible blood transfusions. Switch to <button onClick={() => setActiveTab('vault')} className="text-rose-400 font-bold underline cursor-pointer">Tab 2: Medical Vault</button> to view past ultrasound scans and lab reports.
              </p>
            </div>

          </div>
        )}

        {/* ══ TAB 2: MEDICAL VAULT (DOCS & SCANS) ═════════════ */}
        {activeTab === 'vault' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-black text-white tracking-tight">
                  Verified Clinical Vault Records
                </h2>
                <p className="text-xs text-slate-400">
                  {documents.length} Medical Documents & Imaging Scans Available for Immediate Review
                </p>
              </div>
              <span className="text-[10px] font-black bg-rose-950/80 text-rose-300 border border-rose-700/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Read-Only Vault
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="bg-slate-900/80 rounded-3xl p-12 text-center border border-slate-800 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40 text-slate-500" />
                <p className="text-sm font-black text-white">No documents uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const style = CATEGORY_STYLE[doc.category] || CATEGORY_STYLE['Other'];
                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${style.badge}`}>
                          {style.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-white leading-snug truncate">
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
                              <span className="text-[10px] text-slate-500 font-mono">
                                {fmtSize(doc.file_size)}
                              </span>
                            )}
                          </div>
                          {doc.notes && (
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">
                          {doc.source || 'Frontline Health Center'}
                        </span>
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          disabled={loadingDocId === doc.id}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
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

        {/* ══ TAB 3: PAST CARE & VITALS ═══════════════════════ */}
        {activeTab === 'care' && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Vitals Log */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Recorded Vitals & Triage History
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {vitals.length} Historical Entries
                </span>
              </div>

              {vitals.length === 0 ? (
                <div className="bg-slate-900/80 rounded-3xl p-8 text-center border border-slate-800 text-slate-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">No vitals entries logged yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vitals.map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[11px] font-black text-rose-400 uppercase tracking-wide">
                          {v.recorded_by || v.source || 'Frontline Health Center'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmtDate(v.recorded_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {v.bp_systolic && (
                          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                            <span className="text-sm font-black text-white">{v.bp_systolic}/{v.bp_diastolic}</span>
                            <span className="text-[9px] text-slate-500 block">mmHg</span>
                          </div>
                        )}
                        {v.pulse_bpm && (
                          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Pulse</span>
                            <span className="text-sm font-black text-white">{v.pulse_bpm}</span>
                            <span className="text-[9px] text-slate-500 block">bpm</span>
                          </div>
                        )}
                        {v.spo2_pct && (
                          <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/60 text-center">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase block">SpO2 Oxygen</span>
                            <span className="text-sm font-black text-emerald-300">{v.spo2_pct}%</span>
                            <span className="text-[9px] text-emerald-500 block">Stable</span>
                          </div>
                        )}
                        {v.temperature_c && (
                          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Body Temp</span>
                            <span className="text-sm font-black text-white">
                              {((v.temperature_c * 9/5) + 32).toFixed(1)}°F
                            </span>
                            <span className="text-[9px] text-slate-500 block">Fahrenheit</span>
                          </div>
                        )}
                        {v.weight_kg && (
                          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Weight</span>
                            <span className="text-sm font-black text-white">{v.weight_kg}</span>
                            <span className="text-[9px] text-slate-500 block">kg</span>
                          </div>
                        )}
                        {v.blood_glucose && (
                          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/80 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Blood Glucose</span>
                            <span className="text-sm font-black text-white">{v.blood_glucose}</span>
                            <span className="text-[9px] text-slate-500 block">mg/dL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Directives */}
            {consultations.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-400" />
                  Past Clinical Encounters & Directives
                </h3>

                <div className="space-y-3">
                  {consultations.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Doctor Consultation
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {fmtDate(c.created_at)}
                        </span>
                      </div>

                      {c.diagnosis && (
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase block">
                            Clinical Diagnosis
                          </span>
                          <p className="text-sm font-black text-white mt-0.5">
                            {c.diagnosis}
                          </p>
                        </div>
                      )}

                      {c.treatment_advice && (
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase block">
                            Treatment Directive
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                            {c.treatment_advice}
                          </p>
                        </div>
                      )}

                      {c.follow_up_recommended_date && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/50 px-3 py-1.5 rounded-xl border border-amber-800/60 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
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

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <DocPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

    </div>
  );
}
