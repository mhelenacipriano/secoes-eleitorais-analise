import { useApi } from '../api.js';
import { nInt, nPct, nPts, nSig } from '../format.js';
import { H } from '../hints.js';
import { BarrasMargem } from '../components/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { Baixar, Card, Carregando, Legenda, Recolhivel } from '../components/ui.jsx';
import Secoes from './Secoes.jsx';

export default function Mudancas({ filtros }) {
  const p = { uf: filtros.uf, municipio: filtros.municipio, lider: filtros.lider };
  const st = useApi('mudancas', p);
  if (!st.data) return <Carregando state={st} />;
  const { detalhe, efeito } = st.data;
  const itens = detalhe.filter((d) => d.secoes > 0 && d.margem != null && (d.situacao !== 'Mantidas' || (d.a === 1 && d.b === 4)))
    .map((d) => ({ rotulo: `${d.passo} · ${d.situacao.toLowerCase()} (${nInt(d.secoes)})`, valor: d.margem, dica: [`${nInt(d.secoes)} seções · ${nInt(d.eleitores)} eleitores`, `Lula ${nPct(d.lulaPct)} · Flávio ${nPct(d.flavioPct)}`] }));
  return (
    <div className="stack">
      <Card titulo="Margem nas seções que saíram, ficaram ou entraram" nota="Barra à direita (sólida): Lula na frente. Barra à esquerda (listrada): Flávio na frente. A margem é do 1º turno e não indica o motivo da mudança.">
        <Legenda />
        <BarrasMargem itens={itens} />
      </Card>
      <Recolhivel titulo="Efeito sobre a margem da lista" nota="Margem da lista antes e depois de cada troca (variação de composição, não swing eleitoral)">
        <DataTable free chave="a" columns={[
          { key: 'passo', label: 'Troca', left: true }, { key: 'antes', label: 'Margem antes', format: nPts, tone: true, hint: H.margem }, { key: 'depois', label: 'Margem depois', format: nPts, tone: true, hint: H.margem },
          { key: 'variacao', label: 'Variação', format: nPts, hint: 'Diferença, em pontos percentuais, entre a margem da lista nova e a da lista anterior. Não é uma mudança de votos nem um swing eleitoral.' },
          { key: 'lula', label: 'Votos Lula', format: nSig }, { key: 'flavio', label: 'Votos Flávio', format: nSig },
        ]} rows={efeito} />
      </Recolhivel>
      <Recolhivel titulo="Detalhe de cada troca" nota="Seções removidas, mantidas e adicionadas" acoes={<Baixar path="mudancas" params={p} />}>
        <DataTable chave="b" columns={[
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
