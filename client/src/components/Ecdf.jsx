import { useState } from 'react';
import { nInt, nPct, nPts, quem } from '../format.js';
import { useWidth } from './Charts.jsx';

// um traço diferente por lista (cor + tracejado), para não depender só da cor; a lista mais recente (última) é a vermelha e grossa
const TRACOS = ['2 4', '8 4', '1 3', '10 3 2 3', ''];

/**
 * Curvas acumuladas da margem (Lula − Flávio) das seções de cada lista. Leitura: em cada ponto horizontal, a altura da curva é a parte das
 * seções da lista com margem até aquele valor. Curvas que quase se sobrepõem indicam listas com seções parecidas.
 */
export function CurvasMargem({ listas }) {
  const [ref, w] = useWidth();
  const [foco, setFoco] = useState('');
  const com = listas.filter((l) => l.n > 0);
  if (!com.length) return <div className="empty">Sem seções com resultado do 1º turno nesse recorte.</div>;
  const lo = Math.floor(Math.min(...com.map((l) => l.q[3])) / 10) * 10, hi = Math.ceil(Math.max(...com.map((l) => l.q[97])) / 10) * 10;
  const esq = 40, dir = 12, topo = 10, base = 38, H = 300;
  const x = (v) => esq + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (w - esq - dir);
  const y = (p) => topo + (1 - p / 100) * (H - topo - base);
  const ult = com[com.length - 1].id;
  const estilo = (l, i) => (l.id === ult ? { stroke: 'var(--lula)', width: 3.2, dash: '' } : { stroke: 'var(--fg2)', width: 2, dash: TRACOS[i % (TRACOS.length - 1)] });
  const ticks = []; for (let t = Math.ceil(lo / 20) * 20; t <= hi; t += 20) ticks.push(t);
  return (
    <div ref={ref}>
      <div className="legend" role="group" aria-label="Escolha uma lista para destacar">
        {com.map((l, i) => { const e = estilo(l, i); return (
          <button key={l.id} type="button" className="linklike" style={{ textDecoration: foco === l.id ? 'underline' : 'none', fontWeight: foco === l.id ? 700 : 500, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg)' }}
            aria-pressed={foco === l.id} onClick={() => setFoco(foco === l.id ? '' : l.id)}>
            <svg width="30" height="8" aria-hidden="true"><line x1="0" x2="30" y1="4" y2="4" stroke={e.stroke} strokeWidth={e.width} strokeDasharray={e.dash} /></svg>{l.label}
          </button>); })}
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Curvas acumuladas da margem entre Lula e Flávio nas seções de cada lista">
        {[0, 25, 50, 75, 100].map((p) => <g key={p}><line x1={esq} x2={w - dir} y1={y(p)} y2={y(p)} stroke="var(--line)" /><text x={esq - 6} y={y(p) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{p}%</text></g>)}
        {lo < 0 && hi > 0 && <><line x1={x(0)} x2={x(0)} y1={topo} y2={H - base} stroke="var(--fg)" strokeDasharray="4 3" /><text x={x(0)} y={topo + 10} textAnchor="middle" fontSize="11" fill="var(--muted)" stroke="var(--bg)" strokeWidth="3" paintOrder="stroke">empate</text></>}
        {ticks.map((t) => <text key={t} x={x(t)} y={H - base + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{t > 0 ? '+' : t < 0 ? '−' : ''}{Math.abs(t)}</text>)}
        <text x={esq} y={H - 6} fontSize="11" fill="var(--flavio)">← mais Flávio</text>
        <text x={w - dir} y={H - 6} textAnchor="end" fontSize="11" fill="var(--lula)">mais Lula →</text>
        {com.map((l, i) => {
          const e = estilo(l, i), dim = foco && foco !== l.id;
          const pts = l.q.map((v, p) => `${x(v).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
          return <polyline key={l.id} points={pts} fill="none" stroke={e.stroke} strokeWidth={foco === l.id ? e.width + 1.5 : e.width} strokeDasharray={e.dash} strokeLinejoin="round" opacity={dim ? 0.18 : 1}><title>{`${l.label}: ${nInt(l.n)} seções · margem típica ${nPts(l.mediana)}`}</title></polyline>;
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
      Em cada lista, a seção “típica” (a do meio) tem {com.map((l) => `${quem(l.mediana, 0)} (${l.label})`).join('; ')}.
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
