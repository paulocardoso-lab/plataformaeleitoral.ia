# PE26 Eleitoral — Notas de Desenvolvimento

## Estrutura técnica

### Frontend
- **HTML5** + **CSS3** (mobile-first, Playfair + Inter)
- **Vanilla JavaScript** (zero deps no app, apenas pako inflate + chartmini)
- **SVG icons** (stroke, neon colors)

### Bibliotecas do shell
- `pako_inflate.min.js` (21 KB) — descompressão gzip no navegador
- `chartmini.js` — gráficos canvas puro (barras, linhas)

O dataset eleitoral não é embutido no frontend. Ele fica no bucket privado
`private-datasets` e é entregue pela Edge Function `dataset` após autorização.

### PWA
- `manifest.json` — installável em iOS/Android
- `service-worker.js` — network-first para HTML/configuração e cache-first para o shell
- `vercel.json` — headers corretos (SW nunca cacheado no CDN)
- `runtime-config.js` — endpoint público único do Supabase
- `version.json` — versão verificável do app, dataset e schema de cache
- `supabase/functions/dataset` — entrega autorizada do dataset privado

## Cores neon (CSS vars)

```css
--bg-0: #0a0e27        /* fundo principal, preto profundo */
--bg-1: #0f1535        /* cards, topbar */
--bg-2: #151d3d        /* inputs, elementos */
--neon-green: #00ff41  /* valores, primary */
--neon-cyan: #00d9ff   /* ícones, focus, interação */
--neon-magenta: #ff006e /* labels, destaques */
--neon-yellow: #ffd60a  /* top 1 ranking */
--text-light: #f0f0f0   /* texto principal */
--text-muted: #a0a0a0   /* texto secundário */
```

## Módulos da aplicação

A lista original de nove telas foi ampliada. A navegação atual também inclui o Simulador de Vagas 2026 e a seleção por tipo de eleição.

1. **Buscar Candidato** — busca por nome, mostra votos/ano/cargo
2. **Ranking Geral** — top 30 por cargo/ano/município
3. **Meu Município** — resumo (comparecimento, abstenção, vencedores)
4. **Comparar Municípios** — 2 municípios lado a lado
5. **Evolução no Tempo** — gráfico candidato 2010→2024
6. **Ranking de Partidos** — gráfico barras por partido
7. **Prefeito & Vereador** — municipais com ranking local
8. **Presidente & Governador** — estaduais/federais
9. **Panorama de MS** — indicadores socioeconômicos e fontes identificadas
10. **Simulador de Vagas 2026** — cenários proporcionais editáveis
11. **Sobre** — metodologia, fontes, versão, compartilhamento e saída da conta

## Acesso atual

- Compra ou licença existente: campo principal de e-mail, envio de link e passo a passo abaixo do botão; nenhum código é solicitado.
- Convite direto: envelope neon sem texto visível abre a entrada do código descartável, sem Supabase Auth ou e-mail.
- Modo admin: senha master ou conta administrativa autorizada.

A jornada de compra usa `signInWithOtp`. O convite direto chama a Edge Function
`direct-invite-access`, que aplica rate limit, consome o código uma única vez e
emite uma sessão opaca vinculada ao dispositivo. Essa sessão acessa somente o
dataset e nunca é aceita pela API administrativa.

O status compartilhado `#ativacaoErro` recebe a classe `sucesso` apenas quando
o Supabase aceita o envio do link. Novas validações removem essa classe para que
erros não sejam apresentados em verde.

O painel administrativo usa tabelas no desktop e cartões rotulados abaixo de
600 px. Campos permanecem com 16 px no mobile para evitar zoom automático;
cabeçalho, ações e rolagem respeitam áreas seguras do dispositivo.

## Atualizar dados eleitorais

## Testes locais

Antes de publicar alterações em rankings, turnos ou agregações:

```bash
node scripts/test-election-features.mjs
node scripts/audit-config.mjs
node scripts/audit-accessibility.mjs
```

A auditoria de acessibilidade verifica regras estruturais mobile-first,
ampliação, nomes de campos, controles nativos, foco, contraste, canvases e
anúncios dinâmicos. A validação em aparelhos reais continua obrigatória e está
descrita em `ACCESSIBILITY_TEST_MATRIX.md`.

Quando tiver novos dados TSE:

1. **Rodas ETL Python** (fora deste repo):
   ```bash
   python3 build_dataset.py  # parquet → dataset.b64
   ```

2. Envie o novo `.b64` para:
   `ss:///private-datasets/<datasetVersion>.b64`

3. Atualize `appVersion`, `datasetVersion` e `cacheSchema` em `version.json`.
   Mantenha os mesmos valores em `runtime-config.js` e `service-worker.js`.
   O CI bloqueia versões divergentes.

> Nota de segurança: a anon key do Supabase é pública por design. Não coloque
> service-role keys, códigos de ativação ou credenciais administrativas no Git.


4. **Commit + Push**:
   ```bash
   git add index.html service-worker.js
   git commit -m "atualiza dados eleição 2026 (1º turno)"
   git push origin main
   ```

5. Vercel deployer em ~30s

## Histórico: deploy da versão interna 2.7

Esta versão depende das RPCs de sessão. Aplique primeiro, nesta ordem:

1. `20260730110000_endurecer_permissoes_ativacao.sql`
2. `20260730120000_criar_sessoes_acesso.sql`
3. frontend estático

Não publique o frontend 2.7 antes das migrations. Consulte
`SECURITY_TRANSITION.md` para backup, testes e rollback.

## Histórico: dataset privado — versão interna 2.8+

```bash
supabase storage cp dataset_v2.b64 \
  ss:///private-datasets/tse-ms-2010-2024-v1.b64 \
  --linked --experimental --content-type text/plain --cache-control no-store

supabase functions deploy dataset \
  --project-ref rclbjiqfabuuhiwxmjwp \
  --no-verify-jwt --use-api
```

O arquivo `dataset*.b64` é ignorado pelo Git. Nunca volte a incorporá-lo ao
HTML ou a uma função versionada.

## Histórico: autenticação e Modo admin — versão interna 2.9+

- Clientes entram por link mágico e vinculam o código à sua conta.
- Sessões opacas 2.8 foram revogadas e não possuem caminho de migração.
- A senha master existe somente como hash em configuração privada; o secret
  anterior permanece apenas como fallback operacional.
- Cinco falhas em 15 minutos bloqueiam temporariamente o IP e o dispositivo.
- Sessões administrativas por senha master expiram definitivamente após 90 dias.

Para rotacionar a master, use o painel administrativo. Nunca grave a senha ou
o hash no repositório.

## Performance

- **Shell**: frontend estático em arquivo principal, sem dataset privado embutido
- **Dataset**: baixado e descompactado somente após autorização online
- **Gráficos**: canvas nativo
- **Cache**: navegação tenta a rede e usa o HTML em cache somente quando offline

## Testes recomendados

### Mobile real
- iPhone SE (antiga) — confirma que 1.94MB carrega sem travar
- Android 8 (antigo) — Service Worker funciona
- iOS 16.4+ — instalação via Safari Share menu funciona

### Contraste/Acessibilidade
- DevTools > Lighthouse → Accessibility
- Executar `node scripts/audit-accessibility.mjs`
- Seguir `ACCESSIBILITY_TEST_MATRIX.md`
- Meta: WCAG 2.2 AA e zero ocorrência crítica ou séria

### Rede
- Sem conexão, o shell abre e informa que os dados protegidos exigem internet.
- Ao reconectar, a sessão é revalidada antes do download.

## Links úteis

- **Vercel dashboard**: https://vercel.com
- **GitHub repo**: https://github.com/paulocardoso-lab/plataformaeleitoral.ia
- **App ao vivo**: https://plataformaeleitoral.ia.br
- **Domínio**: `.ia.br` registrado em registro.br (categoria IA)

## Rollback rápido

Se algo quebrar:

```bash
# Ver histórico
git log --oneline

# Voltar pra commit anterior
git revert <hash>
git push origin main
```

---
Playfair + Neon + Mobile-first = elegância performática
