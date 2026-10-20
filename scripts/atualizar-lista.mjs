// Acrescenta a lista mais recente do TSE como a próxima lista do projeto (ou avisa que nada mudou).
//
// Uso: node scripts/atualizar-lista.mjs <link do .csv.zip | arquivo .zip | arquivo .csv> [--publicada-em 2026-10-20T15:27:55-03:00] [--simular]
//
//  - Baixa (se for link) e descompacta o arquivo oficial (ISO-8859-1, separado por ";").
//  - A data de publicação vem do próprio link do CDN (…/20261020_152755/…); sem ela, use --publicada-em.
//  - Confere o arquivo (colunas, seções repetidas, tamanho plausível) e compara com a lista mais recente: se for igual, não faz nada.
//  - Se mudou: grava o CSV em server/data/fontes, aplica como lista N+1 (as anteriores não mudam) e acrescenta a lista ao manifesto.
// Sai com código 0 (atualizou ou nada mudou) ou 1 (erro: nada é alterado). Em GitHub Actions, escreve mudou=true|false e resumo em GITHUB_OUTPUT.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opc = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
const simular = args.includes('--simular');
const origem = args.find((a) => !a.startsWith('--') && a !== opc('--publicada-em') && a !== opc('--fonte'));
const fonte = opc('--fonte');   // texto para o manifesto quando a origem é um arquivo local (ex.: "painel do SIG/TSE (leitura da tabela)")
const ns = (t) => String(t || '').replace(/\s+/g, ' ').trim();   // o painel junta espaços repetidos: compara sem essa diferença
const falha = (msg) => { console.error('ERRO:', msg); process.exit(1); };
if (!origem) falha('Informe o link ou o arquivo da lista (veja o cabeçalho do script).');

const saida = (k, v) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}<<EOF\n${v}\nEOF\n`); };

// 1) obtém os bytes do CSV
let bytes;
if (/^https?:\/\//.test(origem)) {
  const r = await fetch(origem, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) falha(`o download respondeu ${r.status}.`);
  bytes = Buffer.from(await r.arrayBuffer());
} else bytes = fs.readFileSync(origem);
if (bytes[0] === 0x50 && bytes[1] === 0x4b) {   // "PK": zip
  const tmp = path.join(raiz, '.tmp-lista.zip'); fs.writeFileSync(tmp, bytes);
  try { bytes = execFileSync('unzip', ['-p', tmp], { maxBuffer: 64 * 1024 * 1024 }); } catch { falha('não consegui descompactar o zip (o programa "unzip" está instalado?).'); } finally { fs.rmSync(tmp, { force: true }); }
}

// 2) quando foi publicada
let publicada = opc('--publicada-em');
const m = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/.exec(origem);
if (!publicada && m) publicada = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}-03:00`;
if (!publicada) falha('não consegui descobrir a data de publicação: use --publicada-em AAAA-MM-DDTHH:MM:SS-03:00.');
const pub = new Date(publicada);
if (Number.isNaN(pub.getTime())) falha(`data de publicação inválida: ${publicada}`);

// 3) lê e confere
const novos = parse(new TextDecoder('latin1').decode(bytes), { columns: true, delimiter: ';', skip_empty_lines: true });
const COLS = ['sg_uf', 'nm_municipio', 'nr_zona', 'nr_secao', 'nm_local_votacao_inicial', 'nm_local_votacao_final', 'qt_eleitores'];
for (const c of COLS) if (!(novos[0] && c in novos[0])) falha(`coluna ausente no arquivo: ${c}. O formato mudou?`);
const chave = (r) => [r.sg_uf, r.nm_municipio, Number(r.nr_zona), Number(r.nr_secao)].join('|');
const conj = new Map(novos.map((r) => [chave(r), r]));
if (conj.size !== novos.length) falha('há seções repetidas no arquivo.');

const arquivoListas = path.join(raiz, 'server/data/listas.json');
const listas = JSON.parse(fs.readFileSync(arquivoListas, 'utf8'));
const ultima = listas[listas.length - 1];
const baseCsv = parse(fs.readFileSync(path.join(raiz, 'server/data/secoes_v.csv'), 'utf8'), { columns: true, skip_empty_lines: true });
const na = baseCsv.filter((r) => r['v' + ultima.id] === '1');
if (novos.length < 100) falha(`só ${novos.length} seções: arquivo incompleto?`);
if (novos.length < na.length * 0.4 || novos.length > na.length * 2.5) falha(`${novos.length} seções na lista nova contra ${na.length} na anterior: variação grande demais, confira o arquivo.`);

// 4) mudou em relação à lista mais recente?
const anterior = new Map(na.map((r) => [[r.uf, r.municipio, Number(r.zona), Number(r.secao)].join('|'), r]));
let entraram = 0, sairam = 0, trocaram = 0;
for (const [k, r] of conj) { const a = anterior.get(k); if (!a) entraram++; else if (ns(a.local_inicial) !== ns(r.nm_local_votacao_inicial) || ns(a.local_final) !== ns(r.nm_local_votacao_final)) trocaram++; }
for (const k of anterior.keys()) if (!conj.has(k)) sairam++;
if (!entraram && !sairam && !trocaram) {
  console.log(`Sem mudança: o arquivo é igual à lista ${ultima.id} (${ultima.label}).`);
  saida('mudou', 'false'); saida('resumo', 'sem mudança'); process.exit(0);
}

// 5) nova lista
const N = ultima.id + 1;
const partes = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(pub).map((p) => [p.type, p.value]));
const rotulo = `${partes.day}/${partes.month} · ${partes.hour}h${partes.minute === '00' ? '' : partes.minute}`;
const carimbo = `${partes.year}${partes.month}${partes.day}_${partes.hour}${partes.minute}${partes.second}`;
const resumo = `lista ${N} (${rotulo}): ${novos.length} seções; entraram ${entraram}, saíram ${sairam}, locais trocados ${trocaram}`;
console.log(resumo);
if (simular) { console.log('(simulação: nada foi gravado)'); saida('mudou', 'false'); process.exit(0); }

const destinoCsv = path.join(raiz, `server/data/fontes/lista${N}_${carimbo}.csv`);
fs.writeFileSync(destinoCsv, bytes);
const copiaSeg = { csv: fs.readFileSync(path.join(raiz, 'server/data/secoes_v.csv')), listas: fs.readFileSync(arquivoListas) };
try {
  execFileSync(process.execPath, [path.join(raiz, 'scripts/aplicar-lista-recente.mjs'), destinoCsv, String(N)], { stdio: 'inherit' });
  listas.push({ id: N, label: rotulo, nome: `Lista de ${rotulo}`, arquivo: /^https?:/.test(origem) ? origem : (fonte || path.basename(origem)), publicadaEm: pub.toISOString().replace(/\.\d{3}Z$/, 'Z'), baixadaEm: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') });
  fs.writeFileSync(arquivoListas, JSON.stringify(listas, null, 2) + '\n');
} catch (e) {   // desfaz tudo se algo falhar no meio
  fs.writeFileSync(path.join(raiz, 'server/data/secoes_v.csv'), copiaSeg.csv); fs.writeFileSync(arquivoListas, copiaSeg.listas); fs.rmSync(destinoCsv, { force: true });
  falha(`não foi possível aplicar a lista: ${e.message}`);
}
saida('mudou', 'true'); saida('resumo', resumo);
