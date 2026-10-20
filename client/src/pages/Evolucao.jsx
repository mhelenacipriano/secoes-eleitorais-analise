import { useApi } from '../api.js';
import EvolucaoListas from '../components/EvolucaoListas.jsx';
import SectionTransitionFlow from '../components/SectionTransitionFlow.jsx';
import ElectoralProfileComparison from '../components/ElectoralProfileComparison.jsx';
import { Carregando } from '../components/ui.jsx';
import { Secao } from './Home.jsx';

export default function Evolucao({ filtros }) {
  const st = useApi('historia', { uf: filtros.uf, municipio: filtros.municipio, lider: filtros.lider });
  if (!st.data) return <Carregando state={st} />;
  const { listas, transicoes } = st.data;
  if (!listas.length) return <div className="empty">Nenhuma seção corresponde aos filtros escolhidos.</div>;
  const filtrado = filtros.uf || filtros.municipio || filtros.lider;
  return (
    <div className="stack">
      <h1 className="page-title">Evolução das listas</h1>
      {filtrado && <p className="note">Recorte ativo: {[filtros.uf, filtros.municipio && filtros.municipio.replace(':', ' · '), filtros.lider && (filtros.lider === 'L' ? 'seções com Lula na frente' : 'seções com Flávio na frente')].filter(Boolean).join(' · ')}. Em recortes pequenos, as porcentagens variam muito e merecem cautela.</p>}
      <Secao titulo="Versões das listas"><EvolucaoListas key={listas.length + filtros.uf} listas={listas} transicoes={transicoes} /></Secao>
      <Secao titulo="Quem saiu, ficou e entrou"><SectionTransitionFlow listas={listas} transicoes={transicoes} filtros={filtros} /></Secao>
      <Secao titulo="Perfil das seções por atualização"><ElectoralProfileComparison transicoes={transicoes} /></Secao>
    </div>
  );
}
