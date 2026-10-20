// Aplica ao CSV consolidado a lista mais recente (CSV oficial em ISO-8859-1, separado por ";").
// A lista mais recente vale por inteira, tenha ou não cruzamento com as demais listas e com os votos:
//  - seções já conhecidas têm os locais de votação atualizados;
//  - seções novas entram sem resultado do 1º turno (tem_voto=0), nunca como zero voto;
//  - seções que saíram da lista deixam de constar nela (v4=0).
// Uso: node scripts/aplicar-lista-recente.mjs <csv> [número da lista]
// O número é o da lista no CSV consolidado (colunas v<N> e el_v<N>); se a lista ainda não existir, as colunas são criadas
// (a lista nova não altera as anteriores). Sem número, usa 4.
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const [arquivo, listaArg] = process.argv.slice(2);
const N = Number(listaArg || 4);
const V = 'v' + N, EL = 'el_v' + N;
if (!arquivo) { console.error('Informe o CSV da lista mais recente.'); process.exit(1); }
const destino = new URL('../server/data/secoes_v.csv', import.meta.url);
const bruto = fs.readFileSync(destino, 'utf8');
const crlf = bruto.includes('\r\n');
const base = parse(bruto, { columns: true, skip_empty_lines: true });
const novos = parse(new TextDecoder('latin1').decode(fs.readFileSync(arquivo)), { columns: true, delimiter: ';', skip_empty_lines: true });
let cols = Object.keys(base[0]);
if (!cols.includes(V)) {   // lista nova: cria as colunas logo depois das da lista anterior
  const antes = (nome) => cols.indexOf(nome) + 1;
  cols.splice(antes('el_v' + (N - 1)), 0, EL); cols.splice(antes('v' + (N - 1)), 0, V);
  for (const r of base) { r[V] = '0'; r[EL] = '0'; }
}

const chave = (uf, m, z, s) => [uf, m, Number(z), Number(s)].join('|');
const porChave = new Map(base.map((r) => [chave(r.uf, r.municipio, r.zona, r.secao), r]));
const nova = new Map(novos.map((r) => [chave(r.sg_uf, r.nm_municipio, r.nr_zona, r.nr_secao), r]));
if (nova.size !== novos.length) { console.error('Há seções repetidas no arquivo novo.'); process.exit(1); }

let atualizados = 0, adicionados = 0, reativados = 0, retirados = 0;
for (const [k, n] of nova) {
  let r = porChave.get(k);
  if (!r) {
    r = Object.fromEntries(cols.map((c) => [c, '0']));
    Object.assign(r, { uf: n.sg_uf, municipio: n.nm_municipio, zona: String(Number(n.nr_zona)), secao: String(Number(n.nr_secao)), local_inicial: n.nm_local_votacao_inicial, local_final: n.nm_local_votacao_final, [V]: '1', [EL]: n.qt_eleitores, eleitores: n.qt_eleitores });
    base.push(r); porChave.set(k, r); adicionados++; continue;
  }
  if (r[V] !== '1') { r[V] = '1'; reativados++; }
  if (r.local_inicial !== n.nm_local_votacao_inicial || r.local_final !== n.nm_local_votacao_final) { r.local_inicial = n.nm_local_votacao_inicial; r.local_final = n.nm_local_votacao_final; atualizados++; }
  r[EL] = n.qt_eleitores;
}
for (const [k, r] of porChave) if (r[V] === '1' && !nova.has(k)) { r[V] = '0'; r[EL] = '0'; retirados++; }

const esc = (v) => (/[,"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const eol = crlf ? '\r\n' : '\n';
fs.writeFileSync(destino, [cols.join(','), ...base.map((r) => cols.map((c) => esc(String(r[c]))).join(','))].join(eol) + eol);
console.log(`Lista ${N}: ${nova.size} seções. Locais atualizados: ${atualizados}; seções novas (sem resultado do 1º turno): ${adicionados}; reincluídas: ${reativados}; retiradas: ${retirados}.`);
