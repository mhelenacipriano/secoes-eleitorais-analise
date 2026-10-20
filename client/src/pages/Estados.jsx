import { useApi } from '../api.js';
import { nInt, nPts } from '../format.js';
import { H } from '../hints.js';
import { Halteres } from '../components/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { Baixar, BaixarGrafico, Card, Carregando, Recolhivel } from '../components/ui.jsx';
import { descreveFiltros } from '../exportar.js';
import { primeiraLista, todasListas, ultimaLista } from '../listas.js';

export default function Estados({ filtros }) {
  const p = { uf: filtros.uf, municipio: filtros.municipio, lider: filtros.lider };
  const st = useApi('estados', p);
  const L = todasListas(), P = primeiraLista(), U = ultimaLista();
  const csvEstados = [{ key: 'uf', label: 'UF' }, ...L.flatMap((l) => [{ key: 'el' + l.id, label: `Eleitores ${l.label}` }, { key: (e) => (e['m' + l.id] == null ? '' : e['m' + l.id].toFixed(2)), label: `Margem ${l.label} (pts)` }])];
  const colunas = [{ key: 'uf', label: 'UF', left: true }, { key: 'el' + P.id, label: `Eleitores ${P.label}`, format: nInt, hint: H.eleitores }, { key: 'el' + U.id, label: `Eleitores ${U.label}`, format: nInt, hint: H.eleitores },
    ...L.map((l) => ({ key: 'm' + l.id, label: `Margem ${l.label}`, format: nPts, tone: true, hint: H.margem }))];
  if (!st.data) return <Carregando state={st} />;
  return (
    <div className="stack">
      <Card titulo="Margem por estado" acoes={<BaixarGrafico titulo={`Margem por estado: ${P.label} × ${U.label}`} filtros={descreveFiltros(filtros)} nome="margem-por-estado" csv={{ colunas: csvEstados, linhas: st.data }} />} nota={`Cada linha liga a margem do estado na lista de ${P.label} à margem na lista de ${U.label}. Estados sem os dois pontos não estavam nas duas listas.`}>
        <div className="legend"><span><i className="sw neu" />{P.label}</span><span><i className="sw ult" />{U.label}</span></div>
        <Halteres estados={st.data} />
      </Card>
      <Recolhivel titulo="Tabela de estados" nota={`${nInt(st.data.length)} estados`} aberto acoes={<Baixar path="estados" params={p} />}>
        <DataTable free idLinha={(r) => r.uf} vazio="Nenhum estado corresponde aos filtros." columns={colunas} rows={st.data} initialSort={{ key: 'el' + P.id, dir: -1 }} />
      </Recolhivel>
    </div>
  );
}
