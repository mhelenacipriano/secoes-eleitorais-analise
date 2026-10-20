import { useState } from 'react';
import { FILTROS_VAZIOS } from '../router.js';

const ROT_STATUS = { removidas: 'Removidas', mantidas: 'Mantidas', adicionadas: 'Adicionadas' };

/** Filtros globais. `usa` diz quais campos fazem sentido na visão atual. */
export default function Filters({ meta, filtros, setFiltros, usa = {} }) {
  const [copiado, setCopiado] = useState(false);
  const set = (k) => (e) => {
    const v = e.target.value, novo = { ...filtros, [k]: v };
    if (k === 'uf') novo.municipio = '';
    if (k === 'transicao' && !v) novo.status = '';
    setFiltros(novo);
  };
  const ativos = Object.keys(FILTROS_VAZIOS).filter((k) => filtros[k] && (k === 'uf' || k === 'municipio' || k === 'lider' || usa[k])).length;
  const municipios = filtros.uf ? meta.municipios[filtros.uf] || [] : [];
  const copiar = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { window.prompt('Copie o link:', location.href); }
  };
  return (
    <details className="filters" open={ativos > 0 || undefined}>
      <summary>Filtros{ativos > 0 && <span className="count">{ativos} ativo{ativos > 1 ? 's' : ''}</span>}</summary>
      <div className="filters-grid">
        <label>Estado
          <select value={filtros.uf} onChange={set('uf')}>
            <option value="">Todos os estados</option>
            {meta.ufs.map((u) => <option key={u} value={u}>{u === 'ZZ' ? 'ZZ (exterior)' : u}</option>)}
          </select>
        </label>
        <label>Município
          <select value={filtros.municipio} onChange={set('municipio')} disabled={!filtros.uf}>
            <option value="">{filtros.uf ? 'Todos os municípios' : 'Escolha um estado primeiro'}</option>
            {municipios.map((m) => <option key={m} value={`${filtros.uf}:${m}`}>{m}</option>)}
          </select>
        </label>
        <label>Candidato na frente no 1º turno
          <select value={filtros.lider} onChange={set('lider')}>
            <option value="">Qualquer candidato</option>
            <option value="L">Lula na frente</option>
            <option value="F">Flávio Bolsonaro na frente</option>
          </select>
        </label>
        {usa.lista && (
          <label>Versão da lista
            <select value={filtros.lista} onChange={set('lista')}>
              <option value="">Todas as listas</option>
              {meta.listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
        )}
        {usa.transicao && (
          <label>Transição entre versões
            <select value={filtros.transicao} onChange={set('transicao')}>
              <option value="">Qualquer</option>
              {meta.transicoes.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </label>
        )}
        {usa.status && (
          <label>Situação na transição
            <select value={filtros.status} onChange={set('status')} disabled={!filtros.transicao}>
              <option value="">{filtros.transicao ? 'Retiradas, mantidas e adicionadas' : 'Escolha uma transição primeiro'}</option>
              {Object.entries(ROT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="filters-actions">
        <button className="btn" onClick={() => setFiltros({ ...FILTROS_VAZIOS })} disabled={!Object.values(filtros).some(Boolean)}>Limpar filtros</button>
        <button className="btn" onClick={copiar}>{copiado ? 'Link copiado ✓' : 'Copiar link desta visão'}</button>
        <span className="hint">Estado, município e candidato na frente valem para toda a análise; os demais, só nas tabelas.</span>
      </div>
    </details>
  );
}
