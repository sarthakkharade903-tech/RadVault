import { supabase } from './supabase';
import { getNearestFacility } from './locationService';

/**
 * Emergency Categories aligned with International Computer-Aided Dispatch (CAD)
 * CAT 1: Immediately Life-Threatening (Cardiac arrest, massive bleeding, airway loss)
 * CAT 2: Emergency (Chest pain, stroke, major trauma, snakebite)
 * CAT 3: Urgent (Fractures, severe pain, high fever with lethargy)
 * CAT 4: Standard / Non-Emergency
 */
export const EMERGENCY_CATEGORIES = [
  {
    id: 'CARDIAC',
    label: 'Cardiac / Chest Pain / Unconscious',
    icon: '🫀',
    cadCategory: 'CAT 1',
    cadColor: 'bg-red-600 text-white',
    targetResponse: '< 8 mins',
    dangerSigns: ['Crushing chest pressure', 'Radiation to arm/jaw', 'Sweating & pale skin', 'Unresponsive'],
    firstAidId: 'cpr'
  },
  {
    id: 'BLEEDING',
    label: 'Severe Bleeding / Major Trauma',
    icon: '🩸',
    cadCategory: 'CAT 1',
    cadColor: 'bg-red-600 text-white',
    targetResponse: '< 8 mins',
    dangerSigns: ['Pumping arterial blood', 'Deep laceration', 'Amputation', 'Cold clammy skin'],
    firstAidId: 'bleeding'
  },
  {
    id: 'MATERNAL',
    label: 'Active Labour / Pregnancy Emergency',
    icon: '🤰',
    cadCategory: 'CAT 1',
    cadColor: 'bg-rose-600 text-white',
    targetResponse: '< 10 mins',
    dangerSigns: ['Contractions < 2 mins apart', 'Water broke with meconium', 'Vaginal bleeding', 'Severe headache/seizures'],
    firstAidId: 'maternal'
  },
  {
    id: 'SNAKEBITE',
    label: 'Snakebite / Scorpion / Poisoning',
    icon: '🐍',
    cadCategory: 'CAT 2',
    cadColor: 'bg-amber-600 text-white',
    targetResponse: '< 15 mins',
    dangerSigns: ['Fang puncture marks', 'Rapid swelling', 'Drooping eyelids / ptosis', 'Vomiting / breathing trouble'],
    firstAidId: 'snakebite'
  },
  {
    id: 'BREATHING',
    label: 'Severe Breathing Trouble / Choking',
    icon: '🫁',
    cadCategory: 'CAT 1',
    cadColor: 'bg-red-600 text-white',
    targetResponse: '< 8 mins',
    dangerSigns: ['Unable to speak full sentences', 'Bluish lips/fingernails (cyanosis)', 'Stridor / high-pitched sound', 'Severe wheezing'],
    firstAidId: 'choking'
  },
  {
    id: 'ACCIDENT',
    label: 'Road Accident / High-Impact Fall',
    icon: '💥',
    cadCategory: 'CAT 2',
    cadColor: 'bg-orange-600 text-white',
    targetResponse: '< 15 mins',
    dangerSigns: ['Head trauma / altered mental status', 'Deformed bone', 'Neck/spine pain', 'Multiple casualties'],
    firstAidId: 'trauma'
  },
  {
    id: 'OTHER',
    label: 'Other Acute Medical Crisis',
    icon: '🚨',
    cadCategory: 'CAT 2',
    cadColor: 'bg-indigo-600 text-white',
    targetResponse: '< 18 mins',
    dangerSigns: ['High fever with delirium', 'Severe abdominal colic', 'Acute allergic anaphylaxis'],
    firstAidId: 'general'
  }
];

/**
 * Reverse geocode GPS coordinates to a real human-readable street address
 * Features fast catchment resolution + browser-compatible client geocoder with Open CORS
 */
export async function fetchRealAddressFromCoords(lat, lng) {
  if (!lat || !lng) return null;

  // Fast verified catchment resolution for Pune / Shirwal / Shrirampur
  const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2)**2 + (y1 - y2)**2);
  if (dist(lat, lng, 18.48778, 73.85197) < 0.05) {
    return 'Sahakar Nagar, Pune, Maharashtra, 411001';
  }
  if (dist(lat, lng, 18.1363, 73.9856) < 0.05) {
    return 'Shirwal Rural Catchment, Khandala, Satara, 412801';
  }
  if (dist(lat, lng, 19.6174, 74.6559) < 0.05) {
    return 'Main Road, Shrirampur, Ahmednagar, Maharashtra, 413709';
  }

  // 1. Browser-compatible client-side reverse geocoding via BigDataCloud (Open CORS, no custom header needed)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const d = await res.json();
      const parts = [
        d.locality,
        d.city,
        d.principalSubdivision,
        d.postcode
      ].filter(Boolean);
      const uniqueParts = parts.filter((item, idx) => parts.indexOf(item) === idx);
      if (uniqueParts.length > 0) return uniqueParts.join(', ');
    }
  } catch (err) {
    console.warn('[emergencyService] Client geocode notice:', err.message);
  }

  // 2. Fallback to OpenStreetMap Photon
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.features?.[0]?.properties) {
        const p = data.features[0].properties;
        const parts = [p.name, p.street, p.district, p.city, p.state, p.postcode].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }
  } catch (err) {
    console.warn('[emergencyService] Photon notice:', err.message);
  }

  return `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
}

/**
 * Validate phone number (allows standard 10-digit Indian numbers starting with 6,7,8,9 or landline)
 */
export function validatePhoneNumber(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) return true;
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]\d{9}$/.test(cleaned)) return true;
  return cleaned.length >= 8;
}

/**
 * Session persistence for active SOS
 */
const SOS_STORAGE_KEY = 'radvault_active_sos_id';

export function getActiveStoredSOSId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SOS_STORAGE_KEY);
}

export function saveActiveStoredSOS(id) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOS_STORAGE_KEY, id);
}

export function clearStoredSOS() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SOS_STORAGE_KEY);
}

/**
 * Trigger an Emergency SOS (writes directly to care_requests in Supabase)
 * Minimal parameter set for sub-5-second dispatch:
 * { patientId, callerPhone, realAddress, gpsCoords, categoryId }
 */
export async function submitEmergencySOS(payload) {
  const {
    patientId,
    callerPhone,
    callerName = 'Emergency Caller',
    village,
    realAddress,
    gpsCoords, // { lat, lng }
    categoryId,
    consciousness = 'Conscious',
    breathing = 'Normal',
    dangerSigns = [],
    additionalNotes = '',
    facility
  } = payload;

  const resolvedFacility = facility || (gpsCoords ? getNearestFacility(gpsCoords.lat, gpsCoords.lng)?.name : 'Pune Sassoon General Hospital') || 'Pune Sassoon General Hospital';

  const catObj = EMERGENCY_CATEGORIES.find(c => c.id === categoryId) || EMERGENCY_CATEGORIES[0];
  const referenceId = `SOS-MH-${Math.floor(1000 + Math.random() * 9000)}`;

  const resolvedLocation = realAddress || village || 'Current Location (GPS Active)';
  const gpsString = gpsCoords ? `${gpsCoords.lat.toFixed(5)},${gpsCoords.lng.toFixed(5)}` : 'UNKNOWN';
  const mapsLink = gpsCoords ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : '';
  
  const notesString = [
    `REF:${referenceId}`,
    `PHONE:${callerPhone}`,
    `VILLAGE:${resolvedLocation}`,
    `GPS:${gpsString}`,
    `CAT:${catObj.cadCategory}`,
    `NATURE:${catObj.label}`,
    `CONSCIOUS:${consciousness}`,
    `BREATHING:${breathing}`,
    `SIGNS:${dangerSigns.join(', ') || 'Acute Medical Emergency'}`,
    `SOS_ACTIVE:true`,
    `CALL_LOGGED:false`,
    `AMBULANCE_STATUS:NONE`,
    `ASHA_STATUS:NONE`,
    `DOCTOR_STATUS:NONE`,
    `TIME:${new Date().toISOString()}`
  ].join(' | ');

  const reasonString = `[EMERGENCY SOS ${catObj.cadCategory}] ${catObj.label}. Caller: ${callerPhone}, Location: ${resolvedLocation}. ${mapsLink ? `Map: ${mapsLink}` : ''}`;

  // Safe fallback UUID if user is not logged in
  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const resolvedPatientId = (patientId && isValidUuid(patientId)) ? patientId : '00000000-0000-0000-0000-000000000000';

  const record = {
    patient_id: resolvedPatientId,
    patient_name: callerName || 'Emergency Caller',
    source: 'EMERGENCY_SOS',
    priority: 'EMERGENCY',
    reason: reasonString,
    asha_notes: notesString,
    status: 'PENDING_DISPATCH',
    slot_preference: `SOS #${referenceId} · ${catObj.cadCategory}`,
    facility: resolvedFacility,
    department: 'Emergency Casualty & Trauma',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('care_requests')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('[emergencyService] Supabase insert error:', error);
    throw new Error(error.message || 'Failed to submit Emergency SOS');
  }

  saveActiveStoredSOS(data.id);

  return {
    success: true,
    data,
    referenceId,
    recordId: data.id
  };
}

/**
 * Fetch a single SOS record by ID (used for session recovery)
 */
export async function getEmergencySOSById(id) {
  try {
    const { data, error } = await supabase
      .from('care_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return parseEmergencyRecord(data);
  } catch (err) {
    console.warn('[emergencyService] getEmergencySOSById error:', err);
    return null;
  }
}

/**
 * Fetch all active Emergency SOS records (for Hospital Staff, Doctor & ASHA)
 */
export async function getActiveEmergencySOS() {
  try {
    const { data, error } = await supabase
      .from('care_requests')
      .select('*')
      .eq('source', 'EMERGENCY_SOS')
      .neq('status', 'COMPLETED')
      .neq('status', 'RESOLVED')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[emergencyService] getActiveEmergencySOS error:', error.message);
      return [];
    }

    return (data || []).map(parseEmergencyRecord);
  } catch (err) {
    console.warn('[emergencyService] Error:', err);
    return [];
  }
}

/**
 * Helper to parse emergency fields from asha_notes and reason
 */
export function parseEmergencyRecord(row) {
  const notes = row.asha_notes || '';
  const getField = (prefix) => {
    const match = notes.match(new RegExp(`${prefix}:\\s*([^|]+)`, 'i'));
    return match ? match[1].trim() : null;
  };

  const refId = getField('REF') || row.slot_preference?.match(/SOS\s*#?([A-Z0-9-]+)/i)?.[1] || row.id?.slice(0, 8);
  const phone = getField('PHONE') || row.reason?.match(/Caller:\s*([0-9+]+)/i)?.[1] || '';
  const village = getField('VILLAGE') || row.reason?.match(/Location:\s*([^.]+)/i)?.[1] || 'Primary Health Centre Area';
  const gps = getField('GPS');
  const cadCategory = getField('CAT') || (row.reason?.includes('CAT 1') ? 'CAT 1' : 'CAT 2');
  const nature = getField('NATURE') || row.department || 'Acute Medical Emergency';
  const consciousness = getField('CONSCIOUS') || 'Conscious';
  const breathing = getField('BREATHING') || 'Normal';
  const signs = getField('SIGNS') || '';
  const ambulanceStatus = getField('AMBULANCE_STATUS') || 'NONE'; // NONE, DISPATCHED, ON_SITE
  const ambulanceEta = getField('AMBULANCE_ETA') || '10-15 mins';
  const ambulanceVehicle = getField('AMBULANCE_VEHICLE') || '108-MH-12-8821';
  const ashaStatus = getField('ASHA_STATUS') || 'NONE'; // NONE, ALERTED, EN_ROUTE
  const callLogged = getField('CALL_LOGGED') === 'true';
  const doctorStatus = getField('DOCTOR_STATUS') || 'NONE';

  const mapsLink = (gps && gps !== 'UNKNOWN') ? `https://maps.google.com/?q=${gps}` : null;

  return {
    ...row,
    refId,
    phone,
    village,
    gps,
    mapsLink,
    cadCategory,
    nature,
    consciousness,
    breathing,
    signs,
    ambulanceStatus,
    ambulanceEta,
    ambulanceVehicle,
    ashaStatus,
    callLogged,
    doctorStatus
  };
}

/**
 * Update an Emergency SOS record's status & dispatch notes
 */
export async function updateEmergencyDispatch(id, updates) {
  const { data: current } = await supabase
    .from('care_requests')
    .select('asha_notes, status')
    .eq('id', id)
    .maybeSingle();

  let notes = current?.asha_notes || '';

  // Update specific fields in notes string
  Object.entries(updates).forEach(([key, val]) => {
    const fieldKey = key.toUpperCase();
    const regex = new RegExp(`${fieldKey}:\\s*[^|]+`, 'i');
    if (regex.test(notes)) {
      notes = notes.replace(regex, `${fieldKey}:${val}`);
    } else {
      notes += ` | ${fieldKey}:${val}`;
    }
  });

  const payload = {
    asha_notes: notes,
    updated_at: new Date().toISOString()
  };

  if (updates.status) {
    payload.status = updates.status;
    if (updates.status === 'RESOLVED' || updates.status === 'COMPLETED') {
      clearStoredSOS();
    }
  }

  const { data, error } = await supabase
    .from('care_requests')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[emergencyService] updateEmergencyDispatch error:', error);
    throw error;
  }

  return parseEmergencyRecord(data);
}

