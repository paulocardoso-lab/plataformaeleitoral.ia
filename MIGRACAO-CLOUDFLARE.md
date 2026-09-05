# Migração Vercel → Cloudflare Pages

Preparação para publicar `plataformaeleitoral.ia` no Cloudflare Pages sem
interromper o site que está no ar.

**Estado atual:** produção roda na Vercel (`plataformaeleitoral.ia.br`),
com deploy automático a partir de `girassolinteligencia-dot/plataformaeleitoral.ia`.
Nada aqui altera isso.

---

## Por que a migração é simples neste projeto

- **Site estático puro** — sem build, sem serverless functions, sem pasta `api/`.
- **`vercel.json` só define headers** — nenhum rewrite, redirect ou cron.
- **O backend é o Supabase**, que não muda: as URLs e chaves em
  `runtime-config.js` seguem funcionando independentemente de quem serve o HTML.

O que precisou de conversão foi apenas o bloco de headers, agora em `_headers`.

---

## O que já está pronto

| Arquivo | Papel |
|---|---|
| `_headers` | Equivalente Cloudflare do bloco `headers` do `vercel.json` |

O `_headers` é lido pelo Cloudflare Pages e **ignorado pela Vercel**, então
pode conviver com a produção atual sem efeito nenhum.

### Diferenças de sintaxe tratadas

O Pages não aceita as regex do Vercel. Foram expandidas:

- `/(runtime-config.js|version.json)` → duas regras separadas
- `/(.*).html` → `/` e `/index.html` (só existe um HTML no projeto)

O restante (CSP, `X-Frame-Options`, `Permissions-Policy`, o `no-store` do
service worker) foi copiado sem alteração.

---

## Passo 1 — Publicar em `*.pages.dev` (sem tocar no DNS)

O objetivo é validar tudo num domínio de teste, com a Vercel intacta.

1. No painel da Cloudflare: **Workers & Pages → Create → Pages →
   Connect to Git**.
2. Autorize a conta **girassolinteligencia-dot** e escolha o repositório
   `plataformaeleitoral.ia`.
3. Configure o build:

   | Campo | Valor |
   |---|---|
   | Framework preset | **None** |
   | Build command | *(deixe vazio)* |
   | Build output directory | `/` |
   | Root directory | `/` |

   > Não configure comando de build: o site é servido como está.
   > O `package.json` só declara Playwright, usado nos testes locais.

4. Deploy. O site sobe em `https://<projeto>.pages.dev`.

### Alternativa por CLI

```bash
npx wrangler login
npx wrangler pages deploy . --project-name=plataformaeleitoral-ia
```

---

## Passo 2 — Validar antes de migrar o DNS

Com o site no `*.pages.dev`, confirme:

- [ ] **Página carrega** sem erro de CSP no console do navegador
- [ ] **Fontes e scripts externos** (`fonts.googleapis.com`, `cdn.jsdelivr.net`) carregam
- [ ] **Supabase responde** — login e carga do dataset funcionam
- [ ] **Service worker** registra e serve `Cache-Control: no-store`:
      ```bash
      curl -sI https://<projeto>.pages.dev/service-worker.js | grep -i cache-control
      ```
- [ ] **Headers de segurança** presentes:
      ```bash
      curl -sI https://<projeto>.pages.dev/ | grep -iE "content-security|x-frame|referrer"
      ```
- [ ] **Versões conferem**:
      ```bash
      curl -s https://<projeto>.pages.dev/version.json
      ```

O healthcheck (`scripts/healthcheck-production.mjs`) tem a URL de produção
fixa em `appUrl`. Para testar contra o Pages, altere a constante
temporariamente **sem commitar**.

---

## Passo 3 — Migrar o DNS (o passo de risco)

Só execute com o passo 2 inteiramente validado.

**Situação atual:** `plataformaeleitoral.ia.br` usa nameservers do
Registro.br (`*.sec.dns.br`) e aponta para o IP da Vercel (`76.76.21.21`).

1. Adicione o domínio à Cloudflare (**Add a site**) e deixe-a importar os
   registros DNS existentes. **Confira o que foi importado** — e-mail
   (MX), subdomínios e verificações costumam ser esquecidos.
2. No **Registro.br**, troque os nameservers para os que a Cloudflare indicar.
3. Aguarde a propagação — de minutos até 48h.
4. No projeto Pages, adicione o **Custom domain** `plataformaeleitoral.ia.br`.

> **Domínios `.br`:** a mudança de nameserver passa pelo Registro.br e pode
> exigir etapas adicionais de confirmação. Verifique se o domínio não está
> com bloqueio ou pendência antes de iniciar.

### Rollback

Mantenha o projeto da Vercel ativo por alguns dias. Se algo falhar, reverta
os nameservers no Registro.br para os anteriores — por isso, **anote os
valores atuais antes de trocar**.

---

## Impactos

**Não muda:**
- Código da aplicação
- Supabase (URLs, chaves, RLS, edge functions)
- Fluxo de deploy por push no GitHub

**Muda:**
- Quem serve os arquivos estáticos
- `vercel.json` deixa de valer; `_headers` passa a valer
- Analytics e logs migram para o painel da Cloudflare

**Requer atenção:**
- Propagação de DNS é o único ponto com risco real de indisponibilidade
- Se houver e-mail no domínio, os registros MX precisam ser preservados na
  importação
- O `Production health` continuará apontando para `plataformaeleitoral.ia.br`,
  então só ficará verde após a migração concluída

---

## Segundo projeto

`sitevozpublicamsoficial` (`vozpublicams.com.br`) **não foi analisado**.
Antes de migrá-lo, verifique se tem build ou serverless functions — se
tiver, a conversão não é tão direta quanto esta.
