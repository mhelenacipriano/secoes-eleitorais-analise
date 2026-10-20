import { useMemo } from 'react';
import { useParam, useParamNum } from '../router.js';
import { setDestaque, useDestaque } from '../destaque.js';
import { InfoTip } from './ui.jsx';

/** Tabela com ordenação por clique no título, busca opcional e paginação. */
export default function DataTable({ columns, rows, initialSort, pageSize = 0, free = false, vazio = 'Nenhuma linha para este filtro.', chave = 't', idLinha }) {
  const dest = useDestaque();
  // ordenação e página ficam na URL (chave+o = coluna, chave+d = sentido, chave+p = página), para o link reproduzir a tabela
  const [oKey, setOKey] = useParam(chave + 'o', initialSort?.key || '');
  const [oDir, setODir] = useParamNum(chave + 'd', initialSort?.dir || 1);
  const [pagina, setPagina] = useParamNum(chave + 'p', 1);
  const sort = oKey && columns.some((c) => c.key === oKey) ? { key: oKey, dir: oDir < 0 ? -1 : 1 } : initialSort || null;
  const page = Math.max(0, pagina - 1);
  const setPage = (n) => setPagina(n + 1);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const { key, dir } = sort;
    return [...rows].sort((a, b) => {
      const x = a[key], y = b[key];
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')) * dir;
    });
  }, [rows, sort]);
  const pages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const p = Math.min(page, pages - 1);
  const shown = pageSize ? sorted.slice(p * pageSize, (p + 1) * pageSize) : sorted;
  const click = (key, first) => { const dir = sort && sort.key === key ? -sort.dir : first ? 1 : -1; setPagina(1); setOKey(key); setODir(dir); };

  if (!rows.length) return <div className="empty">{vazio}</div>;
  return (
    <>
      <div className={'tablewrap' + (free ? ' free' : '')}>
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.key} className={c.left ? 'left' : ''} aria-sort={sort && sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                  <button onClick={() => click(c.key, i === 0)}>{c.label}{sort && sort.key === c.key ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</button>{c.hint && <InfoTip texto={c.hint} rotulo={`O que significa ${c.label}`} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className={idLinha && dest && dest === idLinha(r) ? 'hl' : undefined} onMouseEnter={idLinha ? () => setDestaque(idLinha(r)) : undefined} onMouseLeave={idLinha ? () => setDestaque('') : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={(c.left ? 'left ' : '') + (c.wrap ? 'wrap ' : '') + (c.tone ? (r[c.key] == null ? '' : r[c.key] >= 0 ? 'pos' : 'neg') : '')}>{c.format ? c.format(r[c.key]) : r[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && pages > 1 && (
        <div className="pager">
          <span>{p * pageSize + 1}–{Math.min((p + 1) * pageSize, sorted.length)} de {sorted.length.toLocaleString('pt-BR')}</span>
          <button className="btn" disabled={p === 0} onClick={() => setPage(p - 1)}>Anterior</button>
          <button className="btn" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Próxima</button>
        </div>
      )}
    </>
  );
}
