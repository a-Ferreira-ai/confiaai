# Telas — Confia AI

> Este documento é a referência canônica de UX/telas e identidade visual do **Confia AI** para qualquer agente de IA (ou humano) que for implementar o frontend. Leia `ARCHITECTURE.md` e `SPEC.md` antes deste arquivo — aqui assume-se conhecimento da estrutura técnica e do escopo de produto já definidos. Em caso de conflito sobre nomes de componentes/páginas, este documento é a referência final para o frontend; `ARCHITECTURE.md` continua sendo a referência de stack e organização de pastas.
>
> O nome do produto é **Confia AI**. `SPEC.md` e `ARCHITECTURE.md` referem-se a ele como "Confia" — tratar como o mesmo produto; o nome completo aparece em telas de marca (splash, header) e o curto pode seguir sendo usado em nomes de classes, pastas e variáveis de código.

## 0. Por que Moovit como referência

Moovit é hoje o app de transporte público mais usado globalmente, com um padrão de UX validado em milhões de usuários: busca rápida → resultado de rota em lista → itinerário em formato de linha do tempo → mapa ao vivo com posição do veículo → tela de parada/linha → reporte colaborativo. Esse padrão é familiar para qualquer passageiro brasileiro que já usou um app de transporte, então **adotamos a mesma gramática visual e de navegação**, evitando reinventar uma interação que o usuário já entende — e **plugamos nela as quatro features que são a proposta de valor do Confia** (confiança, hora de sair, ocupação, segurança), que o Moovit não tem.

Resumo do padrão observado no Moovit (pesquisa visual + documentação oficial de features):
- **Navegação inferior por abas** (bottom tab bar): tela de busca/mapa como home, favoritos, conta.
- **Home**: campo de busca grande no topo ("Para onde você vai?"), mapa com a localização atual, lista de linhas/lugares favoritos logo abaixo.
- **Resultado de busca**: lista de opções de rota em **cards**, cada card mostra tempo total, horário de saída/chegada, modos envolvidos (caminhada/ônibus/metrô) como ícones em sequência, e quantidade de baldeações.
- **Itinerário** (tela de detalhe de uma rota escolhida): formato de **linha do tempo vertical** — "saia às", "caminhe até", "espere o ônibus X", "desça em Y" — cada etapa como um bloco na timeline.
- **Mapa ao vivo**: posição do veículo em tempo real sobre o mapa, ETA atualizado.
- **Tela de parada/estação**: lista das linhas que passam ali, próximos horários, opção de favoritar.
- **Reporte colaborativo**: botão de reportar acessível a partir de várias telas (linha mudou de itinerário, dado incorreto, foto da estação) — sempre **opt-in do usuário**, nunca bloqueando o fluxo principal.

O Confia segue essa gramática e adiciona, em cada tela onde fizer sentido, os elementos que não existem no Moovit: **faixa de confiança**, **indicador de ocupação**, **selo de segurança da parada**, e os **dois canais de feedback** (geofence automático + on-demand) com a granularidade que o produto exige.

---

## 1. Identidade visual — paleta de cores

A paleta abaixo nasceu no pitch deck do Confia AI e é a **mesma paleta usada na UI do app** — consistência entre o material de apresentação e o produto reforça a marca. Hex sempre **sem `#`** se for usar direto em ferramentas que pedem hex puro (ex.: PptxGenJS); a tabela abaixo usa `#` por ser referência de design. Em código (Tailwind, CSS), usar sempre o valor com `#`.

### 1.1 Paleta principal

| Cor | Hex | Função no pitch deck | Função equivalente na UI do app |
|-----|-----|---|---|
| Teal profundo (INK) | `#0B3B45` | Cor dominante; fundo dos slides escuros e cor das sombras | Cor de marca dominante; header/bottom-tab-bar, texto de maior peso, splash screen |
| Teal profundo claro (INK2) | `#10505E` | Cards sobre fundo escuro | Cards/superfícies elevadas em contextos escuros (ex.: modo escuro, se vier a existir) |
| Teal (TEAL) | `#12849A` | Cor de apoio; ícones do pilar "confiança", barras de gráfico | **Faixa de confiança** — cor do pilar Índice de Confiança em toda a UI |
| Seafoam / verde-água (SEA) | `#2A9D8F` | Cor de apoio; pilar "hora de sair", faixa de destaque, escudo | **Hora de sair** — cor do destaque de "Saia às" no topo do itinerário (seção 4.3) |
| Âmbar (AMBER) | `#E9A23B` | Acento; pilar "ocupação", destaques | **Indicador de ocupação** — cor do pilar Ocupação; também usada para o badge "Estimativa" do metrô (acento, não alerta) |
| Coral (CORAL) | `#E2674E` | Alerta/segurança; pilar "segurança", card de privacidade | **Selo de segurança** — cor do pilar Segurança da Parada; também usada na tag `Rota com desvio` (seção 4.2) |

### 1.2 Neutros e fundos

| Cor | Hex | Função |
|-----|-----|--------|
| Branco (PAPER) | `#FFFFFF` | Fundo padrão das telas e dos cards claros — é o fundo-base do app (mobile-first, telas predominantemente claras) |
| Cinza-azulado claro (LIGHT) | `#F1F6F7` | Fundo de seções/cards secundários (ex.: bloco de favoritos na home, seção de filtros) |
| Tint | `#E8F1F2` | Cards de apoio dentro de uma tela clara (ex.: card de "Sugerir parada mais segura próxima") |
| Texto escuro (DARKTXT) | `#12333B` | Títulos e textos primários sobre fundo claro — cor de texto padrão do app |
| Texto neutro (MUTED) | `#5B7079` | Texto secundário/descrições sobre fundo claro (ex.: subtítulo de horário, legendas) |

### 1.3 Tons de texto sobre fundo escuro

Usados nas raras superfícies escuras da UI (header com INK, splash screen, eventual modo escuro):

| Hex | Função |
|---|---|
| `#BFD8DC` | Rótulos secundários sobre fundo escuro (ex.: tag de modo "ônibus & metrô" no header) |
| `#9FC6CC` | Subtítulos sobre fundo escuro |
| `#7FA9AF` | Rótulos terciários sobre fundo escuro (ex.: "Corredor de demonstração" em telas de onboarding) |
| `#AFCDD2` | Descrição de cards sobre fundo escuro |
| `#06343A` | Texto sobre uma faixa seafoam (ex.: texto dentro do destaque "Saia às" se o fundo daquele bloco for `#2A9D8F`) |
| `#E2E8F0` | Linhas de grade de gráficos (ex.: gráfico de ocupação típica por horário em `Linha.tsx`, seção 4.5) |

### 1.4 Mapa dos 4 pilares → cor (canônico, vale para qualquer tela)

Esta tabela é a referência definitiva de cor por pilar — qualquer componente que represente um dos quatro pilares do produto usa exatamente esta cor, sem variação:

| Pilar | Componente principal | Cor | Hex |
|---|---|---|---|
| Índice de confiança (horário) | `FaixaConfianca.tsx` | Teal | `#12849A` |
| Hora de sair | destaque no topo de `Rota.tsx` (detalhe) | Seafoam | `#2A9D8F` |
| Ocupação | `IndicadorOcupacao.tsx` | Âmbar | `#E9A23B` |
| Segurança da parada | selo de segurança em `Parada.tsx` | Coral | `#E2674E` |

> Nota de coerência com a seção 5 deste documento (Padrões visuais transversais): a faixa de confiança usa três **níveis** (Alta/Média/Baixa) que já tinham sido definidos como verde/amarelo/vermelho semáforo. Esses semáforos de nível continuam sendo usados **dentro** do componente `FaixaConfianca` para indicar o nível (ex.: um ponto ou barra verde/amarelo/vermelho ao lado do texto), enquanto o **Teal `#12849A`** é a cor de identidade do pilar em si (ícone, header da seção, chip "Confiança" sem variação de nível). Mesma lógica para Ocupação: Âmbar identifica o pilar; os 4 níveis (Livre/Moderado/Cheio/Lotado) variam em intensidade/opacidade do próprio âmbar ou usam o ícone de "pessoas" preenchendo, sem introduzir cores fora da paleta.

### 1.5 Observações de uso na UI

- **Dominância:** o teal profundo `#0B3B45` é a cor de marca mas **não** domina 60–70% da UI do app como domina no pitch deck — no app, branco (`#FFFFFF`) e cinza-azulado claro (`#F1F6F7`) dominam, já que o produto é mobile-first e de uso rápido (consulta de poucos segundos), não uma peça de apresentação. O teal profundo aparece concentrado no header, bottom tab bar e splash — suficiente para fixar a marca sem pesar a leitura de dados no dia a dia.
- **Âmbar como único acento:** mantido também na UI — `#E9A23B` é reservado para Ocupação e badges de destaque pontual (ex.: tag "Estimativa" do metrô). Não usar âmbar para CTAs genéricos nem para outros badges, sob risco de diluir o significado do pilar.
- **Coral é alerta, não decoração:** assim como no deck, `#E2674E` carrega peso semântico de atenção — usar exclusivamente para Segurança da Parada e para a tag `Rota com desvio`. Não usar coral em elementos puramente estéticos.
- **Sandwich claro/escuro do deck não se replica 1:1 no app:** o app não tem "slides", mas o princípio equivalente é: telas de conteúdo/dado (Busca, Rota, Parada, Linha, Mapa de Demanda, Ranking) são **claras** (fundo `#FFFFFF`/`#F1F6F7`); apenas elementos de moldura da marca (header fixo, bottom tab bar, splash screen) usam o teal profundo escuro — o equivalente ao "sandwich" é a marca emoldurando o conteúdo, não o conteúdo em si escurecendo.

---

## 2. Mapeamento telas Moovit-like → páginas do Confia AI

| Tela (padrão Moovit) | Página no Confia (`frontend/src/pages`) | O que muda |
|---|---|---|
| Home (busca + mapa + favoritos) | `Busca.tsx` | + filtro de modo (ônibus/metrô), + chips de confiança nos favoritos |
| Lista de resultados de rota | `Rota.tsx` (estado de lista) | + faixa de confiança e ocupação em cada card, + sinalização de desvio desnecessário |
| Itinerário (timeline da rota escolhida) | `Rota.tsx` (estado de detalhe) | + "hora de sair" destacada no topo, + confiança/ocupação por trecho, + selo de segurança nas paradas da timeline |
| Tela de parada/estação | `Parada.tsx` | + faixa de confiança e ocupação por linha, + score de segurança, + `BotaoReportar` |
| Tela de linha (lista de paradas de uma linha) | `Linha.tsx` | + ranking de confiabilidade daquela linha, + ocupação típica por horário |
| Mapa ao vivo (sem equivalente direto de "demanda" no Moovit) | `MapaDemanda.tsx` | tela nova — não existe no Moovit; subproduto do Confia |
| (sem equivalente) | `Ranking.tsx` | tela nova — não existe no Moovit; subproduto do Confia |
| Prompt de reporte contextual | `PromptGeofence.tsx` (componente, não página) | no Moovit é só "mudança de linha"/"dado errado"; no Confia cobre horário, ocupação e segurança |
| Botão de reportar sempre visível | `BotaoReportar.tsx` | mesma posição/padrão do Moovit, conteúdo expandido |

---

## 3. Navegação geral

**Bottom tab bar**, 4 abas, mobile-first (replica a posição de polegar do Moovit):

```
[ Buscar ]   [ Mapa de demanda ]   [ Ranking ]   [ Favoritos ]
```

- **Buscar** → `Busca.tsx`, tela inicial do app.
- **Mapa de demanda** → `MapaDemanda.tsx`, subproduto do Confia.
- **Ranking** → `Ranking.tsx`, subproduto do Confia.
- **Favoritos** → lista de linhas/paradas marcadas pelo usuário (armazenada local, já que não há cadastro — ver `ARCHITECTURE.md` seção 3.3 sobre device token).

`BotaoReportar` **não** é uma aba — é um botão flutuante (FAB, canto inferior direito), presente em `Parada.tsx`, `Linha.tsx` e `Rota.tsx` (estado de detalhe), seguindo o padrão Moovit de reporte sempre acessível sem ocupar uma aba inteira.

---

## 4. Telas detalhadas

### 4.1 `Busca.tsx` — Home

**Padrão Moovit:** campo de busca grande no topo, mapa logo abaixo com a localização atual, lista de favoritos/recentes.

**Camadas do Confia:**
- Campo de busca único para origem e destino (toque abre dois campos, replicando o padrão Moovit de "expandir ao tocar").
- **Filtro de modo**: chips `Todos` / `Ônibus` / `Metrô` logo abaixo do campo de busca — requisito funcional do SPEC que o Moovit não precisa ter (Moovit já mistura todos os modos sem filtro de destaque equivalente).
- Mapa com a localização atual e, sobre ele, **paradas próximas já coloridas pela faixa de confiança** (verde/amarelo/vermelho na própria pin do mapa) — é a primeira coisa que o Confia mostra que o Moovit não mostra.
- Lista de favoritos/recentes: cada item já traz um mini-indicador de confiança e ocupação típica do horário atual, em vez de só o nome da linha/parada (no Moovit, a lista de favoritos é só texto + ícone de modo).

```
┌─────────────────────────────┐
│  Para onde você vai?    🔍  │
│  [Todos] [Ônibus] [Metrô]   │  ← chips de modo
├─────────────────────────────┤
│                             │
│      [ Mapa com pins        │
│        coloridos por        │
│        confiança ]          │
│                             │
├─────────────────────────────┤
│ Favoritos                   │
│ 🚌 0.100 — Confiança: Alta  │
│ 🚇 Taguatinga Sul — Moderado│
└─────────────────────────────┘
[ Buscar ][Demanda][Ranking][Favoritos]
```

### 4.2 `Rota.tsx` — estado de lista de resultados

**Padrão Moovit:** cards de rota, cada um com tempo total, horário, ícones de modo em sequência, número de baldeações.

**Camadas do Confia:**
- Cada card de rota ganha, junto ao tempo total, uma **faixa de confiança agregada da rota** (a pior faixa entre os trechos, para não passar falsa segurança) e um **indicador de ocupação do trecho mais cheio**.
- Quando o `Services::ConnectionRouter` (ver `ARCHITECTURE.md` seção 3.1) detecta um desvio desnecessário (ex.: passar pela Rodoviária do Plano Piloto sem necessidade), o card exibe uma tag de alerta — `Rota com desvio` — com opção de ver a alternativa direta. Isso não existe no Moovit, que não sinaliza desvios de forma proativa.
- Ordenação padrão: pela "hora de sair" mais próxima (não só pelo tempo total de viagem), já que essa é a pergunta central do produto.

```
┌─────────────────────────────┐
│ ← Ceilândia → Taguatinga    │
├─────────────────────────────┤
│ 🚶🚌🚶  32 min               │
│ Sai 14:05 · Chega 14:37     │
│ Confiança: Alta · 🟢        │
│ Ocupação: Moderada          │
├─────────────────────────────┤
│ 🚶🚇🚶  28 min               │
│ Sai 14:10 · Chega 14:38     │
│ Confiança: Média · 🟡       │
│ Ocupação: Livre             │
├─────────────────────────────┤
│ 🚶🚌🚶  41 min  ⚠ Com desvio │
│ Sai 14:02 · Chega 14:43     │
│ Confiança: Alta · 🟢        │
└─────────────────────────────┘
```

### 4.3 `Rota.tsx` — estado de detalhe (itinerário)

**Padrão Moovit:** timeline vertical — "saia às", "caminhe até", "espere o ônibus", "desça em".

**Camadas do Confia:**
- **"Hora de sair" em destaque no topo**, em vez de só aparecer dentro do primeiro bloco da timeline como no Moovit — é o dado mais acionável do produto, então ganha hierarquia visual própria, não fica diluído na timeline.
- Cada bloco "espere o ônibus/metrô X" da timeline traz: faixa de confiança daquele trecho específico (não só da rota inteira), ocupação estimada daquele veículo/horário, e — se a parada tiver um score de segurança relevante — um selo discreto de segurança.
- Bloco de embarque tem o `BotaoReportar` contextual embutido ("Chegou? Reporte aqui"), antecipando o prompt de geofence quando o usuário já está na tela olhando aquele trecho.

```
┌─────────────────────────────┐
│  Saia às 14:05               │  ← destaque, fonte maior
│  para chegar pontual         │
├─────────────────────────────┤
│ ● 14:05 Saia de casa         │
│ │ 🚶 8 min até o ponto       │
│ ● 14:13 Ponto 0.100          │
│ │ Confiança: Alta · 🟢       │
│ │ Selo de segurança: OK      │
│ │ 🚌 Espere a linha 0.100    │
│ ● 14:18 Embarque             │
│ │ Ocupação: Moderada         │
│ │ [Reportar chegada]         │
│ ● 14:37 Desça em Taguatinga  │
└─────────────────────────────┘
```

### 4.4 `Parada.tsx` — tela de parada/estação

**Padrão Moovit:** lista das linhas que passam ali, próximos horários, favoritar.

**Camadas do Confia:**
- Cabeçalho da tela traz, junto ao nome da parada, o **selo de segurança** (ex.: "Parada bem avaliada" / "Sem relatos recentes" / "Atenção: relatos recentes") — linguagem deliberadamente não-estigmatizante, conforme restrição de privacidade do `SPEC.md` (nunca rotular "área perigosa").
- Cada linha listada traz confiança e ocupação típica daquele horário, lado a lado com o próximo horário previsto (que é tudo que o Moovit mostra).
- `FAB BotaoReportar` fixo, e se o usuário chegou via geofence simulado, `PromptGeofence` aparece como bottom sheet sobreposto à tela, perguntando o que for pertinente no momento (chegada, ocupação, segurança).
- Link "Sugerir parada mais segura próxima" quando o score da parada atual for baixo — funcionalidade que não existe no Moovit.

```
┌─────────────────────────────┐
│ ← Ponto 0.100                │
│ Selo: Sem relatos recentes 🛡│
├─────────────────────────────┤
│ 🚌 0.100  Confiança: Alta    │
│   Próximo: 14:18 · Moderado  │
│ 🚌 0.200  Confiança: Média   │
│   Próximo: 14:25 · Livre     │
├─────────────────────────────┤
│            [ + Reportar ]    │ ← FAB
└─────────────────────────────┘
```

### 4.5 `Linha.tsx` — tela de linha

**Padrão Moovit:** lista de paradas de uma linha, no mapa e em lista.

**Camadas do Confia:**
- Header com **ranking de confiabilidade** daquela linha frente às outras do corredor ("3º lugar em pontualidade no corredor").
- Gráfico simples (barras ou faixa por hora) de **ocupação típica ao longo do dia**, permitindo o usuário escolher o horário menos cheio — informação que não existe no Moovit.
- Lista de paradas com confiança individual de cada uma.

### 4.6 `MapaDemanda.tsx` — subproduto, sem equivalente no Moovit

Tela nova. Mapa de calor (heatmap) sobre o corredor de demonstração, camadas via `react-leaflet`, intensidade de cor proporcional ao volume de buscas origem→destino agregadas (`demand_searches`). Sem lista, sem cards — é uma visualização exploratória, acessada pela aba própria.

### 4.7 `Ranking.tsx` — subproduto, sem equivalente no Moovit

Tela nova. Lista ordenável (toggle ônibus/metrô/todos) das linhas do corredor por score de confiabilidade agregado, no mesmo padrão visual de card usado em `Rota.tsx` para manter consistência, mas sem ação de navegação além de abrir `Linha.tsx` daquele item.

### 4.8 `PromptGeofence.tsx` — componente, não página

**Padrão Moovit:** notificações push pontuais tipo "você chegou?", usadas com moderação.

**Camadas do Confia:** bottom sheet contextual (não notificação push, já que o MVP não tem backend de push) disparado quando `lib/geofence.ts` detecta proximidade com uma parada/estação ou padrão de embarque. Pergunta curta e específica ao contexto:
- Chegou na parada → "O ônibus 0.100 já passou?"
- Embarcou → "Como está a ocupação agora?"
- Parado há tempo na mesma parada → "Tudo bem por aqui? Reportar segurança"

Sempre dispensável com um toque, nunca bloqueia navegação — replica a leveza dos prompts do Moovit, mas com conteúdo específico das quatro features do Confia.

### 4.9 `BotaoReportar.tsx` — componente, não página

**Padrão Moovit:** botão/ícone de reporte presente em telas de linha/parada, abre um formulário curto de opções predefinidas (não texto livre, para reduzir fricção e abuso).

**Camadas do Confia:** mesmo padrão de posição (FAB), mas o formulário cobre as três categorias do produto em abas internas — **Horário** ("passou agora" / "não passou" / informar horário), **Ocupação** ("livre" / "moderado" / "cheio" / "lotado"), **Segurança** (categoria + severidade) — sempre como seleção por toque, nunca campo de texto livre, mantendo a mesma filosofia de baixa fricção do Moovit.

---

## 5. Padrões visuais transversais (aplicam-se a todas as telas)

- **Faixa de confiança** (`FaixaConfianca.tsx`): sempre os mesmos três níveis e cores em qualquer tela — Alta (verde), Média (amarelo), Baixa (vermelho) — nunca textos diferentes para o mesmo conceito.
- **Indicador de ocupação** (`IndicadorOcupacao.tsx`): sempre os mesmos quatro níveis — Livre, Moderado, Cheio, Lotado — com um ícone de "pessoas" preenchendo proporcionalmente, reconhecível mesmo sem ler o texto (acessibilidade, replicando o cuidado do Moovit com leitura rápida).
- **Estado "sem dado"**: nunca mostrar um nível arbitrário quando não há dado suficiente — sempre o estado textual "confiança em construção" / "ocupação desconhecida", conforme os casos de borda do `SPEC.md`. Visualmente, isso é uma cor neutra (cinza), nunca uma das três/quatro cores de status, para não confundir com um nível real.
- **Selo de segurança**: linguagem sempre afirmativa ou neutra ("Sem relatos recentes", "Bem avaliada", "Atenção: relatos recentes") — nunca alarmista, nunca rotula a parada como perigosa de forma permanente.
- **Estimativa do metrô**: qualquer dado de metrô (que é semente sintética, conforme `SPEC.md`) leva uma tag discreta "Estimativa" ao lado, em todas as telas onde aparecer — consistente em toda a navegação, não só na tela de detalhe.

---

## 6. O que não replicamos do Moovit (fora de escopo deliberado)

- **Carteira/pagamento de passagem** (Moovit tem "Pay For Your Ride") — fora do escopo do MVP de hackathon.
- **Navegação por voz turn-by-turn / realidade aumentada para achar o ponto** ("Way Finder") — fora de escopo.
- **Múltiplos modos de mobilidade compartilhada** (bike, patinete, carona) — o Confia cobre só ônibus e metrô, conforme `SPEC.md`.
- **Edição colaborativa de dados estruturais** (nome de estação errado, localização errada) — o Confia tem reporte de horário/ocupação/segurança, não edição de cadastro.

Essas exclusões são intencionais e não devem ser implementadas "porque o Moovit tem" — o objetivo é replicar a **gramática de interação**, não o conjunto de features.