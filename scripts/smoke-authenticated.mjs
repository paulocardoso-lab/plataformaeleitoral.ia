import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const master = process.env.PEIA_TESTER_MASTER;
if (!master) {
  console.error('Defina PEIA_TESTER_MASTER somente no ambiente para executar o teste autenticado.');
  process.exit(2);
}

const config = readFileSync(new URL('../runtime-config.js', import.meta.url), 'utf8');
const pick = (name) => config.match(new RegExp(`${name}:\\s*'([^']+)'`))?.[1];
const testerUrl = pick('testerFunctionUrl');
const datasetUrl = pick('datasetFunctionUrl');
const datasetVersion = pick('datasetVersion');
const supabaseUrl = pick('supabaseUrl');
const anonKey = pick('supabaseAnonKey');
const deviceId = `smoke-${randomUUID()}`;
let token = '';

try {
  const login = await fetch(testerUrl, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json', 'X-Device-Id': deviceId, Origin: 'http://127.0.0.1:4173' },
    body: JSON.stringify({ password: master })
  });
  assert.equal(login.status, 200, `login tester retornou ${login.status}`);
  const session = await login.json();
  token = session.sessao_token;
  assert(token && token.length >= 32, 'sessão tester não foi emitida');

  const dataset = await fetch(`${datasetUrl}?version=${encodeURIComponent(datasetVersion)}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'X-Device-Id': deviceId, Origin: 'http://127.0.0.1:4173' }
  });
  assert.equal(dataset.status, 200, `dataset autenticado retornou ${dataset.status}`);
  assert.equal(dataset.headers.get('x-dataset-version'), datasetVersion, 'versão do dataset divergente');
  assert((await dataset.text()).startsWith('H4sI'), 'payload do dataset inválido');
  console.log('Smoke autenticado aprovado: login tester e dataset protegido.');
} finally {
  if (token) {
    await fetch(`${supabaseUrl}/rest/v1/rpc/revogar_sessao`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: token, p_device_id: deviceId })
    }).catch(() => undefined);
  }
}
