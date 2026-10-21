// Grupo de controle: compara a margem (Lula − Flávio) das seções que aparecem nas listas com a das seções
// que NÃO aparecem em nenhuma lista, do mesmo município (1º turno inteiro: .dados/votacao_secoes.csv,
// gerado por scripts/votacao-secao.mjs). Escreve server/data/controle.json (pequeno, vai para o repositório).
// Uso: node scripts/gerar-controle.mjs [votacao_secoes.csv] [saida.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const entrada = process.argv[2] || path.join(raiz, '.dados', 'votacao_secoes.csv');
const saida = process.argv[3] || path.join(raiz, 'server', 'data', 'controle.json');
const listas = JSON.parse(fs.readFileSync(path.join(raiz, 'server/data/listas.json'), 'utf8'));
const IDS = listas.map((l) => l.id);
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const chaveSec = (uf, mun, z, s) => `${uf}|${norm(mun)}|${Number(z)}|${Number(s)}`;

// semente fixa para o resultado ser reproduzível
let seed = 20261020;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const nossas = parse(fs.readFileSync(path.join(raiz, 'server/data/secoes_v.csv')), { columns: true, skip_empty_lines: true });
const tse = new Map();
const linhas = fs.readFileSync(entrada, 'utf8').split('\n');
const cab = linhas[0].split(';');
const ix = Object.fromEntries(cab.map((c, i) => [c, i]));
for (let i = 1; i < linhas.length; i++) {
  if (!linhas[i]) continue;
  const c = linhas[i].split(';');
  tse.set(chaveSec(c[ix.uf], c[ix.municipio], c[ix.zona], c[ix.secao]), { uf: c[ix.uf], mun: c[ix.municipio], zona: +c[ix.zona], l: +c[ix.lula], f: +c[ix.flavio], o: +c[ix.outros], local: c[ix.local] });
}

// confere os votos que já tínhamos contra o arquivo completo
let achou = 0, igual = 0, semVoto = 0;
const alteradas = new Map(); // chave -> {listas:[k..], local}
for (const r of nossas) {
  const k = chaveSec(r.uf, r.municipio, r.zona, r.secao);
  const t = tse.get(k);
  if (Number(r.tem_voto) === 1) { if (t) { achou++; if (t.l === +r.lula && t.f === +r.flavio && t.o === +r.outros) igual++; } } else semVoto++;
  alteradas.set(k, { listas: IDS.filter((id) => Number(r['v' + id]) === 1), local: r.local_inicial });
}

const margem = (t) => { const v = t.l + t.f + t.o; return v ? ((t.l - t.f) / v) * 100 : null; };
const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const quantil = (a, p) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };

// separa as seções do arquivo completo por município
const muns = new Map();
for (const [k, t] of tse) {
  const m = margem(t); if (m == null) continue;
  const id = `${t.uf}|${norm(t.mun)}`;
  if (!muns.has(id)) muns.set(id, { uf: t.uf, municipio: t.mun, ctrl: [], alt: [] });
  const a = alteradas.get(k);
  (a ? muns.get(id).alt : muns.get(id).ctrl).push({ m, listas: a ? a.listas : [], local: a ? a.local : null });
}

const diffPond = (cs) => { // diferença média ponderada pelo nº de seções alteradas, dentro de cada município
  let num = 0, den = 0;
  for (const c of cs) { if (!c.a.length || !c.c.length) continue; num += (media(c.a) - media(c.c)) * c.a.length; den += c.a.length; }
  return den ? num / den : null;
};
const B = 2000, P = 2000;

function analisar(filtro) {
  const cs = [], todasAlt = [], todasCtrl = [];
  for (const mu of muns.values()) {
    const a = mu.alt.filter(filtro);
    if (!a.length || !mu.ctrl.length) continue;
    cs.push({ a: a.map((x) => x.m), c: mu.ctrl.map((x) => x.m), mun: mu });
    a.forEach((x) => todasAlt.push(x.m)); mu.ctrl.forEach((x) => todasCtrl.push(x.m));
  }
  if (cs.length < 3) return null;
  const est = diffPond(cs);
  // bootstrap por município (cluster): reamostra municípios inteiros
  const bs = [];
  for (let b = 0; b < B; b++) { const am = Array.from({ length: cs.length }, () => cs[Math.floor(rnd() * cs.length)]); bs.push(diffPond(am)); }
  // permutação dentro de cada município: embaralha os rótulos "alterada"/"controle"
  let extremo = 0;
  for (let p = 0; p < P; p++) {
    const perm = cs.map((c) => { const todos = c.a.concat(c.c); for (let i = todos.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todos[i], todos[j]] = [todos[j], todos[i]]; } return { a: todos.slice(0, c.a.length), c: todos.slice(c.a.length) }; });
    if (Math.abs(diffPond(perm)) >= Math.abs(est)) extremo++;
  }
  // ingênuo (sem considerar o agrupamento), para mostrar o quanto o intervalo se alarga
  const sd = (a) => { const m = media(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const ep = Math.sqrt(sd(todasAlt) ** 2 / todasAlt.length + sd(todasCtrl) ** 2 / todasCtrl.length);
  const ecdf = (a) => Array.from({ length: 101 }, (_, i) => +quantil(a, i / 100).toFixed(2));
  return {
    municipios: cs.length, alteradas: todasAlt.length, controle: todasCtrl.length,
    margemAlteradas: +media(todasAlt).toFixed(2), margemControle: +media(todasCtrl).toFixed(2),
    mediaBruta: +(media(todasAlt) - media(todasCtrl)).toFixed(2),
    diferenca: +est.toFixed(2), ic95: [+quantil(bs, 0.025).toFixed(2), +quantil(bs, 0.975).toFixed(2)],
    icIngenuo: [+(media(todasAlt) - media(todasCtrl) - 1.96 * ep).toFixed(2), +(media(todasAlt) - media(todasCtrl) + 1.96 * ep).toFixed(2)],
    pPermutacao: +((extremo + 1) / (P + 1)).toFixed(4),
    quantisAlteradas: ecdf(todasAlt), quantisControle: ecdf(todasCtrl),
  };
}

const resultado = {
  geradoEm: new Date().toISOString(), seed: 20261020, reamostras: B, permutacoes: P,
  conferencia: { comResultado: achou, iguaisAoArquivoCompleto: igual, semResultado: semVoto },
  totalSecoes: tse.size,
  nacional: { lula: [...tse.values()].reduce((a, t) => a + t.l, 0), flavio: [...tse.values()].reduce((a, t) => a + t.f, 0), outros: [...tse.values()].reduce((a, t) => a + t.o, 0) },
  qualquerLista: analisar((x) => x.listas.length > 0),
  porLista: Object.fromEntries(IDS.map((id) => [id, analisar((x) => x.listas.includes(id))])),
};

// por município (para o mapa e o funil): margem das alteradas vs. controle
resultado.porMunicipio = [...muns.values()].filter((mu) => mu.alt.length).map((mu) => ({
  uf: mu.uf, municipio: mu.municipio, alteradas: mu.alt.length, secoes: mu.alt.length + mu.ctrl.length,
  margemAlteradas: +media(mu.alt.map((x) => x.m)).toFixed(2), margemControle: mu.ctrl.length ? +media(mu.ctrl.map((x) => x.m)).toFixed(2) : null,
})).sort((a, b) => b.alteradas - a.alteradas);

fs.writeFileSync(saida, JSON.stringify(resultado));
const q = resultado.qualquerLista;
console.log(`conferência: ${igual}/${achou} seções com votos iguais ao arquivo completo`);
console.log(`qualquer lista: ${q.alteradas} alteradas vs ${q.controle} controle em ${q.municipios} municípios`);
console.log(`margem alteradas ${q.margemAlteradas} · controle ${q.margemControle} · bruta ${q.mediaBruta} · dentro do município ${q.diferenca} IC95 ${q.ic95} (ingênuo ${q.icIngenuo}) p=${q.pPermutacao}`);
for (const id of IDS) { const r = resultado.porLista[id]; if (r) console.log(`lista ${id}: n=${r.alteradas} dif ${r.diferenca} IC ${r.ic95} p=${r.pPermutacao}`); }
