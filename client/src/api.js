import { useEffect, useState } from 'react';

export function qs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? '?' + s : '';
}

export function useApi(path, params = {}, { pular = false } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const key = path + qs(params);
  useEffect(() => {
    if (pular) { setState({ data: null, loading: false, error: null }); return undefined; }
    let vivo = true;
    setState((s) => ({ ...s, loading: true }));
    fetch('/api/' + key.replace(/^\//, ''))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Erro ' + r.status))))
      .then((data) => vivo && setState({ data, loading: false, error: null }))
      .catch((error) => vivo && setState({ data: null, loading: false, error }));
    return () => { vivo = false; };
  }, [key, pular]);
  return state;
}
export const csvUrl = (path, params) => '/api/' + path + qs({ ...params, format: 'csv' });
