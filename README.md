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

## Navegação

Visão geral (narrativa) · Evolução das listas · Impacto potencial · Explorar dados (estados, municípios, seções, adicionadas/removidas/mantidas) · Metodologia e fontes (PDFs em `/relatorios`).

Os filtros (estado, município, versão, transição, candidato na frente, situação) ficam na URL (`#/explorar/secoes?uf=SP&lista=3`), então qualquer visão filtrada é compartilhável. Todas as tabelas têm busca, ordenação, paginação e exportação em CSV (`/api/<recurso>?format=csv`).

## Princípios estatísticos

- Tudo é calculado a partir do CSV (`server/data.js`, endpoint `/api/historia`); nada é fixo no código.
- Seções sem resultado do 1º turno (10) ficam fora das porcentagens e nunca viram “zero voto”.
- Eleitores da lista, aptos no 1º turno e votos válidos são medidas diferentes e aparecem separadas.
- A margem de uma lista não é a margem nacional; a variação entre listas não é “swing”.
- O cenário hipotético não é previsão e não usa totais nacionais (não existem nos dados).
