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

`server/data/secoes_v.csv` consolida várias listas (18/10 11h, 18/10 17h, 19/10 11h, 20/10 13h59 e 20/10 15h27 — as duas últimas do site original do TSE, painel Seções alteradas) e os votos do 1º turno. A lista mais recente, de 20/10 15h27 (453 seções, baixada em 20/10 às 17h46), vale por inteira, mesmo para seções sem cruzamento com as demais listas ou com os votos (entram como "sem resultado"). Ela vem de `server/data/fontes/secoes_eleitorais_alteradas_2t-pais_2026_lista5.csv` e é aplicada com `node scripts/aplicar-lista-recente.mjs <csv> <número da lista>` (uma lista nova cria as colunas dela sem alterar as anteriores) (confere que são as mesmas seções e atualiza os locais de votação).

## Navegação

Visão geral (narrativa) · Evolução das listas · Impacto potencial · Explorar dados (estados, municípios, seções, adicionadas/removidas/mantidas) · Metodologia e fontes.

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

## Atualização das listas do TSE

O TSE atualiza o painel às 06:25, 11:25, 15:25 e 20:25. Cada lista nova vira a lista N+1 (as anteriores não mudam).

- **Manifesto das listas:** `server/data/listas.json` (id, rótulo, quando foi publicada e baixada). O site lê rótulos, datas e o aviso do TSE daqui; nenhum texto do site tem data fixa.
- **`node scripts/atualizar-lista.mjs <link .csv.zip | .zip | .csv> [--publicada-em ISO] [--fonte texto]`**: baixa, confere (colunas, seções repetidas, tamanho plausível), compara com a lista mais recente (se for igual, não faz nada; diferenças só de espaços não contam) e aplica. A data de publicação vem do link do CDN (`…/20261020_152755/…`). Se algo der errado, nada é alterado.
- **Como pegar a lista sozinho (no seu computador):** o painel do SIG/TSE bloqueia data centers (403) e não tem link de download na página. `scripts/raspar-painel.mjs` abre o painel com o Chrome de verdade (como o projeto [gusehr/tse-mudanca-secao](https://github.com/gusehr/tse-mudanca-secao)), lê "Última atualização" e, **se for nova**, tenta (1) o caminho do botão *Gerar arquivos* (que devolve o link oficial do `.csv.zip`) e, se falhar, (2) lê a tabela inteira página por página, conferindo o total. Requer `npm i -D playwright` e o Chrome instalado.
- **Rotina completa:** `scripts/atualizar-tudo.mjs` faz tudo (painel → análise → consulta → conferência → push). Exemplo de cron (Brasília, 10 min depois de cada atualização do TSE): `35 6,11,15,20 * * *  cd ~/secoes-eleitorais && CONSULTA_DIR=~/secoes-eleitorais-consulta-2026 node scripts/atualizar-tudo.mjs >> ~/atualizacao.log 2>&1`
- **Manual pelo GitHub:** Actions → *Atualizar lista do TSE* → *Run workflow* → cole o link do `.csv.zip`. O GitHub não consegue ler o painel (bloqueio), então não há agendamento lá.
- **Conferência:** `npm run verificar` recalcula tudo direto do CSV e compara com o que o site mostra.
