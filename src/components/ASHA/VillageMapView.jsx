import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin, Navigation, Phone, ActivitySquare, Heart, Baby,
  AlertTriangle, CheckCircle2, Search, Filter, Compass, Building2,
  ExternalLink, ArrowRight, ShieldAlert, Sparkles, RefreshCw
} from "lucide-react";

const MAP_TRANSLATIONS = {
  en: {
    title: "Village Health Map & Patient Navigation",
    subtitle: "Turn-by-turn navigation to patient homes & Shirwal PHC",
    currentLocation: "Your Location",
    detectingGps: "Acquiring GPS fix...",
    gpsActive: "GPS Active",
    gpsDenied: "GPS Off · Using Sector 4 Sub-Centre",
    navigateToPhc: "Navigate to Shirwal PHC",
    phcDistance: "2.4 km away · 8 min drive",
    filterAll: "All Patients",
    filterHighRisk: "High Risk (Red)",
    filterAnc: "Maternal Care (ANC)",
    filterChild: "Children (<5y)",
    searchPlaceholder: "Search patient by name, lane, or condition...",
    navigateToHome: "Navigate to Home",
    callPatient: "Call",
    logVisit: "Log Visit",
    villageOverview: "Village Geolocation Hub",
    emergencySosAlert: "Active Emergency SOS in Village",
    respondToScene: "Navigate to SOS Scene",
    noPatientsFound: "No patients match your search filter"
  },
  mr: {
    title: "गाव आरोग्य नकाशा व रुग्ण दिशादर्शन",
    subtitle: "रुग्णांचे घर व शिरवळ प्राथमिक आरोग्य केंद्रासाठी थेट रस्ता",
    currentLocation: "तुमचे सध्याचे ठिकाण",
    detectingGps: "जीपीएस शोधत आहे...",
    gpsActive: "जीपीएस सक्रिय",
    gpsDenied: "जीपीएस बंद · विभाग ४ उपकेंद्र",
    navigateToPhc: "शिरवळ प्राथमिक केंद्राचा रस्ता",
    phcDistance: "२.४ किमी अंतरावर · ८ मिनिटे",
    filterAll: "सर्व रुग्ण",
    filterHighRisk: "धोकादायक (रेड)",
    filterAnc: "माता संगोपन (ANC)",
    filterChild: "लहान बालके",
    searchPlaceholder: "रुग्णाचे नाव किंवा गल्ली शोधा...",
    navigateToHome: "घराचा रस्ता (Google Maps)",
    callPatient: "फोन करा",
    logVisit: "भेट नोंदवा",
    villageOverview: "गाव नकाशा केंद्र",
    emergencySosAlert: "गावात तातडीची आपत्कालीन मदत मागणी",
    respondToScene: "मदतस्थळी पोहोचा",
    noPatientsFound: "कोणताही रुग्ण सापडला नाही"
  },
  hi: {
    title: "गांव स्वास्थ्य मानचित्र एवं मरीज नेविगेशन",
    subtitle: "मरीजों के घर एवं शिरवल प्राथमिक स्वास्थ्य केंद्र हेतु रास्ता",
    currentLocation: "आपकी वर्तमान स्थिति",
    detectingGps: "जीपीएस प्राप्त हो रहा है...",
    gpsActive: "जीपीएस सक्रिय",
    gpsDenied: "जीपीएस बंद · सेक्टर ४ उपकेंद्र",
    navigateToPhc: "शिरवल प्राथमिक केंद्र का रास्ता",
    phcDistance: "2.4 किमी दूरी · 8 मिनट",
    filterAll: "सभी मरीज",
    filterHighRisk: "गंभीर मरीज",
    filterAnc: "मातृ स्वास्थ्य (ANC)",
    filterChild: "छोटे बच्चे",
    searchPlaceholder: "मरीज का नाम या गली खोजें...",
    navigateToHome: "घर का रास्ता (Google Maps)",
    callPatient: "कॉल करें",
    logVisit: "भेंट दर्ज करें",
    villageOverview: "गांव नक्शा केंद्र",
    emergencySosAlert: "गांव में आपातकालीन सहायता अनुरोध",
    respondToScene: "मदद स्थल का रास्ता",
    noPatientsFound: "कोई मरीज नहीं मिला"
  }
};

export default function VillageMapView({
  patients = [],
  onNavigate,
  onLogVisit,
  activeEmergencySos = null
}) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = MAP_TRANSLATIONS[lang] || MAP_TRANSLATIONS.en;

  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("detecting"); // 'detecting' | 'active' | 'fallback'
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'high_risk' | 'anc' | 'child'
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Auto-acquire ASHA Worker device GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setGpsStatus("active");
        },
        () => {
          // Fallback to Shirwal Sector 4 Sub-Center
          setCurrentCoords({ lat: 17.9812, lng: 74.0234 });
          setGpsStatus("fallback");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setCurrentCoords({ lat: 17.9812, lng: 74.0234 });
      setGpsStatus("fallback");
    }
  }, []);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return (patients || []).filter((p) => {
      // Filter tab
      if (activeFilter === "high_risk" && p.status !== "red" && !p.is_high_risk) return false;
      if (activeFilter === "anc" && !p.is_pregnant) return false;
      if (activeFilter === "child" && !p.is_child && Number(p.age_years) > 5) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = (p.name || "").toLowerCase().includes(query);
        const matchVillage = (p.village || p.lane || "").toLowerCase().includes(query);
        const matchDisease = (p.chronic_condition || p.condition || "").toLowerCase().includes(query);
        return matchName || matchVillage || matchDisease;
      }
      return true;
    });
  }, [patients, activeFilter, searchQuery]);

  // Open Google Maps navigation to a destination
  const openDirections = (destination, label = "Patient Home") => {
    const dest = encodeURIComponent(destination);
    if (currentCoords) {
      const url = `https://maps.google.com/maps?saddr=${currentCoords.lat},${currentCoords.lng}&daddr=${dest}&travelmode=walking`;
      window.open(url, "_blank");
    } else {
      const url = `https://maps.google.com/maps?daddr=${dest}&travelmode=walking`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="pb-28 max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-5 font-sans text-slate-800">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#008F83] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#16324F] leading-tight">
                {t.title}
              </h1>
              <p className="text-xs text-slate-500 font-semibold">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* GPS Status Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#E8F7F3] border border-[#008F83]/30 text-[#008F83]">
            <span className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {gpsStatus === 'active'
                ? `${t.gpsActive} (${currentCoords?.lat?.toFixed(4)}, ${currentCoords?.lng?.toFixed(4)})`
                : gpsStatus === 'detecting'
                ? t.detectingGps
                : t.gpsDenied}
            </span>
          </div>

          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setGpsStatus("active");
                });
              }
            }}
            className="p-2 text-[#008F83] bg-teal-50 hover:bg-teal-100 rounded-xl border border-[#008F83]/20 transition-colors"
            title="Refresh GPS"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Emergency SOS Alert Banner (If Any) ── */}
      {activeEmergencySos && (
        <div className="p-4 bg-red-50 border-2 border-red-400 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                  URGENT CALL
                </span>
                <h3 className="text-sm font-black text-red-950">
                  {t.emergencySosAlert}: {activeEmergencySos.patient_name || "Resident"}
                </h3>
              </div>
              <p className="text-xs text-red-800 mt-0.5 font-medium">
                📍 {activeEmergencySos.village || "Wadgaon Phata"} · Phone: {activeEmergencySos.phone || "108"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const dest = activeEmergencySos.gps || `${activeEmergencySos.village || 'Shirwal'}, Maharashtra`;
              openDirections(dest, "Emergency SOS Location");
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Navigation className="w-4 h-4" />
            <span>{t.respondToScene}</span>
          </button>
        </div>
      )}

      {/* ── Interactive Village Grid & PHC Fast-Track ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🗺️</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {t.villageOverview} · Shirwal Sector 4
            </h3>
          </div>

          {/* Direct Route to PHC */}
          <button
            onClick={() => openDirections("Shirwal Primary Health Centre, Shirwal, Maharashtra", "Shirwal PHC")}
            className="px-4 py-2 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Building2 className="w-4 h-4" />
            <span>{t.navigateToPhc}</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">2.4 km</span>
          </button>
        </div>

        {/* Visual Map Overview Canvas */}
        <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-100 border border-slate-200 shadow-inner">
          {/* Street / Lane Grid SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 600 200" preserveAspectRatio="none">
            {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600].map(x => (
              <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="200" stroke="#008F83" strokeWidth="1" />
            ))}
            {[0, 40, 80, 120, 160, 200].map(y => (
              <line key={`y-${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#008F83" strokeWidth="1" />
            ))}
            {/* Main Roads */}
            <path d="M0,100 Q150,60 300,100 T600,100" stroke="#008F83" strokeWidth="5" fill="none" opacity="0.6" />
            <path d="M300,0 L300,200" stroke="#007A70" strokeWidth="4" opacity="0.5" />
            <path d="M100,0 L500,200" stroke="#008F83" strokeWidth="2" opacity="0.3" />
          </svg>

          {/* Node: Shirwal PHC */}
          <div className="absolute top-4 right-8 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#008F83] text-white flex items-center justify-center text-lg shadow-lg border-2 border-white">
              🏥
            </div>
            <span className="text-[10px] font-black bg-white/95 text-[#008F83] px-2 py-0.5 rounded-full shadow-xs border border-teal-200 mt-1">
              Shirwal PHC (2.4 km)
            </span>
          </div>

          {/* Node: ASHA Current Location */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="relative">
              <span className="w-12 h-12 rounded-full bg-[#008F83]/20 absolute -inset-2 animate-ping" />
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg shadow-lg border-2 border-white relative">
                👩‍⚕️
              </div>
            </div>
            <span className="text-[10px] font-black bg-white/95 text-emerald-800 px-2 py-0.5 rounded-full shadow-xs border border-emerald-200 mt-1">
              ASHA Priya (You)
            </span>
          </div>

          {/* Node: Village Lane 1 (High Risk Patient) */}
          <div className="absolute bottom-6 left-12 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm shadow-md border border-white">
              ⚠️
            </div>
            <span className="text-[9px] font-bold bg-white/90 text-red-700 px-1.5 py-0.5 rounded shadow-xs mt-0.5">
              Lane 2 · High-Risk
            </span>
          </div>

          {/* Node: Village Lane 3 (ANC Maternal) */}
          <div className="absolute top-8 left-20 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm shadow-md border border-white">
              🤰
            </div>
            <span className="text-[9px] font-bold bg-white/90 text-rose-700 px-1.5 py-0.5 rounded shadow-xs mt-0.5">
              Lane 4 · ANC Mothers
            </span>
          </div>

          {/* Node: Village Lane 5 (Children) */}
          <div className="absolute bottom-8 right-24 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow-md border border-white">
              👶
            </div>
            <span className="text-[9px] font-bold bg-white/90 text-amber-800 px-1.5 py-0.5 rounded shadow-xs mt-0.5">
              Lane 1 · Immunization
            </span>
          </div>

          {/* Direct Map View Button */}
          <a
            href="https://maps.google.com/maps?q=Shirwal,+Maharashtra,+India&z=15"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#008F83] shadow-xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: "all", label: t.filterAll, icon: "👥" },
            { key: "high_risk", label: t.filterHighRisk, icon: "⚠️" },
            { key: "anc", label: t.filterAnc, icon: "🤰" },
            { key: "child", label: t.filterChild, icon: "👶" }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-2 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === f.key
                  ? "bg-[#008F83] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Patient Home Navigation Cards List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{filteredPatients.length} patient homes registered in sector</span>
          <span>Tap "Navigate to Home" for GPS directions</span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400 space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold">{t.noPatientsFound}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredPatients.map((p) => {
              const isRed = p.status === "red" || p.is_high_risk;
              const villageDest = p.village || "Shirwal Sector 4";
              const patientLocation = `${p.name || 'Patient'} Home, ${villageDest}, Maharashtra, India`;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition-all hover:border-[#008F83]/60 ${
                    isRed ? "border-l-4 border-l-red-500 border-slate-200" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Patient Info Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isRed ? "bg-red-50 text-red-600 border border-red-100" : "bg-[#E8F7F3] text-[#008F83] border border-[#008F83]/20"
                        }`}>
                          {p.name ? p.name[0].toUpperCase() : "P"}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                            {p.name || "Village Patient"}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {p.gender || "Resident"} · {p.age_years ? `${p.age_years} yrs` : "Adult"} · {p.relation_to_head || "Member"}
                          </p>
                        </div>
                      </div>

                      {/* Tag Badge */}
                      <div className="flex flex-col items-end gap-1">
                        {p.is_pregnant && (
                          <span className="text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
                            ANC Mother
                          </span>
                        )}
                        {p.is_child && (
                          <span className="text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                            Child &lt;5y
                          </span>
                        )}
                        {isRed && (
                          <span className="text-[9px] font-black bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                            High-Risk ⚠️
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address & Condition */}
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#008F83] shrink-0" />
                        <span className="truncate">{villageDest}</span>
                      </div>
                      {p.chronic_condition && (
                        <p className="text-[11px] text-slate-500 pl-5">
                          Health Note: {p.chronic_condition}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {/* Primary GPS Navigation Button */}
                    <button
                      onClick={() => openDirections(patientLocation, p.name)}
                      className="flex-1 py-2 bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Open GPS Directions in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{t.navigateToHome}</span>
                    </button>

                    {/* Direct Phone Call */}
                    {p.mobile && (
                      <a
                        href={`tel:${p.mobile}`}
                        className="p-2 bg-[#E8F7F3] hover:bg-teal-100 text-[#008F83] border border-[#008F83]/30 rounded-xl transition-colors cursor-pointer"
                        title="Call Patient"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {/* Log Home Visit */}
                    {onLogVisit && (
                      <button
                        onClick={() => onLogVisit(p)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Log Clinical Home Visit"
                      >
                        <ActivitySquare className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
