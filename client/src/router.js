import { useCallback, useEffect, useState } from 'react';

// Rotas por hash (#/explorar/secoes?uf=SP): funcionam em qualquer hospedagem e os links de filtros são compartilháveis.
export const FILTROS_VAZIOS = { uf: '', municipio: '', lista: '', transicao: '', lider: '', status: '' };
const CHAVES = Object.keys(FILTROS_VAZIOS);

function ler() {
  const h = location.hash.replace(/^#\/?/, '');
  const [caminho, busca = ''] = h.split('?');
  const params = new URLSearchParams(busca);
  const filtros = { ...FILTROS_VAZIOS };
  for (const k of CHAVES) if (params.get(k)) filtros[k] = params.get(k);
  return { caminho: caminho.replace(/\/$/, ''), filtros };
}

export function montar(caminho, filtros = {}) {
  const p = new URLSearchParams();
  for (const k of CHAVES) if (filtros[k]) p.set(k, filtros[k]);
  const s = p.toString();
  return '#/' + caminho + (s ? '?' + s : '');
}

export function useRota() {
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const on = () => setRota(ler());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const ir = useCallback((caminho, filtros, { topo = true } = {}) => {
    location.hash = montar(caminho, filtros).slice(1);
    if (topo) window.scrollTo({ top: 0 });
  }, []);
  return { ...rota, ir };
}
