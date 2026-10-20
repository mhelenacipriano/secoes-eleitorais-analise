const COLUNAS = [
  { cls: 'sabemos', titulo: 'O que sabemos', itens: ['Quais seções apareceram em cada lista.', 'O perfil de votação delas no 1º turno.', 'Como as listas mudaram ao longo do tempo.'] },
  { cls: 'estimamos', titulo: 'O que podemos estimar', itens: ['O tamanho do eleitorado potencialmente exposto a mudanças de local.', 'Cenários hipotéticos de comparecimento, sob premissas explícitas.'] },
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
