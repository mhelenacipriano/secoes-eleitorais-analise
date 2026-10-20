import { useApi } from '../api.js';
import { nInt, nPct, nPts, tone } from '../format.js';
import { BarrasPorLista, Legenda, COR } from '../components/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { Card, Carregando, Baixar } from './Common.jsx';

export default function Visao({ filtros }) {
  const st = useApi('resumo', { uf: filtros.uf });
  const mu = useApi('mudancas', { uf: filtros.uf });
  if (!st.data) return <Carregando state={st} />;
  const listas = st.data;
  const a = listas.find((l) => l.id === 1), d = listas.find((l) => l.id === 4);
  const maior = mu.data && mu.data.efeito.length ? [...mu.data.efeito].sort((x, y) => Math.abs(y.variacao) - Math.abs(x.variacao))[0] : null;
  const onde = filtros.uf ? `No estado ${filtros.uf}, ` : '';
  return (
    <div className="stack">
      <p className="lead" style={{ margin: 0 }}>
        {a && d
          ? `${onde}a primeira lista (18/10 · 11h) tem ${nInt(a.secoes)} seções e ${nInt(a.eleitores)} eleitores, com Lula em ${nPct(a.lulaPct)} dos votos válidos e Flávio Bolsonaro em ${nPct(a.flavioPct)}. A lista de 438 seções tem ${nInt(d.eleitores)} eleitores, com Lula em ${nPct(d.lulaPct)} e Flávio em ${nPct(d.flavioPct)}.`
          : `${onde}as listas disponíveis são: ${listas.map((l) => `${l.label} (${nInt(l.secoes)} seções)`).join(', ')}.`}
      </p>
      <div className="grid">
        {listas.map((l) => (
          <div className="card kpi" key={l.id}>
            <span className="lab">{l.nome}</span>
            <span className={'val ' + tone(l.margem)}>{nPts(l.margem)}</span>
            <span className="sub">Lula {nPct(l.lulaPct)} · Flávio {nPct(l.flavioPct)}</span>
            <span className="sub">{nInt(l.secoes)} seções · {nInt(l.eleitores)} eleitores</span>
          </div>
        ))}
      </div>
      <p className="note" style={{ margin: 0 }}>Como ler: a margem é a porcentagem de Lula menos a de Flávio nos votos válidos do 1º turno. Positivo: Lula na frente. “pts” são pontos percentuais.</p>
      {maior && (
        <div className="insight">
          <strong>Maior efeito:</strong> a troca <strong>{maior.passo}</strong> mudou a margem de {nPts(maior.antes)} para {nPts(maior.depois)} ({nPts(maior.variacao)}).
        </div>
      )}
      <Card titulo="Porcentagem de votos em cada lista" nota="Votos válidos do 1º turno nas seções de cada lista, da mais antiga para a mais recente.">
        <Legenda itens={[[COR.lula, 'Lula'], [COR.flavio, 'Flávio Bolsonaro'], [COR.neutro, 'Outros']]} />
        <BarrasPorLista listas={listas} />
      </Card>
      <Card titulo="Resumo das listas" acoes={<Baixar path="resumo" params={{ uf: filtros.uf }} />}>
        <DataTable free columns={[
          { key: 'nome', label: 'Lista', left: true }, { key: 'secoes', label: 'Seções', format: nInt }, { key: 'eleitores', label: 'Eleitores', format: nInt },
          { key: 'municipios', label: 'Municípios', format: nInt }, { key: 'lula', label: 'Votos Lula', format: nInt }, { key: 'flavio', label: 'Votos Flávio', format: nInt },
          { key: 'lulaPct', label: 'Lula', format: nPct }, { key: 'flavioPct', label: 'Flávio', format: nPct }, { key: 'margem', label: 'Margem', format: nPts, tone: true },
        ]} rows={listas} />
      </Card>
    </div>
  );
}
