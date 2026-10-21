import { useMemo } from 'react';
import { useApi } from '../api.js';
import { useParam, useParamNum } from '../router.js';
import { nInt, nPct } from '../format.js';
import { InfoTip } from './ui.jsx';
import { useWidth } from './Charts.jsx';
import { ehUltima } from '../listas.js';

const dois = (l) => (l.lula + l.flavio ? l.lula / (l.lula + l.flavio) : 0.5);

// Simulações: sorteamos 4.000 combinações de "quantos votariam" e "quantos votariam em Lula" em torno dos valores escolhidos.
// Os sorteios (normais padrão) são gerados uma vez, com semente fixa: o resultado é o mesmo a cada visita e o gráfico não "pisca" ao mexer nos controles.
const N_SIM = 4000;
const SORTEIOS = (() => {
  let s = 20261020;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const normal = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  return Array.from({ length: N_SIM }, () => [normal(), normal()]);
})();
const limita = (v) => Math.min(100, Math.max(0, v));
const BINS = 32;

/** Histograma dos saldos simulados: à direita, os casos em que Flávio perderia mais votos (favorece Lula); à esquerda, o inverso. */
function GraficoSimulacoes({ saldos, p10, p50, p90 }) {
  const [ref, w] = useWidth();
  const lo = saldos[0], hi = saldos[saldos.length - 1], esq = 8, dir = 8, topo = 14, base = 44, H = 200;
  const eixoLo = Math.min(lo, 0), eixoHi = Math.max(hi, 0), larg = eixoHi - eixoLo || 1;
  const x = (v) => esq + ((v - eixoLo) / larg) * (w - esq - dir);
  const bins = Array.from({ length: BINS }, () => 0);
  for (const v of saldos) bins[Math.min(BINS - 1, Math.floor(((v - eixoLo) / larg) * BINS))]++;
  const max = Math.max(...bins), bw = (w - esq - dir) / BINS;
  const txt = (v) => (Math.abs(v) < 0.5 ? 'efeito nulo' : `${nInt(Math.abs(v))} votos a favor de ${v > 0 ? 'Lula' : 'Flávio'}`);
  return (
    <div ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Resultado de ${nInt(N_SIM)} simulações. Caso típico: ${txt(p50)}. Em 8 de cada 10 simulações, entre ${txt(p10)} e ${txt(p90)}.`}>
        <defs><pattern id="hachSim" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--flavio)" /><rect width="2.2" height="6" fill="var(--hachura)" /></pattern></defs>
        {bins.map((n, i) => {
          const v0 = eixoLo + (i / BINS) * larg, v1 = eixoLo + ((i + 1) / BINS) * larg, h = (n / max) * (H - topo - base), meio = (v0 + v1) / 2;
          return <rect key={i} x={esq + i * bw + 0.5} y={H - base - h} width={Math.max(1, bw - 1)} height={h} rx="2" fill={meio >= 0 ? 'var(--lula)' : 'url(#hachSim)'}><title>{`${nInt(n)} de ${nInt(N_SIM)} simulações deram entre ${txt(v0)} e ${txt(v1)}`}</title></rect>;
        })}
        <line x1={esq} x2={w - dir} y1={H - base} y2={H - base} stroke="var(--line)" />
        <line x1={x(0)} x2={x(0)} y1={topo - 4} y2={H - base + 6} stroke="var(--fg)" strokeDasharray="4 3" />
        <text x={x(0)} y={topo - 5} textAnchor="middle" fontSize="11" fill="var(--muted)">sem efeito</text>
        <line x1={x(p50)} x2={x(p50)} y1={topo + 6} y2={H - base} stroke="var(--fg)" strokeWidth="3" />
        <rect x={x(p10)} y={H - base + 12} width={Math.max(2, x(p90) - x(p10))} height="6" rx="3" fill="var(--fg2)"><title>{`Em 8 de cada 10 simulações: de ${txt(p10)} a ${txt(p90)}`}</title></rect>
        <text x={esq} y={H - 8} fontSize="11.5" fill="var(--flavio)">← favorece Flávio</text>
        <text x={w - dir} y={H - 8} textAnchor="end" fontSize="11.5" fill="var(--lula)">favorece Lula →</text>
      </svg>
      <div className="legend"><span><i className="sw" style={{ background: 'var(--fg)', height: 14, width: 4 }} /> caso típico</span><span><i className="sw" style={{ background: 'var(--fg2)', height: 6 }} /> onde ficaram 8 de cada 10 simulações</span></div>
    </div>
  );
}

/** Exercício didático: dá a ordem de grandeza sob suposições que a pessoa escolhe. Nada aqui é previsão. */
export default function PotentialImpactExplorer({ listas }) {
  const [id, setId] = useParamNum('il', listas[listas.length - 1].id);
  const l = listas.find((x) => x.id === id) || listas[0];
  const observado = Math.round(dois(l) * 100);
  const compObs = l.aptosComResultado ? Math.round((l.validos / l.aptosComResultado) * 100) : 75;
  // as escolhas ficam na URL (il = lista, imp, pref, comp, nac, inc); pref e comp vazios = usar o que se viu no 1º turno
  const [imp, setImp] = useParamNum('imp', 10);
  const [prefP, setPrefP] = useParam('pref'), [compP, setCompP] = useParam('comp');
  const pref = prefP === '' || !Number.isFinite(Number(prefP)) ? null : Number(prefP), setPref = (v) => setPrefP(v == null ? '' : v);
  const comp = compP === '' || !Number.isFinite(Number(compP)) ? null : Number(compP), setComp = (v) => setCompP(v == null ? '' : v);
  const [nac, setNac] = useParam('nac');
  const ctrl = useApi('controle');   // só para o total nacional de votos do 1º turno
  const [inc, setInc] = useParamNum('inc', 10);   // quanto as suposições podem estar erradas, em pontos percentuais
  const prefEf = pref ?? observado, compEf = comp ?? compObs;
  const maxImp = Math.round(l.eleitores * 0.5), passo = Math.max(1, Math.round(l.eleitores / 400));
  const nDec = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const grau = inc === 0 ? 'nenhuma dúvida' : inc <= 5 ? 'pouca dúvida' : inc <= 12 ? 'dúvida média' : 'muita dúvida';

  const r = useMemo(() => {
    const impedidos = l.eleitores * (imp / 100);
    const naoVotam = impedidos * (compEf / 100);
    const lulaPerde = naoVotam * (prefEf / 100), flavioPerde = naoVotam - lulaPerde;
    // 4.000 simulações: o comparecimento e a parcela de Lula variam ao redor dos valores escolhidos (90% dos sorteios dentro de ± inc pontos)
    const dp = inc / 1.645;
    const saldos = SORTEIOS.map(([zc, zp]) => impedidos * (limita(compEf + dp * zc) / 100) * (1 - 2 * (limita(prefEf + dp * zp) / 100))).sort((a, b) => a - b);
    const q = (p) => saldos[Math.min(N_SIM - 1, Math.floor(p * N_SIM))];
    return { impedidos, naoVotam, lulaPerde, flavioPerde, liquido: flavioPerde - lulaPerde, saldos, p10: q(0.1), p50: q(0.5), p90: q(0.9),
      favLula: saldos.filter((v) => v > 0.5).length / N_SIM, favFlavio: saldos.filter((v) => v < -0.5).length / N_SIM };
  }, [l, imp, prefEf, compEf, inc]);
  const nacional = Number(String(nac).replace(/\./g, '').replace(',', '.')) || 0;
  const maxBar = Math.max(r.lulaPerde, r.flavioPerde, 1);
  const saldoTxt = (v) => (Math.abs(v) < 0.5 ? 'efeito nulo' : `${nInt(Math.abs(v))} votos a favor de ${v > 0 ? 'Lula' : 'Flávio Bolsonaro'}`);
  const de10 = (p) => Math.round(p * 10);
  const nacL = ctrl.data?.nacional?.lula, nacF = ctrl.data?.nacional?.flavio, diff1 = nacL != null ? nacL - nacF : null;
  // quantas simulações têm saldo, na direção do candidato que está à frente, maior que a diferença nacional do 1º turno
  const contra = diff1 == null ? 0 : r.saldos.filter((v) => (diff1 > 0 ? -v : v) > Math.abs(diff1)).length / N_SIM;
  const pctSim = (p) => (p === 0 ? 'nenhuma' : p < 0.01 ? 'menos de 1%' : nPct(p, 0));

  return (
    <div className="impacto" aria-label="Exercício hipotético">
      <div className="imp-head"><span className="badge">Exercício hipotético · não é previsão</span></div>
      <p className="note">Mexa nos controles abaixo para ver, em ordem de grandeza, o que aconteceria <em>se</em> alguns eleitores listados deixassem de votar. Quem decide as suposições é você: o site não sabe quantos eleitores foram, de fato, afetados.</p>
      <div className="imp-controls">
        <label>1. Qual lista usar
          <select value={id} onChange={(e) => { setId(Number(e.target.value)); setPref(null); setComp(null); }}>
            {listas.map((x) => <option key={x.id} value={x.id}>{ehUltima(x.id) ? `${x.nome} (mais recente)` : x.nome} — {nInt(x.eleitores)} eleitores</option>)}
          </select>
        </label>
        <label>
          <span>2. Quantos desses eleitores <strong>não conseguiriam votar</strong>: <output>{nInt(r.impedidos)} <small>({nDec(imp)}% de {nInt(l.eleitores)})</small></output></span>
          <input type="range" min="0" max={maxImp} step={passo} value={Math.min(maxImp, Math.round(r.impedidos / passo) * passo)} onChange={(e) => setImp(Math.round((Number(e.target.value) / l.eleitores) * 1000) / 10)}
            aria-label="Número de eleitores que não conseguiriam votar" aria-valuetext={`${nInt(r.impedidos)} eleitores, ${nDec(imp)}% dos listados`} />
          <span className="imp-escala"><small>0</small><small>{nInt(maxImp)} (metade)</small></span>
        </label>
        <label>
          <span>3. De cada 100 desses eleitores, quantos <strong>teriam votado</strong>: <output>{compEf}</output> <InfoTip texto="Nem todo eleitor listado votaria. De partida usamos o que se viu no 1º turno nessas seções (votos válidos em relação aos eleitores aptos). Não inclui brancos e nulos, e o 2º turno pode ter outro comparecimento." /></span>
          <input type="range" min="30" max="100" step="1" value={compEf} onChange={(e) => setComp(Number(e.target.value))} />
          <button type="button" className="linklike" onClick={() => setComp(null)}>Usar o do 1º turno nesta lista ({compObs})</button>
        </label>
        <label>
          <span>4. De cada 100 votos perdidos, quantos seriam de <strong>Lula</strong>: <output>{prefEf}</output> <small>(o resto seria de Flávio Bolsonaro)</small></span>
          <input type="range" min="0" max="100" step="1" value={prefEf} onChange={(e) => setPref(Number(e.target.value))} />
          <button type="button" className="linklike" onClick={() => setPref(null)}>Usar o do 1º turno nesta lista ({observado})</button>
        </label>
        <label>
          <span>5. O quanto você <strong>duvida</strong> dos números 3 e 4: <output>{inc === 0 ? grau : `${grau} (± ${inc})`}</output> <InfoTip texto="Os números 3 e 4 são chutes educados. Esta barra diz o quanto eles poderiam estar errados, para mais ou para menos. Quanto maior a dúvida, mais espalhado fica o resultado das simulações." /></span>
          <input type="range" min="0" max="30" step="1" value={inc} onChange={(e) => setInc(Number(e.target.value))} />
        </label>
      </div>

      <div className="imp-out" aria-live="polite">
        <h3 className="imp-tit">O que isso significa</h3>
        <p className="imp-eq">Se <strong>{nInt(r.impedidos)}</strong> eleitores não conseguissem votar e {compEf} de cada 100 deles votariam normalmente, cerca de <strong>{nInt(r.naoVotam)}</strong> votos deixariam de ser depositados.</p>
        <div className="imp-bars">
          <div><span>Lula</span><i className="seg lula" style={{ width: `${(r.lulaPerde / maxBar) * 100}%` }} /><b>−{nInt(r.lulaPerde)}</b></div>
          <div><span>Flávio</span><i className="seg flavio" style={{ width: `${(r.flavioPerde / maxBar) * 100}%` }} /><b>−{nInt(r.flavioPerde)}</b></div>
        </div>
        <p className="imp-liq">No saldo, a diferença entre os dois candidatos mudaria em cerca de <strong>{nInt(Math.abs(r.liquido))} votos</strong>{r.liquido === 0 ? ' (efeito neutro)' : r.liquido > 0 ? ', a favor de Lula (Flávio perderia mais votos).' : ', a favor de Flávio Bolsonaro (Lula perderia mais votos).'}</p>
      </div>

      <div className="imp-out" aria-live="polite">
        <h3 className="imp-tit">E se os números 3 e 4 estiverem errados?</h3>
        <p className="note">Como ninguém sabe os números exatos, rodamos {nInt(N_SIM)} simulações, cada uma com um comparecimento e uma divisão entre Lula e Flávio um pouco diferentes, dentro da dúvida que você escolheu. Cada barra abaixo mostra em quantas simulações aquele resultado apareceu.</p>
        {inc === 0
          ? <p className="imp-liq">Sem dúvida nenhuma, todas as simulações dão o mesmo resultado: {saldoTxt(r.liquido)}. Aumente a dúvida (controle 5) para ver como o resultado se espalha.</p>
          : (
            <>
              <GraficoSimulacoes saldos={r.saldos} p10={r.p10} p50={r.p50} p90={r.p90} />
              <p className="imp-liq">
                Em 8 de cada 10 simulações, o efeito ficou entre <strong>{saldoTxt(r.p10)}</strong> e <strong>{saldoTxt(r.p90)}</strong>.{' '}
                {r.p10 * r.p90 > 0 ? `Em todos esses casos o efeito foi no mesmo sentido.` : 'Dependendo das suposições, o efeito poderia até mudar de lado.'}
                {' '}Em {de10(r.favLula)} de cada 10 simulações o saldo favoreceu Lula; em {de10(r.favFlavio)}, Flávio.
              </p>
            </>
          )}
        <h3 className="imp-tit">Isso pesaria na diferença nacional?</h3>
        {diff1 != null && (
          <p className="imp-liq">
            No 1º turno, no país todo, {diff1 > 0 ? 'Lula' : 'Flávio Bolsonaro'} ficou à frente por <strong>{nInt(Math.abs(diff1))} votos</strong> ({nInt(nacL)} contra {nInt(nacF)}).
            O saldo típico desta simulação ({nInt(Math.abs(r.p50))} votos {r.p50 > 0 ? 'para Lula' : 'para Flávio'}) equivale a <strong>{nPct(Math.abs(r.p50) / Math.abs(diff1), 2)}</strong> dessa diferença.
            {inc > 0 && <> Em {pctSim(contra)} das simulações o efeito foi grande o bastante para {diff1 > 0 ? 'passar a vantagem de Lula' : 'passar a vantagem de Flávio'} no 1º turno, <em>mantendo todo o resto igual</em>.</>}
          </p>
        )}
        <label className="nac">Prefere comparar com outra diferença, por exemplo a que você espera no 2º turno? <input inputMode="numeric" placeholder="Ex.: 1.500.000" value={nac} onChange={(e) => setNac(e.target.value)} aria-label="Outra diferença de votos entre os candidatos (opcional)" /></label>
        {nacional > 0 && <p className="imp-nac">Com estas suposições, o saldo típico de {nInt(Math.abs(r.p50))} votos equivale a <strong>{nPct(Math.abs(r.p50) / nacional, 2)}</strong> da diferença que você informou, e o saldo desta simulação central ({nInt(Math.abs(r.liquido))}) a {nPct(Math.abs(r.liquido) / nacional, 2)}. O valor foi digitado por você; o site não sabe qual será a diferença do 2º turno.</p>}
        <p className="note">É uma comparação de tamanho, não uma previsão do 2º turno: a diferença final dependerá de quem votar, em quem, e de muito mais do que as seções listadas.</p>
      </div>

      <ul className="imp-notas">
        <li>Tudo isto é <strong>hipotético</strong>: depende das suposições escolhidas e não é uma previsão.</li>
        <li>Os votos do 1º turno servem só para estimar o perfil das seções; não são votos do 2º turno.</li>
        <li>Usamos os eleitores de <em>uma</em> lista por vez, para ninguém ser contado duas vezes.</li>
        <li>As listas podem conter registros que foram corrigidos depois.</li>
      </ul>
    </div>
  );
}
