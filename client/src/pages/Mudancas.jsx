import { useApi } from '../api.js';
import { nInt, nPct, nPts, nSig } from '../format.js';
import { H } from '../hints.js';
import { BarrasFaixas, TabelaListas, leitura } from '../components/Ecdf.jsx';
import DataTable from '../components/DataTable.jsx';
import { Baixar, BaixarGrafico, Card, Carregando, Legenda, Recolhivel } from '../components/ui.jsx';
import { descreveFiltros } from '../exportar.js';
import Secoes from './Secoes.jsx';
import { primeiraLista, ultimaLista } from '../listas.js';

const CSV_TROCAS = [{ key: 'passo', label: 'Troca' }, { key: 'situacao', label: 'Situação' }, { key: 'secoes', label: 'Seções' }, { key: 'semResultado', label: 'Sem resultado' }, { key: 'eleitores', label: 'Eleitores' }, { key: (d) => (d.lulaPct == null ? '' : (d.lulaPct * 100).toFixed(2)), label: 'Lula (%)' }, { key: (d) => (d.flavioPct == null ? '' : (d.flavioPct * 100).toFixed(2)), label: 'Flávio (%)' }, { key: (d) => (d.margem == null ? '' : d.margem.toFixed(2)), label: 'Margem (pts)' }];

const CSV_DIST = [{ key: 'label', label: 'Lista' }, ...['Flávio muito à frente', 'Flávio à frente', 'Equilibradas', 'Lula à frente', 'Lula muito à frente'].map((r, k) => ({ key: (l) => (l.faixas[k] * 100).toFixed(1), label: `${r} (%)` })), { key: 'n', label: 'Seções com resultado' }, { key: (l) => (l.pctLula * 100).toFixed(1), label: 'Lula à frente (%)' }, { key: (l) => (l.pctFlavio * 100).toFixed(1), label: 'Flávio à frente (%)' }, { key: (l) => l.mediana.toFixed(2), label: 'Margem da seção típica (pts)' }];

export default function Mudancas({ filtros }) {
  const p = { uf: filtros.uf, municipio: filtros.municipio, lider: filtros.lider };
  const st = useApi('mudancas', p), dist = useApi('distribuicao', p);
  if (!st.data || !dist.data) return <Carregando state={st.data ? dist : st} />;
  const { detalhe, efeito } = st.data;
  const linhasCsv = detalhe.filter((d) => d.secoes > 0 && d.margem != null && (d.situacao !== 'Mantidas' || (d.a === primeiraLista().id && d.b === ultimaLista().id)));
  return (
    <div className="stack">
      <Card titulo="Como as seções de cada lista votaram no 1º turno" acoes={<BaixarGrafico titulo="Seções de cada lista por faixa de vantagem" filtros={descreveFiltros(filtros)} nome="distribuicao-margem-por-lista" csv={{ colunas: CSV_DIST, linhas: dist.data.listas.filter((l) => l.n > 0) }} />}
        nota="Cada barra é uma lista e soma 100% das suas seções. As cores mostram quanto cada seção favoreceu Lula (vermelho) ou Flávio (azul listrado) no 1º turno; o cinza são as seções equilibradas. O gráfico não indica o motivo da mudança de local.">
        <BarrasFaixas listas={dist.data.listas} />
        <p className="insight">{leitura(dist.data.listas)}</p>
        <TabelaListas listas={dist.data.listas} />
      </Card>
      <Recolhivel titulo="Margem nas seções que saíram, ficaram ou entraram" nota="Cada troca entre listas, em margem do 1º turno" acoes={<BaixarGrafico titulo="Margem nas seções que saíram, ficaram ou entraram" filtros={descreveFiltros(filtros)} nome="margem-por-troca" csv={{ colunas: CSV_TROCAS, linhas: linhasCsv }} />}>
        <DataTable free chave="b" idLinha={(r) => `${r.passo}|${r.situacao}`} columns={[
          { key: 'passo', label: 'Troca', left: true }, { key: 'situacao', label: 'Situação', left: true }, { key: 'secoes', label: 'Seções', format: nInt }, { key: 'margem', label: 'Margem', format: nPts, tone: true, hint: H.margem },
        ]} rows={linhasCsv} />
      </Recolhivel>
      <Recolhivel titulo="Efeito sobre a margem da lista" nota="Margem da lista antes e depois de cada troca (variação de composição, não swing eleitoral)">
        <DataTable free chave="a" columns={[
          { key: 'passo', label: 'Troca', left: true }, { key: 'antes', label: 'Margem antes', format: nPts, tone: true, hint: H.margem }, { key: 'depois', label: 'Margem depois', format: nPts, tone: true, hint: H.margem },
          { key: 'variacao', label: 'Variação', format: nPts, hint: 'Diferença, em pontos percentuais, entre a margem da lista nova e a da lista anterior. Não é uma mudança de votos nem um swing eleitoral.' },
          { key: 'lula', label: 'Votos Lula', format: nSig }, { key: 'flavio', label: 'Votos Flávio', format: nSig },
        ]} rows={efeito} />
      </Recolhivel>
      <Recolhivel titulo="Detalhe de cada troca" nota="Seções removidas, mantidas e adicionadas" acoes={<Baixar path="mudancas" params={p} />}>
        <DataTable chave="b" idLinha={(r) => `${r.passo}|${r.situacao}`} columns={[
          { key: 'passo', label: 'Troca', left: true }, { key: 'situacao', label: 'Situação', left: true }, { key: 'secoes', label: 'Seções', format: nInt },
          { key: 'semResultado', label: 'Sem resultado', format: nInt, hint: 'Seções sem resultado do 1º turno cruzado. Ficam fora das porcentagens.' },
          { key: 'eleitores', label: 'Eleitores', format: nInt, hint: H.eleitores }, { key: 'lulaPct', label: 'Lula', format: nPct, hint: H.pct }, { key: 'flavioPct', label: 'Flávio', format: nPct, hint: H.pct }, { key: 'margem', label: 'Margem', format: nPts, tone: true, hint: H.margem },
        ]} rows={detalhe.filter((d) => d.secoes > 0)} />
      </Recolhivel>
      <h2 className="sub">Seções da transição escolhida</h2>
      {filtros.transicao ? <Secoes filtros={filtros} comSituacao /> : <div className="empty">Escolha uma <strong>transição entre versões</strong> nos filtros para listar as seções retiradas, mantidas ou adicionadas.</div>}
    </div>
  );
}
