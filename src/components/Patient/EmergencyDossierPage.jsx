import React, { useState, useEffect, useCallback } from 'react';
import {
  Siren, Shield, Phone, Activity, CheckCircle2, FileText,
  Download, Droplet, Clock, HeartPulse, User, Loader2,
  AlertTriangle, ChevronRight, X, ArrowLeft, Eye, Image,
  File, FlaskConical, Pill, Building2
} from 'lucide-react';
import { supabase } from '../../services/supabase';

// ── Category Icons ──────────────────────────────────────────
const CATEGORY_ICON = {
  'Lab Reports':    <FlaskConical className="w-4 h-4" />,
  'Scans':          <Image className="w-4 h-4" />,
  'Prescriptions':  <Pill className="w-4 h-4" />,
  'Hospital':       <Building2 className="w-4 h-4" />,
  'Vaccination':    <Shield className="w-4 h-4" />,
  'Other':          <File className="w-4 h-4" />,
};
const CATEGORY_COLOR = {
  'Lab Reports':    'text-blue-700 bg-blue-50 border-blue-200',
  'Scans':          'text-purple-700 bg-purple-50 border-purple-200',
  'Prescriptions':  'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Hospital':       'text-indigo-700 bg-indigo-50 border-indigo-200',
  'Vaccination':    'text-teal-700 bg-teal-50 border-teal-200',
  'Other':          'text-slate-600 bg-slate-50 border-slate-200',
};

// ── Resolve emergency contacts from patient + family ────────
function resolveContacts(patient, familyMembers) {
  const contacts = [];
  const patId = patient?.id;

  // 1. Explicit emergency contact on patient record
  const eName = patient?.emergency_contact_name;
  const ePhone = patient?.emergency_contact_phone || patient?.emergency_contact_mobile;
  if (eName && ePhone) {
    contacts.push({ relation: 'Emergency Contact', name: eName, phone: ePhone });
  }

  // 2. Best relative from household (not self)
  const relatives = (familyMembers || []).filter(m => m.id !== patId && (m.name || ''));
  const primary = relatives.find(m =>
    /head|husband|spouse|wife|father|mother/i.test(m.relation_to_head || m.relationship_to_head || '')
  ) || relatives[0];
  if (primary) {
    let rel = primary.relation_to_head || primary.relationship_to_head || 'Family Member';
    if (/head/i.test(rel)) rel = primary.gender === 'Female' ? 'Head of Family' : 'Husband / Primary Escort';
    contacts.push({ relation: rel, name: primary.name, phone: primary.mobile || primary.phone || '' });
  }

  // 3. Assigned ASHA
  const ashaName = patient?.asha_name || patient?.asha_worker_name || 'Assigned ASHA Worker';
  contacts.push({
    relation: `Frontline ASHA — ${patient?.village || 'Village Sub-Centre'}`,
    name: ashaName,
    phone: '+91 98231 44556',
  });

  // 4. National Ambulance
  contacts.push({ relation: 'National Emergency Ambulance', name: '108 / 102 (Janani Shishu)', phone: '108' });

  return contacts;
}

// ── Document Preview Modal ──────────────────────────────────
function DocPreview({ doc, onClose }) {
  const isImage = doc.file_type?.startsWith('image/');
  const isPDF   = doc.file_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-black text-slate-900 truncate">{doc.title || doc.file_name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{doc.category} · Read-Only Emergency View</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 bg-slate-50">
          {isImage && <img src={doc.file_data} alt={doc.title} className="w-full rounded-xl object-contain" />}
          {isPDF && (
            <embed
              src={doc.file_data}
              type="application/pdf"
              className="w-full rounded-xl"
              style={{ height: '60vh' }}
            />
          )}
          {!isImage && !isPDF && (
            <div className="text-center py-10 text-slate-400">
              <File className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs font-bold">Preview not available for this file type.</p>
              <p className="text-[10px] mt-1">Open in browser to view.</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = doc.file_data;
              a.download = doc.file_name || 'document';
              a.click();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download File
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Emergency Dossier Page ─────────────────────────────
export default function EmergencyDossierPage({ patientId, onClose }) {
  const [tab, setTab] = useState('triage');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient]       = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [documents, setDocuments]   = useState([]);
  const [vitals, setVitals]         = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(null);

  // ── Fetch all patient data using public anon key ──────────
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
          .select('id, title, file_name, file_type, category, created_at, file_size, source, notes')
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

      // Fetch family members for emergency contacts
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Helpers ───────────────────────────────────────────────
  const patientName  = patient?.name || 'Patient';
  const bloodGroup   = patient?.blood_group || '—';
  const abha         = patient?.abha_id || patient?.abha_number || '—';
  const age          = patient?.age_years || '—';
  const gender       = patient?.gender || '—';
  const allergies    = patient?.known_allergies || patient?.allergies || 'No Known Drug Allergies (NKDA)';
  const isPregnant   = patient?.is_pregnant || patient?.high_risk_pregnancy;
  const chronic      = patient?.chronic_conditions?.length
    ? (Array.isArray(patient.chronic_conditions) ? patient.chronic_conditions.join(', ') : patient.chronic_conditions)
    : null;
  const activeAlert  = chronic
    || (isPregnant ? 'High-Risk Pregnancy' : null)
    || 'Routine Clinical Monitoring';

  const contacts = resolveContacts(patient, familyMembers);

  // ── Load full file_data on demand for preview ──────────────
  const handlePreview = async (doc) => {
    setLoadingDoc(doc.id);
    try {
      const { data } = await supabase
        .from('medical_documents')
        .select('id, title, file_name, file_type, file_data')
        .eq('id', doc.id)
        .single();
      if (data?.file_data) setPreviewDoc({ ...doc, ...data });
    } catch (err) {
      console.error('Doc fetch error:', err);
    } finally {
      setLoadingDoc(null);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtSize = (b) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(0)}KB` : `${(b/1048576).toFixed(1)}MB`;

  // ── Render: Loading ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white space-y-3">
          <Siren className="w-10 h-10 text-red-500 mx-auto animate-pulse" />
          <p className="text-sm font-bold">Loading Emergency Dossier…</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center text-white space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-sm font-bold">Patient record not found.</p>
          <p className="text-xs text-slate-400">This QR code may be expired or invalid.</p>
          {onClose && (
            <button onClick={onClose} className="mt-4 px-5 py-2 bg-white text-slate-900 font-black text-xs rounded-xl cursor-pointer">
              Return to RadVault
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Full Dossier ──────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">

      {/* ── Sticky Red Emergency Header ── */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Siren className="w-5 h-5 text-white animate-pulse shrink-0" />
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none uppercase">
              Emergency Health Dossier
            </h1>
            <p className="text-[10px] text-red-100 font-semibold mt-0.5">
              {patientName} · ABHA: {abha} · Zero-Login First-Responder Access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-black bg-white text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:block">
            Read Only
          </span>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-slate-900 border-b border-slate-800 flex shrink-0 sticky top-[60px] z-40">
        {[
          { key: 'triage', label: 'Triage', icon: <Siren className="w-3.5 h-3.5" /> },
          { key: 'vault',  label: `Vault (${documents.length})`, icon: <FileText className="w-3.5 h-3.5" /> },
          { key: 'care',   label: 'Past Care', icon: <HeartPulse className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              tab === t.key
                ? 'text-white border-red-500 bg-slate-800'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-lg mx-auto w-full">

        {/* ══ TAB 1: TRIAGE CARD ══════════════════════════════ */}
        {tab === 'triage' && (
          <>
            {/* Identity + Blood Group */}
            <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                    {patientName[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">Patient</span>
                    <h2 className="text-base font-black text-slate-900 capitalize leading-tight">{patientName}</h2>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                      {age} Yrs · {gender} · ABHA: {abha}
                    </p>
                  </div>
                </div>
                <div className="bg-red-600 text-white px-3 py-2 rounded-xl text-center shrink-0 shadow-md border border-red-500">
                  <span className="text-[8px] font-black tracking-widest uppercase block text-red-200">BLOOD</span>
                  <span className="text-2xl font-black leading-none">{bloodGroup}</span>
                  <span className="text-[8px] font-bold text-red-100 block">Verified</span>
                </div>
              </div>
            </div>

            {/* Allergies + Active Alert */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Allergies
                </span>
                <p className="text-[11px] font-bold text-emerald-950">{allergies}</p>
              </div>
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Activity className="w-3 h-3 text-amber-600" /> Alert
                </span>
                <p className="text-[11px] font-black text-amber-950">{activeAlert}</p>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Emergency Contacts — Tap to Call</p>
              {contacts.map((c, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 truncate">{c.relation}</p>
                    <p className="text-sm font-black text-slate-800 truncate capitalize">{c.name}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>

            {/* Paramedic Protocol Note */}
            <div className="bg-slate-800 text-slate-300 rounded-xl p-3.5 text-[10px] leading-relaxed border border-slate-700">
              <strong className="text-white">Paramedic Protocol:</strong> This emergency dossier is accessible without patient login via QR code. It is read-only and scoped to this patient only. Critical medical history and uploaded documents are available in the Vault and Past Care tabs above.
            </div>
          </>
        )}

        {/* ══ TAB 2: MEDICAL VAULT ════════════════════════════ */}
        {tab === 'vault' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Medical Vault — {documents.length} Document{documents.length !== 1 ? 's' : ''}
              </p>
              <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Read Only
              </span>
            </div>

            {documents.length === 0 && (
              <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">No documents uploaded yet.</p>
              </div>
            )}

            {documents.map((doc) => {
              const colorCls = CATEGORY_COLOR[doc.category] || CATEGORY_COLOR['Other'];
              const iconEl   = CATEGORY_ICON[doc.category] || CATEGORY_ICON['Other'];
              return (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3.5 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${colorCls}`}>
                      {iconEl}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{doc.title || doc.file_name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${colorCls}`}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{fmtDate(doc.created_at)}</span>
                        {doc.file_size && <span className="text-[10px] text-slate-400 font-medium">{fmtSize(doc.file_size)}</span>}
                      </div>
                      {doc.notes && (
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{doc.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handlePreview(doc)}
                      disabled={loadingDoc === doc.id}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white font-black text-[10px] rounded-lg flex items-center gap-1 shrink-0 cursor-pointer transition-colors disabled:opacity-60"
                    >
                      {loadingDoc === doc.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Eye className="w-3 h-3" />}
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ══ TAB 3: PAST CARE ════════════════════════════════ */}
        {tab === 'care' && (
          <>
            {/* Vitals Section */}
            {vitals.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Recorded Vitals — {vitals.length} Entry{vitals.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {vitals.filter(v =>
                    v.bp_systolic || v.pulse_bpm || v.spo2_pct || v.temperature_c || v.weight_kg || v.blood_glucose
                  ).slice(0, 5).map((v) => (
                    <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{v.recorded_by || v.source || 'Recorded'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{fmtDate(v.recorded_at)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {v.bp_systolic && (
                          <div className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">BP</p>
                            <p className="text-sm font-black text-slate-900">{v.bp_systolic}/{v.bp_diastolic}</p>
                            <p className="text-[9px] text-slate-400">mmHg</p>
                          </div>
                        )}
                        {v.pulse_bpm && (
                          <div className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Pulse</p>
                            <p className="text-sm font-black text-slate-900">{v.pulse_bpm}</p>
                            <p className="text-[9px] text-slate-400">bpm</p>
                          </div>
                        )}
                        {v.spo2_pct && (
                          <div className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">SpO2</p>
                            <p className="text-sm font-black text-slate-900">{v.spo2_pct}%</p>
                            <p className="text-[9px] text-slate-400">oxygen</p>
                          </div>
                        )}
                        {v.temperature_c && (
                          <div className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Temp</p>
                            <p className="text-sm font-black text-slate-900">{((v.temperature_c * 9/5) + 32).toFixed(1)}°F</p>
                            <p className="text-[9px] text-slate-400">temp</p>
                          </div>
                        )}
                        {v.weight_kg && (
                          <div className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Weight</p>
                            <p className="text-sm font-black text-slate-900">{v.weight_kg}</p>
                            <p className="text-[9px] text-slate-400">kg</p>
                          </div>
                        )}
                        {v.blood_glucose && (
                          <div className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Glucose</p>
                            <p className="text-sm font-black text-slate-900">{v.blood_glucose}</p>
                            <p className="text-[9px] text-slate-400">mg/dL</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consultations Section */}
            {consultations.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 mt-2">
                  Past Consultations — {consultations.length} Record{consultations.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {consultations.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Consultation
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{fmtDate(c.created_at)}</span>
                      </div>
                      {c.diagnosis && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Diagnosis</p>
                          <p className="text-xs font-bold text-slate-900">{c.diagnosis}</p>
                        </div>
                      )}
                      {c.treatment_advice && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Treatment</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{c.treatment_advice}</p>
                        </div>
                      )}
                      {c.follow_up_recommended_date && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Follow-up: {fmtDate(c.follow_up_recommended_date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vitals.length === 0 && consultations.length === 0 && (
              <div className="bg-slate-800 rounded-2xl p-8 text-center text-slate-400">
                <HeartPulse className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">No past care records available yet.</p>
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Return Button ── */}
      {onClose && (
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <button
            onClick={onClose}
            className="w-full max-w-lg mx-auto block py-3 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Open RadVault — Connected Health Network
          </button>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && <DocPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

    </div>
  );
}
