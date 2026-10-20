import { useApi } from '../api.js';
import { nInt, nPts } from '../format.js';
import { Halteres, Legenda, COR } from '../components/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { Card, Carregando, Baixar } from './Common.jsx';

export default function Estados({ filtros }) {
  const st = useApi('estados');
  if (!st.data) return <Carregando state={st} />;
  const rows = filtros.uf ? st.data.filter((e) => e.uf === filtros.uf) : st.data;
  return (
    <div className="stack">
      <p className="lead" style={{ margin: 0 }}>Compare a margem Lula − Flávio de cada estado na primeira lista e na lista de 438 seções. Estados sem pontos completos não estavam nas duas listas.</p>
      <Card titulo="Margem por estado" nota="Cada linha liga a margem do estado na lista de 18/10 · 11h à margem na lista de 438 seções.">
        <Legenda itens={[['var(--neutro)', '18/10 · 11h'], [COR.lula, 'Lista de 438']]} />
        <Halteres estados={rows} />
      </Card>
      <Card titulo="Estados" acoes={<Baixar path="estados" />}>
        <DataTable free columns={[
          { key: 'uf', label: 'UF', left: true }, { key: 'el1', label: 'Eleitores 18/10 · 11h', format: nInt }, { key: 'el4', label: 'Eleitores lista de 438', format: nInt },
          { key: 'm1', label: 'Margem 18/10 · 11h', format: nPts, tone: true }, { key: 'm2', label: 'Margem 18/10 · 17h', format: nPts, tone: true },
          { key: 'm3', label: 'Margem 19/10 · 11h', format: nPts, tone: true }, { key: 'm4', label: 'Margem lista de 438', format: nPts, tone: true },
        ]} rows={rows} initialSort={{ key: 'el1', dir: -1 }} />
      </Card>
    </div>
  );
}
