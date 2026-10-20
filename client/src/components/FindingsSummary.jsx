import { nInt, nPts } from '../format.js';
import { padraoGeral } from './ElectoralProfileComparison.jsx';

export default function FindingsSummary({ listas, transicoes, onExplorar }) {
  const primeira = listas[0], ultima = listas[listas.length - 1];
  const geral = padraoGeral(transicoes);
  const seq = transicoes.filter((t) => t.ate === t.de + 1);
  const rem = seq.reduce((s, t) => s + t.removidas.secoes, 0), add = seq.reduce((s, t) => s + t.adicionadas.secoes, 0);
  const margens = listas.map((l) => l.margem);
  return (
    <div className="conclusao">
      <h2>O que a análise revela?</h2>
      <ol>
        <li><span><strong>As listas publicadas passaram por revisões substanciais.</strong> De {nInt(primeira.secoes)} para {nInt(ultima.secoes)} seções; ao longo das atualizações, {nInt(rem)} registros saíram e {nInt(add)} entraram.</span></li>
        <li><span><strong>Os perfis eleitorais das seções retiradas e adicionadas variaram entre as atualizações.</strong> A margem dentro das listas oscilou de {nPts(Math.min(...margens))} a {nPts(Math.max(...margens))} a favor de Lula, no 1º turno.</span></li>
        <li><span><strong>{geral.consistente ? 'As seções adicionadas tiveram o mesmo viés em todas as atualizações, mas isso não revela o motivo.' : 'As evidências disponíveis não mostram que as mudanças beneficiaram um candidato de forma consistente nem que alteraram o resultado da eleição.'}</strong> Os dados não permitem medir quantos eleitores foram afetados no dia da votação.</span></li>
      </ol>
      <p className="fecho">Mudanças na composição das listas não são, por si só, evidência de alteração de votos ou fraude eleitoral.</p>
      <button className="btn primary big" onClick={onExplorar}>Explore os dados completos</button>
    </div>
  );
}
