import { BAIXADA_EM, TSE_ATUALIZACAO } from '../config.js';

/** Aviso bem visível: o que o próprio site do TSE informa sobre a atualização das listas e quando baixamos a mais recente. */
export default function AvisoTse() {
  return (
    <aside className="aviso-tse" role="note" aria-label="Aviso sobre a atualização das listas do TSE">
      <p className="aviso-tse-tit"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l4.2 2.5.8-1.3-3.5-2.1V7H11Z" fill="currentColor" /></svg> As listas do TSE são atualizadas várias vezes por dia</p>
      <p className="aviso-tse-fonte">O site do TSE informa:</p>
      <dl className="aviso-tse-grade">
        <div><dt>Última atualização</dt><dd>{TSE_ATUALIZACAO.ultima}</dd></div>
        <div><dt>Próxima atualização</dt><dd>{TSE_ATUALIZACAO.proxima}</dd></div>
        <div><dt>Frequência de atualização</dt><dd>{TSE_ATUALIZACAO.frequencia}</dd></div>
      </dl>
      <p className="aviso-tse-baixada">A lista mais recente que temos foi baixada em <strong>{BAIXADA_EM}</strong>. Ela pode já ter sido atualizada no site do TSE desde então.</p>
    </aside>
  );
}
