export const nInt = (n) => (n == null ? '–' : Math.round(Number(n)).toLocaleString('pt-BR'));
/** Margem só com sinal e número (para células de tabela; a unidade, pontos percentuais, vai no título da coluna ou na nota). */
export const nPp = (x, d = 1) => (x == null ? '–' : (x > 0.05 ? '+' : x < -0.05 ? '−' : '') + Math.abs(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
export const nPct = (x, d = 1) => (x == null ? '–' : (x * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%');
export const nPts = (x, d = 1) => (x == null ? '–' : (x > 0.05 ? '+' : x < -0.05 ? '−' : '') + Math.abs(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' pontos percentuais');
export const nSig = (x) => (x == null ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(Math.round(x)).toLocaleString('pt-BR'));
export const tone = (m) => (m == null ? '' : m >= 0 ? 'pos' : 'neg');

/** Quem estava na frente: texto neutro para usar em frases geradas. */
export const quem = (m, d = 1) => (m == null ? 'sem resultado' : Math.abs(m) < 0.5 ? 'praticamente empate' : m > 0 ? `Lula +${Math.abs(m).toLocaleString('pt-BR', { maximumFractionDigits: d })} pontos percentuais` : `Flávio +${Math.abs(m).toLocaleString('pt-BR', { maximumFractionDigits: d })} pontos percentuais`);
export const favorece = (m) => (m == null ? null : Math.abs(m) < 0.5 ? 'equilibradas' : m > 0 ? 'mais favoráveis a Lula' : 'mais favoráveis a Flávio Bolsonaro');
