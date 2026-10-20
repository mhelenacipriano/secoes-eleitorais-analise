# Seções eleitorais alteradas · 2º turno 2026

Site de jornalismo de dados que responde: **“As mudanças nos locais de votação poderiam ter influenciado o resultado da eleição presidencial de 2026?”**

React + Vite (cliente) · Node + Express (API) · dados em CSV (`server/data/secoes_v.csv`).

## Rodar

```bash
npm run install:all
npm run build   # gera client/dist
npm start       # http://localhost:3001
# desenvolvimento: npm run dev (API em :3001, Vite em :5173)
npm run verificar   # recalcula tudo do CSV e compara com a API
```

## Dados

`server/data/secoes_v.csv` consolida as quatro listas e os votos do 1º turno. A lista mais recente (441 seções) vale por inteira, mesmo para seções sem cruzamento com as demais listas ou com os votos (entram como "sem resultado"). Ela vem de `server/data/fontes/secoes_eleitorais_alteradas_2t-regiao_2026.csv` e é aplicada com `node scripts/aplicar-lista-recente.mjs <csv>` (confere que são as mesmas seções e atualiza os locais de votação).

## Navegação

Visão geral (narrativa) · Evolução das listas · Impacto potencial · Explorar dados (estados, municípios, seções, adicionadas/removidas/mantidas) · Metodologia e fontes (PDFs em `/relatorios`).

Os filtros (estado, município, versão, transição, candidato na frente, situação) ficam na URL (`#/explorar/secoes?uf=SP&lista=3`), então qualquer visão filtrada é compartilhável. Todas as tabelas têm busca, ordenação, paginação e exportação em CSV (`/api/<recurso>?format=csv`).

## Princípios estatísticos

- Tudo é calculado a partir do CSV (`server/data.js`, endpoint `/api/historia`); nada é fixo no código.
- Seções sem resultado do 1º turno (10) ficam fora das porcentagens e nunca viram “zero voto”.
- Eleitores da lista, aptos no 1º turno e votos válidos são medidas diferentes e aparecem separadas.
- A margem de uma lista não é a margem nacional; a variação entre listas não é “swing”.
- O cenário hipotético não é previsão e não usa totais nacionais (não existem nos dados).

## Tema

Claro e escuro, com alternância no topo (segue o sistema na primeira visita e guarda a escolha). Identidade em vermelho e branco/cinza-escuro; só os resultados de Flávio Bolsonaro são azuis, sempre também com padrão listrado e rótulo de texto.

## Deploy na Vercel

O front-end (Vite) vira site estático e a API Express roda como função (`api/index.js`, que reaproveita `server/index.js`). A configuração está em `vercel.json`.

1. Importe o repositório em vercel.com/new (Framework: Other; não mude os comandos, eles vêm do `vercel.json`).
2. Opcional: defina `VITE_CONSULTA_URL` (endereço da página de consulta) em Settings → Environment Variables para mostrar o link no rodapé.
3. Deploy. Cada push na branch de produção publica de novo.
