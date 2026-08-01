# Histórico técnico de versões

Este arquivo registra alterações internas, correções e melhorias técnicas. O campo “Sobre” da plataforma exibe somente versões principais, como `1.0`, `2.0` e `3.0`.

## 1.12.0 — 01/08/2026

- Etapa 3 recebe navegação interna entre a montagem do cenário e o novo Painel das Listas.
- Cada partido isolado ou federação passa a ter um card atualizado em tempo real com candidaturas, votos, participação, composição por gênero, legenda, outros votos e posições disponíveis.
- Cards distinguem listas em atenção, prontas para revisão e concluídas sem tratar o preenchimento do limite máximo como obrigatório.
- Painel permite consultar os nomes de cada lista e marcá-la como concluída quando estiver regular.
- Alterações posteriores em candidaturas, votos ou gênero retiram automaticamente a marcação de conclusão para exigir nova revisão.

## 1.11.0 — 01/08/2026

- Limites de candidaturas passam a ser aplicados separadamente a cada partido isolado ou federação: 9 para deputado federal e 25 para deputado estadual em Mato Grosso do Sul.
- Identificação canônica da lista eleitoral corrige agrupamentos inconsistentes em cenários antigos, na contagem, no autopreenchimento e no cálculo de vagas.
- Cadastro de candidaturas passa a registrar gênero e verificar os percentuais mínimo de 30% e máximo de 70%.
- Federações são verificadas globalmente e também nas indicações de cada partido integrante.
- Alertas orientam a regularização dentro da etapa 3 e inclusões que inviabilizariam a cota dentro do limite restante são bloqueadas.
- Candidaturas criadas pelo preenchimento automático recebem gênero de forma equilibrada.

## 1.10.0 — 31/07/2026

- Convites diretos passam a liberar acesso sem autenticação ou envio de e-mail pelo Supabase.
- Códigos descartáveis ficam armazenados somente como hash e são vinculados ao dispositivo na ativação.
- Sessões de convidados recebem validade, revogação administrativa e limitação de tentativas.
- Painel administrativo passa a criar, identificar e revogar convites diretos.
- Acesso por convite permanece isolado das permissões administrativas.

## 1.9.0 — 31/07/2026

- Login passa a priorizar visualmente o acesso de compradores e contas já ativadas.
- Compra e primeira ativação por convite usam jornadas visuais distintas sobre a mesma autenticação do Supabase.
- Retorno do link preserva o contexto de compra ou convite sem conceder autorização pelo parâmetro visual.
- Fluxo de código-convite recolhido sob um envelope neon discreto e acessível.
- Orientações de compra reorganizadas como passo a passo após o botão principal.
- Mensagens de envio concluído passam a usar o verde de sucesso; alertas mantêm a cor de erro.
- Textos, alinhamentos e tipografia do acesso por e-mail simplificados para leitura no mobile.

## 1.8.2 — 31/07/2026

- Painel administrativo aprimorado para uso em celulares sem alterações na identidade visual.
- Tabelas administrativas apresentadas como cartões em telas pequenas.
- Cabeçalho, formulários, ações e áreas de toque adaptados à navegação mobile.
- Tipografia e espaçamentos compactados para ampliar a quantidade de informações visíveis.
- Campos preservados em tamanho seguro contra ampliação automática do navegador.

## 1.8.1 — 31/07/2026

- Login passa a distinguir compradores e contas já ativadas do fluxo de código-convite.
- Código-convite apresentado como caminho secundário e habilitado somente após a confirmação do e-mail.
- Tela “Sobre” recebe chamada comercial para compartilhamento do acesso.
- Assinatura da Girassol Inteligência reposicionada com link institucional.
- Saída segura da conta adicionada como controle circular discreto ao final da tela “Sobre”.

## 1.8.0 — 31/07/2026

- Login reorganizado em duas etapas explícitas: confirmação do e-mail e vinculação do código.
- Campo de código mantido bloqueado até a autenticação da conta.
- Conta confirmada identificada de forma mascarada antes da vinculação da licença.
- Textos revisados para esclarecer que o código administrativo não substitui o login por e-mail.

## 1.7.1 — 31/07/2026

- Simulador avança automaticamente para o próximo campo após cada seleção ou preenchimento concluído.
- Retorno ao início da inclusão após adicionar uma candidatura preservado.

## 1.7.0 — 31/07/2026

- Enquadramento automático por largura, altura e orientação para celulares e tablets.
- Campos em dispositivos de toque protegidos contra a ampliação automática do Safari.
- Espaçamentos compactos aplicados sem interferir nas preferências A− e A+.

## 1.6.1 — 31/07/2026

- Simulador retorna ao campo de inclusão após confirmar uma candidatura.
- Fontes de sugestões, resultados e controles de ajuda do simulador ajustadas para uma leitura mais compacta.

## 1.6.0 — 31/07/2026

- Degradês do modo normal substituídos por cores sólidas da paleta existente.
- Identidade visual do modo aeroporto preservada sem alterações.

## 1.5.4 — 31/07/2026

- Botões existentes da tela principal reordenados conforme a jornada de consulta, sem alterações visuais ou funcionais.

## 1.5.3 — 31/07/2026

- Símbolo do botão de alternância visual equalizado com os demais controles do rodapé.

## 1.5.2 — 31/07/2026

- Tela “Sobre” simplificada para textos brancos e destaques amarelos, sem degradês.
- Assinatura oficial e link ativo da Girassol Inteligência adicionados ao encerramento da tela.
- Botão de compartilhamento do link comercial com suporte nativo no celular e cópia no desktop.

## 1.5.1 — 31/07/2026

- Reconhecimento de voz encerrado imediatamente após a transcrição final ou a seleção de um resultado.
- Segundo toque no microfone passa a interromper a gravação em andamento.
- Estado visual e acessível do botão sincronizado no mobile e no desktop.

## 1.5.0 — 31/07/2026

- Acesso por senha master renomeado para “Modo admin” em toda a interface.
- Engrenagem administrativa liberada somente após validação da sessão master no servidor.
- API administrativa passa a aceitar tanto a sessão master válida quanto a conta administrativa autorizada.
- Sessões do painel renomeadas para “Sessões administrativas”.

## 1.4.8 — 31/07/2026

- Logomarca original anterior restaurada também na tela de login.
- Assinatura discreta da Girassol e sua função tester preservadas.

## 1.4.7 — 31/07/2026

- Acesso tester reposicionado como assinatura institucional discreta no fim do cartão de login.
- Removidos borda, marcador de expansão e aparência visual de botão da assinatura Girassol.
- Tipografia, tamanho e centralização igualados à assinatura usada dentro da aplicação.

## 1.4.6 — 31/07/2026

- Número da versão padronizado com a tipografia e o tamanho da assinatura institucional.
- Versão posicionada à direita em coluna independente, sem interferir na centralização da frase.

## 1.4.5 — 31/07/2026

- Logomarca do cabeçalho restaurada para a versão original anterior.
- Nova logomarca mantida somente na tela de acesso.

## 1.4.4 — 31/07/2026

- Fonte da assinatura institucional reduzida para a faixa de 7 a 9 px.
- Centralização calculada exclusivamente pela frase; a logomarca permanece em coluna lateral independente.

## 1.4.3 — 31/07/2026

- Assinatura “Desenvolvido por Girassol Inteligência” padronizada em IBM Plex Mono.
- Centralização da marca e da assinatura reforçada no rodapé para todos os tamanhos de tela e estilos visuais.

## 1.4.2 — 31/07/2026

- Nova logomarca da Plataforma Eleitoral Inteligente aplicada no login e no cabeçalho em formato WebP.
- A assinatura “Desenvolvido por Girassol Inteligência”, acompanhada da marca oficial, passa a abrir o acesso tester por senha master.
- Rótulo “Acesso temporário para testers” removido da interface, sem alteração das regras de autenticação.

## 1.4.1 — 31/07/2026

- Autopreenchimento corrigido para preservar integralmente nomes e votos manuais.
- Novas candidaturas simuladas criadas somente para completar listas elegíveis até 9 nomes federais ou 25 estaduais.
- Distribuição limitada exclusivamente aos votos ainda não preenchidos.
- Preenchimento manual mantido disponível mesmo após a liberação do atalho automático.
- Assinatura discreta “Desenvolvido por Girassol Inteligência” posicionada abaixo dos controles do rodapé e mantida integralmente visível nos dois estilos.

## 1.4.0 — 31/07/2026

- Autopreenchimento liberado a partir de 5 candidaturas federais ou 13 estaduais.
- Distribuição proporcional recomendada e opção de divisão igualitária.
- Prévia obrigatória antes da aplicação dos valores.
- Edição individual com atualização imediata do placar.
- Identificação de estimativas automáticas e ajustes manuais.
- Redistribuição sob comando e possibilidade de desfazer o último autopreenchimento.

## 1.3.1 — 31/07/2026

- Histórico público simplificado para mostrar somente grandes versões.
- Histórico técnico transferido para este arquivo.

## 1.3.0 — 31/07/2026

- Sanitização central de conteúdos dinâmicos.
- Remoção de manipuladores `onclick` e reforço da política de segurança.
- Metadados, política de conexão e documentação técnica atualizados.
- Testes de segurança, simulador e smoke autenticado incorporados.
- Início da modularização técnica com `security.js`.

## 1.2.3 — 31/07/2026

- Cabeçalho atualizado para representar dados eleitorais e indicadores socioeconômicos.

## 1.2.2 — 31/07/2026

- Aviso de atualização aprimorado no mobile.
- Uniformização de linguagem neutra na interface.

## 1.2.1 — 31/07/2026

- Atalho de evolução restaurado na página inicial e mantido no Perfil Eleitoral.

## 1.2.0 — 31/07/2026

- Revisão ampla da linguagem da interface.
- Evolução de candidaturas adicionada à página inicial.

## 1.1.1 — 31/07/2026

- Informações de fontes, conexão, transparência, acessibilidade e metodologia revisadas.

## 1.1.0 — 31/07/2026

- Página inicial reorganizada e nomes das análises simplificados.

## 1.0.0 — 31/07/2026

- Início da linha oficial de versionamento público.
- Consolidação da autenticação, dataset protegido, navegação mobile-first, análises eleitorais e Simulador de Vagas 2026.

## Numeração interna anterior

Antes da linha pública `1.x`, o projeto utilizou versões internas `2.x`. Esses números pertencem ao ciclo anterior de desenvolvimento e não correspondem à linha pública atual.
