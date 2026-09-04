import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[k] = v;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const ASHA_EMAIL = "somu5243d@gmail.com";
const ASHA_PASSWORD = "Samir@7498";
const STAFF_EMAIL = "myanawar5243d@gmail.com";
const STAFF_PASSWORD = "Samir@135";

async function inspectLiveFlow() {
  console.log("=== RADVAULT PHASE 2 & 3 LIVE FLOW AUDIT ===");

  // 1. Authenticate as Hospital Staff
  const staffClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: staffAuth, error: staffAuthErr } = await staffClient.auth.signInWithPassword({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD
  });

  if (staffAuthErr || !staffAuth.user) {
    console.error("❌ Hospital Staff login failed:", staffAuthErr?.message);
    return;
  }

  const staffUserId = staffAuth.user.id;
  console.log("HOSPITAL STAFF AUTH UID:", staffUserId);

  // 2. Fetch staff profile
  const { data: staffProfile, error: staffProfErr } = await staffClient
    .from('hospital_staff')
    .select('*, facilities(*)')
    .eq('user_id', staffUserId)
    .maybeSingle();

  if (staffProfErr || !staffProfile) {
    console.error("❌ Staff profile not found:", staffProfErr?.message);
    return;
  }

  console.log("\nHOSPITAL STAFF PROFILE:");
  console.log("user_id =", staffUserId);
  console.log("staff profile ID =", staffProfile.id);
  console.log("facility_id =", staffProfile.facility_id);
  console.log("facility_name =", staffProfile.facilities?.name);
  console.log("district =", staffProfile.facilities?.district);

  // 3. Authenticate as ASHA
  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth, error: ashaAuthErr } = await ashaClient.auth.signInWithPassword({
    email: ASHA_EMAIL,
    password: ASHA_PASSWORD
  });

  if (ashaAuthErr || !ashaAuth.user) {
    console.error("❌ ASHA login failed:", ashaAuthErr?.message);
    return;
  }

  const { data: ashaProfile } = await ashaClient
    .from('asha_workers')
    .select('*, asha_village_assignments(village_id, villages(name, area_id))')
    .eq('user_id', ashaAuth.user.id)
    .maybeSingle();

  console.log("\nASHA PROFILE:");
  console.log("asha user_id =", ashaAuth.user.id);
  console.log("asha worker ID =", ashaProfile?.id);
  console.log("assigned village =", ashaProfile?.asha_village_assignments?.[0]?.villages?.name);

  // 4. Query the latest 5 referrals created by ASHA (using ASHA client)
  console.log("\n--- LATEST REFERRALS IN DB (ASHA VIEW) ---");
  const { data: ashaRefs, error: ashaRefErr } = await ashaClient
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (ashaRefErr) {
    console.error("ASHA referrals query error:", ashaRefErr.message);
  } else {
    console.log(`Found ${ashaRefs?.length} latest referrals:`);
    ashaRefs?.forEach((r, idx) => {
      console.log(`\n[Referral #${idx + 1}]`);
      console.log(`id = ${r.id}`);
      console.log(`patient_id = ${r.patient_id}`);
      console.log(`patient_name = ${r.patient_name}`);
      console.log(`status = ${r.status}`);
      console.log(`priority = ${r.priority} (${r.priority_label})`);
      console.log(`destination_hospital = ${r.destination_hospital}`);
      console.log(`destination_facility_id = ${r.destination_facility_id}`);
      console.log(`created_by = ${r.created_by}`);
      console.log(`doctor_assigned = ${r.doctor_assigned}`);
      console.log(`symptoms = ${r.symptoms}`);
      console.log(`created_at = ${r.created_at}`);
    });
  }

  // 5. Query referrals as Hospital Staff (exact query from HospitalStaffWorkspace.jsx)
  console.log("\n--- QUERYING REFERRALS AS HOSPITAL STAFF (EXACT WORKSPACE QUERY) ---");
  const { data: staffQueryRefs, error: staffQueryErr } = await staffClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', staffProfile.facility_id)
    .order('created_at', { ascending: false });

  if (staffQueryErr) {
    console.error("❌ Staff query error:", staffQueryErr.message);
  } else {
    console.log(`✅ Staff query returned ${staffQueryRefs?.length} referrals matching facility_id [${staffProfile.facility_id}]`);
    staffQueryRefs?.slice(0, 5).forEach((r, idx) => {
      console.log(`[${idx + 1}] ID: ${r.id}, Patient: ${r.patient_name}, Status: ${r.status}, Priority: ${r.priority}, Facility: ${r.destination_facility_id}`);
    });
  }

  // 6. Compare & Diagnostic Match
  if (ashaRefs && ashaRefs.length > 0) {
    const latestRef = ashaRefs[0];
    console.log("\n==================================================");
    console.log("LATEST REFERRAL DIAGNOSTIC MATCH:");
    console.log("REFERRAL:");
    console.log("id =", latestRef.id);
    console.log("patient_id =", latestRef.patient_id);
    console.log("destination_facility_id =", latestRef.destination_facility_id);
    console.log("status =", latestRef.status);
    console.log("\nHOSPITAL STAFF:");
    console.log("user_id =", staffUserId);
    console.log("facility_id =", staffProfile.facility_id);
    console.log("facility_name =", staffProfile.facilities?.name);
    console.log("\nMATCH:");
    console.log("patient_id valid UUID =", (typeof latestRef.patient_id === 'string' && latestRef.patient_id.length === 36) ? "YES" : "NO");
    console.log("facility matches =", (latestRef.destination_facility_id === staffProfile.facility_id) ? "YES" : "NO");
    console.log("status accepted by query =", (latestRef.status === 'Pending' || latestRef.status === 'Accepted' || latestRef.status === 'Arrived' || latestRef.status === 'Completed') ? "YES" : "NO");
    const isVisibleToStaff = staffQueryRefs?.some(r => r.id === latestRef.id);
    console.log("RLS allows SELECT by staff =", isVisibleToStaff ? "YES" : "NO");
    console.log("==================================================");
  }
}

inspectLiveFlow();
