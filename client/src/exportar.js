// Exportações feitas no navegador: o PNG de um gráfico (SVG) e o CSV dos dados que o alimentam. Respeitam os filtros ativos
// porque partem do que já está na tela.

const salvar = (blob, nome) => {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/** Nome de arquivo seguro: sem acentos, minúsculo, com hífens. */
export const nomeArquivo = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dados';

const ROTULO_FILTRO = { uf: 'Estado', municipio: 'Município', lista: 'Lista', transicao: 'Transição', lider: 'Candidato na frente', status: 'Situação' };
const LIDER = { L: 'Lula', F: 'Flávio Bolsonaro' };
/** Texto curto com os filtros ativos (vazio se não houver): vai no PNG e no nome do arquivo. */
export const descreveFiltros = (f = {}) => Object.entries(ROTULO_FILTRO)
  .filter(([k]) => f[k]).map(([k, r]) => `${r}: ${k === 'lider' ? LIDER[f[k]] || f[k] : k === 'municipio' ? String(f[k]).replace(':', ' · ') : f[k]}`).join(' · ');

/** CSV em UTF-8 com BOM e separador ";" (abre direto no Excel em português). colunas: [{ key, label }]. */
export function baixarCsv(nome, colunas, linhas) {
  const esc = (v) => { const t = v == null ? '' : String(v); return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const corpo = [colunas.map((c) => esc(c.label)).join(';'), ...linhas.map((l) => colunas.map((c) => esc(typeof c.key === 'function' ? c.key(l) : l[c.key])).join(';'))];
  salvar(new Blob(['﻿' + corpo.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }), nome.endsWith('.csv') ? nome : nome + '.csv');
}

const PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linejoin', 'stroke-linecap', 'opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'letter-spacing'];
/** Copia o estilo calculado (cores já resolvidas, sem variáveis CSS) para o clone: o SVG vira independente do site. */
function embutirEstilos(origem, copia) {
  const cs = getComputedStyle(origem);
  for (const p of PROPS) copia.style.setProperty(p, cs.getPropertyValue(p));
  for (let i = 0; i < origem.children.length; i++) embutirEstilos(origem.children[i], copia.children[i]);
}

const quebra = (ctx, texto, larg) => { // quebra o texto em linhas que cabem em `larg`
  const linhas = []; let atual = '';
  for (const p of texto.split(' ')) { const t = atual ? atual + ' ' + p : p; if (ctx.measureText(t).width > larg && atual) { linhas.push(atual); atual = p; } else atual = t; }
  if (atual) linhas.push(atual); return linhas;
};

/** Gera um PNG (2×) do SVG com título, filtros ativos e a fonte. O fundo segue o tema atual (claro ou escuro). */
export async function baixarPng(svg, { titulo, filtros = '', nome }) {
  const caixa = svg.getBoundingClientRect(), w = Math.ceil(caixa.width), h = Math.ceil(caixa.height);
  const clone = svg.cloneNode(true);
  embutirEstilos(svg, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', w); clone.setAttribute('height', h);
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  await new Promise((ok, erro) => { img.onload = ok; img.onerror = () => erro(new Error('Não foi possível gerar a imagem.')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); });
  const corpo = getComputedStyle(document.body), fundo = corpo.backgroundColor, fg = corpo.color, fonte = corpo.fontFamily;
  const esc = 2, pad = 20, largTotal = Math.max(w, 360) + pad * 2;
  const medir = document.createElement('canvas').getContext('2d');
  medir.font = `600 16px ${fonte}`; const linhasT = quebra(medir, titulo, largTotal - pad * 2);
  medir.font = `12px ${fonte}`; const linhasF = filtros ? quebra(medir, 'Filtros: ' + filtros, largTotal - pad * 2) : [];
  const altCab = pad + linhasT.length * 22 + linhasF.length * 17 + 8, rodape = 30;
  const c = document.createElement('canvas'); c.width = largTotal * esc; c.height = (altCab + h + rodape) * esc;
  const ctx = c.getContext('2d'); ctx.scale(esc, esc);
  ctx.fillStyle = fundo; ctx.fillRect(0, 0, largTotal, altCab + h + rodape);
  ctx.fillStyle = fg; ctx.textBaseline = 'top'; ctx.font = `600 16px ${fonte}`;
  linhasT.forEach((l, i) => ctx.fillText(l, pad, pad + i * 22));
  ctx.globalAlpha = 0.7; ctx.font = `12px ${fonte}`;
  linhasF.forEach((l, i) => ctx.fillText(l, pad, pad + linhasT.length * 22 + i * 17));
  ctx.globalAlpha = 1; ctx.drawImage(img, pad, altCab, w, h);
  ctx.globalAlpha = 0.6; ctx.font = `11px ${fonte}`;
  ctx.fillText(`Fonte: listas de seções alteradas do TSE e resultados do 1º turno de 2026 · gerado em ${new Date().toLocaleDateString('pt-BR')} · site não oficial`, pad, altCab + h + 10);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  salvar(blob, nome.endsWith('.png') ? nome : nome + '.png');
}
