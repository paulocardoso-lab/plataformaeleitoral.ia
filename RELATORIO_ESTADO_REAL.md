# Relatório de Estado Real — Plataforma Eleitoral Inteligente (PEI)

_Auditoria factual gerada em 2026-07-09, com base em leitura direta do código, migrations do Supabase e histórico Git._

---

## TAREFA 1 — Estrutura do projeto

**Raiz `C:\PE26ELEITORAL\`:**
```
.claude/                    (config do Claude Code)
.git/
.gitignore
.vercel/                    (config local do Vercel CLI)
DEVELOPMENT.md
PE26ELEITORAL_PADRÃO.md
README.md
dataset_v2.b64              (1.87 MB — não referenciado pelo app, arquivo solto não commitado)
icons/
index.html                  (2.03 MB, modificado em 08/07 16:22)
logo_64.b64                 (arquivo solto não commitado)
logo_footer_64.png          (arquivo solto não commitado)
manifest.json               (935 bytes)
node_modules/                (dependências locais: pako, sharp — usadas só em scripts pontuais, não pelo app)
service-worker.js           (2.7 KB)
supabase/                   (migrations)
vercel.json
```

**Não existe `package.json`.** O `node_modules/` presente foi criado por instalações pontuais (`npm install pako`/`sharp --no-save`) para gerar ícones e depurar o dataset — não é dependência declarada do projeto.

**`.env`, `.env.example`, `.env.local`: não existem.** Nenhuma variável de ambiente está configurada — as chaves do Supabase estão hardcoded diretamente no `index.html` (ver Tarefa 4).

**Pasta `icons/`** (13 arquivos):
```
icon-16.png, icon-32.png, icon-180.png, icon-192.png, icon-192-maskable.png,
icon-512.png, icon-512-maskable.png,
logopeia.png, logopeia-topbar.png,
logo-master.svg, logo-lockup.svg  (SVGs de versão anterior da logo, não usados hoje)
"logomarca PEI versaoMS transparente.png"  (arquivo de origem enviado pelo usuário, mantido no repo)
```

**Pastas `/api` ou `/functions`: não existem.** Confirmado: **não há nenhuma Vercel Function no projeto.**

---

## TAREFA 2 — Configuração Supabase

**URL do projeto:** `https://rclbjiqfabuuhiwxmjwp.supabase.co`

**Tabelas existentes: apenas uma — `codigos_acesso`.** Não há tabelas de produto, cliente, pedido, ou dataset eleitoral.

**Estrutura de `codigos_acesso`:**
```sql
create table codigos_acesso (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  status text not null default 'disponivel' check (status in ('disponivel', 'usado')),
  device_id text,
  criado_em timestamptz not null default now(),
  usado_em timestamptz,
  origem text not null default 'manual' check (origem in ('manual', 'hotmart', 'admin'))
);

create index idx_codigos_acesso_codigo on codigos_acesso (codigo);
```

**Row Level Security:** ativado na tabela, **sem nenhuma policy de SELECT/UPDATE/INSERT direta**. Confirmado ao vivo: a `anon key` não consegue ler a tabela diretamente (`GET .../codigos_acesso?select=*` retorna `[]`).

**Função SQL:** `ativar_codigo(p_codigo text, p_device_id text)` — `SECURITY DEFINER`, único ponto de acesso liberado à tabela (via `grant execute ... to anon`). Lógica:
- Código inexistente → `{sucesso:false, motivo:'codigo_invalido'}`
- Código com `origem='admin'` → sempre retorna sucesso, nunca marca como usado (coringa vitalício)
- Código já usado, mesmo `device_id` → sucesso idempotente (permite reinstalar o app sem perder acesso)
- Código já usado, `device_id` diferente → `{sucesso:false, motivo:'codigo_ja_utilizado'}`
- Código disponível → marca `status='usado'`, grava `device_id` e `usado_em`, retorna sucesso

**Não existe nenhum trigger, nem função que gera códigos automaticamente.** Todos os códigos até agora foram inseridos manualmente via migration SQL.

**Códigos hoje no banco** (sem `service_role key` não é possível fazer `SELECT` para contar quantos já foram usados — só há acesso de escrita via CLI/migrations):
- 10 códigos formato `PEIA-XXXX-XXXX`, origem `manual`, gerados para teste/primeiros compradores
- 1 código coringa `PEIA-ADMN-MSTR`, origem `admin`, vitalício (substituiu um coringa anterior `PEIA-ADMIN-MESTRE`, removido por ter formato incompatível com a máscara do input)

---

## TAREFA 3 — Integração Hotmart

**Não existe nenhuma integração Hotmart implementada.** Ponto mais importante deste relatório:

1. **Não há link de produto Hotmart configurado em lugar nenhum do código** — nem no `index.html`, nem em qualquer arquivo do projeto.
2. **Não existe nenhum arquivo/função que receba webhook da Hotmart.** Não há pasta `/api`, não há Vercel Functions, não há nenhum endpoint no projeto.
3. **Não existe endpoint de pagamento.**
4. **Não existe lógica de geração automática de código a partir de venda.** A "integração Hotmart" hoje existe apenas como:
   - O campo `origem` da tabela aceita o valor `'hotmart'` (constraint do banco já preparada)
   - Um comentário no SQL dizendo "Tabela de códigos de acesso para liberação da plataforma (venda via Hotmart)"

Isso é **só a preparação de schema**, não a integração funcionando.

---

## TAREFA 4 — Sistema de códigos de acesso (implementação real)

**HTML da tela de ativação** (`index.html`, ~linha 1155):
```html
<div id="telaAtivacao" class="hidden">
  <img src="/icons/logopeia.png" alt="PE.IA — Plataforma Eleitoral Inteligente" class="marca-logo-ativacao">
  <h2>Ative seu acesso</h2>
  <p>Digite o código de acesso recebido na confirmação da sua compra para liberar a plataforma neste dispositivo.</p>
  <input type="text" id="ativacaoInput" placeholder="CÓDIGO DE ACESSO" autocapitalize="characters" autocomplete="off">
  <div id="ativacaoErro"></div>
  <button id="btnAtivar" onclick="ativarAcesso()">Ativar</button>
</div>
```

**Função que valida** (`ativarAcesso()`, ~linha 3327):
```javascript
async function ativarAcesso() {
  const input = document.getElementById('ativacaoInput');
  const erro = document.getElementById('ativacaoErro');
  const btn = document.getElementById('btnAtivar');
  const codigo = input.value.trim().toUpperCase();

  erro.textContent = '';
  if (!codigo) {
    erro.textContent = 'Digite o código de acesso.';
    return;
  }
  if (!navigator.onLine) {
    erro.textContent = 'Conecte-se à internet para ativar o acesso pela primeira vez.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verificando...';

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ativar_codigo`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_codigo: codigo, p_device_id: obterDeviceId() })
    });
    const resultado = await resp.json();

    if (resultado.sucesso) {
      localStorage.setItem('pe26_acesso_liberado', 'true');
      esconderTelaAtivacao();
      iniciarApp();
    } else if (resultado.motivo === 'codigo_ja_utilizado') {
      erro.textContent = 'Este código já foi ativado em outro dispositivo.';
    } else {
      erro.textContent = 'Código inválido. Verifique e tente novamente.';
    }
  } catch (e) {
    erro.textContent = 'Não foi possível verificar o código agora. Tente novamente.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ativar';
  }
}
```

**Nota de segurança:** `SUPABASE_ANON_KEY` está **hardcoded diretamente no código-fonte público do `index.html`** (~linha 3302), visível a qualquer pessoa que inspecione o site. Isso é esperado/normal para uma `anon key` do Supabase (desenhada para ser pública — a segurança real vem do RLS + a função ser o único ponto de escrita), mas vale registrar que essa chave está exposta no HTML servido.

**Persistência no localStorage:**
- `pe26_device_id` — UUID gerado uma vez por navegador (`crypto.randomUUID()`)
- `pe26_acesso_liberado` — `'true'`/ausente, controla se pula a tela de ativação
- (Chaves não relacionadas: `pe26_estilo`, `pe26_tamanho_fonte`, `pe26_municipio_preferido`)

**Não existe endpoint `/api/validar-codigo`.** A validação é feita com `fetch` direto do browser para a API REST/RPC nativa do Supabase (`POST /rest/v1/rpc/ativar_codigo`) — **sem nenhuma camada de servidor própria no meio.**

**Fluxo de liberação após validação:**
```javascript
function iniciarApp() {
  carregarDados();       // descomprime o dataset embutido
  montarHome();
  initBuscaUniversal();
  carregarPreferenciaFonte();
}

window.addEventListener('DOMContentLoaded', () => {
  carregarPreferenciaEstilo();
  if (acessoLiberado()) {
    iniciarApp();
  } else {
    mostrarTelaAtivacao();
  }
  ...
});
```
Com acesso já liberado no `localStorage`, o app **nunca mais consulta o Supabase** — o dataset é local (embutido no HTML) e tudo funciona 100% offline dali em diante.

---

## TAREFA 5 — Dados da aplicação

1. **O dataset continua embutido em gzip+base64 dentro do `index.html`.** Não foi movido para o Supabase.
2. **Tamanho do `index.html`: 2.029.430 bytes (~2.03 MB), 3.419 linhas.**
3. Confirmado programaticamente: **79 municípios**, 8 anos (2010–2024), 7 cargos, 163.329 linhas de votos, 2.781 linhas de resumo. `meta.gerado_em: "2026-07-06"`, fonte: "TSE - Tribunal Superior Eleitoral".
4. Não há tabelas de dados eleitorais no Supabase — só `codigos_acesso`.

---

## TAREFA 6 — Vercel Functions

**Nenhuma existe.** Não há pasta `/api`, `/functions`, nem qualquer arquivo serverless no projeto. Itens como `/api/gerar-codigo-e-enviar-email` ou `/api/validar-codigo` **não foram criados** — a validação acontece via chamada direta do browser à API do Supabase, sem intermediário.

---

## TAREFA 7 — Arquivos críticos

**`manifest.json`** (conteúdo integral):
```json
{
  "name": "PE Inteligente MS",
  "short_name": "PEI-MS",
  "description": "Resultados eleitorais dos 79 municípios de Mato Grosso do Sul, 2010 a 2024. Dados oficiais do TSE.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0e27",
  "theme_color": "#0a0e27",
  "lang": "pt-BR",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**`service-worker.js`** (conteúdo integral):
```javascript
// Service Worker — Eleições MS 2010-2024
// Estratégia: cache-first (offline-first real). Incremente CACHE_VERSION
// sempre que publicar uma nova versão dos dados/app para forçar atualização.

const CACHE_VERSION = 'eleicoes-ms-v20';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/icon-180.png'
];

// html2canvas (CDN externo, usado só na exportação de imagem) é cacheado
// à parte, sem bloquear a instalação: cache.addAll() é atômico e uma falha
// de CORS/rede nesse recurso cross-origin não pode derrubar o offline-first
// do resto do app.
const ASSET_HTML2CANVAS = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

// Instala e pré-cacheia todos os assets essenciais
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS).then(() =>
        cache.add(ASSET_HTML2CANVAS).catch(() => {
          // sem internet na primeira instalação ou CDN indisponível:
          // exportação de imagem fica indisponível offline, resto do app segue normal
        })
      );
    })
  );
});

// Ativa e limpa caches de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Permite que o cliente force a troca imediata do worker em espera
// (usado pelo banner "Nova versão disponível" no index.html)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache-first: serve do cache imediatamente; só vai à rede se não tiver nada salvo
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // salva no cache uma cópia da resposta para uso offline futuro
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // sem rede e sem cache: fallback para a página principal
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
```

**Primeiras linhas do `index.html`:** meta tags PWA padrão, manifest/favicons, fonte Google (Archivo/IBM Plex Mono/Playfair Display/Inter), `<title>Plataforma Eleitoral Inteligente</title>`, e o `<style>` começa com a escala de `font-size` de acessibilidade (`html { font-size: 16px }` + variantes `g1`–`g7`).

**`vercel.json`:** só define headers HTTP (cache do service-worker, content-type do manifest, cache do HTML) — nenhuma configuração de function/rota.

**`.env`/`.env.local`: não existem.**

---

## TAREFA 8 — Fluxo comercial real hoje

1. **Pessoa acessa `plataformaeleitoral.ia.br`** → vê a **tela de ativação** imediatamente (bloqueio total, sem preview do conteúdo) pedindo um código.
2. **Não existe botão/link de "comprar" dentro do app.** Não há nenhuma referência à Hotmart no código.
3. **Não há webhook**, então nada dispara automaticamente numa compra.
4. **Não há envio automático de código por e-mail/WhatsApp.** Hoje, a única forma de alguém ter um código é entrega manual de um dos códigos gerados via SQL.
5. **Digitar o código:** o app faz uma chamada direta ao Supabase (`POST /rest/v1/rpc/ativar_codigo`), sem servidor intermediário.
6. **Após validado:** grava flag no `localStorage`, esconde a tela de ativação, carrega o dataset local e o app funciona 100% offline dali em diante (a menos que o `localStorage` seja limpo, aí pede o código de novo).

**Conclusão prática:** a comercialização via Hotmart está **arquiteturalmente preparada** (schema do banco já aceita `origem='hotmart'`), mas **funcionalmente não implementada**. Hoje seria necessário distribuir os 10 códigos manuais um a um — não há automação de venda→código.

---

## TAREFA 9 — Últimos commits

| Commit | Data/hora | O que mudou |
|---|---|---|
| `becf97d` | mais recente | Corrige nome e turno de candidatos a presidente em toda a busca/exibição |
| `00cf486` | | Exibe logomarca oficial PE.IA completa na Home, sem texto adicional |
| `2800743` | | Adiciona top 10 candidatos em Comparar Municípios e marca PE.IA na topbar |
| `2da3274` | | Adiciona exportação de resultados como imagem PNG com carimbo de marca |
| `5ce343c` | | Atualiza favicon e ícones PWA com a nova logomarca PE.IA |
| `c197c76` | 08/07 16:22 | Nome do app instalado → "PE Inteligente MS" |
| `1aa356e` | 08/07 16:19 | Reorganiza rodapé (logo/texto à esquerda, botões à direita) |
| `6b982d8` | 08/07 16:02 | Corrige máscara do código de ativação (tamanho variável) |
| `49c73ce` | 08/07 15:31 | Aumenta resolução da logo na tela de ativação |
| `2873dd8` | 08/07 15:19 | Máscara do código XXXX-XXXX-XXXX (1ª tentativa, com bug) |
| `5478bc5` | 08/07 12:18 | Nome do app + título da aba |
| `1d385a7` | 08/07 12:13 | Tema Neon como padrão + máscara do código |
| `c2d3c9f` | 08/07 12:07 | **Logomarca em todos os ícones + sistema de controle de acesso Supabase (implementação inicial)** |
| `e364d7c` | 08/07 11:30 | Histórico de versões v2.5 |
| `3ebe922` | 08/07 08:53 | Ajustes de tamanho/microfone |

**Não há tags de versionamento Git.** O "versionamento" existe apenas como texto solto no rodapé do app (hoje mostrando "v 2.5"), mantido manualmente a cada mudança relevante — não está automatizado nem vinculado a nenhum commit específico.

---

## Resumo do que falta para a fase comercial funcionar de ponta a ponta

1. Criar o produto na Hotmart e obter a URL de venda.
2. Construir um endpoint (Vercel Function ou Supabase Edge Function — nenhuma existe hoje) que receba o webhook de venda aprovada da Hotmart, valide a assinatura, e gere um código novo na tabela `codigos_acesso` com `origem='hotmart'`.
3. Configurar na Hotmart a entrega desse código ao comprador (e-mail de entrega/área de membros).
4. Adicionar um link/botão de "Comprar" no app apontando para a página de venda.

Nada disso foi implementado ainda.
