# PE26 ELEITORAL — Padrão de Trabalho

**Pasta raiz**: `C:\PE26ELEITORAL`  
**Git repo**: conectado ao GitHub (`origin main`)  
**Deploy**: automático via Vercel (push → 30s)  
**URL ao vivo**: https://plataformaeleitoral.ia.br

---

## Estrutura de pastas (DEFINITIVA)

```
C:\PE26ELEITORAL\
├── index.html               (app completo, 1.94 MB, dataset embutido)
├── manifest.json            (metadados PWA — neon dark)
├── service-worker.js        (cache offline — CACHE_VERSION incremental)
├── vercel.json              (headers corretos para Vercel)
├── icons/                   (ícones PNG: 16, 32, 180, 192, 512)
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-180.png
│   ├── icon-192.png
│   └── icon-512.png
├── README.md                (info geral do projeto)
├── DEVELOPMENT.md           (notas técnicas, design, dados)
├── .gitignore               (node_modules, .DS_Store, etc)
└── .git/                    (gerenciado pelo GitHub — não mexer)
```

---

## Fluxo de trabalho padrão (VS Code + GitHub)

### Abrir o projeto
```bash
1. VS Code → File → Open Folder
2. Navega pra C:\PE26ELEITORAL
3. Clica "Select Folder"
```

### Editar arquivo
```bash
1. Abre arquivo no editor
2. Faz mudança (ex: cor, texto, lógica)
3. Salva (Ctrl+S)
```

### Fazer commit
```bash
1. Barra esquerda → Source Control (ícone de ramo)
2. Campo "Message" → escreve descrição
3. Clica ✓ (checkmark) ou Ctrl+Enter
```

### Push pro GitHub
```bash
1. ... (três pontinhos) → Push
2. Ou Terminal → git push origin main
3. Espera confirmação
```

### Resultado
```bash
~30s depois: Vercel deployer automaticamente
URL ao vivo atualizada: https://plataformaeleitoral.ia.br
```

---

## Tipos de mudança e mensagens de commit

### Atualizar dados eleitorais
```bash
git commit -m "dados: atualiza TSE 2026 1º turno"
# Incrementa CACHE_VERSION no service-worker.js junto
```

### Mudança de design/cores
```bash
git commit -m "design: ajusta cores neon (mais verde, menos magenta)"
# Edita variáveis CSS em index.html <style> section
```

### Correção de bug
```bash
git commit -m "fix: corrige busca de candidato com acentuação"
# Edita lógica em index.html <script> section
```

### Nova feature
```bash
git commit -m "feat: adiciona export PDF dos resultados"
# Adiciona nova seção no JS
```

### Otimização/refactor
```bash
git commit -m "refactor: reorganiza lógica de ranking para performance"
# Sem mudança visual, só código
```

---

## Arquivos que NÃO devem ser editados diretamente

- `.git/` — gerenciado pelo GitHub, nunca abrir
- `icons/` — alterar só se tiver novo design de ícones
- `.gitignore` — só se adicionar novas dependencies

---

## Arquivos que SÃO editados frequentemente

### 1. `index.html`
- **Section**: `<style>` (CSS vars das cores)
- **Section**: `<body>` (estrutura de telas)
- **Script**: `__APP_JS__` área (lógica de negócio)
- **⚠️ Cuidado**: dataset embutido é ~1.9MB — não mexer manualmente

### 2. `service-worker.js`
- **Linha 6**: `const CACHE_VERSION = 'eleicoes-ms-v?'`
  - Incrementa de v1 → v2 → v3 quando tem dados novos
  - Força atualização no celular dos usuários

### 3. `manifest.json`
- `background_color` / `theme_color` (se mudar paleta neon)
- `name` / `short_name` (se mudar nome do app)
- `icons` (se adicionar novos ícones)

### 4. `vercel.json`
- Headers de cache só mexer se Cache-Control mudar

---

## Atualizar dados eleitorais (procedimento completo)

### Contexto
Você tem um script Python fora deste repo que:
- Lê parquets TSE
- Roda ETL
- Gera novo `dataset.b64` (gzip comprimido)
- Gera novo `index.html` (com dataset embutido)

### Passos
```bash
1. Roda script Python (gera novo index.html)
2. Copia novo index.html para C:\PE26ELEITORAL\
3. Abre C:\PE26ELEITORAL\ no VS Code
4. Edita service-worker.js linha 6:
   const CACHE_VERSION = 'eleicoes-ms-v2'; // era v1
5. Source Control → Message:
   "dados: eleição 2026 1º turno (TSE oficial)"
6. ✓ Commit
7. ... → Push
8. Vercel deployer em 30s
```

---

## Cores neon (referência para mudanças)

```css
--bg-0: #0a0e27        /* fundo principal, preto profundo */
--bg-1: #0f1535        /* cards, topbar */
--bg-2: #151d3d        /* inputs, elementos */
--neon-green: #00ff41  /* valores, primary */
--neon-cyan: #00d9ff   /* ícones, focus */
--neon-magenta: #ff006e /* labels */
--neon-yellow: #ffd60a  /* top 1 */
--text-light: #f0f0f0   /* texto principal */
--text-muted: #a0a0a0   /* texto secundário */
```

Se mudar cor: edita em `<style>` section do `index.html`, faz commit, push, deployer em 30s.

---

## Troubleshoot rápido

### "Source Control mostra conflito"
```bash
Terminal → git pull origin main
# Sincroniza com o que tá no GitHub
# Se houver conflito real, aparece mensagem — resolver manualmente
```

### "Push falhou, pede credencial"
```bash
VS Code → autenticação GitHub
# Aparece janela — clica "Authorize"
# Depois tenta Push de novo
```

### "Vercel não deployer"
```bash
1. Vercel.com → seu projeto
2. Ver se GitHub está conectado (Settings → Git)
3. Ver último deploy (Build Logs)
4. Se houver erro, aparece lá
```

### "Arquivo salvo mas não aparece na Source Control"
```bash
VS Code → View → Command Palette (Ctrl+Shift+P)
Digita: Git: Refresh
# Força atualização da detecção de mudanças
```

---

## Links essenciais

- **Repo GitHub**: https://github.com/seu-usuario/PE26ELEITORAL
- **Dashboard Vercel**: https://vercel.com
- **App ao vivo**: https://plataformaeleitoral.ia.br
- **Domínio**: registro.br (`.ia.br` categoria IA)

---

## Changelog histórico (para referência)

```
v1 (inicial)      — design azul urna + dourado
v2 (redesign)     — neon dark + playfair + ícones SVG (VOCÊ ESTÁ AQUI)
v3+ (futuras)     — atualizações de dados eleitorais
```

---

**Desenvolvido com Girassol Inteligência · 2026**  
**Mobile-first. Neon. Offline. Premium.**
