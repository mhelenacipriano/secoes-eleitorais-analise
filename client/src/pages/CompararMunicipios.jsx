import { useMemo } from 'react';
import { useApi } from '../api.js';
import { nInt, nPct, nPts, quem } from '../format.js';
import { H } from '../hints.js';
import { useParam } from '../router.js';
import { BarrasMargem } from '../components/Charts.jsx';
import { Card, Carregando, Legenda } from '../components/ui.jsx';

const valorDe = (m) => `${m.uf}:${m.municipio.split(' · ').slice(1).join(' · ')}`;
const nomeDe = (m) => m.municipio.split(' · ').slice(1).join(' · ');

/** Retrato de um município: a lista mais recente em que ele aparece e a margem em cada lista. */
function useRetrato(valor) {
  const st = useApi('historia', { municipio: valor }, { pular: !valor });
  return useMemo(() => {
    if (!st.data) return { st, listas: [], ultima: null };
    const listas = st.data.listas.filter((l) => l.secoes > 0);
    return { st, listas, ultima: listas.length ? listas[listas.length - 1] : null };
  }, [st]);
}

const LINHAS = [
  ['Seções na lista mais recente em que aparece', (u) => nInt(u.secoes)],
  ['Eleitores nessas seções', (u) => nInt(u.eleitores), H.eleitores],
  ['Lula (votos válidos, 1º turno)', (u) => nPct(u.lulaPct), H.pct],
  ['Flávio Bolsonaro (votos válidos, 1º turno)', (u) => nPct(u.flavioPct), H.pct],
  ['Margem (Lula − Flávio)', (u) => nPts(u.margem), H.margem],
  ['Seções sem resultado do 1º turno', (u) => nInt(u.semResultado), 'Seções sem resultado do 1º turno cruzado ficam fora das porcentagens.'],
];

/** Duas cidades lado a lado, com uma frase em linguagem simples sobre a diferença. */
export default function CompararMunicipios() {
  const lista = useApi('municipios');
  const [a, setA] = useParam('a'), [b, setB] = useParam('b');
  const ra = useRetrato(a), rb = useRetrato(b);
  const opcoes = useMemo(() => {
    const por = new Map();
    for (const m of lista.data || []) (por.get(m.uf) || por.set(m.uf, []).get(m.uf)).push(m);
    return [...por.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([uf, ms]) => [uf, ms.sort((x, y) => nomeDe(x).localeCompare(nomeDe(y), 'pt-BR'))]);
  }, [lista.data]);
  const nome = (v) => (v ? v.split(':').slice(1).join(':') + ' · ' + v.split(':')[0] : '');
  const seletor = (rotulo, valor, set, outro) => (
    <label className="comp-sel">{rotulo}
      <select value={valor} onChange={(e) => set(e.target.value)}>
        <option value="">Escolha um município</option>
        {opcoes.map(([uf, ms]) => <optgroup key={uf} label={uf}>{ms.filter((m) => valorDe(m) !== outro || valorDe(m) === valor).map((m) => <option key={valorDe(m)} value={valorDe(m)}>{nomeDe(m)} ({nInt(m.secoes)} seções)</option>)}</optgroup>)}
      </select>
    </label>
  );
  if (!lista.data) return <Carregando state={lista} />;

  const ua = ra.ultima, ub = rb.ultima;
  const barras = [[a, ra], [b, rb]].flatMap(([v, r]) => r.listas.map((l) => ({ id: `${v}|${l.id}`, rotulo: `${nome(v)} · ${l.label}`, valor: l.margem ?? 0, dica: [`${nInt(l.secoes)} seções · ${nInt(l.eleitores)} eleitores`, `Lula ${nPct(l.lulaPct)} · Flávio ${nPct(l.flavioPct)}`] })).filter((it) => it.valor != null));
  const frase = (() => {
    if (!ua || !ub || ua.margem == null || ub.margem == null) return null;
    const na = nome(a), nb = nome(b), dif = ua.margem - ub.margem;
    const maior = Math.max(ua.secoes, ub.secoes) / Math.max(1, Math.min(ua.secoes, ub.secoes));
    return (
      <>
        Na lista mais recente em que aparecem, <strong>{na}</strong> tem {nInt(ua.secoes)} {ua.secoes === 1 ? 'seção' : 'seções'} ({nInt(ua.eleitores)} eleitores), com {quem(ua.margem)} no 1º turno; <strong>{nb}</strong> tem {nInt(ub.secoes)} {ub.secoes === 1 ? 'seção' : 'seções'} ({nInt(ub.eleitores)} eleitores), com {quem(ub.margem)}.{' '}
        {Math.abs(dif) < 0.5 ? 'As margens são praticamente iguais.' : <>A diferença entre as margens é de <strong>{nPts(Math.abs(dif))}</strong>, mais favorável a {dif > 0 ? 'Lula em ' + na : 'Lula em ' + nb}.</>}
        {ua.id !== ub.id && <> Atenção: cada município foi lido na lista mais recente em que aparece, e elas são diferentes ({ua.label} e {ub.label}), então o retrato é de momentos diferentes.</>}
        {maior >= 4 && <> Atenção: os dois conjuntos têm tamanhos bem diferentes (um tem {nInt(maior)}× mais seções), então a comparação é frágil.</>}
      </>
    );
  })();

  return (
    <div className="stack">
      <Card titulo="Comparar dois municípios" nota="Escolha dois municípios para ver, lado a lado, o perfil eleitoral das seções que aparecem nas listas de cada um. O link guarda a sua escolha.">
        <div className="comp-selecao">{seletor('Município A', a, setA, b)}{seletor('Município B', b, setB, a)}</div>
      </Card>
      {(!a || !b) && <div className="empty">Escolha os dois municípios para comparar.</div>}
      {a && b && (ra.st.loading || rb.st.loading) && <Carregando state={{ loading: true, data: null }} />}
      {a && b && ua && ub && (
        <>
          <Card titulo="Lado a lado" nota="Valores da lista mais recente em que cada município aparece. A margem é do 1º turno e descreve o perfil das seções, não o motivo da mudança.">
            <p className="comp-frase" aria-live="polite">{frase}</p>
            <div className="tablewrap free">
              <table className="comp-tab">
                <thead><tr><th className="left">Indicador</th><th>{nome(a)}</th><th>{nome(b)}</th></tr></thead>
                <tbody>
                  <tr><td className="left">Lista usada</td><td>{ua.label}</td><td>{ub.label}</td></tr>
                  {LINHAS.map(([rot, f]) => <tr key={rot}><td className="left">{rot}</td><td>{f(ua)}</td><td>{f(ub)}</td></tr>)}
                  <tr><td className="left">Presente em</td><td>{ra.listas.length} de 4 listas</td><td>{rb.listas.length} de 4 listas</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
          <Card titulo="Margem em cada lista" nota="Barra à direita (sólida): Lula na frente. Barra à esquerda (listrada): Flávio na frente.">
            <Legenda />
            <BarrasMargem itens={barras} />
          </Card>
        </>
      )}
      {a && b && !ra.st.loading && !rb.st.loading && (!ua || !ub) && <div className="empty">Não há seções listadas para {!ua ? nome(a) : nome(b)} com esses filtros.</div>}
    </div>
  );
}
