import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  FileCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Building2,
  FileText,
  Activity,
  Pill,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { initiateConsentRequest } from '../../services/abdmService';
import { mapMedicalRecordToFhirBundle } from '../../services/fhirMapper';
import FhirBundleModal from './FhirBundleModal';

// High-Fidelity Mock External Health Records pulled from other hospitals across India via ABDM network
const SAMPLE_EXTERNAL_RECORDS = [
  {
    id: 'EXT-REC-001',
    hospitalName: 'KEM Hospital, Pune',
    hospitalHfr: 'IN2710004512',
    date: '12 Jan 2026',
    hiType: 'DiagnosticReport',
    title: 'Digital Chest Radiograph (X-Ray PA View)',
    modality: 'XR',
    doctor: 'Dr. Ramesh Deshmukh (MD Radiodiagnosis)',
    summary: 'Chest PA View: Bilateral lung fields clear. Costophrenic angles sharp. Normal cardiothoracic ratio.',
    dataEraseAt: '19 Oct 2026',
    fhirResource: {
      resourceType: 'DiagnosticReport',
      id: 'diag-kem-001',
      status: 'final',
      category: [{ text: 'Radiology Imaging' }],
      conclusion: 'Normal chest radiograph with clear lung parenchyma. No active infiltrates.',
      presentedForm: [{ title: 'KEM_Chest_XRay_Report.pdf', contentType: 'application/pdf' }]
    }
  },
  {
    id: 'EXT-REC-002',
    hospitalName: 'District Civil Hospital, Satara',
    hospitalHfr: 'IN2710008891',
    date: '05 Nov 2025',
    hiType: 'Prescription',
    title: 'Endocrine & Hypertension Medication Order',
    doctor: 'Dr. Anjali Patil (Consultant Physician)',
    summary: 'Rx: Tab. Metformin 500mg BD, Tab. Telmisartan 40mg OD. Fasting Glucose recorded: 138 mg/dL.',
    dataEraseAt: '19 Oct 2026',
    fhirResource: {
      resourceType: 'MedicationRequest',
      id: 'rx-satara-002',
      status: 'completed',
      medicationCodeableConcept: { text: 'Metformin 500mg + Telmisartan 40mg' },
      dosageInstruction: [{ text: 'Twice daily post meals for 30 days' }]
    }
  }
];

export default function ConsentRequestPanel({ patient, onBreakGlass }) {
  const [consentStatus, setConsentStatus] = useState('IDLE'); // 'IDLE' | 'PENDING' | 'GRANTED'
  const [loading, setLoading] = useState(false);
  const [selectedHiTypes, setSelectedHiTypes] = useState(['DiagnosticReport', 'Prescription', 'OPConsultation']);
  const [activeFhirModalBundle, setActiveFhirModalBundle] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const patientAbha = patient?.abha_id || patient?.vitals?.abha_number || '91-2334-1727-2405';
  const abhaAddress = patient?.abha_address || `${(patient?.patient_name || patient?.name || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '')}@abdm`;

  const handleRequestConsent = async () => {
    setLoading(true);
    try {
      await initiateConsentRequest({
        patientAbhaAddress: abhaAddress,
        hiTypes: selectedHiTypes
      });
      setConsentStatus('PENDING');
    } catch (err) {
      console.error('Consent request error:', err);
      setConsentStatus('PENDING'); // graceful fallback for simulation
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateApproval = () => {
    setLoading(true);
    setTimeout(() => {
      setConsentStatus('GRANTED');
      setLoading(false);
    }, 600);
  };

  const toggleHiType = (type) => {
    if (selectedHiTypes.includes(type)) {
      setSelectedHiTypes(selectedHiTypes.filter((t) => t !== type));
    } else {
      setSelectedHiTypes([...selectedHiTypes, type]);
    }
  };

  const handleOpenFhirModal = (rec) => {
    const bundle = mapMedicalRecordToFhirBundle(
      {
        id: rec.id,
        title: rec.title,
        modality: rec.modality || 'Diagnostic',
        created_at: '2026-01-12T10:00:00.000Z',
        report: { impression: rec.summary }
      },
      {
        id: patient.patient_id || patient.id,
        name: patient.patient_name || patient.name,
        abhaNumber: patientAbha,
        abhaAddress: abhaAddress
      },
      { name: rec.doctor },
      { name: rec.hospitalName, hfrId: rec.hospitalHfr }
    );
    setActiveFhirModalBundle(bundle);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              ABDM Longitudinal Health Vault (HIU)
            </h3>
            <span className="text-[10px] text-slate-400 font-bold block">
              Pull prior records across Indian hospitals via ABHA
            </span>
          </div>
        </div>

        <span
          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
            consentStatus === 'GRANTED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : consentStatus === 'PENDING'
              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {consentStatus === 'GRANTED'
            ? '✓ Consent Active'
            : consentStatus === 'PENDING'
            ? 'Consent Pending'
            : 'Consent Required'}
        </span>
      </div>

      {/* STATE 1: IDLE / Initial Request */}
      {consentStatus === 'IDLE' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700 leading-snug">
              Under NHA guidelines, patient consent is mandatory to fetch historical clinical records.
            </p>
            <p className="text-[11px] font-mono font-bold text-blue-700">
              ABHA ID: {patientAbha} · Handle: {abhaAddress}
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Records Requested (HI Types)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'DiagnosticReport', label: 'Imaging / Labs' },
                { id: 'Prescription', label: 'Past Prescriptions' },
                { id: 'OPConsultation', label: 'OP Notes' },
                { id: 'DischargeSummary', label: 'Hospital Discharges' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleHiType(t.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    selectedHiTypes.includes(t.id)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleRequestConsent}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 text-indigo-200" />
              )}
              <span>Initiate ABDM Consent Request →</span>
            </button>

            {onBreakGlass && (
              <button
                type="button"
                onClick={onBreakGlass}
                className="py-3 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                🚨 Emergency Override
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATE 2: PENDING / Waiting for Authorization */}
      {consentStatus === 'PENDING' && (
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800">
                Consent Request Dispatched via ABDM Gateway
              </h4>
              <p className="text-[11px] text-slate-600">
                An approval push prompt has been dispatched to <strong>{abhaAddress}</strong> on their official ABHA mobile application.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-2">
            <div className="text-[10px] font-bold text-slate-500">
              <span className="text-amber-800 font-black">Sandbox Simulation:</span> Click to simulate patient approving request.
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleSimulateApproval}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Simulate Citizen Approval ✓</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: GRANTED / Records Display */}
      {consentStatus === 'GRANTED' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Consent Artifact Active · 2 External Hospital Records Ingested</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600">
              Valid: 30 days
            </span>
          </div>

          <div className="space-y-2">
            {SAMPLE_EXTERNAL_RECORDS.map((rec) => (
              <div
                key={rec.id}
                className="border border-slate-200 rounded-2xl p-3.5 bg-white shadow-2xs hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl shrink-0 mt-0.5">
                      {rec.hiType === 'DiagnosticReport' ? (
                        <Activity className="w-4 h-4" />
                      ) : (
                        <Pill className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{rec.title}</span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {rec.hiType}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{rec.hospitalName}</span>
                        <span>•</span>
                        <span>{rec.date}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenFhirModal(rec)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200 font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Inspect FHIR R4</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-700 font-medium leading-relaxed">
                  {rec.summary}
                </div>

                <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Treating Doctor: {rec.doctor}</span>
                  <span>Auto-Erasure: {rec.dataEraseAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded FHIR DocumentBundle Inspector */}
      {activeFhirModalBundle && (
        <FhirBundleModal
          bundle={activeFhirModalBundle}
          onClose={() => setActiveFhirModalBundle(null)}
          title="External Hospital Record · NRCeS FHIR R4 Document"
        />
      )}
    </div>
  );
}
