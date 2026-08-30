/**
 * ASHA Village Survey CSV Parser & Validation Engine
 *
 * Parses household survey data, validates demographic constraints,
 * groups by Household ID, and matches against existing registered beneficiaries.
 */

export const SAMPLE_SURVEY_CSV = `Name,Age,Gender,Village,Household_ID,Relation_to_Head,Mobile,Blood_Group,Known_Conditions,Pregnancy_Status,ABHA_ID
Ramesh Deshmukh,58,Male,Shrirampur Ward 4,HH-MH-401,Head,9823101122,B+,Hypertension,No,
Sunita Ramesh Deshmukh,52,Female,Shrirampur Ward 4,HH-MH-401,Spouse,9823101122,O+,Diabetes,No,
Pooja Deshmukh,24,Female,Shrirampur Ward 4,HH-MH-401,Daughter,9876543210,A+,,Yes (24 Weeks),
Aarav Deshmukh,3,Male,Shrirampur Ward 4,HH-MH-401,Grandchild,,O+,,,
Anil Patil,45,Male,Pimpalgaon Rural,HH-MH-402,Head,9988776655,AB+,,,
Kavita Patil,40,Female,Pimpalgaon Rural,HH-MH-402,Spouse,9988776655,A+,Asthma,No,
Shantabai Patil,72,Female,Pimpalgaon Rural,HH-MH-402,Mother,,B+,Arthritis & Hypertension,No,
`;

/**
 * Split CSV line handling quotes and commas cleanly
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim().replace(/^['"]|['"]$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^['"]|['"]$/g, ''));
  return result;
}

/**
 * Clean & normalize column header names
 */
function normalizeHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parse and validate survey CSV content
 */
export function parseSurveyCsv(csvText, assignedVillages = [], existingPatients = []) {
  if (!csvText || typeof csvText !== 'string') {
    return {
      success: false,
      error: 'Empty or invalid CSV data provided.',
      validRows: [],
      possibleDuplicates: [],
      exactMatches: [],
      invalidRows: [],
      households: {}
    };
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      error: 'CSV must contain a header row and at least one data row.',
      validRows: [],
      possibleDuplicates: [],
      exactMatches: [],
      invalidRows: [],
      households: {}
    };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  // Map header indexes
  const colIndex = {
    name: headers.findIndex(h => h.includes('name') || h === 'fullname'),
    age: headers.findIndex(h => h === 'age' || h.includes('year') || h === 'dob'),
    gender: headers.findIndex(h => h.includes('gender') || h === 'sex'),
    village: headers.findIndex(h => h.includes('village') || h.includes('address') || h.includes('ward')),
    householdId: headers.findIndex(h => h.includes('household') || h.includes('family') || h === 'hhid' || h === 'hh'),
    relation: headers.findIndex(h => h.includes('relation') || h.includes('head')),
    mobile: headers.findIndex(h => h.includes('mobile') || h.includes('phone') || h.includes('contact')),
    bloodGroup: headers.findIndex(h => h.includes('blood') || h === 'bg'),
    conditions: headers.findIndex(h => h.includes('condition') || h.includes('disease') || h.includes('ncd')),
    pregnancy: headers.findIndex(h => h.includes('pregnan') || h.includes('anc')),
    abhaId: headers.findIndex(h => h.includes('abha') || h.includes('unified') || h.includes('healthid'))
  };

  if (colIndex.name === -1) {
    return {
      success: false,
      error: 'Missing required "Name" column in CSV header.',
      validRows: [],
      possibleDuplicates: [],
      exactMatches: [],
      invalidRows: [],
      households: {}
    };
  }

  const validRows = [];
  const possibleDuplicates = [];
  const exactMatches = [];
  const invalidRows = [];
  const households = {};

  const defaultVillageName = assignedVillages[0]?.name || 'Shrirampur Ward 4';

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = parseCsvLine(rawLine);
    const rowNum = i + 1;

    // Extract values
    const rawName = colIndex.name !== -1 ? cells[colIndex.name] : '';
    const rawAge = colIndex.age !== -1 ? cells[colIndex.age] : '';
    const rawGender = colIndex.gender !== -1 ? cells[colIndex.gender] : '';
    const rawVillage = colIndex.village !== -1 && cells[colIndex.village] ? cells[colIndex.village] : defaultVillageName;
    const rawHhId = colIndex.householdId !== -1 ? cells[colIndex.householdId] : '';
    const rawRelation = colIndex.relation !== -1 ? cells[colIndex.relation] : 'Member';
    const rawMobile = colIndex.mobile !== -1 ? cells[colIndex.mobile] : '';
    const rawBloodGroup = colIndex.bloodGroup !== -1 ? cells[colIndex.bloodGroup] : '';
    const rawConditions = colIndex.conditions !== -1 ? cells[colIndex.conditions] : '';
    const rawPregnancy = colIndex.pregnancy !== -1 ? cells[colIndex.pregnancy] : '';
    const rawAbhaId = colIndex.abhaId !== -1 ? cells[colIndex.abhaId] : '';

    const errors = [];

    // 1. Validate Name
    const cleanName = (rawName || '').trim();
    if (!cleanName || cleanName.length < 2) {
      errors.push('Full name is required (min 2 characters).');
    }

    // 2. Validate Age
    const parsedAge = parseInt(rawAge, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      errors.push('Valid age between 0 and 125 is required.');
    }

    // 3. Normalize Gender
    let normalizedGender = 'Other';
    const gLower = (rawGender || '').toLowerCase().trim();
    if (gLower.startsWith('m')) normalizedGender = 'Male';
    else if (gLower.startsWith('f') || gLower.startsWith('w')) normalizedGender = 'Female';
    else if (gLower) normalizedGender = 'Other';

    // 4. Resolve Village Object
    let matchedVillageObj = assignedVillages.find(v => 
      v.name.toLowerCase().trim() === rawVillage.toLowerCase().trim() ||
      v.name.toLowerCase().includes(rawVillage.toLowerCase().trim())
    );
    if (!matchedVillageObj && assignedVillages.length > 0) {
      matchedVillageObj = assignedVillages[0];
    }

    // 5. Conditions & Pregnancy Parse
    const conditionsList = rawConditions
      ? rawConditions.split(/[,;&]/).map(c => c.trim()).filter(Boolean)
      : [];

    const isPregnancyApplicable = normalizedGender === 'Female' && parsedAge >= 12 && parsedAge <= 50;
    const isPregnant = isPregnancyApplicable && /(yes|positive|गर्भार|गरोदर|week|month)/i.test(rawPregnancy);

    const rowObj = {
      rowIndex: rowNum,
      rawLine,
      fullName: cleanName,
      age: parsedAge,
      gender: normalizedGender,
      village: matchedVillageObj?.name || rawVillage,
      villageId: matchedVillageObj?.id || null,
      areaId: matchedVillageObj?.area_id || null,
      householdId: rawHhId ? rawHhId.trim().toUpperCase() : `HH-${Math.floor(100 + Math.random() * 900)}`,
      relationToHead: rawRelation.trim() || 'Member',
      phone: rawMobile.replace(/[^0-9]/g, '').slice(-10),
      bloodGroup: rawBloodGroup.toUpperCase().trim() || null,
      knownConditions: conditionsList,
      isPregnant,
      pregnancyNotes: isPregnant ? rawPregnancy : null,
      abhaId: rawAbhaId.trim() || null,
      status: 'VALID',
      errors: []
    };

    if (errors.length > 0) {
      rowObj.status = 'INVALID';
      rowObj.errors = errors;
      invalidRows.push(rowObj);
      continue;
    }

    // 6. Check Duplicate Against Existing Patients
    const exactAbhaMatch = rawAbhaId && existingPatients.find(p => p.unified_id === rawAbhaId || p.id === rawAbhaId);
    const exactPhoneAndNameMatch = rowObj.phone && existingPatients.find(p => 
      (p.phone_number || '').replace(/[^0-9]/g, '').slice(-10) === rowObj.phone &&
      (p.full_name || '').toLowerCase().trim() === rowObj.fullName.toLowerCase().trim()
    );

    if (exactAbhaMatch || exactPhoneAndNameMatch) {
      rowObj.status = 'EXACT_MATCH';
      rowObj.existingPatient = exactAbhaMatch || exactPhoneAndNameMatch;
      exactMatches.push(rowObj);
      continue;
    }

    // Fuzzy Check: Same Name + Same Age in same village
    const possibleFuzzyMatch = existingPatients.find(p => 
      (p.full_name || '').toLowerCase().trim() === rowObj.fullName.toLowerCase().trim() &&
      parseInt(p.age, 10) === rowObj.age
    );

    if (possibleFuzzyMatch) {
      rowObj.status = 'POSSIBLE_DUPLICATE';
      rowObj.existingPatient = possibleFuzzyMatch;
      possibleDuplicates.push(rowObj);
      continue;
    }

    // Valid unique new beneficiary
    validRows.push(rowObj);

    // Group by household
    const hhKey = rowObj.householdId;
    if (!households[hhKey]) {
      households[hhKey] = {
        householdId: hhKey,
        village: rowObj.village,
        members: [],
        head: null
      };
    }
    households[hhKey].members.push(rowObj);
    if (/head/i.test(rowObj.relationToHead) || !households[hhKey].head) {
      households[hhKey].head = rowObj.fullName;
    }
  }

  return {
    success: true,
    totalRows: lines.length - 1,
    validRows,
    possibleDuplicates,
    exactMatches,
    invalidRows,
    households
  };
}

/**
 * Trigger download of the sample survey CSV template
 */
export function downloadSampleSurveyCsv() {
  const blob = new Blob([SAMPLE_SURVEY_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'radvault_village_survey_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
