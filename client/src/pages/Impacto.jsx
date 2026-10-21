import { useApi } from '../api.js';
import SaberEstimar from '../components/SaberEstimar.jsx';
import PotentialImpactExplorer from '../components/PotentialImpactExplorer.jsx';
import { Carregando } from '../components/ui.jsx';
import { Secao } from './Home.jsx';

export default function Impacto({ filtros }) {
  const st = useApi('historia', { uf: filtros.uf, municipio: filtros.municipio, lider: filtros.lider });
  if (!st.data) return <Carregando state={st} />;
  if (!st.data.listas.length) return <div className="empty">Nenhuma seção corresponde aos filtros escolhidos.</div>;
  return (
    <div className="stack">
      <h1 className="page-title">Impacto potencial</h1>
      <Secao titulo="O que sabemos, o que dá para estimar e o que não sabemos"><SaberEstimar /></Secao>
      <Secao titulo="E se parte dos eleitores não conseguisse votar?" intro="Um exercício para dar noção de tamanho. Você escolhe as suposições e vê o que elas significam. Não prevê nada.">
        <PotentialImpactExplorer key={filtros.uf + filtros.municipio + filtros.lider} listas={st.data.listas} />
      </Secao>
    </div>
  );
}
