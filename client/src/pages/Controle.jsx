import { useApi } from '../api.js';
import { nInt, nPts } from '../format.js';
import { Card, Carregando } from '../components/ui.jsx';
import { rotuloLista, todasListas } from '../listas.js';
import { useWidth } from '../components/Charts.jsx';

const f = (v) => nPts(v);

/** Gráfico de floresta: estimativa e intervalo de 95% da diferença de margem em cada lista, com a linha do zero. */
function Floresta({ linhas }) {
  const [ref, w] = useWidth();
  const esq = Math.min(150, w * 0.34), dir = 12, alt = 34, topo = 22, H = topo + linhas.length * alt + 26;
  const vals = linhas.flatMap((l) => [l.ic[0], l.ic[1]]);
  const lim = Math.max(2, Math.ceil(Math.max(...vals.map(Math.abs))));
  const x = (v) => esq + ((v + lim) / (2 * lim)) * (w - esq - dir);
  return (
    <div ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Diferença de margem entre seções alteradas e seções de controle do mesmo município, com intervalo de 95%">
        <line x1={x(0)} x2={x(0)} y1={topo - 6} y2={H - 22} stroke="var(--fg)" strokeDasharray="4 3" />
        <text x={x(0)} y={12} textAnchor="middle" fontSize="11" fill="var(--muted)">sem diferença</text>
        {linhas.map((l, i) => {
          const y = topo + i * alt + alt / 2;
          return (
            <g key={l.nome}>
              <text x={esq - 8} y={y + 4} textAnchor="end" fontSize="12" fill="var(--fg)">{l.nome}</text>
              <line x1={x(l.ic[0])} x2={x(l.ic[1])} y1={y + 3} y2={y + 3} stroke="var(--red-solid)" strokeWidth="3" strokeLinecap="round" />
              <circle cx={x(l.est)} cy={y + 3} r="5" fill="var(--red-solid)" stroke="var(--bg)" strokeWidth="1.5"><title>{`${l.nome}: ${f(l.est)} (IC 95% ${f(l.ic[0])} a ${f(l.ic[1])}) · ${nInt(l.n)} seções`}</title></circle>
            </g>
          );
        })}
        <line x1={esq} x2={w - dir} y1={H - 22} y2={H - 22} stroke="var(--line)" />
        {[-lim, 0, lim].map((t) => <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">{t > 0 ? '+' : t < 0 ? '−' : ''}{Math.abs(t)}</text>)}
      </svg>
    </div>
  );
}

export default function Controle() {
  const st = useApi('controle');
  if (!st.data) return <Carregando state={st} />;
  const c = st.data, q = c.qualquerLista;
  const linhas = [['Todas as listas', q], ...todasListas().map((l) => [l.label, c.porLista[l.id]])].filter(([, r]) => r)
    .map(([nome, r]) => ({ nome, est: r.diferenca, ic: r.ic95, icIng: r.icIngenuo, n: r.alteradas, p: r.pPermutacao, bruta: r.mediaBruta }));
  const inclui0 = q.ic95[0] <= 0 && q.ic95[1] >= 0;
  return (
    <div className="stack">
      <Card titulo="As seções que mudaram votaram diferente das outras?" nota="Comparamos, no 1º turno, as seções que aparecem nas listas do TSE com as outras seções da mesma cidade, que não mudaram de local (o grupo de comparação).">
        <div className="insight">
          <p><strong>Resumo:</strong> no país todo, as seções que mudaram deram mais vantagem a Lula ({f(q.margemAlteradas)}) do que as demais ({f(q.margemControle)}): uma diferença de {f(q.mediaBruta)}. Mas isso acontece porque as mudanças se concentram em certas cidades.</p>
          <p>Comparando só seções <strong>da mesma cidade</strong>, a diferença praticamente some: <strong>{f(q.diferenca)}</strong>, com margem de erro de {f(q.ic95[0])} a {f(q.ic95[1])}. {inclui0 ? 'Como essa faixa inclui o zero, não há evidência de que as seções que mudaram votassem diferente das vizinhas.' : 'Essa faixa não inclui o zero.'}</p>
        </div>
        <Floresta linhas={linhas} />
        <p className="note">O ponto é a diferença média entre as seções que mudaram e as outras da mesma cidade; a linha é a faixa provável (95%). Se a linha cruza o zero, a diferença pode ser só acaso. “pts” são pontos percentuais de vantagem (Lula − Flávio) entre os votos válidos.</p>
      </Card>
      <Card titulo="Números por lista" nota={`Base: ${nInt(c.totalSecoes)} seções do 1º turno; ${nInt(q.municipios)} cidades têm seções que mudaram e seções que não mudaram.`}>
        <div className="tabela-card"><table>
          <thead><tr><th>Lista</th><th>Seções que mudaram</th><th>Diferença no país todo</th><th>Comparando na mesma cidade</th><th>Faixa provável</th></tr></thead>
          <tbody>{linhas.map((l) => <tr key={l.nome}><td>{l.nome}</td><td>{nInt(l.n)}</td><td>{f(l.bruta)}</td><td>{f(l.est)}</td><td>{f(l.ic[0])} a {f(l.ic[1])}</td></tr>)}</tbody>
        </table></div>
        <p className="note">Isto descreve como as seções votaram no 1º turno. Não prova que a mudança de local tenha alterado, ou deixado de alterar, o resultado.</p>
        <details className="ajuda"><summary>Detalhes técnicos</summary>
          <div>
            <p>A diferença “na mesma cidade” é uma média entre cidades, ponderada pelo número de seções que mudaram em cada uma. A faixa provável vem de um sorteio repetido ({nInt(c.reamostras)} vezes) em que cidades inteiras são reamostradas, o que respeita o fato de que seções vizinhas se parecem.</p>
            <p>Teste de permutação (embaralhar quais seções “mudaram”, dentro de cada cidade): {linhas.map((l) => `${l.nome} p=${l.p.toLocaleString('pt-BR')}`).join('; ')}. Esse teste trata cada seção como independente, e por isso pode dar valor pequeno mesmo quando a faixa provável inclui o zero; use a faixa como referência.</p>
            <p>Base de dados: votação do 1º turno de todas as seções do país (TSE), cruzada com as listas. Os votos de {nInt(c.conferencia.iguaisAoArquivoCompleto)} seções que já tínhamos conferem integralmente com o arquivo completo.</p>
          </div>
        </details>
      </Card>
    </div>
  );
}
