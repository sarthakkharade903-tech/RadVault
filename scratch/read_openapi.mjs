import fs from 'fs';
import path from 'path';

// Custom env parser
const envLocalPath = path.resolve('.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
        if (k === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = v;
      }
    }
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing URL or Key");
  process.exit(1);
}

async function fetchSchema() {
  console.log("Fetching schema from Supabase REST endpoint with headers...");
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const schema = await response.json();
    
    const targets = ['referrals', 'doctors', 'hospital_staff', 'facilities', 'consultations', 'patients'];
    
    targets.forEach(t => {
      console.log(`\n=== Table: public.${t} ===`);
      const definition = schema.definitions[t];
      if (definition) {
        console.log("Properties/Columns:");
        Object.keys(definition.properties).forEach(col => {
          const prop = definition.properties[col];
          console.log(`  - ${col}: type=${prop.type}, format=${prop.format || ''}, description=${prop.description || ''}`);
        });
        if (definition.required) {
          console.log(`Required: ${definition.required.join(', ')}`);
        }
      } else {
        console.log("❌ Table definition not found in schema cache.");
      }
    });

  } catch (e) {
    console.error("Failed to fetch schema:", e.message);
  }
}

fetchSchema();
