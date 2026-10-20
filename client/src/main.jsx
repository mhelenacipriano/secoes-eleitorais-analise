import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Estatisticas from './Estatisticas.jsx';
import { useContador } from './contador.js';
import './styles.css';

const naPaginaEstatisticas = () => location.hash.replace(/^#\/?/, '').startsWith('estatisticas');

function Raiz() {
  const [stats, setStats] = useState(naPaginaEstatisticas);
  useEffect(() => { const on = () => setStats(naPaginaEstatisticas()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  useContador(!stats);
  return stats ? <div className="app"><main><Estatisticas /></main></div> : <App />;
}

createRoot(document.getElementById('root')).render(<Raiz />);
