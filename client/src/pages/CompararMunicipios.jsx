import { useMemo } from 'react';
import { useApi } from '../api.js';
import { nInt, nPct, nPts, quem } from '../format.js';
import { H } from '../hints.js';
import { useParam, useParamNum } from '../router.js';
import { BarrasMargem } from '../components/Charts.jsx';
import { BaixarGrafico, Card, Carregando, Legenda } from '../components/ui.jsx';
import { ehUltima, ultimaLista } from '../listas.js';

const valorDe = (m) => `${m.uf}:${m.municipio.split(' · ').slice(1).join(' · ')}`;
const nomeDe = (m) => m.municipio.split(' · ').slice(1).join(' · ');

/** Retrato de um município na lista escolhida (a mesma para os dois: só se compara dentro da mesma lista). */
function useRetrato(valor, listaId) {
  const st = useApi('historia', { municipio: valor }, { pular: !valor });
  return useMemo(() => {
    if (!st.data) return { st, listas: [], ultima: null };
    const listas = st.data.listas.filter((l) => l.secoes > 0);
    return { st, listas, ultima: listas.find((l) => l.id === listaId) || null };
  }, [st, listaId]);
}

const LINHAS = [
  ['Seções na lista', (u) => nInt(u.secoes)],
  ['Eleitores nessas seções', (u) => nInt(u.eleitores), H.eleitores],
  ['Lula (votos válidos, 1º turno)', (u) => nPct(u.lulaPct), H.pct],
  ['Flávio Bolsonaro (votos válidos, 1º turno)', (u) => nPct(u.flavioPct), H.pct],
  ['Margem (Lula − Flávio)', (u) => nPts(u.margem), H.margem],
  ['Seções sem resultado do 1º turno', (u) => nInt(u.semResultado), 'Seções sem resultado do 1º turno cruzado ficam fora das porcentagens.'],
];

/** Duas cidades lado a lado, com uma frase em linguagem simples sobre a diferença. */
export default function CompararMunicipios() {
  const [lid, setLid] = useParamNum('l', ultimaLista().id);       // lista usada na comparação (padrão: a mais recente)
  const hist = useApi('historia');
  const lista = useApi('municipios', { lista: String(lid) });
  const [aP, setA] = useParam('a'), [bP, setB] = useParam('b');
  // só se comparam municípios que aparecem na lista escolhida: o que não aparece nela é descartado (e sai da URL ao escolher de novo)
  const noConjunto = (v) => Boolean(v) && (lista.data || []).some((m) => valorDe(m) === v && m.secoes > 0);
  const a = noConjunto(aP) ? aP : '', b = noConjunto(bP) ? bP : '';
  const ra = useRetrato(a, lid), rb = useRetrato(b, lid);
  const rotuloLista = (hist.data?.listas || []).find((l) => l.id === lid)?.label || `lista ${lid}`;
  const opcoes = useMemo(() => {
    const por = new Map();
    for (const m of (lista.data || []).filter((x) => x.secoes > 0)) (por.get(m.uf) || por.set(m.uf, []).get(m.uf)).push(m);
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
  if (!lista.data || !hist.data) return <Carregando state={lista.data ? hist : lista} />;

  const ua = ra.ultima, ub = rb.ultima;
  const barras = [[a, ua], [b, ub]].filter(([, l]) => l && l.margem != null).map(([v, l]) => ({ id: v, rotulo: nome(v), valor: l.margem, dica: [`${nInt(l.secoes)} seções · ${nInt(l.eleitores)} eleitores`, `Lula ${nPct(l.lulaPct)} · Flávio ${nPct(l.flavioPct)}`] }));
  const frase = (() => {
    if (!ua || !ub || ua.margem == null || ub.margem == null) return null;
    const na = nome(a), nb = nome(b), dif = ua.margem - ub.margem;
    const maior = Math.max(ua.secoes, ub.secoes) / Math.max(1, Math.min(ua.secoes, ub.secoes));
    return (
      <>
        Na lista <strong>{rotuloLista}</strong>, <strong>{na}</strong> tem {nInt(ua.secoes)} {ua.secoes === 1 ? 'seção' : 'seções'} ({nInt(ua.eleitores)} eleitores), com {quem(ua.margem)} no 1º turno; <strong>{nb}</strong> tem {nInt(ub.secoes)} {ub.secoes === 1 ? 'seção' : 'seções'} ({nInt(ub.eleitores)} eleitores), com {quem(ub.margem)}.{' '}
        {Math.abs(dif) < 0.5 ? 'As margens são praticamente iguais.' : <>A diferença entre as margens é de <strong>{nPts(Math.abs(dif))}</strong>, mais favorável a {dif > 0 ? 'Lula em ' + na : 'Lula em ' + nb}.</>}
        {maior >= 4 && <> Atenção: os dois conjuntos têm tamanhos bem diferentes (um tem {nInt(maior)}× mais seções), então a comparação é frágil.</>}
      </>
    );
  })();

  return (
    <div className="stack">
      <Card titulo="Comparar dois municípios" nota="Escolha dois municípios para ver, lado a lado, o perfil eleitoral das seções que aparecem nas listas de cada um. O link guarda a sua escolha.">
        <label className="comp-sel comp-lista">Lista usada na comparação
          <select value={lid} onChange={(e) => setLid(Number(e.target.value))}>
            {hist.data.listas.map((l) => <option key={l.id} value={l.id}>{ehUltima(l.id) ? `${l.nome} (mais recente)` : l.nome}</option>)}
          </select>
        </label>
        <div className="comp-selecao">{seletor('Município A', a, setA, b)}{seletor('Município B', b, setB, a)}</div>
        <p className="note">Só é possível comparar dois municípios que aparecem na mesma lista. A lista escolhida tem {nInt(opcoes.reduce((t, [, ms]) => t + ms.length, 0))} municípios; ao trocar de lista, as opções mudam.</p>
      </Card>
      {(!a || !b) && <div className="empty">Escolha os dois municípios para comparar{aP && !a || bP && !b ? ' (um dos escolhidos não aparece na lista selecionada)' : ''}.</div>}
      {a && b && (ra.st.loading || rb.st.loading) && <Carregando state={{ loading: true, data: null }} />}
      {a && b && ua && ub && (
        <>
          <Card titulo="Lado a lado" nota={`Valores na lista ${rotuloLista}. A margem é do 1º turno e descreve o perfil das seções, não o motivo da mudança.`}>
            <p className="comp-frase" aria-live="polite">{frase}</p>
            <div className="tablewrap free">
              <table className="comp-tab">
                <thead><tr><th className="left">Indicador</th><th>{nome(a)}</th><th>{nome(b)}</th></tr></thead>
                <tbody>
                                    {LINHAS.map(([rot, f]) => <tr key={rot}><td className="left">{rot}</td><td>{f(ua)}</td><td>{f(ub)}</td></tr>)}
                  <tr><td className="left">Presente em</td><td>{ra.listas.length} de {hist.data.listas.length} listas</td><td>{rb.listas.length} de {hist.data.listas.length} listas</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
          <Card titulo="Margem na lista escolhida" acoes={<BaixarGrafico titulo={`Margem: ${nome(a)} × ${nome(b)} (lista ${rotuloLista})`} filtros={`Lista: ${rotuloLista}`} nome={`comparar-${nome(a)}-${nome(b)}`}
            csv={{ colunas: [{ key: 'indicador', label: 'Indicador' }, { key: 'a', label: nome(a) }, { key: 'b', label: nome(b) }], linhas: LINHAS.map(([rot, f]) => ({ indicador: rot, a: f(ua), b: f(ub) })) }} />} nota="Barra à direita (sólida): Lula na frente. Barra à esquerda (listrada): Flávio na frente.">
            <Legenda />
            <BarrasMargem itens={barras} />
          </Card>
        </>
      )}
      {a && b && !ra.st.loading && !rb.st.loading && (!ua || !ub) && <div className="empty">Não há seções listadas para {!ua ? nome(a) : nome(b)} nesta lista.</div>}
    </div>
  );
}
