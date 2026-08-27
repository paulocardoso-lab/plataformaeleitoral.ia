import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const [input, complementaryInput] = process.argv.slice(2);
if (!input) throw new Error('Uso: node scripts/import-candidaturas-2026.mjs <candidaturas.csv> [complementar.csv]');

function parseDelimited(text, delimiter = ';') {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value); value = '';
      if (row.some(cell => cell.length)) rows.push(row);
      row = [];
    } else value += char;
  }
  row.push(value);
  if (row.some(cell => cell.length)) rows.push(row);
  return rows;
}

const source = await readFile(input, 'utf8');
const [headers, ...rows] = parseDelimited(source.replace(/^\uFEFF/, ''));
const column = Object.fromEntries(headers.map((header, index) => [header, index]));
const required = ['DS_CARGO', 'SQ_CANDIDATO', 'NM_CANDIDATO', 'NM_URNA_CANDIDATO', 'SG_PARTIDO', 'DS_GENERO'];
const missing = required.filter(name => column[name] === undefined);
if (missing.length) throw new Error(`Colunas obrigatórias ausentes: ${missing.join(', ')}`);

const cargos = new Map([
  ['DEPUTADO ESTADUAL', 'deputado estadual'],
  ['DEPUTADO FEDERAL', 'deputado federal'],
]);
const candidates = new Map();
for (const row of rows) {
  const cargo = cargos.get(row[column.DS_CARGO]);
  if (!cargo) continue;
  const id = row[column.SQ_CANDIDATO]?.trim();
  const nome = row[column.NM_URNA_CANDIDATO]?.trim() || row[column.NM_CANDIDATO]?.trim();
  const partido = row[column.SG_PARTIDO]?.trim();
  const generoBruto = row[column.DS_GENERO]?.trim();
  const genero = generoBruto === 'FEMININO' ? 'feminino' : generoBruto === 'MASCULINO' ? 'masculino' : null;
  const nascimento = row[column.DT_NASCIMENTO]?.trim() || null;
  if (!id || !nome || !partido || !genero) throw new Error(`Registro incompleto para SQ_CANDIDATO ${id || '(vazio)'}`);
  if (candidates.has(id)) throw new Error(`SQ_CANDIDATO duplicado: ${id}`);
  candidates.set(id, { id, cargo, nome, partido, genero, nascimento });
}

let complementaryById = new Map();
if (complementaryInput) {
  const complementarySource = await readFile(complementaryInput, 'utf8');
  const [complementaryHeaders, ...complementaryRows] = parseDelimited(complementarySource.replace(/^\uFEFF/, ''));
  const complementaryColumn = Object.fromEntries(complementaryHeaders.map((header, index) => [header, index]));
  for (const name of ['SQ_CANDIDATO', 'DS_SITUACAO_JULGAMENTO']) {
    if (complementaryColumn[name] === undefined) throw new Error(`Coluna obrigatória ausente no arquivo complementar: ${name}`);
  }
  complementaryById = new Map(complementaryRows.map(row => [row[complementaryColumn.SQ_CANDIDATO]?.trim(), {
    situacaoJulgamento: row[complementaryColumn.DS_SITUACAO_JULGAMENTO]?.trim() || null,
  }]));
}

const listaComSituacao = [...candidates.values()].map(candidate => ({ ...candidate, ...complementaryById.get(candidate.id) }));
if (complementaryInput && listaComSituacao.some(candidate => !candidate.situacaoJulgamento)) {
  throw new Error('Há candidaturas sem situação de julgamento na base complementar.');
}
const lista = listaComSituacao.sort((a, b) => a.cargo.localeCompare(b.cargo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
if (!lista.length) throw new Error('Nenhuma candidatura para deputado estadual ou federal foi encontrada.');
const output = {
  versao: '2026-08-19',
  fonte: 'TSE — Consulta de candidaturas 2026, Mato Grosso do Sul',
  geradoEm: new Date().toISOString(),
  arquivoOrigem: basename(input),
  arquivoComplementar: complementaryInput ? basename(complementaryInput) : null,
  hashOrigem: createHash('sha256').update(source).digest('hex'),
  totais: {
    estadual: lista.filter(item => item.cargo === 'deputado estadual').length,
    federal: lista.filter(item => item.cargo === 'deputado federal').length,
    naoDeferidas: lista.filter(item => item.situacaoJulgamento && item.situacaoJulgamento !== 'DEFERIDO').length,
  },
  candidaturas: lista,
};

const outputPath = resolve('data', 'candidaturas-2026-ms.json');
await mkdir(resolve('data'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Base gerada: ${outputPath} (${output.totais.estadual} estaduais, ${output.totais.federal} federais).`);
