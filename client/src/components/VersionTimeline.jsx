import { useRef } from 'react';
import { nInt, nPts } from '../format.js';
import { ehUltima } from '../listas.js';

const partes = (l) => String(l.label).split(' · ');   // "20/10 · 15h27" → ['20/10', '15h27']

/** Linha do tempo horizontal: a altura de cada coluna é proporcional ao número de seções. */
export default function VersionTimeline({ listas, selecionada, onSelect }) {
  const max = Math.max(...listas.map((l) => l.secoes));
  const refs = useRef([]);
  const onKey = (e, i) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + listas.length) % listas.length;
    onSelect(listas[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div className="timeline" role="tablist" aria-label="Versões da lista de seções alteradas">
      {listas.map((l, i) => {
        const ativa = l.id === selecionada, ultima = ehUltima(l.id);
        return (
          <button key={l.id} ref={(el) => (refs.current[i] = el)} role="tab" aria-selected={ativa} tabIndex={ativa ? 0 : -1}
            className={'tl-item' + (ativa ? ' ativa' : '') + (ultima ? ' ultima' : '')} onClick={() => onSelect(l.id)} onKeyDown={(e) => onKey(e, i)}>
            <span className="tl-col" aria-hidden="true"><i style={{ height: `${Math.max(6, (l.secoes / max) * 100)}%` }} /></span>
            <span className="tl-data">
              {partes(l)[0]}<small>{partes(l)[1]}{ultima ? ' · mais recente' : ''}</small>
            </span>
            <span className="tl-n">{nInt(l.secoes)}<small> seções</small></span>
            <span className={'tl-m ' + (l.margem >= 0 ? 'pos' : 'neg')}>{nPts(l.margem)}</span>
          </button>
        );
      })}
    </div>
  );
}
