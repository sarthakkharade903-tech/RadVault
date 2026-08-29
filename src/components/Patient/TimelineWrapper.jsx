import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { getDocuments } from '../../services/vaultService';
import { Calendar, Loader2, ArrowRight, Activity, FileText, Building2, Pill, FlaskConical, Shield, Sparkles } from 'lucide-react';
import DocumentPreview from './DocumentPreview';

// ─── Helpers ─────────────────────────────────────────────────────────────
function fmtDateShort(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
}
function fmtMonthGroup(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase();
}

// ─── Event category config ────────────────────────────────────────────────
const EVENT_META = {
  visit: {
    label: 'HEALTH READING',
    Icon: Activity,
    color: 'text-amber-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    dotRing: 'border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    cornerShape: 'bg-gradient-to-tl from-amber-100/50 to-transparent',
  },
  appointment: {
    label: 'HOSPITAL VISIT',
    Icon: Building2,
    color: 'text-amber-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    dotRing: 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    cornerShape: 'bg-gradient-to-tl from-amber-200/40 to-transparent border-t border-l border-amber-100/50 rounded-tl-full',
  },
  lab_report: {
    label: 'LAB REPORT',
    Icon: FlaskConical,
    color: 'text-sky-500',
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    dotRing: 'border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    cornerShape: 'bg-gradient-to-tl from-sky-200/40 to-transparent border-t border-l border-sky-100/50 rounded-tl-full',
  },
  prescription: {
    label: 'PRESCRIPTION',
    Icon: Pill,
    color: 'text-orange-500',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    dotRing: 'border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.6)]',
    cornerShape: 'bg-gradient-to-tl from-orange-200/40 to-transparent border-t border-l border-orange-100/50 rounded-tl-full',
  },
  report: {
    label: 'DOCUMENT',
    Icon: FileText,
    color: 'text-amber-600',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    dotRing: 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    cornerShape: 'bg-gradient-to-tl from-amber-200/30 to-transparent border-t border-l border-amber-100/50 rounded-tl-[100px]',
  },
  emergency: {
    label: 'EMERGENCY',
    Icon: Activity,
    color: 'text-rose-500',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    dotRing: 'border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    cornerShape: 'bg-gradient-to-tl from-rose-200/40 to-transparent border-t border-l border-rose-100/50 rounded-tl-full',
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
  const isDoc = event.category.includes('report') || event.category === 'prescription' || event.category === 'report';

  return (
    <div className={`bg-white rounded-[24px] border border-amber-100/60 shadow-[0_8px_30px_-12px_rgba(251,191,36,0.15)] hover:shadow-[0_12px_40px_-12px_rgba(251,191,36,0.3)] transition-all duration-500 overflow-hidden mb-6 relative group flex-1`}>
      
      {/* Decorative inner background shape (corner) */}
      <div className={`absolute -right-2 -bottom-2 w-32 h-32 ${meta.cornerShape} opacity-80 group-hover:scale-110 transition-transform duration-700 pointer-events-none`} />
      
      {/* Connector line drawing back to the spine */}
      <div className="hidden sm:block absolute top-[44px] -left-6 w-6 h-[2px] bg-gradient-to-r from-amber-200/0 to-amber-200" />
      
      <div className="p-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <meta.Icon className={`w-4 h-4 ${meta.color}`} />
            <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${meta.color}`}>{meta.label}</span>
          </div>
          
          <div className="sm:hidden text-[11px] font-bold text-[#94A3B8]">
            {fmtDateShort(event.date)} · {event.time}
          </div>
          <div className="hidden sm:block text-[12px] font-bold text-[#94A3B8]">
            {event.time}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-[17px] font-black text-[#16324F] leading-tight mb-1.5">
          {event.title}
        </h4>

        {/* Subtitle / Details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[13px] text-[#64748B] font-medium leading-relaxed">
          <span>{event.facility || event.doctor || (isDoc ? 'Self uploaded' : 'General')}</span>
          
          {event.category === 'appointment' && event.raw?.status && (
             <>
               <span className="hidden sm:inline text-slate-300">•</span>
               <span>Status: <strong className={event.raw.status === 'ACCEPTED' ? 'text-emerald-600 font-bold' : 'text-[#16324F] font-bold'}>{STATUS_LABEL[event.raw.status] || event.raw.status}</strong></span>
             </>
          )}
        </div>
        
        {/* Referral Reason */}
        {!isDoc && event.raw?.reason && (
           <p className="text-[12px] text-[#94A3B8] mt-2 italic">"{event.raw.reason}"</p>
        )}

        {/* Action Button & Status Strip */}
        <div className="mt-5 flex items-center justify-between">
           <div>
             {event.category === 'appointment' && event.raw?.status === 'ACCEPTED' && (
               <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                 ACCEPTED
               </span>
             )}
           </div>
           
           {isDoc && event.docId && (
             <button
               onClick={() => onViewDoc(event.docId)}
               className={`inline-flex items-center gap-1.5 text-[11px] font-black ${meta.color} hover:opacity-80 transition-opacity uppercase tracking-widest group/btn`}
             >
               View document <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
             </button>
           )}
        </div>
      </div>
    </div>
  );
}

const FILTERS = [
  { id: 'all',         label: 'All', Icon: null },
  { id: 'visit',       label: 'Vitals', Icon: Activity },
  { id: 'appointment', label: 'Care', Icon: Shield },
  { id: 'report',      label: 'Documents', Icon: FileText },
];

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
            summary:  cr.reason || `${cr.department || 'General'} — ${cr.facility || 'PHC'}`,
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
          const label = { blood_pressure: 'BP', weight_kg: 'Weight', temperature_f: 'Temp', spo2: 'SpO₂' }[v.metric_name] || v.metric_name;
          const unit = { blood_pressure: 'mmHg', weight_kg: 'kg', temperature_f: '°F', spo2: '%' }[v.metric_name] || '';
          vitalsByDate[dateKey].metrics.push(`${label}: ${v.metric_value}${unit}`);
        });

        Object.values(vitalsByDate).forEach(v => {
          v.summary = v.metrics.join('  ·  ');
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
    events.filter(e => filter === 'all' || e.category === filter || (filter === 'report' && (e.category === 'lab_report' || e.category === 'prescription' || e.category === 'report'))),
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
  const lastDate     = events.length ? fmtDateShort(events[0].date) : null;
  const lastYear     = events.length ? events[0].date.substring(0,4) : null;

  const handleViewDoc = (docId) => {
    const doc = vaultDocs.find(d => d.id === docId);
    if (doc) setPreviewDoc(doc);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-5 bg-[#FCFAF5]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-[13px] font-black text-amber-700 tracking-widest uppercase">Building your health timeline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FCFAF5] pb-40 relative overflow-hidden font-sans">
      
      {/* ── Abstract Background Art ── */}
      {/* Saffron Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-gradient-radial from-amber-200/20 to-transparent blur-[80px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-gradient-radial from-orange-200/10 to-transparent blur-[60px] pointer-events-none" />
      
      {/* Curved Waves / Golden Arcs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 left-[-20%] w-[140%] h-[800px]">
          <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="url(#goldGrad)" strokeWidth="0.2" />
          <path d="M0,60 Q25,40 50,60 T100,60" fill="none" stroke="url(#goldGrad)" strokeWidth="0.1" />
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Mandala Motif (Top Right) */}
      <div className="absolute top-10 right-10 opacity-[0.06] pointer-events-none">
        <svg width="400" height="400" viewBox="0 0 100 100">
           <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="0.5" />
           <circle cx="50" cy="50" r="35" fill="none" stroke="#F59E0B" strokeWidth="0.2" strokeDasharray="2,2" />
           {/* Petals */}
           {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
             <path key={angle} d="M50 50 Q 60 20 50 10 Q 40 20 50 50" fill="none" stroke="#F59E0B" strokeWidth="0.3" transform={`rotate(${angle} 50 50)`} />
           ))}
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10 pt-10">
        
        {/* ── Page Header ── */}
        <div className="pt-2 pb-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-amber-500" />
            <h2 className="text-[28px] font-black text-[#16324F] tracking-tight uppercase">HEALTH TIMELINE</h2>
          </div>
          <p className="text-[14px] font-medium text-[#64748B]">{member?.name}'s connected health journey</p>

          {/* Stat Cards */}
          {totalEvents > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              
              <div className="bg-white/80 backdrop-blur-md border border-amber-100/50 rounded-[20px] p-5 flex flex-col items-start min-w-[160px] shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] hover:shadow-[0_12px_32px_-8px_rgba(251,191,36,0.25)] transition-shadow relative overflow-hidden group">
                <Sparkles className="absolute top-3 right-3 w-3 h-3 text-amber-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-amber-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Last Activity</p>
                <p className="text-[15px] font-black text-[#16324F]">{lastDate} {lastYear}</p>
                <p className="text-[10px] text-slate-400 mt-1">Most recent event</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-md border border-amber-100/50 rounded-[20px] p-5 flex flex-col items-start min-w-[160px] shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] hover:shadow-[0_12px_32px_-8px_rgba(251,191,36,0.25)] transition-shadow relative overflow-hidden group">
                <Sparkles className="absolute top-3 right-3 w-3 h-3 text-amber-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-amber-600">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Records</p>
                <p className="text-[20px] font-black text-[#16324F] leading-none">{totalEvents}</p>
                <p className="text-[10px] text-slate-400 mt-1">Total records</p>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-amber-100/50 rounded-[20px] p-5 flex flex-col items-start min-w-[160px] shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] hover:shadow-[0_12px_32px_-8px_rgba(251,191,36,0.25)] transition-shadow relative overflow-hidden group">
                <Sparkles className="absolute top-3 right-3 w-3 h-3 text-amber-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-amber-600">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Documents</p>
                <p className="text-[20px] font-black text-[#16324F] leading-none">{docCount}</p>
                <p className="text-[10px] text-slate-400 mt-1">Total documents</p>
              </div>

            </div>
          )}

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-10 p-2 bg-white/40 backdrop-blur-sm rounded-full border border-slate-100/50 shadow-sm">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-black tracking-widest uppercase transition-all duration-300 ${
                  filter === f.id
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#16324F] shadow-lg shadow-amber-300/40'
                    : 'bg-transparent text-[#64748B] hover:bg-white/60 hover:text-amber-600'
                }`}>
                {f.Icon && <f.Icon className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty State ── */}
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-[18px] font-black text-[#16324F] mb-2">
              {filter === 'all' ? 'Your health journey starts here' : `No ${FILTERS.find(f=>f.id===filter)?.label?.toLowerCase()} events yet`}
            </p>
            <p className="text-[14px] text-[#64748B] font-medium max-w-sm leading-relaxed mx-auto">
              Visits, vitals, referrals and medical documents will appear here sequentially.
            </p>
          </div>
        )}

        {/* ── Grouped Timeline ── */}
        <div className="pt-6 max-w-3xl mx-auto">
          {grouped.map(({ month, events: monthEvents }, gIdx) => (
            <div key={month} className="mb-14">
              
              {/* Month Header */}
              <div className="flex items-center justify-center gap-4 mb-10">
                <div className="h-[1px] flex-1 bg-gradient-to-l from-amber-200 to-transparent" />
                <div className="w-1.5 h-1.5 rotate-45 bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <p className="text-[13px] font-black text-[#16324F] uppercase tracking-[0.25em]">{month}</p>
                <div className="w-1.5 h-1.5 rotate-45 bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
              </div>

              {/* Timeline Track container */}
              <div className="relative">
                {/* Vertical continuous spine */}
                <div className="hidden sm:block absolute top-4 bottom-0 left-[85px] w-[2px] bg-gradient-to-b from-amber-200/80 via-amber-300/60 to-amber-200/20 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                
                <div className="space-y-6 sm:space-y-0 relative">
                  {monthEvents.map((evt) => {
                    const meta = EVENT_META[evt.category] || EVENT_META.visit;
                    return (
                    <div key={evt.id} className="relative sm:flex sm:items-start sm:gap-14 mb-8">
                      
                      {/* Desktop Date Section (Left of spine) */}
                      <div className="hidden sm:flex flex-col items-end pt-3 w-16 shrink-0 relative z-10">
                        <span className="text-[13px] font-black text-[#16324F] uppercase tracking-wider">{fmtDateShort(evt.date)}</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-0.5">{evt.time}</span>
                      </div>

                      {/* Timeline Dot with layered rings */}
                      <div className={`hidden sm:flex absolute top-[36px] left-[78px] w-4 h-4 rounded-full bg-white border-[3px] z-10 items-center justify-center ${meta.dotRing}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${meta.bg.replace('bg-', 'bg-').replace('-50', '-400')}`} />
                      </div>
                      
                      {/* The Card */}
                      <TimelineCard event={evt} onViewDoc={handleViewDoc} />
                    </div>
                  )})}
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