// Acesso mínimo ao Redis (Upstash) pela API REST, sem dependências. Os arquivos que começam com "_" não viram rota na Vercel.
// Variáveis aceitas: UPSTASH_REDIS_REST_URL/TOKEN ou KV_REST_API_URL/TOKEN (criadas ao conectar o banco ao projeto).
const URL_REDIS = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN_REDIS = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const SITE = 'analise'; // prefixo das chaves: cada site tem os seus contadores
export const configurado = Boolean(URL_REDIS && TOKEN_REDIS);
export const janelaOnlineMs = 75_000; // quem não deu sinal nesse intervalo deixa de contar como "online"

export async function pipeline(comandos) {
  const r = await fetch(`${URL_REDIS}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN_REDIS}`, 'Content-Type': 'application/json' }, body: JSON.stringify(comandos) });
  if (!r.ok) throw new Error(`Redis respondeu ${r.status}`);
  return (await r.json()).map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}

/** Data (AAAA-MM-DD) no fuso de Brasília. */
export const diaSP = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
