# Matriz de validação mobile e acessibilidade

Esta matriz complementa `scripts/audit-accessibility.mjs`. A auditoria automática
bloqueia regressões estruturais; os testes abaixo cobrem comportamento visual,
tecnologias assistivas e particularidades de navegadores reais.

## Critérios de aceite

- WCAG 2.2 AA nos fluxos essenciais.
- Nenhuma perda de conteúdo ou função em 320 CSS px.
- Texto ampliado a 200% sem corte, sobreposição ou controle inacessível.
- Zoom do navegador e gesto de pinça disponíveis.
- Todas as ações operáveis por teclado.
- Foco sempre visível e nunca oculto por cabeçalho, rodapé ou modal.
- Retrato e paisagem funcionais na PWA instalada e no navegador.
- Zero ocorrência crítica ou séria no axe/Lighthouse.

## Viewports obrigatórios

| Largura | Contexto | Orientações |
|---:|---|---|
| 320 px | iPhone SE antigo e reflow mínimo | Retrato e paisagem |
| 360 px | Android compacto | Retrato e paisagem |
| 375 px | iPhones tradicionais | Retrato e paisagem |
| 390 px | iPhone moderno | Retrato e paisagem |
| 412 px | Android moderno | Retrato e paisagem |
| 768 px | Tablet pequeno | Retrato e paisagem |
| 1024 px | Tablet grande/desktop estreito | Retrato e paisagem |

## Fluxos obrigatórios

### Login e acesso

- Link mágico: preencher e-mail, enviar, validar mensagens e retornar.
- Código de acesso: preencher máscara completa e validar erros.
- Tester: autenticar, fechar e reabrir o app, confirmando persistência.
- Abrir e fechar o painel administrativo por teclado e por toque.
- Confirmar que o teclado virtual não cobre campo, erro ou botão principal.

### Navegação

- Percorrer toda a home com Tab e Shift+Tab.
- Abrir cada tela com Enter e Espaço.
- Confirmar anúncio do nome da nova tela.
- Voltar à home e confirmar foco previsível.
- Alternar tema e todos os sete graus de fonte.

### Busca e filtros

- Usar busca universal com teclado, setas, Enter e Escape.
- Repetir em “Buscar candidato”.
- Usar busca por voz quando suportada.
- Trocar todos os selects, chips de cargo, turno e seção.
- Confirmar anúncio resumido quando os resultados mudam.

### Resultados e modais

- Abrir detalhes de candidato e percorrer o modal somente com teclado.
- Fechar com Escape e confirmar restauração do foco.
- Pesquisar e ordenar municípios dentro dos detalhes.
- Conferir ranking, comparação, evolução e partidos em 200% de zoom.
- Comparar cada gráfico com sua apresentação textual.
- Verificar nomes e valores longos sem corte significativo.

### PWA e condições do dispositivo

- Instalar a PWA e abrir em retrato e paisagem.
- Rotacionar com gráfico visível e confirmar redesenho.
- Testar safe areas em aparelhos com notch/ilha.
- Abrir offline e validar a mensagem de conectividade.
- Reconectar e confirmar recuperação sem recarregamento destrutivo.
- Ativar “reduzir movimento” no sistema e confirmar ausência de animações.

## Tecnologias assistivas

| Plataforma | Leitor | Navegador |
|---|---|---|
| Android | TalkBack | Chrome |
| iOS | VoiceOver | Safari |
| Windows | NVDA | Chrome e Firefox |
| macOS | VoiceOver | Safari |

Em cada combinação, validar landmarks, títulos, nomes dos controles, estados
pressionados, mensagens de erro, resultados dinâmicos e modais.

## Registro

Para cada execução, registrar:

- commit testado;
- aparelho, sistema e navegador;
- viewport/orientação;
- resultado por fluxo;
- capturas das falhas;
- severidade;
- responsável e versão da correção.

Uma versão só deve ser publicada quando não houver falha crítica ou séria e
quando todos os fluxos essenciais forem aprovados em pelo menos um Android e
um iPhone reais.
