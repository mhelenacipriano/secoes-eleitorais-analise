export default function Filters({ meta, filtros, setFiltros, pagina }) {
  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value });
  const mostraLista = pagina === 'municipios' || pagina === 'secoes';
  const mostraVant = pagina === 'secoes';
  const ativo = filtros.uf || filtros.lista || filtros.vantagem;
  return (
    <section className="filters" aria-label="Filtros">
      <label>Estado
        <select value={filtros.uf} onChange={set('uf')}>
          <option value="">Todos os estados</option>
          {meta.ufs.map((u) => <option key={u} value={u}>{u === 'ZZ' ? 'ZZ (exterior)' : u}</option>)}
        </select>
      </label>
      {mostraLista && (
        <label>Lista
          <select value={filtros.lista} onChange={set('lista')}>
            <option value="">Todas as listas</option>
            {meta.listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
      )}
      {mostraVant && (
        <label>Seções com vantagem de
          <select value={filtros.vantagem} onChange={set('vantagem')}>
            <option value="">Qualquer candidato</option>
            <option value="L">Lula na frente</option>
            <option value="F">Flávio na frente</option>
          </select>
        </label>
      )}
      <button className="btn" onClick={() => setFiltros({ uf: '', lista: '', vantagem: '' })} disabled={!ativo}>Limpar filtros</button>
      <span className="hint">
        {ativo ? 'Filtros ativos. ' : ''}
        {mostraLista ? 'O estado, a lista e a vantagem valem para a tabela abaixo.' : 'O estado vale para toda esta página. Lista e vantagem aparecem em Municípios e Seções.'}
      </span>
    </section>
  );
}
