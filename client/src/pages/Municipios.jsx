import { useMemo, useState } from 'react';
import { useApi } from '../api.js';
import { nInt, nPct, nPts } from '../format.js';
import DataTable from '../components/DataTable.jsx';
import { Card, Carregando, Baixar } from './Common.jsx';

export default function Municipios({ filtros }) {
  const [q, setQ] = useState('');
  const st = useApi('municipios', { uf: filtros.uf, lista: filtros.lista });
  const rows = useMemo(() => (st.data || []).filter((r) => !q || r.municipio.toLowerCase().includes(q.toLowerCase())), [st.data, q]);
  if (!st.data) return <Carregando state={st} />;
  return (
    <Card titulo="Municípios" nota="Eleitores afetados e votos do 1º turno em cada município. Clique no título de uma coluna para ordenar." acoes={<Baixar path="municipios" params={{ uf: filtros.uf, lista: filtros.lista }} />}>
      <div className="tools"><input className="search" type="search" placeholder="Buscar município" aria-label="Buscar município" value={q} onChange={(e) => setQ(e.target.value)} /><span className="note">{nInt(rows.length)} municípios</span></div>
      <DataTable pageSize={50} initialSort={{ key: 'eleitores', dir: -1 }} columns={[
        { key: 'municipio', label: 'Município', left: true }, { key: 'secoes', label: 'Seções', format: nInt }, { key: 'eleitores', label: 'Eleitores', format: nInt },
        { key: 'lulaPct', label: 'Lula', format: nPct }, { key: 'flavioPct', label: 'Flávio', format: nPct }, { key: 'margem', label: 'Margem', format: nPts, tone: true }, { key: 'listas', label: 'Aparece em', left: true, wrap: true },
      ]} rows={rows} />
    </Card>
  );
}
