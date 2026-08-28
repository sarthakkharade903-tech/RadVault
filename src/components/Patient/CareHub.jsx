import React, { useState, useEffect } from "react";
import {
  Stethoscope, Plus, X, AlertTriangle, Send, Clock, CheckCircle2, CheckCheck, 
  Calendar, Building2, HeartPulse, Baby, User, Loader2, History, MapPin
} from "lucide-react";
import { getCareRequests, createCareRequest } from "../../services/ashaService";
import { fetchGovHospitals, getCurrentLocation } from '../../services/locationService';

const STEPS = [
  { key: "SUBMITTED",   label: "Submitted",         Icon: Send },
  { key: "PENDING_PHC", label: "Pending PHC",        Icon: Clock },
  { key: "ACCEPTED",    label: "Appointment Set",    Icon: CheckCircle2 },
  { key: "COMPLETED",   label: "Visited",            Icon: CheckCheck },
];

const STATUS_IDX = { SUBMITTED: 0, PENDING_PHC: 1, ACCEPTED: 2, COMPLETED: 3 };

const DEPARTMENTS = [
  "General Medicine",
  "Maternal & Child",
  "Cardiology",
  "Pediatrics",
  "Orthopaedics",
  "Eye / ENT",
];

const SLOTS = ["Morning (9 AM - 12 PM)", "Afternoon (1 PM - 4 PM)"];

const PRIORITY_COLOR = {
  URGENT:  "bg-red-50 text-red-700 border-red-200",
  HIGH:    "bg-orange-50 text-orange-700 border-orange-200",
  ROUTINE: "bg-slate-50 text-slate-600 border-slate-200",
};

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ReferralCard({ req }) {
  const stepIdx = STATUS_IDX[req.status] ?? 0;
  const isActive = req.status !== "COMPLETED";
  const priorityBg = PRIORITY_COLOR[req.priority] || PRIORITY_COLOR.ROUTINE;

  return (
    <div className={`bg-white rounded-2xl border ${isActive ? "border-[#008F83]/30 shadow-md" : "border-slate-100 shadow-sm"} overflow-hidden`}>
      <div className={`px-4 pt-4 pb-3 ${isActive ? "border-b border-slate-100" : ""}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-[13px] font-black text-[#16324F] leading-tight">{req.facility || "PHC"}</p>
            <p className="text-[11px] font-bold text-[#64748B] mt-0.5">{req.department || "General"}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityBg}`}>
              {req.priority || "ROUTINE"}
            </span>
            <span className="text-[9px] font-bold text-[#94A3B8] uppercase">
              {req.source === "ASHA_REFERRED" ? "ASHA Referral" : "Self-Booked"}
            </span>
          </div>
        </div>
        {req.reason && <p className="text-[10px] text-slate-500 mt-1 leading-relaxed italic">"{req.reason}"</p>}
        {req.created_by && <p className="text-[10px] text-[#008F83] font-bold mt-1">By: {req.created_by}</p>}
      </div>

      <div className="px-4 py-4">
        <div className="flex items-start gap-0">
          {STEPS.map((step, i) => {
            const done = i < stepIdx;
            const current = i === stepIdx;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-0.5 ${i === 0 ? "invisible" : done || current ? "bg-[#008F83]" : "bg-slate-200"}`} />
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    done ? "bg-[#008F83] border-[#008F83]" :
                    current ? "bg-white border-[#008F83] shadow-[0_0_0_3px_rgba(0,143,131,0.15)]" :
                    "bg-white border-slate-200"
                  }`}>
                    <step.Icon className={`w-3.5 h-3.5 ${done ? "text-white" : current ? "text-[#008F83]" : "text-slate-300"}`} strokeWidth={2.5} />
                  </div>
                  <div className={`flex-1 h-0.5 ${isLast ? "invisible" : done ? "bg-[#008F83]" : "bg-slate-200"}`} />
                </div>
                <p className={`text-[9px] font-bold text-center mt-1 leading-tight max-w-[56px] ${current ? "text-[#008F83]" : "text-slate-400"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PastCareCard({ req }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-[#16324F]">{req.facility}</h4>
        <p className="text-[10px] font-semibold text-[#64748B] mt-0.5">{req.department}  {fmtDate(req.created_at)}</p>
        {req.reason && <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">"{req.reason}"</p>}
      </div>
      <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
    </div>
  );
}

function BookAppointmentModal({ member, onClose, onSaved }) {
  const [facility, setFacility] = useState("");
  const [dept, setDept] = useState("");
  const [slot, setSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [govFacilities, setGovFacilities] = useState([]);
  const [fetchingGPS, setFetchingGPS] = useState(true);

  useEffect(() => {
    const getHospitals = async () => {
      setFetchingGPS(true);
      try {
        const { lat, lon } = await getCurrentLocation();
        const results = await fetchGovHospitals(lat, lon);
        setGovFacilities(results);
      } catch (err) {
        console.warn("GPS failed, using Pune:", err); const results = await fetchGovHospitals(18.5204, 73.8567); setGovFacilities(results);
      } finally {
        setFetchingGPS(false);
      }
    };
    getHospitals();
  }, []);

  const handleSave = async () => {
    if (!facility || !dept || !slot) { setError("Please complete all fields."); return; }
    setSaving(true);
    const { error: saveErr } = await createCareRequest({
      patient_id: member.id,
      patient_name: member.name,
      source: "SELF_BOOKED",
      created_by: "Patient",
      facility,
      department: dept,
      slot_preference: slot,
      priority: "ROUTINE",
      reason: `Patient self-booked appointment for ${dept}`,
    });
    setSaving(false);
    if (saveErr) setError("Failed to book appointment.");
    else onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#16324F]/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[#F8FAFC] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#16324F]">Book Appointment</h2>
            <p className="text-[11px] font-bold text-[#008F83] uppercase tracking-wider">{member.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 text-[11px] font-bold p-3 rounded-xl flex items-center gap-2 border border-rose-100">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Facility Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 1. Select Government Facility
            </label>
            {fetchingGPS ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#008F83] mb-2" />
                <p className="text-xs font-bold text-slate-500">Locating nearby facilities...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <select 
                  value={facility} onChange={e => setFacility(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/20 appearance-none shadow-sm"
                >
                  <option value="">-- Choose Facility --</option>
                  {govFacilities.map(f => (
                    <option key={f.name} value={f.name}>{f.name} ({f.dist} km)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Department Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> 2. Select Department
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map(d => (
                <button key={d} onClick={() => setDept(d)}
                  className={`px-3 py-3 rounded-xl border font-bold text-[11px] text-center transition-all ${dept === d ? "border-[#008F83] bg-[#E8F7F3] text-[#008F83] shadow-sm" : "border-slate-200 bg-white text-[#16324F] hover:border-slate-300"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 3. Preferred Time
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SLOTS.map(s => (
                <button key={s} onClick={() => setSlot(s)}
                  className={`px-4 py-3 rounded-xl border font-bold text-xs text-left transition-all ${slot === s ? "border-[#008F83] bg-[#E8F7F3] text-[#008F83] shadow-sm" : "border-slate-200 bg-white text-[#16324F] hover:border-slate-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Submit */}
        <div className="bg-white p-5 border-t border-slate-200 shrink-0">
          <button 
            onClick={handleSave} 
            disabled={saving || !facility || !dept || !slot}
            className="w-full bg-[#16324F] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:bg-slate-800"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Confirming..." : "Confirm Appointment"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function CareHub({ member }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const load = async () => {
    if (!member?.id) return;
    setLoading(true);
    const { data } = await getCareRequests(member.id);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [member?.id]);

  const active = requests.filter(r => r.status !== "COMPLETED");
  const past = requests.filter(r => r.status === "COMPLETED");

  return (
    <div className="px-4 py-5 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-black text-[#16324F]">Care Hub</h2>
          <p className="text-[11px] font-bold text-[#64748B] mt-0.5">{member?.name}</p>
        </div>
        <button onClick={() => setBooking(true)}
          className="flex items-center gap-1.5 bg-[#16324F] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-sm hover:bg-slate-800 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Book Appointment
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />)}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">Active Care</h3>
              {active.map(r => <ReferralCard key={r.id} req={r} />)}
            </div>
          )}

          {active.length === 0 && (
            <div className="bg-white rounded-[24px] border border-amber-100 p-8 flex flex-col items-center text-center gap-4 relative overflow-hidden shadow-[0_4px_24px_-8px_rgba(251,191,36,0.15)]">
              {/* Saffron geometric background accents */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/20 rounded-bl-[100px]" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-400/10 rounded-tr-[80px]" />

              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center relative z-10 shadow-sm border border-amber-100/50">
                <Stethoscope className="w-8 h-8 text-amber-500" />
              </div>
              <div className="relative z-10">
                <p className="text-[17px] font-black text-[#16324F] tracking-tight">No active referrals</p>
                <p className="text-[12px] text-[#64748B] font-medium mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                  When your ASHA worker refers you to a facility, the live tracker will appear here.
                </p>
              </div>
              <button onClick={() => setBooking(true)}
                className="mt-2 flex items-center gap-1.5 bg-[#16324F] text-white px-5 py-3 rounded-xl text-[12px] font-black shadow-lg hover:bg-slate-800 transition-colors relative z-10 uppercase tracking-wide">
                <Plus className="w-4 h-4" /> Book Appointment
              </button>
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-2 mt-8">
              <h3 className="text-[11px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
                <History className="w-3 h-3" /> Past Care
              </h3>
              {past.map(r => <PastCareCard key={r.id} req={r} />)}
            </div>
          )}
        </>
      )}

      {booking && (
        <BookAppointmentModal
          member={member}
          onClose={() => setBooking(false)}
          onSaved={() => { setBooking(false); load(); }}
        />
      )}
    </div>
  );
}
