import { nInt } from '../format.js';
import { Card } from './Common.jsx';

const RELATORIOS = [
  { arq: 'relatorio_versoes_v1_v4_2t_2026.pdf', nome: 'Relatório das quatro listas e votos', desc: 'Margem por lista, efeito de cada troca, estados e municípios. É o relatório mais completo.' },
  { arq: 'relatorio_rodadas_secoes_2t_2026.pdf', nome: 'Evolução das listas', desc: 'Como a lista de seções encolheu e quais seções saíram ou entraram.' },
  { arq: 'relatorio_secoes_alteradas_2t_2026.pdf', nome: 'Lista de 438 seções', desc: 'Porcentagem de votos por candidato e candidatos mais afetados na lista de 438.' },
];

export default function Listas({ meta }) {
  return (
    <div className="stack">
      <Card titulo="Listas analisadas" nota={`${nInt(meta.totalSecoes)} seções diferentes aparecem nas quatro listas.`}>
        <div className="tablewrap free"><table><thead><tr><th className="left">Publicada em</th><th className="left">Arquivo</th></tr></thead><tbody>
          {meta.listas.map((l) => <tr key={l.id}><td className="left">{l.id < 4 ? l.label : 'Data não informada'}</td><td className="left wrap">{l.arquivo}</td></tr>)}
        </tbody></table></div>
      </Card>
      <Card titulo="Relatórios em PDF">
        <div className="grid2">
          {RELATORIOS.map((r) => (
            <div className="card" key={r.arq}>
              <h3>{r.nome}</h3><p className="note" style={{ margin: 0 }}>{r.desc}</p>
              <div><a className="btn primary" href={`/relatorios/${r.arq}`} target="_blank" rel="noreferrer">Abrir PDF</a></div>
            </div>
          ))}
        </div>
      </Card>
      <Card titulo="Imprimir esta página ou salvar como PDF" nota="Cada página do site pode ser impressa. Os filtros e botões somem na impressão.">
        <div><button className="btn" onClick={() => window.print()}>Imprimir ou salvar como PDF</button></div>
      </Card>
      <Card titulo="Como as porcentagens são calculadas">
        <p style={{ margin: 0 }}>As listas foram cruzadas com a votação por seção do 1º turno de 2026. Porcentagens são sobre votos válidos (Lula, Flávio e outros candidatos, sem brancos e nulos). A margem é Lula menos Flávio em pontos percentuais. Dez seções da primeira lista (Aracati/CE, Frankfurt e Praga) não têm voto cruzado e ficam fora das porcentagens, mas contam nos eleitores. Os votos do 2º turno, em 25/10/2026, ainda não existem.</p>
      </Card>
    </div>
  );
}
