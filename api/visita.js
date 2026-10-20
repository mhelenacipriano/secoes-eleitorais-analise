// Registra uma visita ("entrada") ou um sinal de que a aba segue aberta ("batida"). Anônimo: só guarda contagens
// e um código aleatório de aba, por no máximo ~75 s, sem cookies, sem IP e sem dados pessoais.
import { SITE, configurado, diaSP, janelaOnlineMs, pipeline } from './_redis.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!configurado) return res.status(204).end();
  let corpo = req.body;
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch { corpo = {}; } }
  const { id, tipo } = corpo || {};
  if (typeof id !== 'string' || !/^[a-z0-9]{8,40}$/.test(id)) return res.status(400).end();

  const agora = Date.now(), online = `${SITE}:online`;
  const comandos = [['ZADD', online, agora, id], ['ZREMRANGEBYSCORE', online, '-inf', agora - janelaOnlineMs], ['EXPIRE', online, 3600]];
  if (tipo === 'entrada') {
    const dia = `${SITE}:dia:${diaSP()}`;
    comandos.push(['INCR', `${SITE}:total`], ['INCR', dia], ['EXPIRE', dia, 60 * 60 * 24 * 45]);
  }
  try { await pipeline(comandos); } catch { /* contar nunca deve quebrar o site */ }
  return res.status(204).end();
}
