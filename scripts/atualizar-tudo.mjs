// Roda a rotina completa de atualização: descobre o link da lista mais recente, atualiza a análise e (se CONSULTA_DIR apontar para o
// clone do repositório da consulta) a consulta, confere os números e envia para o GitHub. Feito para rodar no seu computador, em cron/agendador.
//
//   node scripts/atualizar-tudo.mjs [--url <link .csv.zip>] [--sem-push]
//
// Variáveis: CONSULTA_DIR=/caminho/para/secoes-eleitorais-consulta-2026 (opcional) · HEADLESS=1 (veja descobrir-url.mjs)
// Exemplo de cron (horário de Brasília, 20 min depois de cada atualização do TSE):  35 6,11,15,20 * * *  cd ~/secoes-eleitorais && node scripts/atualizar-tudo.mjs >> ~/atualizacao.log 2>&1
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const semPush = args.includes('--sem-push');
const sh = (cmd, a, cwd, opc = {}) => execFileSync(cmd, a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opc }).trim();
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

let url = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
if (!url) {
  const r = spawnSync(process.execPath, [path.join(raiz, 'scripts/descobrir-url.mjs')], { cwd: raiz, encoding: 'utf8' });
  if (r.status !== 0) { log(`não consegui descobrir o link (código ${r.status}): ${r.stderr.trim()}`); process.exit(r.status || 1); }
  url = JSON.parse(r.stdout.trim().split('\n').pop()).url;
}
log(`link: ${url}`);

function atualiza(dir, nome, comandos, arquivos) {
  sh('git', ['pull', '--rebase', '--autostash', '-q'], dir);
  const saida = sh(process.execPath, comandos[0], dir);
  console.log(saida);
  if (/Sem mudança|sem mudança/.test(saida)) { log(`${nome}: nada mudou`); return false; }
  for (const c of comandos.slice(1)) sh(c[0], c.slice(1), dir, { stdio: ['ignore', 'inherit', 'inherit'] });
  sh('git', ['add', ...arquivos], dir);
  sh('git', ['commit', '-q', '-m', `${nome}: atualiza a lista do TSE (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`], dir);
  if (!semPush) sh('git', ['push', '-q'], dir);
  log(`${nome}: atualizado${semPush ? ' (sem push)' : ' e enviado'}`);
  return true;
}

atualiza(raiz, 'Análise', [[path.join(raiz, 'scripts/atualizar-lista.mjs'), url], ['npm', 'run', '--silent', 'verificar']], ['server/data']);
if (process.env.CONSULTA_DIR) {
  const dir = path.resolve(process.env.CONSULTA_DIR);
  atualiza(dir, 'Consulta', [[path.join(dir, 'scripts/gerar-dados.mjs'), url], ['npm', 'run', '--silent', 'build']], ['public/secoes.json', 'dados-fonte']);
}
