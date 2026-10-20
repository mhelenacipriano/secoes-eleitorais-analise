import { useApi } from '../api.js';
import MethodologyPanel from '../components/MethodologyPanel.jsx';
import { Card, Carregando } from '../components/ui.jsx';
import { nInt } from '../format.js';

export default function Metodologia({ meta }) {
  const st = useApi('historia');
  return (
    <div className="stack">
      <h1 className="page-title">Metodologia e fontes</h1>
      {st.data ? <MethodologyPanel meta={meta} listas={st.data.listas} /> : <Carregando state={st} />}
      <Card titulo="Listas analisadas" nota={`${nInt(meta.totalSecoes)} seções diferentes aparecem nas quatro listas (a mais recente é a de 20/10 · 13h59).`}>
        <div className="tablewrap free"><table><thead><tr><th className="left">Publicada em</th><th className="left">Arquivo</th></tr></thead><tbody>
          {meta.listas.map((l) => <tr key={l.id}><td className="left">{l.label}</td><td className="left wrap">{l.arquivo}</td></tr>)}
        </tbody></table></div>
      </Card>
      <Card titulo="Imprimir esta página ou salvar como PDF" nota="Cada página do site pode ser impressa. Os filtros e botões somem na impressão.">
        <div><button className="btn" onClick={() => window.print()}>Imprimir ou salvar como PDF</button></div>
      </Card>
    </div>
  );
}
