# PE26 Eleitoral — Eleições MS 2010–2024

PWA offline-first com resultados eleitorais dos 79 municípios de Mato Grosso do Sul.

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
- **9 telas**: busca candidato, ranking, município, comparação, evolução, partidos, prefeito, presidente, sobre

## Dados

Pré-agregados em JSON gzip, armazenados em bucket privado do Supabase:
- 163.329 registros de votos
- 79 municípios MS
- 7 cargos eleitorais
- 8 eleições (2010-2024)
- offline após o primeiro download autorizado

## Verificação

```bash
node --check runtime-config.js
node --check service-worker.js
node scripts/audit-config.mjs
```

O workflow `.github/workflows/audit.yml` executa essas verificações em pushes
para `main` e em pull requests.

## Sessão de acesso

A partir da versão 2.7, a ativação retorna um token opaco. O Supabase armazena
somente o hash do token e revalida a sessão no boot. As migrations devem ser
aplicadas antes do deploy do frontend; veja `SECURITY_TRANSITION.md`.

Na versão 2.8, o dataset não está mais no HTML público. A Edge Function
`dataset` valida a sessão antes do download e o cliente mantém uma cópia
offline privada, removida no logout.

Na versão 2.9 há somente dois acessos: link mágico por e-mail para clientes e senha
master para testers. A senha master emite sessão revogável de 90 dias e nunca
é armazenada no Git ou no banco.

---
Desenvolvido em 2026 · Girassol Inteligência
