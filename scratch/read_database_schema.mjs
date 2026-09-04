import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Custom env parser
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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectDb() {
  console.log("=== INSPECTING REMOTE SUPABASE DATABASE ===");

  // 1. Fetch facilities
  try {
    const { data, error } = await supabase.from('facilities').select('*');
    if (error) {
      console.log("facilities error:", error.message);
    } else {
      console.log("facilities rows:", data);
    }
  } catch (e) {
    console.log("facilities exception:", e.message);
  }

  // 2. Fetch villages
  try {
    const { data, error } = await supabase.from('villages').select('*');
    if (error) {
      console.log("villages error:", error.message);
    } else {
      console.log("villages rows:", data);
    }
  } catch (e) {
    console.log("villages exception:", e.message);
  }

  // 3. Check for specific IDs
  const checkIds = [
    { type: 'asha_workers', id: 'a3333333-3333-3333-3333-333333333333' },
    { type: 'hospital_staff', id: 's3333333-3333-3333-3333-333333333333' },
    { type: 'doctors', id: 'd3333333-3333-3333-3333-333333333333' },
    { type: 'facilities', id: 'f1111111-1111-1111-1111-111111111111' },
    { type: 'villages', id: 'e1111111-1111-1111-1111-111111111111' }
  ];

  for (const item of checkIds) {
    try {
      const { data, error } = await supabase.from(item.type).select('id').eq('id', item.id).maybeSingle();
      if (error) {
        console.log(`Check ID ${item.id} on ${item.type} error:`, error.message);
      } else {
        console.log(`Check ID ${item.id} on ${item.type} result:`, data ? "EXISTS" : "DOES NOT EXIST");
      }
    } catch (e) {
      console.log(`Check ID ${item.id} on ${item.type} exception:`, e.message);
    }
  }
}

inspectDb();
