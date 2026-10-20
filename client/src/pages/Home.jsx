import { useApi } from '../api.js';
import HeroSection from '../components/HeroSection.jsx';
import EvolucaoListas from '../components/EvolucaoListas.jsx';
import SectionTransitionFlow from '../components/SectionTransitionFlow.jsx';
import ElectoralProfileComparison from '../components/ElectoralProfileComparison.jsx';
import SaberEstimar from '../components/SaberEstimar.jsx';
import PotentialImpactExplorer from '../components/PotentialImpactExplorer.jsx';
import FindingsSummary from '../components/FindingsSummary.jsx';
import KeyFacts from '../components/KeyFacts.jsx';
import { Carregando, Reveal } from '../components/ui.jsx';

export const Secao = ({ id, letra, titulo, intro, children }) => (
  <Reveal as="section" className="story" id={id}>
    {letra && <p className="eyebrow">{letra}</p>}
    <h2>{titulo}</h2>
    {intro && <p className="story-intro">{intro}</p>}
    {children}
  </Reveal>
);

export default function Home({ ir }) {
  const st = useApi('historia');
  const rolar = () => document.getElementById('evolucao')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <>
      <HeroSection onSaiba={rolar} onExplorar={() => ir('explorar')} />
      {!st.data ? <Carregando state={st} /> : (
        <>
          <KeyFacts listas={st.data.listas} transicoes={st.data.transicoes} />
          <Secao id="evolucao" letra="1 · A evolução das listas" titulo="Quatro listas, composições bem diferentes" intro="Toque em uma versão para ver quantas seções e eleitores ela reunia e como era o voto do 1º turno nessas seções.">
            <EvolucaoListas listas={st.data.listas} transicoes={st.data.transicoes} />
          </Secao>
          <Secao letra="2 · O que realmente mudou" titulo="As atualizações não apenas removeram seções. Elas também adicionaram outras." intro="Cada faixa mostra as seções que continuaram na lista; as que saíram e as que entraram aparecem com seus números.">
            <SectionTransitionFlow listas={st.data.listas} transicoes={st.data.transicoes} />
          </Secao>
          <Secao letra="3 · Quem estava mais representado" titulo="As seções retiradas e adicionadas tinham perfis eleitorais diferentes?" intro="Comparamos o voto do 1º turno nas seções que saíram, ficaram ou entraram em cada atualização. Escolha uma atualização.">
            <ElectoralProfileComparison transicoes={st.data.transicoes} />
          </Secao>
          <Secao letra="4 · O impacto possível" titulo="Mas isso poderia mudar o resultado da eleição?" intro="Três conceitos diferentes não podem ser confundidos: o perfil eleitoral (medido), a possível dificuldade para votar (hipótese) e o impacto real no resultado (desconhecido).">
            <div className="conceitos">
              <div><h3>1 · Perfil eleitoral</h3><p>Os resultados do 1º turno mostram qual candidato foi mais votado em cada grupo de seções. Isso é diretamente mensurável.</p></div>
              <div><h3>2 · Possível desorganização do eleitor</h3><p>Uma mudança de local pode, em teoria, afetar o comparecimento se o eleitor não souber do novo local ou não conseguir chegar. Os dados não mostram que isso ocorreu.</p></div>
              <div><h3>3 · Impacto eleitoral real</h3><p>O 1º turno não diz quantos eleitores deixariam de votar no 2º turno, em quem votariam, nem se o resultado nacional mudaria. Isso exige outras evidências.</p></div>
            </div>
            <SaberEstimar />
            <h3 className="sub">E se parte dos eleitores não conseguisse votar?</h3>
            <PotentialImpactExplorer listas={st.data.listas} />
          </Secao>
          <Reveal as="section" className="story">
            <FindingsSummary listas={st.data.listas} transicoes={st.data.transicoes} onExplorar={() => ir('explorar')} />
          </Reveal>
        </>
      )}
    </>
  );
}
