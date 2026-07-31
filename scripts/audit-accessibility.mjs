import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
const failures = [];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function occurrences(pattern, source = html) {
  return [...source.matchAll(pattern)];
}

function cssRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 's'))?.[1] || '';
}

function luminance(hex) {
  const channels = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Documento, ampliação e PWA.
assert(/<html[^>]+lang="pt-BR"/i.test(html), 'Idioma pt-BR ausente no documento.');
const viewport = html.match(/<meta[^>]+name="viewport"[^>]+content="([^"]+)"/i)?.[1] || '';
assert(viewport.includes('width=device-width'), 'Viewport responsivo não configurado.');
assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(viewport), 'Zoom do navegador voltou a ser bloqueado.');
assert(!Object.hasOwn(manifest, 'orientation'), 'Manifesto voltou a restringir a orientação.');

// Sintaxe de todos os scripts inline.
const inlineScripts = occurrences(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi);
inlineScripts.forEach((match, index) => {
  try {
    new vm.Script(match[1], { filename: `index-inline-${index + 1}.js` });
  } catch (error) {
    failures.push(`JavaScript inline ${index + 1} inválido: ${error.message}`);
  }
});
checks += inlineScripts.length;

// Estrutura básica e IDs.
const ids = occurrences(/\bid="([^"]+)"/g).map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert(duplicateIds.length === 0, `IDs duplicados: ${duplicateIds.join(', ')}`);
for (const tag of ['header', 'main', 'footer', 'button', 'details']) {
  const opening = occurrences(new RegExp(`<${tag}(?:\\s|>)`, 'gi')).length;
  const closing = occurrences(new RegExp(`</${tag}>`, 'gi')).length;
  assert(opening === closing, `Tag ${tag} desbalanceada (${opening}/${closing}).`);
}
assert(/id="tela-home"[^>]+role="main"/i.test(html), 'Tela inicial não possui landmark main.');
assert(html.includes("telaDestino.setAttribute('role', 'main')"), 'Navegação não transfere o landmark main.');

// Formulários: todo select precisa de label; inputs de conteúdo precisam de label ou aria-label.
const labelTargets = new Set(occurrences(/<label[^>]+\bfor="([^"]+)"/gi).map(match => match[1]));
const selects = occurrences(/<select[^>]+\bid="([^"]+)"[^>]*>/gi);
selects.forEach(match => {
  const [markup, id] = match;
  assert(labelTargets.has(id) || /\baria-label=/.test(markup), `Select #${id} sem nome acessível.`);
});
const contentInputs = occurrences(/<input[^>]+\bid="([^"]+)"[^>]*>/gi);
contentInputs.forEach(match => {
  const [markup, id] = match;
  const nestedLabel = new RegExp(`<label[^>]*>[\\s\\S]{0,120}<input[^>]+id="${id}"`, 'i').test(html);
  assert(labelTargets.has(id) || /\baria-label=/.test(markup) || nestedLabel, `Input #${id} sem nome acessível.`);
});

// Interação e foco.
assert(!/<div[^>]+\bonclick=/i.test(html), 'Ainda existe div acionável por clique.');
assert(!/<div[^>]+\brole="button"/i.test(html), 'Ainda existe botão simulado com div.');
assert(/button:focus-visible/.test(html), 'Estilo global de foco visível ausente.');
assert(/prefers-reduced-motion:\s*reduce/.test(html), 'Preferência de movimento reduzido não respeitada.');
assert(/role="combobox"[\s\S]+role="listbox"/i.test(html), 'Autocomplete acessível incompleto.');
assert(html.includes("evento.key === 'Escape'") && html.includes("evento.key === 'ArrowDown'"),
  'Autocomplete não mantém navegação por Escape e setas.');

// Mobile-first e alvos de toque.
assert(/\.grid9\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(html),
  'Grade base deixou de usar duas colunas em telas estreitas.');
assert(/@media\s*\(min-width:\s*380px\)[\s\S]*?repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(html),
  'Progressão para três colunas não encontrada.');
assert(/\.filtro-linha\s*\{[\s\S]*?flex-direction:\s*column/.test(html) &&
  /@media\s*\(min-width:\s*480px\)[\s\S]*?\.filtro-linha\s*\{[\s\S]*?flex-direction:\s*row/.test(html),
  'Filtros não seguem coluna móvel e linha progressiva.');
for (const selector of ['.topbar .voltar', '.btn-exportar-fixo', '.candidato-detalhes-fechar']) {
  const rule = cssRule(selector);
  assert(/width:\s*44px/.test(rule) && /height:\s*44px/.test(rule), `${selector} não mantém alvo de 44x44 px.`);
}
assert(/select,\s*input\[type="text"\],\s*input\[type="search"\][\s\S]*?min-height:\s*44px/.test(html),
  'Campos não mantêm altura mínima de 44 px.');
assert(html.includes('Desenvolvido por Girassol Inteligência'), 'Assinatura completa da Girassol Inteligência ausente.');
assert(/html:not\(\[data-estilo="aeroporto"\]\)\s+\.home-hero h1\s*\{[\s\S]*?color:\s*var\(--text-light\)[\s\S]*?background:\s*none/.test(html),
  'Título principal do modo padrão ainda não possui cor sólida compatível com o layout.');
assert(/\.rodape-marca\s*\{[\s\S]*?order:\s*2/.test(html) && /\.rodape-acoes\s*\{[\s\S]*?order:\s*1/.test(html),
  'Assinatura institucional não está abaixo dos controles do rodapé.');
assert(!/@media\s*\(min-width:\s*480px\)[\s\S]*?\.rodape-fixo\s*\{[^}]*flex-direction:\s*row/.test(html),
  'Assinatura institucional não pode voltar para a mesma linha dos controles em telas largas.');
assert(/\.rodape-texto\s*\{[\s\S]*?white-space:\s*nowrap[\s\S]*?text-overflow:\s*clip/.test(html),
  'Assinatura institucional pode ser truncada ou quebrada.');
assert(/\.rodape-texto\s*\{[\s\S]*?font-family:\s*'IBM Plex Mono',\s*monospace[\s\S]*?text-align:\s*center/.test(html),
  'Assinatura institucional deve usar IBM Plex Mono e permanecer centralizada.');
assert(/\.rodape-marca\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*1fr auto 1fr/.test(html)
  && /\.rodape-texto\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?font-size:\s*clamp\(7px,\s*2vw,\s*9px\)/.test(html),
  'A frase deve definir sozinha o centro do rodapé e usar o tamanho compacto previsto.');

// Texto, contraste e conteúdo equivalente.
assert(/html\[data-fonte="g1"\]\s*\{\s*font-size:\s*14px/.test(html), 'Grau mínimo de fonte abaixo de 14 px.');
assert(contrast('a0a0a0', '151d3d') >= 4.5, 'Texto secundário neon abaixo de 4.5:1.');
assert(contrast('8a8a8a', '1c1c1c') >= 4.5, 'Texto secundário aeroporto abaixo de 4.5:1.');
assert(contrast('6070b0', '151d3d') >= 3, 'Bordas neon abaixo de 3:1.');
assert(contrast('707070', '1c1c1c') >= 3, 'Bordas aeroporto abaixo de 3:1.');
const canvases = occurrences(/<canvas\b[^>]*\bid="[^"]+"[^>]*>/gi);
canvases.forEach((match, index) => {
  assert(/\brole="img"/.test(match[0]) && /\baria-label=/.test(match[0]),
    `Canvas ${index + 1} sem papel e nome acessíveis.`);
});
assert(/id="dadosGraficoPartidos"/.test(html), 'Gráfico de partidos sem equivalente textual.');
assert(/id="anuncioResultados"[^>]+aria-live="polite"/.test(html), 'Atualizações de resultados não são anunciadas.');

if (failures.length) {
  console.error(`Auditoria de acessibilidade falhou (${failures.length}/${checks}):\n`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Auditoria de acessibilidade aprovada: ${checks} verificações.`);
