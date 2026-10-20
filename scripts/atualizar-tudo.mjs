// Rotina completa de atualização: lê o painel do TSE (arquivo oficial ou tabela), atualiza a análise e (se CONSULTA_DIR apontar para o
// clone do repositório da consulta) a consulta, confere os números e envia para o GitHub. Feita para rodar no seu computador, em cron/agendador.
//
//   node scripts/atualizar-tudo.mjs [--url <link .csv.zip>] [--sem-push] [--forcar]
//
// Sem --url, usa scripts/raspar-painel.mjs (precisa de Playwright e Chrome; o painel bloqueia data centers).
// Se o painel disser a mesma data/hora da última lista que já temos, nada é baixado nem alterado.
// Variáveis: CONSULTA_DIR=/caminho/para/secoes-eleitorais-consulta-2026 (opcional) · HEADLESS=1 (veja raspar-painel.mjs)
// Exemplo de cron (Brasília, 10 min depois de cada atualização do TSE):
//   35 6,11,15,20 * * *  cd ~/secoes-eleitorais && CONSULTA_DIR=~/secoes-eleitorais-consulta-2026 node scripts/atualizar-tudo.mjs >> ~/atualizacao.log 2>&1
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const semPush = args.includes('--sem-push'), forcar = args.includes('--forcar');
const sh = (cmd, a, cwd, opc = {}) => execFileSync(cmd, a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opc }).trim();
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

let origem = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
let extras = [];
if (!origem) {
  const listas = JSON.parse(fs.readFileSync(path.join(raiz, 'server/data/listas.json'), 'utf8'));
  const ultima = listas[listas.length - 1].publicadaEm;
  const r = spawnSync(process.execPath, [path.join(raiz, 'scripts/raspar-painel.mjs'), '--saida', path.join(raiz, '.raspagem.csv'), '--ultima', ultima, ...(forcar ? ['--forcar'] : [])], { cwd: raiz, encoding: 'utf8' });
  if (r.stderr) console.error(r.stderr.trim());
  if (r.status !== 0) { log(`não consegui ler o painel (código ${r.status})`); process.exit(r.status || 1); }
  const j = JSON.parse(r.stdout.trim().split('\n').pop());
  if (j.semMudanca) { log(`painel sem novidade (última atualização ${j.ultimaAtualizacao}); nada a fazer`); process.exit(0); }
  if (j.url) origem = j.url;
  else { origem = j.csv; extras = ['--publicada-em', j.publicadaEm, '--fonte', 'painel do SIG/TSE (leitura da tabela)']; }
}
log(`origem: ${origem}`);

function atualiza(dir, nome, script, depois, arquivos) {
  sh('git', ['pull', '--rebase', '--autostash', '-q'], dir);
  const saida = sh(process.execPath, [path.join(dir, script), origem, ...extras], dir);
  console.log(saida);
  if (/Sem mudança/i.test(saida)) { log(`${nome}: nada mudou`); return false; }
  for (const c of depois) sh(c[0], c.slice(1), dir, { stdio: ['ignore', 'inherit', 'inherit'] });
  sh('git', ['add', ...arquivos], dir);
  sh('git', ['commit', '-q', '-m', `${nome}: atualiza a lista do TSE (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`], dir);
  if (!semPush) sh('git', ['push', '-q'], dir);
  log(`${nome}: atualizado${semPush ? ' (sem push)' : ' e enviado'}`);
  return true;
}

atualiza(raiz, 'Análise', 'scripts/atualizar-lista.mjs', [['npm', 'run', '--silent', 'verificar']], ['server/data']);
if (process.env.CONSULTA_DIR) atualiza(path.resolve(process.env.CONSULTA_DIR), 'Consulta', 'scripts/gerar-dados.mjs', [['npm', 'run', '--silent', 'build']], ['public/secoes.json', 'dados-fonte']);
fs.rmSync(path.join(raiz, '.raspagem.csv'), { force: true });
