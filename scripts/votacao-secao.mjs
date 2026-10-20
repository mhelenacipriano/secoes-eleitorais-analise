// Resume a votação presidencial do 1º turno por seção (dados abertos do TSE) em uma tabela compacta, com TODAS as seções do país.
// Ela serve de grupo de controle: permite comparar as seções alteradas com as que não mudaram.
//
// Uso: node scripts/votacao-secao.mjs [arquivo .zip ou .csv] [saida]
//   Sem argumentos, baixa https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2026_BR.zip (≈160 MB; ≈1 GB descompactado).
//   Saída padrão: .dados/votacao_secoes.csv (não vai para o Git; é refeita quando necessário).
// Colunas: uf;municipio;cd_municipio;zona;secao;nr_local;local;endereco;lula;flavio;outros;brancos;nulos
//   lula = nº 13, flavio = nº 22, brancos = 95, nulos = 96, outros = os demais candidatos (votos válidos = lula + flavio + outros).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_TSE = 'https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2026_BR.zip';
const [entrada, saida = path.join(raiz, '.dados/votacao_secoes.csv')] = process.argv.slice(2);
fs.mkdirSync(path.dirname(saida), { recursive: true });

let origem = entrada;
if (!origem) {
  origem = path.join(raiz, '.dados/votacao_secao_2026_BR.zip');
  if (!fs.existsSync(origem)) {
    console.log('Baixando', URL_TSE);
    const r = await fetch(URL_TSE, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.error('ERRO: download respondeu', r.status); process.exit(1); }
    fs.writeFileSync(origem, Buffer.from(await r.arrayBuffer()));
  }
}
// fluxo de linhas: de dentro do zip (unzip -p) ou do CSV direto
let linhas;
if (/\.zip$/i.test(origem)) {
  const nome = execFileSync('unzip', ['-Z1', origem], { encoding: 'utf8' }).split('\n').find((n) => /\.csv$/i.test(n));
  const p = spawn('unzip', ['-p', origem, nome]);
  linhas = readline.createInterface({ input: p.stdout.setEncoding('latin1'), crlfDelay: Infinity });
} else linhas = readline.createInterface({ input: fs.createReadStream(origem, { encoding: 'latin1' }), crlfDelay: Infinity });

// divide uma linha CSV com ";" e aspas
function campos(l) {
  const out = []; let i = 0; const n = l.length;
  while (i <= n) {
    if (l[i] === '"') { let j = i + 1, s = ''; while (j < n) { if (l[j] === '"') { if (l[j + 1] === '"') { s += '"'; j += 2; continue; } break; } s += l[j++]; } out.push(s); i = j + 2; }
    else { let j = l.indexOf(';', i); if (j < 0) j = n; out.push(l.slice(i, j)); i = j + 1; }
  }
  return out;
}
let ix = null, n = 0;
const por = new Map();
for await (const l of linhas) {
  if (!l) continue;
  const c = campos(l);
  if (!ix) { ix = Object.fromEntries(c.map((h, i) => [h, i])); for (const k of ['SG_UF', 'NM_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'NR_VOTAVEL', 'QT_VOTOS', 'NR_TURNO', 'DS_CARGO']) if (!(k in ix)) { console.error('ERRO: coluna ausente', k); process.exit(1); } continue; }
  if (c[ix.NR_TURNO] !== '1' || c[ix.DS_CARGO] !== 'Presidente') continue;
  n++;
  const k = `${c[ix.SG_UF]}|${c[ix.NM_MUNICIPIO]}|${c[ix.NR_ZONA]}|${c[ix.NR_SECAO]}`;
  let s = por.get(k);
  if (!s) { s = { uf: c[ix.SG_UF], mun: c[ix.NM_MUNICIPIO], cd: c[ix.CD_MUNICIPIO], zona: c[ix.NR_ZONA], secao: c[ix.NR_SECAO], nl: c[ix.NR_LOCAL_VOTACAO], local: c[ix.NM_LOCAL_VOTACAO], end: c[ix.DS_LOCAL_VOTACAO_ENDERECO], lula: 0, flavio: 0, outros: 0, brancos: 0, nulos: 0 }; por.set(k, s); }
  const q = Number(c[ix.QT_VOTOS]) || 0, v = c[ix.NR_VOTAVEL];
  if (v === '13') s.lula += q; else if (v === '22') s.flavio += q; else if (v === '95') s.brancos += q; else if (v === '96') s.nulos += q; else s.outros += q;
  if (n % 1000000 === 0) console.log(`${n.toLocaleString('pt-BR')} linhas lidas…`);
}
const esc = (v) => (/[;"\r\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const out = fs.createWriteStream(saida, { encoding: 'utf8' });
out.write('uf;municipio;cd_municipio;zona;secao;nr_local;local;endereco;lula;flavio;outros;brancos;nulos\n');
for (const s of por.values()) out.write([s.uf, s.mun, s.cd, s.zona, s.secao, s.nl, s.local, s.end, s.lula, s.flavio, s.outros, s.brancos, s.nulos].map(esc).join(';') + '\n');
out.end();
await new Promise((r) => out.on('finish', r));
let L = 0, F = 0, O = 0; for (const s of por.values()) { L += s.lula; F += s.flavio; O += s.outros; }
console.log(`${por.size.toLocaleString('pt-BR')} seções; Lula ${L.toLocaleString('pt-BR')}, Flávio ${F.toLocaleString('pt-BR')}, outros ${O.toLocaleString('pt-BR')} → ${saida}`);
