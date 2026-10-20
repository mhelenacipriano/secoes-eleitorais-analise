import { useEffect, useState } from 'react';

const COR_META = { dark: '#0e1116', light: '#f5f6f8' };
const atual = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

/** Alterna entre tema claro e escuro. A escolha fica salva no navegador; sem escolha, segue o sistema. */
export default function ThemeToggle() {
  const [tema, setTema] = useState(atual);
  const aplicar = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_META[t]);
    setTema(t);
  };
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const on = (e) => { let salvo = null; try { salvo = localStorage.getItem('tema'); } catch { /* sem armazenamento */ } if (!salvo) aplicar(e.matches ? 'light' : 'dark'); };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const claro = tema === 'light';
  const alternar = () => { const t = claro ? 'dark' : 'light'; try { localStorage.setItem('tema', t); } catch { /* sem armazenamento */ } aplicar(t); };
  return (
    <button type="button" className="theme-btn" onClick={alternar} aria-label={claro ? 'Ativar tema escuro' : 'Ativar tema claro'} title={claro ? 'Tema escuro' : 'Tema claro'}>
      {claro ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" fill="currentColor" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></g></svg>
      )}
    </button>
  );
}
