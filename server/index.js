import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { meta, resumo, mudancas, estados, municipios, secoes } from './data.js';

const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));
const q = (req) => ({ uf: String(req.query.uf || ''), lista: Number(req.query.lista) || 0, vantagem: String(req.query.vantagem || ''), q: String(req.query.q || '') });

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
app.get('/api/resumo', sendOrCsv('resumo-por-lista', ({ uf }) => resumo(uf)));
app.get('/api/mudancas', sendOrCsv('mudancas-entre-listas', ({ uf }) => mudancas(uf)));
app.get('/api/estados', sendOrCsv('estados', () => estados()));
app.get('/api/municipios', sendOrCsv('municipios', municipios));
app.get('/api/secoes', sendOrCsv('secoes', secoes));

const dist = path.join(dir, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Site no ar em http://localhost:${port}`));
