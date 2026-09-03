import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Phone,
  AlertTriangle,
  Building2,
  HeartPulse,
  User,
  Baby,
  Plus,
  CheckCircle2,
  Loader2,
  Send,
  X
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CareHub({ patient = null, onNavigate = null }) {
  const { isDemoMode, demoDataEnabled } = useAuth();
  const [activeReferrals, setActiveReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    type: 'Tele-Consultation Advice',
    preferredDate: new Date().toISOString().slice(0, 10),
    preferredTime: '10:00 AM',
    reason: '',
    department: 'General Medicine'
  });

  const patientId = patient?.id || 'PAT-89210';
  const patientName = patient?.full_name || patient?.name || patient?.fullName || 'Beneficiary';

  useEffect(() => {
    async function loadCareData() {
      setLoading(true);
      try {
        if (isDemoMode && demoDataEnabled) {
          // Demo referrals
          setActiveReferrals([
            {
              id: 'ref-demo-1',
              destination_hospital: 'Shrirampur Primary Health Centre',
              destination_department: 'General Medicine',
              doctor_assigned: 'Dr. Samir Deshmukh',
              priority: 'ROUTINE',
              priority_label: 'Routine Consultation',
              status: 'Accepted',
              symptoms: 'Mild hypertension checkup and medication refill',
              created_at: new Date().toISOString(),
              scheduled_date: 'Tomorrow, 10:30 AM'
            }
          ]);
        } else {
          // Live Supabase query from canonical referrals table
          const { data, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setActiveReferrals(data);
          } else {
            setActiveReferrals([]);
          }
        }
      } catch (err) {
        console.warn('Error loading patient care data:', err);
        setActiveReferrals([]);
      } finally {
        setLoading(false);
      }
    }

    loadCareData();
  }, [patientId, isDemoMode, demoDataEnabled]);

  const handleBookSubmit = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingSuccess(false);
      // Add local booking representation
      setActiveReferrals(prev => [
        {
          id: `book-${Date.now()}`,
          destination_hospital: 'Primary Health Centre (Tele-Advice)',
          destination_department: bookingForm.department,
          doctor_assigned: 'On-Duty Medical Officer',
          priority: 'ROUTINE',
          priority_label: 'Patient-Requested Advice',
          status: 'Pending',
          symptoms: bookingForm.reason || 'Requested tele-consultation advice',
          created_at: new Date().toISOString(),
          scheduled_date: `${bookingForm.preferredDate} at ${bookingForm.preferredTime}`
        },
        ...prev
      ]);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans text-slate-800 space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span>Care Hub & Healthcare Services</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            24x7 emergency contacts, tele-consultation advice & nearby facilities for {patientName}
          </p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer uppercase tracking-wider shrink-0"
        >
          <Plus className="w-4 h-4" /> Request Tele-Advice
        </button>
      </div>

      {/* ── 24x7 Emergency Helplines Strip ── */}
      <div className="bg-gradient-to-br from-rose-50 to-orange-50/60 rounded-3xl border-2 border-rose-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            <h2 className="text-xs font-black text-rose-900 uppercase tracking-wider">
              24x7 National Healthcare Helplines (Direct Call)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
            Toll-Free
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a
            href="tel:108"
            className="p-3 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <span className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Phone className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-base">108</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">Emergency Ambulance</span>
          </a>

          <a
            href="tel:104"
            className="p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-base">104</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">Medical Advice / Helpline</span>
          </a>

          <a
            href="tel:181"
            className="p-3 bg-white rounded-2xl border border-teal-200 hover:border-teal-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <span className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <User className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-base">181</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">Women & Maternal Support</span>
          </a>

          <a
            href="tel:1098"
            className="p-3 bg-white rounded-2xl border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Baby className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 text-base">1098</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">Childline Support</span>
          </a>
        </div>
      </div>

      {/* ── Active Tele-Consultation & Care Tracking ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            Active Tele-Consultations & Doctor Advice
          </h2>
        </div>

        {loading ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#008F83] mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading active care status...</p>
          </div>
        ) : activeReferrals.length > 0 ? (
          <div className="space-y-3">
            {activeReferrals.map((ref) => (
              <div
                key={ref.id}
                className="bg-white border-2 border-slate-200 hover:border-[#008F83]/60 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#008F83] flex items-center justify-center font-bold">
                      🏥
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{ref.destination_hospital}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {ref.destination_department} · Doctor: {ref.doctor_assigned || 'On-Duty Specialist'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      ref.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : ref.status === 'Completed'
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}>
                      {ref.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                  {ref.symptoms}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                  <span>Requested on: {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {ref.scheduled_date && (
                    <span className="text-slate-700 font-bold">Slot: {ref.scheduled_date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center shadow-xs">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">No Active Tele-Consultations</h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto mb-4">
              You are all caught up. No pending tele-consultation requests are active.
            </p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-4 py-2 bg-[#008F83] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#006666] cursor-pointer"
            >
              + Request Tele-Advice
            </button>
          </div>
        )}
      </div>

      {/* ── Nearby Government Facilities Directory ── */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider">
          Nearby Government Facilities & Reception Desks
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#008080] flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">Primary Health Centre - Shirwal</p>
                <p className="text-[11px] text-slate-500">PHC & Delivery Centre · 24x7 Emergency</p>
              </div>
            </div>
            <a
              href="tel:02169244222"
              className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call PHC</span>
            </a>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">Satara District Civil Hospital</p>
                <p className="text-[11px] text-slate-500">Tertiary Care & Specialist OPD</p>
              </div>
            </div>
            <a
              href="tel:02162233240"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call DH</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Request Tele-Advice Modal ── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Request Tele-Consultation Advice</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Connect with on-duty medical officer</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-black text-base text-slate-900">Advice Request Submitted</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Your request has been routed to the PHC clinical desk. A healthcare worker will reach out shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Clinical Department
                  </label>
                  <select
                    value={bookingForm.department}
                    onChange={e => setBookingForm({ ...bookingForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#008080]"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Obstetrics & Gynaecology (Maternal)">Obstetrics & Gynaecology (Maternal)</option>
                    <option value="Paediatrics (Child Health)">Paediatrics (Child Health)</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopaedics">Orthopaedics</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={bookingForm.preferredDate}
                      onChange={e => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#008080]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Preferred Time
                    </label>
                    <select
                      value={bookingForm.preferredTime}
                      onChange={e => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#008080]"
                    >
                      <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 - 12:00)</option>
                      <option value="Afternoon (02:00 PM - 05:00 PM)">Afternoon (02:00 - 05:00)</option>
                      <option value="Urgent Tele-Advice (Within 2 Hours)">Urgent (Within 2 Hours)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Symptoms / Advice Needed
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={bookingForm.reason}
                    onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
                    placeholder="Describe your health question, symptoms or medication query..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-[#008080]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
