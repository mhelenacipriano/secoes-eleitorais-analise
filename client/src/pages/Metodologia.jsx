import { useApi } from '../api.js';
import MethodologyPanel from '../components/MethodologyPanel.jsx';
import { Card, Carregando } from '../components/ui.jsx';
import { nInt } from '../format.js';

const RELATORIOS = [
  { arq: 'relatorio_versoes_v1_v4_2t_2026.pdf', nome: 'Relatório das quatro listas e votos', desc: 'Margem por lista, efeito de cada troca, estados e municípios. É o relatório mais completo.' },
  { arq: 'relatorio_rodadas_secoes_2t_2026.pdf', nome: 'Evolução das listas', desc: 'Como a lista de seções encolheu e quais seções saíram ou entraram.' },
  { arq: 'relatorio_secoes_alteradas_2t_2026.pdf', nome: 'Última lista (versão anterior do relatório)', desc: 'Porcentagem de votos por candidato e candidatos mais afetados na última lista, na versão com 438 seções.' },
];

export default function Metodologia({ meta }) {
  const st = useApi('historia');
  return (
    <div className="stack">
      <h1 className="page-title">Metodologia e fontes</h1>
      {st.data ? <MethodologyPanel meta={meta} listas={st.data.listas} /> : <Carregando state={st} />}
      <Card titulo="Listas analisadas" nota={`${nInt(meta.totalSecoes)} seções diferentes aparecem nas quatro listas.`}>
        <div className="tablewrap free"><table><thead><tr><th className="left">Publicada em</th><th className="left">Arquivo</th></tr></thead><tbody>
          {meta.listas.map((l) => <tr key={l.id}><td className="left">{l.id < 4 ? l.label : 'Data não informada'}</td><td className="left wrap">{l.arquivo}</td></tr>)}
        </tbody></table></div>
      </Card>
      <Card titulo="Relatórios em PDF">
        <div className="grid2">
          {RELATORIOS.map((r) => (
            <div className="card" key={r.arq}>
              <h3>{r.nome}</h3><p className="note">{r.desc}</p>
              <div><a className="btn primary" href={`/relatorios/${r.arq}`} target="_blank" rel="noreferrer">Abrir PDF</a></div>
            </div>
          ))}
        </div>
      </Card>
      <Card titulo="Imprimir esta página ou salvar como PDF" nota="Cada página do site pode ser impressa. Os filtros e botões somem na impressão.">
        <div><button className="btn" onClick={() => window.print()}>Imprimir ou salvar como PDF</button></div>
      </Card>
    </div>
  );
}
