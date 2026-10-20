import { useCallback, useEffect, useState } from 'react';

// Estado compartilhável: a página fica no hash (#/explorar/secoes), que funciona em qualquer hospedagem, e todo o resto
// (filtros, busca, ordenação, página e seleções) fica na query string (?uf=SP&q=...). Links antigos com a query dentro do
// hash (#/explorar/secoes?uf=SP) continuam funcionando e são migrados na primeira alteração.
export const FILTROS_VAZIOS = { uf: '', municipio: '', lista: '', transicao: '', lider: '', status: '' };
const CHAVES = Object.keys(FILTROS_VAZIOS);
const EVENTO = 'urlmudou';

const partesHash = () => {
  const h = location.hash.replace(/^#\/?/, '');
  const i = h.indexOf('?');
  return { caminho: (i < 0 ? h : h.slice(0, i)).replace(/\/$/, ''), busca: i < 0 ? '' : h.slice(i + 1) };
};

/** Parâmetros atuais: a query de verdade, completada pela query antiga que ainda esteja dentro do hash. */
export function lerQuery() {
  const p = new URLSearchParams(location.search);
  for (const [k, v] of new URLSearchParams(partesHash().busca)) if (!p.has(k)) p.set(k, v);
  return p;
}

const filtrosDe = (p) => { const f = { ...FILTROS_VAZIOS }; for (const k of CHAVES) if (p.get(k)) f[k] = p.get(k); return f; };
const ler = () => ({ caminho: partesHash().caminho, filtros: filtrosDe(lerQuery()) });
const avisa = () => window.dispatchEvent(new Event(EVENTO));
const escreve = (p, caminho, { push = false } = {}) => {
  const qs = p.toString();
  const url = location.pathname + (qs ? '?' + qs : '') + (caminho ? '#/' + caminho : '');
  if (push) history.pushState(null, '', url); else history.replaceState(null, '', url);
  avisa();
};

/** Atualiza só as chaves informadas (valor vazio ou null remove a chave), sem criar entrada no histórico. */
export function gravarParams(obj) {
  const p = lerQuery();
  for (const [k, v] of Object.entries(obj)) { if (v === '' || v == null) p.delete(k); else p.set(k, String(v)); }
  escreve(p, partesHash().caminho);
}

/** Um parâmetro da URL como estado do React: `const [v, setV] = useParam('ev', 'padrao')`. O valor padrão não vai para a URL. */
export function useParam(chave, padrao = '') {
  const [v, setV] = useState(() => lerQuery().get(chave) ?? padrao);
  useEffect(() => {
    const on = () => setV(lerQuery().get(chave) ?? padrao);
    window.addEventListener(EVENTO, on); window.addEventListener('popstate', on); window.addEventListener('hashchange', on);
    return () => { window.removeEventListener(EVENTO, on); window.removeEventListener('popstate', on); window.removeEventListener('hashchange', on); };
  }, [chave, padrao]);
  const set = useCallback((novo) => gravarParams({ [chave]: novo == null || String(novo) === String(padrao) ? '' : novo }), [chave, padrao]);
  return [v, set];
}

/** Versão numérica de useParam (valor inválido volta ao padrão). */
export function useParamNum(chave, padrao) {
  const [v, set] = useParam(chave, String(padrao));
  const n = Number(v);
  return [Number.isFinite(n) ? n : padrao, set];
}

export function montar(caminho, filtros = {}) {
  const p = new URLSearchParams();
  for (const k of CHAVES) if (filtros[k]) p.set(k, filtros[k]);
  const s = p.toString();
  return (s ? '?' + s : '') + '#/' + caminho;
}

export function useRota() {
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const on = () => setRota(ler());
    window.addEventListener('hashchange', on); window.addEventListener('popstate', on); window.addEventListener(EVENTO, on);
    return () => { window.removeEventListener('hashchange', on); window.removeEventListener('popstate', on); window.removeEventListener(EVENTO, on); };
  }, []);
  // ir(página, filtros): navega para outra página levando só os filtros (busca, ordenação e seleções recomeçam); filtros omitidos limpam tudo
  const ir = useCallback((caminho, filtros, { topo = true } = {}) => {
    const p = new URLSearchParams();
    for (const k of CHAVES) if (filtros && filtros[k]) p.set(k, filtros[k]);
    // só trocou os filtros na mesma página: preserva busca, ordenação e seleções (e não empilha o histórico a cada filtro)
    const mesma = !topo && caminho === partesHash().caminho;
    if (mesma) { for (const [k, v] of lerQuery()) if (!CHAVES.includes(k)) p.set(k, v); }
    escreve(p, caminho, { push: !mesma });
    if (topo) window.scrollTo({ top: 0 });
  }, []);
  return { ...rota, ir };
}
