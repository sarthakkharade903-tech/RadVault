import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { getDocuments } from '../../services/vaultService';
import { Calendar, Loader2, ArrowRight } from 'lucide-react';
import DocumentPreview from './DocumentPreview';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmtDateFull(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtMonthGroup(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase();
}

// â”€â”€â”€ Event category config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ─── Event category config ────────────────────────────────────────────────────
const EVENT_META = {
  visit: {
    label: 'HEALTH READING',
    emoji: '🩺',
    color: 'text-[#008F83]',
    border: 'border-[#008F83]/20',
    bg: 'bg-[#008F83]/5',
  },
  appointment: {
    label: 'HOSPITAL VISIT',
    emoji: '🏥',
    color: 'text-[#16324F]',
    border: 'border-[#16324F]/20',
    bg: 'bg-[#16324F]/5',
  },
  lab_report: {
    label: 'LAB REPORT',
    emoji: '🧪',
    color: 'text-sky-600',
    border: 'border-sky-200',
    bg: 'bg-sky-50',
  },
  prescription: {
    label: 'PRESCRIPTION',
    emoji: '💊',
    color: 'text-amber-600',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
  },
  report: {
    label: 'DOCUMENT',
    emoji: '📄',
    color: 'text-slate-600',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
  },
  emergency: {
    label: 'EMERGENCY',
    emoji: '🚨',
    color: 'text-rose-600',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
  },
};

const STATUS_LABEL = {
  SUBMITTED:    'Submitted',
  PENDING_PHC:  'Pending PHC',
  ACCEPTED:     'Accepted',
  COMPLETED:    'Completed',
};
function TimelineCard({ event, onViewDoc }) {
  const meta = EVENT_META[event.category] || EVENT_META.visit;
  const isDoc = event.category.includes('report') || event.category === 'prescription';

  return (
    <div className={`bg-white rounded-[20px] border ${meta.border} shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden mb-8 relative ml-6`}>
      
      {/* Connector arm linking card to timeline */}
      <div className={`absolute top-[28px] -left-6 w-6 h-[2px] ${meta.bg.replace('bg-', 'bg-').replace('/5', '/20').replace('/50', '/40')}`} />
      
      {/* Geometric background accent */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl ${meta.bg}`} />
      
      <div className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg} border ${meta.border}`}>
              <span className="text-sm leading-none">{meta.emoji}</span>
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
          </div>
          {event.time && <span className="text-[12px] font-bold text-[#94A3B8]">{event.time}</span>}
        </div>

        {/* Title */}
        <h4 className="text-[16px] font-black text-[#16324F] leading-snug mb-1">
          {event.title}
        </h4>

        {/* Subtitle / Details */}
        <p className="text-[13px] text-[#64748B] font-medium leading-relaxed">
          {isDoc ? (
            <>{event.summary} · {event.doctor || 'Self uploaded'}</>
          ) : event.category === 'appointment' ? (
            <>{event.facility || 'Pending'} · Status: {event.raw?.status ? (STATUS_LABEL[event.raw.status] || event.raw.status) : 'Pending'}</>
          ) : (
            <>{event.summary}</>
          )}
        </p>
        
        {/* Referral Reason */}
        {!isDoc && event.raw?.reason && (
           <p className="text-[12px] text-slate-400 mt-2 italic border-l-2 border-slate-100 pl-3">"{event.raw.reason}"</p>
        )}

        {/* Action Button */}
        {isDoc && event.docId && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onViewDoc(event.docId)}
              className="inline-flex items-center gap-1.5 text-[12px] font-black text-[#16324F] hover:text-[#008F83] transition-colors uppercase tracking-wide"
            >
              View document →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Filter chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'visit',       label: 'Vitals' },
  { id: 'appointment', label: 'Care' },
  { id: 'report',      label: 'Documents' },
];

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TimelineWrapper({ member }) {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [vaultDocs, setVaultDocs] = useState([]);

  useEffect(() => {
    if (!member?.id) return;
    setLoading(true);

    async function fetchAll() {
      try {
        const { data: careData } = await supabase.from('care_requests').select('*').eq('patient_id', member.id).order('created_at', { ascending: false });
        const { data: vitalsData } = await supabase.from('vitals').select('*').eq('patient_id', member.id).order('recorded_at', { ascending: false }).limit(20);
        const { data: docData } = await getDocuments(member.id, null);

        const merged = [];

        (careData || []).forEach(cr => {
          const dateObj = new Date(cr.created_at);
          merged.push({
            id:       `cr-${cr.id}`,
            category: 'appointment',
            title:    cr.source === 'ASHA_REFERRED' ? 'ASHA Medical Referral' : 'Care Request',
            summary:  cr.reason || `${cr.department || 'General'} â€” ${cr.facility || 'PHC'}`,
            doctor:   cr.created_by || null,
            facility: cr.facility || null,
            date:     dateObj.toISOString().split('T')[0],
            time:     dateObj.toTimeString().split(' ')[0].substring(0, 5),
            raw:      cr,
          });
        });

        const vitalsByDate = {};
        (vitalsData || []).forEach(v => {
          const dateObj = new Date(v.recorded_at || v.created_at);
          const dateKey = dateObj.toISOString().split('T')[0];
          if (!vitalsByDate[dateKey]) {
            vitalsByDate[dateKey] = {
              id:       `vit-${dateKey}`,
              category: 'visit',
              title:    'Health Vitals Recorded',
              metrics:  [],
              doctor:   v.recorded_by || 'ASHA Worker',
              facility: 'Home Visit',
              date:     dateKey,
              time:     dateObj.toTimeString().split(' ')[0].substring(0, 5),
              raw:      v,
            };
          }
          const label = { blood_pressure: 'BP', weight_kg: 'Weight', temperature_f: 'Temp', spo2: 'SpOâ‚‚' }[v.metric_name] || v.metric_name;
          const unit = { blood_pressure: 'mmHg', weight_kg: 'kg', temperature_f: 'Â°F', spo2: '%' }[v.metric_name] || '';
          vitalsByDate[dateKey].metrics.push(`${label}: ${v.metric_value}${unit}`);
        });

        Object.values(vitalsByDate).forEach(v => {
          v.summary = v.metrics.join('  Â·  ');
          merged.push(v);
        });

        (docData || []).forEach(doc => {
          let cat = 'report';
          if (doc.category === 'Lab Reports') cat = 'lab_report';
          if (doc.category === 'Prescriptions') cat = 'prescription';
          
          const dateObj = new Date(doc.created_at);
          merged.push({
            id:       `doc-${doc.id}`,
            category: cat,
            title:    doc.title || doc.file_name,
            summary:  doc.category,
            doctor:   doc.source || 'Self uploaded',
            facility: null,
            date:     dateObj.toISOString().split('T')[0],
            time:     dateObj.toTimeString().split(' ')[0].substring(0, 5),
            docId:    doc.id,
            raw:      doc,
          });
        });

        setVaultDocs(docData || []);
        
        // sort by date desc, then time desc
        merged.sort((a, b) => {
          const dateCmp = new Date(b.date) - new Date(a.date);
          if (dateCmp !== 0) return dateCmp;
          return b.time.localeCompare(a.time);
        });
        
        setEvents(merged);
      } catch (err) {
        console.error('Timeline fetch error', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [member?.id]);

  const filtered = useMemo(() =>
    events.filter(e => filter === 'all' || e.category === filter || (filter === 'report' && (e.category === 'lab_report' || e.category === 'prescription'))),
    [events, filter]
  );

  const grouped = useMemo(() => {
    const months = {};
    filtered.forEach(e => {
      const monthKey = fmtMonthGroup(e.date);
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(e);
    });
    return Object.entries(months).map(([month, monthEvents]) => ({
      month,
      events: monthEvents,
    }));
  }, [filtered]);

  const totalEvents  = events.length;
  const docCount     = events.filter(e => e.category.includes('report') || e.category === 'prescription').length;
  const lastDate     = events.length ? fmtDateFull(events[0].date) : null;

  const handleViewDoc = (docId) => {
    const doc = vaultDocs.find(d => d.id === docId);
    if (doc) setPreviewDoc(doc);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#008F83]" />
        <p className="text-[13px] font-bold">Building your health timelineâ€¦</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FCFBF8] pb-32 pt-2">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* â”€â”€ Page Header â”€â”€ */}
        <div className="pt-4 pb-6">
          <h2 className="text-[20px] font-black text-[#16324F] tracking-tight">HEALTH TIMELINE</h2>
          <p className="text-[13px] font-medium text-[#64748B] mt-1">{member?.name}'s connected health journey</p>

          {/* Summary boxes (matching user template) */}
          {totalEvents > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {lastDate && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Activity</p>
                  <p className="text-[11px] font-black text-[#16324F] mt-1">{lastDate}</p>
                </div>
              )}
              {totalEvents > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Records</p>
                  <p className="text-[16px] font-black text-[#16324F] mt-0.5">{totalEvents}</p>
                </div>
              )}
              {docCount > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documents</p>
                  <p className="text-[16px] font-black text-[#16324F] mt-0.5">{docCount}</p>
                </div>
              )}
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide pb-2">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                  filter === f.id
                    ? 'bg-[#16324F] text-white shadow-md'
                    : 'bg-white text-[#64748B] border border-slate-200 hover:border-slate-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ Empty State â”€â”€ */}
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-5">
              <Calendar className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[16px] font-black text-[#16324F] mb-2">
              {filter === 'all' ? 'Your health journey starts here' : `No ${FILTERS.find(f=>f.id===filter)?.label?.toLowerCase()} events yet`}
            </p>
            <p className="text-[13px] text-[#64748B] font-medium max-w-[240px] leading-relaxed mx-auto">
              Visits, vitals, referrals and medical documents will appear here as they are recorded.
            </p>
          </div>
        )}

        {/* â”€â”€ Grouped Timeline â”€â”€ */}
        <div className="pt-2">
          {grouped.map(({ month, events: monthEvents }) => (
            <div key={month} className="mb-10">
              {/* Month Header */}
              <div className="flex items-center justify-center mb-8">
                <p className="text-[12px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">{month}</p>
              </div>

              {/* Timeline Track container */}
              <div className="relative pl-6">
                {/* Vertical continuous line */}
                <div className="absolute top-2 bottom-0 left-[27px] w-[2px] bg-slate-200" />
                
                <div className="space-y-0">
                  {monthEvents.map((evt, idx) => (
                    <div key={evt.id} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute top-[21px] -left-2 w-4 h-4 rounded-full bg-white border-[3px] border-[#16324F] z-10 shadow-sm" />
                      
                      <TimelineCard event={evt} onViewDoc={handleViewDoc} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Document preview modal */}
      {previewDoc && (
        <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}