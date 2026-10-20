import { useApi } from '../api.js';
import { nInt, nPct, nPts, nSig } from '../format.js';
import { BarrasMargem, Legenda, COR } from '../components/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { Card, Carregando, Baixar } from './Common.jsx';

export default function Mudancas({ filtros }) {
  const st = useApi('mudancas', { uf: filtros.uf });
  if (!st.data) return <Carregando state={st} />;
  const { detalhe, efeito } = st.data;
  const itens = detalhe.filter((d) => d.secoes > 0 && d.margem != null && (d.situacao !== 'Mantidas' || (d.a === 1 && d.b === 4)))
    .map((d) => ({ rotulo: `${d.passo} · ${d.situacao.toLowerCase()} (${nInt(d.secoes)})`, valor: d.margem, dica: [`${nInt(d.secoes)} seções · ${nInt(d.eleitores)} eleitores`, `Lula ${nPct(d.lulaPct)} · Flávio ${nPct(d.flavioPct)}`] }));
  return (
    <div className="stack">
      <p className="lead" style={{ margin: 0 }}>Cada vez que uma lista substitui outra, algumas seções saem, outras ficam e outras entram. Aqui você vê quem estava nessas seções e como a margem da lista muda.</p>
      <Card titulo="Margem nas seções que saíram, ficaram ou entraram" nota="Barra à direita: Lula na frente. Barra à esquerda: Flávio na frente.">
        <Legenda itens={[[COR.lula, 'Lula na frente'], [COR.flavio, 'Flávio na frente']]} />
        <BarrasMargem itens={itens} />
      </Card>
      <Card titulo="Efeito sobre a margem da lista" nota="Margem da lista antes e depois de cada troca, e quantos votos de cada candidato entraram ou saíram.">
        <DataTable free columns={[
          { key: 'passo', label: 'Troca', left: true }, { key: 'antes', label: 'Margem antes', format: nPts, tone: true }, { key: 'depois', label: 'Margem depois', format: nPts, tone: true },
          { key: 'variacao', label: 'Variação', format: nPts }, { key: 'lula', label: 'Votos Lula', format: nSig }, { key: 'flavio', label: 'Votos Flávio', format: nSig },
        ]} rows={efeito} />
      </Card>
      <Card titulo="Detalhe de cada troca" acoes={<Baixar path="mudancas" params={{ uf: filtros.uf }} />}>
        <DataTable columns={[
          { key: 'passo', label: 'Troca', left: true }, { key: 'situacao', label: 'Situação', left: true }, { key: 'secoes', label: 'Seções', format: nInt },
          { key: 'eleitores', label: 'Eleitores', format: nInt }, { key: 'lulaPct', label: 'Lula', format: nPct }, { key: 'flavioPct', label: 'Flávio', format: nPct }, { key: 'margem', label: 'Margem', format: nPts, tone: true },
        ]} rows={detalhe.filter((d) => d.secoes > 0)} />
      </Card>
    </div>
  );
}
