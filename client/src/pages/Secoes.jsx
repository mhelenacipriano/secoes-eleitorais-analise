import { useState } from 'react';
import { useApi } from '../api.js';
import { nInt, nPct, nPts } from '../format.js';
import DataTable from '../components/DataTable.jsx';
import { Card, Carregando, Baixar } from './Common.jsx';

export default function Secoes({ filtros }) {
  const [q, setQ] = useState('');
  const params = { uf: filtros.uf, lista: filtros.lista, vantagem: filtros.vantagem, q };
  const st = useApi('secoes', params);
  return (
    <Card titulo="Seção por seção" nota="Local de origem, local de destino e votos do 1º turno de cada seção alterada." acoes={<Baixar path="secoes" params={params} />}>
      <div className="tools"><input className="search" type="search" placeholder="Buscar município, estado ou local" aria-label="Buscar seção" value={q} onChange={(e) => setQ(e.target.value)} />{st.data && <span className="note">{nInt(st.data.length)} seções</span>}</div>
      {st.data ? (
        <DataTable pageSize={50} initialSort={{ key: 'eleitores', dir: -1 }} columns={[
          { key: 'secao', label: 'Seção', left: true }, { key: 'localInicial', label: 'Local inicial', left: true, wrap: true }, { key: 'localFinal', label: 'Local final', left: true, wrap: true },
          { key: 'listas', label: 'Aparece em', left: true, wrap: true }, { key: 'eleitores', label: 'Eleitores', format: nInt }, { key: 'lulaPct', label: 'Lula', format: nPct },
          { key: 'flavioPct', label: 'Flávio', format: nPct }, { key: 'margem', label: 'Margem', format: nPts, tone: true },
        ]} rows={st.data} />
      ) : <Carregando state={st} />}
    </Card>
  );
}
