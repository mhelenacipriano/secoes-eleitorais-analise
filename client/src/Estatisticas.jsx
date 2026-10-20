import { useCallback, useEffect, useState } from 'react';

const CHAVE = 'estatisticas-senha';
const lerSenha = () => { try { return sessionStorage.getItem(CHAVE) || ''; } catch { return ''; } };
const nInt = (n) => Number(n || 0).toLocaleString('pt-BR');

/** Página escondida (#estatisticas): acessos totais, de hoje e de quem está no site agora. Pede a senha (STATS_TOKEN). */
export default function Estatisticas() {
  const [senha, setSenha] = useState(lerSenha);
  const [digitada, setDigitada] = useState('');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!senha) return;
    try {
      const r = await fetch('/api/estatisticas', { headers: { Authorization: `Bearer ${senha}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { try { sessionStorage.removeItem(CHAVE); } catch { /* ok */ } setSenha(''); setDados(null); setErro('Senha incorreta.'); return; }
      if (!r.ok) { setErro(j.erro || `Erro ${r.status}`); return; }
      setErro(''); setDados(j);
    } catch { setErro('Sem conexão com o servidor.'); }
  }, [senha]);

  useEffect(() => { carregar(); if (!senha) return undefined; const t = setInterval(carregar, 5000); return () => clearInterval(t); }, [carregar, senha]);

  const entrar = (e) => { e.preventDefault(); if (!digitada) return; try { sessionStorage.setItem(CHAVE, digitada); } catch { /* ok */ } setSenha(digitada); setDigitada(''); setErro(''); };
  const sair = () => { try { sessionStorage.removeItem(CHAVE); } catch { /* ok */ } setSenha(''); setDados(null); };
  const maior = dados ? Math.max(1, ...dados.ultimos7.map((d) => d.visitas)) : 1;

  return (
    <section className="stats" aria-labelledby="stats-titulo">
      <h1 id="stats-titulo">Acessos</h1>
      <p className="stats-sub">Contagem anônima, sem cookies nem dados pessoais. Esta página não é pública.</p>
      {!senha ? (
        <form className="stats-form" onSubmit={entrar}>
          <label className="stats-campo">Senha<input type="password" value={digitada} onChange={(e) => setDigitada(e.target.value)} autoComplete="current-password" autoFocus /></label>
          <button type="submit" className="btn primary" disabled={!digitada}>Entrar</button>
        </form>
      ) : (
        <>
          <div className="stats-grid" aria-live="polite">
            <div className="stats-card destaque"><span>Online agora</span><strong>{dados ? nInt(dados.online) : '…'}</strong></div>
            <div className="stats-card"><span>Acessos hoje</span><strong>{dados ? nInt(dados.hoje) : '…'}</strong></div>
            <div className="stats-card"><span>Acessos no total</span><strong>{dados ? nInt(dados.total) : '…'}</strong></div>
          </div>
          {dados && (
            <ul className="stats-dias" aria-label="Acessos nos últimos 7 dias">
              {dados.ultimos7.map((d) => (
                <li key={d.dia}><span>{d.dia.split('-').reverse().join('/')}</span><i style={{ width: `${(d.visitas / maior) * 100}%` }} /><b>{nInt(d.visitas)}</b></li>
              ))}
            </ul>
          )}
          <p className="stats-nota">Atualiza sozinho a cada 5 segundos. “Online” = abas abertas com sinal nos últimos ~75 s. Um acesso = uma página carregada (recarregar conta de novo).{dados && ` Última leitura: ${new Date(dados.atualizadoEm).toLocaleTimeString('pt-BR')}.`}</p>
          <button type="button" className="btn" onClick={sair}>Sair</button>
        </>
      )}
      {erro && <p className="stats-erro" role="alert">{erro}</p>}
    </section>
  );
}
