import { useMemo } from 'react';
import { useApi } from '../api.js';
import { useParam, useParamNum } from '../router.js';
import { nInt, nPct } from '../format.js';
import { InfoTip } from './ui.jsx';
import { useWidth } from './Charts.jsx';
import { ultimaLista } from '../listas.js';

const dois = (l) => (l.lula + l.flavio ? l.lula / (l.lula + l.flavio) : 0.5);
const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// 4.000 simulações. Os sorteios (normais padrão) são gerados uma vez, com semente fixa: o resultado é o mesmo a cada visita e o gráfico não "pisca" ao mexer nos controles.
const N_SIM = 4000;
const SORTEIOS = (() => {
  let s = 20261020;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const normal = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  return Array.from({ length: N_SIM }, () => [normal(), normal(), normal(), normal(), normal(), normal()]);
})();

/** Resultado do 2º turno (Lula − Flávio, em votos) em cada simulação, ordenado. Parte dos votos do 1º turno do país todo (nac). */
function simular(nac, { imp, comp, pref, tl, tf, inc }) {
  const dp = inc / 100;
  const out = SORTEIOS.map(([z0, z1, z2, z3, z4, z5]) => {
    let a = limita(tl / 100 + z0 * dp * 2), b = limita(tf / 100 + z1 * dp * 2);
    const t = a + b; if (t > 1) { a /= t; b /= t; }                      // quem vota em Lula + em Flávio nunca passa de 100% dos "outros"
    const ab = 0.02 + z2 * dp * 0.4, choque = z3 * dp * 0.5;             // abstenção extra no 2º turno e um "choque" que favorece um dos lados
    const l = nac.lula * (1 - limita(ab - choque, 0, 0.5)) + nac.outros * a;
    const f = nac.flavio * (1 - limita(ab + choque, 0, 0.5)) + nac.outros * b;
    const naoVotam = imp * limita(comp / 100 + z4 * dp), pl = limita(pref / 100 + z5 * dp);
    return (l - naoVotam * pl) - (f - naoVotam * (1 - pl));
  });
  return out.sort((x, y) => x - y);
}

const BINS = 40;
const txtSaldo = (v) => (Math.abs(v) < 500 ? 'praticamente empate' : `${nInt(Math.abs(v))} votos a favor de ${v > 0 ? 'Lula' : 'Flávio'}`);

/** Histograma dos resultados simulados; o contorno tracejado é o cenário sem ninguém impedido. */
function GraficoSimulacoes({ cen, base }) {
  const [ref, w] = useWidth();
  const H = 230, esq = 8, dir = 8, topo = 16, rodape = 52;
  const lo = Math.min(cen[0], base[0]), hi = Math.max(cen[N_SIM - 1], base[N_SIM - 1]), larg = hi - lo || 1;
  const hist = (a) => { const c = Array(BINS).fill(0); for (const v of a) c[Math.min(BINS - 1, Math.floor(((v - lo) / larg) * BINS))]++; return c; };
  const hc = hist(cen), hb = hist(base), mx = Math.max(...hc, ...hb), bw = (w - esq - dir) / BINS;
  const x = (v) => esq + ((v - lo) / larg) * (w - esq - dir), y = (n) => H - rodape - (n / mx) * (H - topo - rodape);
  const q = (p) => cen[Math.floor(p * N_SIM)];
  return (
    <div ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Resultado de ${nInt(N_SIM)} simulações do 2º turno. Caso típico: ${txtSaldo(q(0.5))}. Em 8 de cada 10 simulações, entre ${txtSaldo(q(0.1))} e ${txtSaldo(q(0.9))}.`}>
        <defs><pattern id="hachSim" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--flavio)" /><rect width="2.2" height="6" fill="var(--hachura)" /></pattern></defs>
        {hc.map((n, i) => {
          const meio = lo + ((i + 0.5) / BINS) * larg;
          return <rect key={i} x={esq + i * bw + 0.5} y={y(n)} width={Math.max(1, bw - 1)} height={H - rodape - y(n)} rx="2" fill={meio > 0 ? 'var(--lula)' : 'url(#hachSim)'}><title>{`${nInt(n)} de ${nInt(N_SIM)} simulações`}</title></rect>;
        })}
        <polyline fill="none" stroke="var(--fg)" strokeWidth="1.6" strokeDasharray="4 3" points={hb.map((n, i) => `${esq + (i + 0.5) * bw},${y(n)}`).join(' ')} />
        <line x1={esq} x2={w - dir} y1={H - rodape} y2={H - rodape} stroke="var(--line)" />
        {lo < 0 && hi > 0 && <><line x1={x(0)} x2={x(0)} y1={topo - 6} y2={H - rodape + 6} stroke="var(--fg)" strokeWidth="1.5" /><text x={x(0)} y={topo - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">empate</text></>}
        <line x1={x(q(0.5))} x2={x(q(0.5))} y1={topo + 6} y2={H - rodape} stroke="var(--fg)" strokeWidth="3" />
        <rect x={x(q(0.1))} y={H - rodape + 12} width={Math.max(2, x(q(0.9)) - x(q(0.1)))} height="6" rx="3" fill="var(--fg2)"><title>{`Em 8 de cada 10 simulações: de ${txtSaldo(q(0.1))} a ${txtSaldo(q(0.9))}`}</title></rect>
        <text x={esq} y={H - 8} fontSize="12" fill="var(--flavio)">← Flávio na frente</text>
        <text x={w - dir} y={H - 8} textAnchor="end" fontSize="12" fill="var(--lula)">Lula na frente →</text>
      </svg>
      <div className="legend">
        <span><i className="sw lula" />Lula na frente</span><span><i className="sw flavio" />Flávio na frente</span>
        <span><i className="sw" style={{ width: 4, height: 14, background: 'var(--fg)' }} />caso típico</span>
        <span><i className="sw" style={{ height: 6, background: 'var(--fg2)' }} />8 de cada 10 simulações</span>
        <span><i className="sw" style={{ height: 8, background: 'transparent', border: '1.5px dashed var(--fg)' }} />sem ninguém impedido</span>
      </div>
    </div>
  );
}

/** Exercício didático: dá a ordem de grandeza sob suposições que a pessoa escolhe. Nada aqui é previsão. */
export default function PotentialImpactExplorer() {
  const ctrl = useApi('controle'), hist = useApi('historia');
  const [impP, setImp] = useParam('imp');                           // eleitores que não conseguiriam votar (número absoluto); vazio = todos os eleitores das seções da lista mais recente
  const [prefP, setPrefP] = useParam('pref'), [compP, setCompP] = useParam('comp');
  const [ta, setTa] = useParamNum('ta', 40), [tb, setTb] = useParamNum('tb', 60);   // "outros candidatos": Lula até ta, não votam de ta a tb, Flávio de tb a 100
  const [inc, setInc] = useParamNum('inc', 4);
  const nac = ctrl.data && ctrl.data.nacional;
  const l = hist.data && hist.data.listas.find((x) => x.id === ultimaLista().id);
  const impLista = l ? l.eleitores : 0;                              // eleitores nas seções da lista mais recente: é o máximo do controle
  const MAX_IMP = Math.max(1, impLista);
  const imp = impP === '' || !Number.isFinite(Number(impP)) ? impLista : Math.min(MAX_IMP, Math.max(0, Number(impP)));
  const observado = l ? Math.round(dois(l) * 100) : 50;
  const compObs = l && l.aptosComResultado ? Math.round((l.validos / l.aptosComResultado) * 100) : 75;
  const pref = prefP === '' || !Number.isFinite(Number(prefP)) ? observado : Number(prefP);
  const comp = compP === '' || !Number.isFinite(Number(compP)) ? compObs : Number(compP);
  const a = Math.min(ta, tb), b = Math.max(ta, tb);
  const tl = a, tn = b - a, tf = 100 - b;
  const grau = inc === 0 ? 'nenhuma dúvida' : inc <= 3 ? 'pouca dúvida' : inc <= 6 ? 'dúvida média' : 'muita dúvida';

  const r = useMemo(() => {
    if (!nac) return null;
    const p = { imp, comp, pref, tl, tf, inc };
    const cen = simular(nac, p), base = simular(nac, { ...p, imp: 0 });
    const naoVotam = imp * (comp / 100), lulaPerde = naoVotam * (pref / 100), flavioPerde = naoVotam - lulaPerde;
    const q = (arr, pp) => arr[Math.floor(pp * N_SIM)];
    return { cen, base, naoVotam, lulaPerde, flavioPerde, liquido: flavioPerde - lulaPerde, p10: q(cen, 0.1), p50: q(cen, 0.5), p90: q(cen, 0.9), med0: q(base, 0.5),
      pL: cen.filter((v) => v > 0).length / N_SIM, pL0: base.filter((v) => v > 0).length / N_SIM };
  }, [nac, imp, comp, pref, tl, tf, inc]);
  if (!nac || !l || !r) return <div className="empty" role="status">Carregando…</div>;

  const maxBar = Math.max(r.lulaPerde, r.flavioPerde, 1);
  const pc = (v) => (v === 0 ? '0%' : v < 0.01 ? '< 1%' : v > 0.99 ? '> 99%' : `${Math.round(v * 100)}%`);

  return (
    <div className="impacto" aria-label="Exercício hipotético">
      <div className="imp-head"><span className="badge">Exercício hipotético · não é previsão oficial</span></div>
      <p className="note">Mexa nos controles para ver, em ordem de grandeza, o que aconteceria <em>se</em> alguns eleitores deixassem de votar. Partimos dos votos reais do 1º turno de todo o país e quem escolhe as suposições é você: o site não sabe quantos eleitores foram, de fato, afetados, nem como será o 2º turno.</p>

      <div className="imp-bloco">
        <h3 className="imp-tit">1. Quantos eleitores não conseguiriam votar?</h3>
        <output className="imp-valor">{nInt(imp)} eleitores</output>
        <input className="ctl uni" type="range" min="0" max={MAX_IMP} step="1" value={Math.min(MAX_IMP, imp)} style={{ '--p': `${(Math.min(MAX_IMP, imp) / MAX_IMP) * 100}%` }}
          onChange={(e) => setImp(Number(e.target.value))} aria-label="Eleitores que não conseguiriam votar" aria-valuetext={`${nInt(imp)} eleitores`} />
        <span className="imp-escala"><small>0</small><small>{nInt(l.eleitores)} = todos os eleitores das seções da lista mais recente</small></span>
        <button type="button" className="btn-pilula" onClick={() => setImp('')}><span aria-hidden="true">↺</span> Usar todos os eleitores da lista mais recente ({nInt(l.eleitores)})</button>
      </div>

      <div className="imp-bloco">
        <h3 className="imp-tit">2. Entre os votos que deixariam de ser depositados, quantos seriam de cada um?</h3>
        <div className="imp-split"><b className="pos">Lula {pref}%</b><b className="neg">Flávio {100 - pref}%</b></div>
        <input className="ctl duo" type="range" min="0" max="100" step="1" value={pref} style={{ '--p': `${pref}%` }} onChange={(e) => setPrefP(Number(e.target.value))}
          aria-label="Parcela dos votos perdidos que seria de Lula (o resto é de Flávio)" />
        <button type="button" className="btn-pilula" onClick={() => setPrefP('')}><span aria-hidden="true">↺</span> Usar o perfil do 1º turno nessas seções ({observado}% Lula)</button>
      </div>

      <div className="imp-bloco">
        <h3 className="imp-tit">3. Eleitores de outros candidatos no 1º turno: para quem vão no 2º?</h3>
        <div className="imp-split tres"><b className="pos">Lula {tl}%</b><b className="mudo">Não votam {tn}%</b><b className="neg">Flávio {tf}%</b></div>
        <div className="dual" style={{ '--a': `${a}%`, '--b': `${b}%` }}>
          <input className="ctl" type="range" min="0" max="100" value={a} onChange={(e) => { const v = Number(e.target.value); setTa(Math.min(v, b)); setTb(b); }} aria-label="Fim da parcela de Lula" />
          <input className="ctl" type="range" min="0" max="100" value={b} onChange={(e) => { const v = Number(e.target.value); setTb(Math.max(v, a)); setTa(a); }} aria-label="Início da parcela de Flávio" />
        </div>
        <div className="imp-escala"><small>← Lula</small><small>não votam, branco ou nulo</small><small>Flávio →</small></div>
        <button type="button" className="btn-pilula" onClick={() => { const v = 80, lv = Math.round((v * nac.lula) / (nac.lula + nac.flavio)); setTa(lv); setTb(lv + 20); }}><span aria-hidden="true">↺</span> Dividir como no 1º turno ({Math.round((nac.lula / (nac.lula + nac.flavio)) * 100)}% Lula × {Math.round((nac.flavio / (nac.lula + nac.flavio)) * 100)}% Flávio entre quem vota)</button>
        <p className="note">Os três valores sempre somam 100%: mova as duas alças para dividir.</p>
      </div>

      <details className="imp-avancado">
        <summary>Ajustes avançados (opcional)</summary>
        <div className="imp-controls">
          <label><span>De cada 100 eleitores impedidos, quantos teriam votado: <output>{comp}</output> <InfoTip texto="Nem todo eleitor listado votaria. De partida usamos o que se viu no 1º turno nessas seções (votos válidos em relação aos eleitores aptos)." /></span>
            <input className="ctl uni" type="range" min="30" max="100" value={comp} style={{ '--p': `${((comp - 30) / 70) * 100}%` }} onChange={(e) => setCompP(Number(e.target.value))} /></label>
          <label><span>O quanto você duvida dos números 2 e 3: <output>{grau}{inc ? ` (± ${inc})` : ''}</output> <InfoTip texto="Os números 2 e 3 são suposições. Esta barra diz o quanto elas poderiam estar erradas, para mais ou para menos. Quanto maior a dúvida, mais espalhado fica o resultado das simulações." /></span>
            <input className="ctl uni" type="range" min="0" max="10" value={inc} style={{ '--p': `${inc * 10}%` }} onChange={(e) => setInc(Number(e.target.value))} /></label>
        </div>
      </details>

      <div className="imp-out" aria-live="polite">
        <h3 className="imp-tit">O que isso significa</h3>
        <p className="imp-eq"><strong>{nInt(imp)}</strong> eleitores impedidos → cerca de <strong>{nInt(r.naoVotam)}</strong> votos deixariam de ser depositados <span>(com comparecimento de {comp}%)</span>.</p>
        <div className="imp-bars">
          <div><span>Lula</span><i className="seg lula" style={{ width: `${(r.lulaPerde / maxBar) * 100}%` }} /><b>−{nInt(r.lulaPerde)}</b></div>
          <div><span>Flávio</span><i className="seg flavio" style={{ width: `${(r.flavioPerde / maxBar) * 100}%` }} /><b>−{nInt(r.flavioPerde)}</b></div>
        </div>
        <p className="imp-liq">No saldo, a diferença entre os candidatos mudaria em <strong>{nInt(Math.abs(r.liquido))} votos</strong>{Math.abs(r.liquido) < 0.5 ? ' (efeito neutro)' : r.liquido > 0 ? ' a favor de Lula (Flávio perderia mais votos).' : ' a favor de Flávio Bolsonaro (Lula perderia mais votos).'}</p>
      </div>

      <div className="imp-out" aria-live="polite">
        <h3 className="imp-tit">E o 2º turno, com essas suposições?</h3>
        <p className="note">Rodamos {nInt(N_SIM)} simulações do 2º turno a partir dos votos do 1º turno, cada uma com pequenas variações dentro da dúvida que você escolheu. Cada barra mostra em quantas simulações aquele resultado apareceu.</p>
        <div className="imp-kpis">
          <div className="kpi"><span>Chance de Lula vencer</span><b className="pos">{pc(r.pL)}</b><small>{imp ? `sem impedidos: ${pc(r.pL0)}` : 'sem eleitores impedidos'}</small></div>
          <div className="kpi"><span>Chance de Flávio vencer</span><b className="neg">{pc(1 - r.pL)}</b><small>{imp ? `sem impedidos: ${pc(1 - r.pL0)}` : 'sem eleitores impedidos'}</small></div>
          <div className="kpi"><span>Diferença típica</span><b>{Math.abs(r.p50) < 500 ? 'empate' : nInt(Math.abs(r.p50))}</b><small>{Math.abs(r.p50) < 500 ? 'praticamente' : `votos a favor de ${r.p50 > 0 ? 'Lula' : 'Flávio'}`}{imp ? ` · seu cenário desloca ${nInt(Math.abs(r.p50 - r.med0))}` : ''}</small></div>
        </div>
        {inc === 0 && <p className="note">Sem dúvida nenhuma, todas as simulações dão o mesmo resultado. Aumente a dúvida (ajustes avançados) para ver como o resultado se espalha.</p>}
        <GraficoSimulacoes cen={r.cen} base={r.base} />
        <p className="imp-liq">
          Em 8 de cada 10 simulações, o resultado ficou entre <strong>{txtSaldo(r.p10)}</strong> e <strong>{txtSaldo(r.p90)}</strong>.
          {imp > 0 && <> Os <strong>{nInt(imp)}</strong> eleitores impedidos mudam a chance de Lula de <strong>{pc(r.pL0)}</strong> para <strong>{pc(r.pL)}</strong>.</>}
        </p>
        <p className="note">Base: votos do 1º turno de todas as seções do país (TSE): Lula {nInt(nac.lula)} · Flávio {nInt(nac.flavio)} · outros candidatos {nInt(nac.outros)}. Brancos e nulos ficam de fora. Os números mostram o efeito das suas suposições; não são uma previsão do resultado.</p>
      </div>

      <ul className="imp-notas">
        <li>Tudo isto é <strong>hipotético</strong>: depende das suposições escolhidas e não é uma previsão.</li>
        <li>Os votos do 1º turno servem só para estimar o perfil das seções; não são votos do 2º turno.</li>
        <li>As listas podem conter registros que foram corrigidos depois.</li>
      </ul>
    </div>
  );
}
