import Filters from '../components/Filters.jsx';
import Estados from './Estados.jsx';
import Municipios from './Municipios.jsx';
import Secoes from './Secoes.jsx';
import Mudancas from './Mudancas.jsx';
import CompararMunicipios from './CompararMunicipios.jsx';
import Controle from './Controle.jsx';

export const SUBVIEWS = [
  ['estados', 'Estados', {}], ['municipios', 'Municípios', { lista: 1, transicao: 1, status: 1 }],
  ['secoes', 'Seções eleitorais', { lista: 1, transicao: 1, status: 1 }], ['mudancas', 'Adicionadas, removidas e mantidas', { transicao: 1, status: 1 }], ['comparar', 'Comparar municípios', {}], ['controle', 'Grupo de controle', {}],
];

export default function Explorar({ sub, meta, filtros, setFiltros, ir }) {
  const atual = SUBVIEWS.find(([id]) => id === sub) || SUBVIEWS[0];
  const [id, , usa] = atual;
  return (
    <div className="stack">
      <h1 className="page-title">Explorar dados</h1>
      <nav className="subnav" aria-label="Visões de dados">
        {SUBVIEWS.map(([k, nome]) => <button key={k} aria-current={k === id ? 'page' : undefined} onClick={() => ir('explorar/' + k, filtros, { topo: false })}>{nome}</button>)}
      </nav>
      {id !== 'comparar' && id !== 'controle' && <Filters meta={meta} filtros={filtros} setFiltros={setFiltros} usa={usa} />}
      {id === 'estados' && <Estados filtros={filtros} />}
      {id === 'municipios' && <Municipios filtros={filtros} />}
      {id === 'secoes' && <Secoes filtros={filtros} />}
      {id === 'mudancas' && <Mudancas filtros={filtros} />}
      {id === 'comparar' && <CompararMunicipios />}
      {id === 'controle' && <Controle />}
    </div>
  );
}
