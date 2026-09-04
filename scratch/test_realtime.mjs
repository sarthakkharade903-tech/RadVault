import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(l => {
  const [k, v] = l.trim().split('=');
  if (k === 'VITE_SUPABASE_URL') url = v;
  if (k === 'VITE_SUPABASE_ANON_KEY') key = v;
});

const client = createClient(url, key);
await client.auth.signInWithPassword({ email: 'myanawar5243d@gmail.com', password: 'Samir@135' });

console.log('Testing realtime subscription on public.referrals...');
let received = false;

const channel = client.channel('test_realtime_channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, (payload) => {
    console.log('REALTIME EVENT RECEIVED:', payload.eventType);
    received = true;
  })
  .subscribe((status, err) => {
    console.log('Realtime status:', status, 'Err:', err);
  });

// Wait 3 seconds for connection
await new Promise(r => setTimeout(r, 3000));

// Now trigger an update on an existing referral
const { data: ref } = await client.from('referrals').select('id, updated_at:created_at').limit(1).single();
if (ref) {
  console.log('Updating referral to test realtime trigger:', ref.id);
  await client.from('referrals').update({ symptoms: 'Realtime test pulse ' + Date.now() }).eq('id', ref.id);
}

// Wait 4 seconds to see if realtime event arrives
await new Promise(r => setTimeout(r, 4000));
console.log('Realtime event received?', received ? 'YES' : 'NO');

client.removeChannel(channel);
process.exit(0);
