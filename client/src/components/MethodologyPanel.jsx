import { nInt, nPct } from '../format.js';
import { InfoTip } from './ui.jsx';

export default function MethodologyPanel({ meta, listas }) {
  const L = listas || [];
  return (
    <div className="stack">
      <section className="prose">
        <h2>Como lemos os dados</h2>
        <ul>
          <li>As quatro listas são <strong>retratos diferentes</strong> de seções publicadas como alteradas. Entrar ou sair de uma lista não prova que o local físico de votação mudou.</li>
          <li>O perfil de votação é do <strong>1º turno</strong> (histórico). Não é previsão do 2º turno, e os votos do 2º turno (25/10/2026) não estão nestes dados.</li>
          <li><strong>Margem</strong> = % de Lula − % de Flávio Bolsonaro nos votos válidos do 1º turno, em pontos percentuais (pts). A margem de uma lista <em>não</em> é a margem nacional e a variação entre listas <em>não</em> é um “swing” eleitoral.</li>
          <li>Correlação não prova intenção ou causa. Parte das diferenças pode ser <strong>geográfica</strong>: as listas tendem a incluir municípios inteiros.</li>
          <li>Dados ausentes são mantidos como ausentes. {nInt(meta.semResultado)} seções não têm resultado do 1º turno cruzado (Aracati/CE, Frankfurt e Praga na primeira lista; Ipueiras/CE e Vigia/PA entraram na última lista): contam nos eleitores, ficam fora das porcentagens e nunca viram “zero voto”.</li>
        </ul>
      </section>
      <section className="card">
        <header><div><h2>Quatro medidas que não se misturam</h2><p className="note">Cada uma responde a uma pergunta diferente. Valores somados sobre todas as seções de cada lista.</p></div></header>
        <div className="tablewrap free"><table>
          <thead><tr><th className="left">Lista</th>
            <th>Eleitores na lista <InfoTip texto="Eleitores aptos informados na própria lista de seções alteradas." /></th>
            <th>Aptos no 1º turno <InfoTip texto="Eleitorado apto da seção nos resultados do 1º turno. Pode diferir do número da lista." /></th>
            <th>Votos válidos <InfoTip texto="Votos em candidatos (Lula, Flávio e outros) no 1º turno. Não inclui brancos e nulos." /></th>
            <th>Válidos ÷ aptos <InfoTip texto="Aproximação de comparecimento usada como ponto de partida no cenário hipotético. O comparecimento real (quem foi à urna) não está nos dados." /></th></tr></thead>
          <tbody>{L.map((l) => (
            <tr key={l.id}><td className="left">{l.nome}</td><td>{nInt(l.eleitores)}</td><td>{nInt(l.aptos)}</td><td>{nInt(l.validos)}</td><td>{nPct(l.aptosComResultado ? l.validos / l.aptosComResultado : null)}</td></tr>
          ))}</tbody>
        </table></div>
        <p className="note">Comparecimento (quem realmente votou) e abstenção: <strong>não disponíveis</strong> neste conjunto de dados.</p>
      </section>
      <section className="prose">
        <h2>Limites desta análise</h2>
        <ul>
          <li>Não sabemos por que cada registro foi adicionado ou removido, nem se algum eleitor deixou de votar.</li>
          <li>Seções que saíram de uma lista em uma atualização podem ter mantido a mudança de local, tê-la desfeita ou tido o registro corrigido. Não conseguimos confirmar o que aconteceu em cada caso, e não encontramos publicação oficial que o esclareça.</li>
          <li>As listas aqui analisadas podem estar incompletas ou desatualizadas: elas não substituem a consulta oficial do local de votação. Para saber o local atual, use o aplicativo e-Título, o Autoatendimento Eleitoral do TSE ou o site do TRE do seu estado.</li>
          <li>O controle por município tem amostra pequena: poucos municípios têm, ao mesmo tempo, seções retiradas e adicionadas.</li>
          <li>Não há totais nacionais verificados nos dados; por isso o cenário hipotético não indica vencedor.</li>
          <li>Esta página não sugere fraude, interferência política ou manipulação intencional — nenhuma evidência disso é apresentada.</li>
        </ul>
      </section>
    </div>
  );
}
