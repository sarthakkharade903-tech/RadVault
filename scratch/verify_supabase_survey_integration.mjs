import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    }
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key missing from environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('================================================================');
console.log('RADVAULT — REAL SUPABASE VILLAGE SURVEY INTEGRATION VERIFICATION');
console.log('================================================================\n');

async function runVerification() {
  const report = {};

  // ─── 1. VERIFY DATABASE SCHEMA & COLUMNS ───────────────────────────────────
  console.log('1. Checking `public.patients` table schema & columns...');
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, unified_id, full_name, age, gender, address, village_id, area_id, household_id, relation_to_head, vitals')
      .limit(1);

    if (error) {
      if (error.message.includes('household_id') || error.message.includes('relation_to_head')) {
        console.log('⚠️ `household_id` or `relation_to_head` columns are missing from live database schema.');
        report.schemaStatus = 'DATABASE_MIGRATION_REQUIRED';
        report.schemaError = error.message;
      } else {
        console.log('❌ Error querying patients table:', error.message);
        report.schemaStatus = 'ERROR';
        report.schemaError = error.message;
      }
    } else {
      console.log('✅ `public.patients` columns (household_id, relation_to_head, village_id, area_id) are present and accessible!');
      report.schemaStatus = 'VERIFIED';
    }
  } catch (err) {
    console.error('Exception during schema check:', err.message);
    report.schemaStatus = 'EXCEPTION';
    report.schemaError = err.message;
  }

  // ─── 2. CHECK ASHA & VILLAGE MAPPING SCOPING ───────────────────────────────
  console.log('\n2. Checking ASHA worker and village assignments...');
  let testVillageId = null;
  let testAreaId = null;
  let testVillageName = 'Shrirampur Ward 4';

  try {
    const { data: villages, error: vErr } = await supabase
      .from('villages')
      .select('*')
      .limit(5);

    if (!vErr && villages && villages.length > 0) {
      console.log(`✅ Loaded ${villages.length} assigned village records from Supabase:`);
      villages.forEach(v => console.log(`   - Village: "${v.name}" (ID: ${v.id}, Area ID: ${v.area_id})`));
      testVillageId = villages[0].id;
      testAreaId = villages[0].area_id;
      testVillageName = villages[0].name;
      report.ashaScoping = 'VERIFIED_RELATIONAL';
    } else {
      console.log('⚠️ No relational villages found in `villages` table or table empty; fallback to address strings.');
      report.ashaScoping = 'FALLBACK_STRING_BASED';
    }
  } catch (err) {
    console.warn('Villages query note:', err.message);
    report.ashaScoping = 'FALLBACK_STRING_BASED';
  }

  // ─── 3. TEST REAL BATCH INSERTION & HOUSEHOLD PERSISTENCE ──────────────────
  console.log('\n3. Testing batch insertion of realistic test household dataset...');
  
  const testHousehold1Id = `HH-TEST-VERIFY-${Date.now()}`;
  const testHousehold2Id = `HH-TEST-VERIFY-${Date.now() + 1}`;

  const testBeneficiaries = [
    {
      unified_id: `MH-TEST-SURVEY-${Date.now()}-1`,
      full_name: 'TEST Beneficiary Head One',
      age: 48,
      gender: 'Male',
      blood_group: 'B+',
      phone_number: '9876500001',
      address: testVillageName,
      village_id: testVillageId,
      area_id: testAreaId,
      household_id: testHousehold1Id,
      relation_to_head: 'Head',
      vitals: { conditions: ['Hypertension'], allergies: 'Sulfa drugs' }
    },
    {
      unified_id: `MH-TEST-SURVEY-${Date.now()}-2`,
      full_name: 'TEST Beneficiary Spouse One',
      age: 44,
      gender: 'Female',
      blood_group: 'O+',
      phone_number: '9876500001',
      address: testVillageName,
      village_id: testVillageId,
      area_id: testAreaId,
      household_id: testHousehold1Id,
      relation_to_head: 'Spouse',
      vitals: { conditions: [], isPregnant: false }
    },
    {
      unified_id: `MH-TEST-SURVEY-${Date.now()}-3`,
      full_name: 'TEST Beneficiary Child One',
      age: 12,
      gender: 'Female',
      blood_group: 'B+',
      phone_number: '9876500001',
      address: testVillageName,
      village_id: testVillageId,
      area_id: testAreaId,
      household_id: testHousehold1Id,
      relation_to_head: 'Daughter',
      vitals: { conditions: [] }
    },
    {
      unified_id: `MH-TEST-SURVEY-${Date.now()}-4`,
      full_name: 'TEST Beneficiary Head Two',
      age: 70,
      gender: 'Male',
      blood_group: 'A+',
      phone_number: '9876500002',
      address: testVillageName,
      village_id: testVillageId,
      area_id: testAreaId,
      household_id: testHousehold2Id,
      relation_to_head: 'Head',
      vitals: { conditions: ['Diabetes', 'Arthritis'] }
    }
  ];

  let insertedRecords = [];
  try {
    const { data: inserted, error: insErr } = await supabase
      .from('patients')
      .insert(testBeneficiaries)
      .select();

    if (insErr) {
      console.log('❌ Supabase Insert failed:', insErr.message);
      report.realInsertStatus = 'FAILED';
      report.insertError = insErr.message;
    } else {
      console.log(`✅ Successfully inserted ${inserted.length} test beneficiaries into \`public.patients\`!`);
      insertedRecords = inserted;
      report.realInsertStatus = 'VERIFIED';
    }
  } catch (err) {
    console.error('Exception during insert test:', err.message);
    report.realInsertStatus = 'EXCEPTION';
    report.insertError = err.message;
  }

  // ─── 4. VERIFY ROUND-TRIP QUERY & HOUSEHOLD PERSISTENCE ───────────────────
  if (insertedRecords.length > 0) {
    console.log('\n4. Verifying round-trip retrieval and household relationships...');
    try {
      const { data: fetched, error: fetchErr } = await supabase
        .from('patients')
        .select('*')
        .eq('household_id', testHousehold1Id)
        .order('age', { ascending: false });

      if (fetchErr) {
        console.log('❌ Failed to retrieve household members:', fetchErr.message);
        report.householdPersistence = 'FAILED';
      } else {
        console.log(`✅ Retrieved ${fetched.length} members for household ${testHousehold1Id}:`);
        fetched.forEach(m => {
          console.log(`   - "${m.full_name}" | Age: ${m.age} | Gender: ${m.gender} | HH: ${m.household_id} | Relation: ${m.relation_to_head}`);
        });

        const allPersisted = fetched.every(m => m.household_id === testHousehold1Id && m.relation_to_head);
        if (allPersisted) {
          console.log('✅ `household_id` and `relation_to_head` 100% persisted and verified in Supabase!');
          report.householdPersistence = 'VERIFIED';
        } else {
          console.log('⚠️ Some household fields were missing or null on retrieval.');
          report.householdPersistence = 'PARTIAL';
        }
      }
    } catch (err) {
      console.error('Exception during retrieval check:', err.message);
      report.householdPersistence = 'EXCEPTION';
    }

    // ─── 5. CLEANUP TEMPORARY TEST DATA ─────────────────────────────────────
    console.log('\n5. Cleaning up temporary test records...');
    try {
      const idsToDelete = insertedRecords.map(r => r.id);
      const { error: delErr } = await supabase
        .from('patients')
        .delete()
        .in('id', idsToDelete);

      if (delErr) {
        console.warn('⚠️ Warning: cleanup error:', delErr.message);
      } else {
        console.log(`✅ Cleaned up all ${idsToDelete.length} test records. Database left in pristine state.`);
      }
    } catch (err) {
      console.warn('Cleanup exception:', err.message);
    }
  }

  console.log('\n================================================================');
  console.log('VERIFICATION SUMMARY REPORT:');
  console.log(JSON.stringify(report, null, 2));
  console.log('================================================================\n');
}

runVerification();
