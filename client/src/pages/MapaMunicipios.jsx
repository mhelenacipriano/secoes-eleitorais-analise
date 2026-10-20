import { useMemo, useState } from 'react';
import { useApi } from '../api.js';
import { nInt, nPts, quem } from '../format.js';
import { useParam } from '../router.js';
import { Card, Carregando } from '../components/ui.jsx';
import { useWidth } from '../components/Charts.jsx';

const MIN_CONCLUIR = 10;   // com menos seções alteradas que isso, não se tira conclusão de uma cidade
const pct = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 1 : 0 }) + '%';

// faixas do mapa "quanto mudou" (parte das seções da cidade que mudou de local)
const FAIXAS_PARTE = [[1, 'menos de 1%', 0.2], [5, '1% a 5%', 0.4], [20, '5% a 20%', 0.65], [101, 'mais de 20%', 0.95]];
const faixaParte = (p) => FAIXAS_PARTE.find(([lim]) => p < lim);
// faixas do mapa "como votaram" (diferença, em pontos, entre as seções que mudaram e as demais da cidade)
const FAIXAS_DIF = [[-10, 'bem mais Flávio', 'F', 0.95], [-3, 'um pouco mais Flávio', 'F', 0.55], [3, 'parecidas', 'N', 0], [10, 'um pouco mais Lula', 'L', 0.55], [1e9, 'bem mais Lula', 'L', 0.95]];
const faixaDif = (d) => FAIXAS_DIF.find(([lim]) => d < lim);

function estilo(m, modo) {
  if (modo === 'parte') { const [, , op] = faixaParte(m.parte); return { fill: 'var(--lula)', fillOpacity: op }; }
  if (!m.concluir) return { fill: 'var(--neutro)', fillOpacity: 0.22 };
  const [, , lado, op] = faixaDif(m.dif);
  if (lado === 'N') return { fill: 'var(--neutro)', fillOpacity: 0.45 };
  return lado === 'L' ? { fill: 'var(--lula)', fillOpacity: op } : { fill: 'url(#hachMapa)', fillOpacity: op };
}

function Mapa({ geo, dados, modo, sel, onSel }) {
  const por = useMemo(() => new Map(dados.map((m) => [m.chave, m])), [dados]);
  return (
    <svg viewBox={`0 0 ${geo.largura} ${geo.altura}`} width="100%" role="group" aria-label="Mapa do Brasil com os municípios que têm seções alteradas" style={{ display: 'block', maxHeight: '70vh' }}>
      <defs><pattern id="hachMapa" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--flavio)" /><rect width="2.2" height="6" fill="var(--hachura)" /></pattern></defs>
      <path d={geo.estados} fill="none" stroke="var(--line)" strokeWidth="1" />
      {geo.municipios.map((g) => {
        const m = por.get(g.chave); if (!m) return null;
        const ativo = sel === g.chave;
        return (
          <path key={g.ibge} d={g.d} {...estilo(m, modo)} stroke={ativo ? 'var(--fg)' : 'var(--fg2)'} strokeWidth={ativo ? 3 : 0.7} tabIndex={0} role="button" style={{ cursor: 'pointer' }}
            aria-label={`${g.nome}, ${g.uf}: ${m.alteradas} de ${m.secoes} seções mudaram`} onClick={() => onSel(ativo ? '' : g.chave)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel(ativo ? '' : g.chave); } }}>
            <title>{`${g.nome} (${g.uf}): ${m.alteradas} de ${m.secoes} seções mudaram (${pct(m.parte)})`}</title>
          </path>
        );
      })}
    </svg>
  );
}

/** Funil: cada ponto é uma cidade. Cidades com poucas seções alteradas oscilam muito só por acaso; o funil mostra essa faixa. */
function Funil({ dados, sigma, deff, nCtrl, sel, onSel }) {
  const [ref, w] = useWidth();
  const esq = 44, dir = 10, topo = 10, base = 40, H = 320;
  const lim = 40;   // pontos além disso (cidades com 1 ou 2 seções) ficam encostados na borda
  const nMax = Math.max(...dados.map((m) => m.alteradas));
  const x = (n) => esq + (Math.log(n) / Math.log(nMax)) * (w - esq - dir);
  const y = (v) => topo + ((lim - v) / (2 * lim)) * (H - topo - base);
  const faixa = (n) => 1.96 * sigma * Math.sqrt(deff / n + 1 / nCtrl);
  const ns = Array.from({ length: 60 }, (_, i) => Math.exp((Math.log(nMax) * i) / 59));
  const cima = ns.map((n) => `${x(n).toFixed(1)},${y(Math.min(lim, faixa(n))).toFixed(1)}`), baixo = ns.map((n) => `${x(n).toFixed(1)},${y(Math.max(-lim, -faixa(n))).toFixed(1)}`).reverse();
  return (
    <div ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Cada ponto é uma cidade: quantas seções mudaram (horizontal) e quanto elas votaram diferente das demais (vertical). A área sombreada é a faixa esperada só pelo acaso.">
        <polygon points={[...cima, ...baixo].join(' ')} fill="var(--neutro)" fillOpacity=".18" />
        <line x1={esq} x2={w - dir} y1={y(0)} y2={y(0)} stroke="var(--fg)" strokeDasharray="4 3" />
        {[-lim, -lim / 2, 0, lim / 2, lim].map((t) => <text key={t} x={esq - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t > 0 ? '+' : t < 0 ? '−' : ''}{Math.abs(t)}</text>)}
        {[1, 3, 10, 30, 100, 300].filter((n) => n <= nMax).map((n) => <text key={n} x={x(n)} y={H - base + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{n}</text>)}
        <text x={(esq + w - dir) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--fg2)">Seções que mudaram na cidade →</text>
        <text x={12} y={(topo + H - base) / 2} textAnchor="middle" fontSize="12" fill="var(--fg2)" transform={`rotate(-90 12 ${(topo + H - base) / 2})`}>← mais Flávio · mais Lula →</text>
        {dados.map((m) => {
          const fora = Math.abs(m.dif) > faixa(m.alteradas), ativo = sel === m.chave;
          return <circle key={m.chave} cx={x(m.alteradas)} cy={y(Math.max(-lim, Math.min(lim, m.dif)))} r={ativo ? 7 : fora ? 4.5 : 3} fill={fora ? (m.dif > 0 ? 'var(--lula)' : 'var(--flavio)') : 'var(--neutro)'} fillOpacity={fora || ativo ? 1 : 0.6} stroke={ativo ? 'var(--fg)' : 'var(--bg)'} strokeWidth={ativo ? 2.5 : 0.8} tabIndex={0} role="button" style={{ cursor: 'pointer' }}
            aria-label={`${m.municipio}: ${m.alteradas} seções alteradas, diferença ${nPts(m.dif)}`} onClick={() => onSel(ativo ? '' : m.chave)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel(ativo ? '' : m.chave); } }}>
            <title>{`${m.municipio} (${m.uf}): ${m.alteradas} seções · ${nPts(m.dif)}`}</title>
          </circle>;
        })}
      </svg>
    </div>
  );
}

export default function MapaMunicipios() {
  const geoSt = useApi('mapa-municipios'), ctrlSt = useApi('controle');
  const [modo, setModo] = useParam('mapa', 'parte');          // 'parte' (quanto mudou) ou 'voto' (como votaram)
  const [sel, setSel] = useParam('mun');
  const dados = useMemo(() => (ctrlSt.data ? ctrlSt.data.porMunicipio.filter((m) => m.uf !== 'ZZ').map((m) => {
    const dif = m.margemControle == null ? null : m.margemAlteradas - m.margemControle;
    return { ...m, chave: `${m.uf}|${m.municipio}`, parte: (m.alteradas / m.secoes) * 100, dif, concluir: dif != null && m.alteradas >= MIN_CONCLUIR };
  }) : []), [ctrlSt.data]);
  if (!geoSt.data || !ctrlSt.data) return <Carregando state={geoSt.data ? ctrlSt : geoSt} />;

  const sigma = ctrlSt.data.sigma, deff = ctrlSt.data.efeitoDesenho;
  const foraDe = (x) => Math.abs(x.dif) > 1.96 * sigma * Math.sqrt(deff / x.alteradas + 1 / nCtrl);
  const comDif = dados.filter((m) => m.dif != null);
  const nCtrl = [...comDif].map((m) => m.controle).sort((a, b) => a - b)[Math.floor(comDif.length / 2)];
  const fora = comDif.filter(foraDe);
  const esperado = Math.round(comDif.length * 0.05);
  const exterior = ctrlSt.data.porMunicipio.filter((m) => m.uf === 'ZZ').reduce((s, m) => s + m.alteradas, 0);
  const m = dados.find((x) => x.chave === sel);
  const top = [...dados].sort((a, b) => b.alteradas - a.alteradas).slice(0, 5);

  const detalhe = m && (
    <div className="insight" role="status">
      <strong>{m.municipio.replace(/\b(\p{L})(\p{L}*)/gu, (_, a, b) => a + b.toLowerCase())} ({m.uf})</strong>: {nInt(m.alteradas)} de {nInt(m.secoes)} seções ({pct(m.parte)}) mudaram de local.{' '}
      {m.dif == null ? 'Não há seções sem mudança na cidade para comparar.' : <>No 1º turno, as que mudaram votaram assim: <strong>{quem(m.margemAlteradas)}</strong>; as demais da cidade: <strong>{quem(m.margemControle)}</strong>.{' '}
        {m.alteradas < MIN_CONCLUIR ? 'São poucas seções, então a diferença pode ser só acaso: não dá para concluir nada.' : foraDe(m) ? `A diferença (${nPts(m.dif)}) é maior do que o acaso costuma explicar.` : `A diferença (${nPts(m.dif)}) é do tamanho do que o acaso costuma produzir.`}</>}
    </div>
  );

  return (
    <div className="stack">
      <Card titulo="Onde estão as seções que mudaram de local" nota="Cada área do mapa é uma cidade que tem ao menos uma seção em alguma das listas do TSE. Toque numa cidade para ver o que aconteceu nela.">
        <div className="subnav" role="group" aria-label="O que o mapa mostra">
          <button aria-current={modo === 'parte' ? 'page' : undefined} onClick={() => setModo('parte')}>Quanto mudou</button>
          <button aria-current={modo === 'voto' ? 'page' : undefined} onClick={() => setModo('voto')}>Como votaram</button>
        </div>
        <p className="note" style={{ margin: '10px 0' }}>{modo === 'parte'
          ? 'Quanto mais escuro, maior a parte das seções da cidade que mudou de local.'
          : 'Compara, em cada cidade, as seções que mudaram de local com as que não mudaram, no 1º turno. Vermelho: as que mudaram votaram mais em Lula. Azul listrado: mais em Flávio. Cinza: parecidas, ou poucas seções para concluir algo (menos de 10).'}</p>
        <div className="legend" aria-label="Legenda">
          {modo === 'parte'
            ? FAIXAS_PARTE.map(([lim, rot, op]) => <span key={lim}><i className="sw" style={{ background: 'var(--lula)', opacity: op }} />{rot}</span>)
            : <><span><i className="sw flavio" />mais Flávio</span><span><i className="sw" style={{ background: 'var(--neutro)', opacity: 0.45 }} />parecidas</span><span><i className="sw lula" />mais Lula</span><span><i className="sw" style={{ background: 'var(--neutro)', opacity: 0.22 }} />poucas seções</span></>}
        </div>
        <Mapa geo={geoSt.data} dados={dados} modo={modo} sel={sel} onSel={setSel} />
        <label className="comp-sel">Ou escolha uma cidade
          <select value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">Escolha uma cidade</option>
            {[...dados].sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR')).map((x) => <option key={x.chave} value={x.chave}>{x.municipio} ({x.uf}) · {x.alteradas} seções</option>)}
          </select>
        </label>
        {detalhe}
        <p className="note">As cidades com mais seções alteradas são {top.map((x, i) => `${x.municipio.charAt(0) + x.municipio.slice(1).toLowerCase()} (${nInt(x.alteradas)})${i < top.length - 2 ? ', ' : i === top.length - 2 ? ' e ' : ''}`).join('')}.{exterior ? ` Outras ${nInt(exterior)} seções ficam no exterior e não aparecem no mapa.` : ''}</p>
      </Card>
      <Card titulo="As diferenças entre cidades são mais do que acaso?" nota="Cada ponto é uma cidade. Quanto mais à direita, mais seções mudaram nela; quanto mais acima ou abaixo, mais as seções que mudaram votaram diferente das outras da mesma cidade.">
        <Funil dados={comDif} sigma={sigma} deff={deff} nCtrl={nCtrl} sel={sel} onSel={setSel} />
        <div className="insight">
          <strong>Como ler:</strong> cidades com poucas seções mudadas variam muito só por sorte, por isso o gráfico afunila. A área cinza é a faixa em que esperaríamos ver a diferença <em>se as seções que mudaram votassem como as demais da cidade</em>. Ela já é mais larga porque seções da mesma escola votam de forma muito parecida (as mudanças vêm em grupos).
          Aqui, {nInt(fora.length)} de {nInt(comDif.length)} cidades ficam fora da faixa (cerca de {nInt(esperado)} cairiam fora só por acaso). {fora.length <= esperado * 1.6 ? 'Ou seja, quase tudo o que se vê é compatível com o acaso.' : 'Ou seja, há mais cidades fora da faixa do que o acaso explicaria, então vale olhar essas cidades com cuidado.'}
        </div>
        <p className="note">Pontos coloridos estão fora da faixa; cinza, dentro. Isto descreve como as seções votaram no 1º turno; não prova que a mudança de local alterou o resultado.</p>
      </Card>
    </div>
  );
}
