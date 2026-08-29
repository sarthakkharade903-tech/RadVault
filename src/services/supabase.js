import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rdmpeyjfqrzvniotsfxf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbXBleWpmcXJ6dm5pb3RzZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODU2NjQsImV4cCI6MjEwMjk2MTY2NH0.gN5PD9aKPmyoZDZyKC39zCIpVWmg47FFIzfXIqtXacc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
