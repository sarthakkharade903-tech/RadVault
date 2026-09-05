import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rdmpeyjfqrzvniotsfxf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbXBleWpmcXJ6dm5pb3RzZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODU2NjQsImV4cCI6MjEwMjk2MTY2NH0.gN5PD9aKPmyoZDZyKC39zCIpVWmg47FFIzfXIqtXacc';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ROLE_CREDS = {
  asha: {
    email: import.meta.env.VITE_ASHA_EMAIL || '',
    password: import.meta.env.VITE_ASHA_PASSWORD || '',
    role: 'ASHA Worker'
  },
  reception: {
    email: import.meta.env.VITE_RECEPTION_EMAIL || '',
    password: import.meta.env.VITE_RECEPTION_PASSWORD || '',
    role: 'Hospital Reception Staff'
  },
  doctor: {
    email: import.meta.env.VITE_DOCTOR_EMAIL || '',
    password: import.meta.env.VITE_DOCTOR_PASSWORD || '',
    role: 'Doctor Specialist'
  }
};

let inFlightAuth = null;
let inFlightRole = null;

export async function ensureRoleAuth(roleName) {
  const creds = ROLE_CREDS[roleName];
  if (!creds) return { user: null, error: new Error(`Unknown role: ${roleName}`) };

  if (inFlightAuth && inFlightRole === roleName) {
    return inFlightAuth;
  }

  inFlightRole = roleName;
  inFlightAuth = (async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.email?.toLowerCase() === creds.email.toLowerCase()) {
        return { user: currentUser, error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });

      if (error) {
        console.error(`[Supabase Auth] Failed to sign in as ${roleName}:`, error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error(`[Supabase Auth] Exception during ${roleName} auth:`, err);
      return { user: null, error: err };
    } finally {
      inFlightAuth = null;
      inFlightRole = null;
    }
  })();

  return inFlightAuth;
}

if (typeof window !== 'undefined') {
  window.__supabase = supabase;
  window.__ensureRoleAuth = ensureRoleAuth;
}
