import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260730230000_integrar_compras_kiwify.sql', import.meta.url),
  'utf8'
);
const webhook = readFileSync(
  new URL('../supabase/functions/kiwify-webhook/index.ts', import.meta.url),
  'utf8'
);
const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');

assert(webhook.includes("new URL(request.url).searchParams.get('signature')"),
  'o segredo deve ser recebido pelo parâmetro signature');
assert(webhook.includes("{ name: 'HMAC', hash: 'SHA-1' }"),
  'a assinatura da Kiwify deve usar HMAC-SHA1');
assert(webhook.indexOf('await request.text()') < webhook.indexOf('await hmacSha1(rawBody, WEBHOOK_SECRET)'),
  'a assinatura deve ser calculada sobre o corpo bruto recebido');
assert(webhook.includes("eventType === 'order_approved' && orderStatus === 'paid' && approvedAt"),
  'a aprovação deve exigir evento, status pago e data');
assert(webhook.includes("eventType === 'order_refunded'"),
  'reembolso deve ser tratado');
assert(webhook.includes("eventType === 'chargeback'"),
  'chargeback deve ser tratado');
assert(webhook.includes("productId !== PRODUCT_ID"),
  'produto deve ser validado antes do processamento');
assert(webhook.includes('MAX_BODY_BYTES'),
  'o tamanho do corpo deve ser limitado');
assert(!/CPF|cnpj|mobile|street|card_last/i.test(webhook),
  'dados pessoais ou financeiros desnecessários não devem ser extraídos');

assert(migration.includes("unique (plataforma, pedido_id, tipo_evento)"),
  'eventos devem ser idempotentes');
assert(migration.includes("pedido_comercial_id"),
  'a licença deve manter a origem comercial para revogação seletiva');
assert(migration.includes("public.reivindicar_compra_usuario()"),
  'a compra deve ser vinculável ao usuário autenticado');
assert(migration.includes("public.pedidos_comerciais.status in ('reembolsado','chargeback','revogado')"),
  'aprovação atrasada não deve reativar um pedido encerrado');
assert(config.includes('[functions.kiwify-webhook]') && config.includes('verify_jwt = false'),
  'a função deve aceitar a chamada externa, protegida pela assinatura própria');

console.log('Integração comercial: verificações estáticas aprovadas.');
