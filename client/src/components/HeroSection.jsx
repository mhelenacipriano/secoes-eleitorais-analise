import { Reveal } from './ui.jsx';
import { quando, ultimaLista } from '../listas.js';
import ShareButton from './ShareButton.jsx';

export default function HeroSection({ onSaiba, onExplorar }) {
  return (
    <header className="hero">
      <Reveal>
        <p className="eyebrow">Eleições 2026 · Presidente · 2º turno</p>
        <h1>O que mudou nas seções eleitorais — e quem poderia ser afetado?</h1>
        <p className="hero-sub">Analisamos várias listas de locais de votação alterados divulgadas pelo TSE (a mais recente, de {quando(ultimaLista().label)}, está no painel Seções alteradas do site original), para o segundo turno de 2026, e cruzamos seus registros com os resultados do primeiro turno.</p>
        <p className="disclaimer" role="note">
          <strong>Importante:</strong> os dados mostram o perfil eleitoral das seções, não comprovam mudanças no resultado da eleição.
        </p>
        <div className="hero-cta">
          <button className="btn primary big" onClick={onSaiba}>Ver a evolução das listas ↓</button>
          <button className="btn big" onClick={onExplorar}>Explorar os dados</button>
          <ShareButton titulo="O que mudou nas seções eleitorais?" texto="Os dados mostram o perfil eleitoral das seções, não comprovam mudanças no resultado da eleição." />
        </div>
      </Reveal>
    </header>
  );
}
