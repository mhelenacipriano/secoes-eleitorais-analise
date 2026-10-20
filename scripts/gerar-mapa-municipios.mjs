// Gera server/data/mapa-municipios.json: contorno dos estados e o desenho dos municípios que têm seções alteradas (malhas do IBGE,
// qualidade mínima), já projetados em uma caixa de 1000 de largura para virar <path> no navegador.
// Precisa de internet. Rode depois de scripts/gerar-controle.mjs (usa a lista de municípios de controle.json).
// Uso: node scripts/gerar-mapa-municipios.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const IBGE = 'https://servicodados.ibge.gov.br/api';
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };

const controle = JSON.parse(fs.readFileSync(path.join(raiz, 'server/data/controle.json'), 'utf8'));
// nomes que o TSE abrevia em relação ao IBGE
const ALIAS = { 'GO|BOM JESUS': 'GO|BOM JESUS DE GOIAS', 'RR|SAO LUIZ': 'RR|SAO LUIZ DO ANAUA' };
const alvo = new Map(controle.porMunicipio.filter((m) => m.uf !== 'ZZ').map((m) => { const k = `${m.uf}|${norm(m.municipio)}`; return [ALIAS[k] || k, m]; }));

const [loc, mun, ufs] = await Promise.all([
  get(`${IBGE}/v1/localidades/municipios`),
  get(`${IBGE}/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio`),
  get(`${IBGE}/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF`),
]);
const info = new Map(loc.map((m) => [String(m.id), { nome: m.nome, uf: (m.microrregiao?.mesorregiao?.UF || m['regiao-imediata']?.['regiao-intermediaria']?.UF)?.sigla }]));

// projeção simples (equirretangular com correção pela latitude média), ajustada à caixa do Brasil
const LAT0 = -14, K = Math.cos((LAT0 * Math.PI) / 180);
const bruto = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
for (const f of ufs.features) for (const poly of bruto(f.geometry)) for (const anel of poly) for (const [lo, la] of anel) { x0 = Math.min(x0, lo * K); x1 = Math.max(x1, lo * K); y0 = Math.min(y0, -la); y1 = Math.max(y1, -la); }
const esc = 1000 / (x1 - x0), L = 1000, A = Math.round((y1 - y0) * esc);
const pt = ([lo, la]) => `${((lo * K - x0) * esc).toFixed(1)} ${((-la - y0) * esc).toFixed(1)}`;
const caminho = (g) => bruto(g).map((poly) => poly.map((anel) => 'M' + anel.map(pt).join('L') + 'Z').join('')).join('');

const municipios = [];
const faltou = new Set(alvo.keys());
for (const f of mun.features) {
  const i = info.get(f.properties.codarea); if (!i) continue;
  const k = `${i.uf}|${norm(i.nome)}`, m = alvo.get(k);
  if (!m) continue;
  faltou.delete(k);
  municipios.push({ ibge: f.properties.codarea, uf: i.uf, nome: i.nome, chave: `${m.uf}|${m.municipio}`, d: caminho(f.geometry) });
}
const estados = ufs.features.map((f) => caminho(f.geometry)).join('');
fs.writeFileSync(path.join(raiz, 'server/data/mapa-municipios.json'), JSON.stringify({ largura: L, altura: A, estados, municipios }));
console.log(`${municipios.length} municípios desenhados; sem correspondência: ${faltou.size}`, [...faltou].slice(0, 12));
