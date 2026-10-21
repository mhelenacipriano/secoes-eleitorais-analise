const COLUNAS = [
  { cls: 'sabemos', titulo: 'O que sabemos', itens: ['Quais seções apareceram em cada lista.', 'Como essas seções votaram no 1º turno.', 'Como as listas mudaram ao longo do tempo.'] },
  { cls: 'estimamos', titulo: 'O que dá para estimar', itens: ['Quantos eleitores estavam em seções que aparecem nas listas.', 'Cenários hipotéticos, com suposições que você mesmo escolhe.'] },
  { cls: 'nao', titulo: 'O que não sabemos', itens: ['Se algum eleitor foi impedido de votar.', 'Quantos eleitores foram realmente afetados no dia da eleição.', 'Se as revisões mudaram o resultado final.', 'Por que cada registro foi adicionado ou removido.'] },
];

export default function SaberEstimar() {
  return (
    <div className="tres">
      {COLUNAS.map((c) => (
        <section key={c.cls} className={'coluna ' + c.cls}>
          <h3>{c.titulo}</h3>
          <ul>{c.itens.map((i) => <li key={i}>{i}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}
