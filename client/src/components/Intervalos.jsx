import { useMemo, useRef, useState } from 'react';
import { nInt, nPts } from '../format.js';
import { useParam } from '../router.js';
import { useWidth } from './Charts.jsx';

const BINS = 40;
const par = (s) => { const [a, b] = String(s || '').split('_').map(Number); return Number.isFinite(a) && Number.isFinite(b) && a < b ? [a, b] : null; };
const dentro = (v, s) => !s || (v != null && v >= s[0] && v <= s[1]);

/** Histograma em que se arrasta (mouse ou dedo, na horizontal) para escolher um intervalo; clicar fora limpa. */
function Histograma({ valores, dominio, sel, onSel, formato, rotulo }) {
  const [ref, w] = useWidth();
  const [arr, setArr] = useState(null);   // {a, b}: seleção em andamento, em valor
  const svg = useRef(null);
  const [lo, hi] = dominio, H = 92, base = 70, topo = 8;
  const { cont, max } = useMemo(() => {
    const c = new Array(BINS).fill(0);
    for (const v of valores) { if (v == null || v < lo || v > hi) continue; c[Math.min(BINS - 1, Math.floor(((v - lo) / (hi - lo)) * BINS))]++; }
    return { cont: c, max: Math.max(1, ...c) };
  }, [valores, lo, hi]);
  const x = (v) => 6 + ((v - lo) / (hi - lo)) * (w - 12);
  const valorDe = (e) => { const r = svg.current.getBoundingClientRect(); return lo + Math.min(1, Math.max(0, (e.clientX - r.left - 6) / (r.width - 12))) * (hi - lo); };
  const bw = (w - 12) / BINS;
  const ativo = arr ? [Math.min(arr.a, arr.b), Math.max(arr.a, arr.b)] : sel;
  const down = (e) => { svg.current.setPointerCapture?.(e.pointerId); const v = valorDe(e); setArr({ a: v, b: v, ini: e.clientX }); };
  const move = (e) => { if (arr) setArr((s) => ({ ...s, b: valorDe(e) })); };
  const up = (e) => {
    if (!arr) return;
    const moveu = Math.abs(e.clientX - arr.ini) > 4, a = Math.min(arr.a, arr.b), b = Math.max(arr.a, arr.b);
    setArr(null);
    onSel(moveu && b > a ? [a, b] : null);
  };
  return (
    <div className="hist" ref={ref}>
      <svg ref={svg} width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`${rotulo}: histograma. Arraste para escolher um intervalo.`} style={{ touchAction: 'pan-y' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setArr(null)}>
        {cont.map((n, i) => {
          const h = (n / max) * (base - topo), x0 = 6 + i * bw, meio = lo + ((i + 0.5) / BINS) * (hi - lo);
          const fora = ativo && !(meio >= ativo[0] && meio <= ativo[1]);
          return <rect key={i} x={x0 + 0.5} y={base - h} width={Math.max(1, bw - 1)} height={h} rx="1.5" className={'hb' + (fora ? ' fora' : '')}><title>{`${formato(lo + (i / BINS) * (hi - lo))} a ${formato(lo + ((i + 1) / BINS) * (hi - lo))}: ${nInt(n)}`}</title></rect>;
        })}
        {lo < 0 && hi > 0 && <line x1={x(0)} x2={x(0)} y1={topo} y2={base} stroke="var(--line)" strokeDasharray="3 3" />}
        <line x1="6" x2={w - 6} y1={base} y2={base} stroke="var(--line)" />
        <text x="6" y={H - 6}>{formato(lo)}</text><text x={w - 6} y={H - 6} textAnchor="end">{formato(hi)}</text>
        {ativo && <rect x={x(ativo[0])} y={topo - 2} width={Math.max(2, x(ativo[1]) - x(ativo[0]))} height={base - topo + 2} className="sel-brush" />}
      </svg>
    </div>
  );
}

const fMargem = (v) => nPts(v, 0), fEl = (v) => nInt(v);

/**
 * Filtro por intervalo de margem e de eleitores, com histogramas em que se arrasta para escolher e um botão para ampliar a escolha.
 * Devolve as linhas que passam nos dois filtros e o painel para exibir. A escolha fica na URL (mg=-20_35, el=500_4000, zm=1).
 */
export function useIntervalos(rows) {
  const [mgP, setMg] = useParam('mg'), [elP, setEl] = useParam('el'), [zm, setZm] = useParam('zm');
  const mg = par(mgP), el = par(elP);
  const filtradas = useMemo(() => rows.filter((r) => dentro(r.margem, mg) && dentro(r.eleitores, el)), [rows, mgP, elP]);
  const painel = useMemo(() => {
    const baseMg = rows.filter((r) => dentro(r.eleitores, el)), baseEl = rows.filter((r) => dentro(r.margem, mg));
    const maxEl = (() => { const v = rows.map((r) => r.eleitores).filter((n) => n != null).sort((a, b) => a - b); return v.length ? Math.max(100, Math.ceil(v[Math.floor(v.length * 0.98)] / 100) * 100) : 100; })();
    const ampliar = zm === '1';
    const domMg = ampliar && mg ? [Math.floor(mg[0]), Math.ceil(mg[1])] : [-100, 100];
    const domEl = ampliar && el ? [Math.floor(el[0]), Math.ceil(el[1])] : [0, maxEl];
    const algum = Boolean(mg || el);
    return (
      <div className="intervalos">
        <div className="intervalos-cab">
          <p className="note">Arraste sobre um gráfico para escolher um intervalo e ver só as linhas dentro dele. Os dois filtros se combinam.</p>
          {algum && (
            <span className="intervalos-acoes">
              <button type="button" className="btn" onClick={() => setZm(ampliar ? '' : '1')} aria-pressed={ampliar}>{ampliar ? 'Voltar à escala completa' : 'Ampliar a seleção'}</button>
              <button type="button" className="btn" onClick={() => { setMg(''); setEl(''); setZm(''); }}>Limpar seleção</button>
            </span>
          )}
        </div>
        <div className="intervalos-grade">
          <div>
            <h3>Margem (Lula − Flávio)</h3>
            <Histograma valores={baseMg.map((r) => r.margem)} dominio={domMg} sel={mg} onSel={(s) => setMg(s ? `${s[0].toFixed(1)}_${s[1].toFixed(1)}` : '')} formato={fMargem} rotulo="Margem" />
            <p className="note">{mg ? `Escolhido: ${nPts(mg[0])} a ${nPts(mg[1])}` : 'Sem intervalo escolhido'}</p>
          </div>
          <div>
            <h3>Eleitores na seção</h3>
            <Histograma valores={baseEl.map((r) => r.eleitores)} dominio={domEl} sel={el} onSel={(s) => setEl(s ? `${Math.round(s[0])}_${Math.round(s[1])}` : '')} formato={fEl} rotulo="Eleitores" />
            <p className="note">{el ? `Escolhido: ${nInt(el[0])} a ${nInt(el[1])} eleitores` : 'Sem intervalo escolhido'}</p>
          </div>
        </div>
        <div className="intervalos-num" role="group" aria-label="Escolher o intervalo digitando">
          <label>Margem de <input inputMode="decimal" aria-label="Margem mínima" value={mg ? mg[0] : ''} placeholder="−100" onChange={(e) => { const a = Number(e.target.value.replace(',', '.')); setMg(e.target.value !== '' && Number.isFinite(a) ? `${a}_${mg ? mg[1] : 100}` : ''); }} /> a <input inputMode="decimal" aria-label="Margem máxima" value={mg ? mg[1] : ''} placeholder="100" onChange={(e) => { const b = Number(e.target.value.replace(',', '.')); setMg(e.target.value !== '' && Number.isFinite(b) ? `${mg ? mg[0] : -100}_${b}` : ''); }} /> pontos percentuais</label>
          <label>Eleitores de <input inputMode="numeric" aria-label="Mínimo de eleitores" value={el ? el[0] : ''} placeholder="0" onChange={(e) => { const a = Number(e.target.value); setEl(e.target.value !== '' && Number.isFinite(a) ? `${a}_${el ? el[1] : 100000}` : ''); }} /> a <input inputMode="numeric" aria-label="Máximo de eleitores" value={el ? el[1] : ''} placeholder="máx." onChange={(e) => { const b = Number(e.target.value); setEl(e.target.value !== '' && Number.isFinite(b) ? `${el ? el[0] : 0}_${b}` : ''); }} /></label>
        </div>
        <p className="intervalos-res" aria-live="polite">{algum ? <><strong>{nInt(filtradas.length)}</strong> de {nInt(rows.length)} linhas dentro do intervalo{mg ? '; linhas sem resultado do 1º turno ficam de fora do filtro de margem' : ''}.</> : `${nInt(rows.length)} linhas`}</p>
      </div>
    );
  }, [rows, mgP, elP, zm, filtradas.length]);
  return [filtradas, painel];
}
