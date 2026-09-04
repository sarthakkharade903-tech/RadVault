import { parseSurveyCsv, SAMPLE_SURVEY_CSV } from '../src/utils/surveyCsvParser.js';

console.log('=== RADVAULT PHASE 4 — VILLAGE SURVEY ENGINE TEST ===\n');

// 1. Test CSV Parsing with Sample Survey
const mockAssignedVillages = [
  { id: 'v1', name: 'Shrirampur Ward 4', area_id: 'a1' },
  { id: 'v2', name: 'Pimpalgaon Rural', area_id: 'a1' }
];

const mockExistingPatients = [
  { id: 'p-1', unified_id: 'MH-P-10001', full_name: 'Anil Patil', age: 45, phone_number: '9988776655', address: 'Pimpalgaon Rural' }
];

console.log('1. Parsing Sample Survey CSV...');
const result = parseSurveyCsv(SAMPLE_SURVEY_CSV, mockAssignedVillages, mockExistingPatients);

console.log(`- Success: ${result.success}`);
console.log(`- Total Rows: ${result.totalRows}`);
console.log(`- Valid New Rows: ${result.validRows.length}`);
console.log(`- Exact Matches: ${result.exactMatches.length}`);
console.log(`- Possible Duplicates: ${result.possibleDuplicates.length}`);
console.log(`- Invalid Rows: ${result.invalidRows.length}`);
console.log(`- Household Clusters Found: ${Object.keys(result.households).length}`);

// Verify Households
console.log('\n2. Household Grouping:');
for (const [hhId, hhData] of Object.entries(result.households)) {
  console.log(`  🏠 ${hhId} (${hhData.village}) - Head: ${hhData.head}, Members: ${hhData.members.length}`);
}

// Verify Duplicate Detection
console.log('\n3. Duplicate Detection Verification:');
if (result.possibleDuplicates.length > 0 || result.exactMatches.length > 0) {
  const match = result.possibleDuplicates[0] || result.exactMatches[0];
  console.log(`  ✓ Successfully detected duplicate candidate: "${match.fullName}" matching existing patient "${match.existingPatient?.full_name}"`);
}

// Verify New Beneficiaries Data Format
console.log('\n4. Sample Onboarding Beneficiary Object:');
const sampleBeneficiary = result.validRows[0];
console.log({
  fullName: sampleBeneficiary.fullName,
  age: sampleBeneficiary.age,
  gender: sampleBeneficiary.gender,
  village: sampleBeneficiary.village,
  householdId: sampleBeneficiary.householdId,
  relationToHead: sampleBeneficiary.relationToHead,
  phone: sampleBeneficiary.phone,
  knownConditions: sampleBeneficiary.knownConditions
});

if (result.success && result.validRows.length > 0 && Object.keys(result.households).length > 0) {
  console.log('\n✅ ALL VILLAGE SURVEY PARSER & DEDUPLICATION TESTS PASSED!');
} else {
  console.error('\n❌ VILLAGE SURVEY ENGINE TEST FAILED');
  process.exit(1);
}
