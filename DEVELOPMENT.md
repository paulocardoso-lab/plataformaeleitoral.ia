# Desenvolvimento

## Fluxo de trabalho no VS Code

1. **Abrir projeto**: File → Open Folder → seleciona esta pasta
2. **Ver mudanças**: Source Control (ícone de ramo à esquerda)
3. **Fazer commit**: 
   - Escreve mensagem em "Message" box
   - Clica em ✓ (commit)
4. **Push**: Clica em "..." (menu) → Push

## Se quiser atualizar os dados

1. Rode o ETL (Python) pra gerar novo `index.html`
2. Coloca na pasta
3. Incrementa `CACHE_VERSION` no `service-worker.js`
4. Commit + Push

Exemplo de mudança no service-worker:
```javascript
const CACHE_VERSION = 'eleicoes-ms-v2'; // era v1
```

## Cores do design (neon)

```css
--bg-0: #0a0e27        (fundo principal)
--neon-green: #00ff41  (valores)
--neon-cyan: #00d9ff   (ícones, focus)
--neon-magenta: #ff006e (labels)
--neon-yellow: #ffd60a (top 1)
```

## Links úteis

- **Vercel**: https://vercel.com
- **GitHub**: https://github.com
- **App ao vivo**: https://plataformaeleitoral.ia.br
- **Acesso iOS**: Safari → Share → Add to Home Screen

---
Desenvolvido com Girassol Inteligência · 2026
