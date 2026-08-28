import React, { useState, useMemo } from "react";
import { Activity, Stethoscope, FlaskConical, FileText, Calendar, ChevronDown, ChevronUp, Building2, User } from "lucide-react";

const CATEGORIES = [
  { id: "all",          label: "All",        emoji: null },
  { id: "visit",        label: "Visits",     emoji: null },
  { id: "appointment",  label: "Care",       emoji: null },
  { id: "report",       label: "Documents",  emoji: null },
];

function getCategoryStyle(category) {
  switch (category) {
    case "visit":        return { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400", icon: "👩‍⚕️", text: "text-emerald-700" };
    case "appointment":  return { bg: "bg-sky-50",     border: "border-sky-200",     dot: "bg-sky-400",     icon: "🏥", text: "text-sky-700" };
    case "report":       return { bg: "bg-violet-50",  border: "border-violet-200",  dot: "bg-violet-400",  icon: "🧪", text: "text-violet-700" };
    default:             return { bg: "bg-slate-50",   border: "border-slate-200",   dot: "bg-slate-400",   icon: "📌", text: "text-slate-600" };
  }
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(timeStr) {
  if (!timeStr) return "";
  return timeStr.substring(0, 5);
}

function TimelineEventCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const style = getCategoryStyle(event.category);

  return (
    <div className={`bg-white rounded-2xl border ${style.border} shadow-sm overflow-hidden`}>
      {/* Category Tag */}
      <div className={`${style.bg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{style.icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
            {event.category === "visit" ? "Health Reading" :
             event.category === "appointment" ? "Care / Referral" :
             event.category === "report" ? "Medical Record" : "Event"}
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{fmtTime(event.time)}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <h4 className="text-[13px] font-black text-[#16324F] leading-tight mb-1">{event.title}</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">{event.summary}</p>

        {/* Source row */}
        <div className="flex items-center gap-3 mt-2.5">
          {event.facility && event.facility !== "Home Visit" && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400">{event.facility}</span>
            </div>
          )}
          {event.doctor && event.doctor !== "Unknown" && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400">{event.doctor}</span>
            </div>
          )}
        </div>

        {/* Referral status if applicable */}
        {event.raw?.status && event.category === "appointment" && (
          <div className="mt-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
              event.raw.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" :
              event.raw.status === "COMPLETED" ? "bg-teal-50 text-teal-700" :
              "bg-amber-50 text-amber-700"
            }`}>
              {event.raw.status === "SUBMITTED" ? "Submitted" :
               event.raw.status === "PENDING_PHC" ? "Pending PHC" :
               event.raw.status === "ACCEPTED" ? "Appointment Set" :
               event.raw.status === "COMPLETED" ? "Completed" : event.raw.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(events) {
  const map = {};
  events.forEach(evt => {
    const key = evt.date || "Unknown";
    if (!map[key]) map[key] = [];
    map[key].push(evt);
  });
  return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

export default function HealthTimeline({ events = [], member }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() =>
    events.filter(e => activeCategory === "all" || e.category === activeCategory),
    [events, activeCategory]
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="space-y-1">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              activeCategory === cat.id
                ? "bg-[#16324F] text-white border-[#16324F]"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-slate-300"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {grouped.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-black text-[#16324F]">No events yet</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
            Your health journey will be recorded here — vitals, visits, referrals and documents.
          </p>
        </div>
      )}

      {/* Grouped Timeline */}
      <div className="space-y-6 pt-2">
        {grouped.map(([date, dateEvents]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#008F83] shrink-0" />
              <p className="text-[11px] font-black text-[#16324F] uppercase tracking-widest">
                {fmtDate(date)}
              </p>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-400">{dateEvents.length} event{dateEvents.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Events for this date */}
            <div className="space-y-2 pl-4 border-l-2 border-slate-100 ml-1">
              {dateEvents.map(evt => (
                <TimelineEventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
