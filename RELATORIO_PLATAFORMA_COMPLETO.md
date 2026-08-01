# Relatório completo — Plataforma Eleitoral Inteligente

**Data do levantamento:** 01/08/2026  
**Versão publicada verificada:** 1.13.1 · cache v76 · dataset `tse-ms-2010-2024-v1`
**Produção:** https://plataformaeleitoral.ia.br  
**Desenvolvimento:** Girassol Inteligência

## 1. Visão geral

A Plataforma Eleitoral Inteligente é uma aplicação mobile-first para consulta, comparação e interpretação de dados eleitorais de Mato Grosso do Sul. Ela combina histórico eleitoral, indicadores municipais e estaduais e uma ferramenta de simulação proporcional para 2026.

O público pode usar a plataforma para:

- pesquisar o desempenho histórico de uma candidatura;
- identificar rankings por cargo, ano e município;
- comparar municípios;
- acompanhar a evolução de uma candidatura ao longo do tempo;
- analisar partidos e federações;
- consultar eleições municipais e gerais;
- conhecer indicadores de Mato Grosso do Sul;
- testar cenários de distribuição de vagas em 2026.

## 2. Dados, fontes e limites

- Fonte principal dos resultados eleitorais: Tribunal Superior Eleitoral (TSE).
- Período eleitoral disponível: 2010 a 2024.
- Abrangência: 79 municípios de Mato Grosso do Sul.
- Cargos históricos: prefeito, vereador, presidente, governador, senador, deputado federal e deputado estadual.
- Base descrita no projeto: 163.329 registros de votos.
- Indicadores estaduais e socioeconômicos: fontes públicas identificadas em cada seção, incluindo SEMADESC/MS, SEAD/MS, CadÚnico, Sistema ELO, SIGO/SEJUSP e BIOSUL.
- Dataset privado: carregado somente depois da autorização do backend.
- A plataforma é independente e não representa o TSE, partidos, federações, candidaturas ou campanhas.
- O dataset não possui identificador permanente de pessoa; homônimos devem ser conferidos por cargo, partido, ano e município.
- O simulador produz projeções, não pesquisa eleitoral, resultado oficial ou garantia de eleição.

## 3. Acesso à plataforma

### 3.1 Acesso por e-mail

1. O usuário informa o e-mail cadastrado.
2. Solicita o link de acesso.
3. Abre a mensagem recebida.
4. Clica no link para entrar.
5. Deve guardar a mensagem para os próximos acessos; não é necessário cadastrar novamente o e-mail.

O acesso exige conexão com a internet e validação do backend. A plataforma não solicita código para compradores ou contas já ativadas.

### 3.2 Convite direto

O fluxo secundário permite informar um código de convite descartável. O convite é ativado no dispositivo, não exige confirmação por e-mail e não concede acesso ao painel administrativo. A sessão possui validade, vínculo ao dispositivo e possibilidade de revogação.

### 3.3 Modo administrativo

O acesso administrativo é separado do acesso comum. O painel permite:

- criar convites diretos com nome ou identificação e validade em dias;
- consultar convites e licenças;
- consultar sessões administrativas;
- consultar registros de auditoria;
- gerar e rotacionar a senha master;
- revogar sessões administrativas existentes.

O modo administrativo é protegido por sessão própria, expiração, revogação, rate limit e validações no backend.

## 4. Página inicial

A página inicial apresenta:

- identificação da plataforma;
- mensagem sobre dados oficiais do TSE;
- busca universal por candidatura, cidade ou cargo;
- busca por voz, quando suportada pelo navegador;
- cartões de acesso aos módulos.

A busca universal direciona o usuário para o módulo mais adequado, reduzindo a necessidade de conhecer previamente a organização interna da plataforma.

## 5. Módulos e funcionalidades

### 5.1 Perfil Eleitoral

Objetivo: encontrar uma candidatura e consultar seu histórico.

Como usar:

1. Abra “Perfil Eleitoral”.
2. Digite pelo menos três letras do nome.
3. Escolha um resultado.
4. Clique em “Ver detalhes”.

Informações apresentadas:

- nome e partido;
- cargo e ano;
- total de votos;
- percentual sobre votos válidos;
- resultado eleitoral;
- abrangência municipal ou estadual;
- posição no ranking, quando calculável;
- maior e menor votação registrada;
- votação por município no primeiro turno;
- votação no segundo turno, quando houver;
- histórico de candidaturas;
- variação de posição entre eleições.

O detalhe também informa que a base não contém fotografia, biografia, profissão, bens ou data de nascimento. Há alerta para possíveis homônimos.

### 5.2 Ranking Geral

Objetivo: descobrir as candidaturas mais votadas em determinado recorte.

Filtros:

- ano;
- cargo;
- município ou todos os municípios.

Resultado:

- ranking por votos;
- posição numérica;
- partido;
- situação eleitoral, quando disponível;
- percentual sobre votos válidos.

O ranking apresenta até 50 nomes quando o recorte é estadual e até 30 nomes quando há município selecionado.

### 5.3 Resultados por Município

Objetivo: consultar um retrato eleitoral e socioeconômico de um município.

Filtros:

- município;
- ano;
- primeiro ou segundo turno, quando disponível.

Informações:

- eleitores aptos;
- comparecimento;
- abstenções;
- percentual de votos válidos;
- votos válidos, brancos e nulos;
- pessoa eleita ou mais votada para prefeito;
- governador e presidente mais votados no município, quando aplicável;
- pobreza do município comparada à média estadual;
- famílias no CadÚnico;
- famílias no Bolsa Família.

### 5.4 Comparar Municípios

Objetivo: comparar dois municípios no mesmo recorte eleitoral.

Filtros:

- município A;
- município B;
- ano;
- cargo;
- turno, quando aplicável.

Comparações:

- comparecimento;
- eleitores aptos;
- cinco candidaturas mais votadas em cada município;
- votos e percentuais;
- indicação de ausência de segundo turno quando o turno não existe naquele município.

### 5.5 Evolução da Candidatura

Objetivo: acompanhar a trajetória de votos de uma pessoa ao longo dos anos.

Filtros:

- nome da candidatura;
- município opcional.

Resultado:

- gráfico de evolução dos votos;
- séries por candidatura, cargo, partido e município;
- ano e quantidade de votos;
- situação eleitoral;
- seleção de uma pessoa quando a busca parcial encontra homônimos ou mais de um nome.

Quando a análise envolve nomes iguais em municípios diferentes, a plataforma avisa que o dataset não possui identificador permanente e recomenda filtrar o município.

### 5.6 Desempenho dos Partidos

Objetivo: analisar a votação dos partidos em determinado recorte.

Filtros:

- ano;
- cargo;
- município ou todos os municípios;
- turno, quando disponível.

Resultado:

- gráfico de barras;
- ranking de partidos;
- votos por partido;
- percentuais sobre votos válidos;
- leitura visual de concentração e desempenho partidário.

### 5.7 Eleições Municipais

Objetivo: consultar prefeito e vereador.

Filtros:

- cargo: prefeito ou vereador;
- município;
- ano municipal;
- turno, quando disponível.

Resultado:

- ranking local;
- votos;
- partido;
- percentual;
- situação eleitoral;
- até 40 candidaturas no recorte apresentado.

### 5.8 Eleições Gerais

Objetivo: consultar cargos estaduais e nacionais.

Cargos:

- presidente;
- governador;
- senador;
- deputado federal;
- deputado estadual.

Filtros:

- cargo;
- município;
- ano;
- turno, quando disponível.

Resultado:

- ranking de votação;
- partido;
- votos;
- percentual;
- situação eleitoral;
- até 40 candidaturas no recorte apresentado.

### 5.9 Seleção por tipo de eleição

Antes de consultar determinados cargos, o usuário pode escolher entre:

- eleições municipais: prefeito e vereador;
- eleições gerais: presidente, governador, senador e deputados.

Essa camada reduz a quantidade de opções exibidas ao mesmo tempo e orienta o usuário para o conjunto correto de filtros.

### 5.10 Panorama de Mato Grosso do Sul

O Panorama de MS organiza indicadores por assunto:

- território;
- demografia;
- eleitorado;
- emprego e renda;
- educação;
- saúde;
- segurança;
- infraestrutura;
- economia.

Exemplos de informações:

- área, população, capital e municípios de fronteira;
- biomas e espécies catalogadas;
- perfil do eleitorado, escolaridade e faixa etária;
- renda, pobreza, índice Gini e emprego formal;
- alfabetização, matrículas e IDEB;
- leitos, estabelecimentos e óbitos;
- CVLI, homicídio, feminicídio, furto, roubo e tráfico;
- rodovias, frota, aeroportos e energia;
- produção de cana, açúcar e etanol.

Cada seção deve ser divulgada junto de sua fonte e ano de referência.

### 5.11 Simulador de Vagas 2026

Objetivo: criar uma projeção de distribuição de vagas pelo sistema proporcional.

Etapas atuais:

1. Escolha do cargo: deputado estadual, com 24 vagas, ou deputado federal, com 8 vagas.
2. Informe os votos válidos estimados para o cargo em todo o estado.
3. Adicione candidaturas, partidos, federações e votos.

O fluxo possui três camadas progressivas, três botões de navegação e permite voltar para editar qualquer etapa.

Recursos:

- pesquisa de candidatura histórica;
- inclusão de nome novo somente no cenário;
- seleção exclusivamente de partidos e federações cadastrados;
- inclusão de candidatura;
- inclusão de votos de legenda;
- inclusão de outras candidaturas não individualizadas;
- edição dos votos de cada candidatura;
- registro e edição do gênero de cada candidatura;
- verificação da cota de gênero de 30% a 70% na lista e nos partidos integrantes de federação;
- remoção de itens;
- preenchimento automático dos votos restantes quando os critérios da lista são atingidos;
- distribuição proporcional ou igualitária;
- desfazer autopreenchimento;
- alertas de votos faltantes ou excedentes;
- tratamento de empates;
- cálculo de vagas, eleitos e suplentes;
- identificação de resultado nominal parcial quando existem votos sem nome;
- aviso de vagas não preenchidas nominalmente.
- Painel das Listas com cards atualizados em tempo real;
- total de candidaturas, votos, participação, gênero, legenda e posições disponíveis por lista;
- marcação manual de uma lista regular como concluída;
- reinício apenas do cenário referente ao cargo atual;
- reinício completo dos cenários de deputado estadual e deputado federal;
- exclusão individual de partido ou federação diretamente no card da lista;
- confirmação obrigatória antes de qualquer reinício ou exclusão;
- resumo do impacto da ação antes da confirmação;
- opção temporária de desfazer a última ação de reinício ou exclusão.

#### Organização da limpeza e do reinício

As ações foram separadas para reduzir dúvidas:

- **Reiniciar simulador:** controle geral e discreto, usado para apagar o cargo atual ou todos os cenários.
- **Excluir lista:** controle pequeno dentro do card do respectivo partido ou federação, usado somente para remover aquela lista.
- **Desfazer:** aparece temporariamente depois da ação e restaura o estado anterior, desde que o usuário ainda não tenha feito uma nova alteração.

As antigas opções de limpar somente votos ou somente candidaturas não aparecem na interface. Essa simplificação evita a criação involuntária de cenários parcialmente preenchidos.

Os cards e botões de exclusão utilizam menor destaque visual. A prioridade do card permanece nas informações eleitorais, enquanto a exclusão é apresentada como ação secundária.

Regras de interação:

- digitar não muda de etapa sozinho;
- a etapa avança após seleção, Enter, saída validada do campo ou “Continuar”;
- não existe placar fixo;
- a revisão aparece no fluxo normal, na etapa 3;
- cenários ficam salvos somente no navegador atual;
- cenários não são sincronizados automaticamente com outro dispositivo.

Limites de comunicação:

- resultado é projeção;
- não representa pesquisa ou resultado oficial;
- alterar nomes, partidos ou votos altera apenas o cenário;
- o simulador não altera a base histórica oficial.

## 6. Funcionalidades transversais

### Busca por voz

Disponível na busca inicial e na busca de candidato quando o navegador oferece reconhecimento de voz. Se a tecnologia não for compatível, o usuário pode digitar normalmente. A busca por voz exige internet.

### Compartilhamento

- O detalhe de uma candidatura permite compartilhar um link específico da consulta.
- A tela “Sobre” permite compartilhar o link comercial da plataforma.
- No celular, usa o compartilhamento nativo; em outros ambientes, copia o link ou oferece o endereço para cópia.

### Acessibilidade

- layout mobile-first;
- aumento e redução de fonte;
- foco visível;
- navegação por teclado;
- nomes acessíveis em campos e botões;
- contraste reforçado;
- respeito à preferência por movimento reduzido;
- controles adaptados para toque.

### Personalização visual

O rodapé permite alternar o estilo Neon e o estilo Aeroporto. O usuário também pode alterar o tamanho da fonte em sete níveis.

### PWA e conexão

A aplicação pode ser instalada como PWA em dispositivos compatíveis. O shell e recursos públicos podem permanecer em cache, mas autenticação e dataset protegido exigem conexão online e nova autorização.

### Compartilhamento de links

A plataforma permite compartilhar links de acesso e de consultas compatíveis. A comunicação externa deve apresentar somente essa modalidade de compartilhamento.

## 7. Benefícios comerciais por público

### Cidadãos e eleitores

- entendem o histórico eleitoral do estado;
- comparam municípios e candidaturas;
- consultam dados sem depender de planilhas complexas;
- visualizam informações em celular.

### Jornalistas e comunicadores

- encontram rankings rapidamente;
- conferem séries históricas;
- comparam recortes municipais;
- identificam fontes e limitações da informação.

### Consultores, partidos e equipes políticas

- analisam desempenho territorial;
- observam concorrência e partidos;
- testam cenários proporcionais;
- organizam hipóteses em um cenário editável.

### Professores, estudantes e pesquisadores

- usam dados históricos como material didático;
- exploram indicadores de MS;
- transformam consultas em exercícios de análise eleitoral;
- discutem limites metodológicos e fontes públicas.

## 8. Mensagens comerciais permitidas

As peças devem dizer que a plataforma reúne dados eleitorais, análises e cenários de projeção. Evite afirmar que ela prevê resultados, garante eleição, substitui pesquisa eleitoral ou possui vínculo com o TSE.

CTA recomendado: **Conheça a Plataforma Eleitoral Inteligente:** https://plataformaeleitoral.ia.br  
Link comercial: https://pay.kiwify.com.br/411alXg

## 9. Prompts individuais para redes sociais

Use cada prompt separadamente em uma ferramenta de criação de texto, imagem ou vídeo. Substitua o formato conforme a rede social.

### Prompt 1 — Apresentação geral

> Crie um post para Instagram apresentando a Plataforma Eleitoral Inteligente como uma ferramenta mobile-first de consulta e análise eleitoral de Mato Grosso do Sul. Destaque dados históricos, rankings, comparação de municípios, indicadores estaduais e Simulador de Vagas 2026. Use linguagem clara, profissional e comercial. Não diga que a plataforma prevê eleições ou possui vínculo com o TSE. Finalize com CTA para conhecer a plataforma e assinar pelo link comercial.

### Prompt 2 — Perfil Eleitoral

> Crie um post curto mostrando como consultar o histórico de uma candidatura na Plataforma Eleitoral Inteligente. Explique que o usuário pode pesquisar por nome, ano, cargo, partido, votos, municípios e histórico. Use tom educativo e comercial. Finalize com: “Conheça a Plataforma Eleitoral Inteligente e transforme dados eleitorais em informação útil.”

### Prompt 3 — Ranking Geral

> Crie um carrossel de cinco slides sobre o Ranking Geral da Plataforma Eleitoral Inteligente. Mostre que é possível filtrar ano, cargo e município e visualizar votos, posição, partido e percentual. Use uma chamada que desperte curiosidade sem prometer previsão. Inclua CTA para conhecer e assinar a plataforma.

### Prompt 4 — Meu Município

> Crie um post para moradores e lideranças municipais explicando a tela “Resultados por Município”. Destaque eleitores aptos, comparecimento, abstenção, votos válidos, brancos, nulos, vencedores e indicadores socioeconômicos. Use linguagem simples e finalize com CTA comercial.

### Prompt 5 — Comparação de municípios

> Crie um post comparando a possibilidade de analisar dois municípios lado a lado na Plataforma Eleitoral Inteligente. Explique que o usuário consegue comparar comparecimento, eleitores aptos e candidaturas mais votadas no mesmo recorte. Estimule o público a testar a ferramenta.

### Prompt 6 — Evolução de candidaturas

> Crie um roteiro de vídeo de 30 segundos mostrando a tela “Evolução da Candidatura”. Explique como acompanhar a variação de votos ao longo dos anos e por município. Inclua um alerta responsável sobre homônimos e finalize convidando o público a acessar a plataforma.

### Prompt 7 — Desempenho dos partidos

> Crie um post de divulgação da tela “Desempenho dos Partidos”. Mostre gráficos, filtros por ano, cargo e município e a possibilidade de observar votos e percentuais. Use tom analítico, visual e comercial, sem fazer previsão eleitoral.

### Prompt 8 — Eleições municipais

> Crie um carrossel explicando como consultar prefeito e vereador por município, ano e turno na Plataforma Eleitoral Inteligente. Destaque ranking local, votos, partido, percentual e situação eleitoral. Use frases curtas e CTA para assinatura.

### Prompt 9 — Eleições gerais

> Crie um post explicando que a plataforma permite consultar presidente, governador, senador, deputado federal e deputado estadual. Mostre como filtrar cargo, município, ano e turno. Use linguagem acessível e inclua CTA para conhecer a plataforma.

### Prompt 10 — Panorama de MS

> Crie um post apresentando o Panorama de Mato Grosso do Sul. Liste território, demografia, eleitorado, emprego, renda, educação, saúde, segurança, infraestrutura e economia. Destaque que cada seção informa suas fontes. Finalize com uma chamada comercial responsável.

### Prompt 11 — Simulador de Vagas 2026

> Crie um vídeo curto apresentando o Simulador de Vagas 2026. Explique que o usuário escolhe o cargo, informa votos válidos, adiciona candidaturas e acompanha partidos e federações em cards atualizados em tempo real. Mostre que é possível revisar etapas, excluir uma lista específica ou reiniciar o cenário com confirmação. Deixe claro que o resultado é uma projeção, não uma pesquisa ou garantia de eleição. Finalize com CTA para assinar.

### Prompt 12 — Acesso por link

> Crie um post ensinando o acesso à Plataforma Eleitoral Inteligente: informar o e-mail cadastrado, procurar a mensagem, clicar no link e guardar a mensagem para os próximos acessos. Explique que não é necessário cadastrar o e-mail novamente. Use tom tranquilizador e comercial.

### Prompt 13 — Dados para jornalismo e pesquisa

> Crie um post direcionado a jornalistas, pesquisadores e estudantes mostrando como a Plataforma Eleitoral Inteligente ajuda a consultar dados eleitorais históricos, rankings, séries e comparações sem depender de planilhas dispersas. Destaque fontes e transparência. Inclua CTA comercial.

### Prompt 14 — Acessibilidade e celular

> Crie um post destacando que a Plataforma Eleitoral Inteligente foi pensada para celular, possui ampliação de fonte, contraste reforçado, navegação por teclado, foco visível e busca por voz quando compatível. Use linguagem inclusiva e termine com convite para conhecer a plataforma.

### Prompt 15 — Chamada comercial direta

> Escreva um anúncio direto para venda da Plataforma Eleitoral Inteligente. Público: pessoas interessadas em eleições de Mato Grosso do Sul, equipes políticas, jornalistas, professores e pesquisadores. Destaque consulta histórica, rankings, comparações, indicadores e simulador 2026. Não prometa prever resultados. Finalize com “Conheça e assine agora” e o link https://pay.kiwify.com.br/411alXg.

### Prompt 16 — Prova de utilidade

> Crie um post com a pergunta “Você sabe como uma candidatura performou em diferentes municípios e eleições?”. Apresente a Plataforma Eleitoral Inteligente como resposta para pesquisar, comparar e interpretar dados eleitorais de MS. Use tom de descoberta, linguagem simples e CTA de venda.

## 10. Estrutura sugerida para apostilas e manuais

1. O que é a Plataforma Eleitoral Inteligente.
2. Como acessar por e-mail.
3. Como usar a busca universal.
4. Perfil Eleitoral.
5. Ranking Geral.
6. Resultados por Município.
7. Comparar Municípios.
8. Evolução da Candidatura.
9. Desempenho dos Partidos.
10. Eleições Municipais.
11. Eleições Gerais.
12. Panorama de MS.
13. Simulador de Vagas 2026.
14. Como interpretar votos, percentuais e turnos.
15. Fontes, metodologia e limitações.
16. Acessibilidade, compartilhamento e saída segura.
17. Perguntas frequentes.

## 11. Perguntas frequentes para materiais de apoio

**A plataforma mostra resultado futuro?**  
Não. Ela consulta dados históricos e o simulador cria projeções baseadas nos valores informados.

**Os dados são oficiais?**  
Os resultados eleitorais têm o TSE como fonte, mas a plataforma é independente e não representa o TSE.

**O cenário do simulador altera os dados oficiais?**  
Não. Ele fica salvo somente no navegador e não altera a base histórica.

**Posso acessar de outro dispositivo e encontrar meu cenário?**  
Não automaticamente. Os cenários são locais no navegador em que foram criados.

**A plataforma tem fotos e biografias de candidatos?**  
Não. O dataset atual é de resultados eleitorais e históricos de candidaturas.

**Posso criar qualquer partido no simulador?**  
Não. O campo aceita somente partidos e federações cadastrados oficialmente no código da plataforma.

**Como apagar apenas um partido ou uma federação do cenário?**  
Abra o Painel das Listas e use “Excluir lista” no card correspondente. A plataforma informa o impacto e solicita confirmação antes de remover os dados.

**Como começar novamente?**  
Use “Reiniciar simulador”. É possível reiniciar apenas o cargo atual ou apagar os cenários dos dois cargos. A confirmação ocorre em uma segunda etapa.

**Posso desfazer uma exclusão ou reinício?**  
Sim. O comando “Desfazer” aparece temporariamente depois da ação. Ele deixa de estar disponível quando uma nova alteração é feita ou quando a página é encerrada.

**Como compartilhar a plataforma ou uma consulta?**  
Use os controles de compartilhamento de links disponíveis. No celular, a plataforma pode abrir o compartilhamento nativo; nos demais ambientes, o endereço pode ser copiado.

## 12. Diretrizes vigentes para materiais internos e externos

- A comunicação deve mencionar apenas o compartilhamento de links de acesso e consultas.
- Para materiais atuais, use `version.json` e confirme a versão efetivamente publicada; referências anteriores no histórico de versões não representam o estado corrente.
- A versão publicada corrente é 1.13.1, cache v76 e dataset `tse-ms-2010-2024-v1`.
- Toda divulgação deve manter a distinção entre dados históricos, projeção do simulador e resultado oficial.
