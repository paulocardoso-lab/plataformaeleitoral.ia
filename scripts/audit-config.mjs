import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const configSource = read('runtime-config.js');
const index = read('index.html');
const worker = read('service-worker.js');
const version = JSON.parse(read('version.json'));
const vercel = JSON.parse(read('vercel.json'));

const refs = new Set(
  [...configSource.matchAll(/https:\/\/([a-z0-9]+)\.supabase\.co/g)].map((match) => match[1])
);
const configuredAppVersion = configSource.match(/appVersion:\s*'([^']+)'/)?.[1];
const configuredDatasetVersion = configSource.match(/datasetVersion:\s*'([^']+)'/)?.[1];
assert(refs.size === 1, `Esperado exatamente um project ref Supabase; encontrados: ${[...refs].join(', ') || 'nenhum'}`);
assert(configuredAppVersion === version.appVersion, 'appVersion diverge entre runtime-config.js e version.json');
assert(configuredDatasetVersion === version.datasetVersion, 'datasetVersion diverge entre runtime-config.js e version.json');
assert(!/https:\/\/[a-z0-9]+\.supabase\.co/.test(index), 'index.html não deve conter endpoint Supabase hardcoded');
assert(index.includes('/runtime-config.js'), 'index.html deve carregar runtime-config.js');
assert(worker.includes(`eleicoes-ms-${version.cacheSchema}`), 'cacheSchema de version.json diverge do Service Worker');
assert(worker.includes('networkFirst(event.request)'), 'navegações devem usar network-first');
assert(!worker.includes("cache.put(event.request, clone)"), 'cache indiscriminado de qualquer GET voltou a ser usado');
assert(JSON.stringify(vercel).includes('service-worker.js'), 'vercel.json deve definir headers do Service Worker');
assert(JSON.stringify(vercel).includes('no-cache, no-store, must-revalidate'), 'Service Worker deve usar no-store');
assert(JSON.stringify(vercel).includes(`https://${[...refs][0]}.supabase.co`), 'CSP diverge do project ref Supabase');
assert(index.includes("chamarRpc('validar_sessao'"), 'boot deve revalidar a sessão no backend');
assert(!index.includes("getItem('pe26_acesso_liberado')"), 'flag booleana legada não pode autorizar o acesso');
assert(index.includes('resultado.sessao_token'), 'ativação deve exigir token de sessão');

const runtimeFiles = ['index.html', 'runtime-config.js', 'service-worker.js', 'README.md', 'DEVELOPMENT.md'];
const accessCodePattern = /\bPEIA-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g;
for (const file of runtimeFiles) {
  const matches = read(file).match(accessCodePattern) || [];
  assert(matches.length === 0, `${file} contém possível código de acesso: ${matches.join(', ')}`);
}

const migrationNames = readdirSync(resolve(root, 'supabase/migrations'));
assert(migrationNames.length > 0, 'Nenhuma migration Supabase encontrada');
const sessionMigration = read('supabase/migrations/20260730120000_criar_sessoes_acesso.sql');
assert(sessionMigration.includes('token_hash bytea unique not null'), 'migration de sessão deve persistir somente hash do token');
assert(sessionMigration.includes("delete from public.codigos_acesso where origem = 'admin'"), 'código administrativo comprometido não foi revogado');

if (failures.length) {
  console.error('Auditoria de configuração falhou:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Configuração válida: Supabase ${[...refs][0]}, app ${version.appVersion}, cache ${version.cacheSchema}.`);
