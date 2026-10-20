// Recalcula, direto do CSV e sem usar server/data.js, os números que o site mostra
// e compara com o que a API devolve. Termina com erro se algo divergir.
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { historia } from '../server/data.js';

const n = (x) => Number(x) || 0;
const rows = parse(fs.readFileSync(new URL('../server/data/secoes_v.csv', import.meta.url)), { columns: true });
const em = (r, k) => n(r['v' + k]) === 1;
const comRes = (r) => n(r.tem_voto) === 1 && n(r.lula) + n(r.flavio) + n(r.outros) > 0;
function agg(rs) {
  const c = rs.filter(comRes), l = c.reduce((s, r) => s + n(r.lula), 0), f = c.reduce((s, r) => s + n(r.flavio), 0), o = c.reduce((s, r) => s + n(r.outros), 0), v = l + f + o;
  return { secoes: rs.length, semRes: rs.length - c.length, lula: (100 * l) / v, flavio: (100 * f) / v, margem: (100 * (l - f)) / v };
}
let falhas = 0;
const confere = (nome, obtido, esperado, tol = 1e-9) => {
  const ok = esperado == null ? obtido == null : Math.abs(obtido - esperado) <= tol;
  if (!ok) { falhas++; console.error('✗', nome, obtido, '≠', esperado); } else console.log('✓', nome, typeof obtido === 'number' ? obtido.toFixed(2) : obtido);
};

const h = historia();
for (const l of h.listas) {
  const rs = rows.filter((r) => em(r, l.id)), a = agg(rs);
  confere(`lista ${l.id}: seções`, l.secoes, rs.length);
  confere(`lista ${l.id}: eleitores`, l.eleitores, rs.reduce((s, r) => s + n(r['el_v' + l.id]), 0));
  confere(`lista ${l.id}: Lula %`, l.lulaPct * 100, a.lula);
  confere(`lista ${l.id}: Flávio %`, l.flavioPct * 100, a.flavio);
  confere(`lista ${l.id}: margem`, l.margem, a.margem);
  confere(`lista ${l.id}: sem resultado`, l.semResultado, a.semRes);
}
for (const t of h.transicoes) for (const [g, f] of [['removidas', (r) => em(r, t.de) && !em(r, t.ate)], ['mantidas', (r) => em(r, t.de) && em(r, t.ate)], ['adicionadas', (r) => !em(r, t.de) && em(r, t.ate)]]) {
  const a = agg(rows.filter(f));
  confere(`${t.id} ${g}: seções`, t[g].secoes, a.secoes);
  confere(`${t.id} ${g}: Lula %`, (t[g].lulaPct ?? NaN) * 100, a.lula || NaN);
  confere(`${t.id} ${g}: Flávio %`, (t[g].flavioPct ?? NaN) * 100, a.flavio || NaN);
}
confere('seções únicas', h.totalSecoes, rows.length);
confere('seções sem resultado', h.semResultadoTotal, rows.filter((r) => !comRes(r)).length);

// Resultados históricos informados (arredondados a 2 casas): têm de bater com o CSV.
const hist = { '1-2': { rem: [653, 45.77, 46.65], add: [16, 76.07, 19.34] }, '2-3': { rem: [892, 53.04, 40.66], add: [50, 50.39, 43.62] }, '1-4': { rem: [1793, 48.78, 44.27], add: [192, 51.76, 42.04] } };
for (const [id, g] of Object.entries(hist)) {
  const t = h.transicoes.find((x) => x.id === id);
  for (const [k, nome] of [['rem', 'removidas'], ['add', 'adicionadas']]) {
    // Removidas: contagem total (inclui as 10 sem resultado da 1ª lista). Adicionadas: só as com resultado do 1º turno
    // (as seções novas da última lista não têm cruzamento e ficam fora das porcentagens).
    confere(`histórico ${id} ${nome}: seções`, nome === 'adicionadas' ? t[nome].secoes - t[nome].semResultado : t[nome].secoes, g[k][0]);
    confere(`histórico ${id} ${nome}: Lula`, +(t[nome].lulaPct * 100).toFixed(2), g[k][1]);
    confere(`histórico ${id} ${nome}: Flávio`, +(t[nome].flavioPct * 100).toFixed(2), g[k][2]);
  }
}
if (falhas) { console.error(`\n${falhas} divergência(s).`); process.exit(1); }
console.log('\nTudo confere com o CSV.');
