import { nInt, nPct, nPts, quem } from '../format.js';
import { useWidth } from './Charts.jsx';

// faixas de margem (pontos de vantagem no 1º turno), da mais favorável a Flávio à mais favorável a Lula
const FAIXAS = [
  { rot: 'Flávio muito à frente', dica: 'Flávio com mais de 30 pts de vantagem', tipo: 'F', op: 1 },
  { rot: 'Flávio à frente', dica: 'Flávio com 10 a 30 pts de vantagem', tipo: 'F', op: 0.6 },
  { rot: 'Equilibradas', dica: 'Diferença de até 10 pts para qualquer lado', tipo: 'N', op: 0.4 },
  { rot: 'Lula à frente', dica: 'Lula com 10 a 30 pts de vantagem', tipo: 'L', op: 0.6 },
  { rot: 'Lula muito à frente', dica: 'Lula com mais de 30 pts de vantagem', tipo: 'L', op: 1 },
];
const pintar = (f) => (f.tipo === 'L' ? { fill: 'var(--lula)', fillOpacity: f.op } : f.tipo === 'F' ? { fill: 'url(#hachFaixas)', fillOpacity: f.op } : { fill: 'var(--neutro)', fillOpacity: f.op });

/** Uma barra de 100% por lista, dividida pelo quanto as seções favorecem cada candidato no 1º turno. */
export function BarrasFaixas({ listas }) {
  const [ref, w] = useWidth();
  const com = listas.filter((l) => l.n > 0);
  if (!com.length) return <div className="empty">Sem seções com resultado do 1º turno nesse recorte.</div>;
  const esq = 92, dir = 8, linha = 38, H = com.length * linha + 6, larg = w - esq - dir;
  return (
    <div ref={ref}>
      <div className="legend" aria-label="Legenda">{FAIXAS.map((f) => <span key={f.rot} title={f.dica}><svg width="16" height="12" aria-hidden="true"><rect width="16" height="12" rx="2" {...pintar(f)} fill={f.tipo === 'F' ? 'var(--flavio)' : pintar(f).fill} /></svg> {f.rot}</span>)}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Para cada lista, a parte das seções por faixa de vantagem de Lula ou de Flávio no 1º turno">
        <defs><pattern id="hachFaixas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--flavio)" /><rect width="2.2" height="6" fill="var(--hachura)" /></pattern></defs>
        {com.map((l, i) => {
          let acc = 0; const y = 4 + i * linha;
          return (
            <g key={l.id}>
              <text x={esq - 8} y={y + 20} textAnchor="end" fontSize="12.5" className="strong" fill="var(--fg)">{l.label}</text>
              {l.faixas.map((p, k) => {
                const x0 = esq + acc * larg, wd = p * larg; acc += p;
                return (
                  <g key={k}>
                    <rect x={x0} y={y + 4} width={Math.max(0, wd - 1)} height="26" {...pintar(FAIXAS[k])}><title>{`${l.label} · ${FAIXAS[k].rot}: ${nPct(p, 0)} das seções (${FAIXAS[k].dica})`}</title></rect>
                    {wd > 30 && <text x={x0 + wd / 2} y={y + 22} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg)" stroke="var(--bg)" strokeWidth="3" paintOrder="stroke">{nPct(p, 0)}</text>}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Frase de leitura simples, calculada a partir das listas. */
export function leitura(listas) {
  const com = listas.filter((l) => l.n > 0);
  if (com.length < 2) return null;
  const med = com.map((l) => l.mediana), amp = Math.max(...med) - Math.min(...med);
  const baixa = com.reduce((a, b) => (b.mediana < a.mediana ? b : a)), alta = com.reduce((a, b) => (b.mediana > a.mediana ? b : a));
  return (
    <>
      Olhando a seção “do meio” de cada lista, ela tem {com.map((l) => `${quem(l.mediana, 0)} (${l.label})`).join('; ')}.
      {' '}{amp < 3 ? 'As curvas ficam praticamente coladas: as listas reúnem seções de perfil parecido.' : <>A lista de <strong>{baixa.label}</strong> se destaca por ficar mais para o lado de Flávio e a de <strong>{alta.label}</strong> mais para o de Lula, com {nPts(amp, 0)} de diferença entre as seções típicas.</>}
    </>
  );
}

export function TabelaListas({ listas }) {
  return (
    <div className="tabela-card"><table>
      <thead><tr><th>Lista</th><th>Seções com resultado</th><th>Lula à frente</th><th>Flávio à frente</th><th>Seção típica</th></tr></thead>
      <tbody>{listas.filter((l) => l.n > 0).map((l) => <tr key={l.id}><td>{l.label}</td><td>{nInt(l.n)}</td><td>{nPct(l.pctLula, 0)}</td><td>{nPct(l.pctFlavio, 0)}</td><td>{nPts(l.mediana)}</td></tr>)}</tbody>
    </table></div>
  );
}
