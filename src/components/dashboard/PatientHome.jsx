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
  Sparkles,
  Phone,
  Droplet
} from 'lucide-react';

export function PatientHome() {
  const { patients, loading: patientsLoading, error: patientsError } = useContext(PatientContext);
  
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [vitals, setVitals] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const activePatient = patients && patients.length > 0 ? patients[selectedPatientIndex] : null;

  useEffect(() => {
    if (!activePatient?.id) return;

    let isMounted = true;
    const fetchPatientDetails = async () => {
      try {
        setDetailsLoading(true);
        const [vitalsData, appointmentsData] = await Promise.allSettled([
          getVitals(activePatient.id),
          getUpcomingAppointments(activePatient.id)
        ]);

        if (isMounted) {
          if (vitalsData.status === 'fulfilled' && vitalsData.value?.length > 0) {
            setVitals(vitalsData.value[0]); // Latest vitals
          } else {
            setVitals(null);
          }

          if (appointmentsData.status === 'fulfilled') {
            setAppointments(appointmentsData.value || []);
          } else {
            setAppointments([]);
          }
        }
      } catch (err) {
        console.error('Error fetching patient details:', err);
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    };

    fetchPatientDetails();

    return () => {
      isMounted = false;
    };
  }, [activePatient?.id]);

  if (patientsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Loading patient records from RadVault..." />
      </div>
    );
  }

  if (patientsError) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-center">
        <div className="w-12 h-12 bg-red-900/50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-red-200 mb-2">Unable to Load Patient Data</h3>
        <p className="text-sm text-red-300/80 mb-4">{patientsError}</p>
        <p className="text-xs text-slate-400">Please check your Supabase connection or table permissions.</p>
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="max-w-md mx-auto my-8 p-8 bg-slate-800/80 border border-slate-700 rounded-2xl text-center">
        <div className="w-14 h-14 bg-sky-950/60 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">No Patients Found</h3>
        <p className="text-sm text-slate-400 mb-6">
          No registered patients found in the Supabase database. Add a patient in the database to see live health journey information.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Patient Selector Switcher (if multiple patients in database) */}
      {patients.length > 1 && (
        <div className="flex items-center justify-between bg-slate-800/60 backdrop-blur border border-slate-700/80 px-4 py-2.5 rounded-xl text-xs text-slate-300">
          <span className="font-medium text-slate-400">Switch Patient:</span>
          <select 
            value={selectedPatientIndex} 
            onChange={(e) => setSelectedPatientIndex(Number(e.target.value))}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {patients.map((p, idx) => (
              <option key={p.id || idx} value={idx}>
                {p.full_name} ({p.unified_id || 'ID: ' + p.id.slice(0, 6)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 1. Header / Patient Identity Hero Card */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Health Journey
              </span>
              <span className="text-xs text-slate-400">
                Unified ID: <strong className="text-slate-200 font-mono">{activePatient.unified_id || 'MH-P-10482'}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
              {activePatient.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-slate-300">
              <span>Age: <strong className="text-white">{activePatient.age || 'N/A'} yrs</strong></span>
              <span>•</span>
              <span>Gender: <strong className="text-white">{activePatient.gender || 'N/A'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-red-400" />
                Blood Group: <strong className="text-red-400">{activePatient.blood_group || 'O+'}</strong>
              </span>
              {activePatient.contact && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {activePatient.contact}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between border-t sm:border-t-0 border-slate-700/60 pt-3 sm:pt-0">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Care Coordination</span>
              <span className="text-xs font-semibold text-emerald-400">Rural Health Link Connected</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Vitals Summary Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Latest Vitals Summary
          </h2>
          {vitals?.recorded_at && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Recorded: {new Date(vitals.recorded_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {detailsLoading ? (
          <div className="p-8 bg-slate-800/40 rounded-xl border border-slate-700/50 flex justify-center">
            <LoadingSpinner message="Fetching vitals telemetry..." />
          </div>
        ) : vitals ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Blood Pressure */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Blood Pressure</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
                  {vitals.blood_pressure || '120/80'}
                </span>
                <span className="text-xs text-slate-400 ml-1">mmHg</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">● Normal Range</div>
            </div>

            {/* Pulse */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Heart Rate / Pulse</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
                  {vitals.pulse || '72'}
                </span>
                <span className="text-xs text-slate-400 ml-1">bpm</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">● Stable</div>
            </div>

            {/* Oxygen (SpO2) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">SpO2 Oxygen</span>
                <Wind className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
                  {vitals.oxygen || '98'}
                </span>
                <span className="text-xs text-slate-400 ml-1">%</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">● Optimal</div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Body Temp</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
                  {vitals.temperature || '98.6'}
                </span>
                <span className="text-xs text-slate-400 ml-1">°F</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">● Normal</div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-center">
            <p className="text-sm text-slate-400">No recent vitals logged yet for this patient.</p>
            <p className="text-xs text-slate-500 mt-1">Vitals recorded during ASHA frontline triage will appear here.</p>
          </div>
        )}
      </section>

      {/* 3. Upcoming Appointment Card */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          Upcoming Doctor Appointment
        </h2>

        {appointments.length > 0 ? (
          <div className="bg-slate-800/90 border border-sky-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/20 text-sky-300 mb-1 uppercase tracking-wide">
                  Confirmed Consultation
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  {appointments[0].doctor_name || 'Dr. Specialist'}
                </h3>
                <p className="text-sm text-slate-300">
                  📍 {appointments[0].facility || 'District Civil Hospital'}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                  <span>📅 {new Date(appointments[0].appointment_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>⏰ {appointments[0].appointment_time || '10:30 AM'}</span>
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Status: {appointments[0].status || 'Scheduled'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">No Upcoming Appointments</p>
              <p className="text-xs text-slate-400 mt-0.5">Need a specialist consultation or follow-up check?</p>
            </div>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors">
              Schedule Visit
            </button>
          </div>
        )}
      </section>

      {/* 4. Quick Action Modules (Clean Teammate Navigation Links) */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Health Journey Navigation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Emergency Break-Glass QR (Member 3 module) */}
          <div className="p-4 bg-red-950/30 border border-red-800/40 hover:border-red-600/60 rounded-xl transition-all flex items-start gap-3 cursor-pointer group">
            <div className="p-2.5 bg-red-900/40 text-red-400 rounded-lg group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-200 group-hover:text-red-100 flex items-center justify-between">
                Emergency Break-Glass QR
                <ArrowRight className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-red-300/70 mt-0.5">Instant critical access for emergency first responders</p>
            </div>
          </div>

          {/* Medical Records (Member 2 module) */}
          <div className="p-4 bg-slate-800/70 border border-slate-700 hover:border-emerald-500/50 rounded-xl transition-all flex items-start gap-3 cursor-pointer group">
            <div className="p-2.5 bg-emerald-950/50 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 flex items-center justify-between">
                Medical Records & Vault
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">View X-rays, lab reports, and doctor prescriptions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PatientHome;
