import { useState } from 'react';
import { nInt } from '../format.js';
import { InfoTip } from './ui.jsx';
import { useWidth } from './Charts.jsx';
import { BaixarGrafico } from './ui.jsx';
import { descreveFiltros } from '../exportar.js';

const NOTA = 'Estas são mudanças nas listas publicadas. Uma seção que sai de uma lista não necessariamente teve o local de votação fisicamente alterado ou cancelado; pode ter sido corrigida, reclassificada ou excluída por outro motivo que os dados não informam.';

/** Fluxo entre versões consecutivas: o que ficou, o que saiu e o que entrou. */
export default function SectionTransitionFlow({ listas, transicoes, filtros }) {
  const [ref, w] = useWidth();
  const [foco, setFoco] = useState(null);   // só o destaque ao passar o mouse: não vai para a URL
  const seq = transicoes.filter((t) => t.ate === t.de + 1);
  const cols = listas;
  const colW = 16, topo = 34, H = 330, baixo = 40, desce = 38;
  const max = Math.max(...cols.map((c) => c.secoes));
  const esc = (H - topo - baixo - desce - 30) / max;
  const gap = (w - 24 - cols.length * colW) / (cols.length - 1);
  const x = (i) => 12 + i * (colW + gap);
  const nomes = ['18/10 · 11h', '18/10 · 17h', '19/10 · 11h', '20/10 · 13h59'];
  const faixa = (x0, y0, x1, y1, h) => {
    const m = (x0 + x1) / 2;
    return `M${x0},${y0} C${m},${y0} ${m},${y1} ${x1},${y1} L${x1},${y1 + h} C${m},${y1 + h} ${m},${y0 + h} ${x0},${y0 + h} Z`;
  };
  return (
    <div className="flow">
      <div className="flow-legenda">
        <span><i className="sw mant" />Ficaram na lista</span>
        <span><i className="sw saiu" />Saíram</span>
        <span><i className="sw entrou" />Entraram</span>
        <InfoTip texto={NOTA} rotulo="O que significa sair ou entrar numa lista" />
      </div>
      <div className="chart" ref={ref}>
        <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Fluxo de seções entre as listas: quantas ficaram, saíram e entraram em cada atualização">
          {cols.map((c, i) => (
            <g key={c.id}>
              <rect x={x(i)} y={topo} width={colW} height={Math.max(2, c.secoes * esc)} rx="3" className="col" />
              <text x={x(i) + colW / 2} y={topo - 18} textAnchor="middle" className="strong">{nInt(c.secoes)}</text>
              <text x={x(i) + colW / 2} y={H - 18} textAnchor={i === 0 ? 'start' : i === cols.length - 1 ? 'end' : 'middle'} dx={i === 0 ? -colW / 2 : i === cols.length - 1 ? colW / 2 : 0}>{nomes[i]}</text>
            </g>
          ))}
          {seq.map((t, i) => {
            const k = t.mantidas.secoes, r = t.removidas.secoes, a = t.adicionadas.secoes;
            const x0 = x(i) + colW, x1 = x(i + 1);
            const hk = Math.max(2, k * esc), hr = Math.max(2, r * esc), ha = Math.max(2, a * esc);
            const gx = (x1 - x0);
            return (
              <g key={t.id} tabIndex={0} onFocus={() => setFoco(t.id)} onBlur={() => setFoco(null)} onMouseEnter={() => setFoco(t.id)} onMouseLeave={() => setFoco(null)}
                className={'flux' + (foco === t.id ? ' on' : '')} aria-label={`${t.rotulo}: ${r} saíram, ${k} ficaram, ${a} entraram`}>
                <path d={faixa(x0, topo, x1, topo, hk)} className="r-mant" />
                <path d={faixa(x0, topo + k * esc, x0 + gx * 0.45, topo + k * esc + desce, hr)} className="r-saiu" />
                <path d={faixa(x0 + gx * 0.55, topo + k * esc + desce, x1, topo + k * esc, ha)} className="r-entrou" />
                <text x={x0 + gx * 0.5} y={topo + hk / 2 + 4} textAnchor="middle" className="strong">{nInt(k)}</text>
                <text x={x0 + gx * 0.225} y={topo + k * esc + desce + hr + 14} textAnchor="middle" className="t-saiu">−{nInt(r)}</text>
                <text x={x0 + gx * 0.775} y={topo + k * esc + desce + ha + 14} textAnchor="middle" className="t-entrou">+{nInt(a)}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <BaixarGrafico titulo="Quem saiu, ficou e entrou entre as listas" filtros={descreveFiltros(filtros)} nome="fluxo-entre-listas"
        csv={{ colunas: [{ key: 'rotulo', label: 'Troca' }, { key: (t) => t.removidas.secoes, label: 'Saíram' }, { key: (t) => t.mantidas.secoes, label: 'Ficaram' }, { key: (t) => t.adicionadas.secoes, label: 'Entraram' }], linhas: transicoes }} />
      <ul className="flow-lista">
        {transicoes.map((t) => (
          <li key={t.id} className={t.id === '1-4' ? 'cumul' : ''}>
            <strong>{t.id === '1-4' ? 'Primeira lista → lista de 20/10 · 13h59 (comparação direta)' : t.rotulo}</strong>
            <span><b className="t-saiu">−{nInt(t.removidas.secoes)}</b> saíram</span>
            <span><b>{nInt(t.mantidas.secoes)}</b> ficaram</span>
            <span><b className="t-entrou">+{nInt(t.adicionadas.secoes)}</b> entraram</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
