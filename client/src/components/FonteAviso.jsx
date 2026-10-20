import { useState } from 'react';
import { CDN_TSE, URL_RESULTADOS_1T, URL_SECOES_ALTERADAS } from '../fontes.js';
import LinkIcone from './LinkIcone.jsx';

/** Aviso fixo no topo: como a análise foi feita, de onde vêm os dados e que não é um site oficial. */
export default function FonteAviso() {
  const [aberto, setAberto] = useState(false);
  return (
    <aside className={`banner${aberto ? ' aberto' : ''}`} role="note" aria-label="Como esta análise foi feita">
      <p className="banner-tit"><strong>Como esta análise foi feita.</strong> Cruzamos os resultados oficiais do 1º turno<LinkIcone href={URL_RESULTADOS_1T} rotulo="Resultados do 1º turno no SIG/TSE" /> com as listas de seções alteradas divulgadas pelo TSE. Os comparativos e gráficos foram gerados por cruzamento de dados e com auxílio de inteligência artificial (IA). Este não é um site oficial.</p>
      <div className="banner-det" id="fonte-detalhes"><div className="banner-det-in">
        <ul>
          <li><strong>Resultados do 1º turno:</strong> disponíveis oficialmente no painel de resultados do SIG/TSE<LinkIcone href={URL_RESULTADOS_1T} rotulo="Painel de resultados do SIG/TSE" />.</li>
          <li><strong>Listas de seções alteradas:</strong> várias listas datadas (18/10 às 11h, 18/10 às 17h, 19/10 às 11h, 20/10 às 13h59 e 20/10 às 15h27, a mais recente), disponível no site original do TSE (painel Seções alteradas do SIG/TSE)<LinkIcone href={URL_SECOES_ALTERADAS} rotulo="Painel Seções alteradas do SIG/TSE" />.</li>
          <li><strong>Listas anteriores:</strong> não encontramos um link público para elas. Só foi possível acessá-las por meio de <span className="mono">cdn.tse.jus.br</span><LinkIcone href={CDN_TSE} rotulo="cdn.tse.jus.br" />, que não é de acesso público.</li>
          <li><strong>Atenção:</strong> comparativos e gráficos podem conter erros. Para saber o local de votação atual, confirme no aplicativo e-Título ou no Autoatendimento Eleitoral do TSE.</li>
        </ul>
      </div></div>
      <button type="button" className="banner-toggle" aria-expanded={aberto} aria-controls="fonte-detalhes" onClick={() => setAberto((x) => !x)}>{aberto ? 'Ocultar detalhes' : 'Ver fontes e detalhes'}</button>
    </aside>
  );
}
