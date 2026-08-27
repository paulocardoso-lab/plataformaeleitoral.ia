import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { resolve } from 'node:path';

const html = readFileSync(resolve(import.meta.dirname, '..', 'index.html'), 'utf8');
const failures = [];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Função ${name} não encontrada.`);
  let depth = 0;
  let opened = false;
  for (let index = html.indexOf('{', start); index < html.length; index += 1) {
    if (html[index] === '{') { depth += 1; opened = true; }
    if (html[index] === '}') depth -= 1;
    if (opened && depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Função ${name} incompleta.`);
}

const context = vm.createContext({
  SIM_CARGOS: {
    'deputado estadual': { vagas: 24, limiteCandidatosPorLista:25, minimoAutopreenchimento:13, label: 'Deputado estadual' },
    'deputado federal': { vagas: 8, limiteCandidatosPorLista:9, minimoAutopreenchimento:5, label: 'Deputado federal' }
  },
  SIM_FEDERACOES: [
    { nome:'Federação Brasil da Esperança', sigla:'Fe Brasil', partidos:['PT','PCdoB','PV'] },
    { nome:'Federação PSDB Cidadania', sigla:'PSDB Cidadania', partidos:['PSDB','CIDADANIA'] },
    { nome:'Federação PSOL REDE', sigla:'PSOL REDE', partidos:['PSOL','REDE'] }
  ],
  SIM_PARTIDOS: [
    { sigla:'PT', federacao:'Federação Brasil da Esperança' },
    { sigla:'PV', federacao:'Federação Brasil da Esperança' },
    { sigla:'PSDB', federacao:'Federação PSDB Cidadania' },
    { sigla:'CIDADANIA', federacao:'Federação PSDB Cidadania' },
    { sigla:'PSOL', federacao:'Federação PSOL REDE' },
    { sigla:'REDE', federacao:'Federação PSOL REDE' }
  ],
  normalizarTexto: value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(),
  simId: (() => { let id=0; return () => `auto-${++id}`; })()
});
vm.runInContext(`${extractFunction('simNumero')}\n${extractFunction('novoCenarioSimulador')}\n${extractFunction('simIdentificarLista')}\n${extractFunction('simContarCandidaturasLista')}\n${extractFunction('simSituacaoLimiteLista')}\n${extractFunction('simResumoCotaGenero')}\n${extractFunction('simAvaliarCotasGenero')}\n${extractFunction('simComposicaoGeneroPossivel')}\n${extractFunction('simValidarInclusaoGenero')}\n${extractFunction('simEscolherGeneroAutomatico')}\n${extractFunction('simResumirListas')}\n${extractFunction('simAplicarLimpezaEstado')}\n${extractFunction('simQuociente')}\n${extractFunction('simRatearVotos')}\n${extractFunction('simListasAutopreenchiveis')}\n${extractFunction('simCriarPlanoAutopreenchimento')}\n${extractFunction('calcularVagasSimulador')}`, context);

assert(context.simQuociente(1_000, 4) === 250, 'Quociente exato incorreto.');
assert(context.simQuociente(1_002, 4) === 250, 'Fração igual a 0,5 deveria ser desprezada.');
assert(context.simQuociente(1_003, 4) === 251, 'Fração superior a 0,5 deveria ser arredondada.');

const scenario = {
  votosValidos: 1_000,
  itens: [
    { id:'a1', tipo:'candidato', nome:'A 1', partido:'A', votos:300 },
    { id:'a2', tipo:'candidato', nome:'A 2', partido:'A', votos:200 },
    { id:'b1', tipo:'candidato', nome:'B 1', partido:'B', votos:200 },
    { id:'b2', tipo:'candidato', nome:'B 2', partido:'B', votos:100 },
    { id:'c1', tipo:'candidato', nome:'C 1', partido:'C', votos:200 }
  ]
};
const result = context.calcularVagasSimulador(scenario, 'deputado federal');
// Ajusta o total de vagas para um caso pequeno e fácil de auditar.
context.SIM_CARGOS['deputado federal'].vagas = 4;
const resultFourSeats = context.calcularVagasSimulador(scenario, 'deputado federal');
assert(resultFourSeats.qe === 250, 'QE do cenário de referência incorreto.');
assert(resultFourSeats.eleitos.length === 4, 'O cenário deveria preencher quatro vagas.');
assert(resultFourSeats.partidos.find(p => p.nome === 'A')?.vagas.length === 2, 'Partido A deveria obter duas vagas diretas.');
assert(resultFourSeats.partidos.find(p => p.nome === 'B')?.vagas.length === 1, 'Partido B deveria obter uma vaga direta.');
assert(resultFourSeats.partidos.find(p => p.nome === 'C')?.vagas[0]?.fase === 'sobra 80/20', 'Partido C deveria obter a sobra pela maior média 80/20.');
assert(resultFourSeats.vagasNaoPreenchidas === 0, 'Não deveriam restar vagas no cenário completo.');

assert(result.eleitos.length <= 8, 'O motor ultrapassou a quantidade configurada de vagas.');

const federationScenario = {
  votosValidos: 1_000,
  itens: [
    { id:'f1', tipo:'candidato', nome:'PT 1', partido:'PT', chapa:'valor antigo inconsistente', votos:300 },
    { id:'f2', tipo:'candidato', nome:'PV 1', partido:'PV', votos:200 },
    { id:'fl', tipo:'legenda', nome:'Votos de legenda · PT', partido:'PT', chapa:'valor antigo inconsistente', votos:100 },
    { id:'d1', tipo:'candidato', nome:'D 1', partido:'D', chapa:'D', votos:250 },
    { id:'d2', tipo:'candidato', nome:'D 2', partido:'D', chapa:'D', votos:150 }
  ]
};
const federationResult = context.calcularVagasSimulador(federationScenario, 'deputado federal');
assert(federationResult.partidos.length === 2, 'Partidos federados não foram agrupados na mesma chapa.');
assert(federationResult.partidos.find(p => p.nome === 'Federação Brasil da Esperança')?.votos === 600, 'Votos nominais e de legenda não foram somados à federação.');
assert(federationResult.partidos.find(p => p.nome === 'Federação Brasil da Esperança')?.legenda === 100, 'Votos de legenda não foram identificados separadamente.');
assert(html.includes('limiteCandidatosPorLista: 9') && html.includes('limiteCandidatosPorLista: 25'), 'Limites de candidaturas por lista não estão configurados.');

const criarCandidaturas = (quantidade, partido, chapa = 'chapa antiga') => Array.from({length:quantidade}, (_,indice) => ({
  id:`${partido}-${indice}`, tipo:'candidato', nome:`${partido} ${indice + 1}`, partido, chapa, votos:1
}));
const listasIndependentes = {
  itens: [
    ...criarCandidaturas(9, 'PT'),
    ...criarCandidaturas(8, 'PSDB'),
    ...criarCandidaturas(8, 'PSOL')
  ]
};
const limiteFederalA = context.simSituacaoLimiteLista(listasIndependentes, 'deputado federal', { partido:'PV' });
const limiteFederalB = context.simSituacaoLimiteLista(listasIndependentes, 'deputado federal', { partido:'CIDADANIA' });
const limiteFederalC = context.simSituacaoLimiteLista(listasIndependentes, 'deputado federal', { partido:'REDE' });
assert(!limiteFederalA.permitido && limiteFederalA.quantidade === 9, 'A décima candidatura federal deveria ser bloqueada somente na Federação A.');
assert(limiteFederalB.permitido && limiteFederalB.quantidade === 8, 'A Federação B deveria manter sua própria nona vaga para candidatura federal.');
assert(limiteFederalC.permitido && limiteFederalC.quantidade === 8, 'A Federação C deveria manter sua própria nona vaga para candidatura federal.');

const listasEstaduais = { itens:[...criarCandidaturas(25, 'PT'), ...criarCandidaturas(24, 'PSDB')] };
assert(!context.simSituacaoLimiteLista(listasEstaduais, 'deputado estadual', { partido:'PV' }).permitido,
  'A vigésima sexta candidatura estadual deveria ser bloqueada na própria federação.');
assert(context.simSituacaoLimiteLista(listasEstaduais, 'deputado estadual', { partido:'CIDADANIA' }).permitido,
  'Outra federação deveria manter sua própria vigésima quinta vaga para candidatura estadual.');

const federacaoRegular = { itens:[
  ...Array.from({length:3}, (_,indice) => ({ tipo:'candidato', partido:'PT', genero:'feminino', nome:`PT F${indice}` })),
  ...Array.from({length:3}, (_,indice) => ({ tipo:'candidato', partido:'PT', genero:'masculino', nome:`PT M${indice}` })),
  ...Array.from({length:2}, (_,indice) => ({ tipo:'candidato', partido:'PV', genero:'feminino', nome:`PV F${indice}` })),
  ...Array.from({length:1}, (_,indice) => ({ tipo:'candidato', partido:'PV', genero:'masculino', nome:`PV M${indice}` }))
] };
assert(context.simAvaliarCotasGenero(federacaoRegular).regular,
  'Federação e partidos integrantes com composição regular deveriam atender à cota de gênero.');
const federacaoIrregular = { itens:criarCandidaturas(6, 'PT').map(item => ({ ...item, genero:'masculino' })) };
assert(!context.simAvaliarCotasGenero(federacaoIrregular).regular,
  'Lista composta por apenas um gênero deveria ser sinalizada como irregular.');
const inclusaoSetimoMasculino = context.simValidarInclusaoGenero(federacaoIrregular, 'deputado federal', { partido:'PT' }, 'masculino');
assert(!inclusaoSetimoMasculino.permitido,
  'A sétima candidatura masculina deveria ser bloqueada quando restam apenas duas posições na lista federal.');
assert(context.simValidarInclusaoGenero(federacaoIrregular, 'deputado federal', { partido:'PT' }, 'feminino').permitido,
  'Uma candidatura feminina deveria continuar disponível para regularizar a lista federal.');
assert(context.simResumoCotaGenero([
  {genero:'feminino'},{genero:'feminino'},{genero:'feminino'},
  {genero:'masculino'},{genero:'masculino'},{genero:'masculino'},
  {genero:'masculino'},{genero:'masculino'},{genero:'masculino'}
], 'Lista', 'lista').regular, 'Uma lista federal 3/6 deveria atender aos percentuais de 30% e 70%.');
assert(html.includes('id="simGenero"') && html.includes('id="simCotaGeneroAlertas"'),
  'Campo de gênero e alertas da etapa 3 devem existir.');

context.simEstado = { cargo:'deputado federal' };
const painelCenario = {
  votosValidos:1_000,
  listasConcluidas:[],
  itens:[
    { tipo:'candidato', nome:'PT F', partido:'PT', genero:'feminino', votos:300 },
    { tipo:'candidato', nome:'PV M', partido:'PV', genero:'masculino', votos:200 },
    { tipo:'legenda', nome:'Legenda PT', partido:'PT', votos:100 },
    { tipo:'candidato', nome:'PSDB F', partido:'PSDB', genero:'feminino', votos:250 },
    { tipo:'candidato', nome:'Cidadania M', partido:'CIDADANIA', genero:'masculino', votos:150 }
  ]
};
const resumoPainel = context.simResumirListas(painelCenario);
assert(resumoPainel.length === 2, 'Painel deveria criar um card independente para cada federação.');
assert(resumoPainel[0].votos === 600 && resumoPainel[0].candidaturas.length === 2,
  'Card da federação deveria totalizar votos e candidaturas da lista em tempo real.');
assert(resumoPainel[0].percentualVotos === 60, 'Participação da federação nos votos válidos foi calculada incorretamente.');
assert(html.includes('id="simVerPainel"') && html.includes('id="simListasCards"') && html.includes('data-sim-concluir-lista'),
  'Navegação, cards e controle de conclusão do painel das listas devem existir.');

const estadoLimpezaBase = {
  cargo:'deputado federal',
  cenarios:{
    'deputado federal':{
      votosValidos:1_000, listasConcluidas:['federacao brasil da esperanca'], desempates:{}, ultimoAutopreenchimento:{ itens:[] },
      itens:[
        { id:'lf1', tipo:'candidato', partido:'PT', genero:'feminino', votos:300, origemVotos:'automatico' },
        { id:'lf2', tipo:'candidato', partido:'PV', genero:'masculino', votos:200, origemVotos:'manual' },
        { id:'ll1', tipo:'legenda', partido:'PT', votos:100 },
        { id:'lb1', tipo:'candidato', partido:'PSDB', genero:'feminino', votos:400, origemVotos:'manual' }
      ]
    },
    'deputado estadual':{ votosValidos:500, listasConcluidas:[], desempates:{}, ultimoAutopreenchimento:null, itens:[{ id:'e1', tipo:'candidato', partido:'D', genero:'feminino', votos:500 }] }
  }
};
const clonarEstado = () => JSON.parse(JSON.stringify(estadoLimpezaBase));
const limparVotos = context.simAplicarLimpezaEstado(clonarEstado(), 'votos');
assert(limparVotos.cenarios['deputado federal'].itens.length === 4
  && limparVotos.cenarios['deputado federal'].itens.every(item => item.votos === 0)
  && limparVotos.cenarios['deputado federal'].votosValidos === 1_000,
  'Limpeza de votos deve preservar candidaturas e total de votos válidos.');
const limparCandidaturas = context.simAplicarLimpezaEstado(clonarEstado(), 'candidaturas');
assert(limparCandidaturas.cenarios['deputado federal'].itens.length === 1
  && limparCandidaturas.cenarios['deputado federal'].itens[0].tipo === 'legenda',
  'Limpeza de candidaturas deve preservar votos de legenda e remover somente nomes.');
const chaveListaPT = context.simIdentificarLista({ partido:'PT' }).chave;
const limparLista = context.simAplicarLimpezaEstado(clonarEstado(), 'lista', chaveListaPT);
assert(limparLista.cenarios['deputado federal'].itens.length === 1
  && limparLista.cenarios['deputado federal'].itens[0].partido === 'PSDB',
  'Limpeza de lista deve preservar as demais federações.');
const limparCenario = context.simAplicarLimpezaEstado(clonarEstado(), 'cenario');
assert(limparCenario.cenarios['deputado federal'].itens.length === 0
  && limparCenario.cenarios['deputado estadual'].itens.length === 1,
  'Reinício do cargo atual deve preservar o cenário do outro cargo.');
const limparTudo = context.simAplicarLimpezaEstado(clonarEstado(), 'tudo');
assert(limparTudo.cargo === 'deputado estadual'
  && Object.values(limparTudo.cenarios).every(cenario => cenario.itens.length === 0),
  'Reinício total deve limpar os dois cargos e retornar ao cargo estadual.');
assert(html.includes('id="simLimpezaEtapa1"') && html.includes('id="simLimpezaEtapa2"')
  && html.includes('id="simLimpezaConfirmar"') && html.includes('id="simDesfazerLimpeza"')
  && html.includes('data-sim-limpar-lista')
  && !html.includes('data-sim-limpeza-tipo="votos"')
  && !html.includes('data-sim-limpeza-tipo="candidaturas"')
  && !html.includes('data-sim-limpeza-tipo="lista"')
  && html.includes('.sim-modal .hidden { display: none !important; }')
  && html.includes('class="sim-modal-acoes"')
  && html.includes("lista:'Excluir'") && html.includes("cenario:'Reiniciar cargo'"),
  'Interface deve separar reinício geral, exclusão por card, confirmação e opção de desfazer.');
assert(html.includes('id="simAdicionarLegenda"'), 'Botão de votos de legenda ausente.');
assert(html.includes('minimoAutopreenchimento: 5') && html.includes('minimoAutopreenchimento: 13'), 'Limites de liberação do autopreenchimento incorretos.');
assert(html.includes('id="simAutoPrevia"') && html.includes('id="simAutoConfirmar"'), 'Prévia e confirmação do autopreenchimento ausentes.');
assert(html.includes('data-sim-editar-votos'), 'Edição individual de votos não foi implementada.');
assert(html.includes('ultimoAutopreenchimento'), 'Estado necessário para desfazer o autopreenchimento ausente.');
assert(html.includes("if (tipo === 'candidato') simRetornarAoFormulario();"),
  'Inclusão de candidatura não retorna ao formulário.');
const retornoFormulario = extractFunction('simRetornarAoFormulario');
assert(retornoFormulario.includes("scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' })")
  && retornoFormulario.includes("campo.focus({ preventScroll: true })")
  && retornoFormulario.includes("prefers-reduced-motion: reduce"),
  'Retorno ao formulário deve controlar rolagem, foco e movimento reduzido.');
const avancarCampo = extractFunction('simAvancarPara');
assert(avancarCampo.includes("scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'center' })")
  && avancarCampo.includes("destino.focus({ preventScroll: true })")
  && avancarCampo.includes("prefers-reduced-motion: reduce"),
  'Avanço entre campos deve controlar rolagem, foco e movimento reduzido.');
assert(html.includes("simAbrirEtapa(2, 'simVotosValidos')")
  && html.includes("simAbrirEtapa(3, 'simNome')")
  && html.includes('function simSelecionarCandidatura2026')
  && html.includes("simAvancarPara('simVotosCandidato')")
  && html.includes("simAdicionarItem('candidato')"),
  'Sequência de seleção da candidatura oficial está incompleta.');
assert(html.includes("evento.key === 'Enter' && nome.value.trim() && !simSelecionado")
  && html.includes("evento.key === 'Enter' && partido.value.trim() && !simOrganizacaoSelecionada"),
  'Nomes e organizações digitados não avançam mediante confirmação explícita.');
assert(/\.sim-sugestoes button\s*\{[^}]*font-size:\s*\.875rem/.test(html)
  && /\.sim-sugestoes small\s*\{[^}]*font-size:\s*\.8125rem/.test(html),
  'Sugestões do simulador não usam a tipografia compacta prevista.');
assert(/\.sim-ajuda summary\s*\{[^}]*min-height:\s*40px[^}]*font-size:\s*\.8125rem/.test(html),
  'Ajuda deve manter a altura e usar texto compacto.');
assert(/\.sim-resultado li\s*\{[^}]*font-size:\s*\.875rem/.test(html),
  'Itens dos resultados do simulador não usam a tipografia compacta prevista.');

const proportional = context.simRatearVotos([
  {id:'1',nome:'A',votos:10},{id:'2',nome:'B',votos:20},{id:'3',nome:'C',votos:30}
], 100, 'proporcional');
assert(proportional.itens.reduce((sum,item)=>sum+item.votos,0) === 100, 'Rateio proporcional não fechou o total exato.');
assert(proportional.itens.map(item=>item.votos).join(',') === '17,33,50', 'Rateio proporcional produziu valores inesperados.');
const equal = context.simRatearVotos([
  {id:'1',nome:'A',votos:0},{id:'2',nome:'B',votos:0},{id:'3',nome:'C',votos:0}
], 10, 'proporcional');
assert(equal.metodoEfetivo === 'igual' && equal.itens.reduce((sum,item)=>sum+item.votos,0) === 10,
  'Rateio sem estimativas deveria usar divisão igualitária e fechar o total.');

const manualItems = Array.from({length:5}, (_,indice) => ({
  id:`m${indice}`, tipo:'candidato', nome:`Manual ${indice+1}`, partido:'P', chapa:'P', votos:(indice+1)*10,
  origem:'cenario', origemVotos:'manual'
}));
context.simEstado = { cargo:'deputado federal', cenarios:{ 'deputado federal':{ votosValidos:1000, itens:manualItems, desempates:{} } } };
context.simCenario = () => context.simEstado.cenarios[context.simEstado.cargo];
const additivePlan = context.simCriarPlanoAutopreenchimento('proporcional');
assert(additivePlan.novos.length === 4, 'Autopreenchimento federal deveria criar somente as quatro candidaturas restantes da lista.');
assert(additivePlan.votosFixos === 150, 'Votos manuais não foram preservados como parcela fixa.');
assert(additivePlan.itens.reduce((sum,item)=>sum+item.votos,0) === 850, 'Somente os votos restantes deveriam ser distribuídos.');
assert(manualItems.map(item=>item.votos).join(',') === '10,20,30,40,50', 'O plano alterou votos preenchidos manualmente.');
assert(additivePlan.novos.every(item=>item.origem === 'simulada'), 'Novas linhas devem ser identificadas como candidaturas simuladas.');

if (failures.length) {
  console.error(`Testes do simulador falharam (${failures.length}/${checks}):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Testes do simulador aprovados: ${checks} verificações.`);
