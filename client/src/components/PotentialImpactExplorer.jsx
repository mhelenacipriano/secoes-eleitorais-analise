import { useMemo } from 'react';
import { useParam, useParamNum } from '../router.js';
import { nInt, nPct } from '../format.js';
import { InfoTip } from './ui.jsx';
import { ULTIMA } from '../config.js';

const dois = (l) => (l.lula + l.flavio ? l.lula / (l.lula + l.flavio) : 0.5);

/** Faixa do efeito líquido sob a incerteza escolhida: à direita, Flávio perderia mais votos (efeito a favor de Lula); à esquerda, Lula perderia mais (a favor de Flávio). A marca escura é o cenário central. */
function FaixaIncerteza({ r, inc }) {
  const [lo, hi] = r.faixa, central = r.liquido, lim = Math.max(Math.abs(lo), Math.abs(hi), Math.abs(central), 1);
  const pos = (v) => `${50 + (v / lim) * 50}%`;
  const txt = (v) => (Math.abs(v) < 0.5 ? 'efeito nulo' : `${nInt(Math.abs(v))} votos a favor de ${v > 0 ? 'Lula' : 'Flávio'}`);
  const mesmoSinal = lo * hi > 0;
  return (
    <div className="faixa" aria-live="polite">
      <div className="faixa-barra" role="img" aria-label={`Efeito líquido central: ${txt(central)}. Faixa sob incerteza de ${inc} pontos: de ${txt(lo)} a ${txt(hi)}.`}>
        <i className="faixa-zero" />
        <i className="faixa-intervalo" style={{ left: pos(lo), width: `${((hi - lo) / lim) * 50}%` }} />
        <i className="faixa-central" style={{ left: pos(central) }} />
      </div>
      <div className="faixa-eixo"><span>← Lula perderia mais votos</span><span>Flávio perderia mais votos →</span></div>
      <p className="note">Com incerteza de ± {inc} pontos no comparecimento ({Math.round(r.cLo)}% a {Math.round(r.cHi)}%) e no perfil ({Math.round(r.pLo)}% a {Math.round(r.pHi)}% de Lula), o efeito líquido iria de <strong>{txt(lo)}</strong> a <strong>{txt(hi)}</strong>{mesmoSinal ? ', sempre no mesmo sentido' : ', podendo mudar de sentido'}. É uma faixa de sensibilidade da simulação, não uma margem de erro estatística nem uma previsão.</p>
    </div>
  );
}

/** Simulação didática: mostra a ordem de grandeza sob premissas explícitas. Nada aqui é previsão. */
export default function PotentialImpactExplorer({ listas }) {
  const [id, setId] = useParamNum('il', listas[listas.length - 1].id);
  const l = listas.find((x) => x.id === id) || listas[0];
  const observado = Math.round(dois(l) * 100);
  const compObs = l.aptosComResultado ? Math.round((l.validos / l.aptosComResultado) * 100) : 75;
  // as premissas do cenário ficam na URL (il = lista, imp, pref, comp, nac); pref e comp vazios = usar o perfil observado
  const [imp, setImp] = useParamNum('imp', 10);
  const [prefP, setPrefP] = useParam('pref'), [compP, setCompP] = useParam('comp');
  const pref = prefP === '' || !Number.isFinite(Number(prefP)) ? null : Number(prefP), setPref = (v) => setPrefP(v == null ? '' : v);
  const comp = compP === '' || !Number.isFinite(Number(compP)) ? null : Number(compP), setComp = (v) => setCompP(v == null ? '' : v);
  const [nac, setNac] = useParam('nac');
  const [inc, setInc] = useParamNum('inc', 10);   // incerteza das premissas, em pontos percentuais (± sobre comparecimento e perfil)
  const prefEf = pref ?? observado, compEf = comp ?? compObs;
  const maxImp = Math.round(l.eleitores * 0.5), passo = Math.max(1, Math.round(l.eleitores / 400));
  const nDec = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  const r = useMemo(() => {
    const impedidos = l.eleitores * (imp / 100);
    const naoVotam = impedidos * (compEf / 100);
    const lulaPerde = naoVotam * (prefEf / 100), flavioPerde = naoVotam - lulaPerde;
    // faixa de sensibilidade: o efeito líquido varia de forma monótona com o comparecimento e com o perfil, então os extremos estão nos cantos
    const liq = (c, pr) => impedidos * (c / 100) * (1 - 2 * (pr / 100));
    const cLo = Math.max(0, compEf - inc), cHi = Math.min(100, compEf + inc), pLo = Math.max(0, prefEf - inc), pHi = Math.min(100, prefEf + inc);
    const cantos = [liq(cLo, pLo), liq(cLo, pHi), liq(cHi, pLo), liq(cHi, pHi)];
    return { impedidos, naoVotam, lulaPerde, flavioPerde, liquido: flavioPerde - lulaPerde, faixa: [Math.min(...cantos), Math.max(...cantos)], cLo, cHi, pLo, pHi };
  }, [l, imp, prefEf, compEf, inc]);
  const nacional = Number(String(nac).replace(/\./g, '').replace(',', '.')) || 0;
  const maxBar = Math.max(r.lulaPerde, r.flavioPerde, 1);

  return (
    <div className="impacto" aria-label="Simulação hipotética">
      <div className="imp-head"><span className="badge">Cenário hipotético · não é previsão</span></div>
      <div className="imp-controls">
        <label>Lista de seções
          <select value={id} onChange={(e) => { setId(Number(e.target.value)); setPref(null); setComp(null); }}>
            {listas.map((x) => <option key={x.id} value={x.id}>{x.id === ULTIMA.id ? `${x.nome} (mais recente)` : x.nome} — {nInt(x.eleitores)} eleitores</option>)}
          </select>
        </label>
        <label>
          <span>Quantos eleitores listados <strong>não conseguiriam votar</strong>: <output>{nInt(r.impedidos)} <small>({nDec(imp)}% de {nInt(l.eleitores)})</small></output></span>
          <input type="range" min="0" max={maxImp} step={passo} value={Math.min(maxImp, Math.round(r.impedidos / passo) * passo)} onChange={(e) => setImp(Math.round((Number(e.target.value) / l.eleitores) * 1000) / 10)}
            aria-label="Número de eleitores que não conseguiriam votar" aria-valuetext={`${nInt(r.impedidos)} eleitores, ${nDec(imp)}% dos listados`} />
          <span className="imp-escala"><small>0</small><small>{nInt(maxImp)} (50%)</small></span>
        </label>
        <label>
          <span>Entre os votos que deixariam de ser depositados, parcela que seria de <strong>Lula</strong>: <output>{prefEf}%</output> <small>(o restante seria de Flávio Bolsonaro)</small></span>
          <input type="range" min="0" max="100" step="1" value={prefEf} onChange={(e) => setPref(Number(e.target.value))} />
          <button type="button" className="linklike" onClick={() => setPref(null)}>Usar o perfil do 1º turno nesta lista ({observado}%)</button>
        </label>
        <label>
          <span>Incerteza das premissas: <output>± {inc} pontos</output> <InfoTip texto="Quanto o comparecimento e a parcela de Lula podem variar para cima ou para baixo. Não é uma margem de erro estatística: mostra o quanto o resultado da simulação muda se as premissas estiverem erradas." /></span>
          <input type="range" min="0" max="30" step="1" value={inc} onChange={(e) => setInc(Number(e.target.value))} />
        </label>
        <label>
          <span>Comparecimento assumido entre os impedidos: <output>{compEf}%</output> <InfoTip texto="Nem todo eleitor listado votaria. Como ponto de partida usamos votos válidos ÷ eleitores aptos do 1º turno nas seções com resultado. É uma aproximação: não inclui brancos e nulos, e o 2º turno pode ter outro comparecimento." /></span>
          <input type="range" min="30" max="100" step="1" value={compEf} onChange={(e) => setComp(Number(e.target.value))} />
        </label>
      </div>

      <div className="imp-out" aria-live="polite">
        <p className="imp-eq"><strong>{nInt(r.impedidos)}</strong> eleitores impedidos <span>(= {nDec(imp)}% de {nInt(l.eleitores)})</span> → cerca de <strong>{nInt(r.naoVotam)}</strong> votos deixariam de ser depositados <span>(com comparecimento de {compEf}%)</span>.</p>
        <div className="imp-bars">
          <div><span>Lula</span><i className="seg lula" style={{ width: `${(r.lulaPerde / maxBar) * 100}%` }} /><b>−{nInt(r.lulaPerde)}</b></div>
          <div><span>Flávio</span><i className="seg flavio" style={{ width: `${(r.flavioPerde / maxBar) * 100}%` }} /><b>−{nInt(r.flavioPerde)}</b></div>
        </div>
        <p className="imp-liq">Efeito líquido: a diferença entre os candidatos mudaria em <strong>{nInt(Math.abs(r.liquido))} votos</strong>{r.liquido === 0 ? ' (efeito neutro)' : r.liquido > 0 ? ' a favor de Lula (Flávio perderia mais votos)' : ' a favor de Flávio Bolsonaro (Lula perderia mais votos)'}.</p>
        <FaixaIncerteza r={r} inc={inc} />
        <label className="nac">Quer comparar com a diferença oficial de votos entre os dois candidatos? <input inputMode="numeric" placeholder="Ex.: informe o total verificado" value={nac} onChange={(e) => setNac(e.target.value)} aria-label="Diferença nacional de votos (opcional)" /></label>
        {nacional > 0 && <p className="imp-nac">Sob estas premissas, o efeito líquido ({nInt(Math.abs(r.liquido))} votos) equivale a <strong>{nPct(Math.abs(r.liquido) / nacional, 2)}</strong> da diferença informada. Este site não contém totais nacionais verificados; o valor foi digitado por você.</p>}
        {!nacional && <p className="note">Os dados deste site cobrem só as seções listadas, sem o total nacional de votos. Por isso não calculamos o efeito na margem nacional nem apontamos um vencedor.</p>}
      </div>

      <ul className="imp-notas">
        <li>Todos os números acima são <strong>hipotéticos</strong>, dependem das premissas escolhidas e não são previsões.</li>
        <li>Os votos do 1º turno são usados só para estimar o perfil das seções; não são votos do 2º turno.</li>
        <li>Nem todo eleitor listado votaria, e a mesma pessoa não é contada duas vezes: usamos os eleitores de <em>uma</em> lista por vez.</li>
        <li>As listas podem conter registros que foram corrigidos ou reclassificados depois.</li>
      </ul>
    </div>
  );
}
