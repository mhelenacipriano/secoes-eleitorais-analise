import { csvUrl } from '../api.js';

export const Carregando = ({ state }) =>
  state.loading && !state.data ? <div className="spinner">Carregando…</div> : state.error ? <div className="empty">Não foi possível carregar os dados ({state.error.message}).</div> : null;

export const Baixar = ({ path, params, texto = 'Baixar CSV' }) => <a className="btn" href={csvUrl(path, params)}>{texto}</a>;

export const Card = ({ titulo, nota, acoes, children }) => (
  <section className="card">
    <header>
      <div><h2>{titulo}</h2>{nota && <p className="note" style={{ margin: '2px 0 0' }}>{nota}</p>}</div>
      {acoes}
    </header>
    {children}
  </section>
);
