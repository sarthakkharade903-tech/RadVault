import React, { useContext, useState, useEffect } from 'react';
import { PatientContext } from '../../context/PatientContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { getVitals, getUpcomingAppointments, getPatientTimeline } from '../../services/patientService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Calendar,
  User,
  ShieldAlert,
  Clock,
  Phone,
  Droplet,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Handshake,
  Shield,
  Plus,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import AbhaModal from '../Patient/AbhaModal';

// ─── Structured Mock Data (Ready for Supabase mapping) ───────────────────────

const MOCK_EMERGENCY = {
  bloodGroup: 'O+',
  criticalAllergies: 'Penicillin',
  emergencyContact: 'Suresh Kumar (+91 98765 11223)',
  criticalConditions: 'Hypertension',
};

const MOCK_RECORDS_SUMMARY = {
  total: 12,
  recentCount: 3,
  types: 'X-rays • MRI/CT Scans • Lab Reports • Prescriptions',
};

const MOCK_REFERRAL_SUMMARY = {
  activeCount: 2,
  latest: {
    name: 'Cardiology Consultation',
    doctor: 'Dr. Sandeep Kulkarni',
    hospital: 'Ahmednagar District Civil Hospital',
    status: 'Pending',
    date: '22 Aug 2026',
  },
};

const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    title: 'Brain MRI Report Added',
    doctor: 'Dr. Rajesh Deshmukh',
    description: 'MRI scan report uploaded and linked to RadVault.',
    date: '23 Aug 2026',
    type: 'record',
  },
  {
    id: 2,
    title: 'Cardiology Referral Issued',
    doctor: 'Dr. Sandeep Kulkarni',
    description: 'Specialist referral received from Rural Primary Health Centre.',
    date: '22 Aug 2026',
    type: 'referral',
  },
  {
    id: 3,
    title: 'Blood CBC Lab Report',
    doctor: 'Dr. Anita Joshi',
    description: 'Complete Blood Count report verified and archived.',
    date: '20 Aug 2026',
    type: 'record',
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

// ─── Reusable Theme Components ────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, iconColor = 'text-[#008080]' }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-[#555555] uppercase tracking-wider mb-3">
      <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      {label}
    </h2>
  );
}

function LightCard({ children, className = '' }) {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {children}
    </div>
  );
}

// Culturally friendly Emergency Shield with Red Cross icon
function EmergencyShieldIcon({ className = 'w-6 h-6' }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Shield className={`${className} text-[#FF9933] fill-[#FF9933]/20`} />
      <Plus className="w-3.5 h-3.5 text-[#D32F2F] absolute stroke-[3.5]" />
    </div>
  );
}

// ─── Section: Attention Items ─────────────────────────────────────────────────

function AttentionSection({ appointment, referral, onNavigate }) {
  const items = [];

  if (appointment) {
    items.push({
      id: 'appt',
      type: 'confirmed',
      label: 'Confirmed Doctor Appointment',
      title: appointment.doctor_name || 'Cardiology Consultation',
      subtitle: `${formatDate(appointment.appointment_date)} · ${appointment.appointment_time || '10:30 AM'}`,
      facility: appointment.facility || 'District Civil Hospital',
      actionText: 'View Details',
      tab: 'referrals',
    });
  }

  if (referral) {
    items.push({
      id: 'ref',
      type: 'pending',
      label: 'Pending Referral · Action Required',
      title: referral.latest.name,
      subtitle: `${referral.latest.doctor} · ${referral.latest.hospital}`,
      facility: referral.latest.hospital,
      actionText: 'Review Referral',
      tab: 'referrals',
    });
  }

  if (items.length === 0) {
    return (
      <LightCard className="border-l-4 border-l-[#2E7D32]">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#2E7D32]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-[#212121] text-base">You're all caught up!</h3>
            <p className="text-sm text-[#555555] mt-0.5">
              You don't have any pending healthcare actions or overdue follow-ups right now.
            </p>
          </div>
        </div>
      </LightCard>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isConfirmed = item.type === 'confirmed';
        return (
          <div
            key={item.id}
            className={`rounded-2xl p-4 sm:p-5 border-2 transition-all shadow-sm ${
              isConfirmed
                ? 'bg-[#E8F5E9]/60 border-[#2E7D32]/40'
                : 'bg-[#FFF8E1]/80 border-[#FFC107]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isConfirmed ? 'bg-[#2E7D32] text-white' : 'bg-[#FF9933] text-white'
                  }`}
                >
                  {isConfirmed ? (
                    <Calendar className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-5 h-5" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-1 ${
                      isConfirmed
                        ? 'bg-[#2E7D32]/15 text-[#1B5E20]'
                        : 'bg-[#FF9933]/20 text-[#855B00]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <h3 className="font-bold text-[#212121] text-base sm:text-lg leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#555555] mt-0.5 flex items-center gap-1.5">
                    <span>{item.subtitle}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate && onNavigate(item.tab)}
                className="self-start sm:self-center px-4 py-2 bg-[#FF9933] hover:bg-[#e68a2e] active:bg-[#cc7a29] text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>{item.actionText}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Upcoming Doctor Appointment ─────────────────────────────────────

function AppointmentSection({ appointments, loading, onNavigate }) {
  if (loading) {
    return (
      <LightCard className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-6 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </LightCard>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <LightCard className="border-2 border-dashed border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#212121]">No Upcoming Appointments</h3>
          <p className="text-sm text-[#555555] mt-0.5">
            Need a specialist consultation or routine health checkup?
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('referrals')}
          className="px-4 py-2 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          Schedule Visit
        </button>
      </LightCard>
    );
  }

  const appt = appointments[0];
  return (
    <LightCard className="border-2 border-[#008080]/30 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-[#008080]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                ● Confirmed Consultation
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#800000]">
              {appt.doctor_name || 'Dr. Sandeep Kulkarni'}
            </h3>
            <p className="text-sm font-medium text-[#555555] mt-0.5">
              {appt.facility || 'Ahmednagar District Civil Hospital'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#212121] font-semibold mt-2.5 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#008080]" aria-hidden="true" />
                {formatDate(appt.appointment_date)}
              </span>
              {appt.appointment_time && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#008080]" aria-hidden="true" />
                    {appt.appointment_time}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('referrals')}
          className="self-start sm:self-center px-4 py-2 bg-[#800000] hover:bg-[#660000] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-1.5"
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </LightCard>
  );
}

// ─── Section: Emergency ID Card ───────────────────────────────────────────────

function EmergencyCard({ onNavigate, patient }) {
  const { isDemoMode, demoDataEnabled } = useAuth();
  const bloodGroup = patient?.blood_group || patient?.bloodGroup || (isDemoMode && demoDataEnabled ? MOCK_EMERGENCY.bloodGroup : 'N/A');
  const allergies = patient?.critical_allergies || patient?.vitals?.allergies || (isDemoMode && demoDataEnabled ? MOCK_EMERGENCY.criticalAllergies : 'None recorded');
  const emergencyContact = patient?.emergency_contact || patient?.vitals?.emergencyContact || (isDemoMode && demoDataEnabled ? MOCK_EMERGENCY.emergencyContact : 'None recorded');

  return (
    <div className="bg-[#FFF5F5] border-2 border-[#D32F2F]/35 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#D32F2F]/20 flex items-center justify-center shrink-0 shadow-xs">
            <EmergencyShieldIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#D32F2F] flex items-center gap-1.5">
              Emergency ID
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Critical info for first responders & doctors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white/80 border border-[#D32F2F]/20 rounded-xl p-3.5 mb-4 text-xs">
          <div>
            <span className="text-[#555555] block font-medium">Blood Group</span>
            <span className="font-extrabold text-[#D32F2F] text-base flex items-center gap-1 mt-0.5">
              <Droplet className="w-4 h-4" />
              {bloodGroup}
            </span>
          </div>
          <div>
            <span className="text-[#555555] block font-medium">Critical Allergies</span>
            <span className="font-bold text-[#212121] text-sm mt-0.5 block">
              {allergies}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-100">
            <span className="text-[#555555] block font-medium">Emergency Contact</span>
            <span className="font-bold text-[#212121] text-xs mt-0.5 block">
              {emergencyContact}
            </span>
          </div>
        </div>

        {/* 24x7 Emergency Helplines Strip */}
        <div className="pt-2 border-t border-rose-200/80 mb-3">
          <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider block mb-1.5 flex items-center gap-1">
            <Phone className="w-3 h-3 text-rose-600" />
            24x7 National Helplines (Emergency Dial)
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <a
              href="tel:108"
              className="p-1.5 bg-white rounded-lg border border-rose-200 hover:border-rose-400 hover:bg-rose-50 transition-colors block"
              title="Call 108 Ambulance"
            >
              <span className="font-black text-xs text-rose-700 block">108</span>
              <span className="text-[8px] font-bold text-slate-500 block leading-tight">Ambulance</span>
            </a>
            <a
              href="tel:104"
              className="p-1.5 bg-white rounded-lg border border-rose-200 hover:border-amber-400 hover:bg-amber-50 transition-colors block"
              title="Call 104 Medical Helpline"
            >
              <span className="font-black text-xs text-amber-800 block">104</span>
              <span className="text-[8px] font-bold text-slate-500 block leading-tight">Medical</span>
            </a>
            <a
              href="tel:181"
              className="p-1.5 bg-white rounded-lg border border-rose-200 hover:border-teal-400 hover:bg-teal-50 transition-colors block"
              title="Call 181 Women & Maternal Helpline"
            >
              <span className="font-black text-xs text-teal-800 block">181</span>
              <span className="text-[8px] font-bold text-slate-500 block leading-tight">Women/ANC</span>
            </a>
            <a
              href="tel:1098"
              className="p-1.5 bg-white rounded-lg border border-rose-200 hover:border-blue-400 hover:bg-blue-50 transition-colors block"
              title="Call 1098 Childline"
            >
              <span className="font-black text-xs text-blue-700 block">1098</span>
              <span className="text-[8px] font-bold text-slate-500 block leading-tight">Childline</span>
            </a>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate && onNavigate('emergency')}
        className="w-full py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] active:bg-[#cc7a29] text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <EmergencyShieldIcon className="w-4 h-4" />
        Open Emergency ID
      </button>
    </div>
  );
}

// ─── Section: Medical Records Card ────────────────────────────────────────────

// ─── Section: Medical Records Card ────────────────────────────────────────────

function MedicalRecordsCard({ onNavigate, summary }) {
  const data = summary || MOCK_RECORDS_SUMMARY;

  return (
    <div className="bg-white border-2 border-[#008080]/30 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#008080]/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#008080]" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#008080]">Medical Records & Vault</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5EB] text-[#b35900] border border-[#FF9933]/50">
                {data.recentCount} Verified
              </span>
            </div>
            <p className="text-xs text-[#555555] mt-1">{data.types}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4">
          <div>
            <span className="text-2xl font-extrabold text-[#212121]">
              {data.total}
            </span>
            <span className="text-xs text-[#555555] block font-medium">Total Documents</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-2xl font-extrabold text-[#008080]">
              {data.recentCount}
            </span>
            <span className="text-xs text-[#555555] block font-medium">Available Scans</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate && onNavigate('records')}
        className="w-full py-2.5 bg-[#800000] hover:bg-[#660000] active:bg-[#4d0000] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <BookOpen className="w-4 h-4" />
        View Medical Records
      </button>
    </div>
  );
}

// ─── Section: Vitals Summary Grid ─────────────────────────────────────────────

const VITAL_ITEMS = [
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: Heart,       iconColor: 'text-[#D32F2F]', fallback: '128/82' },
  { key: 'pulse',          label: 'Heart Rate',     unit: 'bpm',  icon: Activity,    iconColor: 'text-[#008080]', fallback: '76' },
  { key: 'oxygen',         label: 'SpO₂ Oxygen',    unit: '%',    icon: Wind,        iconColor: 'text-sky-600',   fallback: '98' },
  { key: 'temperature',    label: 'Temperature',    unit: '°F',   icon: Thermometer, iconColor: 'text-[#FF9933]', fallback: '98.4' },
];

function VitalsSection({ vitals, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!vitals) {
    return (
      <LightCard className="text-center py-6 border-2 border-[#FFC107]/40 bg-[#FFFDF5]">
        <Activity className="w-8 h-8 text-[#FF9933] mx-auto mb-2" aria-hidden="true" />
        <h3 className="text-base font-bold text-[#212121]">No Recent Vitals Logged</h3>
        <p className="text-xs text-[#555555] mt-1 max-w-sm mx-auto">
          Vitals recorded by your ASHA healthcare worker during village checkups will appear here.
        </p>
      </LightCard>
    );
  }

  return (
    <div className="space-y-2">
      {vitals.recorded_at && (
        <p className="text-xs text-[#555555] font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#008080]" aria-hidden="true" />
          Last recorded: {formatDate(vitals.recorded_at)}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {VITAL_ITEMS.map(({ key, label, unit, icon: Icon, iconColor, fallback }) => (
          <div
            key={key}
            className="bg-white border-2 border-[#008080]/30 hover:border-[#008080] rounded-xl p-4 flex flex-col justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[#555555]">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#212121] tabular-nums">
                {vitals[key] ?? fallback}
              </span>
              <span className="text-xs font-medium text-[#555555] ml-1">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Referral Summary Card ───────────────────────────────────────────

function ReferralSummaryCard({ onNavigate, summary }) {
  if (!summary || !summary.latest) {
    return (
      <LightCard className="border-2 border-[#800000]/25 text-center py-6">
        <Handshake className="w-8 h-8 text-[#800000]/60 mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#212121]">No Active Referrals</h3>
        <p className="text-xs text-[#555555] mt-1 max-w-sm mx-auto">
          When an ASHA worker refers you for specialist care at a PHC or hospital, status tracking will appear here.
        </p>
      </LightCard>
    );
  }

  return (
    <LightCard className="border-2 border-[#800000]/25">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#800000]/10 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 text-[#800000]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#800000]">Active Referrals</h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Specialist hospital transfers and doctor connections
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF8E1] text-[#855B00] border border-[#FFC107]">
          {summary.activeCount} Active
        </span>
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#555555]">
          Latest Referral · Status: <span className="text-[#800000] font-extrabold">{summary.latest.status}</span>
        </span>
        <h4 className="text-base font-bold text-[#212121] mt-0.5">{summary.latest.name}</h4>
        <p className="text-xs text-[#555555] mt-0.5">
          Referred to: <strong className="text-[#800000]">{summary.latest.doctor}</strong> ({summary.latest.hospital})
        </p>
      </div>

      <button
        onClick={() => onNavigate && onNavigate('referrals')}
        className="w-full py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Handshake className="w-4 h-4" />
        View All Referrals
      </button>
    </LightCard>
  );
}

// ─── Section: Recent Health Activity ──────────────────────────────────────────

function RecentActivityList({ activities }) {
  const list = activities && activities.length > 0 ? activities : null;

  if (!list) {
    return (
      <div className="text-center py-6">
        <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
        <p className="text-xs text-[#555555] font-medium">No recent care journey activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {list.map((item, idx) => (
        <div key={item.id || idx} className={`flex items-start gap-3.5 py-3.5 ${idx === 0 ? 'pt-0' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-[#008080] shrink-0 mt-1.5 ring-4 ring-[#008080]/15" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#212121] leading-snug">{item.title}</h4>
            <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">{item.description}</p>
            {item.doctor && (
              <p className="text-xs text-[#800000] font-semibold mt-1">
                Care provider: {item.doctor}
              </p>
            )}
          </div>
          <span className="text-xs text-[#555555] font-medium shrink-0 ml-2 mt-0.5">
            {item.date}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main PatientHome Dashboard ───────────────────────────────────────────────

export function PatientHome({ onNavigate }) {
  const { isDemoMode, demoDataEnabled, patientProfile, patientProfileNotFound, patientProfileLoading } = useAuth();
  const { patients, loading: patientsLoading, error: patientsError } = useContext(PatientContext);

  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [vitals, setVitals] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [referralsSummary, setReferralsSummary] = useState(null);
  const [recordsSummary, setRecordsSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAbhaModal, setShowAbhaModal] = useState(false);

  const activePatient = isDemoMode
    ? (patients?.length > 0 ? patients[selectedPatientIndex] : null)
    : (patientProfile || (patients?.length > 0 ? patients[0] : null));

  useEffect(() => {
    if (!activePatient?.id) return;
    let isMounted = true;

    // Immediately clear stale data so old patient info doesn't flash
    setVitals(null);
    setAppointments([]);
    setReferralsSummary(null);
    setRecordsSummary(null);
    setRecentActivity([]);

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const [vitalsResult, apptsResult] = await Promise.allSettled([
          getVitals(activePatient.id),
          getUpcomingAppointments(activePatient.id),
        ]);

        if (!isMounted) return;

        setVitals(
          vitalsResult.status === 'fulfilled' && vitalsResult.value?.length > 0
            ? vitalsResult.value[0]
            : null
        );
        setAppointments(apptsResult.status === 'fulfilled' ? apptsResult.value || [] : []);

        if (!isDemoMode || !demoDataEnabled) {
          // 1. Fetch Referrals Summary
          const { data: refData } = await supabase
            .from('referrals')
            .select('id, destination_hospital, destination_department, doctor_assigned, status, symptoms, created_at')
            .eq('patient_id', activePatient.id)
            .order('created_at', { ascending: false });

          if (!isMounted) return;

          if (refData && refData.length > 0) {
            const activeRefs = refData.filter(r => r.status !== 'Completed');
            const latest = refData[0];
            setReferralsSummary({
              activeCount: activeRefs.length,
              totalCount: refData.length,
              latest: {
                name: `${latest.destination_department || 'Specialist'} Referral`,
                doctor: latest.doctor_assigned || 'On-Duty Specialist',
                hospital: latest.destination_hospital || 'Primary Health Centre',
                status: latest.status,
                date: formatDate(latest.created_at)
              }
            });
          } else {
            setReferralsSummary(null);
          }

          // 2. Fetch Medical Records Summary
          const { data: recData } = await supabase
            .from('medical_records')
            .select('id, title, modality, created_at')
            .eq('patient_id', activePatient.id)
            .order('created_at', { ascending: false });

          if (!isMounted) return;

          if (recData && recData.length > 0) {
            const modalities = Array.from(new Set(recData.map(r => r.modality))).join(' • ');
            setRecordsSummary({
              total: recData.length,
              recentCount: recData.length,
              types: modalities || 'Diagnostic Scans & Reports'
            });
          } else {
            setRecordsSummary({
              total: 0,
              recentCount: 0,
              types: 'No documents uploaded yet'
            });
          }

          // 3. Fetch Recent Health Activity from Timeline
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
          setReferralsSummary(MOCK_REFERRAL_SUMMARY);
          setRecordsSummary(MOCK_RECORDS_SUMMARY);
          setRecentActivity(MOCK_RECENT_ACTIVITY);
        }
      } catch (err) {
        console.error('[RadVault PatientHome] Error loading patient details:', err.message);
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

  // Explicit unlinked profile handling per Phase 3 specifications
  if (!isDemoMode && patientProfileNotFound) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <LightCard className="text-center border-2 border-[#008080]/30 bg-white p-8">
          <div className="w-14 h-14 bg-[#008080]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-[#008080]" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-[#212121] mb-1">Patient Profile Not Linked</h3>
          <p className="text-sm text-[#555555] mb-4 leading-relaxed">
            Your login account is not yet linked to an active patient record in the registry. Please share your Unified ID with your local ASHA healthcare worker or primary health centre to link your account.
          </p>
        </LightCard>
      </div>
    );
  }

  if (patientsError) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <LightCard className="text-center border-2 border-[#D32F2F]/40 bg-[#FFF5F5]">
          <div className="w-12 h-12 bg-[#D32F2F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6 text-[#D32F2F]" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-[#D32F2F] mb-1">Unable to Load Records</h3>
          <p className="text-sm text-[#555555] mb-4">
            We couldn't connect to your health records right now. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#800000] hover:bg-[#660000] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </LightCard>
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <LightCard className="text-center border-2 border-[#008080]/30">
          <div className="w-14 h-14 bg-[#008080]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-[#008080]" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-[#212121] mb-1">No Patient Record Found</h3>
          <p className="text-sm text-[#555555]">
            Your patient profile has not been registered yet. Please connect with your local ASHA worker or clinic.
          </p>
        </LightCard>
      </div>
    );
  }

  const firstName = activePatient.full_name?.split(' ')[0] || 'Patient';

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-5 pb-28 space-y-6">

      {/* ── Multi-patient switcher (when >1) ── */}
      {patients.length > 1 && (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
          <User className="w-4 h-4 text-[#008080] shrink-0" aria-hidden="true" />
          <span className="text-xs text-[#555555] font-semibold mr-auto">Viewing records for:</span>
          <select
            value={selectedPatientIndex}
            onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-[#212121] text-xs font-bold focus:outline-none focus:border-[#008080]"
          >
            {patients.map((p, idx) => (
              <option key={p.id || idx} value={idx}>
                {p.full_name} ({p.unified_id || p.id?.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 1. Header Greeting (Teal text + Saffron warmth) ── */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#008080] tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <span className="text-2xl" role="img" aria-label="waving hand">👋</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="h-1 w-8 bg-[#FF9933] rounded-full" />
          <p className="text-sm sm:text-base text-[#555555] font-medium">
            Your health records and upcoming care, all in one place.
          </p>
        </div>
      </div>

      {/* ── 2. Patient Details Card (Teal border + Maroon name) ── */}
      <section aria-labelledby="patient-card-heading">
        <div className="bg-white border-2 border-[#008080]/35 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#E6F2F2] text-[#008080] border border-[#008080]/30">
              <span className="w-2 h-2 rounded-full bg-[#008080] animate-pulse" aria-hidden="true" />
              Active Health Journey
            </span>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#555555] block">
                Care Network
              </span>
              <span className="text-xs font-extrabold text-[#008080]">
                Rural Health Link Connected
              </span>
            </div>
          </div>

          <h2 id="patient-card-heading" className="text-2xl sm:text-3xl font-extrabold text-[#800000] tracking-tight mb-2">
            {activePatient.full_name}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm sm:text-base text-[#212121] font-semibold mb-4">
            {activePatient.age && <span>{activePatient.age} yrs</span>}
            {activePatient.gender && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>{activePatient.gender}</span>
              </>
            )}
            {activePatient.blood_group && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#D32F2F] font-bold">
                  <Droplet className="w-4 h-4 fill-[#D32F2F]" aria-hidden="true" />
                  Blood Group: {activePatient.blood_group}
                </span>
              </>
            )}
            {(activePatient.phone_number || activePatient.contact) && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#555555] font-medium">
                  <Phone className="w-4 h-4 text-[#008080]" aria-hidden="true" />
                  {activePatient.phone_number || activePatient.contact}
                </span>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                Unified Patient ID
              </span>
              <p className="font-mono font-extrabold text-base text-[#212121] tracking-wide mt-0.5">
                {activePatient.unified_id || 'MH-P-10482'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAbhaModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>View ABHA Card</span>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('profile')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                Full Profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. What Needs Your Attention (Amber / Green + Saffron CTA) ── */}
      <section aria-labelledby="attention-heading">
        <SectionHeader icon={AlertCircle} label="What Needs Your Attention" iconColor="text-[#FF9933]" />
        <AttentionSection
          appointment={appointments[0] || null}
          referral={referralsSummary}
          onNavigate={onNavigate}
        />
      </section>

      {/* ── 4. Upcoming Doctor Appointment ── */}
      <section aria-labelledby="appt-heading">
        <SectionHeader icon={Calendar} label="Upcoming Doctor Appointment" iconColor="text-[#008080]" />
        <AppointmentSection
          appointments={appointments}
          loading={detailsLoading}
          onNavigate={onNavigate}
        />
      </section>

      {/* ── 5 & 6. Emergency ID Card + Medical Records Card (Side-by-side) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section aria-labelledby="emergency-heading" className="flex flex-col">
          <SectionHeader icon={ShieldAlert} label="Emergency ID" iconColor="text-[#D32F2F]" />
          <EmergencyCard onNavigate={onNavigate} patient={activePatient} />
        </section>

        <section aria-labelledby="records-heading" className="flex flex-col">
          <SectionHeader icon={BookOpen} label="Medical Records & Vault" iconColor="text-[#008080]" />
          <MedicalRecordsCard onNavigate={onNavigate} summary={recordsSummary} />
        </section>
      </div>

      {/* ── 7. Government Health Schemes & Benefits Card ── */}
      <section aria-labelledby="schemes-heading" className="flex flex-col">
        <SectionHeader icon={Shield} label="Government Health Schemes & Benefits" iconColor="text-[#FF9933]" />
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-white border-2 border-amber-300/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ayushman Bharat & State Benefits</h3>
                <p className="text-xs text-slate-500 mt-0.5">PM-JAY, Janani Suraksha (JSY), PMSMA, & MJPJAY</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Public Benefits
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
            Financial protection up to ₹5,00,000 for secondary/tertiary hospital procedures, maternal institutional delivery incentives, and nutritional support.
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('schemes')}
            className="w-full py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Available Schemes & Benefits →</span>
          </button>
        </div>
      </section>

      {/* ── 8. Latest Vitals Grid (Teal outline + Amber empty state) ── */}
      <section aria-labelledby="vitals-heading">
        <SectionHeader icon={Activity} label="Latest Vitals Summary" iconColor="text-[#008080]" />
        <VitalsSection vitals={vitals} loading={detailsLoading} />
      </section>

      {/* ── 9. Referral Summary (Handshake icon + Maroon doctor name) ── */}
      <section aria-labelledby="referral-heading">
        <SectionHeader icon={Handshake} label="Specialist Referrals" iconColor="text-[#800000]" />
        <ReferralSummaryCard onNavigate={onNavigate} summary={referralsSummary} />
      </section>

      {/* ── 10. Recent Health Activity (Teal timeline dots + Maroon names) ── */}
      <section aria-labelledby="activity-heading">
        <SectionHeader icon={Clock} label="Recent Health Activity" iconColor="text-[#555555]" />
        <LightCard>
          <RecentActivityList activities={recentActivity} />
        </LightCard>
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
