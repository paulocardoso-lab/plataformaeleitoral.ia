# Eleições MS 2010–2024

PWA offline-first com resultados eleitorais dos 79 municípios de Mato Grosso do Sul.

## Estrutura

- `index.html` - App completo (1.94 MB, dataset embutido)
- `manifest.json` - Metadados PWA
- `service-worker.js` - Cache offline
- `vercel.json` - Config de headers e cache
- `icons/` - Ícones do app (192px, 512px, etc)

## Deploy

Connected ao Vercel. Push em `main` dispara deploy automático em ~30s.

```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

## URL ao vivo

https://plataformaeleitoral.ia.br

## Dados

Filtrado para 2010-2024, 79 municípios MS, 7 cargos. Fonte: TSE.
