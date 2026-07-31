# PE.IA — Plataforma Eleitoral Inteligente

Plataforma mobile-first com dados eleitorais protegidos desde 2010 e indicadores socioeconômicos de Mato Grosso do Sul.

**Desenvolvido por**: Girassol Inteligência  
**URL ao vivo**: https://plataformaeleitoral.ia.br  
**Dados**: TSE (2010-2024)

## Arquivos

```
PE26ELEITORAL/
├── index.html           (shell público do app)
├── manifest.json        (metadados PWA)
├── service-worker.js    (cache offline)
├── runtime-config.js    (configuração pública do backend)
├── version.json         (versões do app, dataset e cache)
├── vercel.json          (config headers)
├── icons/               (ícones do app)
├── README.md
├── DEVELOPMENT.md
└── .gitignore
```

## Deploy

**Connected ao GitHub + Vercel.**

Fluxo:
```bash
# No VS Code: Source Control → Message → Commit (✓) → Push (...)
# Resultado: Vercel deploya em ~30s em https://plataformaeleitoral.ia.br
```

## Design

- **Mobile-first absoluto**: 100% otimizado pra toque em celular
- **Neon premium**: preto profundo + verde, ciano, magenta, amarelo
- **Tipografia**: Playfair Display (títulos) + Inter (corpo)
- **Ícones**: SVG stroke vetorial, sem emojis
- **11 módulos**: perfil eleitoral, ranking, município, comparação, evolução, partidos, eleições municipais, eleições gerais, panorama, simulador e seleção por eleição

## Dados

Pré-agregados em JSON gzip, armazenados em bucket privado do Supabase:
- 163.329 registros de votos
- 79 municípios MS
- 7 cargos eleitorais
- 8 eleições (2010-2024)
- acesso online com autorização revalidada no backend

## Verificação

```bash
node --check runtime-config.js
node --check service-worker.js
node scripts/audit-config.mjs
```

O workflow `.github/workflows/audit.yml` valida pushes e pull requests.
O workflow `.github/workflows/production-health.yml` verifica a produção a
cada 30 minutos.

## Sessão de acesso

Estado atual: autenticação e carregamento do dataset protegido exigem internet. O Service Worker mantém somente a estrutura pública e os recursos estáticos da aplicação; o dataset não é persistido para autorização offline.

Na linha pública atual existem três situações claramente separadas:

- compradores e contas já ativadas entram pelo link mágico enviado ao e-mail cadastrado, sem código;
- pessoas convidadas confirmam primeiro o e-mail e depois vinculam um código-convite à conta;
- o Modo admin usa senha master e emite uma sessão administrativa revogável, com validade máxima de 90 dias.

O dataset não está no HTML público. A Edge Function `dataset` valida uma licença
ou sessão administrativa antes de cada download, e nenhuma cópia privada é
mantida para autorização offline. O histórico da transição de segurança está em
`SECURITY_TRANSITION.md`.

O painel administrativo preserva as tabelas no desktop e apresenta os registros
como cartões em telas pequenas, com ações adaptadas ao toque.

Procedimentos de operação, incidente e rollback estão em
[`RUNBOOK_OPERACIONAL.md`](RUNBOOK_OPERACIONAL.md).

Correções e alterações técnicas são registradas em [`CHANGELOG.md`](CHANGELOG.md). O campo “Sobre” apresenta somente os grandes marcos públicos da plataforma.

## Verificação autenticada

O smoke test usa uma credencial fornecida apenas no ambiente e revoga a sessão criada ao terminar:

```powershell
$env:PEIA_TESTER_MASTER='senha-fornecida-fora-do-repositorio'
node scripts/smoke-authenticated.mjs
Remove-Item Env:PEIA_TESTER_MASTER
```

---
Desenvolvido em 2026 · Girassol Inteligência
