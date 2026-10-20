import { useMemo } from 'react';
import { useParam } from '../router.js';
import { useApi } from '../api.js';
import { nInt, nPct, nPts } from '../format.js';
import { H } from '../hints.js';
import DataTable from '../components/DataTable.jsx';
import { Baixar, Card, Carregando } from '../components/ui.jsx';

export default function Municipios({ filtros }) {
  const [q, setQ] = useParam('q');
  const p = { uf: filtros.uf, municipio: filtros.municipio, lista: filtros.lista, transicao: filtros.transicao, status: filtros.status, lider: filtros.lider };
  const st = useApi('municipios', p);
  const rows = useMemo(() => (st.data || []).filter((r) => !q || r.municipio.toLowerCase().includes(q.toLowerCase())), [st.data, q]);
  if (!st.data) return <Carregando state={st} />;
  return (
    <Card titulo="Municípios" nota="Eleitores afetados e votos do 1º turno em cada município. Toque no título de uma coluna para ordenar." acoes={<Baixar path="municipios" params={p} />}>
      <div className="tools"><input className="search" type="search" placeholder="Buscar município" aria-label="Buscar município" value={q} onChange={(e) => setQ(e.target.value)} /><span className="note">{nInt(rows.length)} municípios</span></div>
      <DataTable pageSize={50} vazio="Nenhum município corresponde aos filtros ou à busca." initialSort={{ key: 'eleitores', dir: -1 }} columns={[
        { key: 'municipio', label: 'Município', left: true }, { key: 'secoes', label: 'Seções', format: nInt }, { key: 'eleitores', label: 'Eleitores', format: nInt, hint: H.eleitores },
        { key: 'lulaPct', label: 'Lula', format: nPct, hint: H.pct }, { key: 'flavioPct', label: 'Flávio', format: nPct, hint: H.pct }, { key: 'margem', label: 'Margem', format: nPts, tone: true, hint: H.margem }, { key: 'listas', label: 'Aparece em', left: true, wrap: true },
      ]} rows={rows} />
    </Card>
  );
}
