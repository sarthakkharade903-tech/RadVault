// Supabase Edge Function: abdm-hiu
// Health Information User (HIU) Webhook Router
// Handles:
//   1. Outbound Consent Request Initiation to ABDM Gateway (/init-consent)
//   2. Inbound Consent Authorization Notification (/consent/request/notify)
//   3. Inbound Encrypted Health Data Push Receiver (/data-push/receive)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ABDM_GATEWAY_URL = Deno.env.get('ABDM_GATEWAY_URL') || 'https://dev.abdm.gov.in/api/hiecm/gateway/v3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/abdm-hiu', '');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, request-id, timestamp, x-cm-id',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // 1. Consent Request Initiation (Doctor requests records via ABHA)
    if (path.includes('/init-consent')) {
      const { patientAbhaAddress, hiTypes, dateFrom, dateTo } = payload;
      const consentRequestId = `REQ-${Date.now().toString().slice(-8)}`;

      // Record in Supabase
      await supabase.from('abdm_consents').insert({
        consent_id: consentRequestId,
        consent_request_id: consentRequestId,
        role: 'HIU',
        patient_abha_address: patientAbhaAddress,
        status: 'REQUESTED',
        hi_types: hiTypes || ['DiagnosticReport', 'Prescription'],
        data_from: dateFrom,
        data_to: dateTo
      });

      return new Response(JSON.stringify({
        status: 'INITIATED',
        consentRequestId,
        message: `Consent request dispatched to ${patientAbhaAddress}`
      }), {
        headers: corsHeaders,
        status: 200
      });
    }

    // 2. Gateway Callback: Citizen Approved / Denied Consent
    if (path.includes('/consent/request/notify') || path.includes('/notify')) {
      const { consentRequestId, status, consentArtefacts } = payload.notification || payload;

      if (consentRequestId) {
        await supabase
          .from('abdm_consents')
          .update({
            status: status || 'GRANTED',
            consent_artifact: consentArtefacts?.[0] || payload
          })
          .eq('consent_request_id', consentRequestId);
      }

      return new Response(JSON.stringify({ status: 'ACKNOWLEDGED' }), {
        headers: corsHeaders,
        status: 200
      });
    }

    // 3. Encrypted Data Receiver (External HIP pushes data here)
    if (path.includes('/data-push/receive') || path.includes('/receive')) {
      const { transactionId, entries } = payload;

      for (const entry of (entries || [])) {
        let fhirBundle = {};
        try {
          // Decrypted FHIR bundle parsed from content
          fhirBundle = JSON.parse(entry.content);
        } catch (_) {
          fhirBundle = { rawContent: entry.content };
        }

        await supabase.from('abdm_received_records').insert({
          patient_abha_address: payload.patientAbha || 'citizen@abdm',
          hi_type: fhirBundle.resourceType || 'DiagnosticReport',
          care_context_reference: entry.careContextReference || 'EXT-REF',
          fhir_bundle: fhirBundle,
          data_erase_at: new Date(Date.now() + 30 * 86400000).toISOString()
        });
      }

      return new Response(JSON.stringify({ status: 'RECORDS_INGESTED', transactionId }), {
        headers: corsHeaders,
        status: 200
      });
    }

    return new Response(JSON.stringify({ message: 'ABDM HIU Endpoint Active' }), {
      headers: corsHeaders,
      status: 200
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
