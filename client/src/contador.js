import { useEffect } from 'react';

/**
 * Contagem anônima de acessos. Cada carregamento da página gera um código aleatório que só existe na memória da aba:
 * nada é gravado no navegador (sem cookies nem localStorage). Não conta em desenvolvimento nem na página de estatísticas.
 */
export function useContador(ativo = true) {
  useEffect(() => {
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    if (!ativo || !import.meta.env.PROD || local) return undefined;
    const id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    const envia = (tipo) => fetch('/api/visita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, tipo }), keepalive: true }).catch(() => {});
    envia('entrada');
    const batida = () => { if (document.visibilityState === 'visible') envia('batida'); };
    const t = setInterval(batida, 30_000);
    document.addEventListener('visibilitychange', batida);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', batida); };
  }, [ativo]);
}
