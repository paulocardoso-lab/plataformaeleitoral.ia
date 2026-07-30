import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('KIWIFY_WEBHOOK_SECRET');
const PRODUCT_ID = 'd35c0dd0-8c4a-11f1-bc39-5f4458e00388';
const MAX_BODY_BYTES = 128 * 1024;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
  throw new Error('Kiwify webhook runtime secrets are unavailable.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const response = (status: number, body: Record<string, unknown>) => new Response(
  JSON.stringify(body),
  { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
);
const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let different = 0;
  for (let index = 0; index < left.length; index++) {
    different |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return different === 0;
};
const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return response(405, { error: 'method_not_allowed' });
  }
  const signature = new URL(request.url).searchParams.get('signature') || '';
  if (!safeEqual(signature, WEBHOOK_SECRET)) {
    return response(401, { error: 'invalid_signature' });
  }
  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > MAX_BODY_BYTES) {
    return response(413, { error: 'payload_too_large' });
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return response(413, { error: 'payload_too_large' });
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return response(400, { error: 'invalid_json' });
  }

  const product = (payload.Product || {}) as Record<string, unknown>;
  const customer = (payload.Customer || {}) as Record<string, unknown>;
  const eventType = clean(payload.webhook_event_type);
  const orderStatus = clean(payload.order_status);
  const orderId = clean(payload.order_id);
  const productId = clean(product.product_id);
  const email = clean(customer.email).toLowerCase();
  const approvedAt = clean(payload.approved_date) || null;

  if (productId !== PRODUCT_ID) {
    return response(403, { error: 'product_not_allowed' });
  }
  let action = '';
  if (eventType === 'order_approved' && orderStatus === 'paid' && approvedAt) {
    action = 'aprovar';
  } else if (eventType === 'order_refunded') {
    action = 'reembolsar';
  } else if (eventType === 'chargeback') {
    action = 'chargeback';
  } else {
    return response(202, { received: true, processed: false });
  }

  const { data, error } = await supabase.rpc('registrar_evento_comercial', {
    p_plataforma: 'kiwify',
    p_pedido_id: orderId,
    p_produto_id: productId,
    p_email: email,
    p_tipo_evento: eventType,
    p_status_pedido: orderStatus,
    p_acao: action,
    p_aprovado_em: approvedAt
  });
  if (error) {
    console.error('commercial_event_failed', error.code);
    return response(503, { error: 'processing_unavailable' });
  }
  if (!data?.sucesso) {
    const status = data?.motivo === 'produto_nao_autorizado' ? 403 : 400;
    return response(status, { error: data?.motivo || 'event_rejected' });
  }
  return response(200, { received: true, processed: true });
});
