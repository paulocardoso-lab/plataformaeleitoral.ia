# PE26 Eleitoral — Notas de Desenvolvimento

## Estrutura técnica

### Frontend
- **HTML5** + **CSS3** (mobile-first, Playfair + Inter)
- **Vanilla JavaScript** (zero deps no app, apenas pako inflate + chartmini)
- **SVG icons** (stroke, neon colors)

### Assets embutidos
- `pako_inflate.min.js` (21 KB) — descompressão gzip no navegador
- `chartmini.js` — gráficos canvas puro (barras, linhas)
- `dataset.b64` — 1.87 MB (gzip) → 15.6 MB (raw JSON)

### PWA offline
- `manifest.json` — installável em iOS/Android
- `service-worker.js` — cache-first estratégia
- `vercel.json` — headers corretos (SW nunca cacheado no CDN)

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

## As 9 telas

1. **Buscar Candidato** — busca por nome, mostra votos/ano/cargo
2. **Ranking Geral** — top 30 por cargo/ano/município
3. **Meu Município** — resumo (comparecimento, abstenção, vencedores)
4. **Comparar Municípios** — 2 municípios lado a lado
5. **Evolução no Tempo** — gráfico candidato 2010→2024
6. **Ranking de Partidos** — gráfico barras por partido
7. **Prefeito & Vereador** — municipais com ranking local
8. **Presidente & Governador** — estaduais/federais
9. **Sobre** — metodologia, fonte TSE, data geração

## Atualizar dados eleitorais

Quando tiver novos dados TSE:

1. **Rodas ETL Python** (fora deste repo):
   ```bash
   python3 build_dataset.py  # parquet → dataset.b64
   ```

2. **Substitui o `index.html`** (contém dataset embutido)

3. **Incrementa `CACHE_VERSION`** no service-worker.js:
   ```javascript
   const CACHE_VERSION = 'eleicoes-ms-v2'; // era v1
   ```
   Isso força atualização no celular dos usuários.

4. **Commit + Push**:
   ```bash
   git add index.html service-worker.js
   git commit -m "atualiza dados eleição 2026 (1º turno)"
   git push origin main
   ```

5. Vercel deployer em ~30s

## Performance

- **Tamanho final**: 1.94 MB (single-file HTML)
- **Descompressão**: <200ms em iPhone SE 2020
- **First paint**: ~500ms (dataset parse + render)
- **Scroll 60fps**: sim, canvas é nativo
- **Cache**: Service Worker cache-first, nunca vai à rede se tiver no cache

## Testes recomendados

### Mobile real
- iPhone SE (antiga) — confirma que 1.94MB carrega sem travar
- Android 8 (antigo) — Service Worker funciona
- iOS 16.4+ — instalação via Safari Share menu funciona

### Contraste/Acessibilidade
- DevTools > Lighthouse → Accessibility
- WCAG 2.1 AA: text light contra bg dark = alto contraste ✓

### Offline
- Modo avião ativado
- App já instalado
- Abre e funciona normalmente

## Links úteis

- **Vercel dashboard**: https://vercel.com
- **GitHub repo**: https://github.com/seu-usuario/PE26ELEITORAL
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
