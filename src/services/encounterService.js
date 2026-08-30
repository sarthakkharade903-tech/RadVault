/**
 * RadVault Encounter & ASHA Care Coordination Service
 *
 * Operational concepts:
 * - Patient is persistent across care interactions.
 * - Encounter is a single care interaction (symptoms, vitals, danger signs, triage, consultation/advice).
 * - Enforces offline-ready local persistence while synchronizing with Supabase referrals.
 * - Supports automatic and manual cloud synchronization when network is available.
 * - Comprehensive frontline follow-up lifecycle tracking and deterministic next-action generation.
 */

import { supabase } from './supabase';

const ENCOUNTERS_STORAGE_KEY = 'radvault_asha_encounters_v1';

// Seed demo encounters for initial ASHA workflow demonstration
const INITIAL_SEED_ENCOUNTERS = [
  {
    id: 'ENC-20260826-001',
    patientId: 'd1111111-1111-1111-1111-111111111111',
    patientUnifiedId: 'MH-P-10482',
    patientName: 'Rajesh Kumar',
    date: '2026-08-25T10:30:00Z',
    complaint: 'Chest tightness and intermittent breathlessness',
    symptoms: ['Chest pain', 'Breathing difficulty', 'Fatigue'],
    vitals: { bp: '142/90', pulse: '88', spo2: '95', temp: '98.6', respRate: '20', weight: '68' },
    dangerSigns: ['Crushing chest pain, pressure, or radiating pain to arm/jaw'],
    priority: 'HIGH',
    priorityLabel: 'Emergency / Immediate Attention',
    aiNote: 'High risk acute cardiovascular presentation with hypertensive vitals. Immediate specialist consultation recommended.',
    outcome: 'REFERRAL_CREATED',
    referralId: 'REF-20260825-901',
    referralStatus: 'Pending',
    hospital: 'Pune Sassoon General Hospital',
    department: 'Cardiology',
    doctor: 'On-Duty Specialist',
    ashaWorker: 'Sunita Deshmukh (ASHA)',
    followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
    followUpReason: 'Verify hospital admission and post-cardiac evaluation status',
    followUpCompleted: false,
    syncStatus: 'SYNCED',
    status: 'ACTIVE'
  },
  {
    id: 'ENC-20260824-002',
    patientId: 'PAT-89210',
    patientUnifiedId: 'MH-P-89210',
    patientName: 'Rohan Verma',
    date: '2026-08-24T14:15:00Z',
    complaint: 'Routine antenatal / hypertension follow-up check',
    symptoms: ['Mild headache'],
    vitals: { bp: '122/80', pulse: '74', spo2: '98', temp: '98.4', respRate: '16', weight: '71' },
    dangerSigns: [],
    priority: 'LOW',
    priorityLabel: 'Routine / Local Care',
    aiNote: 'Stable vital parameters. Blood pressure within normal control range under regular medications.',
    outcome: 'LOCAL_ADVICE',
    referralId: null,
    referralStatus: null,
    hospital: null,
    department: null,
    doctor: null,
    ashaWorker: 'Sunita Deshmukh (ASHA)',
    followUpDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // Yesterday (Overdue)
    followUpReason: 'Routine blood pressure check and medication replenishment',
    followUpCompleted: false,
    syncStatus: 'LOCAL_DRAFT',
    status: 'COMPLETED'
  }
];

export function getStoredEncounters() {
  try {
    const isDemoDataEnabled = typeof localStorage !== 'undefined'
      ? localStorage.getItem('radvault_demo_data_enabled') !== 'false'
      : true;

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ENCOUNTERS_STORAGE_KEY) : null;
    if (!raw) {
      if (isDemoDataEnabled) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ENCOUNTERS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ENCOUNTERS));
        }
        return INITIAL_SEED_ENCOUNTERS;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!isDemoDataEnabled) {
      return (parsed || []).filter(
        (e) => !e.id?.startsWith('ENC-20260826-001') && !e.id?.startsWith('ENC-20260824-002')
      );
    }
    return parsed;
  } catch (err) {
    console.error('Error reading encounters from storage:', err);
    return [];
  }
}

export function saveStoredEncounters(encounters) {
  try {
    localStorage.setItem(ENCOUNTERS_STORAGE_KEY, JSON.stringify(encounters));
  } catch (err) {
    console.error('Error saving encounters to storage:', err);
  }
}

/**
 * Save a new encounter and optionally create Supabase referral / consultation
 */
export async function createEncounter({
  patient,
  complaint,
  symptoms = [],
  symptomNotes = '',
  vitals = {},
  relevantHistory = [],
  dangerSigns = [],
  priority = 'LOW',
  priorityLabel = 'Routine',
  aiNote = '',
  actionType = 'LOCAL_ADVICE', // 'REFERRAL' | 'LOCAL_ADVICE' | 'FOLLOW_UP'
  referralData = null,
  followUpDate = null,
  followUpReason = '',
  ashaWorkerName = 'ASHA Worker',
  ashaWorkerId = null, // Passed from client profile UUID
  isDemoMode = false
}) {
  const localEncounterId = `ENC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  let createdReferralId = null;
  let referralPayload = null;

  // 1. If a referral / consultation was created, construct payload and insert it
  if (!isDemoMode && actionType === 'REFERRAL' && referralData) {
    let destination_facility_id = referralData.facilityId || null;
    let actual_destination_hospital = referralData.hospital;

    if (!destination_facility_id) {
      try {
        // Clean up string mismatch between ASHA mock array and DB seed
        let searchName = referralData.hospital || '';
        if (searchName === 'Primary Health Centre — Shrirampur') {
          searchName = 'Shrirampur Primary Health Centre';
          actual_destination_hospital = searchName;
        }

        // Lookup facility_id so PHC staff can actually query it
        const { data: fac } = await supabase
          .from('facilities')
          .select('id, name')
          .ilike('name', `%${searchName.split(' ')[0]}%`) // Loose match
          .limit(1)
          .maybeSingle();

        if (fac) {
          destination_facility_id = fac.id;
          actual_destination_hospital = fac.name;
        } else {
          // Ultimate fallback to default facility in DB
          const { data: anyFac } = await supabase.from('facilities').select('id, name').limit(1).maybeSingle();
          if (anyFac) {
            destination_facility_id = anyFac.id;
            actual_destination_hospital = anyFac.name;
          }
        }
      } catch (e) {
        console.warn('[RADVAULT] Facility lookup warning:', e.message);
      }
    }

    referralPayload = {
      patient_id: patient.id, // MUST be UUID! patient.unified_id will crash postgres type cast
      patient_name: patient.full_name || patient.name,
      created_by: `ASHA Worker: ${ashaWorkerName}`,
      destination_facility_id: destination_facility_id,
      destination_hospital: actual_destination_hospital,
      destination_department: referralData.department,
      doctor_assigned: referralData.doctor || 'On-Duty Specialist',
      priority: priority,
      priority_label: priorityLabel,
      status: 'Pending',
      symptoms: `${complaint}. Notes: ${symptomNotes}`,
      vitals: vitals,
      ai_note: aiNote || 'Frontline ASHA triage assessment.'
    };

    console.log(`[RADVAULT][REFERRAL_CREATE] Initiating referral insert -> Patient: ${patient.id} (${patient.full_name || patient.name}), Destination Facility: ${destination_facility_id} (${actual_destination_hospital}), Priority: ${priority}, Status: Pending`);

    try {
      const { data, error } = await supabase
        .from('referrals')
        .insert([referralPayload])
        .select();

      if (error) {
        console.error('[RADVAULT][REFERRAL_CREATE] Supabase error:', error.message);
      } else if (data && data.length > 0) {
        createdReferralId = data[0].id;
        console.log(`[RADVAULT][REFERRAL_CREATE] Referral successfully persisted in DB. Referral ID: ${createdReferralId}, Destination Facility: ${destination_facility_id}`);
      }
    } catch (err) {
      console.error('[RADVAULT][REFERRAL_CREATE] Exception:', err.message);
    }
  }

  // 2. Insert encounter into Supabase encounters table in Real Mode
  let createdEncounterId = null;
  if (!isDemoMode) {
    let resolvedAshaId = ashaWorkerId;
    if (!resolvedAshaId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: awProfile } = await supabase
            .from('asha_workers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (awProfile) resolvedAshaId = awProfile.id;
        }
      } catch (e) {
        console.warn('Failed to resolve ASHA worker ID dynamically:', e.message);
      }
    }

    if (resolvedAshaId) {
      const encounterPayload = {
        local_id: localEncounterId,
        patient_id: patient.id, // Supabase UUID
        asha_id: resolvedAshaId, // Supabase UUID
        complaint,
        symptoms,
        symptom_notes: symptomNotes,
        vitals,
        danger_signs: dangerSigns,
        priority,
        priority_label: priorityLabel,
        ai_note: aiNote,
        outcome: actionType === 'REFERRAL' ? 'REFERRAL_CREATED' : 'LOCAL_ADVICE',
        referral_id: createdReferralId,
        follow_up_date: followUpDate || referralData?.followUpDate || null,
        follow_up_reason: followUpReason || (actionType === 'REFERRAL' ? `Verify ${referralData?.hospital || 'hospital'} visit` : 'Routine follow-up'),
        follow_up_completed: false
      };

      try {
        const { data, error } = await supabase
          .from('encounters')
          .insert([encounterPayload])
          .select();

        if (!error && data && data.length > 0) {
          createdEncounterId = data[0].id;
        }
      } catch (err) {
        console.warn('Supabase encounter direct save note (persisting as local draft):', err.message);
      }
    }
  }

  // 3. Determine synchronization state
  const syncStatus = (isDemoMode || createdEncounterId) ? 'SYNCED' : 'LOCAL_DRAFT';

  // 4. Construct persistent encounter record for local storage
  const newEncounter = {
    id: createdEncounterId || localEncounterId,
    patientId: patient.id,
    patientUnifiedId: patient.unified_id || patient.id,
    patientName: patient.full_name || patient.name,
    date: new Date().toISOString(),
    complaint,
    symptoms,
    symptomNotes,
    vitals,
    relevantHistory,
    dangerSigns,
    priority,
    priorityLabel,
    aiNote,
    outcome: actionType === 'REFERRAL' ? 'REFERRAL_CREATED' : 'LOCAL_ADVICE',
    referralId: createdReferralId,
    referralPayload: (actionType === 'REFERRAL' && !createdReferralId) ? referralPayload : null, // Kept for offline sync retry
    referralStatus: actionType === 'REFERRAL' ? 'Pending' : null,
    hospital: referralData?.hospital || null,
    department: referralData?.department || null,
    doctor: referralData?.doctor || null,
    ashaWorker: ashaWorkerName,
    followUpDate: followUpDate || referralData?.followUpDate || null,
    followUpReason: followUpReason || (actionType === 'REFERRAL' ? `Verify ${referralData?.hospital || 'hospital'} visit` : 'Routine follow-up'),
    followUpCompleted: false,
    syncStatus,
    status: 'ACTIVE'
  };

  // 5. Save to local encounter storage
  const encounters = getStoredEncounters();
  encounters.unshift(newEncounter);
  saveStoredEncounters(encounters);

  return newEncounter;
}

/**
 * Synchronize all pending offline referral encounters to Supabase
 */
export async function syncPendingEncounters(isDemoMode = false) {
  const encounters = getStoredEncounters();
  let syncedCount = 0;
  let failedCount = 0;

  if (isDemoMode) {
    return {
      syncedCount: 0,
      failedCount: 0,
      remainingPending: 0
    };
  }

  // Get active user ID to resolve asha_id
  let resolvedAshaId = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: awProfile } = await supabase
        .from('asha_workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (awProfile) resolvedAshaId = awProfile.id;
    }
  } catch (e) {
    console.warn('Failed to resolve ASHA worker ID for offline sync:', e.message);
  }

  const updatedEncounters = await Promise.all(
    encounters.map(async (enc) => {
      if (enc.syncStatus === 'LOCAL_DRAFT' && resolvedAshaId) {
        try {
          let referralId = enc.referralId;

          // 1. If it has a pending referral payload, sync referral first
          if (enc.referralPayload && !referralId) {
            const { data: refData, error: refErr } = await supabase
              .from('referrals')
              .insert([enc.referralPayload])
              .select();

            if (!refErr && refData && refData.length > 0) {
              referralId = refData[0].id;
            } else if (refErr) {
              console.error('Offline sync failed for referral:', refErr.message);
            }
          }

          // 2. Sync the encounter
          const encounterPayload = {
            local_id: enc.id,
            patient_id: enc.patientId, // Supabase UUID
            asha_id: resolvedAshaId,
            complaint: enc.complaint,
            symptoms: enc.symptoms,
            symptom_notes: enc.symptomNotes,
            vitals: enc.vitals,
            danger_signs: enc.dangerSigns,
            priority: enc.priority,
            priority_label: enc.priorityLabel,
            ai_note: enc.aiNote,
            outcome: enc.outcome,
            referral_id: referralId,
            follow_up_date: enc.followUpDate,
            follow_up_reason: enc.followUpReason,
            follow_up_completed: enc.followUpCompleted,
            follow_up_completed_at: enc.followUpCompletedAt,
            follow_up_outcome: enc.followUpOutcome,
            follow_up_resolution_note: enc.followUpResolutionNote
          };

          const { data: encData, error: encErr } = await supabase
            .from('encounters')
            .insert([encounterPayload])
            .select();

          if (!encErr && encData && encData.length > 0) {
            syncedCount++;
            return {
              ...enc,
              id: encData[0].id, // Replace with remote UUID
              referralId,
              referralPayload: null,
              syncStatus: 'SYNCED'
            };
          } else {
            failedCount++;
            return enc;
          }
        } catch (err) {
          console.warn('Sync retry error for encounter', enc.id, err.message);
          failedCount++;
          return enc;
        }
      }
      return enc;
    })
  );

  saveStoredEncounters(updatedEncounters);

  return {
    syncedCount,
    failedCount,
    remainingPending: updatedEncounters.filter(
      (e) => e.syncStatus === 'LOCAL_DRAFT'
    ).length
  };
}

/**
 * Get count of encounters currently pending cloud synchronization
 */
export function getPendingSyncCount() {
  const encounters = getStoredEncounters();
  return encounters.filter(
    (e) => e.syncStatus === 'LOCAL_DRAFT'
  ).length;
}

/**
 * Safe helper to retrieve synchronization status with backward-compatibility for older records
 */
export function getEncounterSyncStatus(encounter) {
  if (encounter?.syncStatus) {
    return encounter.syncStatus;
  }
  if (encounter?.referralId || encounter?.outcome === 'REFERRAL_CREATED') {
    return 'SYNCED';
  }
  return 'LOCAL_DRAFT';
}

/**
 * Mark a frontline follow-up as completed with detailed action outcome
 */
export async function completeFollowUp(encounterId, resolutionNote = '', outcomeStatus = 'COMPLETED', nextFollowUpDate = null, isDemoMode = false) {
  const encounters = getStoredEncounters();
  let targetEncounter = null;
  const updated = encounters.map((enc) => {
    if (enc.id === encounterId) {
      targetEncounter = {
        ...enc,
        followUpCompleted: outcomeStatus !== 'RESCHEDULED',
        followUpCompletedAt: new Date().toISOString(),
        followUpResolutionNote: resolutionNote,
        followUpOutcome: outcomeStatus,
        followUpDate: nextFollowUpDate || enc.followUpDate,
        status: outcomeStatus === 'RESCHEDULED' ? 'ACTIVE' : 'COMPLETED'
      };
      return targetEncounter;
    }
    return enc;
  });
  saveStoredEncounters(updated);

  // If in Real Mode, sync this update to Supabase
  if (!isDemoMode && targetEncounter) {
    try {
      const queryIdField = encounterId.startsWith('ENC-') ? 'local_id' : 'id';
      
      const { error: encUpdateErr } = await supabase
        .from('encounters')
        .update({
          follow_up_completed: outcomeStatus !== 'RESCHEDULED',
          follow_up_completed_at: targetEncounter.followUpCompletedAt,
          follow_up_resolution_note: resolutionNote,
          follow_up_outcome: outcomeStatus,
          follow_up_date: targetEncounter.followUpDate
        })
        .eq(queryIdField, encounterId);

      if (encUpdateErr) {
        console.error('Failed to update Supabase encounter follow-up:', encUpdateErr.message);
      }

      if (targetEncounter.referralId) {
        const referralStatusMap = {
          COMPLETED: 'Completed',
          PATIENT_WENT_FACILITY: 'Completed',
          RESCHEDULED: 'Pending',
          REFUSED: 'Cancelled'
        };
        const nextStatus = referralStatusMap[outcomeStatus] || 'Completed';

        const { error: refUpdateErr } = await supabase
          .from('referrals')
          .update({ status: nextStatus })
          .eq('id', targetEncounter.referralId);

        if (refUpdateErr) {
          console.error('Failed to update Supabase referral status on follow-up:', refUpdateErr.message);
        }
      }
    } catch (err) {
      console.warn('Supabase follow-up sync warning:', err.message);
    }
  }

  return updated;
}

/**
 * Get categorized follow-up tasks (Overdue, Due Today, Upcoming, Completed)
 */
export function getFollowUpTasks() {
  const encounters = getStoredEncounters();
  const todayStr = new Date().toISOString().slice(0, 10);

  const activeWithFollowUps = encounters.filter((e) => e.followUpDate);

  const overdue = activeWithFollowUps.filter(
    (e) => !e.followUpCompleted && e.followUpDate < todayStr
  );
  const dueToday = activeWithFollowUps.filter(
    (e) => !e.followUpCompleted && e.followUpDate === todayStr
  );
  const upcoming = activeWithFollowUps.filter(
    (e) => !e.followUpCompleted && e.followUpDate > todayStr
  );
  const completed = activeWithFollowUps.filter((e) => e.followUpCompleted);

  return {
    overdue,
    dueToday,
    upcoming,
    completed,
    totalPending: overdue.length + dueToday.length + upcoming.length
  };
}

/**
 * Fetch all active consultations/referrals with live status tracking from Supabase
 */
export async function getTrackedReferrals(scopedPatientIds = [], isDemoMode = false) {
  const localEncounters = getStoredEncounters();
  const referralEncounters = localEncounters.filter((e) => e.outcome === 'REFERRAL_CREATED');

  if (isDemoMode) {
    return referralEncounters.map((enc) => ({
      ...enc,
      liveStatus: enc.referralStatus || 'Pending',
      doctorAssigned: enc.doctor || 'On-Duty Specialist',
      destinationHospital: enc.hospital,
      destinationDepartment: enc.department
    }));
  }

  try {
    let query = supabase.from('referrals').select('*');

    if (scopedPatientIds && scopedPatientIds.length > 0) {
      // Scope referrals query to authorized patient IDs for data minimization
      query = query.in('patient_id', scopedPatientIds);
    }

    const { data: dbReferrals, error } = await query.order('created_at', { ascending: false });

    if (!error && dbReferrals) {
      return referralEncounters.map((enc) => {
        const matched = dbReferrals.find(
          (r) => r.id === enc.referralId || (r.patient_id === enc.patientId && r.symptoms.includes(enc.complaint))
        );
        return {
          ...enc,
          liveStatus: matched?.status || enc.referralStatus || 'Pending',
          doctorAssigned: matched?.doctor_assigned || enc.doctor || 'On-Duty Specialist',
          destinationHospital: matched?.destination_hospital || enc.hospital,
          destinationDepartment: matched?.destination_department || enc.department
        };
      });
    }
  } catch (err) {
    console.warn('Live referral fetch note (using local cache):', err.message);
  }

  return referralEncounters.map((enc) => ({
    ...enc,
    liveStatus: enc.referralStatus || 'Pending',
    doctorAssigned: enc.doctor || 'On-Duty Specialist',
    destinationHospital: enc.hospital,
    destinationDepartment: enc.department
  }));
}

/**
 * Get encounters for a specific patient
 */
export function getPatientEncounters(patientId, patientUnifiedId) {
  const encounters = getStoredEncounters();
  return encounters.filter(
    (e) => e.patientId === patientId || (patientUnifiedId && e.patientUnifiedId === patientUnifiedId)
  );
}

/**
 * Get all recent encounters
 */
export function getAllRecentEncounters(limit = 15) {
  const encounters = getStoredEncounters();
  return encounters.slice(0, limit);
}

/**
 * Compute explicit Next Action for a patient based on clinical state
 */
export function derivePatientNextAction(patient, encounters = []) {
  const patientEncounters = encounters.filter(
    (e) => e.patientId === patient.id || e.patientUnifiedId === patient.unified_id
  );

  const latest = patientEncounters[0];
  if (!latest) {
    return {
      actionLabel: 'Initial Health Checkup',
      urgency: 'ROUTINE',
      reason: 'No baseline health consultation recorded yet'
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Critical danger sign or emergency
  if (latest.priority === 'HIGH' || latest.priority === 'RED' || (latest.dangerSigns && latest.dangerSigns.length > 0)) {
    return {
      actionLabel: latest.hospital ? 'Confirm Hospital Admission' : 'Immediate Emergency Escalation',
      urgency: 'EMERGENCY',
      reason: `Flagged critical danger signs (${latest.dangerSigns?.[0] || 'High Risk Triage'})`
    };
  }

  // 2. Overdue follow-up
  if (latest.followUpDate && !latest.followUpCompleted && latest.followUpDate < todayStr) {
    const daysOverdue = Math.floor((new Date(todayStr) - new Date(latest.followUpDate)) / 86400000);
    return {
      actionLabel: 'Contact Beneficiary / Recheck Vitals',
      urgency: 'OVERDUE',
      reason: `Follow-up overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`
    };
  }

  // 3. Follow-up due today
  if (latest.followUpDate && !latest.followUpCompleted && latest.followUpDate === todayStr) {
    return {
      actionLabel: 'Conduct Scheduled Follow-up',
      urgency: 'DUE_TODAY',
      reason: latest.followUpReason || 'Scheduled checkup due today'
    };
  }

  // 4. Pending hospital consultation
  if (latest.outcome === 'REFERRAL_CREATED' && (!latest.liveStatus || latest.liveStatus === 'Pending')) {
    return {
      actionLabel: 'Awaiting Hospital Consultation Response',
      urgency: 'WAITING',
      reason: `Dispatched to ${latest.hospital || 'District Hospital'}`
    };
  }

  // 5. Routine stable
  return {
    actionLabel: 'Routine Monitoring',
    urgency: 'ROUTINE',
    reason: 'Clinically stable under home care advice'
  };
}

/**
 * Deterministic High-Attention Watchlist Generator
 */
export function getHighAttentionWatchlist(patients = [], encounters = []) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const list = [];

  patients.forEach((patient) => {
    const pEncounters = encounters.filter(
      (e) => e.patientId === patient.id || e.patientUnifiedId === patient.unified_id
    );
    const latest = pEncounters[0];
    const reasons = [];

    if (latest) {
      if (latest.priority === 'HIGH' || latest.priority === 'RED' || (latest.dangerSigns && latest.dangerSigns.length > 0)) {
        reasons.push('Emergency danger signs recorded in recent encounter');
      }
      if (latest.followUpDate && !latest.followUpCompleted && latest.followUpDate < todayStr) {
        reasons.push('Post-care follow-up is overdue');
      }
      if (latest.outcome === 'REFERRAL_CREATED' && (!latest.liveStatus || latest.liveStatus === 'Pending')) {
        reasons.push(`Consultation sent to ${latest.hospital || 'Facility'} awaiting intake`);
      }
    }

    const vitalsObj = typeof patient.vitals === 'object' && patient.vitals !== null ? patient.vitals : {};
    const conditions = vitalsObj.conditions || [];
    if (conditions.some((c) => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('asthma'))) {
      reasons.push(`Chronic condition requiring periodic checks (${conditions.join(', ')})`);
    }

    if (reasons.length > 0) {
      list.push({
        patient,
        latestEncounter: latest,
        reasons,
        nextAction: derivePatientNextAction(patient, encounters)
      });
    }
  });

  return list;
}

/**
 * Village / Community Location-Aware Aggregator
 */
export function getCommunityAreaSummary(patients = [], encounters = []) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const villageMap = {};

  patients.forEach((patient) => {
    const village = patient.address || 'Shrirampur Main';
    if (!villageMap[village]) {
      villageMap[village] = {
        villageName: village,
        totalPatients: 0,
        followUpsDue: 0,
        pendingConsultations: 0,
        highAttentionCount: 0,
        patientList: []
      };
    }

    villageMap[village].totalPatients++;
    villageMap[village].patientList.push(patient);

    const pEncounters = encounters.filter(
      (e) => e.patientId === patient.id || e.patientUnifiedId === patient.unified_id
    );
    const latest = pEncounters[0];

    if (latest) {
      if (latest.followUpDate && !latest.followUpCompleted && latest.followUpDate <= todayStr) {
        villageMap[village].followUpsDue++;
      }
      if (latest.outcome === 'REFERRAL_CREATED' && (!latest.liveStatus || latest.liveStatus === 'Pending')) {
        villageMap[village].pendingConsultations++;
      }
      if (latest.priority === 'HIGH' || latest.priority === 'RED' || (latest.dangerSigns && latest.dangerSigns.length > 0)) {
        villageMap[village].highAttentionCount++;
      }
    }
  });

  return Object.values(villageMap);
}

/**
 * Check for duplicate beneficiary during registration
 */
export function checkDuplicateBeneficiary(inputData, existingPatients = []) {
  const { fullName = '', age, phone = '', village = '' } = inputData;
  const cleanName = fullName.toLowerCase().trim();
  const cleanPhone = phone.trim();

  if (!cleanName && !cleanPhone) return null;

  return existingPatients.find((p) => {
    const pName = (p.full_name || p.name || '').toLowerCase().trim();
    const pPhone = (p.phone_number || p.phone || '').trim();
    const pAge = p.age;
    const pVillage = (p.address || '').toLowerCase().trim();

    // Match criteria 1: Same phone number (if provided)
    if (cleanPhone && pPhone && cleanPhone === pPhone) return true;

    // Match criteria 2: Exact same name and exact same age
    if (cleanName && pName === cleanName && age && parseInt(pAge) === parseInt(age)) return true;

    // Match criteria 3: Exact same name in the same village
    if (cleanName && pName === cleanName && village && pVillage.includes(village.toLowerCase().trim())) return true;

    return false;
  });
}

/**
 * Compute ASHA dashboard summary metrics
 */
export function getAshaDashboardStats() {
  const encounters = getStoredEncounters();
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayEncounters = encounters.filter((e) => e.date && e.date.startsWith(todayStr)).length;
  const pendingReferrals = encounters.filter((e) => e.outcome === 'REFERRAL_CREATED' && (!e.followUpCompleted || e.status === 'ACTIVE')).length;
  const highPriorityCases = encounters.filter((e) => e.priority === 'HIGH' || e.priority === 'RED').length;
  
  const followUps = getFollowUpTasks();
  const pendingSync = getPendingSyncCount();

  return {
    todayEncounters,
    pendingReferrals,
    highPriorityCases,
    followupsDue: followUps.dueToday.length + followUps.overdue.length,
    overdueFollowups: followUps.overdue.length,
    pendingSyncCount: pendingSync,
    totalEncounters: encounters.length
  };
}

/**
 * Fetch live follow-up tasks from Supabase consultations with follow_up_recommended_date
 */
export async function fetchLiveFollowUpTasks(ashaId = null) {
  try {
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select('*, referrals(id, patient_name, patient_age, patient_gender, priority, clinical_reason)')
      .not('follow_up_recommended_date', 'is', null)
      .order('follow_up_recommended_date', { ascending: true });

    if (error) throw error;
    return consultations || [];
  } catch (err) {
    console.warn('[encounterService] Notice fetching live consultation follow-ups:', err.message);
    return [];
  }
}

