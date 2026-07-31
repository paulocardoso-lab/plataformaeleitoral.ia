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
    'deputado estadual': { vagas: 24, limiteCandidatos:25, minimoAutopreenchimento:13, label: 'Deputado estadual' },
    'deputado federal': { vagas: 8, limiteCandidatos:9, minimoAutopreenchimento:5, label: 'Deputado federal' }
  },
  normalizarTexto: value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(),
  simId: (() => { let id=0; return () => `auto-${++id}`; })()
});
vm.runInContext(`${extractFunction('simNumero')}\n${extractFunction('simQuociente')}\n${extractFunction('simRatearVotos')}\n${extractFunction('simListasAutopreenchiveis')}\n${extractFunction('simCriarPlanoAutopreenchimento')}\n${extractFunction('calcularVagasSimulador')}`, context);

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
    { id:'f1', tipo:'candidato', nome:'PT 1', partido:'PT', chapa:'Federação X', votos:300 },
    { id:'f2', tipo:'candidato', nome:'PV 1', partido:'PV', chapa:'Federação X', votos:200 },
    { id:'fl', tipo:'legenda', nome:'Votos de legenda · PT', partido:'PT', chapa:'Federação X', votos:100 },
    { id:'d1', tipo:'candidato', nome:'D 1', partido:'D', chapa:'D', votos:250 },
    { id:'d2', tipo:'candidato', nome:'D 2', partido:'D', chapa:'D', votos:150 }
  ]
};
const federationResult = context.calcularVagasSimulador(federationScenario, 'deputado federal');
assert(federationResult.partidos.length === 2, 'Partidos federados não foram agrupados na mesma chapa.');
assert(federationResult.partidos.find(p => p.nome === 'Federação X')?.votos === 600, 'Votos nominais e de legenda não foram somados à federação.');
assert(federationResult.partidos.find(p => p.nome === 'Federação X')?.legenda === 100, 'Votos de legenda não foram identificados separadamente.');
assert(html.includes('limiteCandidatos: 9') && html.includes('limiteCandidatos: 25'), 'Limites legais de candidaturas não estão configurados.');
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
assert(html.includes("simAvancarPara('simVotosValidos')")
  && html.includes("simAvancarPara('simNome')")
  && html.includes("simAvancarPara('simPartido')")
  && html.includes("simAvancarPara('simVotosCandidato')")
  && html.includes("simAvancarPara('simAdicionarCandidato')"),
  'Sequência de avanço automático do simulador está incompleta.');
assert(html.includes("evento.key === 'Enter' && nome.value.trim() && !simSelecionado")
  && html.includes("evento.key === 'Enter' && partido.value.trim() && !simOrganizacaoSelecionada"),
  'Nomes e organizações digitados não avançam mediante confirmação explícita.');
assert(/\.sim-sugestoes button\s*\{[^}]*font-size:\s*\.875rem/.test(html)
  && /\.sim-sugestoes small\s*\{[^}]*font-size:\s*\.8125rem/.test(html),
  'Sugestões do simulador não usam a tipografia compacta prevista.');
assert(/\.sim-ajuda summary\s*\{[^}]*min-height:\s*44px[^}]*font-size:\s*\.8125rem/.test(html),
  'Ajuda deve manter a área de toque e usar texto compacto.');
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
