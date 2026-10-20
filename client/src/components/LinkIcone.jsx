/** Ícone pequeno de link externo, para citar a fonte sem poluir o texto. */
export default function LinkIcone({ href, rotulo }) {
  return (
    <a className="icone-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${rotulo} (abre em nova aba)`} title={rotulo}>
      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H6v11h11v-5h2v7H4V5h1Z" fill="currentColor" /></svg>
    </a>
  );
}
