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
  { id: 4, label: '20/10 · 13h59', nome: 'Lista de 20/10 · 13h59', arquivo: 'secoes_eleitorais_alteradas_2t-pais_2026_recent.csv' },
];

const num = (x) => Number(x) || 0;
const rows = parse(fs.readFileSync(path.join(dir, 'data', 'secoes_v.csv')), { columns: true, skip_empty_lines: true }).map((r) => ({
  uf: r.uf, municipio: r.municipio, zona: num(r.zona), secao: num(r.secao),
  localInicial: r.local_inicial, localFinal: r.local_final,
  em: [1, 2, 3, 4].map((k) => num(r['v' + k]) === 1),
  el: [1, 2, 3, 4].map((k) => num(r['el_v' + k])),
  eleitores: num(r.eleitores), aptos: num(r.aptos), temVoto: num(r.tem_voto) === 1,
  lula: num(r.lula), flavio: num(r.flavio), outros: num(r.outros),
}));


const pct = (a, v) => (v ? a / v : null);
const margem = (l, f, v) => (v ? ((l - f) / v) * 100 : null);

export const PASSOS = [[1, 2], [2, 3], [3, 4], [1, 4]];
const SITUACOES = { removidas: 'Removidas', mantidas: 'Mantidas', adicionadas: 'Adicionadas' };

const chaveMun = (r) => `${r.uf}:${r.municipio}`;
const temResultado = (r) => r.temVoto && r.lula + r.flavio + r.outros > 0;
const lider = (r) => (temResultado(r) ? (r.lula > r.flavio ? 'L' : r.flavio > r.lula ? 'F' : null) : null);

/** Filtros que recortam a base de seções (geografia e candidato líder no 1º turno). */
function base({ uf, municipio, lider: ld } = {}) {
  return rows.filter((r) => (!uf || r.uf === uf) && (!municipio || chaveMun(r) === municipio) && (!ld || lider(r) === ld));
}

/** Filtros de escopo: lista, transição entre listas e situação (removida, mantida, adicionada). */
function situacaoNa(r, a, b) {
  const x = r.em[a - 1], y = r.em[b - 1];
  return x && !y ? 'removidas' : x && y ? 'mantidas' : !x && y ? 'adicionadas' : null;
}
function escopo(rs, { lista, transicao, status } = {}) {
  let out = rs;
  if (lista) out = out.filter((r) => r.em[lista - 1]);
  const par = PASSOS.find(([a, b]) => `${a}-${b}` === transicao);
  if (par) out = out.filter((r) => { const s = situacaoNa(r, par[0], par[1]); return s && (!status || s === status); });
  return out;
}

function somar(rs, k) {
  const m = rs.filter((r) => k == null || r.em[k - 1]);
  const com = m.filter(temResultado);
  const l = com.reduce((s, r) => s + r.lula, 0), f = com.reduce((s, r) => s + r.flavio, 0), o = com.reduce((s, r) => s + r.outros, 0), v = l + f + o;
  return { secoes: m.length, semResultado: m.length - com.length, eleitores: m.reduce((s, r) => s + (k ? r.el[k - 1] : r.eleitores), 0),
    aptos: m.reduce((s, r) => s + r.aptos, 0), aptosComResultado: com.reduce((s, r) => s + r.aptos, 0), lula: l, flavio: f, outros: o, validos: v,
    lulaPct: pct(l, v), flavioPct: pct(f, v), outrosPct: pct(o, v), margem: margem(l, f, v),
    ufs: new Set(m.map((r) => r.uf)).size, municipios: new Set(m.map(chaveMun)).size };
}

export function meta() {
  const municipios = {};
  for (const r of rows) (municipios[r.uf] ||= new Set()).add(r.municipio);
  return { listas: LISTAS, ufs: [...new Set(rows.map((r) => r.uf))].sort(), totalSecoes: rows.length,
    semResultado: rows.filter((r) => !temResultado(r)).length,
    municipios: Object.fromEntries(Object.entries(municipios).map(([k, v]) => [k, [...v].sort((a, b) => a.localeCompare(b, 'pt-BR'))])),
    transicoes: PASSOS.map(([a, b]) => ({ id: `${a}-${b}`, de: a, ate: b, nome: `${LISTAS[a - 1].label} → ${LISTAS[b - 1].label}` })) };
}

export function resumo(f) {
  const rs = escopo(base(f), f);
  return LISTAS.map((l) => ({ ...l, ...somar(rs, l.id) })).filter((x) => x.secoes > 0);
}

export function mudancas(f) {
  const rs = base(f);
  const nome = (id) => LISTAS[id - 1].label;
  const detalhe = [];
  for (const [a, b] of PASSOS) for (const sit of Object.keys(SITUACOES)) {
    const sel = rs.filter((r) => situacaoNa(r, a, b) === sit);
    const s = somar(sel, null);
    detalhe.push({ passo: `${nome(a)} → ${nome(b)}`, a, b, situacao: SITUACOES[sit], secoes: s.secoes, semResultado: s.semResultado,
      eleitores: sel.reduce((t, r) => t + r.el[(sit === 'adicionadas' ? b : a) - 1], 0), lulaPct: s.lulaPct, flavioPct: s.flavioPct, margem: s.margem });
  }
  const efeito = PASSOS.map(([a, b]) => {
    const A = somar(rs, a), B = somar(rs, b);
    if (!A.secoes || !B.secoes) return null;
    return { passo: `${nome(a)} → ${nome(b)}`, antes: A.margem, depois: B.margem, variacao: B.margem - A.margem, lula: B.lula - A.lula, flavio: B.flavio - A.flavio };
  }).filter(Boolean);
  return { detalhe, efeito };
}

export function estados(f = {}) {
  const rs0 = base({ ...f, uf: '' });
  return meta().ufs.filter((uf) => !f.uf || uf === f.uf).map((uf) => {
    const rs = escopo(rs0.filter((r) => r.uf === uf), f), o = { uf };
    for (const k of [1, 2, 3, 4]) { const s = somar(rs, k); o['el' + k] = s.eleitores; o['m' + k] = s.margem; }
    return o;
  }).filter((o) => o.el1 + o.el2 + o.el3 + o.el4 > 0).sort((a, b) => b.el1 - a.el1);
}

export function municipios(f) {
  const m = new Map();
  for (const r of escopo(base(f), f)) {
    const k = r.uf + ' · ' + r.municipio;
    (m.get(k) || m.set(k, []).get(k)).push(r);
  }
  return [...m.entries()].map(([chave, rs]) => {
    const s = somar(rs, f.lista || null);
    return { municipio: chave, uf: rs[0].uf, secoes: s.secoes, semResultado: s.semResultado, eleitores: s.eleitores, lulaPct: s.lulaPct, flavioPct: s.flavioPct, margem: s.margem,
      listas: LISTAS.filter((l) => rs.some((r) => r.em[l.id - 1])).map((l) => l.label).join(' + ') };
  }).sort((a, b) => b.eleitores - a.eleitores);
}

export function secoes(f) {
  const t = (f.q || '').trim().toLowerCase();
  const par = PASSOS.find(([a, b]) => `${a}-${b}` === f.transicao);
  return escopo(base(f), f).map((r) => {
    const v = r.lula + r.flavio + r.outros, ok = temResultado(r);
    const sit = par ? SITUACOES[situacaoNa(r, par[0], par[1])] : undefined;
    return { secao: `${r.uf} · ${r.municipio} · Z${r.zona} S${r.secao}`, localInicial: r.localInicial, localFinal: r.localFinal,
      listas: LISTAS.filter((l) => r.em[l.id - 1]).map((l) => l.label).join(' + '), ...(par ? { situacao: sit } : {}),
      eleitores: r.eleitores, resultado: ok ? 'Disponível' : 'Sem resultado no cruzamento',
      lulaPct: ok ? r.lula / v : null, flavioPct: ok ? r.flavio / v : null, margem: ok ? ((r.lula - r.flavio) / v) * 100 : null };
  }).filter((r) => !t || `${r.secao} ${r.localInicial} ${r.localFinal}`.toLowerCase().includes(t));
}

/**
 * Comparação controlada por município entre dois grupos (ex.: removidas x adicionadas).
 * Só entram municípios com seções dos dois grupos (e resultado do 1º turno). A margem do grupo
 * de referência é reponderada pelos votos válidos do grupo-alvo em cada município, para que a
 * diferença não venha apenas de os grupos estarem em lugares diferentes.
 */
function controlada(rs, a, b, alvo, ref) {
  const por = new Map();
  for (const r of rs) {
    const s = situacaoNa(r, a, b);
    if ((s !== alvo && s !== ref) || !temResultado(r)) continue;
    const m = por.get(chaveMun(r)) || por.set(chaveMun(r), { [alvo]: [], [ref]: [] }).get(chaveMun(r));
    m[s].push(r);
  }
  const comuns = [...por.values()].filter((m) => m[alvo].length && m[ref].length);
  const totalAlvo = rs.filter((r) => situacaoNa(r, a, b) === alvo).length;
  if (!comuns.length) return { municipios: 0, motivo: 'Nenhum município tem seções dos dois grupos com resultado do 1º turno.' };
  const g = (x) => somar(x, null);
  const alvoAll = g(comuns.flatMap((m) => m[alvo]));
  const refAll = g(comuns.flatMap((m) => m[ref]));
  const peso = comuns.map((m) => g(m[alvo]).validos);
  const soma = peso.reduce((s, x) => s + x, 0);
  const padron = comuns.reduce((s, m, i) => s + (peso[i] / soma) * g(m[ref]).margem, 0);
  return { alvo, ref, municipios: comuns.length, secoesAlvo: alvoAll.secoes, secoesRef: refAll.secoes,
    coberturaAlvo: totalAlvo ? alvoAll.secoes / totalAlvo : null,
    margemAlvo: alvoAll.margem, margemRefPadronizada: padron, margemRefBruta: refAll.margem, diferenca: alvoAll.margem - padron };
}

/** Tudo que a narrativa da página inicial mostra, calculado a partir do CSV. */
export function historia(f = {}) {
  const rs = base(f);
  const listas = LISTAS.map((l) => ({ ...l, ...somar(rs, l.id) })).filter((x) => x.secoes > 0);
  const transicoes = PASSOS.map(([a, b]) => {
    const t = { id: `${a}-${b}`, de: a, ate: b, rotulo: `${LISTAS[a - 1].label} → ${LISTAS[b - 1].label}` };
    for (const sit of Object.keys(SITUACOES)) {
      const sel = rs.filter((r) => situacaoNa(r, a, b) === sit);
      t[sit] = { ...somar(sel, null), eleitores: sel.reduce((s, r) => s + r.el[(sit === 'adicionadas' ? b : a) - 1], 0) };
    }
    t.controlada = controlada(rs, a, b, 'adicionadas', 'removidas');
    return t;
  });
  return { listas, transicoes, semResultadoTotal: rs.filter((r) => !temResultado(r)).length, totalSecoes: rs.length };
}
