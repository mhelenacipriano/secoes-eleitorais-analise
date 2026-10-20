import { useSyncExternalStore } from 'react';

// Destaque compartilhado: passar o mouse (ou focar) num estado, troca ou município num gráfico ou tabela destaca o mesmo item nos outros.
let valor = '';
const ouvintes = new Set();
export const setDestaque = (v) => { if (v === valor) return; valor = v; ouvintes.forEach((f) => f()); };
export const useDestaque = () => useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => valor);
