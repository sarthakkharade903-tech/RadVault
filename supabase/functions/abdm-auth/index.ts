// Supabase Edge Function: abdm-auth
// Handles OAuth 2.0 Client Credentials token exchange with ABDM Gateway v3.
// Caches Bearer tokens in-memory to prevent rate-limiting on NHA servers.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ABDM_GATEWAY_URL = Deno.env.get('ABDM_GATEWAY_URL') || 'https://dev.abdm.gov.in/api/hiecm/gateway/v3';
const ABDM_CLIENT_ID = Deno.env.get('ABDM_CLIENT_ID') || '';
const ABDM_CLIENT_SECRET = Deno.env.get('ABDM_CLIENT_SECRET') || '';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getAbdmAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60000) {
    return tokenCache.accessToken;
  }

  if (!ABDM_CLIENT_ID || !ABDM_CLIENT_SECRET) {
    throw new Error('Missing ABDM_CLIENT_ID or ABDM_CLIENT_SECRET in Supabase Secrets.');
  }

  const response = await fetch(`${ABDM_GATEWAY_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: ABDM_CLIENT_ID,
      clientSecret: ABDM_CLIENT_SECRET,
      grantType: 'client_credentials'
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ABDM Gateway session authentication failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const accessToken = data.accessToken || data.token;
  const expiresInSec = data.expiresIn || 1800;

  tokenCache = {
    accessToken,
    expiresAt: now + expiresInSec * 1000
  };

  return accessToken;
}

serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = await getAbdmAccessToken();
    return new Response(JSON.stringify({ accessToken: token, status: 'AUTHENTICATED' }), {
      headers: corsHeaders,
      status: 200
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, status: 'AUTH_FAILED' }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
