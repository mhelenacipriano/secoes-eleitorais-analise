import { useState } from 'react';

/** Compartilha o link da página (menu nativo do celular ou cópia para a área de transferência). */
export default function ShareButton({ titulo, texto, className = 'btn big share-btn', children = 'Compartilhar' }) {
  const [copiado, setCopiado] = useState(false);
  const enviar = async () => {
    const dados = { title: titulo, text: texto, url: location.href };
    try {
      if (navigator.share) { await navigator.share(dados); return; }
      await navigator.clipboard.writeText(location.href);
      setCopiado(true); setTimeout(() => setCopiado(false), 2200);
    } catch (e) { if (e?.name !== 'AbortError') window.prompt('Copie o link:', location.href); }
  };
  return <button type="button" className={className} onClick={enviar}>{copiado ? 'Link copiado ✓' : children}</button>;
}
