/**
 * RadVault FHIR R4 Mapper
 * Formats clinical records, triage notes, prescriptions, and radiology imaging reports
 * into official NRCeS (National Resource Centre for EHR Standards) HL7 FHIR R4 DocumentBundles.
 * 
 * Compliant with: https://nrces.in/ndhm/fhir/r4/
 */

// NRCeS Profile URIs
export const NRCES_PROFILES = {
  DOCUMENT_BUNDLE: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle',
  DIAGNOSTIC_REPORT: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord',
  OP_CONSULT: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultRecord',
  PRESCRIPTION: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord',
  DISCHARGE_SUMMARY: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord',
  PATIENT: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient',
  PRACTITIONER: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner',
  ORGANIZATION: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization',
  ENCOUNTER: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter',
  OBSERVATION_VITALS: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'
};

/**
 * Generates a standard UUIDv4 string.
 */
export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formats a Date object to ISO-8601 string.
 */
export function toFhirDateTime(dateInput) {
  if (!dateInput) return new Date().toISOString();
  try {
    return new Date(dateInput).toISOString();
  } catch (_) {
    return new Date().toISOString();
  }
}

/**
 * Builds a valid NRCeS Patient FHIR R4 Resource.
 */
export function buildPatientResource({ id, name, abhaNumber, abhaAddress, gender = 'female', birthDate, mobile }) {
  const patientId = id || generateUuid();
  const identifiers = [];

  if (abhaNumber) {
    identifiers.push({
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'BCT',
          display: 'Health Card Number'
        }]
      },
      system: 'https://healthid.abdm.gov.in',
      value: abhaNumber
    });
  }

  if (abhaAddress) {
    identifiers.push({
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'MR',
          display: 'Medical record number'
        }]
      },
      system: 'https://abdm.gov.in/abha-address',
      value: abhaAddress
    });
  }

  identifiers.push({
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
        code: 'PI',
        display: 'Patient internal identifier'
      }]
    },
    system: 'https://radvault.health/patients',
    value: String(patientId)
  });

  return {
    resourceType: 'Patient',
    id: `patient-${patientId}`,
    meta: {
      profile: [NRCES_PROFILES.PATIENT]
    },
    identifier: identifiers,
    name: [{
      text: name || 'Anonymous Patient',
      family: (name || '').split(' ').slice(-1)[0] || '',
      given: (name || '').split(' ').slice(0, -1)
    }],
    telecom: mobile ? [{
      system: 'phone',
      value: mobile,
      use: 'mobile'
    }] : undefined,
    gender: (gender || 'unknown').toLowerCase(),
    birthDate: birthDate || undefined
  };
}

/**
 * Builds a valid NRCeS Practitioner Resource.
 */
export function buildPractitionerResource({ id, name, hprId, qualification = 'MBBS' }) {
  const practId = id || generateUuid();
  return {
    resourceType: 'Practitioner',
    id: `practitioner-${practId}`,
    meta: {
      profile: [NRCES_PROFILES.PRACTITIONER]
    },
    identifier: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'MD',
          display: 'Medical License number'
        }]
      },
      system: 'https://hpr.abdm.gov.in',
      value: hprId || `HPR-IN-${practId.toString().slice(0, 8).toUpperCase()}`
    }],
    name: [{
      text: name ? (name.startsWith('Dr.') ? name : `Dr. ${name}`) : 'Dr. Medical Officer'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '394802001',
          display: qualification
        }],
        text: qualification
      }
    }]
  };
}

/**
 * Builds a valid NRCeS Organization (PHC / Hospital Facility) Resource.
 */
export function buildOrganizationResource({ id, name = 'Primary Health Centre Shirwal', hfrId = 'IN2710001928', district = 'Satara', state = 'Maharashtra' }) {
  const orgId = id || generateUuid();
  return {
    resourceType: 'Organization',
    id: `org-${orgId}`,
    meta: {
      profile: [NRCES_PROFILES.ORGANIZATION]
    },
    identifier: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'PRN',
          display: 'Provider number'
        }]
      },
      system: 'https://facility.abdm.gov.in',
      value: hfrId
    }],
    name: name,
    address: [{
      city: district,
      district: district,
      state: state,
      country: 'IND'
    }]
  };
}

/**
 * Builds FHIR Observations for vital signs.
 */
export function buildVitalsObservations(vitals = {}, patientRef, encounterRef) {
  const observations = [];
  const recordedTime = toFhirDateTime(vitals.recorded_at);

  if (vitals.bp) {
    const parts = vitals.bp.split('/');
    const systolic = parseFloat(parts[0]);
    const diastolic = parseFloat(parts[1]);

    observations.push({
      resourceType: 'Observation',
      id: `obs-bp-${generateUuid()}`,
      meta: { profile: [NRCES_PROFILES.OBSERVATION_VITALS] },
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '85354-9',
          display: 'Blood pressure panel with all children optional'
        }],
        text: 'Blood Pressure'
      },
      subject: { reference: patientRef },
      encounter: encounterRef ? { reference: encounterRef } : undefined,
      effectiveDateTime: recordedTime,
      component: [
        ...(isNaN(systolic) ? [] : [{
          code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
          valueQuantity: { value: systolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
        }]),
        ...(isNaN(diastolic) ? [] : [{
          code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
          valueQuantity: { value: diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
        }])
      ]
    });
  }

  if (vitals.pulse) {
    const pulseVal = parseFloat(vitals.pulse);
    if (!isNaN(pulseVal)) {
      observations.push({
        resourceType: 'Observation',
        id: `obs-pulse-${generateUuid()}`,
        meta: { profile: [NRCES_PROFILES.OBSERVATION_VITALS] },
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }],
          text: 'Heart Rate'
        },
        subject: { reference: patientRef },
        effectiveDateTime: recordedTime,
        valueQuantity: { value: pulseVal, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' }
      });
    }
  }

  if (vitals.spo2) {
    const spo2Val = parseFloat(vitals.spo2);
    if (!isNaN(spo2Val)) {
      observations.push({
        resourceType: 'Observation',
        id: `obs-spo2-${generateUuid()}`,
        meta: { profile: [NRCES_PROFILES.OBSERVATION_VITALS] },
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '59408-5', display: 'Oxygen saturation in Arterial blood by Pulse oximetry' }],
          text: 'Oxygen Saturation'
        },
        subject: { reference: patientRef },
        effectiveDateTime: recordedTime,
        valueQuantity: { value: spo2Val, unit: '%', system: 'http://unitsofmeasure.org', code: '%' }
      });
    }
  }

  return observations;
}

/**
 * Builds MedicationRequest resources for prescriptions.
 */
export function buildMedicationRequests(prescriptions = [], patientRef, practitionerRef) {
  return prescriptions.map((p) => ({
    resourceType: 'MedicationRequest',
    id: `med-${generateUuid()}`,
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      text: p.name || 'Medication',
      coding: [{
        system: 'http://snomed.info/sct',
        code: '373873005',
        display: p.name || 'Pharmaceutical / biologic product'
      }]
    },
    subject: { reference: patientRef },
    requester: { reference: practitionerRef },
    dosageInstruction: [{
      text: `${p.dose || '1 dose'} · ${p.frequency || 'Daily'} · ${p.duration || 'As advised'}`
    }]
  }));
}

/**
 * Assembles a complete NRCeS DocumentBundle.
 * Guaranteed: entry[0] is the Composition resource.
 */
export function assembleDocumentBundle({ bundleId, composition, entries = [] }) {
  const finalBundleId = bundleId || `rv-bundle-${generateUuid()}`;
  const timestamp = new Date().toISOString();

  const allEntries = [
    {
      fullUrl: `urn:uuid:${composition.id}`,
      resource: composition
    },
    ...entries.map(resource => ({
      fullUrl: `urn:uuid:${resource.id}`,
      resource: resource
    }))
  ];

  return {
    resourceType: 'Bundle',
    id: finalBundleId,
    meta: {
      versionId: '1',
      lastUpdated: timestamp,
      profile: [NRCES_PROFILES.DOCUMENT_BUNDLE]
    },
    identifier: {
      system: 'https://radvault.health/bundles',
      value: `RV-BUNDLE-${finalBundleId.toUpperCase().slice(0, 16)}`
    },
    type: 'document',
    timestamp: timestamp,
    entry: allEntries
  };
}

/**
 * High-Level Mapper: Maps a completed Doctor Consultation into an official
 * NRCeS OPConsultRecord / PrescriptionRecord DocumentBundle.
 */
export function mapConsultationToFhirBundle(consultation, patient = {}, doctor = {}, facility = {}) {
  const patientRes = buildPatientResource(patient);
  const practitionerRes = buildPractitionerResource(doctor);
  const orgRes = buildOrganizationResource(facility);

  const patientRef = `urn:uuid:${patientRes.id}`;
  const practitionerRef = `urn:uuid:${practitionerRes.id}`;
  const orgRef = `urn:uuid:${orgRes.id}`;

  const medRequests = buildMedicationRequests(consultation.prescriptions || [], patientRef, practitionerRef);
  const vitalsObs = buildVitalsObservations(consultation.vitals || {}, patientRef);

  const compId = `comp-opconsult-${generateUuid()}`;
  const composition = {
    resourceType: 'Composition',
    id: compId,
    meta: { profile: [NRCES_PROFILES.OP_CONSULT] },
    status: 'final',
    type: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '371530004',
        display: 'Clinical consultation report'
      }],
      text: 'Outpatient Consultation & Prescription'
    },
    subject: { reference: patientRef, display: patient.name || 'Patient' },
    date: toFhirDateTime(consultation.created_at),
    author: [{ reference: practitionerRef, display: doctor.name || 'Treating Doctor' }],
    title: 'Outpatient Clinical Consultation Report',
    custodian: { reference: orgRef, display: facility.name || 'Primary Health Centre Shirwal' },
    section: [
      {
        title: 'Clinical Assessment & Diagnosis',
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '4241000179101', display: 'Diagnosis section' }]
        },
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Diagnosis:</b> ${consultation.diagnosis || 'Clinical evaluation'}</p><p><b>Assessment:</b> ${consultation.clinical_assessment || 'Routine'}</p><p><b>Treatment Advice:</b> ${consultation.treatment_advice || 'Follow-up as scheduled.'}</p></div>`
        }
      },
      ...(medRequests.length > 0 ? [{
        title: 'Medications Prescribed',
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '721912009', display: 'Medication summary section' }]
        },
        entry: medRequests.map(m => ({ reference: `urn:uuid:${m.id}` }))
      }] : []),
      ...(vitalsObs.length > 0 ? [{
        title: 'Vital Signs',
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '1184593002', display: 'Vital signs section' }]
        },
        entry: vitalsObs.map(v => ({ reference: `urn:uuid:${v.id}` }))
      }] : [])
    ]
  };

  return assembleDocumentBundle({
    bundleId: `rv-opc-${consultation.id || generateUuid()}`,
    composition,
    entries: [patientRes, practitionerRes, orgRes, ...medRequests, ...vitalsObs]
  });
}

/**
 * High-Level Mapper: Maps a Diagnostic Medical / Radiology Imaging Record
 * into an official NRCeS DiagnosticReportRecord DocumentBundle.
 */
export function mapMedicalRecordToFhirBundle(record, patient = {}, doctor = {}, facility = {}) {
  const patientRes = buildPatientResource(patient);
  const practitionerRes = buildPractitionerResource(doctor);
  const orgRes = buildOrganizationResource(facility);

  const patientRef = `urn:uuid:${patientRes.id}`;
  const practitionerRef = `urn:uuid:${practitionerRes.id}`;
  const orgRef = `urn:uuid:${orgRes.id}`;

  const diagReportId = `diag-${record.id || generateUuid()}`;
  const diagReport = {
    resourceType: 'DiagnosticReport',
    id: diagReportId,
    meta: { profile: [NRCES_PROFILES.DIAGNOSTIC_REPORT] },
    status: 'final',
    category: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: record.modality === 'LAB' ? '108252007' : '363679005',
        display: record.modality === 'LAB' ? 'Laboratory procedure' : 'Imaging'
      }]
    }],
    code: {
      text: `${record.modality || 'Radiology'} ${record.body_region || ''} Study - ${record.title || 'Report'}`
    },
    subject: { reference: patientRef },
    performer: [{ reference: practitionerRef }],
    conclusion: record.report?.impression || 'Report verified by clinical radiologist.',
    presentedForm: record.file_url ? [{
      contentType: 'application/pdf',
      url: record.file_url,
      title: `${record.title || 'Diagnostic'} Report PDF`
    }] : undefined
  };

  const compId = `comp-diag-${generateUuid()}`;
  const composition = {
    resourceType: 'Composition',
    id: compId,
    meta: { profile: [NRCES_PROFILES.DIAGNOSTIC_REPORT] },
    status: 'final',
    type: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '721981007',
        display: 'Diagnostic studies report'
      }],
      text: 'Diagnostic Imaging / Pathology Report'
    },
    subject: { reference: patientRef, display: patient.name || 'Patient' },
    date: toFhirDateTime(record.created_at),
    author: [{ reference: practitionerRef, display: doctor.name || 'Radiologist / Pathologist' }],
    title: `${record.title || 'Diagnostic Study'} Report`,
    custodian: { reference: orgRef, display: facility.name || 'Primary Health Centre Shirwal' },
    section: [{
      title: 'Diagnostic Findings & Impression',
      entry: [{ reference: `urn:uuid:${diagReport.id}` }]
    }]
  };

  return assembleDocumentBundle({
    bundleId: `rv-diag-${record.id || generateUuid()}`,
    composition,
    entries: [patientRes, practitionerRes, orgRes, diagReport]
  });
}
