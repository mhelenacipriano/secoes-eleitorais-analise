export const nInt = (n) => (n == null ? '–' : Number(n).toLocaleString('pt-BR'));
export const nPct = (x, d = 1) => (x == null ? '–' : (x * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%');
export const nPts = (x, d = 1) => (x == null ? '–' : (x > 0.05 ? '+' : x < -0.05 ? '−' : '') + Math.abs(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' pts');
export const nSig = (x) => (x == null ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toLocaleString('pt-BR'));
export const tone = (m) => (m == null ? '' : m >= 0 ? 'pos' : 'neg');
