import { useEffect, useId, useRef, useState } from 'react';
import { csvUrl } from '../api.js';
import { nPct } from '../format.js';
import { baixarCsv, baixarPng, nomeArquivo } from '../exportar.js';

/** Revela o bloco com uma transição suave quando ele entra na tela. */
export function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVis(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${vis ? 'in' : ''} ${className}`} {...rest}>{children}</Tag>;
}

/** Ícone “i” com explicação acessível por foco, toque ou mouse. */
export function InfoTip({ texto, rotulo = 'Mais informações' }) {
  const [aberto, setAberto] = useState(false);
  const id = useId();
  return (
    <span className="infotip" onMouseEnter={() => setAberto(true)} onMouseLeave={() => setAberto(false)}>
      <button type="button" className="infobtn" aria-label={rotulo} aria-expanded={aberto} aria-describedby={aberto ? id : undefined}
        onClick={() => setAberto((a) => !a)} onBlur={() => setAberto(false)} onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}>i</button>
      {aberto && <span role="tooltip" id={id} className="tipbox">{texto}</span>}
    </span>
  );
}

export const Carregando = ({ state }) =>
  state.loading && !state.data ? <div className="skeleton" role="status" aria-label="Carregando"><i /><i /><i /></div>
    : state.error ? <div className="empty">Não foi possível carregar os dados ({state.error.message}).</div> : null;

export const Baixar = ({ path, params, texto = 'Baixar CSV' }) => <a className="btn" href={csvUrl(path, params)} download>{texto}</a>;

/** Seção recolhível (usa <details>, acessível por padrão). */
export function Recolhivel({ titulo, nota, acoes, aberto = false, children }) {
  return (
    <details className="collapse" open={aberto}>
      <summary><span><strong>{titulo}</strong>{nota && <small>{nota}</small>}</span></summary>
      <div className="collapse-body">
        {acoes && <div className="collapse-actions">{acoes}</div>}
        {children}
      </div>
    </details>
  );
}

export const Card = ({ titulo, nota, acoes, children }) => (
  <section className="card">
    <header>
      <div><h2>{titulo}</h2>{nota && <p className="note">{nota}</p>}</div>
      {acoes}
    </header>
    {children}
  </section>
);

/** Rótulos de candidato com forma/padrão além da cor (acessibilidade para daltonismo). */
export const Legenda = () => (
  <div className="legend" aria-label="Legenda dos candidatos">
    <span><i className="sw lula" />Lula (sólido)</span>
    <span><i className="sw flavio" />Flávio Bolsonaro (listrado)</span>
    <span><i className="sw outros" />Outros (claro)</span>
  </div>
);

/** Barra empilhada Lula | Flávio | Outros, em HTML para ficar legível em telas pequenas. */
export function BarraCandidatos({ lula, flavio, outros = null, compacta = false }) {
  if (lula == null || flavio == null) return <div className="bar bar-vazia">Sem resultado do 1º turno</div>;
  const w = (x) => `${Math.max(0, x * 100)}%`;
  return (
    <div className={'bar' + (compacta ? ' compacta' : '')} role="img" aria-label={`Lula ${nPct(lula)}, Flávio Bolsonaro ${nPct(flavio)}${outros != null ? `, outros ${nPct(outros)}` : ''}`}>
      <span className="seg lula" style={{ width: w(lula) }}><b>Lula</b> {nPct(lula)}</span>
      <span className="seg flavio" style={{ width: w(flavio) }}><b>Flávio</b> {nPct(flavio)}</span>
      {outros != null && outros > 0.005 && <span className="seg outros" style={{ width: w(outros) }} title={`Outros ${nPct(outros)}`} />}
    </div>
  );
}

/** Botões "Baixar gráfico (PNG)" e "Baixar dados (CSV)" para um cartão com um gráfico em SVG. O PNG leva título e filtros ativos. */
export function BaixarGrafico({ titulo, filtros = '', nome, csv }) {
  const [erro, setErro] = useState('');
  const png = async (e) => {
    const alvo = e.currentTarget.closest('.card, .flow-wrap, section') || document;
    const svg = alvo.querySelector('.chart svg, .flow svg');
    if (!svg) { setErro('Gráfico indisponível.'); return; }
    try { setErro(''); await baixarPng(svg, { titulo, filtros, nome: nomeArquivo(nome || titulo) }); } catch (x) { setErro(x.message); }
  };
  return (
    <span className="baixar-grafico">
      <button type="button" className="btn" onClick={png}>Baixar gráfico (PNG)</button>
      {csv && <button type="button" className="btn" onClick={() => baixarCsv(nomeArquivo(nome || titulo), csv.colunas, csv.linhas)}>Baixar dados (CSV)</button>}
      {erro && <span className="note" role="alert">{erro}</span>}
    </span>
  );
}
