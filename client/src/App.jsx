import { useState } from 'react';
import { useApi } from './api.js';
import { useRota } from './router.js';
import Home from './pages/Home.jsx';
import Evolucao from './pages/Evolucao.jsx';
import Impacto from './pages/Impacto.jsx';
import Explorar from './pages/Explorar.jsx';
import Metodologia from './pages/Metodologia.jsx';
import Filters from './components/Filters.jsx';
import { Carregando } from './components/ui.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import FonteAviso from './components/FonteAviso.jsx';
import ToTop from './components/ToTop.jsx';
import { CONSULTA_URL } from './config.js';

const NAV = [['', 'Visão geral'], ['evolucao', 'Evolução das listas'], ['impacto', 'Impacto potencial'], ['explorar', 'Explorar dados'], ['metodologia', 'Metodologia e fontes']];

export default function App() {
  const { caminho, filtros, ir } = useRota();
  const [menu, setMenu] = useState(false);
  const meta = useApi('meta');
  const [raiz, sub] = caminho.split('/');
  const pagina = NAV.some(([id]) => id === raiz) ? raiz : '';
  const setFiltros = (f) => ir(caminho, f, { topo: false });
  const vai = (id) => { setMenu(false); ir(id, id === 'evolucao' || id === 'impacto' ? filtros : {}); };

  return (
    <div className="app">
      <a className="skip" href="#conteudo">Ir para o conteúdo</a>
      <div className="topbar">
        <button className="brand" onClick={() => vai('')}>Análise das seções alteradas · 2026</button>
        <div className="top-actions">
          <ThemeToggle />
          <button className="menu-btn" aria-expanded={menu} aria-controls="nav" onClick={() => setMenu((m) => !m)}>{menu ? 'Fechar' : 'Menu'}</button>
        </div>
        <nav id="nav" className={'nav' + (menu ? ' open' : '')} aria-label="Seções do site">
          {NAV.map(([id, nome]) => <button key={id} aria-current={pagina === id ? 'page' : undefined} onClick={() => vai(id)}>{nome}</button>)}
        </nav>
      </div>
      <main id="conteudo">
        <p className="aviso-obra" role="status"><span className="obra-selo">Em construção</span> Esta página ainda está em construção: o conteúdo, os números e os gráficos podem mudar e conter erros.</p>
        <FonteAviso />
        {!meta.data ? <Carregando state={meta} /> : (
          <div className="pagina-anim" key={pagina || 'home'}>
            {(pagina === 'evolucao' || pagina === 'impacto') && <Filters meta={meta.data} filtros={filtros} setFiltros={setFiltros} usa={{}} />}
            {pagina === '' && <Home ir={ir} />}
            {pagina === 'evolucao' && <Evolucao filtros={filtros} />}
            {pagina === 'impacto' && <Impacto filtros={filtros} />}
            {pagina === 'explorar' && <Explorar sub={sub} meta={meta.data} filtros={filtros} setFiltros={setFiltros} ir={ir} />}
            {pagina === 'metodologia' && <Metodologia meta={meta.data} />}
          </div>
        )}
      </main>
      <footer className="foot">
        {CONSULTA_URL && <a className="btn" href={CONSULTA_URL}>Consulte a sua seção →</a>}
        <p>Os dados mostram o perfil eleitoral das seções, não comprovam mudanças no resultado da eleição. Fonte: listas de seções alteradas e resultados do 1º turno de 2026 (CSV do projeto). Este site não sugere fraude nem interferência.</p>
        <p className="note">Para saber o local de votação atual, confirme no aplicativo e-Título ou no Autoatendimento Eleitoral do TSE: as listas analisadas aqui podem estar incompletas ou desatualizadas.</p>
        <p className="legal"><strong>Sobre os dados e este site.</strong> Os dados exibidos são provenientes de listas e resultados divulgados pela Justiça Eleitoral (TSE e TREs); as comparações, os cálculos e a forma de apresentação são de responsabilidade deste projeto. Este é um site independente e sem fins lucrativos, sem anúncios, e não é um canal oficial nem tem vínculo com a Justiça Eleitoral. As informações podem conter erros ou ficar desatualizadas: para confirmar o seu local de votação, use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE.</p>
      </footer>
      <ToTop />
    </div>
  );
}
