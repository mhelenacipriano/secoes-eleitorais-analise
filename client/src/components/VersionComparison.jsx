import { useRef, useState } from 'react';
import { nInt, nPts, nSig } from '../format.js';
import { BarraCandidatos, Legenda } from './ui.jsx';

const FRASE = (l, t, anterior) => {
  if (!t) return 'Esta é a primeira lista publicada. As demais são comparadas com ela.';
  const quando = '';
  const dm = l.margem - anterior.margem;
  return `Em relação à lista de ${anterior.label}${quando}, saíram ${nInt(t.removidas.secoes)} seções e entraram ${nInt(t.adicionadas.secoes)}. `
    + `A margem de Lula dentro da lista foi de ${nPts(anterior.margem)} para ${nPts(l.margem)} (${nPts(dm)}) — uma mudança de composição, não de votos.`;
};

export default function VersionComparison({ lista, transicao, anterior, onSwipe }) {
  const [detalhes, setDetalhes] = useState(false);
  const toque = useRef(0);
  const l = lista;
  return (
    <div className="vcomp"
      onTouchStart={(e) => (toque.current = e.changedTouches[0].clientX)}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - toque.current; if (Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1); }}>
      <div className="vc-top">
        <div>
          <p className="vc-kicker">{l.id === 4 ? 'Versão de 20/10 às 13h59 (mais recente)' : `Versão de ${l.label.replace(' · ', ' às ')}`}</p>
          <p className="vc-big"><strong>{nInt(l.secoes)}</strong> seções</p>
        </div>
        <div>
          <p className="vc-kicker">Eleitores afetados</p>
          <p className="vc-big"><strong>{nInt(l.eleitores)}</strong></p>
          <p className="note">eleitores aptos registrados na lista</p>
        </div>
      </div>
      <Legenda />
      <BarraCandidatos lula={l.lulaPct} flavio={l.flavioPct} outros={l.outrosPct} />
      <p className="vc-margem">Dentro desta lista, no 1º turno: <strong className={l.margem >= 0 ? 'pos' : 'neg'}>{l.margem >= 0 ? 'Lula' : 'Flávio'} {nPts(Math.abs(l.margem)).replace('−', '+')}</strong> de diferença nos votos válidos.</p>
      <p className="vc-texto">{FRASE(l, transicao, anterior)}</p>
      <button className="btn" aria-expanded={detalhes} onClick={() => setDetalhes((d) => !d)}>{detalhes ? 'Ocultar detalhes' : 'Ver detalhes'}</button>
      {detalhes && (
        <dl className="detalhes">
          <div><dt>Votos válidos de Lula</dt><dd>{nInt(l.lula)}</dd></div>
          <div><dt>Votos válidos de Flávio</dt><dd>{nInt(l.flavio)}</dd></div>
          <div><dt>Votos válidos (total)</dt><dd>{nInt(l.validos)}</dd></div>
          <div><dt>Eleitores aptos no 1º turno</dt><dd>{nInt(l.aptos)}</dd></div>
          <div><dt>Municípios · estados</dt><dd>{nInt(l.municipios)} · {nInt(l.ufs)}</dd></div>
          <div><dt>Seções sem resultado cruzado</dt><dd>{nInt(l.semResultado)}</dd></div>
          {transicao && <div><dt>Saldo de seções</dt><dd>{nSig(transicao.adicionadas.secoes - transicao.removidas.secoes)}</dd></div>}
        </dl>
      )}
      <p className="note caveat">Uma margem diferente <em>dentro da lista</em> não significa que a margem da eleição nacional mudou: a lista é só um recorte das seções.</p>
    </div>
  );
}

