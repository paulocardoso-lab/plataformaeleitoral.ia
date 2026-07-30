import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const expected = JSON.parse(readFileSync(resolve(root, 'version.json'), 'utf8'));
const runtimeSource = readFileSync(resolve(root, 'runtime-config.js'), 'utf8');
const value = (name) => runtimeSource.match(new RegExp(`${name}:\\s*'([^']+)'`))?.[1];
const appUrl = 'https://plataformaeleitoral.ia.br';
const supabaseUrl = value('supabaseUrl');
const anonKey = value('supabaseAnonKey');
const datasetUrl = value('datasetFunctionUrl');
const testerUrl = value('testerFunctionUrl');
const adminUrl = value('adminFunctionUrl');

const checks = [];
const check = (condition, message) => {
  checks.push({ ok: Boolean(condition), message });
  if (!condition) throw new Error(message);
};

const versionResponse = await fetch(`${appUrl}/version.json`, { cache: 'no-store' });
check(versionResponse.ok, `version.json retornou ${versionResponse.status}`);
const liveVersion = await versionResponse.json();
check(liveVersion.appVersion === expected.appVersion, `produção ${liveVersion.appVersion} diverge de ${expected.appVersion}`);
check(liveVersion.cacheSchema === expected.cacheSchema, `cache ${liveVersion.cacheSchema} diverge de ${expected.cacheSchema}`);

const homeResponse = await fetch(appUrl, { cache: 'no-store', redirect: 'error' });
check(homeResponse.ok, `home retornou ${homeResponse.status}`);
check((homeResponse.headers.get('content-type') || '').includes('text/html'), 'home sem Content-Type HTML');

const workerResponse = await fetch(`${appUrl}/service-worker.js`, { cache: 'no-store' });
check(workerResponse.ok, `Service Worker retornou ${workerResponse.status}`);
check((workerResponse.headers.get('cache-control') || '').includes('no-store'), 'Service Worker pode ser retido pelo CDN');

const runtimeResponse = await fetch(`${appUrl}/runtime-config.js`, { cache: 'no-store' });
check(runtimeResponse.ok, `runtime-config retornou ${runtimeResponse.status}`);
check((await runtimeResponse.text()).includes(expected.appVersion), 'runtime-config de produção está desatualizado');

for (const endpoint of [datasetUrl, testerUrl, adminUrl]) {
  check(endpoint?.startsWith(`${supabaseUrl}/functions/v1/`), `endpoint inesperado: ${endpoint}`);
  const preflight = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: { Origin: appUrl, 'Access-Control-Request-Method': 'POST' }
  });
  check(preflight.status === 204, `preflight ${endpoint} retornou ${preflight.status}`);
  check(preflight.headers.get('access-control-allow-origin') === appUrl, `CORS divergente em ${endpoint}`);
}

const datasetDenied = await fetch(`${datasetUrl}?version=${encodeURIComponent(value('datasetVersion'))}`, {
  headers: { apikey: anonKey, Origin: appUrl, 'X-Device-Id': 'healthcheck-no-session' }
});
check(datasetDenied.status === 400, `dataset sem sessão retornou ${datasetDenied.status}`);

const adminDenied = await fetch(adminUrl, {
  method: 'POST',
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Origin: appUrl, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'summary' })
});
check(adminDenied.status === 403, `admin anônimo retornou ${adminDenied.status}`);

console.log(`Health check aprovado: ${checks.length} verificações, app ${expected.appVersion}, cache ${expected.cacheSchema}.`);
