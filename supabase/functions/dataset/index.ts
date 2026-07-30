import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const DATASET_BUCKET = 'private-datasets';
const VERSION_PATTERN = /^tse-ms-\d{4}-\d{4}-v\d+$/;
const ALLOWED_ORIGINS = new Set([
  'https://plataformaeleitoral.ia.br',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
]);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase runtime secrets are unavailable.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://plataformaeleitoral.ia.br';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-device-id',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin'
  };
}

function jsonResponse(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' }, origin);
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse(403, { error: 'origin_not_allowed' }, origin);
  }

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const deviceId = request.headers.get('x-device-id') || '';
  const version = new URL(request.url).searchParams.get('version') || '';

  if (!token || !VERSION_PATTERN.test(version)) {
    return jsonResponse(400, { error: 'invalid_request' }, origin);
  }

  if (token.length === 64) {
    const { data: validation, error: validationError } = await supabase.rpc('validar_sessao', {
      p_token: token,
      p_device_id: deviceId
    });
    if (validationError) return jsonResponse(503, { error: 'session_validation_unavailable' }, origin);
    if (!validation?.valida) return jsonResponse(401, { error: validation?.motivo || 'invalid_session' }, origin);
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse(401, { error: 'invalid_user_session' }, origin);
    const { data: license } = await supabase.from('licencas').select('id')
      .eq('user_id', userData.user.id).eq('status', 'ativa').is('revogada_em', null).maybeSingle();
    if (!license) return jsonResponse(403, { error: 'license_required' }, origin);
    await supabase.from('licencas').update({ ultimo_acesso_em: new Date().toISOString() }).eq('id', license.id);
  }

  const { data: dataset, error: storageError } = await supabase.storage
    .from(DATASET_BUCKET)
    .download(`${version}.b64`);
  if (storageError || !dataset) {
    console.error('dataset_download_failed', storageError?.message);
    return jsonResponse(404, { error: 'dataset_not_found' }, origin);
  }

  return new Response(dataset, {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Dataset-Version': version
    }
  });
});
