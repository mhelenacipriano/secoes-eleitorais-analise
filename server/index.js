import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { meta, resumo, mudancas, estados, municipios, secoes, historia } from './data.js';

const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));
// Filtros globais: estado, município ("UF:NOME"), lista, transição ("1-2"), líder no 1º turno (L/F) e situação.
const oneOf = (v, ok) => (ok.includes(String(v)) ? String(v) : '');
const q = (req) => ({
  uf: String(req.query.uf || ''), municipio: String(req.query.municipio || ''), lista: Number(req.query.lista) || 0,
  transicao: oneOf(req.query.transicao, ['1-2', '2-3', '3-4', '1-4']), status: oneOf(req.query.status, ['removidas', 'mantidas', 'adicionadas']),
  lider: oneOf(req.query.lider || req.query.vantagem, ['L', 'F']), q: String(req.query.q || ''),
});

function csv(res, nome, linhas) {
  if (!linhas.length) return res.status(204).end();
  const cols = Object.keys(linhas[0]);
  const esc = (v) => (v == null ? '' : /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const body = [cols.join(';'), ...linhas.map((l) => cols.map((c) => esc(l[c])).join(';'))].join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${nome}.csv"` }).send('﻿' + body);
}
const sendOrCsv = (nome, fn) => (req, res) => {
  const data = fn(q(req));
  return req.query.format === 'csv' ? csv(res, nome, Array.isArray(data) ? data : data.detalhe) : res.json(data);
};

app.get('/api/meta', (_req, res) => res.json(meta()));
app.get('/api/resumo', sendOrCsv('resumo-por-lista', resumo));
app.get('/api/mudancas', sendOrCsv('mudancas-entre-listas', mudancas));
app.get('/api/estados', sendOrCsv('estados', estados));
app.get('/api/municipios', sendOrCsv('municipios', municipios));
app.get('/api/secoes', sendOrCsv('secoes', secoes));
app.get('/api/historia', (req, res) => res.json(historia(q(req))));

const dist = path.join(dir, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
// Na Vercel o app roda como função (api/index.js) e não abre porta.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Site no ar em http://localhost:${port}`));
}

export default app;
