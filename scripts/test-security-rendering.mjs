import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const index = readFileSync(new URL('index.html', root), 'utf8');
const securitySource = readFileSync(new URL('security.js', root), 'utf8');
const worker = readFileSync(new URL('service-worker.js', root), 'utf8');
const vercel = readFileSync(new URL('vercel.json', root), 'utf8');

const sandbox = { window: {} };
vm.runInNewContext(securitySource, sandbox);
const { escaparHtml } = sandbox.window.PEIA_SECURITY;

assert.equal(escaparHtml(`<img src=x onerror='alert(1)'>`), '&lt;img src=x onerror=&#39;alert(1)&#39;&gt;');
assert.equal(escaparHtml('João & Maria "Teste"'), 'João &amp; Maria &quot;Teste&quot;');
assert(index.includes('<script src="/security.js"></script>'), 'módulo de segurança não carregado');
assert(worker.includes("'/security.js'"), 'módulo de segurança ausente do cache da aplicação');
assert(!index.includes("onclick='selecionarBuscaUniversal("), 'busca universal voltou a interpolar argumentos em onclick');
assert(!index.includes("onclick='selecionarSugestao("), 'sugestões voltaram a interpolar argumentos em onclick');
assert(!index.includes('onclick='), 'eventos inline voltaram a ser usados');
assert(vercel.includes("script-src-attr 'none'"), 'CSP deve bloquear manipuladores de evento inline');
assert(!/\$\{(?:v\.candidato|nomeExibicaoCandidato\(v\)|v\.partido)\}<\/div>/.test(index),
  'resultado eleitoral dinâmico sem escape explícito');
assert(!index.includes('PRIVATE_DATASET_CACHE'), 'código residual de cache privado voltou a ser usado');
assert(!index.includes('offlineSessionGraceHours'), 'tolerância offline incompatível com a política online');

console.log('Segurança de renderização aprovada: 11 verificações.');
