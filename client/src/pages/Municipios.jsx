import { useMemo } from 'react';
import { useParam } from '../router.js';
import { useApi } from '../api.js';
import { nInt, nPct, nPts, nPp } from '../format.js';
import { H } from '../hints.js';
import DataTable from '../components/DataTable.jsx';
import { useIntervalos } from '../components/Intervalos.jsx';
import { baixarCsv, descreveFiltros } from '../exportar.js';
import { Baixar, Card, Carregando } from '../components/ui.jsx';

const CSV_MUN = [{ key: 'municipio', label: 'Município' }, { key: 'uf', label: 'UF' }, { key: 'secoes', label: 'Seções' }, { key: 'semResultado', label: 'Sem resultado' }, { key: 'eleitores', label: 'Eleitores' }, { key: (r) => (r.lulaPct == null ? '' : (r.lulaPct * 100).toFixed(2)), label: 'Lula (%)' }, { key: (r) => (r.flavioPct == null ? '' : (r.flavioPct * 100).toFixed(2)), label: 'Flávio (%)' }, { key: (r) => (r.margem == null ? '' : r.margem.toFixed(2)), label: 'Margem (pontos percentuais)' }, { key: 'listas', label: 'Listas' }];

export default function Municipios({ filtros }) {
  const [q, setQ] = useParam('q');
  const p = { uf: filtros.uf, municipio: filtros.municipio, lista: filtros.lista, transicao: filtros.transicao, status: filtros.status, lider: filtros.lider };
  const st = useApi('municipios', p);
  const rows = useMemo(() => (st.data || []).filter((r) => !q || r.municipio.toLowerCase().includes(q.toLowerCase())), [st.data, q]);
  const [linhas, painel] = useIntervalos(rows);
  if (!st.data) return <Carregando state={st} />;
  return (
    <Card titulo="Municípios" nota="Eleitores afetados e votos do 1º turno em cada município. Margens em pontos percentuais (Lula − Flávio). Toque no título de uma coluna para ordenar." acoes={<span className="baixar-grafico"><Baixar path="municipios" params={p} /><button type="button" className="btn" onClick={() => baixarCsv('municipios-recorte', CSV_MUN, linhas)} title="Exporta exatamente as linhas que estão na tabela, incluindo a busca e os intervalos escolhidos nos gráficos">Baixar recorte (CSV)</button></span>}>
      {painel}
      <div className="tools"><input className="search" type="search" placeholder="Buscar município" aria-label="Buscar município" value={q} onChange={(e) => setQ(e.target.value)} /><span className="note">{nInt(linhas.length)} municípios</span></div>
      <DataTable pageSize={50} vazio="Nenhum município corresponde aos filtros ou à busca." initialSort={{ key: 'eleitores', dir: -1 }} columns={[
        { key: 'municipio', label: 'Município', left: true }, { key: 'secoes', label: 'Seções', format: nInt }, { key: 'eleitores', label: 'Eleitores', format: nInt, hint: H.eleitores },
        { key: 'lulaPct', label: 'Lula', format: nPct, hint: H.pct }, { key: 'flavioPct', label: 'Flávio', format: nPct, hint: H.pct }, { key: 'margem', label: 'Margem', format: nPp, tone: true, hint: H.margem }, { key: 'listas', label: 'Aparece em', left: true, wrap: true },
      ]} rows={linhas} />
    </Card>
  );
}
