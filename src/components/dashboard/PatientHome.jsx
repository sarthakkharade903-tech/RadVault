import React, { useContext, useState, useEffect } from 'react';
import { PatientContext } from '../../context/PatientContext';
import { getVitals, getUpcomingAppointments } from '../../services/patientService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Calendar,
  User,
  ShieldAlert,
  FileText,
  Clock,
  ArrowRight,
  Phone,
  Droplet,
  Share2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FolderOpen,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';

// ─── Mock data ───────────────────────────────────────────────────────────────
// Structured so it can later be replaced by Supabase queries.

const MOCK_EMERGENCY = {
  bloodGroup: 'O+',
  criticalAllergies: 'Penicillin',
  emergencyContact: 'Suresh Kumar',
  criticalConditions: 'Hypertension',
};

const MOCK_RECORDS_SUMMARY = {
  total: 12,
  recentCount: 3,
  types: 'X-rays • MRI/CT • Lab Reports • Prescriptions',
};

const MOCK_REFERRAL_SUMMARY = {
  activeCount: 2,
  latest: {
    name: 'Cardiology Consultation',
    doctor: 'Dr. Sandeep Kulkarni',
    status: 'Pending',
  },
};

const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    title: 'MRI Report Added',
    description: 'Brain MRI report added to your medical records.',
    date: '23 Aug 2026',
    icon: 'file',
  },
  {
    id: 2,
    title: 'Referral Received',
    description: 'Cardiology referral received from Dr. Sandeep Kulkarni.',
    date: '22 Aug 2026',
    icon: 'share',
  },
  {
    id: 3,
    title: 'Blood Report Added',
    description: 'CBC report added to your records.',
    date: '20 Aug 2026',
    icon: 'file',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Small reusable sub-components ───────────────────────────────────────────

function SectionHeader({ icon: Icon, label, iconColor = 'text-teal-400' }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
      <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      {label}
    </h2>
  );
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-[#162238] border border-[#26364D] rounded-2xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function ActionButton({ onClick, children, variant = 'default' }) {
  const base =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A]';
  const variants = {
    default: 'bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500',
    teal: 'bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-500',
    red: 'bg-red-800/60 hover:bg-red-700/70 text-red-100 focus:ring-red-600',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  const map = {
    scheduled: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    confirmed: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    completed: 'bg-green-500/15 text-green-300 border border-green-500/30',
    pending:   'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    cancelled: 'bg-slate-600/40 text-slate-400 border border-slate-600',
  };
  const key = status?.toLowerCase() || 'scheduled';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[key] || map.scheduled}`}>
      {status || 'Scheduled'}
    </span>
  );
}

// ─── Skeleton loader (used per section while detailsLoading) ─────────────────

function SkeletonCard({ rows = 2 }) {
  return (
    <div className="bg-[#162238] border border-[#26364D] rounded-2xl p-5 animate-pulse">
      <div className="h-3 bg-slate-700 rounded w-1/3 mb-3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`h-4 bg-slate-700 rounded mb-2 ${i === rows - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

// ─── Section: Attention Items ─────────────────────────────────────────────────

function AttentionSection({ appointment, referral }) {
  const items = [];

  if (appointment) {
    items.push({
      id: 'appt',
      label: 'Upcoming appointment',
      title: appointment.doctor_name || 'Doctor Consultation',
      subtitle: `${formatDate(appointment.appointment_date)} · ${appointment.appointment_time || '10:30 AM'}`,
      action: 'View Appointment',
      tab: 'referrals',
      color: 'teal',
    });
  }

  if (referral && !appointment) {
    items.push({
      id: 'ref',
      label: 'Pending referral',
      title: referral.latest.name,
      subtitle: 'Action may be required',
      action: 'Review Referral',
      tab: 'referrals',
      color: 'amber',
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-400" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm">You're all caught up</p>
            <p className="text-xs text-slate-400 mt-0.5">You don't have any pending healthcare actions right now.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const borderColor = item.color === 'teal' ? 'border-teal-500/30' : 'border-amber-500/30';
        const pillColor   = item.color === 'teal' ? 'text-teal-300 bg-teal-500/10' : 'text-amber-300 bg-amber-500/10';
        const iconColor   = item.color === 'teal' ? 'text-teal-400 bg-teal-500/10' : 'text-amber-400 bg-amber-500/10';
        const Icon        = item.color === 'teal' ? Calendar : AlertCircle;

        return (
          <div key={item.id} className={`bg-[#162238] border ${borderColor} rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pillColor} mb-1 inline-block uppercase tracking-wide`}>
                {item.label}
              </span>
              <p className="font-semibold text-slate-100 text-sm leading-tight truncate">{item.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Vitals ──────────────────────────────────────────────────────────

const VITAL_CARDS = [
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: Heart,       iconColor: 'text-rose-400',   fallback: '—' },
  { key: 'pulse',          label: 'Heart Rate',     unit: 'bpm',  icon: Activity,    iconColor: 'text-teal-400',   fallback: '—' },
  { key: 'oxygen',         label: 'SpO₂',           unit: '%',    icon: Wind,        iconColor: 'text-sky-400',    fallback: '—' },
  { key: 'temperature',    label: 'Temperature',    unit: '°F',   icon: Thermometer, iconColor: 'text-amber-400',  fallback: '—' },
];

function VitalsSection({ vitals, loading }) {
  if (loading) return <SkeletonCard rows={1} />;

  if (!vitals) {
    return (
      <Card className="text-center py-6">
        <Activity className="w-7 h-7 text-slate-600 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-slate-400">No recent vitals logged yet.</p>
        <p className="text-xs text-slate-500 mt-1">Vitals recorded during healthcare visits will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {vitals.recorded_at && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Recorded {formatDate(vitals.recorded_at)}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {VITAL_CARDS.map(({ key, label, unit, icon: Icon, iconColor, fallback }) => (
          <div
            key={key}
            className="bg-[#111C31] border border-[#26364D] rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{label}</span>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-50 tabular-nums">
                {vitals[key] ?? fallback}
              </span>
              {vitals[key] != null && (
                <span className="text-xs text-slate-500 ml-1">{unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Upcoming Appointment ───────────────────────────────────────────

function AppointmentSection({ appointments, loading }) {
  if (loading) return <SkeletonCard rows={3} />;

  if (!appointments || appointments.length === 0) {
    return (
      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-200">No Upcoming Appointments</p>
          <p className="text-xs text-slate-400 mt-0.5">Need a specialist consultation or follow-up?</p>
        </div>
        <button className="shrink-0 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors">
          Schedule Visit
        </button>
      </Card>
    );
  }

  const appt = appointments[0];
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-teal-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StatusPill status={appt.status || 'Scheduled'} />
          </div>
          <h3 className="text-base font-bold text-slate-100 leading-snug">
            {appt.doctor_name || 'Doctor Consultation'}
          </h3>
          <p className="text-sm text-slate-300 mt-0.5">
            {appt.facility || 'District Civil Hospital'}
          </p>
          <p className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              {formatDate(appt.appointment_date)}
            </span>
            {appt.appointment_time && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  {appt.appointment_time}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="sm:self-center">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors">
            View <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Section: Emergency Summary ───────────────────────────────────────────────

function EmergencySection({ onNavigate }) {
  return (
    <Card className="border-red-900/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-200">Emergency ID</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Critical information for emergency situations.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
        <div>
          <dt className="text-slate-500 mb-0.5">Blood Group</dt>
          <dd className="font-semibold text-red-300 flex items-center gap-1">
            <Droplet className="w-3 h-3" aria-hidden="true" />
            {MOCK_EMERGENCY.bloodGroup}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 mb-0.5">Critical Allergies</dt>
          <dd className="font-semibold text-slate-200">{MOCK_EMERGENCY.criticalAllergies}</dd>
        </div>
        <div>
          <dt className="text-slate-500 mb-0.5">Emergency Contact</dt>
          <dd className="font-semibold text-slate-200">{MOCK_EMERGENCY.emergencyContact}</dd>
        </div>
        <div>
          <dt className="text-slate-500 mb-0.5">Critical Condition</dt>
          <dd className="font-semibold text-slate-200">{MOCK_EMERGENCY.criticalConditions}</dd>
        </div>
      </dl>

      <button
        onClick={() => onNavigate && onNavigate('emergency')}
        className="w-full py-2 bg-red-800/40 hover:bg-red-700/50 border border-red-800/50 text-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
      >
        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
        Open Emergency ID
      </button>
    </Card>
  );
}

// ─── Section: Records Summary ─────────────────────────────────────────────────

function RecordsSummary({ onNavigate }) {
  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-teal-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">Medical Records</h3>
          <p className="text-xs text-slate-400 mt-0.5">{MOCK_RECORDS_SUMMARY.types}</p>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-50">{MOCK_RECORDS_SUMMARY.total}</p>
            <p className="text-xs text-slate-400">Total Records</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-teal-400">{MOCK_RECORDS_SUMMARY.recentCount}</p>
            <p className="text-xs text-slate-400">Recently Added</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('records')}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
        >
          View Records <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}

// ─── Section: Referral Summary ────────────────────────────────────────────────

function ReferralSummary({ onNavigate }) {
  const ref = MOCK_REFERRAL_SUMMARY;

  if (!ref.activeCount) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-700/60 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Referrals</h3>
            <p className="text-xs text-slate-400 mt-0.5">No active referrals at the moment.</p>
            <p className="text-xs text-slate-500 mt-1">Referrals from your doctors will appear here.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Referrals</h3>
            <p className="text-xs text-amber-300 mt-0.5 font-medium">{ref.activeCount} Active Referral{ref.activeCount > 1 ? 's' : ''}</p>
          </div>
        </div>
        <StatusPill status="Pending" />
      </div>

      <div className="border-t border-[#26364D] pt-3 mb-3">
        <p className="text-xs text-slate-500 mb-0.5">Latest</p>
        <p className="text-sm font-semibold text-slate-100">{ref.latest.name}</p>
        <p className="text-xs text-slate-400">{ref.latest.doctor}</p>
      </div>

      <button
        onClick={() => onNavigate && onNavigate('referrals')}
        className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
      >
        View Referrals <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </Card>
  );
}

// ─── Section: Recent Activity ─────────────────────────────────────────────────

function RecentActivity() {
  return (
    <div className="space-y-0 divide-y divide-[#26364D]">
      {MOCK_RECENT_ACTIVITY.map((item, idx) => {
        const Icon = item.icon === 'share' ? Share2 : FileText;
        return (
          <div key={item.id} className={`flex items-start gap-3 py-3.5 ${idx === 0 ? 'pt-0' : ''}`}>
            <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 leading-snug">{item.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>
            </div>
            <span className="text-xs text-slate-500 shrink-0 ml-2 mt-0.5">{item.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main PatientHome component ───────────────────────────────────────────────

export function PatientHome({ onNavigate }) {
  const { patients, loading: patientsLoading, error: patientsError } = useContext(PatientContext);

  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [vitals, setVitals]                     = useState(null);
  const [appointments, setAppointments]         = useState([]);
  const [detailsLoading, setDetailsLoading]     = useState(false);

  const activePatient = patients?.length > 0 ? patients[selectedPatientIndex] : null;

  useEffect(() => {
    if (!activePatient?.id) return;
    let isMounted = true;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      const [vitalsResult, apptsResult] = await Promise.allSettled([
        getVitals(activePatient.id),
        getUpcomingAppointments(activePatient.id),
      ]);
      if (!isMounted) return;
      setVitals(vitalsResult.status === 'fulfilled' && vitalsResult.value?.length > 0
        ? vitalsResult.value[0] : null);
      setAppointments(apptsResult.status === 'fulfilled' ? (apptsResult.value || []) : []);
      setDetailsLoading(false);
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [activePatient?.id]);

  // ── Loading ──
  if (patientsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Loading your health records…" />
      </div>
    );
  }

  // ── Error ──
  if (patientsError) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <Card className="text-center border-red-900/50">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-red-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">Unable to Load Records</h3>
          <p className="text-sm text-slate-400 mb-4">We couldn't load your health information. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try Again
          </button>
        </Card>
      </div>
    );
  }

  // ── No patients ──
  if (!patients || patients.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <Card className="text-center">
          <div className="w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-teal-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">No Patient Record Found</h3>
          <p className="text-sm text-slate-400">
            Your patient record has not been added yet. Please contact your healthcare provider.
          </p>
        </Card>
      </div>
    );
  }

  const firstName = activePatient.full_name?.split(' ')[0] || 'there';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-6">

      {/* ── Multi-patient switcher (only if >1) ── */}
      {patients.length > 1 && (
        <div className="flex items-center gap-2 bg-[#111C31] border border-[#26364D] rounded-xl px-4 py-2.5">
          <User className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="text-xs text-slate-400 mr-auto">Viewing records for:</span>
          <select
            value={selectedPatientIndex}
            onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
            className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none"
          >
            {patients.map((p, idx) => (
              <option key={p.id || idx} value={idx} className="bg-slate-900">
                {p.full_name} ({p.unified_id || p.id?.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 1. Greeting ── */}
      <div>
        <p className="text-base text-slate-300 font-medium">
          {getGreeting()}, {firstName} 👋
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Your health records and upcoming care, all in one place.
        </p>
      </div>

      {/* ── 2. Patient Context / Identity ── */}
      <section aria-labelledby="patient-id-heading">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start gap-1 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
              Active Health Journey
            </span>
          </div>

          <h1 id="patient-id-heading" className="text-2xl font-bold text-slate-50 tracking-tight mb-1">
            {activePatient.full_name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300 mb-3">
            {activePatient.age && <span>{activePatient.age} yrs</span>}
            {activePatient.gender && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span>{activePatient.gender}</span>
              </>
            )}
            {activePatient.blood_group && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-red-300 font-medium">
                  <Droplet className="w-3.5 h-3.5" aria-hidden="true" />
                  {activePatient.blood_group}
                </span>
              </>
            )}
            {activePatient.contact && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  {activePatient.contact}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#26364D]">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Unified Patient ID</p>
              <p className="font-mono font-bold text-slate-200 text-sm mt-0.5">
                {activePatient.unified_id || 'MH-P-10482'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">Care Network</p>
              <p className="text-xs font-semibold text-teal-400 mt-0.5">Rural Health Link Connected</p>
            </div>
          </div>
        </Card>
      </section>

      {/* ── 3. What Needs Your Attention ── */}
      <section aria-labelledby="attention-heading">
        <SectionHeader icon={AlertCircle} label="What Needs Your Attention" iconColor="text-amber-400" />
        <AttentionSection
          appointment={appointments[0] || null}
          referral={MOCK_REFERRAL_SUMMARY.activeCount > 0 ? MOCK_REFERRAL_SUMMARY : null}
        />
      </section>

      {/* ── 4. Upcoming Appointment ── */}
      <section aria-labelledby="appt-heading">
        <SectionHeader icon={Calendar} label="Upcoming Appointment" iconColor="text-teal-400" />
        <AppointmentSection appointments={appointments} loading={detailsLoading} />
      </section>

      {/* ── 5 & 6. Emergency + Records (side by side on tablet+) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section aria-labelledby="emergency-heading">
          <SectionHeader icon={ShieldAlert} label="Emergency ID" iconColor="text-red-400" />
          <EmergencySection onNavigate={onNavigate} />
        </section>
        <section aria-labelledby="records-heading">
          <SectionHeader icon={FolderOpen} label="Medical Records" iconColor="text-teal-400" />
          <RecordsSummary onNavigate={onNavigate} />
        </section>
      </div>

      {/* ── 7. Latest Vitals ── */}
      <section aria-labelledby="vitals-heading">
        <SectionHeader icon={Activity} label="Latest Vitals" iconColor="text-teal-400" />
        <VitalsSection vitals={vitals} loading={detailsLoading} />
      </section>

      {/* ── 8. Referral Summary ── */}
      <section aria-labelledby="referral-heading">
        <SectionHeader icon={Share2} label="Referrals" iconColor="text-amber-400" />
        <ReferralSummary onNavigate={onNavigate} />
      </section>

      {/* ── 9. Recent Health Activity ── */}
      <section aria-labelledby="activity-heading">
        <SectionHeader icon={Clock} label="Recent Health Activity" iconColor="text-slate-400" />
        <Card>
          <RecentActivity />
        </Card>
      </section>

    </div>
  );
}

export default PatientHome;
