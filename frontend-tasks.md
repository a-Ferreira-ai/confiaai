# Frontend Tasks — Confia AI

> Backlog de implementação das telas e padrões visuais definidos em [`frontend.md`](./frontend.md). **Não duplica contexto** — cada task aponta para as linhas relevantes de `frontend.md` (e `architecture.md` / `SPEC.md` quando necessário). Leia as refs antes de codar.
>
> **Como usar:** pegue **uma** task por vez. Ao terminar, preencha **Feito** e marque **Pronto**.

---

## Legenda

| Campo | Significado |
|-------|-------------|
| **Refs** | Linhas de `frontend.md` (+ outras fontes) com todo o contexto de UX/UI necessário |
| **Pronto** | `☐` pendente · `☑` concluída · `⊘` bloqueada/cancelada |
| **Feito** | Resumo do que a IA implementou (arquivos, decisões, pendências) |

**Contexto geral (ler uma vez):**

| Fonte | Linhas | O quê |
|-------|--------|-------|
| `frontend.md` | L1-6 | Papel deste doc, precedência sobre `architecture.md` em conflito de UX |
| `frontend.md` | L7-20 | Por que Moovit e gramática de interação adotada |
| `architecture.md` | L347-418 | Stack frontend, pastas `frontend/src/`, proxy, libs |
| `architecture.md` | L178-179 | Device token anônimo (`X-Device-Token`) |
| Código existente | `frontend/src/` | Ponto de partida — **não confie só nos checkboxes**; audite o repo |

**Ordem sugerida:** Fase 1 → 2 → 3; dentro da Fase 3, tasks 8–9 antes de 10–11; task 15 por último (polimento transversal).

---

## Fase 1 — Fundação visual e navegação

### Task 1 — Paleta e tokens Tailwind

**Refs:** `frontend.md` L24-80 · `architecture.md` L357-360

**Escopo:** Alinhar `tailwind.config.ts` e `index.css` à paleta canônica (INK, TEAL, SEA, AMBER, CORAL, neutros, tons sobre fundo escuro). Garantir que classes existentes (`bg-ink`, `text-muted`, etc.) batem com os hex do doc.

**Pronto:** ☑

**Feito:** `tailwind.config.ts` — tokens `ink2`, `on-ink-*`, `on-sea`, `chart-grid`; `index.css` — base `body` com `bg-paper text-darktxt`. Hex inline substituídos por classes em `Busca.tsx`, `Parada.tsx`, `Rota.tsx`. `bg-ink2` e `bg-ink-light` resolvem para `#10505E`. Build OK.

---

### Task 2 — Shell do app e bottom tab bar

**Refs:** `frontend.md` L84-96, L100-114, L75-80 · `architecture.md` L350-384

**Escopo:** Layout mobile-first com fundo claro (`paper`/`light`), header e tab bar em `ink`. Quatro abas: Buscar, Mapa de demanda, Ranking, Favoritos. `Busca.tsx` como rota inicial (`/`). Remover ou substituir a landing escura atual em `App.tsx`. FAB de reporte **fora** da tab bar.

**Pronto:** ☑

**Feito:** `AppShell.tsx` + `BottomTabBar.tsx` (4 abas, `bg-ink`); `App.tsx` — nested routes, `/` → `Busca`, landing removida; rotas de detalhe (`/rota`, `/linha/:id`, `/parada/:id`) fora do shell. `Busca`, `MapaDemanda`, `Ranking` ajustados (loading dentro do shell, headers ink). `pr-4` no shell para FAB futuro.

---

### Task 3 — Aba Favoritos (local)

**Refs:** `frontend.md` L100-111, L119-145 · `architecture.md` L178-179

**Escopo:** Página `Favoritos.tsx` (ou equivalente) com linhas/paradas salvas em `localStorage`; lista com mini-indicadores de confiança e ocupação (quando houver API). Acessível pela quarta aba da bottom tab bar.

**Pronto:** ☑

**Feito:** `lib/favoritos.ts` (CRUD localStorage); `Favoritos.tsx` com empty state e enrich via API; `BotaoFavorito.tsx` em `Parada.tsx` e `Linha.tsx`. Mini `FaixaConfianca` + `IndicadorOcupacao` (paradas) na lista. Rota `/favoritos` no shell.

---

## Fase 2 — Componentes transversais

### Task 4 — `FaixaConfianca.tsx` (pilar + níveis)

**Refs:** `frontend.md` L62-73, L263-269 · `architecture.md` L361-362

**Escopo:** Teal `#12849A` como cor do pilar; semáforo verde/amarelo/vermelho **dentro** do componente para Alta/Média/Baixa; estado sem dado → texto "confiança em construção" em cinza neutro, nunca cor de status.

**Pronto:** ☑

**Feito:** `lib/pillarStyles.ts` — cores semáforo (verde/amarelo/vermelho) + `reliabilityPinColor`. `FaixaConfianca.tsx` — pilar teal, dot/barra semáforo por nível, sem dado → "confiança em construção" em cinza. Build OK.

---

### Task 5 — `IndicadorOcupacao.tsx` (pilar + níveis)

**Refs:** `frontend.md` L62-73, L265-267 · `architecture.md` L363-364

**Escopo:** Âmbar `#E9A23B` como cor do pilar; quatro níveis (Livre/Moderado/Cheio/Lotado) com ícone de pessoas preenchendo; estado sem dado → "ocupação desconhecida" em cinza.

**Pronto:** ☑

**Feito:** `IndicadorOcupacao.tsx` — pilar âmbar, ícone SVG de 4 pessoas com preenchimento por nível, barra âmbar (sem coral), sem dado → "ocupação desconhecida".

---

### Task 6 — Selo de segurança + tag "Estimativa" (metrô)

**Refs:** `frontend.md` L36-37, L62-72, L267-269 · componente existente `IndicadorSeguranca.tsx`

**Escopo:** Selo com linguagem afirmativa/neutra (coral `#E2674E`); tag discreta "Estimativa" em todo dado de metrô. Reutilizável em `Parada`, timeline de `Rota` e cards.

**Pronto:** ☑

**Feito:** `IndicadorSeguranca.tsx` — variantes `selo` (badge coral + escudo) e `full` (barra). `TagEstimativa.tsx` criado. Consumidores: `Parada.tsx` (selo no header), `Rota.tsx`, `CardParada.tsx`. Tag em outras telas fica para Task 17.

---

### Task 7 — `Mapa.tsx` — pins coloridos por confiança

**Refs:** `frontend.md` L119-127, L62-73 · `architecture.md` L372

**Escopo:** Pins no mapa refletem nível de confiança da parada (verde/amarelo/vermelho), não só modo ônibus/metrô. Integrar com dados de `ReliabilityScore` via API existente.

**Pronto:** ☑

**Feito:** `Mapa.tsx` — campo `reliability` em `MapMarker`, cores via `pillarStyles.reliabilityPinColor`; origem/destino mantêm destaque. `Busca.tsx` e `Parada.tsx` passam `stop.reliability`. `MapaDemanda` inalterado (intensity).

---

## Fase 3 — Telas e fluxos

### Task 8 — `Busca.tsx` — Home Moovit-like

**Refs:** `frontend.md` L84-88, L119-145 · `architecture.md` L386-402

**Escopo:** Campo de busca expansível (origem/destino ao tocar), chips `Todos`/`Ônibus`/`Metrô`, mapa com localização e pins por confiança, seção favoritos/recentes com mini-indicadores. Wireframe ASCII em `frontend.md` L129-145.

**Pronto:** ☑

**Feito:** `Busca.tsx` — header ink com busca colapsável (“Para onde você vai?”), chips Todos/Ônibus/Metrô, mapa com `userPosition` + pins por confiança. `lib/recentes.ts`, `lib/enrichItems.ts`, `ListaFavoritosCompacta.tsx`, `ListaRecentes.tsx`; `Mapa.tsx` — prop `userPosition`. Navegação para `/rota` sem `route_index`. Selects mantidos (sem autocomplete na API). `Favoritos.tsx` usa `enrichItems`. Build OK.

---

### Task 9 — `Rota.tsx` — estado lista de resultados

**Refs:** `frontend.md` L88-90, L147-174 · `architecture.md` L91-95

**Escopo:** Cards de rota com tempo, horários, ícones de modo, confiança agregada (pior trecho), ocupação do trecho mais cheio, tag `Rota com desvio` (coral) quando aplicável, ordenação por hora de sair. Suportar múltiplas rotas na mesma página (não só `route_index=0`).

**Pronto:** ☑

**Feito:** `routeHelpers.ts` — sort por `leave_at`, `worstReliabilityFromLegs`, `enrichRouteOccupancy`, heurística de desvio (transfer ≥ direct + 5 min). `CardRota.tsx` — ícones de modo, confiança/ocupação compact, tag coral. `Rota.tsx` — `RotaListView` quando URL sem `route_index`; enrich ocupação via `fetchOccupancy` por leg transit. Heurística de desvio documentada (ideal: flag no backend). Build OK.

---

### Task 10 — `Rota.tsx` — estado detalhe (timeline)

**Refs:** `frontend.md` L90-91, L176-201 · `architecture.md` L10, L549-550

**Escopo:** Bloco "Saia às" em destaque (seafoam), timeline vertical Moovit-like, confiança/ocupação/selo por trecho, botão contextual "Reportar chegada" no embarque, `BotaoReportar` no estado de detalhe.

**Pronto:** ☑

**Feito:** `RotaTimeline.tsx` — timeline vertical com nós, `FaixaConfianca`/`IndicadorOcupacao`/`IndicadorSeguranca` por trecho transit, `TagEstimativa` metrô. `RotaDetailView` — bloco seafoam, enrich via `fetchStop`+`fetchOccupancy`, FAB `BotaoReportar`, botão "Reportar chegada" → `FluxoReporte` arrival. Link "← Ver outras rotas". Build OK.

---

### Task 11 — `Parada.tsx` — tela de parada/estação

**Refs:** `frontend.md` L92-93, L203-225 · `architecture.md` L370, L373-375

**Escopo:** Header com selo de segurança, linhas com confiança + ocupação + próximo horário, link "Sugerir parada mais segura próxima" quando score baixo, FAB `BotaoReportar`, integração `PromptGeofence` como bottom sheet.

**Pronto:** ☑

**Feito:** `paradaHelpers.ts` — `nextTripForLine`, `formatNextDeparture`, `enrichLinesAtStop` (ocupação por `fetchOccupancy(stopId, tripId)`). `nearbySaferStop.ts` — raio 800 m, top 5 candidatas, safety estritamente melhor. `LinhaNaParadaRow.tsx` — confiança + próximo horário + ocupação compact. `Parada.tsx` — layout wireframe §4.4 (header → linhas → mapa compacto), card tint parada segura quando `safety.level === "low"`, removidas seções globais redundantes, página não exige ocupação global. FAB/geofence mantidos. Build OK.

---

### Task 12 — `Linha.tsx` — ranking e gráfico de ocupação

**Refs:** `frontend.md` L93-94, L227-235 · `architecture.md` L361-375

**Escopo:** Header com posição no ranking do corredor, gráfico simples de ocupação típica por hora do dia, lista de paradas com confiança individual, `BotaoReportar` + FAB.

**Pronto:** ☑

**Feito:** `lineRank.ts` — `findLineRank`, `rankBadgeText` (ordinal pt-BR ou "Confiança em construção"). `lineOccupancyProfile.ts` — perfil determinístico 9 faixas horárias por `line.id`+mode (sem API). `GraficoOcupacaoLinha.tsx` — barras âmbar, grade `chart-grid`, `TagEstimativa` metrô. `Linha.tsx` — fetch paralelo line+ranking, header `bg-ink` + swatch cor, gráfico, FAB via `fetchStop` da 1ª parada. Build OK.

---

### Task 13 — `MapaDemanda.tsx` — heatmap exploratório

**Refs:** `frontend.md` L93, L236-238 · `architecture.md` L366-367, L372

**Escopo:** Mapa de calor (intensidade proporcional a `demand_searches`), sem lista/cards, camada via `react-leaflet`. Aba própria na bottom tab bar.

**Pronto:** ☑

**Feito:** `leaflet.heat` + `leaflet-heat.d.ts`; `HeatmapLayer.tsx` (gradiente âmbar `#E9A23B`); `MapaDemandaMap.tsx` (TileLayer + heatmap + fitBounds); `MapaDemanda.tsx` — layout full-bleed (`flex-1`), sem pins/cards. Build OK.

---

### Task 14 — `Ranking.tsx` — lista ordenável

**Refs:** `frontend.md` L94-95, L240-242 · `architecture.md` L367

**Escopo:** Toggle ônibus/metrô/todos; cards no mesmo padrão visual de `Rota` (lista); navegação para `Linha.tsx` ao tocar.

**Pronto:** ☑

**Feito:** `CardRankingLinha.tsx` — estilo `CardRota`, `#rank`, `FaixaConfianca` compact, `TagEstimativa` metrô. `Ranking.tsx` — chips Todos/Ônibus/Metrô (filtro client-side, rank original preservado), empty state filtrado. Build OK.

---

### Task 15 — `BotaoReportar.tsx` — formulário em abas

**Refs:** `frontend.md` L96-97, L255-259 · `architecture.md` L373-375, L415-417

**Escopo:** FAB canto inferior direito; formulário com abas Horário / Ocupação / Segurança; seleção por toque (sem texto livre). Presente em `Parada`, `Linha` e `Rota` (detalhe).

**Pronto:** ☑

**Feito:** `FluxoReporte.tsx` — abas Horário/Ocupação/Segurança (ordem canônica); Horário com “Passou agora” (POST chegada), “Não passou” (ack sem API), “Informar horário” (offsets 5/10/15 min); categorias de segurança e viagens em botões/chips (sem `<select>`). `BotaoReportar`/`Parada`/`Linha`/`Rota`/`RotaTimeline` intactos. Build OK.

---

### Task 16 — `PromptGeofence.tsx` — bottom sheet contextual

**Refs:** `frontend.md` L95-96, L244-253 · `architecture.md` L373-375, L379 · `lib/geofence.ts`

**Escopo:** Bottom sheet (não push) disparado por proximidade; perguntas contextuais (chegada, ocupação, segurança); sempre dispensável; não bloqueia navegação.

**Pronto:** ☑

**Feito:** `geofence.ts` — `GeofencePromptKind`, `trackGeofenceContext` (dwell 5 min, debounce 30 min). `PromptGeofence.tsx` — copy por arrival/boarding/dwell + `onReport(initialType)`. `Parada.tsx` — arrival/dwell; `Rota.tsx` detail — boarding no `boardingStopId`. Heurística boarding = proximidade MVP. Build OK.

---

### Task 17 — Polimento transversal e exclusões de escopo

**Refs:** `frontend.md` L263-278 · `architecture.md` L415-417

**Escopo:** Revisar todas as telas: estados sem dado consistentes, tag "Estimativa" em metrô, coral só para segurança/desvio, âmbar só para ocupação. Confirmar que itens da seção 6 (pagamento, AR, bike, edição de cadastro) **não** foram adicionados.

**Pronto:** ☑

**Feito:** Export `NO_DATA_RELIABILITY`/`NO_DATA_OCCUPANCY` + `routeHasMetro` em `routeHelpers.ts`; `MAP_ORIGIN_COLOR`/`MAP_DESTINATION_COLOR` em `pillarStyles.ts`. Listas (`ListaFavoritosCompacta`, `ListaRecentes`, `Favoritos`) e `RotaTimeline` sempre renderizam indicadores com fallback cinza. `TagEstimativa` em favoritos (home + aba) e `CardRota` (rotas com metrô). Coral restrito a `IndicadorSeguranca`, tag "Rota com desvio", aba Segurança em `FluxoReporte`; erros neutros; FAB `bg-teal`; pins origem/destino teal/sea; estrela favorita teal. Grep confirma ausência de escopo §6. Build OK.

## Resumo de progresso

| Fase | Tasks | Prontas |
|------|-------|---------|
| 1 — Fundação visual e navegação | 1–3 | 3/3 |
| 2 — Componentes transversais | 4–7 | 4/4 |
| 3 — Telas e fluxos | 8–17 | 11/11 |
| **Total** | **17** | **17/17** |
