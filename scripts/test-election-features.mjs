import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const index = readFileSync(resolve(root, 'index.html'), 'utf8');
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

function functionSource(name) {
  const start = index.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Função ${name} não encontrada`);
  const next = index.indexOf('\nfunction ', start + 10);
  return index.slice(start, next < 0 ? index.length : next);
}

const context = vm.createContext({
  normalizarTexto: value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
  nomeExibicaoCandidato: value => value.candidato,
  Number,
  Object,
});
vm.runInContext(functionSource('obterRankingMunicipio'), context);

const fixture = [
  { ano:'2024', cargo:'prefeito', municipio:'Cidade A', turno:'1', candidato:'Ana', partido:'P1', votos:100, resultado:'Eleito' },
  { ano:'2024', cargo:'prefeito', municipio:'Cidade A', turno:'1', candidato:'Bruno', partido:'P2', votos:80 },
  { ano:'2024', cargo:'prefeito', municipio:'Cidade A', turno:'1', candidato:'Carla', partido:'P3', votos:60 },
  { ano:'2024', cargo:'prefeito', municipio:'Cidade A', turno:'2', candidato:'Ana', partido:'P1', votos:130, resultado:'Eleito' },
  { ano:'2024', cargo:'prefeito', municipio:'Cidade A', turno:'2', candidato:'Bruno', partido:'P2', votos:120 },
  { ano:'2024', cargo:'prefeito', municipio:'Cidade B', turno:'1', candidato:'Ana', partido:'P1', votos:999 },
];

const turno1 = context.obterRankingMunicipio(fixture, '2024', 'prefeito', 'Cidade A', '1', 2);
const turno2 = context.obterRankingMunicipio(fixture, '2024', 'prefeito', 'Cidade A', '2', 5);
assert(turno1.length === 2, 'limite configurável do ranking municipal falhou');
assert(turno1[0].candidato === 'Ana' && turno1[0].votos === 100, 'ranking misturou município ou turno');
assert(turno2.length === 2 && turno2[0].votos === 130, 'segundo turno não foi isolado');

assert(index.includes('const limiteRanking = municipio ? 30 : 50'),
  'regra Top 50/Top 30 não encontrada');
assert(index.includes('obterRankingMunicipio(DB.votos, ano, cargo, munA, turnoA, 5)') &&
  index.includes('obterRankingMunicipio(DB.votos, ano, cargo, munB, turnoB, 5)'),
  'regra Top 5 da comparação não encontrada');
assert(index.includes("(municipal ? '|' + v.municipio : '')"),
  'homônimos municipais não estão separados por município');
assert(index.includes('id="filtroMunicipiosCandidato"') &&
  index.includes('id="ordemMunicipiosCandidato"'),
  'pesquisa ou ordenação municipal não encontrada');
assert(index.includes("url.searchParams.set('peia_view', 'candidato')") &&
  index.includes('function restaurarLinkCompartilhado()'),
  'link compartilhável ou restauração não encontrada');
assert(index.includes('candidato-identidade-aviso'),
  'aviso de identificação histórica por nome não encontrado');
assert(index.includes('formatarPercentual(votosValidosRanking ?'),
  'percentual de votos válidos no ranking não encontrado');
assert(index.includes('variacaoPosicao'),
  'variação histórica de posição não encontrada');
assert(index.includes('let reconhecimentoVozAtivo = null') &&
  /function encerrarBuscaPorVoz\(\)[\s\S]*?recognition\.abort\(\)/.test(index),
  'controle centralizado para encerrar o reconhecimento de voz não encontrado');
assert(/function selecionarBuscaUniversal\([^)]*\)\s*\{\s*encerrarBuscaPorVoz\(\)/.test(index) &&
  /function selecionarSugestao\([^)]*\)\s*\{\s*encerrarBuscaPorVoz\(\)/.test(index),
  'seleção de resultado não encerra o microfone');
assert(/recognition\.onresult\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?encerrarBuscaPorVoz\(\)/.test(index),
  'transcrição final não encerra o microfone');
assert(index.includes("btn.setAttribute('aria-pressed', 'true')") &&
  index.includes("btn.setAttribute('aria-pressed', 'false')"),
  'estado acessível do botão de voz não é sincronizado');

if (failures.length) {
  console.error('Testes eleitorais falharam:\n');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Testes eleitorais aprovados: 16 verificações.');
