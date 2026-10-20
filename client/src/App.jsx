import { useEffect, useState } from 'react';
import { useApi } from './api.js';
import Filters from './components/Filters.jsx';
import Visao from './pages/Visao.jsx';
import Mudancas from './pages/Mudancas.jsx';
import Estados from './pages/Estados.jsx';
import Municipios from './pages/Municipios.jsx';
import Secoes from './pages/Secoes.jsx';
import Listas from './pages/Listas.jsx';

const PAGINAS = [
  ['visao', 'Visão geral'], ['mudancas', 'Mudanças entre listas'], ['estados', 'Estados'],
  ['municipios', 'Municípios'], ['secoes', 'Seções'], ['listas', 'Listas e relatórios'],
];
const pegaPagina = () => { const h = location.hash.slice(1); return PAGINAS.some(([id]) => id === h) ? h : 'visao'; };

export default function App() {
  const [pagina, setPagina] = useState(pegaPagina);
  const [filtros, setFiltros] = useState({ uf: '', lista: '', vantagem: '' });
  const meta = useApi('meta');
  useEffect(() => {
    const on = () => setPagina(pegaPagina());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const ir = (id) => { location.hash = id; window.scrollTo({ top: 0 }); };

  return (
    <div className="app">
      <header className="topbar">
        <span className="eyebrow">Eleições 2026 · Presidente · 2º turno em 25/10</span>
        <h1>Seções eleitorais alteradas</h1>
      </header>
      <nav className="nav" aria-label="Seções do site">
        {PAGINAS.map(([id, nome]) => <button key={id} aria-current={pagina === id ? 'page' : undefined} onClick={() => ir(id)}>{nome}</button>)}
      </nav>
      {!meta.data ? <div className="spinner">Carregando…</div> : (
        <>
          {pagina !== 'listas' && <Filters meta={meta.data} filtros={filtros} setFiltros={setFiltros} pagina={pagina} />}
          {pagina === 'visao' && <Visao filtros={filtros} />}
          {pagina === 'mudancas' && <Mudancas filtros={filtros} />}
          {pagina === 'estados' && <Estados filtros={filtros} />}
          {pagina === 'municipios' && <Municipios filtros={filtros} />}
          {pagina === 'secoes' && <Secoes filtros={filtros} />}
          {pagina === 'listas' && <Listas meta={meta.data} />}
        </>
      )}
    </div>
  );
}
