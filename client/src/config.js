// Endereço da página de consulta ("Sua seção mudou?"). Pode ser trocado com VITE_CONSULTA_URL no build.
export const CONSULTA_URL = import.meta.env.VITE_CONSULTA_URL || 'https://www.secoes-eleitorais-consulta-2026.app/';

// Lista mais recente que temos (a última do arquivo de dados) e o que o próprio site do TSE informa sobre as atualizações.
export const ULTIMA = { id: 5, label: '20/10 · 15h27', quando: '20/10 às 15h27' };
export const TSE_ATUALIZACAO = { ultima: '20.10.2026 - 15:27', proxima: '20.10.2026 - 20:25', frequencia: 'às 06:25, 11:25, 15:25 e 20:25' };
export const BAIXADA_EM = '20/10 às 17h46';
