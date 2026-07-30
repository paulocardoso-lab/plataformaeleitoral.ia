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
assert(worker.includes("url.pathname === '/runtime-config.js'"), 'runtime config deve ter estratégia explícita');
assert(worker.includes('networkFirstResource(event.request)'), 'runtime config e versão devem usar network-first');
assert(!worker.includes("cache.put(event.request, clone)"), 'cache indiscriminado de qualquer GET voltou a ser usado');
assert(JSON.stringify(vercel).includes('service-worker.js'), 'vercel.json deve definir headers do Service Worker');
assert(JSON.stringify(vercel).includes('no-cache, no-store, must-revalidate'), 'Service Worker deve usar no-store');
assert(JSON.stringify(vercel).includes(`https://${[...refs][0]}.supabase.co`), 'CSP diverge do project ref Supabase');
assert(index.includes("chamarRpc('validar_sessao'"), 'boot deve revalidar a sessão no backend');
assert(!index.includes("getItem('pe26_acesso_liberado')"), 'flag booleana legada não pode autorizar o acesso');
assert(index.includes('resultado.sessao_token'), 'ativação deve exigir token de sessão');
assert(!index.includes('id="dataset-b64"'), 'dataset protegido não pode permanecer embutido no HTML');
assert(Buffer.byteLength(index, 'utf8') < 500_000, 'index.html voltou a carregar um payload incompatível com o shell público');
assert(index.includes('CONFIG.datasetFunctionUrl'), 'frontend deve obter o dataset pela Edge Function');
assert(index.includes("caches.delete(PRIVATE_DATASET_CACHE)"), 'frontend deve remover caches privados legados');
assert(!index.includes('privateCache.put('), 'dataset privado não pode ser persistido para uso offline');
assert(!index.includes("localStorage.setItem('pe26_sessao_token'"), 'token tester não pode ser persistido em localStorage');
assert(!index.includes("localStorage.setItem('pe26_device_id'"), 'device id tester não pode ser persistido em localStorage');
assert(index.includes("gravarCredencialSegura('tester_token'"), 'token tester deve ser persistido fora do localStorage');
assert(index.includes("lerCredencialSegura('tester_token'"), 'boot deve restaurar a sessão tester segura');
assert(index.includes('storage: AUTH_STORAGE'), 'sessão Auth deve usar armazenamento seguro compartilhado entre abas');
assert(index.includes('await limparPersistenciaLegada()'), 'boot deve remover credenciais e caches persistentes legados');
assert(index.includes('id="appLoading"'), 'estado global de carregamento não encontrado');
assert(index.includes('aria-live="polite"'), 'regiões de status acessíveis não encontradas');
assert(index.includes('class="login-shell"'), 'estrutura mobile-first do login não encontrada');
assert(index.includes('class="tester-detalhes"'), 'acesso tester deve permanecer recolhido');
assert(index.includes('id="btnMostrarMaster"'), 'controle de visibilidade da master não encontrado');
assert(index.includes("new BroadcastChannel('peia-session-v1')"), 'sincronização de sessão entre abas não encontrada');
assert(!index.includes("evento === 'SIGNED_IN' || evento === 'SIGNED_OUT'"),
  'eventos automáticos de Auth não devem provocar recarga cruzada entre abas');
assert(index.indexOf('id="bannerAtualizacao"') < index.indexOf('id="app"'),
  'banner de atualização deve permanecer visível fora da área autenticada');
assert(configSource.includes('offlineSessionGraceHours: 0'), 'dataset privado não deve aceitar autorização offline');
assert(index.includes("AUTH_CLIENT.auth.signInWithOtp"), 'login por link mágico não foi encontrado');
assert(index.includes('CONFIG.testerFunctionUrl'), 'acesso tester não foi encontrado');
assert(index.includes('CONFIG.adminFunctionUrl'), 'painel administrativo não foi encontrado');
assert(!index.includes('migrar_sessao_usuario'), 'compatibilidade com sessão legada não deve voltar');
assert(index.includes('@supabase/supabase-js@2.111.0'), 'Supabase JS deve estar fixado em versão auditada');
assert(index.includes('function formatarEmail'), 'máscara de e-mail não encontrada');
assert(index.includes('function formatarCodigoAcesso'), 'máscara de código não encontrada');
assert(index.includes('function formatarSenhaMaster'), 'máscara da senha master não encontrada');
assert((index.match(/pattern="\[A-Z0-9\]\{4\}-\[A-Z0-9\]\{4\}-\[A-Z0-9\]\{4\}"/g) || []).length >= 2,
  'código e master devem usar o formato XXXX-XXXX-XXXX');

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
const datasetFunction = read('supabase/functions/dataset/index.ts');
assert(datasetFunction.includes("DATASET_BUCKET = 'private-datasets'"), 'Edge Function aponta para bucket inesperado');
assert(datasetFunction.includes("supabase.rpc('validar_sessao'"), 'Edge Function deve validar sessão antes do download');
assert(datasetFunction.includes("'Cache-Control': 'private, no-store'"), 'resposta privada não pode ser cacheada por CDN');
assert(datasetFunction.includes("'Access-Control-Expose-Headers': 'X-Dataset-Version'"),
  'browser deve conseguir validar o cabeçalho de versão do dataset');
assert(datasetFunction.includes("from('licencas')"), 'Edge Function deve validar licença Auth');
assert(datasetFunction.includes("validation?.tipo !== 'tester'"), 'token opaco deve ser restrito a tester');
const testerFunction = read('supabase/functions/tester-access/index.ts');
assert(testerFunction.includes('TESTER_MASTER_PASSWORD_HASH'), 'senha tester deve vir de secret');
assert(testerFunction.includes('too_many_attempts'), 'acesso tester deve aplicar rate limit');
assert(testerFunction.includes(".eq('ip_hash',ipHash)"), 'rate limit deve ser aplicado independentemente do device id');
assert(testerFunction.includes('MASTER_PATTERN.test(password)'), 'senha master deve ser validada no servidor');
const adminFunction = read('supabase/functions/admin-access/index.ts');
assert(adminFunction.includes("from('administradores')"), 'API administrativa deve validar allowlist');
assert(adminFunction.includes("from('auditoria_administrativa')"), 'API administrativa deve registrar auditoria');
assert(adminFunction.includes("action==='rotate_master'"), 'API administrativa deve permitir rotação segura');

if (failures.length) {
  console.error('Auditoria de configuração falhou:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Configuração válida: Supabase ${[...refs][0]}, app ${version.appVersion}, cache ${version.cacheSchema}.`);
