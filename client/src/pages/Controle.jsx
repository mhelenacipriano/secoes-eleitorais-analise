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
  return (
    <div className="stack">
      <Card titulo="As seções alteradas votaram diferente das demais do mesmo município?" nota="Comparamos a margem (Lula − Flávio, 1º turno) das seções que aparecem nas listas com a de todas as outras seções do mesmo município, que não aparecem em nenhuma lista (grupo de controle).">
        <p>
          Olhando o país inteiro, as seções alteradas têm margem média de <strong>{f(q.margemAlteradas)}</strong> e as demais, <strong>{f(q.margemControle)}</strong>: uma diferença bruta de <strong>{f(q.mediaBruta)}</strong>.
          Mas as alteradas estão concentradas em certos municípios. Comparando apenas seções <em>do mesmo município</em>, a diferença cai para <strong>{f(q.diferenca)}</strong> (IC 95%: {f(q.ic95[0])} a {f(q.ic95[1])}), {q.ic95[0] <= 0 && q.ic95[1] >= 0 ? 'um intervalo que inclui o zero: não há evidência de que as alteradas votassem diferente das vizinhas.' : 'um intervalo que não inclui o zero.'}
        </p>
        <Floresta linhas={linhas} />
        <p className="note">Ponto vermelho: diferença média dentro do município. Linha vermelha: intervalo de 95% com bootstrap por município (reamostra municípios inteiros, respeitando que seções vizinhas se parecem). A diferença bruta (+5,5 pts no total) tem intervalo bem estreito se cada seção for tratada como independente, mas isso não leva em conta que as alteradas se concentram em certos municípios.</p>
      </Card>
      <Card titulo="Números por lista" nota={`Base: ${nInt(c.totalSecoes)} seções do 1º turno; ${nInt(q.municipios)} municípios têm seções alteradas e de controle.`}>
        <div className="tabela-card"><table>
          <thead><tr><th>Lista</th><th>Seções alteradas</th><th>Diferença bruta</th><th>Dentro do município</th><th>IC 95% (cluster)</th><th>p (permutação)</th></tr></thead>
          <tbody>{linhas.map((l) => <tr key={l.nome}><td>{l.nome}</td><td>{nInt(l.n)}</td><td>{f(l.bruta)}</td><td>{f(l.est)}</td><td>{f(l.ic[0])} a {f(l.ic[1])}</td><td>{l.p.toLocaleString('pt-BR')}</td></tr>)}</tbody>
        </table></div>
        <p className="note">O teste de permutação embaralha os rótulos dentro de cada município e trata as seções como trocáveis; ele ignora que seções do mesmo local de votação se parecem, então pode sair pequeno mesmo quando o intervalo por cluster inclui o zero. Prefira o intervalo. Este é um retrato descritivo, não prova de causa nem de efeito sobre o resultado.</p>
      </Card>
    </div>
  );
}
