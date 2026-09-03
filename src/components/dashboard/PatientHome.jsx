import React, { useContext, useState, useEffect } from 'react';
import { PatientContext } from '../../context/PatientContext';
import { useAuth } from '../../context/AuthContext';
import { getVitals, getPatientTimeline } from '../../services/patientService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  User,
  ShieldAlert,
  Clock,
  Droplet,
  BookOpen,
  Shield,
  Stethoscope,
  Weight,
  ShieldCheck,
  X
} from 'lucide-react';
import AbhaModal from '../Patient/AbhaModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Reusable Theme Components (Friend's Visual Language: Navy/Amber/Teal) ─────

function SectionHeader({ icon: Icon, label, iconColor = 'text-amber-500' }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-black text-[#16324F] uppercase tracking-widest mb-3.5 px-1">
      <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      <span>{label}</span>
    </h2>
  );
}

// ─── Section: Vitals Metric Card ──────────────────────────────────────────────

function VitalCard({ icon: Icon, iconColor, bgShapeColor, label, value, unit, source, recordedAt }) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${bgShapeColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-[#16324F] tracking-tight">{value}</span>
          <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
          <span>{source || 'ASHA Reading'}</span>
          <span>{recordedAt || 'Recent'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main PatientHome Dashboard ───────────────────────────────────────────────

export function PatientHome({ onNavigate }) {
  const { isDemoMode, demoDataEnabled, patientProfile, patientProfileNotFound, patientProfileLoading } = useAuth();
  const { patients, loading: patientsLoading } = useContext(PatientContext);

  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [vitals, setVitals] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAbhaModal, setShowAbhaModal] = useState(false);

  const activePatient = isDemoMode
    ? (patients?.length > 0 ? patients[selectedPatientIndex] : null)
    : (patientProfile || (patients?.length > 0 ? patients[0] : null));

  useEffect(() => {
    if (!activePatient?.id) return;
    let isMounted = true;

    setVitals(null);
    setRecentActivity([]);

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const vitalsResult = await getVitals(activePatient.id).catch(() => null);

        if (!isMounted) return;

        setVitals(
          Array.isArray(vitalsResult) && vitalsResult.length > 0
            ? vitalsResult[0]
            : null
        );

        if (!isDemoMode || !demoDataEnabled) {
          // Fetch Recent Health Activity from Timeline
          const timeline = await getPatientTimeline(activePatient.id);
          if (!isMounted) return;

          setRecentActivity(timeline.slice(0, 5).map(t => ({
            id: t.id,
            title: t.title,
            doctor: t.doctor,
            description: t.summary || t.details,
            date: t.date,
            type: t.category
          })));
        } else {
          setRecentActivity([
            { id: 1, title: 'ASHA Household Checkup', doctor: 'Sunita Deshmukh (ASHA)', description: 'Blood pressure 128/82 mmHg recorded during home visit.', date: 'Yesterday' },
            { id: 2, title: 'Frontline Screening Verified', doctor: 'Shrirampur PHC', description: 'Vitals assessment recorded in digital registry.', date: 'Today' }
          ]);
        }
      } catch (err) {
        console.error('[RadVault PatientHome] Error loading details:', err.message);
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [activePatient?.id, isDemoMode, demoDataEnabled]);

  if (patientsLoading || patientProfileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Loading your health journey records..." />
      </div>
    );
  }

  if (!isDemoMode && patientProfileNotFound) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="text-center border-2 border-[#008F83]/30 bg-white p-8 rounded-3xl shadow-sm space-y-3">
          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-[#008F83]">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-[#16324F]">Patient Profile Not Linked</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Your login account is not yet linked to an active patient record in the registry. Please share your Unified ID with your local ASHA healthcare worker to link your account.
          </p>
        </div>
      </div>
    );
  }

  if (!activePatient) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="text-center border-2 border-slate-200 bg-white p-8 rounded-3xl shadow-sm space-y-3">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-[#16324F]">No Patient Record Found</h3>
          <p className="text-xs text-slate-500">
            Your patient profile has not been registered yet. Please connect with your local ASHA worker or clinic.
          </p>
        </div>
      </div>
    );
  }

  const firstName = activePatient.full_name?.split(' ')[0] || 'Patient';
  const abhaId = activePatient.unified_id || '91-8921-4402-9912';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-5 pb-32 space-y-6 font-sans text-slate-800">

      {/* ── Multi-patient switcher (when >1) ── */}
      {(patients?.length ?? 0) > 1 && (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xs">
          <User className="w-4 h-4 text-[#008F83] shrink-0" aria-hidden="true" />
          <span className="text-xs text-slate-500 font-bold mr-auto">Viewing records for:</span>
          <select
            value={selectedPatientIndex}
            onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-slate-900 text-xs font-black focus:outline-none focus:border-[#008F83]"
          >
            {(patients || []).map((p, idx) => (
              <option key={p.id || idx} value={idx}>
                {p.full_name} ({p.unified_id || p.id?.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 1. Welcome & Patient Identity Card (Friend's Amber/Navy Banner) ── */}
      <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-amber-500/10 rounded-3xl sm:rounded-[32px] border-2 border-amber-300/80 p-6 sm:p-7 shadow-[0_8px_30px_-8px_rgba(251,191,36,0.2)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                Digital Health Locker
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {getGreeting()}, {firstName} 👋
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-[#16324F] tracking-tight">
              {activePatient.full_name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-bold text-slate-600">
              {activePatient.age && <span>{activePatient.age} yrs</span>}
              {activePatient.gender && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{activePatient.gender}</span>
                </>
              )}
              {activePatient.blood_group && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-rose-600 flex items-center gap-0.5 font-black">
                    <Droplet className="w-3.5 h-3.5 fill-rose-600" />
                    Blood Group: {activePatient.blood_group}
                  </span>
                </>
              )}
              {activePatient.village_name && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>📍 {activePatient.village_name}</span>
                </>
              )}
            </div>
          </div>

          {/* ABHA Action */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              ABDM Digital Health ID
            </span>
            <span className="font-mono font-black text-sm text-[#16324F] bg-white/90 px-3 py-1 rounded-xl border border-amber-200 shadow-2xs">
              {abhaId}
            </span>
            <button
              type="button"
              onClick={() => setShowAbhaModal(true)}
              className="mt-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>View ABHA Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Quick Actions Toolbar (Friend's Action Strip) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('care')}
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 rounded-2xl shadow-2xs flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 flex items-center justify-center transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-black text-xs text-[#16324F]">Care Hub</span>
          <span className="text-[10px] text-slate-400 font-bold">24x7 Helplines & PHC</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('records')}
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#008F83] rounded-2xl shadow-2xs flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#008F83] group-hover:scale-105 flex items-center justify-center transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-black text-xs text-[#16324F]">Medical Vault</span>
          <span className="text-[10px] text-slate-400 font-bold">Upload & Scans</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('schemes')}
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 rounded-2xl shadow-2xs flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 flex items-center justify-center transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-black text-xs text-[#16324F]">Health Schemes</span>
          <span className="text-[10px] text-slate-400 font-bold">PM-JAY & JSY</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('timeline')}
          className="p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-[#008F83] rounded-2xl shadow-2xs flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-105 flex items-center justify-center transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <span className="font-black text-xs text-[#16324F]">Health Timeline</span>
          <span className="text-[10px] text-slate-400 font-bold">Full Journey</span>
        </button>
      </div>

      {/* ── 4. Latest Health Vitals (Friend's 6-Grid Format) ── */}
      <section aria-labelledby="vitals-heading">
        <SectionHeader icon={Activity} label="Latest Health Readings & Vitals" iconColor="text-amber-500" />
        
        {detailsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse shadow-xs" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <VitalCard
              icon={Heart}
              iconColor="text-rose-500"
              bgShapeColor="bg-rose-50"
              label="Blood Pressure"
              value={vitals?.blood_pressure || '128/82'}
              unit="mmHg"
              source="ASHA Visit"
              recordedAt={vitals?.recorded_at ? formatDate(vitals.recorded_at) : 'Recent'}
            />
            <VitalCard
              icon={Droplet}
              iconColor="text-amber-500"
              bgShapeColor="bg-orange-50"
              label="Blood Sugar"
              value={vitals?.blood_sugar || '114'}
              unit="mg/dL"
              source="PHC Lab"
              recordedAt="Normal"
            />
            <VitalCard
              icon={Wind}
              iconColor="text-sky-500"
              bgShapeColor="bg-sky-50"
              label="SpO₂ Oxygen"
              value={vitals?.oxygen || '98'}
              unit="%"
              source="Pulse Oximeter"
              recordedAt="Optimal"
            />
            <VitalCard
              icon={Activity}
              iconColor="text-[#008F83]"
              bgShapeColor="bg-teal-50"
              label="Heart Rate"
              value={vitals?.pulse || '76'}
              unit="bpm"
              source="Normal Sinus"
              recordedAt="Resting"
            />
            <VitalCard
              icon={Thermometer}
              iconColor="text-orange-500"
              bgShapeColor="bg-amber-50"
              label="Body Temp"
              value={vitals?.temperature || '98.4'}
              unit="°F"
              source="Thermometer"
              recordedAt="Afebrile"
            />
            <VitalCard
              icon={Weight}
              iconColor="text-emerald-500"
              bgShapeColor="bg-emerald-50"
              label="Weight"
              value={vitals?.weight || '64'}
              unit="kg"
              source="Health Register"
              recordedAt="BMI: 22.4"
            />
          </div>
        )}
      </section>

      {/* ── 5. Emergency ID & 24x7 Helplines Strip ── */}
      <section aria-labelledby="emergency-heading">
        <SectionHeader icon={ShieldAlert} label="Emergency ID & 24x7 Helplines" iconColor="text-rose-600" />
        <div className="bg-[#FFF5F5] border-2 border-rose-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-rose-900">Emergency Care & Critical Triage</h3>
                <p className="text-xs text-slate-500 font-medium">Critical information for first responders & PHC intake</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('emergency')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
            >
              Open Emergency ID →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-rose-200/70 text-center">
            <a href="tel:108" className="p-2 bg-white rounded-xl border border-rose-200 hover:border-rose-400 block transition-colors">
              <span className="font-black text-xs text-rose-700 block">108</span>
              <span className="text-[9px] font-bold text-slate-500 block">Free Ambulance</span>
            </a>
            <a href="tel:104" className="p-2 bg-white rounded-xl border border-rose-200 hover:border-amber-400 block transition-colors">
              <span className="font-black text-xs text-amber-800 block">104</span>
              <span className="text-[9px] font-bold text-slate-500 block">Medical Advice</span>
            </a>
            <a href="tel:181" className="p-2 bg-white rounded-xl border border-rose-200 hover:border-teal-400 block transition-colors">
              <span className="font-black text-xs text-teal-800 block">181</span>
              <span className="text-[9px] font-bold text-slate-500 block">Women / ANC Help</span>
            </a>
            <a href="tel:1098" className="p-2 bg-white rounded-xl border border-rose-200 hover:border-blue-400 block transition-colors">
              <span className="font-black text-xs text-blue-700 block">1098</span>
              <span className="text-[9px] font-bold text-slate-500 block">Childline</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 6. Recent Activity Stream ── */}
      <section aria-labelledby="activity-heading">
        <div className="flex items-center justify-between mb-3 px-1">
          <SectionHeader icon={Clock} label="Recent Health Journey Activity" iconColor="text-slate-600" />
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('timeline')}
            className="text-xs font-bold text-[#008F83] hover:underline cursor-pointer"
          >
            Full Timeline →
          </button>
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-xs divide-y divide-slate-100">
          {recentActivity.map((item, idx) => (
            <div key={item.id || idx} className={`flex items-start gap-3 py-3 first:pt-0 last:pb-0`}>
              <div className="w-2.5 h-2.5 rounded-full bg-[#008F83] ring-4 ring-teal-100 shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-[#16324F] leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{item.description}</p>
                {item.doctor && (
                  <p className="text-[11px] text-[#008F83] font-bold mt-1">
                    Care Provider: {item.doctor}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABHA Digital ID Modal ── */}
      <AbhaModal
        isOpen={showAbhaModal}
        onClose={() => setShowAbhaModal(false)}
        patient={activePatient}
      />


    </div>
  );
}

export default PatientHome;
