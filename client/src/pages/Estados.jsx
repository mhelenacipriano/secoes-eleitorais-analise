import { useApi } from '../api.js';
import { nInt, nPts } from '../format.js';
import { H } from '../hints.js';
import { Halteres } from '../components/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { Baixar, BaixarGrafico, Card, Carregando, Recolhivel } from '../components/ui.jsx';
import { descreveFiltros } from '../exportar.js';

const CSV_ESTADOS = [{ key: 'uf', label: 'UF' }, ...[1, 2, 3, 4].flatMap((k) => [{ key: 'el' + k, label: `Eleitores lista ${k}` }, { key: (e) => (e['m' + k] == null ? '' : e['m' + k].toFixed(2)), label: `Margem lista ${k} (pts)` }])];

export default function Estados({ filtros }) {
  const p = { uf: filtros.uf, municipio: filtros.municipio, lider: filtros.lider };
  const st = useApi('estados', p);
  if (!st.data) return <Carregando state={st} />;
  return (
    <div className="stack">
      <Card titulo="Margem por estado" acoes={<BaixarGrafico titulo="Margem por estado: 18/10 · 11h × 20/10 · 13h59" filtros={descreveFiltros(filtros)} nome="margem-por-estado" csv={{ colunas: CSV_ESTADOS, linhas: st.data }} />} nota="Cada linha liga a margem do estado na lista de 18/10 · 11h à margem na lista de 20/10 · 13h59. Estados sem os dois pontos não estavam nas duas listas.">
        <div className="legend"><span><i className="sw neu" />18/10 · 11h</span><span><i className="sw ult" />20/10 · 13h59</span></div>
        <Halteres estados={st.data} />
      </Card>
      <Recolhivel titulo="Tabela de estados" nota={`${nInt(st.data.length)} estados`} aberto acoes={<Baixar path="estados" params={p} />}>
        <DataTable free idLinha={(r) => r.uf} vazio="Nenhum estado corresponde aos filtros." columns={[
          { key: 'uf', label: 'UF', left: true }, { key: 'el1', label: 'Eleitores 18/10 · 11h', format: nInt, hint: H.eleitores }, { key: 'el4', label: 'Eleitores 20/10 · 13h59', format: nInt, hint: H.eleitores },
          { key: 'm1', label: 'Margem 18/10 · 11h', format: nPts, tone: true, hint: H.margem }, { key: 'm2', label: 'Margem 18/10 · 17h', format: nPts, tone: true, hint: H.margem },
          { key: 'm3', label: 'Margem 19/10 · 11h', format: nPts, tone: true, hint: H.margem }, { key: 'm4', label: 'Margem 20/10 · 13h59', format: nPts, tone: true, hint: H.margem },
        ]} rows={st.data} initialSort={{ key: 'el1', dir: -1 }} />
      </Recolhivel>
    </div>
  );
}
