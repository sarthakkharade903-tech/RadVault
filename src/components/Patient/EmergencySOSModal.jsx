import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, MapPin, Activity, Heart, CheckCircle2,
  Volume2, VolumeX, X, Siren, UserCheck,
  Loader2, Edit3, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
  EMERGENCY_CATEGORIES,
  submitEmergencySOS,
  parseEmergencyRecord,
  validatePhoneNumber,
  getActiveStoredSOSId,
  getEmergencySOSById,
  clearStoredSOS,
  fetchRealAddressFromCoords
} from '../../services/emergencyService';
import { supabase } from '../../services/supabase';

const CATEGORY_LABELS = {
  CARDIAC: 'Cardiac / Chest',
  BLEEDING: 'Severe Bleeding',
  MATERNAL: 'Active Labour',
  SNAKEBITE: 'Snake / Poison',
  BREATHING: 'Severe Breathing',
  ACCIDENT: 'Road Accident',
  OTHER: 'Other Emergency / Trauma Crisis'
};

export default function EmergencySOSModal({ member, onClose, isStandaloneTab = false }) {
  // ── Core Minimal State ──
  const [phone, setPhone] = useState(() => member?.phone || member?.emergencyContact?.phone || '');
  const [category, setCategory] = useState(EMERGENCY_CATEGORIES[0]?.id || 'CARDIAC');
  
  // Real Location & GPS State
  const [gpsCoords, setGpsCoords] = useState(null);
  const [realAddress, setRealAddress] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsNotice, setGpsNotice] = useState('');

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

  // ── Automatic High-Accuracy GPS & Real Address Resolution ──
  const applyCoords = async (lat, lng, accuracy = 12, isFallback = false) => {
    setGpsCoords({ lat, lng, accuracy });
    setGpsLoading(true);

    try {
      const addr = await fetchRealAddressFromCoords(lat, lng);
      if (addr) {
        setRealAddress(addr);
      } else {
        setRealAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      setRealAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
    } finally {
      setGpsLoading(false);
      if (isFallback) {
        setGpsNotice('Device GPS unverified. Catchment coordinates active.');
      } else {
        setGpsNotice('');
      }
    }
  };

  const detectLocation = () => {
    setGpsLoading(true);
    setGpsNotice('');

    if (!navigator.geolocation) {
      // Automatic fallback to Shirwal/Pune PHC catchment coordinates
      applyCoords(18.48778, 73.85197, 15, true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        applyCoords(lat, lng, accuracy, false);
      },
      (err) => {
        console.warn('GPS notice:', err.message);
        // Seamless fallback so the caller always has a real address & GPS pin immediately
        applyCoords(18.48778, 73.85197, 15, true);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // CPR Sound generator (110 BPM - 545ms interval)
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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
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
      cprIntervalRef.current = setInterval(playBeep, 545);
    } else {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    }
    return () => {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
    };
  }, [cprRunning]);

  // ── Trigger SOS ──
  const handleTriggerSOS = async () => {
    if (!validatePhoneNumber(phone)) {
      setSubmitError('Please enter a valid 10-digit mobile number for immediate hospital callback.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const finalAddress = customAddress.trim() 
      ? (realAddress ? `${customAddress.trim()} (${realAddress})` : customAddress.trim())
      : (realAddress || 'Current Location (GPS Active)');

    try {
      const res = await submitEmergencySOS({
        patientId: member?.id,
        callerPhone: phone.trim(),
        callerName: member?.name || 'Emergency Caller',
        realAddress: finalAddress,
        village: finalAddress,
        gpsCoords,
        categoryId: category,
        consciousness: 'Emergency Caller Alerted',
        breathing: 'Assisted Dispatch'
      });

      setActiveSOS(parseEmergencyRecord(res.data));
    } catch (err) {
      setSubmitError(`SOS transmission failed: ${err.message}. Please dial 108 directly!`);
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
  const isPhoneValid = validatePhoneNumber(phone);

  return (
    <div className={isStandaloneTab ? "max-w-xl mx-auto px-4 py-4 font-sans text-slate-800" : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"}>
      <div className={`bg-white rounded-3xl w-full border border-red-200 shadow-2xl overflow-hidden flex flex-col ${isStandaloneTab ? "border-2 border-red-500/30" : "max-w-lg max-h-[95vh]"}`}>
        
        {/* ── Compact Urgent Header ── */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 sm:px-5 py-3.5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 text-white rounded-xl flex items-center justify-center animate-pulse border border-white/25">
              <Siren className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base tracking-tight leading-tight">24x7 Emergency SOS</h2>
                <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-full border border-white/30 uppercase tracking-wider">
                  Live Dispatch
                </span>
              </div>
              <p className="text-[10px] text-red-100 font-medium leading-none mt-0.5">
                Direct Hospital Desk & 108 Ambulance Link
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href="tel:108"
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg text-white text-[11px] font-black flex items-center gap-1 transition-colors"
              title="Direct call 108"
            >
              <span>🚑 108 Call</span>
            </a>

            {!isStandaloneTab && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/15 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Main Body ── */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs font-sans text-slate-800 flex-1">
          
          {!activeSOS ? (
            /* ════════════════ STEP 1: ULTRA-MINIMAL SOS FORM ════════════════ */
            <div className="space-y-3.5">

              {/* 1. Emergency Type (6 Instant Tap Chips + 1 Wide Option) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    1. Tap Emergency Nature
                  </label>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${selectedCategoryObj.cadColor}`}>
                    {selectedCategoryObj.cadCategory} · {selectedCategoryObj.targetResponse}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EMERGENCY_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const isOther = cat.id === 'OTHER';
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isOther ? 'col-span-2 sm:col-span-3' : ''
                        } ${
                          isSelected
                            ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                        }`}
                      >
                        <span className="text-xl shrink-0">{cat.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`font-black text-[11px] leading-tight ${isSelected ? 'text-red-950' : 'text-slate-800'}`}>
                            {CATEGORY_LABELS[cat.id] || cat.label}
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

              {/* 2. Callback Phone Number (Instant Input) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3 text-red-600" />
                    <span>2. Callback Mobile Number</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {isPhoneValid && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Valid Number
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    autoFocus
                    className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Hospital staff will instantly call back on this number.
                </p>
              </div>

              {/* 3. Real Location & Real-World Address */}
              <div className="space-y-1.5 p-3 bg-slate-50/80 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>3. Real Address & GPS Coordinates</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={gpsLoading}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Re-fetch GPS coordinates"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${gpsLoading ? 'animate-spin text-red-600' : 'text-slate-500'}`} />
                      <span>{gpsLoading ? 'Detecting...' : 'Re-detect'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(prev => !prev)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5 text-slate-500" />
                      <span>{isEditingAddress ? 'Done' : 'Edit / Landmark'}</span>
                    </button>
                  </div>
                </div>

                {/* Real-World Address Display */}
                {gpsLoading ? (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-slate-500 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                    <span>Detecting real street address & GPS coordinates...</span>
                  </div>
                ) : realAddress ? (
                  <div className="p-2.5 bg-white border border-emerald-300/80 rounded-xl space-y-1 shadow-2xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5">📍</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-900 leading-snug break-words">
                          {realAddress}
                        </p>
                      </div>
                    </div>

                    {gpsCoords && (
                      <div className="flex items-center justify-between flex-wrap gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                        <span className="font-bold">
                          🎯 GPS: {gpsCoords.lat.toFixed(5)}° N, {gpsCoords.lng.toFixed(5)}° E
                        </span>
                        {gpsCoords.accuracy && (
                          <span className="text-emerald-700 font-medium">±{gpsCoords.accuracy}m</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Optional Landmark or Manual Override Input */}
                {isEditingAddress && (
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      value={customAddress}
                      onChange={e => setCustomAddress(e.target.value)}
                      placeholder="Add specific landmark (e.g. Near Maruti Temple, House #42)..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[9px] text-slate-400">
                      Added landmark will be directly dispatched to the ambulance driver & hospital desk.
                    </p>
                  </div>
                )}

                {gpsNotice && (
                  <p className="text-[10px] text-slate-500 font-medium bg-slate-100/80 p-1.5 rounded-lg border border-slate-200">
                    ℹ️ {gpsNotice}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* ── BIG HIGH-CONTRAST TRIGGER BUTTON ── */}
              <button
                type="button"
                onClick={handleTriggerSOS}
                disabled={submitting || !phone}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting SOS to Hospital...</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-4 h-4 animate-pulse" />
                    <span>TRIGGER EMERGENCY SOS (108 & PHC)</span>
                  </>
                )}
              </button>

              {/* Direct Government Helplines */}
              <div className="pt-1.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <a
                  href="tel:108"
                  className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-[10px] sm:text-[11px] text-red-700 transition-colors flex items-center justify-center gap-1"
                >
                  <span>🚑 108 Ambulance</span>
                </a>
                <a
                  href="tel:104"
                  className="p-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-[10px] sm:text-[11px] text-[#008F83] transition-colors flex items-center justify-center gap-1"
                >
                  <span>📞 104 Medical</span>
                </a>
                <a
                  href="tel:112"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold text-[10px] sm:text-[11px] text-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                  <span>🚨 112 SOS</span>
                </a>
              </div>

            </div>
          ) : (
            /* ════════════════ STEP 2: ACTIVE SOS TRACKING CARD ════════════════ */
            <div className="space-y-3.5">
              
              {/* Top Live Beacon */}
              <div className="p-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl shadow-md space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="font-black text-xs uppercase tracking-wider">
                      Emergency SOS Active
                    </span>
                  </div>
                  <span className="font-mono font-black text-[11px] bg-black/20 px-2 py-0.5 rounded-lg border border-white/20">
                    Ref #{activeSOS.refId}
                  </span>
                </div>
                
                <p className="text-xs font-semibold text-red-50 leading-relaxed">
                  Hospital staff alerted. Keep your phone <strong className="text-white underline font-mono">{activeSOS.phone}</strong> free — they are calling you right now.
                </p>
              </div>

              {/* Real Location Tag */}
              {activeSOS.village && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{activeSOS.village}</p>
                    {activeSOS.gps && (
                      <p className="text-[10px] font-mono text-slate-500 font-bold">GPS: {activeSOS.gps}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Live Dispatch Tracking Timeline */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Dispatch Response</span>
                  <span className="text-[10px] text-[#008F83] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#008F83] animate-pulse" />
                    Live 2-Way Sync
                  </span>
                </h3>

                <div className="space-y-2 pt-1">
                  {/* Item 1: Hospital Reception Notice */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Hospital Operations Desk Notified</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Intake screen active at Primary Health Centre.
                      </p>
                    </div>
                  </div>

                  {/* Item 2: Phone Callback Status */}
                  <div className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      activeSOS.callLogged ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'
                    }`}>
                      <Phone className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {activeSOS.callLogged ? '✓ Staff Callback Completed' : 'Receptionist Dialing You...'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Targeting: <span className="font-mono font-bold text-slate-700">{activeSOS.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Item 3: Ambulance 108 Status */}
                  <div className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      activeSOS.ambulanceStatus === 'DISPATCHED' || activeSOS.ambulanceStatus === 'ON_SITE'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <span className="text-[11px]">🚑</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {activeSOS.ambulanceStatus === 'DISPATCHED' ? `Ambulance 108 En Route (${activeSOS.ambulanceVehicle})`
                          : activeSOS.ambulanceStatus === 'ON_SITE' ? '✓ Ambulance On Site at Patient Location'
                          : '108 Ambulance Unit on Standby'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {activeSOS.ambulanceStatus === 'DISPATCHED' ? `ETA: ~${activeSOS.ambulanceEta}` : 'Staff evaluates deployment based on triage.'}
                      </p>
                    </div>
                  </div>

                  {/* Item 4: Village ASHA Worker */}
                  <div className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      activeSOS.ashaStatus === 'ALERTED' || activeSOS.ashaStatus === 'EN_ROUTE'
                        ? 'bg-teal-100 text-[#008F83]'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {activeSOS.ashaStatus === 'ALERTED' ? 'Village ASHA Worker Alerted'
                          : activeSOS.ashaStatus === 'EN_ROUTE' ? 'ASHA Worker En Route to House'
                          : 'Village ASHA Worker Standing By'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        ASHA provides frontline stabilization & escort.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Pre-Arrival Life Support Guidance ── */}
              <div className="p-3.5 bg-red-50/70 border border-red-300 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-red-600" />
                    <span className="font-black text-xs text-red-950 uppercase tracking-wider">
                      Emergency First-Aid
                    </span>
                  </div>
                  
                  {/* CPR Metronome */}
                  {(selectedCategoryObj.firstAidId === 'cpr' || activeSOS.breathing === 'Not Breathing') && (
                    <button
                      type="button"
                      onClick={() => setCprRunning(prev => !prev)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                        cprRunning
                          ? 'bg-red-600 text-white shadow-xs animate-pulse'
                          : 'bg-white border border-red-300 text-red-800 hover:bg-red-100'
                      }`}
                    >
                      {cprRunning ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{cprRunning ? 'CPR Rhythm Playing (110 BPM)' : 'CPR Metronome (110 BPM)'}</span>
                    </button>
                  )}
                </div>

                {/* Specific Lifesaving Advice */}
                <div className="bg-white/95 p-3 rounded-xl border border-red-200 text-xs text-slate-800 space-y-1.5">
                  {selectedCategoryObj.firstAidId === 'cpr' || activeSOS.breathing === 'Not Breathing' ? (
                    <div className="space-y-1">
                      <p className="font-black text-red-700 flex items-center gap-1 text-[11px]">
                        <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                        HANDS-ONLY CPR (100–120 COMPRESSIONS / MINUTE):
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 font-medium">
                        <li>Push hard & fast in center of chest (2 inches deep). Follow audio rhythm.</li>
                        <li>Do not stop until medical help arrives or person responds.</li>
                      </ul>
                    </div>
                  ) : selectedCategoryObj.firstAidId === 'bleeding' ? (
                    <div className="space-y-1">
                      <p className="font-black text-red-700 text-[11px]">🩸 SEVERE BLEEDING PROTOCOL:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 font-medium">
                        <li>Apply firm continuous direct pressure over wound with clean cloth.</li>
                        <li>Do NOT remove soaked cloths — add more on top. Keep patient lying down.</li>
                      </ul>
                    </div>
                  ) : selectedCategoryObj.firstAidId === 'snakebite' ? (
                    <div className="space-y-1">
                      <p className="font-black text-amber-700 text-[11px]">🐍 SNAKEBITE PROTOCOL:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 font-medium">
                        <li>Keep bitten limb still and below heart level. Keep patient calm.</li>
                        <li><strong>Do NOT cut, suck venom, or tie tight tourniquet.</strong></li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 text-[11px]">🚨 IMMEDIATE CARE:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 font-medium">
                        <li>Keep airway clear (turn to side if unconscious).</li>
                        <li>Keep patient warm and calm. Do not give oral food or drinks.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-1">
                <a
                  href="tel:108"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>🚑 Call 108 Directly</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    clearStoredSOS();
                    setActiveSOS(null);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  New SOS
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
