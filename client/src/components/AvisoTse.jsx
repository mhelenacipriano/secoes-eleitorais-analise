import { useEffect, useState } from 'react';
import { dataHora, dataTse, HORARIOS_TSE, painel, proximaAtualizacao, ultimaLista } from '../listas.js';

/** Aviso bem visível: o que o próprio site do TSE informa sobre a atualização das listas e quando baixamos a mais recente.
 *  Tudo é calculado da lista mais recente (data de publicação e de download); se a próxima atualização prevista já passou, avisa. */
export default function AvisoTse() {
  const u = ultimaLista();
  const pn = painel();   // o que o painel informou na última conferência (se houver); senão, calculamos pelos horários do TSE
  const prox = pn && pn.proximaAtualizacao ? { iso: pn.proximaAtualizacao, texto: dataTse(pn.proximaAtualizacao) } : (u.publicadaEm ? proximaAtualizacao(u.publicadaEm) : { iso: '', texto: '' });
  const verificadoEm = pn && pn.verificadoEm;
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 60000); return () => clearInterval(t); }, []);
  const vencida = prox.iso && agora > new Date(prox.iso).getTime() + 30 * 60000;   // 30 min de tolerância
  const conferidaDepois = verificadoEm && prox.iso && new Date(verificadoEm) > new Date(prox.iso);   // já olhamos o painel depois do horário previsto
  const passou = vencida && !conferidaDepois;
  return (
    <aside className="aviso-tse" role="note" aria-label="Aviso sobre a atualização das listas do TSE">
      <p className="aviso-tse-tit"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l4.2 2.5.8-1.3-3.5-2.1V7H11Z" fill="currentColor" /></svg> As listas do TSE são atualizadas várias vezes por dia</p>
      <p className="aviso-tse-fonte">O site do TSE informa:</p>
      <dl className="aviso-tse-grade">
        <div><dt>Última atualização</dt><dd>{dataTse(u.publicadaEm)}</dd></div>
        <div><dt>Próxima atualização</dt><dd>{prox.texto}</dd></div>
        <div><dt>Frequência de atualização</dt><dd>às {HORARIOS_TSE.slice(0, -1).join(', ')} e {HORARIOS_TSE[HORARIOS_TSE.length - 1]}</dd></div>
      </dl>
      <p className="aviso-tse-baixada">A lista mais recente que temos foi baixada em <strong>{dataHora(u.baixadaEm || u.publicadaEm)}</strong>. Ela pode já ter sido atualizada no site do TSE desde então.</p>
      {verificadoEm && <p className="aviso-tse-baixada">Conferimos o painel do TSE pela última vez em <strong>{dataHora(verificadoEm)}</strong>{conferidaDepois && vencida ? ': o TSE ainda não publicou a atualização prevista.' : '.'}</p>}
      {passou && <p className="aviso-tse-atraso" role="status"><strong>A próxima atualização do TSE já deveria ter saído.</strong> Os dados aqui podem estar desatualizados.</p>}
    </aside>
  );
}
