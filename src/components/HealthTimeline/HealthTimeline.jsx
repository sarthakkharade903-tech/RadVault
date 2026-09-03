import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Building2,
  User,
  Eye
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Events' },
  { id: 'visit', label: 'Vitals & Screenings' },
  { id: 'appointment', label: 'Care & Referrals' },
  { id: 'report', label: 'Medical Documents' },
];

function getCategoryStyle(category) {
  switch (category) {
    case 'visit':
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: '👩‍⚕️', text: 'text-emerald-800' };
    case 'appointment':
      return { bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500', icon: '🏥', text: 'text-sky-800' };
    case 'report':
      return { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', icon: '📄', text: 'text-violet-800' };
    default:
      return { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', icon: '📌', text: 'text-slate-700' };
  }
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TimelineEventCard({ event, onViewRecord }) {
  const style = getCategoryStyle(event.category);

  return (
    <div className={`bg-white rounded-2xl border-2 ${style.border} shadow-2xs hover:shadow-xs transition-all overflow-hidden space-y-2`}>
      {/* Category Tag Header */}
      <div className={`${style.bg} px-4 py-2 flex items-center justify-between border-b ${style.border}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{style.icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${style.text}`}>
            {event.category === 'visit'
              ? 'ASHA Field Screening'
              : event.category === 'appointment'
              ? 'Referral & Care'
              : event.category === 'report'
              ? 'Medical Record / Scan'
              : 'Healthcare Event'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400">{event.time || ''}</span>
      </div>

      {/* Body */}
      <div className="p-4 pt-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-black text-slate-900 leading-tight">
            {event.title}
          </h4>
          {event.recordId && onViewRecord && (
            <button
              type="button"
              onClick={() => onViewRecord(event.recordId)}
              className="text-[10px] font-bold text-[#008080] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <Eye className="w-3 h-3" /> View Record
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {event.summary}
        </p>

        {/* Source metadata */}
        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-semibold flex-wrap">
          {event.facility && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.facility}</span>
            </div>
          )}
          {event.doctor && (
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.doctor}</span>
            </div>
          )}
        </div>

        {/* Status / Priority Tag if present */}
        {event.priority && (
          <div className="pt-1">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
              event.priority === 'HIGH' || event.priority === 'RED'
                ? 'bg-rose-100 text-rose-800'
                : event.priority === 'ORANGE'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {event.priorityLabel || event.priority}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(events) {
  const map = {};
  events.forEach((evt) => {
    const key = evt.date || (evt.created_at ? new Date(evt.created_at).toISOString().slice(0, 10) : 'Recent');
    if (!map[key]) map[key] = [];
    map[key].push(evt);
  });
  return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

export default function HealthTimeline({ events = [], onViewRecord = null }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (activeCategory === 'all') return true;
      return e.category === activeCategory;
    });
  }, [events, activeCategory]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#008080]" />
            <span>Longitudinal Health Timeline</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            Chronological continuum of field screenings, triage, hospital referrals & diagnostic records
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#008080] text-white border-[#008080] shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty State ── */}
      {grouped.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-black text-slate-900">No Timeline Events Recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            Your healthcare journey will be continuously documented here as ASHA screenings, vitals, prescriptions, and doctor consultations take place.
          </p>
        </div>
      )}

      {/* ── Grouped Timeline Stream ── */}
      <div className="space-y-6">
        {grouped.map(([date, dateEvents]) => (
          <div key={date}>
            {/* Date Milestone Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#008080] ring-4 ring-teal-100 shrink-0" />
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
                {fmtDate(date)}
              </p>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">
                {dateEvents.length} {dateEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {/* Date Cards */}
            <div className="space-y-3 pl-4 sm:pl-6 border-l-2 border-slate-200 ml-1">
              {dateEvents.map((evt) => (
                <TimelineEventCard
                  key={evt.id}
                  event={evt}
                  onViewRecord={onViewRecord}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
