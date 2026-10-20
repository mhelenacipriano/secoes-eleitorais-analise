import { useEffect, useState } from 'react';

export default function ToTop() {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const on = () => setVer(window.scrollY > 900);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return ver ? <button type="button" className="totop" aria-label="Voltar ao topo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button> : null;
}
