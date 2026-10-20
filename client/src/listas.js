// As listas (rótulos, datas, qual é a mais recente) vêm do servidor (meta.listas); aqui ficam os ajudantes que os componentes usam.
// definirListas() é chamado uma vez, assim que o meta chega, antes de qualquer componente que dependa disso ser desenhado.
let LISTAS = [];
export const definirListas = (l) => { LISTAS = l || []; };
export const todasListas = () => LISTAS;
export const idsListas = () => LISTAS.map((l) => l.id);
export const ultimaLista = () => LISTAS[LISTAS.length - 1] || { id: 0, label: '', nome: '' };
export const primeiraLista = () => LISTAS[0] || { id: 0, label: '', nome: '' };
export const ehUltima = (id) => id === ultimaLista().id;
export const rotuloLista = (id) => (LISTAS.find((l) => l.id === id) || {}).label || `lista ${id}`;
/** "20/10 · 15h27" → "20/10 às 15h27" */
export const quando = (label) => String(label || '').replace(' · ', ' às ');
/** "18/10 às 11h, 18/10 às 17h e 19/10 às 11h" (a última com "e") */
export const datasPorExtenso = (ids = idsListas()) => {
  const t = ids.map((id) => quando(rotuloLista(id)));
  return t.length > 1 ? `${t.slice(0, -1).join(', ')} e ${t[t.length - 1]}` : t[0] || '';
};
/** Nome da transição entre duas listas: "1-5" → rótulos das listas */
export const ordinal = (n) => `${n}ª`;

const dois = (n) => String(n).padStart(2, '0');
/** ISO → "20.10.2026 - 15:27" (horário de Brasília, como o site do TSE) */
export const dataTse = (iso) => {
  if (!iso) return '';
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('day')}.${g('month')}.${g('year')} - ${g('hour')}:${g('minute')}`;
};
/** ISO → "20/10 às 17h46" */
export const dataHora = (iso) => {
  if (!iso) return '';
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('day')}/${g('month')} às ${g('hour')}h${g('minute') === '00' ? '' : g('minute')}`;
};

// Horários de atualização do painel do TSE (informados no próprio site), em Brasília.
export const HORARIOS_TSE = ['06:25', '11:25', '15:25', '20:25'];
/** Próxima atualização prevista depois de `iso`: { texto, iso } */
export const proximaAtualizacao = (iso) => {
  const base = new Date(iso);
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  for (let d = 0; d < 3; d++) {
    const dia = f.format(new Date(base.getTime() + d * 86400000));
    for (const h of HORARIOS_TSE) { const t = new Date(`${dia}T${h}:00-03:00`); if (t > base) return { iso: t.toISOString(), texto: dataTse(t.toISOString()) }; }
  }
  return { iso: '', texto: '' };
};
