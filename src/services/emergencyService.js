import { supabase } from './supabase';

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
 * Submit an Emergency SOS request to Supabase
 * Works without login (uses fallback zeroes UUID if no patient_id provided).
 */
export async function submitEmergencySOS(payload) {
  const {
    patientId,
    callerPhone,
    callerName,
    village,
    gpsCoords, // { lat, lng }
    categoryId,
    consciousness = 'Conscious',
    breathing = 'Normal',
    dangerSigns = [],
    additionalNotes = '',
    facility = 'Shrirampur Primary Health Centre'
  } = payload;

  const catObj = EMERGENCY_CATEGORIES.find(c => c.id === categoryId) || EMERGENCY_CATEGORIES[0];
  const referenceId = `SOS-MH-${Math.floor(1000 + Math.random() * 9000)}`;

  // Formulate notes string for robust cross-system parsing
  const gpsString = gpsCoords ? `${gpsCoords.lat.toFixed(5)},${gpsCoords.lng.toFixed(5)}` : 'UNKNOWN';
  const mapsLink = gpsCoords ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : '';
  
  const notesString = [
    `REF:${referenceId}`,
    `PHONE:${callerPhone}`,
    `VILLAGE:${village || 'Unspecified'}`,
    `GPS:${gpsString}`,
    `CAT:${catObj.cadCategory}`,
    `NATURE:${catObj.label}`,
    `CONSCIOUS:${consciousness}`,
    `BREATHING:${breathing}`,
    `SIGNS:${dangerSigns.join(', ') || 'None specified'}`,
    `SOS_ACTIVE:true`,
    `CALL_LOGGED:false`,
    `AMBULANCE_STATUS:NONE`,
    `ASHA_STATUS:NONE`,
    `DOCTOR_STATUS:NONE`,
    `TIME:${new Date().toISOString()}`
  ].join(' | ');

  const reasonString = `[EMERGENCY SOS ${catObj.cadCategory}] ${catObj.label}. Caller: ${callerPhone}, Location: ${village || 'Near PHC'}. Consciousness: ${consciousness}, Breathing: ${breathing}. ${additionalNotes ? `Notes: ${additionalNotes}.` : ''} ${mapsLink ? `Map: ${mapsLink}` : ''}`;

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
    facility: facility || 'Shrirampur Primary Health Centre',
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

  return {
    success: true,
    data,
    referenceId,
    recordId: data.id
  };
}

/**
 * Fetch all active Emergency SOS records (for Hospital Staff & Doctor)
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
  // Fetch current record first to preserve notes
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
