import { useParam } from '../router.js';
import { favorece, nInt, nPct, nPts, quem } from '../format.js';
import { BarraCandidatos, InfoTip, Legenda } from './ui.jsx';

const GRUPOS = [['removidas', 'Retiradas', 'Estavam na lista anterior e não estão na nova.'], ['mantidas', 'Mantidas', 'Estão nas duas listas.'], ['adicionadas', 'Adicionadas', 'Não estavam na lista anterior e estão na nova.']];
const ROTULO = { '1-2': 'Atualização 1', '2-3': 'Atualização 2', '3-4': 'Painel do TSE', '1-4': 'Comparação direta' };
const CURTO = { '1-2': '1ª → 2ª lista', '2-3': '2ª → 3ª lista', '3-4': '3ª lista → painel do TSE', '1-4': '1ª lista → painel do TSE' };

/** Texto gerado a partir dos números: nunca atribui motivo às mudanças. */
export function interpretar(t) {
  const r = t.removidas, a = t.adicionadas;
  const parte = (g, nome) => (g.margem == null ? `${nome} (${nInt(g.secoes)}) sem resultado do 1º turno para comparar` : `${nome} (${nInt(g.secoes)}) eram ${favorece(g.margem)} (${quem(g.margem)})`);
  return `${parte(r, 'As seções retiradas')}; ${parte(a, 'as adicionadas')}.`;
}

/** Resume todas as atualizações consecutivas e diz se há (ou não) um padrão único. */
export function padraoGeral(transicoes) {
  const seq = transicoes.filter((t) => t.ate === t.de + 1 && t.removidas.margem != null && t.adicionadas.margem != null);
  if (seq.length < 2) return { consistente: false, texto: 'Há poucas atualizações com resultados para os dois grupos; não é possível avaliar se existe um padrão.' };
  const sinais = seq.map((t) => Math.sign(t.adicionadas.margem - t.removidas.margem));
  const igual = sinais.every((s) => s === sinais[0]);
  if (igual) {
    const quemFav = sinais[0] > 0 ? 'Lula' : 'Flávio Bolsonaro';
    return { consistente: true, texto: `Em todas as ${seq.length} atualizações, as seções adicionadas foram mais favoráveis a ${quemFav} do que as retiradas. Isso descreve a composição das listas e não prova a intenção por trás das mudanças.` };
  }
  return { consistente: false, texto: 'As revisões não seguiram um padrão consistente de exclusão de seções favoráveis a um único candidato: a diferença entre retiradas e adicionadas mudou de direção entre as atualizações.' };
}

function Controle({ c }) {
  if (!c || !c.municipios) {
    return <p className="note">Controle por município: não foi possível. Nenhum município tem, ao mesmo tempo, seções retiradas e adicionadas com resultado — ou seja, as seções que saem e as que entram ficam, em geral, em lugares diferentes, e parte da diferença pode ser só geografia.</p>;
  }
  return (
    <p className="note">Controle por município: só {nInt(c.municipios)} município{c.municipios > 1 ? 's' : ''} ({nPct(c.coberturaAlvo, 0)} das seções adicionadas) tem seções nos dois grupos. Neles, as adicionadas ({nPts(c.margemAlvo)}) vs. as retiradas reponderadas pelo mesmo perfil municipal ({nPts(c.margemRefPadronizada)}). A amostra é pequena demais para separar o efeito da geografia.</p>
  );
}

export default function ElectoralProfileComparison({ transicoes }) {
  const [id, setId] = useParam('cmp', '1-2');
  const t = transicoes.find((x) => x.id === id) || transicoes[0];
  const geral = padraoGeral(transicoes);
  return (
    <div className="perfil">
      <div className="seg-ctl" role="radiogroup" aria-label="Escolha a atualização para comparar">
        {transicoes.map((x) => (
          <button key={x.id} role="radio" aria-checked={x.id === id} className={x.id === id ? 'on' : ''} onClick={() => setId(x.id)}>
            <small>{ROTULO[x.id]}</small>{CURTO[x.id]}
          </button>
        ))}
      </div>
      <Legenda />
      <div className="grupos" key={id}>
        {GRUPOS.map(([k, nome, dica]) => {
          const g = t[k];
          return (
            <div className={'grupo g-' + k} key={k}>
              <div className="g-head">
                <h3>{nome} <InfoTip texto={dica} /></h3>
                <p><strong>{nInt(g.secoes)}</strong> seções · {nInt(g.eleitores)} eleitores</p>
              </div>
              {g.secoes ? <BarraCandidatos lula={g.lulaPct} flavio={g.flavioPct} outros={g.outrosPct} /> : <div className="bar bar-vazia">Nenhuma seção neste grupo</div>}
              {g.semResultado > 0 && <p className="note">{nInt(g.semResultado)} seção(ões) sem resultado do 1º turno ficam fora das porcentagens (não são tratadas como zero voto).</p>}
            </div>
          );
        })}
      </div>
      <p className="leitura"><strong>Leitura desta comparação.</strong> {interpretar(t)}</p>
      <Controle c={t.controlada} />
      <div className={'conclusao-perfil' + (geral.consistente ? ' alerta' : '')} role="note">
        <strong>No conjunto das atualizações:</strong> {geral.texto}
        <span className="note"> Porcentagens são do 1º turno e não indicam o motivo das mudanças.</span>
      </div>
    </div>
  );
}
