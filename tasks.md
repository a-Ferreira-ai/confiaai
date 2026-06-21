# Tasks — Confia

> Lista de trabalho para implementação do MVP. **Não duplica contexto** — cada task aponta para as linhas relevantes de [`architecture.md`](./architecture.md) (e `SPEC.md` quando existir). Leia as refs antes de codar.
>
> **Como usar:** pegue **uma** task por vez. Ao terminar, preencha **Feito** e marque **Pronto**.

---

## Legenda

| Campo | Significado |
|-------|-------------|
| **Refs** | Linhas do `architecture.md` (e outras fontes) com todo o contexto necessário |
| **Pronto** | `☐` pendente · `☑` concluída · `⊘` bloqueada/cancelada |
| **Feito** | Resumo do que a IA implementou (arquivos, decisões, pendências) |

**Contexto geral do produto (ler uma vez):** `architecture.md` L5-18

**Ordem sugerida:** seguir a numeração; fases 2–6 dependem da fundação (tasks 1–6).

---

## Fase 1 — Fundação

### Task 1 — Scaffold do backend Rails API

**Refs:** `architecture.md` L22-41, L44-59, L63-135, L251-281, L501-529, L533-539

**Escopo:** Gerar `backend/` (`rails new backend --api -d postgresql`), remover Solid Queue/Cache/Cable, configurar Sidekiq + Redis + RSpec, `database.yml`, timezone pt-BR.

**Pronto:** ☑

**Feito:**
- `rails new backend --api -d postgresql --skip-test` (Rails 8.1.3, Ruby 3.2.4) substituiu esqueleto vazio anterior.
- Gemfile: removidos `solid_cache`, `solid_queue`, `solid_cable`; adicionados `sidekiq`, `sidekiq-scheduler`, `redis`, `rspec-rails`, `factory_bot_rails`, `faker`.
- Config: `application.rb` (timezone Brasilia, locale pt-BR, Sidekiq adapter, redis cache store), `database.yml` (postgres/1234), `cable.yml` (adapter redis), `config/initializers/sidekiq.rb`, `config/locales/pt-BR.yml`; removidos artefatos Solid* (`cache.yml`, `queue.yml`, `recurring.yml`, schemas, `bin/jobs`, plugin Puma).
- RSpec: `rspec:install`, `rails_helper` com `FactoryBot::Syntax::Methods` e `maintain_test_schema!`, pastas `spec/{models,services,requests,factories}/`.
- `app/services/.keep` criado.
- Verificação: `db:create` OK, `rspec` 0 examples/0 failures, queue adapter Sidekiq, cable redis.
- Pendência: `backend/.git` aninhado (criado pelo gerador) — remover manualmente se desejado; não impede o scaffold.

---

### Task 2 — Scaffold do frontend (Vite + React + TS + Tailwind)

**Refs:** `architecture.md` L22-41, L347-418, L192-241

**Escopo:** Criar `frontend/` com Vite, React, TypeScript, Tailwind, proxy `/api` e `/cable`, estrutura de pastas `src/` conforme arquitetura, paleta de cores no `tailwind.config`.

**Pronto:** ☑

**Feito:**
- `npm create vite@latest frontend -- --template react-ts` (Vite 8.0.16, React 19.2.6, TypeScript 6).
- Tailwind CSS v3 (`tailwindcss`, `postcss`, `autoprefixer`); paleta Confia em `tailwind.config.ts`.
- `vite.config.ts` com proxy `/api` → `:3000` e `/cable` → WebSocket.
- Estrutura `src/pages/`, `src/components/`, `src/lib/` (`.gitkeep`), `src/styles/index.css`.
- `App.tsx` shell mínimo pt-BR (fundo `bg-ink`, título "Confia.").
- Verificação: `npm run build` OK, `npm run dev` em `:5173` OK.

---

### Task 3 — Orquestração de dev (`Procfile.dev` + `bin/dev`)

**Refs:** `architecture.md` L44-59, L316-344

**Escopo:** `Procfile.dev` e `bin/dev` na raiz do repositório; sobe Redis, Rails, Sidekiq e Vite juntos.

**Pronto:** ☑

**Feito:**
- `Procfile.dev` na raiz com 4 processos (redis, web, worker, frontend) conforme arquitetura.
- `bin/dev` na raiz (foreman, instala gem se ausente), executável.
- Smoke test: Rails `GET /up` OK (`:3000`), Vite `:5173` OK, Sidekiq conectou ao Redis (`redis://localhost:6379/1`).
- Nota: se Redis já estiver na 6379, processo `redis` do Procfile falha e foreman encerra todos — usar Redis do sistema ou liberar a porta antes de `bin/dev`.

---

### Task 4 — Migrations e models GTFS

**Refs:** `architecture.md` L285-313, L63-89

**Escopo:** Migrations + models `Line`, `Stop`, `Trip`, `StopTime` com associations, validations e índices mínimos em `stops`.

**Pronto:** ☑

**Feito:**
- Migrations: `create_lines`, `create_stops`, `create_trips`, `create_stop_times` com FKs, `decimal(10,6)` em coords, índice `(latitude, longitude)` em stops, unique em `gtfs_id`.
- Models: `Line`, `Stop`, `Trip`, `StopTime` com associations, validations e enum `mode` (`bus`/`metro`) em Line/Stop.
- Verificação: `db:migrate` OK, models carregam, `schema.rb` gerado.

---

### Task 5 — Migrations e models de eventos da aplicação

**Refs:** `architecture.md` L298-313, L63-89

**Escopo:** Migrations + models `ArrivalEvent`, `OccupancyReading`, `StopReport`, `DemandSearch` com enums, índices compostos e `device_token`.

**Pronto:** ☑

**Feito:**
- Migrations: `arrival_events`, `occupancy_readings`, `stop_reports`, `demand_searches` com índices compostos conforme architecture §5; FKs de `demand_searches` apontam para `stops`.
- Models com enums (`source`, `context`, `level`, `category`, `mode_filter`) e prefixos onde necessário para evitar colisão (`via_*` em context).
- Verificação: 8 tabelas no schema, `device_token` presente em event tables.

---

### Task 6 — Importação de dados GTFS e estações de metrô

**Refs:** `architecture.md` L118-122, L243-247, L289-296 · `SPEC.md` (fontes de dados GTFS/metrô)

**Escopo:** Rake tasks `gtfs_import.rake` e `metro_stations_import.rake`; conversão de `scheduled_at` GTFS (horário local DF) para UTC na persistência.

**Pronto:** ☑

**Feito:**
- `lib/gtfs/importer.rb` + `lib/tasks/gtfs_import.rake` (`gtfs:import`): lê CSV de `data/gtfs/` ou `GTFS_PATH`, filtra bbox Ceilândia↔Taguatinga, upsert por `gtfs_id`, parse GTFS time → UTC via `Time.zone.local`.
- `lib/tasks/metro_stations_import.rake` (`metro:import_stations`) + `data/metro_stations.yml` (8 estações sintéticas).
- Fixture mínima em `spec/fixtures/gtfs/` copiada para smoke test.
- Verificação: 1 line, 10 stops (8 metro + 2 bus), 1 trip, 2 stop_times; reimport idempotente; 07:30 local → 09:30 UTC.
- Pendência: `SPEC.md` ausente — filtro por bbox; revisar route_ids quando SPEC existir.

---

## Fase 2 — Infraestrutura da API

### Task 7 — Base da API (auth, CORS, serialização, i18n)

**Refs:** `architecture.md` L137-190, L170-174

**Escopo:** `Api::V1::BaseController` com `X-Device-Token`, `rescue_from`, CORS (`rack-cors`), locale `pt-BR`, convenção Jbuilder em `app/views/api/v1/`.

**Pronto:** ☑

**Feito:**
- Gems: `rack-cors`, `jbuilder` (necessário em API mode).
- `Api::V1::BaseController`: `X-Device-Token` (UUID v4), `rescue_from` 404/422, partial Jbuilder `_error`.
- `PingController` + `GET /api/v1/ping` smoke; CORS para `localhost:5173`.
- `pt-BR.yml` expandido com `api.errors.*` e labels de enums.
- `ApplicationController` com `ImplicitRender` para Jbuilder em API mode.
- Verificação: 401 sem token, 200 com token, preflight CORS OK.

---

### Task 8 — Sidekiq, scheduler, ActionCable e jobs

**Refs:** `architecture.md` L30-31, L98-105, L421-497

**Escopo:** Initializers Sidekiq/Redis, `schedule.yml`, `ScoreRecalculationJob`, `StaleReadingCleanupJob`, `cable.yml` (adapter redis), `ReportsChannel`, `SidekiqWebConstraint`.

**Pronto:** ☑

**Feito:**
- `config/schedule.yml` (recálculo */5, cleanup hourly); `sidekiq.rb` com `on(:startup)` + scheduler.
- Jobs: `ScoreRecalculationJob` (stub log), `StaleReadingCleanupJob` (retention 7 dias).
- ActionCable: `ApplicationCable`, `ReportsChannel` com `.broadcast`.
- `SidekiqWebConstraint` + mount `/sidekiq`; session middleware em `application.rb` (requisito API mode).
- Verificação: `/sidekiq` 404 sem auth / 200 com admin:confia; jobs `perform_now` OK.

---

### Task 9 — Service `Geo::DistanceCalculator`

**Refs:** `architecture.md` L40-41, L96-97, L285-287

**Escopo:** Haversine em Ruby puro; bounding box SQL antes do cálculo; sem PostGIS.

**Pronto:** ☑

**Feito:**
- `app/services/geo/distance_calculator.rb`: `distance_km`, `bounding_box`, `nearest_stop` (bbox SQL + Haversine Ruby).
- Verificação: Ceilândia↔Taguatinga ~6.79 km; `nearest_stop` retorna "Ceilândia Centro".

---

## Fase 3 — Confiabilidade + GPS

### Task 10 — `ReliabilityScore` + endpoints de linhas e paradas

**Refs:** `architecture.md` L5-14, L137-168, L72-75, L91, L547-548 · `SPEC.md` (regras de score de confiança)

**Escopo:** Service `ReliabilityScore`, controllers `LinhasController` e `ParadasController`, views JSON; compara previsto (GTFS) vs realizado (GPS + relato).

**Pronto:** ☑

**Feito:**
- `ReliabilityScore` em `app/services/reliability_score.rb`: mediana de atraso + % no horário (≤300s), janela 7 dias; thresholds MVP (alta ≤300s ou ≥80%, média ≤900s ou ≥50%, baixa caso contrário); sem dados → label "sem dados".
- `Api::V1::LinhasController` e `ParadasController` + rotas `resources :linhas, :paradas`.
- Jbuilder: `linhas/index|show`, `paradas/index|show`, partial `shared/_reliability`.
- I18n `reliability.level.*` em `pt-BR.yml`.
- Verificação: `ReliabilityScore.call` OK; curl 200 nos 4 endpoints, 401 sem token.
- Pendência: `SPEC.md` ausente — revisar thresholds quando existir.

---

### Task 11 — Frontend: confiança (`FaixaConfianca`, `CardParada`, página `Linha`)

**Refs:** `architecture.md` L228-235, L361-375, L411-414

**Escopo:** Componentes e página `Linha.tsx`; integração com API; subscribe em updates via `useReportsChannel` onde aplicável.

**Pronto:** ☑

**Feito:**
- `react-router-dom`; rotas `/` (landing + link) e `/linha/:id`.
- `lib/deviceToken.ts`, `lib/types.ts`, `lib/api.ts` (fetch + `X-Device-Token`).
- `FaixaConfianca.tsx` (teal/amber/coral/muted por nível), `CardParada.tsx`, `Linha.tsx`.
- Verificação: `npm run build` OK.
- Pendência: `useReportsChannel` deferido para Task 19 (sem client cable).

---

## Fase 4 — Ocupação

### Task 12 — `OccupancyScore` + endpoint de ocupação

**Refs:** `architecture.md` L11-12, L76, L91-92, L137-168, L300-301, L549

**Escopo:** Service `OccupancyScore` com precedência sensor/catraca > relato; `OcupacaoController` e JSON.

**Pronto:** ☑

**Feito:**
- `app/services/occupancy_score.rb`: janela 30 min, precedência `seat_sensor`/`turnstile` > `user_report`, derivação de nível por `level` ou `free_seats`/`boarding_count`, sem dados → label "sem dados".
- `Api::V1::OcupacaoController` + `GET /api/v1/ocupacao?stop_id=&trip_id=`; partial `_occupancy.json.jbuilder`.
- i18n: `occupancy.levels.no_data`, `api.errors.missing_stop_id`.
- Verificação: rota registrada; smoke DB requer PostgreSQL rodando.
- Pendência: `SPEC.md` ausente — revisar thresholds/janela quando existir.

---

### Task 13 — Frontend: `IndicadorOcupacao` + página `Parada`

**Refs:** `architecture.md` L228-235, L363-364, L370, L411-414

**Escopo:** Componente `IndicadorOcupacao`, página `Parada.tsx`, tipos em `lib/types.ts`.

**Pronto:** ☑

**Feito:**
- `IndicadorOcupacao.tsx` (paleta âmbar, barra proporcional, fonte/horário relativo).
- `pages/Parada.tsx`: fetch paralelo `fetchStop` + `fetchOccupancy`, confiança + ocupação + linhas com link.
- `lib/types.ts`: `Occupancy`, `StopDetail`, `OccupancyResponse`; `lib/api.ts`: `fetchOccupancy`, `fetchStop` tipado.
- Rota `/parada/:id`; `CardParada` linka para detalhe da parada.
- Verificação: `npm run build` OK.
- Pendência: `useReportsChannel` deferido para Task 19.

---

## Fase 5 — App do passageiro (busca e rota)

### Task 14 — `LeaveTime` + `ConnectionRouter` + endpoints de busca/rotas

**Refs:** `architecture.md` L10, L72-75, L91-95, L137-168, L549-550 · `SPEC.md` (lógica de hora de sair e conexões ônibus↔metrô)

**Escopo:** Services `LeaveTime` e `ConnectionRouter`; controllers `BuscaController` e `RotasController`.

**Pronto:** ☑

**Feito:**
- `ConnectionRouter`: rotas direct bus (GTFS stop_times), direct metro (ordem `metro_stations.yml`), transfer ônibus↔metrô com Haversine; estimativa metrô 35 km/h + 5 min/estação.
- `LeaveTime`: percorre pernas de trás pra frente; buffer ônibus via `ReliabilityScore` (fallback 300s); metrô 120s; agrega pior confiança.
- `RouteSearch` orquestra router + leave time; `BuscaController#index`, `RotasController#show`; Jbuilder + partial `_route_leg`.
- Rotas: `GET /api/v1/busca`, `GET /api/v1/rotas`; i18n erros e labels de roteamento.
- Verificação: syntax OK, rotas registradas; smoke DB requer PostgreSQL (`gtfs:import` + `metro:import_stations`).
- Pendência: `SPEC.md` ausente — revisar lógica de conexões e buffers quando existir.

---

### Task 15 — Frontend: páginas `Busca`, `Rota` e lib compartilhada

**Refs:** `architecture.md` L347-384, L386-402, L415-417

**Escopo:** `Busca.tsx`, `Rota.tsx`, `lib/api.ts`, `lib/deviceToken.ts`, `lib/types.ts`, roteamento em `App.tsx`.

**Pronto:** ☑

**Feito:**
- `types.ts`: `RouteLeg`, `RouteOption`, `SearchResponse`, `RouteDetailResponse`, params de busca.
- `api.ts`: `fetchSearch`, `fetchRoute` com query params.
- `Busca.tsx`: selects origem/destino via `fetchStops`, filtro modo, CTA seafoam; navega para `/rota?origin=&destination=&route_index=0`.
- `Rota.tsx`: hora de sair em destaque, pernas com links para parada/linha, `FaixaConfianca` por perna de ônibus.
- `App.tsx`: rotas `/busca`, `/rota`; CTA "Planejar viagem" na home.
- Verificação: `npm run build` OK.
- Pendência: `Mapa` (Task 16); `useReportsChannel` (Task 19).

---

### Task 16 — Frontend: componente `Mapa` (react-leaflet)

**Refs:** `architecture.md` L34, L372

**Escopo:** Wrapper `Mapa.tsx` com OpenStreetMap; reutilizável nas páginas de busca, parada e demanda.

**Pronto:** ☑

**Feito:**
- Deps: `leaflet`, `react-leaflet`, `@types/leaflet` em `package.json`.
- `Mapa.tsx`: OSM tiles, `divIcon` custom (paleta teal/sea/amber/coral), guard client-only, props `markers`/`center`/`zoom`/`className`/`fitBounds`; tipos `MapMarker` e `MapMarkerVariant` exportados.
- `index.css`: import `leaflet/dist/leaflet.css`.
- `Busca.tsx`: mapa com todas as paradas, destaque origem (âmbar) e destino (coral), `fitBounds`.
- `Parada.tsx`: mapa centrado na parada (zoom 14).
- Verificação: `npm run build` OK.
- Pendência: integração em `MapaDemanda` (Task 22).

---

## Fase 6 — Camada cívica + feedback em tempo real

### Task 17 — `SafetyScore` + modelo/API de `stop_reports`

**Refs:** `architecture.md` L13, L95, L302, L551 · `SPEC.md` (categorias e severidade de relatos)

**Escopo:** Service `SafetyScore`; parte de `ReportesController` para `stop_reports`; agregação anônima.

**Pronto:** ☑

**Feito:**
- `SafetyScore` em `app/services/safety_score.rb`: janela 7 dias, média de `severity` (1–3), níveis high/medium/low por thresholds MVP; sem dados → label "sem dados".
- `Api::V1::ReportesController#parada` + `POST /api/v1/reportes/parada`; Jbuilder `reportes/parada` com `safety` agregado (sem expor `device_token`).
- Partial `_safety.json.jbuilder`; `ParadasController#show` inclui bloco `safety`.
- i18n `safety.level.*` em `pt-BR.yml`.
- Verificação: `SafetyScore.call` OK; GET parada com `safety`; POST parada 201.
- Pendência: `SPEC.md` ausente — revisar thresholds quando existir.

---

### Task 18 — API de reportes (`arrival_events`, `occupancy_readings`)

**Refs:** `architecture.md` L16-17, L79, L300-301, L176-179 · `SPEC.md` (contextos geofence vs on-demand)

**Escopo:** Endpoints em `ReportesController` para chegadas e ocupação; atribuição de `source`, `context` e `device_token`.

**Pronto:** ☑

**Feito:**
- `ReportesController#chegada` e `#ocupacao` + rotas `POST /api/v1/reportes/chegada` e `.../ocupacao`.
- Atribuição `source: user` / `user_report`, `context` via params, `device_token` do header; `delay_seconds` calculado em chegadas.
- Jbuilder `reportes/chegada` e `reportes/ocupacao`; i18n erros de params obrigatórios.
- `ReportsChannel.broadcast` após cada create (parada, chegada, ocupacao) com payload `{event, kind, stop_id, trip_id?}`.
- Verificação: POST 201 nos 3 endpoints; scores atualizados; broadcast OK via runner/curl.
- Pendência: ingestão GPS/hardware fora do escopo MVP; client cable (Task 19).

---

### Task 19 — ActionCable no client (`lib/cable.ts`)

**Refs:** `architecture.md` L16-17, L105, L378-379, L411-414

**Escopo:** Conexão única, subscribe `ReportsChannel`, hook `useReportsChannel` para componentes reagirem sem polling.

**Pronto:** ☑

**Feito:**
- Deps: `@rails/actioncable`, `@types/rails__actioncable`.
- `lib/cable.ts`: consumer singleton `/cable`, subscribe `ReportsChannel`, fan-out de listeners com unsubscribe.
- `lib/useReportsChannel.ts`: hook com filtro por `stopId`/`tripId`.
- `lib/types.ts`: tipo `ReportBroadcast`.
- `Parada.tsx` e `Linha.tsx`: refetch automático ao receber broadcast relevante.
- Verificação: `npm run build` OK.

---

### Task 20 — Frontend: fluxo de reporte (geofence + on-demand)

**Refs:** `architecture.md` L16-17, L373-375, L379, L415-417 · `SPEC.md` (UX de prompts geofence)

**Escopo:** `FluxoReporte.tsx`, `PromptGeofence.tsx`, `BotaoReportar.tsx`, `lib/geofence.ts` (Geolocation API + Haversine no client).

**Pronto:** ☑

**Feito:**
- `lib/geofence.ts`: Haversine, raio 100 m, debounce 30 min (`localStorage`), `watchNearStop`.
- `lib/api.ts`: `postReportParada`, `postReportChegada`, `postReportOcupacao`.
- `lib/types.ts`: `Safety`, enums de reporte, `StopTripRef`, response types.
- Componentes: `FluxoReporte`, `PromptGeofence`, `BotaoReportar`, `IndicadorSeguranca`.
- `Parada.tsx`: bloco segurança (coral), FAB reportar, prompt geofence, integração cable refetch.
- Backend mínimo: `paradas#show` inclui `trips` com `scheduled_at` para chegada/ocupação.
- Verificação: `npm run build` OK.
- Pendência: `SPEC.md` ausente — revisar raio/debounce/UX geofence quando existir.

---

### Task 21 — Demanda e ranking (backend)

**Refs:** `architecture.md` L14-15, L77-78, L303, L551 · `SPEC.md` (mapa de calor e ranking de linhas)

**Escopo:** `DemandaController`, `RankingController`; gravação em `demand_searches` na busca.

**Pronto:** ☑

**Feito:**
- `DemandHeatmap` (janela 7 dias default, agregação origem+destino por parada, `intensity` 0–1).
- `LineRanking` (ordena por nível high>medium>low, empate on_time_percent e median_delay; sem dados por último).
- `DemandaController` + `RankingController`, Jbuilder, rotas `GET /api/v1/demanda` e `GET /api/v1/ranking` (`days` clamp 1–30).
- `BuscaController#record_demand_search` após validação de paradas (falha não bloqueia busca).
- Verificação: rotas registradas; smoke DB requer PostgreSQL.
- Pendência: `SPEC.md` ausente — revisar janela/agregação quando existir.

---

### Task 22 — Frontend: páginas `MapaDemanda` e `Ranking`

**Refs:** `architecture.md` L366-367, L372

**Escopo:** Páginas com mapa de calor de demanda e ranking de confiabilidade entre linhas.

**Pronto:** ☑

**Feito:**
- `MapaDemanda.tsx`: fetch demanda, mapa com `intensity`, legenda, estado vazio, link para Busca.
- `Ranking.tsx`: lista ordenada com `#rank`, `FaixaConfianca`, link para `/linha/:id`.
- `lib/types.ts` + `lib/api.ts`: `DemandPoint`, `DemandResponse`, `RankingLine`, `RankingResponse`, `fetchDemand`, `fetchRanking`.
- `Mapa.tsx`: prop opcional `intensity` em markers (tamanho/opacidade âmbar).
- `App.tsx`: rotas `/demanda`, `/ranking`; CTAs na home.
- Verificação: `npm run build` OK.

---

## Fase 7 — Demo e qualidade

### Task 23 — Seed de demonstração

**Refs:** `architecture.md` L18, L122, L552 · `SPEC.md` (corredor Ceilândia ↔ Taguatinga)

**Escopo:** `seed_demo.rake` com dados sintéticos plausíveis para ônibus e metrô no corredor de demo.

**Pronto:** ☑

**Feito:**
- `lib/demo/seeder.rb`: orquestra GTFS import + metro stations, wipe idempotente de eventos, inserts sintéticos.
- `lib/tasks/seed_demo.rake`: task `demo:seed` (flag `DEMO_RESET=0` para skip do wipe).
- Volumes: 23 arrival_events (7 dias, mix on-time/atrasos), 4 occupancy_readings (sensor/catraca/user), 7 stop_reports, 31 demand_searches.
- Scores demo: linha 101 high (82.6% no horário), STOP001 crowded + safety high, STOP002 safety low, heatmap com intensity > 0.
- Verificação: `rake demo:seed` idempotente; ReliabilityScore/OccupancyScore/SafetyScore/DemandHeatmap OK; curl ranking/demanda/busca/parada 200.

---

### Task 24 — Testes RSpec (smoke dos fluxos críticos)

**Refs:** `architecture.md` L533-539, L137-168

**Escopo:** Request specs dos endpoints principais; unit specs de `ReliabilityScore`, `OccupancyScore`, `LeaveTime`, `SafetyScore`, `Geo::DistanceCalculator`; factories.

**Pronto:** ☑

**Feito:**
- `spec/support/api_helpers.rb`: `auth_headers` (UUID + `Accept: application/json`), `json_headers`, `json_body`.
- `spec/support/gtfs_context.rb`: metadata `:gtfs_context` importa fixtures GTFS + estações metrô.
- Factories FactoryBot para 8 models em `spec/factories/` (traits bus/metro, on_time/late, seat_sensor/user_report).
- Unit specs: `Geo::DistanceCalculator`, `ReliabilityScore`, `OccupancyScore`, `SafetyScore`, `LeaveTime` (com `travel_to`).
- Request specs smoke: ping, linhas, paradas, ocupacao, busca, rotas, demanda, ranking, reportes (auth 401, happy path, erros 422).
- `rails_helper.rb`: carrega `spec/support/**/*.rb`.
- Verificação: `bundle exec rspec` — 43 examples, 0 failures.
- Decisão: POST reportes usa `as: :json`; respostas Jbuilder são flat no root (sem wrapper `line`/`stop`/`route`).

---

## Resumo de progresso

| Fase | Tasks | Prontas |
|------|-------|---------|
| 1 — Fundação | 1–6 | 6/6 |
| 2 — Infra API | 7–9 | 3/3 |
| 3 — Confiabilidade | 10–11 | 2/2 |
| 4 — Ocupação | 12–13 | 2/2 |
| 5 — Passageiro | 14–16 | 3/3 |
| 6 — Cívica + RT | 17–22 | 6/6 |
| 7 — Demo + QA | 23–24 | 2/2 |
| **Total** | **24** | **24/24** |
