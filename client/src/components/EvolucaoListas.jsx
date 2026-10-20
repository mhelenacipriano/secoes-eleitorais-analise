import { useState } from 'react';
import { nInt, nPts } from '../format.js';
import VersionTimeline from './VersionTimeline.jsx';
import VersionComparison from './VersionComparison.jsx';

export default function EvolucaoListas({ listas, transicoes }) {
  const [sel, setSel] = useState(listas[0].id);
  const ids = listas.map((l) => l.id);
  const i = Math.max(0, ids.indexOf(sel));
  const l = listas[i];
  const ant = i > 0 ? listas[i - 1] : null;
  const t = ant ? transicoes.find((x) => x.de === ant.id && x.ate === l.id) : null;
  const margens = listas.map((m) => m.margem);
  const mover = (d) => setSel(ids[Math.min(ids.length - 1, Math.max(0, i + d))]);
  return (
    <div>
      <p className="insight">
        <strong>A composição eleitoral das seções listadas mudou bastante entre as versões:</strong> a margem de Lula <em>dentro da lista</em> foi de {nPts(Math.min(...margens))} a {nPts(Math.max(...margens))}, enquanto o número de seções caiu de {nInt(listas[0].secoes)} para {nInt(listas[listas.length - 1].secoes)}.
      </p>
      <VersionTimeline listas={listas} selecionada={sel} onSelect={setSel} />
      <VersionComparison lista={l} transicao={t} anterior={ant} onSwipe={mover} />
    </div>
  );
}
