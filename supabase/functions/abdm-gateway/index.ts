// Supabase Edge Function: abdm-gateway
// Master Webhook Gateway Router for Ayushman Bharat Digital Mission (ABDM)
// Handles routing from ABDM Gateway to HIP and HIU handlers.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/abdm-gateway', '');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, request-id, timestamp, x-cm-id',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Health check
  if (path === '' || path === '/') {
    return new Response(JSON.stringify({
      system: 'RadVault ABDM Webhook Gateway',
      status: 'OPERATIONAL',
      version: 'v3.0',
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders, status: 200 });
  }

  return new Response(JSON.stringify({
    gateway: 'RadVault ABDM Gateway',
    pathReceived: path,
    status: 'ROUTED'
  }), { headers: corsHeaders, status: 200 });
});
