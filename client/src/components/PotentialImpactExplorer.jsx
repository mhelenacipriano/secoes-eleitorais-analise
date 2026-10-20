import { useMemo, useState } from 'react';
import { nInt, nPct } from '../format.js';
import { InfoTip } from './ui.jsx';

const dois = (l) => (l.lula + l.flavio ? l.lula / (l.lula + l.flavio) : 0.5);

/** Simulação didática: mostra a ordem de grandeza sob premissas explícitas. Nada aqui é previsão. */
export default function PotentialImpactExplorer({ listas }) {
  const [id, setId] = useState(listas[listas.length - 1].id);
  const l = listas.find((x) => x.id === id) || listas[0];
  const observado = Math.round(dois(l) * 100);
  const compObs = l.aptosComResultado ? Math.round((l.validos / l.aptosComResultado) * 100) : 75;
  const [imp, setImp] = useState(10);
  const [pref, setPref] = useState(null);
  const [comp, setComp] = useState(null);
  const [nac, setNac] = useState('');
  const prefEf = pref ?? observado, compEf = comp ?? compObs;

  const r = useMemo(() => {
    const impedidos = l.eleitores * (imp / 100);
    const naoVotam = impedidos * (compEf / 100);
    const lulaPerde = naoVotam * (prefEf / 100), flavioPerde = naoVotam - lulaPerde;
    return { impedidos, naoVotam, lulaPerde, flavioPerde, liquido: flavioPerde - lulaPerde };
  }, [l, imp, prefEf, compEf]);
  const nacional = Number(String(nac).replace(/\./g, '').replace(',', '.')) || 0;
  const maxBar = Math.max(r.lulaPerde, r.flavioPerde, 1);

  return (
    <div className="impacto" aria-label="Simulação hipotética">
      <div className="imp-head"><span className="badge">Cenário hipotético · não é previsão</span></div>
      <div className="imp-controls">
        <label>Lista de seções
          <select value={id} onChange={(e) => { setId(Number(e.target.value)); setPref(null); setComp(null); }}>
            {listas.map((x) => <option key={x.id} value={x.id}>{x.id === 4 ? 'Painel do TSE (mais recente)' : x.nome} — {nInt(x.eleitores)} eleitores</option>)}
          </select>
        </label>
        <label>
          <span>Parcela dos eleitores listados que <strong>não conseguiria votar</strong>: <output>{imp}%</output></span>
          <input type="range" min="0" max="50" step="1" value={imp} onChange={(e) => setImp(Number(e.target.value))} />
        </label>
        <label>
          <span>Entre os votos que deixariam de ser depositados, parcela que seria de <strong>Lula</strong>: <output>{prefEf}%</output> <small>(o restante seria de Flávio Bolsonaro)</small></span>
          <input type="range" min="0" max="100" step="1" value={prefEf} onChange={(e) => setPref(Number(e.target.value))} />
          <button type="button" className="linklike" onClick={() => setPref(null)}>Usar o perfil do 1º turno nesta lista ({observado}%)</button>
        </label>
        <label>
          <span>Comparecimento assumido entre os impedidos: <output>{compEf}%</output> <InfoTip texto="Nem todo eleitor listado votaria. Como ponto de partida usamos votos válidos ÷ eleitores aptos do 1º turno nas seções com resultado. É uma aproximação: não inclui brancos e nulos, e o 2º turno pode ter outro comparecimento." /></span>
          <input type="range" min="30" max="100" step="1" value={compEf} onChange={(e) => setComp(Number(e.target.value))} />
        </label>
      </div>

      <div className="imp-out" aria-live="polite">
        <p className="imp-eq"><strong>{nInt(r.impedidos)}</strong> eleitores impedidos <span>(= {imp}% de {nInt(l.eleitores)})</span> → cerca de <strong>{nInt(r.naoVotam)}</strong> votos deixariam de ser depositados <span>(com comparecimento de {compEf}%)</span>.</p>
        <div className="imp-bars">
          <div><span>Lula</span><i className="seg lula" style={{ width: `${(r.lulaPerde / maxBar) * 100}%` }} /><b>−{nInt(r.lulaPerde)}</b></div>
          <div><span>Flávio</span><i className="seg flavio" style={{ width: `${(r.flavioPerde / maxBar) * 100}%` }} /><b>−{nInt(r.flavioPerde)}</b></div>
        </div>
        <p className="imp-liq">Efeito líquido: a diferença entre os candidatos mudaria em <strong>{nInt(Math.abs(r.liquido))} votos</strong>{r.liquido === 0 ? ' (efeito neutro)' : r.liquido > 0 ? ' a favor de Lula (Flávio perderia mais votos)' : ' a favor de Flávio Bolsonaro (Lula perderia mais votos)'}.</p>
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
