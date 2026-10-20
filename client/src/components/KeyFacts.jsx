import { nInt, nPts } from '../format.js';
import { ultimaLista } from '../listas.js';

/** Três números para entender o essencial em poucos segundos. Tudo vem da API. */
export default function KeyFacts({ listas, transicoes }) {
  const primeira = listas[0], ultima = listas[listas.length - 1];
  const seq = transicoes.filter((t) => t.ate === t.de + 1);
  const saiu = seq.reduce((s, t) => s + t.removidas.secoes, 0), entrou = seq.reduce((s, t) => s + t.adicionadas.secoes, 0);
  const margens = listas.map((l) => l.margem);
  return (
    <dl className="keyfacts" aria-label="Resumo em três números">
      <div><dt>Seções nas listas</dt><dd><strong>{nInt(primeira.secoes)}</strong><span aria-hidden="true"> → </span><span className="sr"> para </span><strong>{nInt(ultima.secoes)}</strong></dd><dd className="kf-nota">da primeira lista à de {ultimaLista().label} (a mais recente)</dd></div>
      <div><dt>Entradas e saídas</dt><dd><strong className="t-saiu">−{nInt(saiu)}</strong> <strong className="t-entrou">+{nInt(entrou)}</strong></dd><dd className="kf-nota">registros que saíram e entraram nas atualizações</dd></div>
      <div><dt>Margem de Lula dentro das listas</dt><dd><strong>{nPts(Math.min(...margens))}</strong><span aria-hidden="true"> a </span><span className="sr"> até </span><strong>{nPts(Math.max(...margens))}</strong></dd><dd className="kf-nota">1º turno; não é a margem nacional</dd></div>
    </dl>
  );
}
