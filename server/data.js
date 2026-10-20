// Carrega o CSV consolidado e calcula tudo que o site mostra.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const dir = path.dirname(fileURLToPath(import.meta.url));

export const LISTAS = [
  { id: 1, label: '18/10 · 11h', nome: 'Lista de 18/10 · 11h', arquivo: 'secoes_eleitorais_alteradas_2t-pais_2026.csv' },
  { id: 2, label: '18/10 · 17h', nome: 'Lista de 18/10 · 17h', arquivo: 'secoes_eleitorais_alteradas_2t-pais_2026 v2.csv' },
  { id: 3, label: '19/10 · 11h', nome: 'Lista de 19/10 · 11h', arquivo: 'secoes_eleitorais_alteradas_2t-pais_2026v3.csv' },
  { id: 4, label: 'Lista de 438', nome: 'Lista de 438 seções', arquivo: 'Lista de 438 seções (data não informada)' },
];

const num = (x) => Number(x) || 0;
const rows = parse(fs.readFileSync(path.join(dir, 'data', 'secoes_v.csv')), { columns: true, skip_empty_lines: true }).map((r) => ({
  uf: r.uf, municipio: r.municipio, zona: num(r.zona), secao: num(r.secao),
  localInicial: r.local_inicial, localFinal: r.local_final,
  em: [1, 2, 3, 4].map((k) => num(r['v' + k]) === 1),
  el: [1, 2, 3, 4].map((k) => num(r['el_v' + k])),
  eleitores: num(r.eleitores), temVoto: num(r.tem_voto) === 1,
  lula: num(r.lula), flavio: num(r.flavio), outros: num(r.outros),
}));

const byUf = (uf) => (uf ? rows.filter((r) => r.uf === uf) : rows);
const pct = (a, v) => (v ? a / v : null);
const margem = (l, f, v) => (v ? ((l - f) / v) * 100 : null);

function somar(rs, k) {
  const m = rs.filter((r) => k == null || r.em[k - 1]);
  const l = m.reduce((s, r) => s + r.lula, 0), f = m.reduce((s, r) => s + r.flavio, 0), o = m.reduce((s, r) => s + r.outros, 0), v = l + f + o;
  return { secoes: m.length, eleitores: m.reduce((s, r) => s + (k ? r.el[k - 1] : r.eleitores), 0), lula: l, flavio: f, outros: o, validos: v,
    lulaPct: pct(l, v), flavioPct: pct(f, v), outrosPct: pct(o, v), margem: margem(l, f, v),
    ufs: new Set(m.map((r) => r.uf)).size, municipios: new Set(m.map((r) => r.uf + r.municipio)).size };
}

export function meta() {
  return { listas: LISTAS, ufs: [...new Set(rows.map((r) => r.uf))].sort(), totalSecoes: rows.length };
}

export function resumo(uf) {
  const rs = byUf(uf);
  return LISTAS.map((l) => ({ ...l, ...somar(rs, l.id) })).filter((x) => x.secoes > 0);
}

const PASSOS = [[1, 2], [2, 3], [3, 4], [1, 4]];
export function mudancas(uf) {
  const rs = byUf(uf);
  const nome = (id) => LISTAS[id - 1].label;
  const detalhe = [];
  for (const [a, b] of PASSOS) for (const sit of ['Removidas', 'Mantidas', 'Adicionadas']) {
    const sel = rs.filter((r) => (sit === 'Removidas' ? r.em[a - 1] && !r.em[b - 1] : sit === 'Mantidas' ? r.em[a - 1] && r.em[b - 1] : !r.em[a - 1] && r.em[b - 1]));
    const l = sel.reduce((s, r) => s + r.lula, 0), f = sel.reduce((s, r) => s + r.flavio, 0), v = l + f + sel.reduce((s, r) => s + r.outros, 0);
    detalhe.push({ passo: `${nome(a)} → ${nome(b)}`, a, b, situacao: sit, secoes: sel.length,
      eleitores: sel.reduce((s, r) => s + r.el[(sit === 'Adicionadas' ? b : a) - 1], 0), lulaPct: pct(l, v), flavioPct: pct(f, v), margem: margem(l, f, v) });
  }
  const efeito = PASSOS.map(([a, b]) => {
    const A = somar(rs, a), B = somar(rs, b);
    if (!A.secoes || !B.secoes) return null;
    return { passo: `${nome(a)} → ${nome(b)}`, antes: A.margem, depois: B.margem, variacao: B.margem - A.margem, lula: B.lula - A.lula, flavio: B.flavio - A.flavio };
  }).filter(Boolean);
  return { detalhe, efeito };
}

export function estados() {
  return meta().ufs.map((uf) => {
    const rs = byUf(uf), o = { uf };
    for (const k of [1, 2, 3, 4]) { const s = somar(rs, k); o['el' + k] = s.eleitores; o['m' + k] = s.margem; }
    return o;
  }).filter((o) => o.el1 + o.el2 + o.el3 + o.el4 > 0).sort((a, b) => b.el1 - a.el1);
}

export function municipios({ uf, lista }) {
  const m = new Map();
  for (const r of byUf(uf)) {
    if (lista && !r.em[lista - 1]) continue;
    const k = r.uf + ' · ' + r.municipio;
    (m.get(k) || m.set(k, []).get(k)).push(r);
  }
  return [...m.entries()].map(([chave, rs]) => {
    const s = somar(rs, lista || null);
    return { municipio: chave, uf: rs[0].uf, secoes: s.secoes, eleitores: s.eleitores, lulaPct: s.lulaPct, flavioPct: s.flavioPct, margem: s.margem,
      listas: LISTAS.filter((l) => rs.some((r) => r.em[l.id - 1])).map((l) => l.label).join(' + ') };
  }).sort((a, b) => b.eleitores - a.eleitores);
}

export function secoes({ uf, lista, vantagem, q }) {
  const t = (q || '').trim().toLowerCase();
  return byUf(uf).filter((r) => (!lista || r.em[lista - 1])).map((r) => {
    const v = r.lula + r.flavio + r.outros, ok = r.temVoto && v > 0;
    return { secao: `${r.uf} · ${r.municipio} · Z${r.zona} S${r.secao}`, localInicial: r.localInicial, localFinal: r.localFinal,
      listas: LISTAS.filter((l) => r.em[l.id - 1]).map((l) => l.label).join(' + '), eleitores: r.eleitores,
      lulaPct: ok ? r.lula / v : null, flavioPct: ok ? r.flavio / v : null, margem: ok ? ((r.lula - r.flavio) / v) * 100 : null };
  }).filter((r) => (!vantagem || (r.margem != null && (vantagem === 'L' ? r.margem > 0 : r.margem < 0)))
    && (!t || `${r.secao} ${r.localInicial} ${r.localFinal}`.toLowerCase().includes(t)));
}
