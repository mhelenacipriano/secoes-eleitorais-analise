import { useEffect, useRef, useState } from 'react';
import { nPct, nPts, nInt } from '../format.js';

export const COR = { lula: 'var(--lula)', flavio: 'var(--flavio)', neutro: 'var(--neutro)' };

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function useTip() {
  const [tip, setTip] = useState(null);
  const box = useRef(null);
  const on = (lines) => (e) => {
    const b = box.current.getBoundingClientRect();
    setTip({ x: Math.min(e.clientX - b.left + 12, b.width - 200), y: e.clientY - b.top + 12, lines });
  };
  return [box, tip, on, () => setTip(null)];
}

const Tip = ({ tip }) => tip && <div className="tip" style={{ left: Math.max(4, tip.x), top: tip.y }}>{tip.lines.map((l, i) => <div key={i} className={i ? '' : 'strong'}>{l}</div>)}</div>;
const Empty = () => <div className="empty">Sem dados para este filtro.</div>;
const textW = (s, px = 6.2) => s.length * px;

/** Colunas agrupadas: Lula, Flávio e Outros em cada lista. */
export function BarrasPorLista({ listas }) {
  const [ref, w] = useWidth();
  const [box, tip, on, off] = useTip();
  if (!listas.length) return <Empty />;
  const H = 270, top = 26, bot = 48, band = (w - 16) / listas.length, gw = band * 0.78, bw = gw / 3;
  const max = Math.max(...listas.map((l) => Math.max(l.lulaPct, l.flavioPct, l.outrosPct))) * 1.1;
  const y = (v) => H - bot - (v / max) * (H - bot - top);
  return (
    <div className="chart" ref={(el) => { ref.current = el; box.current = el; }}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Porcentagem de votos por lista">
        {listas.map((l, i) => {
          const x0 = 8 + i * band + (band - gw) / 2;
          return (
            <g key={l.id} onMouseMove={on([l.nome, `Lula ${nPct(l.lulaPct)} · Flávio ${nPct(l.flavioPct)}`, `Margem ${nPts(l.margem)}`, `${nInt(l.eleitores)} eleitores`])} onMouseLeave={off}>
              <rect x={8 + i * band} y={0} width={band} height={H} fill="transparent" />
              {[['lulaPct', COR.lula], ['flavioPct', COR.flavio], ['outrosPct', COR.neutro]].map(([k, c], j) => (
                <g key={k}>
                  <rect x={x0 + j * bw} y={y(l[k])} width={bw - 3} height={H - bot - y(l[k])} rx="3" fill={c} />
                  <text x={x0 + j * bw + (bw - 3) / 2} y={y(l[k]) - 6} textAnchor="middle">{nPct(l[k])}</text>
                </g>
              ))}
              <text x={8 + i * band + band / 2} y={H - bot + 18} textAnchor="middle" className="strong">{l.label}</text>
              <text x={8 + i * band + band / 2} y={H - bot + 33} textAnchor="middle">{nInt(l.secoes)} seções</text>
            </g>
          );
        })}
      </svg>
      <Tip tip={tip} />
    </div>
  );
}

/** Barras horizontais com valor positivo (Lula) à direita e negativo (Flávio) à esquerda. */
export function BarrasMargem({ itens, rotuloLargura }) {
  const [ref, w] = useWidth();
  const [box, tip, on, off] = useTip();
  if (!itens.length) return <Empty />;
  const rowH = 26, H = itens.length * rowH + 8;
  const left = (rotuloLargura || Math.max(...itens.map((i) => textW(i.rotulo)))) + 12, pad = 64;
  const m = Math.max(...itens.map((i) => Math.abs(i.valor))) || 1;
  const x = (v) => left + pad + ((v + m) / (2 * m)) * (w - left - pad * 2);
  return (
    <div className="chart" ref={(el) => { ref.current = el; box.current = el; }}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Margem Lula menos Flávio">
        {itens.map((it, i) => {
          const y = 4 + i * rowH, pos = it.valor >= 0, x0 = x(0), x1 = x(it.valor);
          return (
            <g key={it.rotulo} onMouseMove={on([it.rotulo, ...(it.dica || [])])} onMouseLeave={off}>
              <rect x="0" y={y} width={w} height={rowH} fill="transparent" />
              <text x={left - 8} y={y + 17} textAnchor="end" className="strong">{it.rotulo}</text>
              <rect x={Math.min(x0, x1)} y={y + 5} width={Math.max(2, Math.abs(x1 - x0))} height="15" rx="3" fill={pos ? COR.lula : COR.flavio} />
              <text x={pos ? x1 + 5 : x1 - 5} y={y + 17} textAnchor={pos ? 'start' : 'end'}>{nPts(it.valor)}</text>
            </g>
          );
        })}
        <line x1={x(0)} x2={x(0)} y1="0" y2={H} stroke="var(--line)" />
      </svg>
      <Tip tip={tip} />
    </div>
  );
}

/** Linha ligando a margem da primeira lista à da lista de 438 em cada estado. */
export function Halteres({ estados }) {
  const [ref, w] = useWidth();
  const [box, tip, on, off] = useTip();
  const itens = estados.filter((e) => e.m1 != null && e.m4 != null);
  if (!itens.length) return <Empty />;
  const rowH = 24, H = itens.length * rowH + 34, all = itens.flatMap((e) => [e.m1, e.m4]);
  const lo = Math.min(...all, 0), hi = Math.max(...all, 0), x = (v) => 40 + ((v - lo) / (hi - lo || 1)) * (w - 56);
  const ticks = Array.from({ length: 6 }, (_, i) => lo + ((hi - lo) / 5) * i);
  return (
    <div className="chart" ref={(el) => { ref.current = el; box.current = el; }}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Margem por estado">
        <line x1={x(0)} x2={x(0)} y1="0" y2={H - 24} stroke="var(--line)" strokeDasharray="3 3" />
        {ticks.map((t) => <text key={t} x={x(t)} y={H - 6} textAnchor="middle">{Math.round(t)}</text>)}
        {itens.map((e, i) => {
          const y = 14 + i * rowH;
          return (
            <g key={e.uf} onMouseMove={on([e.uf, `18/10 · 11h: ${nPts(e.m1)} (${nInt(e.el1)} eleitores)`, `Lista de 438: ${nPts(e.m4)} (${nInt(e.el4)} eleitores)`])} onMouseLeave={off}>
              <rect x="0" y={y - 12} width={w} height={rowH} fill="transparent" />
              <text x="0" y={y + 4} className="strong">{e.uf}</text>
              <line x1={x(e.m1)} x2={x(e.m4)} y1={y} y2={y} stroke="var(--neutro)" strokeWidth="2" />
              <circle cx={x(e.m1)} cy={y} r="5" fill="var(--neutro)" />
              <circle cx={x(e.m4)} cy={y} r="5" fill={COR.lula} />
            </g>
          );
        })}
      </svg>
      <Tip tip={tip} />
    </div>
  );
}

export const Legenda = ({ itens }) => <div className="legend">{itens.map(([c, t]) => <span key={t}><i style={{ background: c }} />{t}</span>)}</div>;
