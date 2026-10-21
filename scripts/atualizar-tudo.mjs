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
const sh = (cmd, a, cwd, opc = {}) => { const r = execFileSync(cmd, a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opc }); return r ? r.trim() : ''; };   // com stdio 'inherit' o retorno é nulo
// Estado do painel do TSE, para o aviso do site: quando conferimos pela última vez e o que o painel informa (última e próxima atualização).
const gravaPainel = (j) => fs.writeFileSync(path.join(raiz, 'server/data/painel.json'), JSON.stringify({ verificadoEm: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), ultimaAtualizacao: j.ultimaAtualizacao || null, proximaAtualizacao: j.proximaAtualizacao || null }, null, 2) + '\n');
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
  if (j.semMudanca) {
    log(`painel sem novidade (última atualização ${j.ultimaAtualizacao}); registrando a conferência`);
    sh('git', ['pull', '--rebase', '--autostash', '-q'], raiz); gravaPainel(j);
    sh('git', ['add', 'server/data/painel.json'], raiz); sh('git', ['commit', '-q', '-m', `Painel do TSE conferido (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}): sem lista nova`], raiz);
    if (!semPush) sh('git', ['push', '-q'], raiz);
    fs.rmSync(path.join(raiz, '.raspagem.csv'), { force: true }); process.exit(0);
  }
  gravaPainel(j);
  if (j.url) origem = j.url;
  else { origem = j.csv; extras = ['--publicada-em', j.publicadaEm, '--fonte', 'painel do SIG/TSE (leitura da tabela)']; }
}
log(`origem: ${origem}`);

function atualiza(dir, nome, script, depois, arquivos, opcionais = []) {
  sh('git', ['pull', '--rebase', '--autostash', '-q'], dir);
  const saida = sh(process.execPath, [path.join(dir, script), origem, ...extras], dir);
  console.log(saida);
  if (/Sem mudança/i.test(saida)) { log(`${nome}: nada mudou`); return false; }
  for (const c of depois) sh(c[0], c.slice(1), dir, { stdio: ['ignore', 'inherit', 'inherit'] });
  for (const c of opcionais) { try { sh(c[0], c.slice(1), dir, { stdio: ['ignore', 'inherit', 'inherit'] }); } catch (e) { log(`aviso: ${c.slice(1).join(' ')} falhou e foi ignorado (${String(e.message).split('\n')[0].slice(0, 120)})`); } }
  sh('git', ['add', ...arquivos], dir);
  sh('git', ['commit', '-q', '-m', `${nome}: atualiza a lista do TSE (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`], dir);
  if (!semPush) sh('git', ['push', '-q'], dir);
  log(`${nome}: atualizado${semPush ? ' (sem push)' : ' e enviado'}`);
  return true;
}

// depois de aplicar a lista: confere os números e refaz o grupo de controle (precisa baixar a votação do 1º turno, ≈160 MB; se falhar, a lista é atualizada mesmo assim)
atualiza(raiz, 'Análise', 'scripts/atualizar-lista.mjs', [['npm', 'run', '--silent', 'verificar']], ['server/data'], [['node', 'scripts/votacao-secao.mjs'], ['node', 'scripts/gerar-controle.mjs']]);
if (process.env.CONSULTA_DIR) atualiza(path.resolve(process.env.CONSULTA_DIR), 'Consulta', 'scripts/gerar-dados.mjs', [['npm', 'run', '--silent', 'build']], ['public/secoes.json', 'dados-fonte']);
fs.rmSync(path.join(raiz, '.raspagem.csv'), { force: true });
