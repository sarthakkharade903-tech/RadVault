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

async function runTaskDiagnostics() {
  console.log("=== EXECUTING USER DIAGNOSTIC TASKS 1-5 ===");

  const ashaClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: ashaAuth } = await ashaClient.auth.signInWithPassword({ email: ASHA_EMAIL, password: ASHA_PASSWORD });
  const ashaUserId = ashaAuth.user.id;

  const staffClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: staffAuth } = await staffClient.auth.signInWithPassword({ email: STAFF_EMAIL, password: STAFF_PASSWORD });
  const staffUserId = staffAuth.user.id;

  // TASK 1: What happens if ASHA user tries to query hospital_staff?
  console.log("\n--- TASK 1: QUERYING hospital_staff AS ASHA USER ---");
  const { data: ashaQueryStaff, error: ashaStaffErr } = await ashaClient
    .from('hospital_staff')
    .select('*, facilities(*)')
    .eq('user_id', ashaUserId)
    .maybeSingle();

  console.log("ASHA User ID:", ashaUserId);
  console.log("Result of hospital_staff.eq('user_id', ashaUserId):", ashaQueryStaff);
  console.log("Error (if any):", ashaStaffErr?.message || "none");

  // TASK 2: TRACE LATEST REAL REFERRAL
  console.log("\n--- TASK 2: LATEST REAL REFERRAL FROM ASHA ---");
  const { data: latestRefs } = await ashaClient
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  const ref = latestRefs[0];
  console.log("referral.id =", ref.id);
  console.log("referral.patient_id =", ref.patient_id);
  console.log("referral.patient_name =", ref.patient_name);
  console.log("referral.status =", ref.status);
  console.log("referral.priority =", ref.priority);
  console.log("referral.destination_hospital =", ref.destination_hospital);
  console.log("referral.destination_facility_id =", ref.destination_facility_id);
  console.log("referral.created_by =", ref.created_by);
  console.log("referral.created_at =", ref.created_at);

  // Hospital Staff details
  console.log("\n--- HOSPITAL STAFF ACCOUNT DETAILS ---");
  const { data: staffProfile } = await staffClient
    .from('hospital_staff')
    .select('*, facilities(*)')
    .eq('user_id', staffUserId)
    .maybeSingle();

  console.log("authenticated auth.users ID =", staffUserId);
  console.log("hospital_staff.user_id =", staffProfile.user_id);
  console.log("hospital_staff.facility_id =", staffProfile.facility_id);
  console.log("facility name =", staffProfile.facilities?.name);

  console.log("\n--- FACILITY ID COMPARISON ---");
  console.log("referral.destination_facility_id:", ref.destination_facility_id);
  console.log("hospital_staff.facility_id      :", staffProfile.facility_id);
  console.log("MATCH:", ref.destination_facility_id === staffProfile.facility_id ? "YES" : "NO");

  // TASK 3: EXACT HOSPITAL STAFF QUERY WITH STAFF SESSION
  console.log("\n--- TASK 3: EXACT HOSPITAL STAFF QUERY (STAFF AUTHENTICATED) ---");
  const { data: staffQueryData, error: staffQueryErr } = await staffClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', staffProfile.facility_id)
    .order('created_at', { ascending: false });

  console.log("authenticated user ID =", staffUserId);
  console.log("hospital staff profile ID =", staffProfile.id);
  console.log("facility ID =", staffProfile.facility_id);
  console.log("Supabase error (if any) =", staffQueryErr?.message || "none");
  console.log("Number of returned referrals =", staffQueryData?.length || 0);

  // TASK 4: WHAT HAPPENS IF UNAUTHENTICATED (ANON) QUERIES REFERRALS
  console.log("\n--- TASK 4: QUERYING REFERRALS AS ANONYMOUS/DEMO CLIENT ---");
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: anonData, error: anonErr } = await anonClient
    .from('referrals')
    .select('*')
    .eq('destination_facility_id', staffProfile.facility_id);
  console.log("Anon referrals count returned by RLS:", anonData?.length || 0);
  console.log("Anon query error:", anonErr?.message || "none");
}

runTaskDiagnostics();
