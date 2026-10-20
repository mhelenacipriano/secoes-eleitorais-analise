// Aplica ao CSV consolidado a lista mais recente (CSV oficial em ISO-8859-1, separado por ";").
// Confere que são as mesmas seções da última lista (v4) e atualiza os locais de votação que mudaram.
// Uso: node scripts/aplicar-lista-recente.mjs server/data/fontes/secoes_eleitorais_alteradas_2t-regiao_2026.csv
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const [arquivo] = process.argv.slice(2);
if (!arquivo) { console.error('Informe o CSV da lista mais recente.'); process.exit(1); }
const destino = new URL('../server/data/secoes_v.csv', import.meta.url);
const bruto = fs.readFileSync(destino, 'utf8');
const crlf = bruto.includes('\r\n');
const base = parse(bruto, { columns: true, skip_empty_lines: true });
const novos = parse(new TextDecoder('latin1').decode(fs.readFileSync(arquivo)), { columns: true, delimiter: ';', skip_empty_lines: true });

const chave = (uf, m, z, s) => [uf, m, Number(z), Number(s)].join('|');
const ultima = new Map(base.filter((r) => r.v4 === '1').map((r) => [chave(r.uf, r.municipio, r.zona, r.secao), r]));
const nova = new Map(novos.map((r) => [chave(r.sg_uf, r.nm_municipio, r.nr_zona, r.nr_secao), r]));
const faltam = [...nova.keys()].filter((k) => !ultima.has(k)), sobram = [...ultima.keys()].filter((k) => !nova.has(k));
if (faltam.length || sobram.length) { console.error(`Conjuntos de seções diferentes: ${faltam.length} só no arquivo novo, ${sobram.length} só na última lista atual.`); process.exit(1); }

let alterados = 0;
for (const [k, n] of nova) {
  const r = ultima.get(k);
  if (r.local_inicial !== n.nm_local_votacao_inicial || r.local_final !== n.nm_local_votacao_final) {
    r.local_inicial = n.nm_local_votacao_inicial; r.local_final = n.nm_local_votacao_final; alterados++;
  }
  if (Number(r.el_v4) !== Number(n.qt_eleitores)) { console.error(`Eleitores diferentes em ${k}`); process.exit(1); }
}
const cols = Object.keys(base[0]);
const esc = (v) => (/[,"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const eol = crlf ? '\r\n' : '\n';
fs.writeFileSync(destino, [cols.join(','), ...base.map((r) => cols.map((c) => esc(String(r[c]))).join(','))].join(eol) + eol);
console.log(`${nova.size} seções conferidas; ${alterados} locais atualizados.`);
