import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, Phone, MapPin, Activity, Heart, ShieldAlert,
  Clock, CheckCircle2, ChevronRight, Volume2, VolumeX, X,
  Navigation, Siren, UserCheck, Stethoscope, AlertCircle, Loader2
} from 'lucide-react';
import {
  EMERGENCY_CATEGORIES,
  submitEmergencySOS,
  parseEmergencyRecord,
  validatePhoneNumber,
  getActiveStoredSOSId,
  getEmergencySOSById,
  clearStoredSOS
} from '../../services/emergencyService';
import { supabase } from '../../services/supabase';

export default function EmergencySOSModal({ member, onClose, isStandaloneTab = false }) {
  // Caller details
  const [phone, setPhone] = useState(() => member?.phone || member?.emergencyContact?.phone || '');
  const [name, setName] = useState(() => member?.name || '');
  const [village, setVillage] = useState(() => member?.village || 'Shirwal Primary Health Centre Catchment');
  const [category, setCategory] = useState(EMERGENCY_CATEGORIES[0].id);
  const [consciousness, setConsciousness] = useState('Conscious');
  const [breathing, setBreathing] = useState('Normal');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // GPS State
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Submission & Live Tracking State
  const [submitting, setSubmitting] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // CPR Metronome State (110 BPM foreign 911 dispatch life support)
  const [cprRunning, setCprRunning] = useState(false);
  const audioContextRef = useRef(null);
  const cprIntervalRef = useRef(null);

  // Auto-restore active SOS session from localStorage on mount
  useEffect(() => {
    const savedId = getActiveStoredSOSId();
    if (savedId && !activeSOS) {
      getEmergencySOSById(savedId).then(rec => {
        if (rec && rec.status !== 'RESOLVED' && rec.status !== 'COMPLETED') {
          setActiveSOS(rec);
        } else {
          clearStoredSOS();
        }
      });
    }
  }, []);

  // Auto-fetch GPS on mount if supported
  const handleFetchGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by device');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS notice:', err.message);
        setGpsError('Could not auto-detect GPS. Enter landmark/village below.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Sound generator for CPR metronome (110 BPM - 545ms interval)
  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch clear pulse
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (_) {}
  };

  useEffect(() => {
    if (cprRunning) {
      playBeep();
      cprIntervalRef.current = setInterval(playBeep, 545); // 110 BPM
    } else {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    }
    return () => {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    };
  }, [cprRunning]);

  // Submit SOS
  const handleTriggerSOS = async () => {
    if (!validatePhoneNumber(phone)) {
      setSubmitError('Please enter a valid 10-digit mobile number so hospital staff can contact you immediately.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitEmergencySOS({
        patientId: member?.id,
        callerPhone: phone.trim(),
        callerName: name.trim() || 'Emergency Caller',
        village: village.trim() || 'Shirwal Village',
        gpsCoords,
        categoryId: category,
        consciousness,
        breathing,
        additionalNotes: additionalNotes.trim()
      });

      setActiveSOS(parseEmergencyRecord(res.data));
    } catch (err) {
      setSubmitError(`SOS Transmission failed: ${err.message}. Please call 108 directly!`);
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time listener for active SOS updates from Hospital Staff
  useEffect(() => {
    if (!activeSOS?.id) return;

    const channel = supabase
      .channel(`sos_live_${activeSOS.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'care_requests', filter: `id=eq.${activeSOS.id}` },
        (payload) => {
          if (payload.new) {
            setActiveSOS(parseEmergencyRecord(payload.new));
          }
        }
      )
      .subscribe();

    // Fast polling fallback (every 2.5s) to guarantee updates
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('care_requests')
          .select('*')
          .eq('id', activeSOS.id)
          .maybeSingle();

        if (data) {
          setActiveSOS(parseEmergencyRecord(data));
        }
      } catch (_) {}
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [activeSOS?.id]);

  const selectedCategoryObj = EMERGENCY_CATEGORIES.find(c => c.id === category) || EMERGENCY_CATEGORIES[0];

  return (
    <div className={isStandaloneTab ? "max-w-4xl mx-auto px-4 py-6 font-sans text-slate-800 space-y-6" : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"}>
      <div className={`bg-white rounded-3xl w-full border border-red-200 shadow-2xl overflow-hidden flex flex-col ${isStandaloneTab ? "border-2 border-red-500/30" : "max-w-2xl max-h-[95vh]"}`}>
        
        {/* ── Emergency Header ── */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 text-white rounded-2xl flex items-center justify-center animate-pulse border border-white/20">
              <Siren className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg tracking-tight">24x7 Emergency SOS Helpline</h2>
                <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full border border-white/30 uppercase tracking-widest">
                  Live Dispatch
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-medium">
                No Login Required · Instant Hospital Staff & 108 Ambulance Dispatch Link
              </p>
            </div>
          </div>
          
          {!isStandaloneTab && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
              title="Close Helpline"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Main Body ── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs font-sans text-slate-800 flex-1">
          
          {!activeSOS ? (
            /* ════════════════ STEP 1: SOS INTAKE FORM ════════════════ */
            <div className="space-y-5">
              
              {/* Critical Alert Notice */}
              <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-3 text-red-950">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black text-xs">Immediate Hospital Staff & 108 Dispatch Trigger</p>
                  <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                    Submitting this alert broadcasts directly to the Hospital Intake Desk. Staff will immediately call your phone to verify and deploy an ambulance or local ASHA escort.
                  </p>
                </div>
              </div>

              {/* 1. Select Emergency Nature (1-Tap Fast Buttons) */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block flex items-center justify-between">
                  <span>1. Select Emergency Nature</span>
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded ${selectedCategoryObj.cadColor}`}>
                    {selectedCategoryObj.cadCategory} · Target {selectedCategoryObj.targetResponse}
                  </span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EMERGENCY_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="text-xl mb-1">{cat.icon}</div>
                        <div>
                          <p className={`font-black text-[11px] leading-snug ${isSelected ? 'text-red-950' : 'text-slate-800'}`}>
                            {cat.label}
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 font-bold block mt-0.5">
                            {cat.cadCategory}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Phone Number & Caller Name (Crucial for callback) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    2. Callback Phone Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Hospital reception staff will dial this number.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    Patient / Caller Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Identity helps triage medical records.</p>
                </div>
              </div>

              {/* 3. Location & 1-Click GPS Beacon */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>3. Patient Location & GPS</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleFetchGPS}
                    disabled={gpsLoading}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Navigation className="w-3.5 h-3.5 text-red-600" />}
                    <span>{gpsCoords ? '✓ GPS Acquired' : '📍 Auto-Fetch Device GPS'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="Village name, landmark or house number..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />

                {gpsCoords && (
                  <p className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Exact Pin: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)} (Attached to SOS Dispatch)</span>
                  </p>
                )}

                {gpsError && (
                  <p className="text-[10px] text-amber-800 font-semibold">{gpsError}</p>
                )}
              </div>

              {/* 4. Rapid Triage (Consciousness & Breathing) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                    Patient Consciousness
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Conscious', 'Drowsy', 'Unconscious'].map(state => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => setConsciousness(state)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          consciousness === state
                            ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                    Breathing Status
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Normal', 'Gasping', 'Not Breathing'].map(state => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => setBreathing(state)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          breathing === state
                            ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Brief Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                  Additional Observations (Optional)
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Snake was black cobra, bite occurred 10 mins ago on right foot..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-bold">
                  ⚠️ {submitError}
                </div>
              )}

              {/* ── BIG RED SOS TRIGGER BUTTON ── */}
              <button
                type="button"
                onClick={handleTriggerSOS}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Broadcasting SOS to Hospital Desk...</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-5 h-5 animate-pulse" />
                    <span>SEND EMERGENCY SOS TO HOSPITAL NOW</span>
                  </>
                )}
              </button>

              {/* Direct Speed-Dial Helpline Bar */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">
                  Or Call Free Government Helplines Directly
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:108"
                    className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-center font-black text-xs text-red-700 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="text-sm">🚑</span>
                    <span>108</span>
                    <span className="text-[9px] font-medium text-slate-500">Ambulance</span>
                  </a>

                  <a
                    href="tel:104"
                    className="p-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-center font-black text-xs text-[#008F83] transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="text-sm">📞</span>
                    <span>104</span>
                    <span className="text-[9px] font-medium text-slate-500">Medical Help</span>
                  </a>

                  <a
                    href="tel:112"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-center font-black text-xs text-slate-800 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="text-sm">🚨</span>
                    <span>112</span>
                    <span className="text-[9px] font-medium text-slate-500">National SOS</span>
                  </a>
                </div>
              </div>

            </div>
          ) : (
            /* ════════════════ STEP 2: ACTIVE SOS TRACKING CARD ════════════════ */
            <div className="space-y-5">
              
              {/* Top Live Beacon */}
              <div className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl shadow-md space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                    <span className="font-black text-xs uppercase tracking-wider">
                      Emergency SOS Active · Transmitted to Hospital Desk
                    </span>
                  </div>
                  <span className="font-mono font-black text-xs bg-black/20 px-2.5 py-1 rounded-lg border border-white/20">
                    Ref #{activeSOS.refId}
                  </span>
                </div>
                
                <p className="text-xs font-semibold text-red-50 leading-relaxed">
                  Hospital Reception staff has been alerted with priority sound alarm. Keep your phone <strong className="text-white underline">{activeSOS.phone}</strong> free — they are calling you now.
                </p>
              </div>

              {/* Live Dispatch Tracking Timeline */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Dispatch Response Matrix</span>
                  <span className="text-[10px] text-[#008F83] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#008F83] animate-pulse" />
                    Live 2-Way Sync
                  </span>
                </h3>

                <div className="space-y-2.5 pt-1">
                  
                  {/* Item 1: Hospital Reception Notice */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Hospital Staff Operations Desk Notified</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Shrirampur Primary Health Centre intake screen active.
                      </p>
                    </div>
                  </div>

                  {/* Item 2: Phone Callback Status */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      activeSOS.callLogged ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'
                    }`}>
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {activeSOS.callLogged ? '✓ Hospital Staff Callback Completed' : 'Hospital Receptionist Dialing You...'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Targeting: <span className="font-mono font-bold text-slate-700">{activeSOS.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Item 3: Ambulance 108 Status */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      activeSOS.ambulanceStatus === 'DISPATCHED' || activeSOS.ambulanceStatus === 'ON_SITE'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <span className="text-xs">🚑</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {activeSOS.ambulanceStatus === 'DISPATCHED' ? `Ambulance 108 En Route (${activeSOS.ambulanceVehicle})`
                          : activeSOS.ambulanceStatus === 'ON_SITE' ? '✓ Ambulance On Site at Patient Location'
                          : '108 Ambulance Unit on Standby'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {activeSOS.ambulanceStatus === 'DISPATCHED' ? `Estimated Arrival: ~${activeSOS.ambulanceEta}` : 'Staff evaluates dispatch based on location & triage.'}
                      </p>
                    </div>
                  </div>

                  {/* Item 4: Village ASHA Worker */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      activeSOS.ashaStatus === 'ALERTED' || activeSOS.ashaStatus === 'EN_ROUTE'
                        ? 'bg-teal-100 text-[#008F83]'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {activeSOS.ashaStatus === 'ALERTED' ? 'Village ASHA Worker Alerted (Accompanying Escort)'
                          : activeSOS.ashaStatus === 'EN_ROUTE' ? 'ASHA Worker En Route to Patient House'
                          : 'Village ASHA Worker Coordination Pending'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ASHA provides frontline BLS stabilization & hospital escort.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Pre-Arrival Life Support Guidance ── */}
              <div className="p-4 bg-red-50/70 border-2 border-red-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-600" />
                    <span className="font-black text-xs text-red-950 uppercase tracking-wider">
                      Pre-Arrival Emergency First-Aid Instructions
                    </span>
                  </div>
                  
                  {/* Interactive CPR Metronome for Cardiac Cases */}
                  {(selectedCategoryObj.firstAidId === 'cpr' || activeSOS.breathing === 'Not Breathing') && (
                    <button
                      type="button"
                      onClick={() => setCprRunning(prev => !prev)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        cprRunning
                          ? 'bg-red-600 text-white shadow-xs animate-pulse'
                          : 'bg-white border border-red-300 text-red-800 hover:bg-red-100'
                      }`}
                    >
                      {cprRunning ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{cprRunning ? 'CPR Rhythm Playing (110 BPM)' : 'Start CPR Audio Metronome'}</span>
                    </button>
                  )}
                </div>

                {/* Specific Lifesaving Advice Based on Condition */}
                <div className="bg-white/90 p-3.5 rounded-xl border border-red-200 text-xs text-slate-800 space-y-2">
                  {selectedCategoryObj.firstAidId === 'cpr' || activeSOS.breathing === 'Not Breathing' ? (
                    <div className="space-y-1.5">
                      <p className="font-black text-red-700 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 fill-red-600 text-red-600" />
                        HANDS-ONLY CPR GUIDELINES (100–120 COMPRESSIONS / MINUTE):
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-medium">
                        <li>Place heel of one hand in the center of the chest. Place other hand on top and interlock fingers.</li>
                        <li>Push hard and fast: 2 inches (5 cm) deep. Follow the audio metronome rhythm above.</li>
                        <li>Do not stop until ambulance arrives or patient shows definite signs of life.</li>
                      </ul>
                    </div>
                  ) : selectedCategoryObj.firstAidId === 'bleeding' ? (
                    <div className="space-y-1.5">
                      <p className="font-black text-red-700">🩸 SEVERE BLEEDING PROTOCOL:</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-medium">
                        <li>Apply firm, continuous direct pressure over the wound using a clean cloth or sterile dressing.</li>
                        <li>Do NOT remove soaked cloths — add more layers directly over them.</li>
                        <li>Keep patient lying down, elevate legs if possible to maintain cerebral perfusion.</li>
                      </ul>
                    </div>
                  ) : selectedCategoryObj.firstAidId === 'snakebite' ? (
                    <div className="space-y-1.5">
                      <p className="font-black text-amber-700">🐍 SNAKEBITE PROTOCOL (DO NO HARM):</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-medium">
                        <li>Keep the bitten limb strictly immobilized below heart level. Remove rings or tight clothing.</li>
                        <li><strong>DO NOT cut, suction venom, or tie tight tourniquet</strong> — this accelerates tissue necrosis.</li>
                        <li>Keep patient calm and still. Antisnake venom (ASV) is prepped at PHC.</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="font-black text-slate-900">🚨 GENERAL EMERGENCY GUIDELINES:</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-medium">
                        <li>Keep airway clear: If unconscious, place patient on their side (Recovery Position).</li>
                        <li>Keep patient warm and loosen tight collars or waistbands.</li>
                        <li>Do not give oral fluids or food to an unconscious or drowsy patient.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <a
                  href="tel:108"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>🚑 Call 108 Directly</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    clearStoredSOS();
                    setActiveSOS(null);
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Submit Another SOS
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
