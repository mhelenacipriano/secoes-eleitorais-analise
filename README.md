# Seções eleitorais alteradas · 2º turno de 2026

Site de jornalismo de dados que acompanha as listas de **seções eleitorais com local de votação alterado** divulgadas pelo TSE para o 2º turno da eleição presidencial de 2026 e pergunta, com cuidado estatístico: *essas mudanças poderiam ter influenciado o resultado?*

- Análise publicada: <https://secoes-eleitorais-analise.vercel.app/>
- Página de consulta para o eleitor (repositório irmão): <https://github.com/mhelenacipriano/secoes-eleitorais-consulta-2026>

> **Aviso.** Projeto independente, sem fins lucrativos e sem vínculo com a Justiça Eleitoral. Não é um canal oficial. Os dados vêm de listas públicas do TSE e podem estar desatualizados ou incompletos. Para saber o seu local de votação, use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE. Os números descrevem como as seções votaram no 1º turno; **não provam** que a mudança de local alterou (ou deixou de alterar) o resultado.

## O que o site mostra

| Página | Conteúdo |
| --- | --- |
| Visão geral | Narrativa curta: evolução das listas, perfil eleitoral das seções que saíram/entraram e o que se pode (e não se pode) concluir |
| Evolução das listas | Cada versão das listas do TSE, com número de seções, eleitores e a vantagem de Lula ou de Flávio Bolsonaro no 1º turno nessas seções |
| Impacto potencial | Simulador hipotético do 2º turno (Monte Carlo): quantos eleitores não conseguiriam votar, para onde iriam os votos, chance de cada candidato sob as suposições escolhidas |
| Explorar dados | Estados, municípios, seções, adicionadas/removidas/mantidas, comparação entre dois municípios e grupo de controle. Todas as tabelas têm busca, ordenação, paginação e exportação em CSV |
| Metodologia e fontes | Como cada número é calculado e de onde vem |

Os filtros ficam na URL (`#/explorar/secoes?uf=SP&lista=3`), então qualquer visão é compartilhável. O site tem tema claro e escuro; os resultados de Flávio Bolsonaro são sempre azuis **e** listrados, com rótulo de texto (não dependem só da cor).

## Fontes dos dados

- **Listas de seções alteradas:** painel [Seções alteradas do SIG/TSE](https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-eleitorado/se%C3%A7%C3%B5es-alteradas) (botão *Gerar arquivos*, arquivo `secoes_eleitorais_alteradas_2t-pais_2026.csv.zip` no CDN do TSE).
- **Votação do 1º turno por seção:** `votacao_secao_2026_BR.zip`, no CDN do TSE (`cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/`). Usada para o grupo de controle e para o total nacional.
- Resultados do 1º turno cruzados com cada seção: painel de resultados do SIG/TSE.

## Como rodar

Requisitos: Node.js 20 ou mais novo.

```bash
npm run install:all   # instala as dependências do servidor e do cliente
npm run build         # gera client/dist
npm start             # http://localhost:3001

# desenvolvimento (API em :3001, Vite em :5173)
npm run dev

# recalcula tudo direto do CSV e compara com o que a API devolve
npm run verificar
```

### Estrutura

```
client/                 React 18 + Vite (páginas em src/pages, gráficos em SVG em src/components)
server/                 Express: API e leitura dos CSV (server/index.js, server/data.js)
server/data/
  listas.json           manifesto das listas (id, rótulo, nome, link de origem, publicada em, baixada em)
  secoes_v.csv          todas as seções que já apareceram em alguma lista, com votos do 1º turno
  fontes/               o CSV recortado de cada lista (só as seções com local alterado)
  controle.json         grupo de controle e total nacional do 1º turno
  painel.json           última conferência do painel do TSE (e o que ele informa de última/próxima atualização)
scripts/                atualização das listas e geração do grupo de controle
api/index.js            entrada da função na Vercel (reaproveita server/index.js)
```

### API

Todas em `GET /api/<recurso>`; as que devolvem tabela aceitam `?format=csv`.
`meta`, `resumo`, `mudancas`, `distribuicao`, `estados`, `municipios`, `secoes`, `historia` e `controle`. Os filtros são `uf`, `municipio`, `lista`, `transicao`, `status` e `lider`.

## Modelo de dados

- Cada lista nova do TSE vira a lista **N+1**; as anteriores nunca mudam. O rótulo, as datas e os avisos do site são lidos de `listas.json`, sem nenhuma data escrita à mão no código.
- `secoes_v.csv` tem uma linha por seção (UF, município, zona, seção, local inicial e final, presença em cada lista `v1…vN`, eleitores em cada lista `el_v1…el_vN`) e os votos do 1º turno (`lula`, `flavio`, `outros`, `aptos`).
- A lista mais recente vale por inteira, mesmo para seções sem cruzamento com as outras listas ou com os votos (entram como "sem resultado" e ficam fora das porcentagens).

## Atualizando as listas do TSE

O TSE publica novas versões várias vezes por dia (perto de 06:27, 11:27, 15:27 e 20:27, horário de Brasília). Desde 22/10/2026 o arquivo vem com **todas as seções do país**, com o local final em branco nas que não mudaram; os scripts já descartam essas linhas e guardam só o recorte.

**Pelo GitHub (manual).** Em *Actions*:

- *Atualizar lista do TSE (automático)* → *Run workflow*: abre o painel do TSE com um navegador, descobre o link da lista mais recente e, se for nova, atualiza os dados. Em geral funciona; se o painel bloquear o acesso (erro 403) a execução termina com um aviso.
- *Atualizar lista do TSE* → *Run workflow* → cole o link do `.csv.zip` (cai nesta opção quando o painel bloqueia).

Os dois workflows estão **sem agendamento**. Para rodarem sozinhos, acrescente em `on:` um bloco `schedule` com `cron` em UTC (o GitHub pode atrasar ou pular execuções agendadas).

**No seu computador.**

```bash
# aplicar uma lista a partir do link (ou de um .zip/.csv local)
node scripts/atualizar-lista.mjs <link .csv.zip | arquivo> [--publicada-em ISO] [--fonte texto] [--simular]

# ler o painel do TSE com um navegador de verdade e devolver o link da lista mais recente
npm i -D playwright
node scripts/raspar-painel.mjs [--so-oficial | --so-tabela] [--forcar]

# rotina completa: painel → análise → (opcional) consulta → conferência → push
CONSULTA_DIR=~/secoes-eleitorais-consulta-2026 node scripts/atualizar-tudo.mjs

# agendar no macOS (launchd) às 06:35, 11:35, 15:35 e 20:35; --agora testa, --remover desfaz
bash scripts/agendar-mac.sh ~/secoes-eleitorais-consulta-2026
```

`atualizar-lista.mjs` confere colunas, seções repetidas e variação plausível de tamanho, ignora diferenças só de espaços e, se algo estiver errado, não altera nada. A data de publicação vem do link do CDN (`…/20261022_062810/…`).

A cada lista nova a rotina completa refaz: `listas.json`, `secoes_v.csv`, a conferência dos números (`npm run verificar`), o grupo de controle (`controle.json`, baixa a votação do 1º turno, cerca de 160 MB) e `painel.json`.

## Método estatístico (resumo)

- **Margem** = % de Lula − % de Flávio Bolsonaro nos votos válidos do 1º turno, em pontos percentuais. A margem de uma lista não é a margem nacional, e a variação entre listas não é "swing".
- **Grupo de controle** (`scripts/votacao-secao.mjs` e `scripts/gerar-controle.mjs`): compara as seções alteradas com as demais seções do **mesmo município**. A diferença bruta nacional some quando se compara dentro do município. A faixa de 95% usa bootstrap com municípios inteiros reamostrados; o teste de permutação ignora que seções do mesmo local votam parecido e deve ser lido com cautela.
- **Simulador do 2º turno** (Impacto potencial): 4.000 simulações com semente fixa, que variam o comparecimento e a divisão dos votos dentro da dúvida escolhida. É um exercício de sensibilidade: **não é previsão**, e o site não conhece o resultado do 2º turno.
- Seções sem resultado do 1º turno ficam fora das porcentagens e nunca viram "zero voto". Eleitores da lista, aptos e votos válidos são medidas diferentes e aparecem separadas.

## Deploy na Vercel

O front-end vira site estático e a API roda como função (`api/index.js`). A configuração está em `vercel.json`.

1. Importe o repositório em vercel.com/new (Framework: *Other*; os comandos vêm do `vercel.json`).
2. Opcional: defina `VITE_CONSULTA_URL` com o endereço da página de consulta para mostrar o link no rodapé.
3. Cada push na branch de produção publica de novo.

## Solução de problemas

- **`raspar-painel.mjs` não acha o botão ou a janela:** rode sem `HEADLESS`, com o Chrome instalado. Em qualquer falha ele salva `depuracao-*.png` e `depuracao-*.html` na pasta atual; abra uma issue anexando os arquivos.
- **"variação grande demais" em `atualizar-lista.mjs`:** o TSE pode ter mudado o formato do arquivo. A trava existe para não publicar dados errados; confira o CSV antes de seguir.
- **Painel bloqueado (403):** o painel recusa servidores em nuvem. Use a rotina no seu computador ou o workflow manual com o link.

## Licença

Ainda não definida. Se quiser reutilizar o código ou os dados tratados, abra uma issue.
