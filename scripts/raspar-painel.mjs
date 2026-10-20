// Lê a lista de seções alteradas direto da tabela do painel do SIG/TSE (a mesma abordagem do projeto gusehr/tse-mudanca-secao),
// grava um CSV no formato do arquivo oficial e informa quando o TSE diz que atualizou.
//
// O painel não tem link de download na página (só a tabela, 20 linhas por página, e o texto "Última atualização: ..."), por isso a
// tabela é lida página por página e o total é conferido com o "linha(s) X - Y de N" que o próprio site mostra.
//
// ATENÇÃO: o painel bloqueia data centers (403) e costuma exigir um navegador de verdade com janela. Rode no seu computador.
// Requisitos: npm i -D playwright  (e o Google Chrome instalado).
//
// Duas formas de obter a lista (nesta ordem; use --so-tabela ou --so-oficial para escolher):
//  1) Oficial: segue o caminho do botão "Gerar arquivos" (página "Requisição de arquivos" → CSV → "Gerar" → página "Geração de arquivos",
//     que consulta o servidor até o arquivo ficar pronto) e devolve o link do .csv.zip no CDN. É o mesmo arquivo das listas anteriores.
//  2) Tabela: lê a tabela do painel página por página (reserva, se o passo 1 falhar).
//
// Uso: node scripts/raspar-painel.mjs [--saida .raspagem.csv] [--ultima 2026-10-20T15:27:55-03:00] [--forcar] [--so-tabela|--so-oficial]
//   --ultima   quando foi publicada a lista que já temos: se o painel disser a mesma data/hora, não raspa (sem mudança).
//   --forcar   raspa mesmo assim.
// Imprime UMA linha de JSON: { semMudanca, publicadaEm, ultimaAtualizacao, proximaAtualizacao, total, url | csv }
// Variáveis: HEADLESS=1 (sem janela; costuma ser bloqueado), PAINEL_URL (outro endereço).
// Códigos de saída: 0 ok · 2 layout inesperado/contagem não confere · 3 acesso bloqueado ou falha ao abrir.
import fs from 'node:fs';

const PAINEL = process.env.PAINEL_URL || 'https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-eleitorado/se%C3%A7%C3%B5es-alteradas';
const args = process.argv.slice(2);
const opc = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const saida = opc('--saida') || '.raspagem.csv', ultima = opc('--ultima'), forcar = args.includes('--forcar');
const soTabela = args.includes('--so-tabela'), soOficial = args.includes('--so-oficial');
const CDN = process.env.CDN_FILTRO || 'cdn.tse.jus.br';   // trecho do endereço do arquivo gerado
const TABELA = 'table.t-Report-report', TEXTO_PAG = '.t-Report-paginationText', PROXIMO = 'a.t-Report-paginationLink--next';
const limpa = (s) => String(s || '').replace(/\s+/g, ' ').trim();

let playwright;
try { playwright = await import('playwright'); } catch { console.error('Instale o Playwright: npm i -D playwright'); process.exit(1); }
const abre = () => playwright.chromium.launch({ channel: 'chrome', headless: process.env.HEADLESS === '1' }).catch(() => playwright.chromium.launch({ headless: process.env.HEADLESS === '1' }));
const navegador = await abre();
const fim = async (codigo, msg) => { if (msg) console.error(msg); await navegador.close().catch(() => {}); process.exit(codigo); };

try {
  const pagina = await (await navegador.newContext({ locale: 'pt-BR', viewport: { width: 1400, height: 900 } })).newPage();
  const resp = await pagina.goto(PAINEL, { waitUntil: 'networkidle', timeout: 90000 });
  if (resp && resp.status() === 403) await fim(3, 'Acesso bloqueado pelo TSE (403). Rode em uma rede comum, com HEADLESS desligado.');
  await pagina.waitForSelector(TABELA, { timeout: 60000 }).catch(() => fim(2, 'Não encontrei a tabela de seções alteradas (o layout do painel mudou?).'));

  // "Última atualização: 20.10.2026 - 15:27 \ Próxima atualização: 20.10.2026 - 20:25 \ Frequência de atualização: às 06:25, ..."
  const texto = limpa(await pagina.locator('.t-atualizado-em').first().innerText().catch(() => ''));
  const pega = (rot) => (new RegExp(rot + '\\s*:?\\s*(\\d{2})\\.(\\d{2})\\.(\\d{4})\\s*-\\s*(\\d{2}):(\\d{2})', 'i').exec(texto) || []).slice(1);
  const iso = (a) => (a.length ? `${a[2]}-${a[1]}-${a[0]}T${a[3]}:${a[4]}:00-03:00` : null);
  const publicadaEm = iso(pega('Última atualização')), proxima = iso(pega('Próxima atualização'));
  if (!publicadaEm) await fim(2, `Não consegui ler "Última atualização" (texto lido: "${texto}").`);

  const minuto = (s) => new Date(s).toISOString().slice(0, 16);
  const rangeTxt = async () => limpa(await pagina.locator(TEXTO_PAG).first().innerText());
  const totalDe = (t) => { const m = /(\d+)\s*-\s*(\d+)\s*de\s*(\d+)/.exec(t.replace(/\./g, '')); return m ? Number(m[3]) : null; };
  const total = totalDe(await rangeTxt());

  if (!forcar && ultima && minuto(ultima) === minuto(publicadaEm)) {
    console.log(JSON.stringify({ semMudanca: true, publicadaEm, ultimaAtualizacao: publicadaEm, proximaAtualizacao: proxima, total }));
    await fim(0);
  }

  // --- 1) arquivo oficial pelo botão "Gerar arquivos" ---
  async function viaGerarArquivos() {
    const links = new Set();
    const olha = (u) => { if (u && u.includes(CDN) && /\.zip(\?|$)/i.test(u)) links.add(u); };
    pagina.on('request', (r) => olha(r.url())); pagina.on('response', (r) => olha(r.url())); pagina.on('download', (d) => olha(d.url()));
    await pagina.getByRole('button', { name: /gerar arquivos/i }).first().click({ timeout: 15000 });
    await pagina.waitForURL(/requisicao-arquivos/i, { timeout: 45000 });                      // "Requisição de arquivos"
    await pagina.waitForLoadState('networkidle').catch(() => {});
    const csvBr = pagina.locator('input[value="CSV_BR"]').first();                            // tipo de arquivo usado pelo painel
    if (await csvBr.count()) await csvBr.check().catch(() => {});
    await pagina.getByRole('button', { name: /^\s*gerar\b/i }).first().click({ timeout: 15000 });
    await pagina.waitForURL(/geracao-arquivos/i, { timeout: 45000 });                          // "Geração de arquivos" (consulta o servidor até ficar pronto)
    const limite = Date.now() + Number(process.env.GERAR_TIMEOUT_S || 180) * 1000;   // espera o arquivo ficar pronto
    while (Date.now() < limite && !links.size) {
      for (const h of await pagina.$$eval('a[href]', (as) => as.map((a) => a.href))) olha(h);
      if (!links.size) await pagina.waitForTimeout(2000);
    }
    return [...links].sort((a, b) => ((/\/(\d{8}_\d{6})\//.exec(b) || [])[1] || '').localeCompare((/\/(\d{8}_\d{6})\//.exec(a) || [])[1] || ''))[0] || null;
  }
  if (!soTabela) {
    try {
      const url = await viaGerarArquivos();
      if (url) { console.log(JSON.stringify({ semMudanca: false, publicadaEm, ultimaAtualizacao: publicadaEm, proximaAtualizacao: proxima, total, url })); await fim(0); }
      console.error('Não apareceu o link do arquivo gerado.');
    } catch (e) { console.error(`Caminho "Gerar arquivos" falhou: ${String(e.message).split('\n')[0].slice(0, 160)}`); }
    if (soOficial) await fim(2, 'Sem o arquivo oficial (--so-oficial).');
    console.error('Usando a leitura da tabela como reserva...');
    await pagina.goto(PAINEL, { waitUntil: 'networkidle', timeout: 90000 });
    await pagina.waitForSelector(TABELA, { timeout: 60000 });
  }

  const cab = (await pagina.$$eval(`${TABELA} thead th`, (t) => t.map((x) => x.innerText))).map(limpa);
  const idx = (re) => cab.findIndex((c) => re.test(c));
  const col = { ano: idx(/^Elei/i), uf: idx(/^UF$/i), mun: idx(/^Munic/i), zona: idx(/^Zona/i), ini: idx(/primeiro turno/i), fin: idx(/segundo turno/i), secao: idx(/^Se[cç]/i), el: idx(/^Eleitorado/i) };
  if (Object.values(col).some((i) => i < 0)) await fim(2, `Colunas inesperadas na tabela: ${cab.join(' | ')}`);

  const linhas = [];
  for (let n = 1; n < 200; n++) {
    const rows = await pagina.$$eval(`${TABELA} tbody tr`, (trs) => trs.filter((tr) => tr.querySelector('td')).map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText)));
    for (const r of rows) linhas.push(r.map(limpa));
    const prox = pagina.locator(PROXIMO).first();
    if ((await prox.count()) === 0 || !(await prox.isVisible())) break;
    const antes = await rangeTxt();
    await prox.click();
    await pagina.waitForFunction(([sel, velho]) => { const e = document.querySelector(sel); return e && e.innerText.replace(/\s+/g, ' ').trim() !== velho; }, [TEXTO_PAG, antes], { timeout: 60000 });
    await pagina.waitForTimeout(400 + Math.random() * 600);   // gentileza com o servidor
  }
  if (total != null && linhas.length !== total) await fim(2, `Contagem não confere: li ${linhas.length} linhas e o painel informa ${total}.`);
  if (linhas.length < 100) await fim(2, `Só ${linhas.length} linhas: leitura incompleta.`);

  // CSV no formato do arquivo oficial (ISO-8859-1, separado por ";")
  const esc = (v) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ['aa_eleicao;nm_pais;sg_uf;nm_municipio;nr_zona;nm_local_votacao_inicial;nr_secao;nm_local_votacao_final;qt_eleitores',
    ...linhas.map((r) => [r[col.ano], 'Brasil', r[col.uf], r[col.mun], r[col.zona], r[col.ini], r[col.secao], r[col.fin], r[col.el].replace(/\./g, '')].map(esc).join(';'))].join('\r\n') + '\r\n';
  fs.writeFileSync(saida, Buffer.from(csv, 'latin1'));
  console.log(JSON.stringify({ semMudanca: false, publicadaEm, ultimaAtualizacao: publicadaEm, proximaAtualizacao: proxima, total: linhas.length, csv: saida }));
  await fim(0);
} catch (e) {
  await fim(3, `Falha ao ler o painel: ${String(e.message).slice(0, 200)}`);
}
