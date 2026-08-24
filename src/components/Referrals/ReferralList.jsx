import React from 'react';
import {
  Building2,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Handshake,
  Stethoscope,
} from 'lucide-react';

// ─── Priority Config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  RED: {
    label: 'Emergency',
    badgeBg: 'bg-[#D32F2F]',
    badgeText: 'text-white',
    cardBorder: 'border-[#D32F2F]/50',
    cardBg: 'bg-[#FFF5F5]',
    dot: 'bg-[#D32F2F]',
    emoji: '🔴',
  },
  ORANGE: {
    label: 'Urgent',
    badgeBg: 'bg-[#FF9933]',
    badgeText: 'text-slate-900',
    cardBorder: 'border-[#FF9933]/60',
    cardBg: 'bg-[#FFFDF5]',
    dot: 'bg-[#FF9933]',
    emoji: '🟡',
  },
  GREEN: {
    label: 'Routine',
    badgeBg: 'bg-[#2E7D32]',
    badgeText: 'text-white',
    cardBorder: 'border-[#2E7D32]/40',
    cardBg: 'bg-[#F1F8F1]',
    dot: 'bg-[#2E7D32]',
    emoji: '🟢',
  },
};

const STATUS_CONFIG = {
  Pending: { icon: Clock, color: 'text-[#FF9933]', bg: 'bg-[#FFF5EB]' },
  Accepted: { icon: CheckCircle2, color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
  Completed: { icon: CheckCircle2, color: 'text-[#008080]', bg: 'bg-[#E6F2F2]' },
};

// ─── Single Referral Card ─────────────────────────────────────────────────────

function ReferralCard({ referral }) {
  const priority = PRIORITY_CONFIG[referral.priority] || PRIORITY_CONFIG.GREEN;
  const statusConf = STATUS_CONFIG[referral.status] || STATUS_CONFIG.Pending;
  const StatusIcon = statusConf.icon;

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow ${priority.cardBorder} ${priority.cardBg}`}
    >
      {/* Top Row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full ${priority.badgeBg} ${priority.badgeText}`}
          >
            {priority.emoji} {priority.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusConf.bg} ${statusConf.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {referral.status}
          </span>
        </div>
        <span className="text-[11px] text-[#555555] font-medium">{referral.createdAt}</span>
      </div>

      {/* Patient Info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#008080]/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-[#008080]" />
        </div>
        <div>
          <p className="font-extrabold text-[#800000] text-base leading-tight">{referral.patientName}</p>
          <p className="text-[11px] text-[#555555] font-medium font-mono">{referral.patientId}</p>
        </div>
      </div>

      {/* Hospital & Department */}
      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-200/80">
        <div className="flex items-center gap-2 text-xs text-[#555555]">
          <Building2 className="w-3.5 h-3.5 text-[#008080] shrink-0" />
          <span className="font-semibold">{referral.hospital}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555555]">
          <Stethoscope className="w-3.5 h-3.5 text-[#800000] shrink-0" />
          <span className="font-semibold">{referral.department} — {referral.doctor}</span>
        </div>
      </div>

      {/* AI Note */}
      {referral.aiNote && (
        <div className="mt-3 p-2.5 bg-white/80 border border-slate-200 rounded-xl">
          <p className="text-[11px] text-[#555555] leading-relaxed">
            <span className="font-bold text-[#008080]">✨ AI Triage Note: </span>
            {referral.aiNote}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ referrals }) {
  const counts = { RED: 0, ORANGE: 0, GREEN: 0 };
  referrals.forEach((r) => counts[r.priority]++);

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {[
        { key: 'RED', label: 'Emergency', emoji: '🔴', color: 'text-[#D32F2F]', border: 'border-[#D32F2F]/30', bg: 'bg-[#FFF5F5]' },
        { key: 'ORANGE', label: 'Urgent', emoji: '🟡', color: 'text-[#FF9933]', border: 'border-[#FF9933]/40', bg: 'bg-[#FFFDF5]' },
        { key: 'GREEN', label: 'Routine', emoji: '🟢', color: 'text-[#2E7D32]', border: 'border-[#2E7D32]/30', bg: 'bg-[#F1F8F1]' },
      ].map(({ key, label, emoji, color, border, bg }) => (
        <div key={key} className={`rounded-xl border-2 p-3 text-center ${border} ${bg}`}>
          <p className={`text-2xl font-extrabold ${color}`}>{counts[key]}</p>
          <p className="text-[10px] text-[#555555] font-bold mt-0.5">{emoji} {label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main ReferralList Component ──────────────────────────────────────────────

export default function ReferralList({ referrals, onCreateNew, onBack }) {
  const pendingCount = referrals.filter((r) => r.status === 'Pending').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-[#008080] flex items-center gap-2">
            <Handshake className="w-6 h-6" />
            Specialist Referrals
          </h2>
          <p className="text-sm text-[#555555] mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} referral${pendingCount > 1 ? 's' : ''} awaiting response`
              : 'All referrals are up to date'}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-[#555555] hover:text-[#212121] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          ← Home
        </button>
      </div>

      {/* Stats */}
      <StatsBar referrals={referrals} />

      {/* Create New Button */}
      <button
        onClick={onCreateNew}
        className="w-full mb-5 py-3.5 bg-[#008080] hover:bg-[#006666] active:bg-[#005555] text-white font-extrabold rounded-2xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create New Referral (ASHA Triage)
      </button>

      {/* Empty State */}
      {referrals.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
          <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#212121] mb-1">No Referrals Yet</h3>
          <p className="text-sm text-[#555555]">Create your first ASHA triage referral above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#555555] uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#FF9933]" />
            All Referrals ({referrals.length})
          </h3>
          {referrals.map((referral) => (
            <ReferralCard key={referral.id} referral={referral} />
          ))}
        </div>
      )}
    </div>
  );
}
