# PE26 Eleitoral — Eleições MS 2010–2024

PWA offline-first com resultados eleitorais dos 79 municípios de Mato Grosso do Sul.

**Desenvolvido por**: Girassol Inteligência  
**URL ao vivo**: https://plataformaeleitoral.ia.br  
**Dados**: TSE (2010-2024)

## Arquivos

```
PE26ELEITORAL/
├── index.html           (app completo, 1.94 MB)
├── manifest.json        (metadados PWA)
├── service-worker.js    (cache offline)
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

Pré-agregados em JSON gzip (base64 embutido no HTML):
- 163.329 registros de votos
- 79 municípios MS
- 7 cargos eleitorais
- 8 eleições (2010-2024)
- 100% offline após 1ª visita (Service Worker)

---
Desenvolvido em 2026 · Girassol Inteligência
