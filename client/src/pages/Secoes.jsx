import { useParam } from '../router.js';
import { useApi } from '../api.js';
import { nInt, nPct, nPts } from '../format.js';
import { H } from '../hints.js';
import DataTable from '../components/DataTable.jsx';
import { useIntervalos } from '../components/Intervalos.jsx';
import { baixarCsv } from '../exportar.js';
import { Baixar, Card, Carregando } from '../components/ui.jsx';

const pc = (v) => (v == null ? '' : (v * 100).toFixed(2));
const CSV_SECOES = [{ key: 'secao', label: 'Seção' }, { key: 'localInicial', label: 'Local inicial' }, { key: 'localFinal', label: 'Local final' }, { key: 'listas', label: 'Aparece em' }, { key: 'eleitores', label: 'Eleitores' }, { key: (r) => pc(r.lulaPct), label: 'Lula (%)' }, { key: (r) => pc(r.flavioPct), label: 'Flávio (%)' }, { key: (r) => (r.margem == null ? '' : r.margem.toFixed(2)), label: 'Margem (pts)' }, { key: 'resultado', label: 'Resultado 1º turno' }];

export default function Secoes({ filtros, comSituacao = false }) {
  const [q, setQ] = useParam('q');
  const params = { uf: filtros.uf, municipio: filtros.municipio, lista: filtros.lista, transicao: filtros.transicao, status: filtros.status, lider: filtros.lider, q };
  const st = useApi('secoes', params);
  const [linhas, painel] = useIntervalos(st.data || []);
  const cols = [
    { key: 'secao', label: 'Seção', left: true }, { key: 'localInicial', label: 'Local inicial', left: true, wrap: true }, { key: 'localFinal', label: 'Local final', left: true, wrap: true },
    { key: 'listas', label: 'Aparece em', left: true, wrap: true },
    ...(comSituacao && filtros.transicao ? [{ key: 'situacao', label: 'Situação', left: true }] : []),
    { key: 'eleitores', label: 'Eleitores', format: nInt, hint: H.eleitores }, { key: 'lulaPct', label: 'Lula', format: nPct, hint: H.pct },
    { key: 'flavioPct', label: 'Flávio', format: nPct, hint: H.pct }, { key: 'margem', label: 'Margem', format: nPts, tone: true, hint: H.margem },
    { key: 'resultado', label: 'Resultado 1º turno', left: true, wrap: true, hint: 'Seções sem resultado cruzado não entram nas porcentagens e não são tratadas como zero voto.' },
  ];
  return (
    <Card titulo="Seção por seção" nota="Local de origem, local de destino e votos do 1º turno de cada seção alterada." acoes={<span className="baixar-grafico"><Baixar path="secoes" params={params} /><button type="button" className="btn" onClick={() => baixarCsv('secoes-recorte', CSV_SECOES, linhas)} title="Exporta exatamente as linhas que estão na tabela, incluindo a busca e os intervalos escolhidos nos gráficos">Baixar recorte (CSV)</button></span>}>
      {painel}
      <div className="tools"><input className="search" type="search" placeholder="Buscar município, estado ou local" aria-label="Buscar seção" value={q} onChange={(e) => setQ(e.target.value)} />{st.data && <span className="note">{nInt(linhas.length)} seções</span>}</div>
      {st.data ? <DataTable pageSize={50} vazio="Nenhuma seção corresponde aos filtros ou à busca." initialSort={{ key: 'eleitores', dir: -1 }} columns={cols} rows={linhas} /> : <Carregando state={st} />}
    </Card>
  );
}
