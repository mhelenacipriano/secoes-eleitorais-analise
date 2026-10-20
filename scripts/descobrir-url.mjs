// Descobre, no painel "Seções alteradas" do SIG/TSE, o link do arquivo .csv.zip da lista mais recente e o que o painel diz sobre as atualizações.
// O link do CDN muda a cada publicação (leva a data/hora e um código na pasta), então não dá para adivinhar: precisa ser lido do painel.
//
// ATENÇÃO: o painel bloqueia acesso de data centers (403 "Access Denied", mesmo com navegador de verdade). Rode numa máquina com
// internet comum (seu computador ou um servidor residencial/no Brasil). Segue a abordagem do projeto gusehr/tse-mudanca-secao,
// que usa o Chrome de verdade, com janela (headless=false), para o TSE aceitar.
//
// Requisitos: npm i -D playwright  (e o Chrome instalado). Uso: node scripts/descobrir-url.mjs   → imprime JSON em uma linha.
// Variáveis: HEADLESS=1 (sem janela; costuma ser bloqueado), PAINEL_URL (outro endereço do painel).
// Código de saída: 0 achou o link · 2 não achou (o painel pode ter mudado) · 3 acesso bloqueado.
const PAINEL = process.env.PAINEL_URL || 'https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-eleitorado/se%C3%A7%C3%B5es-alteradas';
const PADRAO = /https?:\/\/cdn\.tse\.jus\.br\/[^\s"'<>]*secoes_eleitorais_alteradas[^\s"'<>]*\.csv\.zip/i;

let playwright;
try { playwright = await import('playwright'); } catch { console.error('Instale o Playwright: npm i -D playwright'); process.exit(1); }
const navegador = await playwright.chromium.launch({ channel: 'chrome', headless: process.env.HEADLESS === '1' }).catch(() => playwright.chromium.launch({ headless: process.env.HEADLESS === '1' }));
const pagina = await (await navegador.newContext({ locale: 'pt-BR', viewport: { width: 1400, height: 900 } })).newPage();
const achados = new Set();
const olha = (u) => { const m = PADRAO.exec(u || ''); if (m) achados.add(m[0]); };
pagina.on('request', (r) => olha(r.url()));
pagina.on('response', (r) => olha(r.url()));
pagina.on('download', (d) => olha(d.url()));

try {
  const resp = await pagina.goto(PAINEL, { waitUntil: 'networkidle', timeout: 90000 });
  if (resp && resp.status() === 403) { console.error('Acesso bloqueado pelo TSE (403). Rode em uma rede comum.'); await navegador.close(); process.exit(3); }
  await pagina.waitForTimeout(2000);
  olha(await pagina.content());
  // links e botões que costumam levar ao arquivo
  for (const href of await pagina.$$eval('a[href]', (as) => as.map((a) => a.href))) olha(href);
  if (!achados.size) {
    for (const rotulo of [/csv/i, /baixar/i, /download/i, /exportar/i]) {
      for (const el of await pagina.getByRole('button', { name: rotulo }).all().catch(() => [])) { await el.click({ timeout: 5000 }).catch(() => {}); await pagina.waitForTimeout(1500); }
      for (const el of await pagina.getByRole('link', { name: rotulo }).all().catch(() => [])) { olha(await el.getAttribute('href')); await el.click({ timeout: 5000 }).catch(() => {}); await pagina.waitForTimeout(1500); }
      if (achados.size) break;
    }
  }
  const texto = await pagina.innerText('body').catch(() => '');
  const pega = (rot) => (new RegExp(rot + '\\s*:?\\s*(\\d{2}\\.\\d{2}\\.\\d{4}\\s*-\\s*\\d{2}:\\d{2})', 'i').exec(texto) || [])[1] || null;
  const urls = [...achados];
  await navegador.close();
  if (!urls.length) { console.error('Não encontrei o link do .csv.zip no painel (o layout mudou?).'); process.exit(2); }
  // se houver mais de um, vale o de data mais recente na pasta (…/AAAAMMDD_HHMMSS/…)
  urls.sort((a, b) => ((/\/(\d{8}_\d{6})\//.exec(b) || [])[1] || '').localeCompare((/\/(\d{8}_\d{6})\//.exec(a) || [])[1] || ''));
  console.log(JSON.stringify({ url: urls[0], ultimaAtualizacao: pega('Última atualização'), proximaAtualizacao: pega('Próxima atualização') }));
} catch (e) {
  console.error('Falha ao abrir o painel:', e.message.slice(0, 200));
  await navegador.close().catch(() => {}); process.exit(3);
}
