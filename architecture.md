# Arquitetura — Confia

> Este documento é a referência canônica de arquitetura do **Confia** para qualquer agente de IA (ou humano) que for implementar, revisar ou estender este projeto. Leia este arquivo inteiro antes de gerar código. Em caso de dúvida ou conflito com `SPEC.md`, este documento prevalece sobre decisões técnicas/estruturais; `SPEC.md` prevalece sobre escopo de produto.

## 0. O que é o produto (resumo executivo)

Confia é um app web (mobile-first) para passageiros de transporte público do DF que responde a quatro perguntas, para ônibus e metrô, num corredor de demonstração (Ceilândia ↔ Taguatinga):

1. **Posso confiar nessa linha/parada/horário?** → índice de confiança (alta/média/baixa), calculado comparando horário **previsto** (GTFS) com horário **realizado** (GPS do veículo + relato do usuário).
2. **A que horas eu devo sair de casa?** → "hora de sair", calculada a partir de origem, destino e confiabilidade histórica daquele trajeto/horário.
3. **O veículo está cheio?** → ocupação estimada (livre/moderado/cheio/lotado), agregando sensor de assento + catraca + relato do usuário, com sensor/catraca tendo precedência sobre relato humano quando ambos existem e são recentes.
4. **A parada é segura?** → score de segurança da parada, alimentado por relatos colaborativos agregados e anônimos.

Como subproduto, o sistema gera um **mapa de calor de demanda** (buscas origem→destino) e um **ranking de confiabilidade** entre linhas.

Tudo é alimentado por dois canais de feedback do usuário — **solicitado via geofence** (o app pergunta quando detecta que o usuário chegou/embarcou) e **on-demand** (botão "Reportar" sempre visível) — e propagado em tempo real via WebSocket para todos os clientes conectados.

É um MVP de hackathon: dado de metrô é semente sintética, hardware de sensor/catraca não é integrado (só a interface de ingestão), e o corredor de demonstração é fixo.

---

## 1. Stack e versões fixadas

| Camada | Tecnologia | Versão |
|---|---|---|
| Linguagem backend | Ruby | 3.4 |
| Framework backend | Rails (modo `--api`) | 8.0 |
| Banco de dados | PostgreSQL | 16+ (sem extensão PostGIS — ver seção 5) |
| Fila de jobs | Sidekiq + `sidekiq-scheduler` | gems mais recentes estáveis na 8.0 |
| Cache | Redis (via `redis-rails`/cache store nativo do Rails apontando pro Redis) | — |
| WebSocket / tempo real | ActionCable, adapter Redis | — |
| Frontend | React + TypeScript via Vite | Node 20 LTS, npm |
| Estilo | Tailwind CSS | — |
| Mapas | react-leaflet + OpenStreetMap | — |
| Testes | RSpec (`rspec-rails`) | — |
| Orquestração de processos em dev | `Procfile.dev` + `bin/dev` (foreman) | — |

**Decisão importante:** Rails 8.0 vem com Solid Queue, Solid Cache e Solid Cable nativos (baseados em banco). **Não usamos isso** — o projeto usa Redis + Sidekiq + ActionCable (adapter Redis) deliberadamente, então essas gems padrão do Rails 8 devem ser **removidas** na geração do projeto (ver seção 4).

**Decisão importante:** **sem PostGIS**. Latitude/longitude são colunas `decimal` simples em `stops`. Cálculos de proximidade/distância (ex.: "parada mais próxima", geofence no servidor, raio de busca) são feitos em **Ruby puro com fórmula de Haversine** dentro de services, não com funções espaciais do banco. Isso é suficiente para o volume de dados de um corredor de demonstração e evita a complexidade de instalar/manter a extensão.

---

## 2. Estrutura de pastas (visão de raiz)

```
confia/
├── ARCHITECTURE.md          ← este arquivo
├── SPEC.md                  ← especificação de produto/funcional
├── Procfile.dev              ← processos de desenvolvimento (ver seção 6)
├── bin/
│   └── dev                   ← sobe Procfile.dev (ver seção 6)
├── backend/                  ← Rails API
│   └── ... (ver seção 3)
└── frontend/                 ← React + Vite + Tailwind
    └── ... (ver seção 7)
```

Backend e frontend são **duas aplicações independentes**, cada uma com seu próprio gerenciador de dependências (Bundler / npm), rodando como processos separados, orquestrados juntos só em desenvolvimento via `bin/dev`. Em produção (fora de escopo do hackathon) seriam deployados separadamente.

---

## 3. Estrutura do backend (Rails API)

```
backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── base_controller.rb       # autenticação por device token, rescue_from, etc.
│   │   │       ├── busca_controller.rb
│   │   │       ├── linhas_controller.rb
│   │   │       ├── paradas_controller.rb
│   │   │       ├── rotas_controller.rb
│   │   │       ├── ocupacao_controller.rb
│   │   │       ├── demanda_controller.rb
│   │   │       ├── ranking_controller.rb
│   │   │       └── reportes_controller.rb   # arrival_events, occupancy_readings, stop_reports
│   │   └── sidekiq_web_constraint.rb        # Basic Auth do Sidekiq Web UI
│   ├── models/
│   │   ├── line.rb
│   │   ├── stop.rb
│   │   ├── trip.rb
│   │   ├── stop_time.rb
│   │   ├── arrival_event.rb
│   │   ├── occupancy_reading.rb
│   │   ├── stop_report.rb
│   │   └── demand_search.rb
│   ├── services/
│   │   ├── reliability_score.rb
│   │   ├── occupancy_score.rb
│   │   ├── leave_time.rb
│   │   ├── connection_router.rb
│   │   ├── safety_score.rb
│   │   └── geo/
│   │       └── distance_calculator.rb       # Haversine puro Ruby
│   ├── jobs/
│   │   ├── score_recalculation_job.rb       # disparado por sidekiq-scheduler
│   │   └── stale_reading_cleanup_job.rb
│   ├── channels/
│   │   ├── application_cable/
│   │   │   ├── connection.rb
│   │   │   └── channel.rb
│   │   └── reports_channel.rb
│   └── serializers/                          # (opcional, ou usar Jbuilder/blueprinter — ver seção 3.4)
├── config/
│   ├── database.yml
│   ├── cable.yml                             # adapter: redis
│   ├── application.rb
│   ├── routes.rb
│   ├── initializers/
│   │   ├── sidekiq.rb
│   │   └── cors.rb
│   ├── schedule.yml                          # sidekiq-scheduler
│   └── locales/
│       └── pt-BR.yml
├── lib/
│   └── tasks/
│       ├── gtfs_import.rake
│       ├── metro_stations_import.rake
│       └── seed_demo.rake
├── db/
│   ├── migrate/
│   └── seeds.rb
├── spec/
│   ├── models/
│   ├── services/
│   ├── requests/
│   ├── factories/
│   ├── rails_helper.rb
│   └── spec_helper.rb
├── Gemfile
└── config.ru
```

### 3.1 Convenção: Service Objects

Toda regra de negócio não-trivial vive em `app/services`, **não** em models nem controllers. Convenção:

- Uma classe por responsabilidade, sufixo descreve a ação (ex.: `ReliabilityScore`, não `ReliabilityScoreService` — o namespace `app/services` já deixa isso implícito).
- Interface pública: método de classe `.call(...)` que instancia e delega para um `#call` de instância. Padrão:

```ruby
module Services
  class ReliabilityScore
    def self.call(...) = new(...).call

    def initialize(line:, stop:, time_window:)
      @line = line
      @stop = stop
      @time_window = time_window
    end

    def call
      # ...
    end

    private

    attr_reader :line, :stop, :time_window
  end
end
```

- Services não conhecem HTTP (sem `params`, sem `render`) — recebem objetos Ruby/ActiveRecord e devolvem objetos Ruby simples (Hash, struct, ou um Result object). Controllers chamam services e serializam o retorno.
- Services que cruzam múltiplas fontes (ex.: `OccupancyScore` lendo sensor + catraca + usuário) resolvem a regra de precedência internamente, documentada em comentário no topo da classe.
- Models permanecem finos: associations, validations, scopes simples. Sem regra de negócio complexa em model.

### 3.2 Controllers

- Namespace `Api::V1::` desde o início (mesmo sem necessidade imediata de versionamento, evita retrabalho).
- `Api::V1::BaseController` concentra: autenticação por device token (header simples, sem cadastro — ver seção 3.3), `rescue_from` padrão (404, 422), e helpers comuns.
- Controllers ficam finos: parseiam params, chamam um service ou um finder simples, serializam, retornam. Sem lógica de cálculo dentro do controller.

### 3.3 Autenticação

- **Anônima baseada em dispositivo**: o frontend gera um UUID na primeira visita (`localStorage`), envia em todo request via header `X-Device-Token`. O backend não persiste usuário — apenas usa esse token para rate limiting e para atribuir `source: "user"` aos reportes, sem vincular a identidade real.
- Sem Devise, sem sessão, sem senha. Isso é suficiente para o MVP e está alinhado ao requisito de privacidade do SPEC (sem identificar indivíduos).

### 3.4 Serialização

Usar **Jbuilder** (já vem com Rails) para views JSON em `app/views/api/v1/**/*.json.jbuilder`, ou serializers simples em `app/serializers` se a resposta for montada dentro do service. Não introduzir gem de serialização adicional (ex.: `active_model_serializers`) — desnecessário para o escopo.

### 3.5 I18n (pt-BR)

- `config/application.rb`: `config.i18n.default_locale = :"pt-BR"`.
- `config/locales/pt-BR.yml` concentra mensagens de erro, labels de enum (ex.: níveis de ocupação `livre`/`moderado`/`cheio`/`lotado`), e textos usados em respostas da API quando aplicável.
- Nomes de tabelas, colunas, classes, métodos: **em inglês**, seguindo convenção Rails/Ruby idiomática (evita atrito com gems, geradores, e qualquer ferramenta padrão do ecossistema). A camada de tradução pt-BR vive em `locales` e na serialização de saída (enums, mensagens), não no schema.
- Frontend: toda a UI é em pt-BR diretamente nos componentes (sem necessidade de biblioteca de i18n no frontend para o MVP, dado que não há outro idioma a suportar — ver seção 7.4 se isso mudar).

Paleta de cores do pitch deck

Todas as cores em hexadecimal, com a função de cada uma e onde aparecem nos slides.

## Paleta principal

| Cor | Hex | Função |
|-----|-----|--------|
| Teal profundo (INK) | #0B3B45 | Cor dominante; fundo dos slides escuros (1, 4, 7) e cor das sombras |
| Teal profundo claro (INK2) | #10505E | Cards sobre fundo escuro (slide 4) |
| Teal | #12849A | Cor de apoio; ícones do pilar "confiança", barras do gráfico |
| Seafoam / verde-água (SEA) | #2A9D8F | Cor de apoio; pilar "hora de sair", faixa de destaque, escudo |
| Âmbar (AMBER) | #E9A23B | *Acento*; pilar "ocupação", destaques e palavra "Confia." final |
| Coral (CORAL) | #E2674E | Alerta/segurança; pilar "segurança", card de privacidade |

## Neutros e fundos

| Cor | Hex | Função |
|-----|-----|--------|
| Branco (PAPER) | #FFFFFF | Fundo dos slides claros (3, 6) e dos cards claros |
| Cinza-azulado claro (LIGHT) | #F1F6F7 | Fundo de slides/cards (2, 5) |
| Tint | #E8F1F2 | Cards de apoio (slide 6) |
| Texto escuro (DARKTXT) | #12333B | Títulos e textos sobre fundo claro |
| Texto neutro (MUTED) | #5B7079 | Texto secundário / descrições sobre fundo claro |

## Tons de texto sobre fundo escuro

| Hex | Função |
|-----|--------|
| #BFD8DC | Rótulo "ônibus & metrô" (slide 1) |
| #9FC6CC | Subtítulos sobre fundo escuro (slides 1, 4, 7) |
| #7FA9AF | Rótulo "Corredor de demonstração" (slide 1) |
| #AFCDD2 | Descrição dos cards escuros (slide 4) |
| #06343A | Texto sobre a faixa seafoam (slide 4) |
| #E2E8F0 | Linhas de grade do gráfico (slide 5) |

## Mapa dos 4 pilares → cor

| Pilar | Cor | Hex |
|-------|-----|-----|
| Índice de confiança (horário) | Teal | #12849A |
| Hora de sair | Seafoam | #2A9D8F |
| Ocupação | Âmbar | #E9A23B |
| Segurança da parada | Coral | #E2674E |

## Observações de uso

- *Dominância:* o teal profundo (#0B3B45) carrega 60–70% do peso visual; teal e seafoam são apoio; âmbar é o único acento de destaque.
- *Sandwich claro/escuro:* abertura e fechamento (slides 1 e 7) escuros; conteúdo (2, 3, 5, 6) claro; slide 4 escuro para separar a seção de dados.
- Hex sempre *sem #* se for usar direto no PptxGenJS (ex.: "0B3B45"); a tabela acima usa # por ser referência de design.

### 3.6 Timezone

- `config/application.rb`: `config.time_zone = "Brasilia"` (timezone Rails, mapeia para America/Sao_Paulo).
- `config/database.yml` / migrations: timestamps armazenados em UTC no banco (padrão Rails — `ActiveRecord::Base.default_timezone = :utc` é o default e **não deve ser alterado**), e convertidos para `America/Sao_Paulo` na exibição/serialização via `config.time_zone`. Esse é o padrão Rails recomendado: **armazenar em UTC, exibir no timezone local** — não há razão para fugir disso.
- `scheduled_at` (de `stop_times`, vindo do GTFS) precisa ser interpretado já considerando que o GTFS do DF expressa horários locais — a importação (`gtfs_import.rake`) deve converter explicitamente para UTC ao persistir, usando `Time.zone.parse`.

---

## 4. Gems e o que remover do Rails 8 default

Gerar o projeto com:

```
rails new backend --api -d postgresql -j esbuild --skip-test
```

(`--skip-test` porque usamos RSpec, não Minitest. `-j esbuild` é irrelevante em modo API mas inofensivo; se o gerador não pedir JS bundler em modo `--api`, ignorar essa flag.)

**Remover do Gemfile** (geradas por padrão no Rails 8, substituídas por Redis/Sidekiq):
- `solid_queue`
- `solid_cache`
- `solid_cable`
- Qualquer referência a `config.solid_queue...`, `config.solid_cache...` em `config/environments/*.rb` deve ser removida/substituída.
- O initializer/config que aponta `config.active_job.queue_adapter` deve apontar para `:sidekiq`.
- O initializer/config que aponta cache_store deve apontar para `:redis_cache_store`.
- `config/cable.yml` deve usar adapter `redis`, não `solid_cable`.

**Adicionar ao Gemfile:**
```ruby
gem "sidekiq"
gem "sidekiq-scheduler"
gem "redis"

group :development, :test do
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
end
```

---

## 5. Modelagem de dados

Sem PostGIS — `stops.latitude` e `stops.longitude` são `decimal(10, 6)`. Toda lógica de "parada mais próxima", raio de geofence, etc. é feita em Ruby (`app/services/geo/distance_calculator.rb`, fórmula de Haversine), aplicada sobre os registros já carregados/filtrados por um bounding box simples em SQL (`WHERE latitude BETWEEN ... AND longitude BETWEEN ...`) para não varrer a tabela inteira.

### Tabelas vindas do GTFS / estações (ver SPEC.md para a fonte de cada uma)

- **`lines`** — `gtfs_id`, `name`, `mode` (enum: `bus` | `metro`), `color` (opcional, para UI).
- **`stops`** — `gtfs_id`, `name`, `latitude`, `longitude`, `mode` (que tipo de stop é — pode ser `bus`, `metro`, ou ambos se for um ponto compartilhado; ver nota abaixo).
- **`trips`** — `line_id` (FK), `gtfs_id`, `headsign`, `direction`.
- **`stop_times`** — `trip_id` (FK), `stop_id` (FK), `scheduled_at` (datetime, UTC), `stop_sequence`.

> Nota sobre `stops.mode`: o SPEC diz "`stops` cobre tanto pontos de ônibus quanto estações de metrô" — modelar como uma coluna `mode` em `stops` também (não só em `lines`), porque uma busca filtrada por modo precisa filtrar paradas, não só linhas. Se um ponto físico atender os dois modos no corredor (não é o caso esperado em Ceilândia↔Taguatinga, mas a estrutura deve aguentar), usar dois registros de `stop` distintos vinculados por uma referência opcional, em vez de uma coluna multi-valorada — mais simples de consultar.

### Tabelas da aplicação

- **`arrival_events`** — `trip_id` (FK), `stop_id` (FK), `scheduled_at`, `observed_at`, `delay_seconds` (calculado), `source` (enum: `gps` | `user`), `context` (enum: `gps` | `geofence_arrival` | `geofence_boarding` | `on_demand`), `device_token` (string, para rate limit — não para identificação).
- **`occupancy_readings`** — `trip_id` (FK), `stop_id` (FK), `recorded_at`, `source` (enum: `seat_sensor` | `turnstile` | `user_report`), `free_seats` (integer, nullable), `boarding_count` (integer, nullable), `level` (enum, nullable: `free` | `moderate` | `crowded` | `packed`), `context` (mesmo enum de `arrival_events`), `device_token`.
- **`stop_reports`** — `stop_id` (FK), `recorded_at`, `category` (enum — ex. `iluminacao`, `infraestrutura`, `seguranca_geral`...), `severity` (integer, escala curta, ex. 1-3), `context` (`geofence_arrival` | `on_demand`), `device_token`.
- **`demand_searches`** — `origin_stop_id` (FK), `destination_stop_id` (FK), `mode_filter` (enum, nullable), `searched_at`.

Todas as tabelas de evento humano carregam `source` + `context`, conforme a nota do SPEC — isso evita duplicar tabelas para "solicitado via geofence" vs. "on-demand".

### Índices mínimos esperados

- `arrival_events`: índice composto em `(trip_id, stop_id, observed_at)` e em `(stop_id, scheduled_at)` para as queries de score por faixa horária.
- `occupancy_readings`: índice composto em `(trip_id, stop_id, recorded_at)`.
- `stop_reports`: índice em `(stop_id, recorded_at)`.
- `stops`: índice em `(latitude, longitude)` para acelerar o bounding box antes do cálculo de Haversine.

---

## 6. Orquestração de desenvolvimento (`bin/dev` + `Procfile.dev`)

Um único `bin/dev`, na raiz do repositório (não dentro de `backend/`), sobe **tudo**: Rails, Vite (frontend), Redis e Sidekiq.

`Procfile.dev` (raiz do repositório):
```
redis: redis-server --port 6379
web: cd backend && bin/rails server -p 3000
worker: cd backend && bundle exec sidekiq
frontend: cd frontend && npm run dev
```

`bin/dev` (raiz do repositório, executável):
```bash
#!/usr/bin/env bash

if ! gem list foreman -i --silent; then
  echo "Instalando foreman..."
  gem install foreman
fi

exec foreman start -f Procfile.dev "$@"
```

Notas:
- `redis-server` precisa estar instalado localmente (`brew install redis` / `apt install redis-server` / etc.) — o `bin/dev` apenas invoca o binário, não instala o Redis em si.
- Se a porta 6379 já estiver em uso (Redis já rodando como serviço do sistema), o processo `redis` do Procfile falhará isoladamente sem derrubar os outros — foreman reporta o erro daquele processo específico no log, mas é um ponto de atenção documentado aqui.
- Sidekiq lê a config de conexão Redis de `config/initializers/sidekiq.rb` (ver seção 8), que por sua vez lê de `REDIS_URL` (com fallback para `redis://localhost:6379/1` em dev).

---

## 7. Frontend (React + Vite + Tailwind)

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── pages/
    │   ├── Busca.tsx
    │   ├── Linha.tsx
    │   ├── Parada.tsx
    │   ├── Rota.tsx
    │   ├── MapaDemanda.tsx
    │   └── Ranking.tsx
    ├── components/
    │   ├── FaixaConfianca.tsx
    │   ├── IndicadorOcupacao.tsx
    │   ├── CardParada.tsx
    │   ├── Mapa.tsx                  # wrapper react-leaflet
    │   ├── FluxoReporte.tsx
    │   ├── PromptGeofence.tsx
    │   └── BotaoReportar.tsx
    ├── lib/
    │   ├── api.ts                    # client HTTP (fetch wrapper), injeta X-Device-Token
    │   ├── cable.ts                  # conexão ActionCable (@rails/actioncable)
    │   ├── geofence.ts               # Geolocation API + cálculo de proximidade (Haversine no client)
    │   ├── deviceToken.ts            # gera/persiste UUID em localStorage
    │   └── types.ts                  # tipos TS espelhando os enums/contratos da API
    └── styles/
        └── index.css                 # diretivas Tailwind
```

### 7.1 Build rápido — configuração já preparada

- **Vite** como bundler (não CRA, não Webpack manual) — dev server com HMR instantâneo, build de produção rápido por padrão. Já é a escolha correta para "buildar rápido" sem configuração extra.
- `vite.config.ts` com `server.port` fixo (ex. `5173`, padrão do Vite) e `server.proxy` apontando `/api` para `http://localhost:3000`, evitando configurar CORS manualmente em dev:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/cable": { target: "ws://localhost:3000", ws: true },
    },
  },
});
```

- Em produção, `config/initializers/cors.rb` no backend precisa liberar a origem do frontend buildado (fora de escopo de hackathon detalhar isso, mas o initializer já deve existir com `rack-cors`).
- `npm run build` gera estático otimizado em `frontend/dist` — suficiente para o hackathon, sem necessidade de SSR.

### 7.2 Tailwind

Setup padrão (`npx tailwindcss init -p`), mobile-first por convenção (classes sem prefixo = mobile, `md:`/`lg:` para telas maiores), sem plugin adicional necessário para o MVP.

### 7.3 Real-time no client

`lib/cable.ts` abre uma conexão única ActionCable (`@rails/actioncable`), inscreve no `ReportsChannel`, e expõe um hook simples (`useReportsChannel`) que os componentes (`FaixaConfianca`, `IndicadorOcupacao`, etc.) usam para reagir a updates sem polling.

### 7.4 i18n no frontend

Não introduzir `react-i18next` ou similar no MVP — todo texto é pt-BR direto nos componentes (`Carregando...`, `Cheio`, etc.). Se o produto crescer para multi-idioma depois, esse é o ponto de extensão natural, mas é over-engineering para o escopo atual.

---

## 8. Sidekiq: scheduler e autenticação do Web UI

### 8.1 Conexão

`config/initializers/sidekiq.rb`:
```ruby
redis_url = ENV.fetch("REDIS_URL", "redis://localhost:6379/1")

Sidekiq.configure_server do |config|
  config.redis = { url: redis_url }
end

Sidekiq.configure_client do |config|
  config.redis = { url: redis_url }
end
```

### 8.2 sidekiq-scheduler

`config/schedule.yml` define jobs recorrentes — por exemplo, recálculo periódico de scores agregados ou limpeza de leituras antigas:
```yaml
score_recalculation:
  cron: "*/5 * * * *"
  class: ScoreRecalculationJob

stale_reading_cleanup:
  cron: "0 * * * *"
  class: StaleReadingCleanupJob
```
Carregado no mesmo `config/initializers/sidekiq.rb`, dentro do bloco `configure_server`:
```ruby
Sidekiq.configure_server do |config|
  config.redis = { url: redis_url }
  config.on(:startup) do
    Sidekiq.schedule = YAML.load_file(Rails.root.join("config/schedule.yml"))
    SidekiqScheduler::Scheduler.instance.reload_schedule!
  end
end
```

### 8.3 Web UI com Basic Auth

`config/routes.rb`:
```ruby
require "sidekiq/web"

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq", constraints: SidekiqWebConstraint

  namespace :api do
    namespace :v1 do
      # ...
    end
  end
end
```

A autenticação fica num constraint dedicado, **não** inline em `routes.rb`, para manter o arquivo de rotas limpo:

`app/controllers/sidekiq_web_constraint.rb`:
```ruby
class SidekiqWebConstraint
  def self.matches?(request)
    username = ENV.fetch("SIDEKIQ_USERNAME", "admin")
    password = ENV.fetch("SIDEKIQ_PASSWORD", "confia")

    provided = Rack::Auth::Basic::Request.new(request.env)
    return false unless provided.provided? && provided.basic?

    given_user, given_pass = provided.credentials
    ActiveSupport::SecurityUtils.secure_compare(given_user, username) &&
      ActiveSupport::SecurityUtils.secure_compare(given_pass, password)
  end
end
```

> O fallback `"admin"`/`"confia"` existe só para não travar o ambiente de dev sem `.env` configurado. Em qualquer ambiente além de dev local, `SIDEKIQ_USERNAME`/`SIDEKIQ_PASSWORD` devem estar definidos via variável de ambiente real — nunca versionar credenciais reais.

---

## 9. `database.yml` — conexão local

Usuário/senha padrão do ambiente de desenvolvimento do autor do projeto, nome do banco genérico (segue o nome da app Rails gerada):

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: postgres
  password: "1234"
  host: localhost

development:
  <<: *default
  database: backend_development

test:
  <<: *default
  database: backend_test

production:
  <<: *default
  database: backend_production
  username: <%= ENV["DATABASE_USERNAME"] %>
  password: <%= ENV["DATABASE_PASSWORD"] %>
```

> `backend_development`/`backend_test` porque o app Rails é gerado dentro da pasta `backend/` (nome da app = `backend`, conforme `rails new backend --api`). Se o nome interno da aplicação Rails for outro, o nome do banco segue automaticamente — não fixar um nome de produto aqui propositalmente.

---

## 10. Testes (RSpec)

- `rspec-rails` + `factory_bot_rails` + `faker`, sem testes de exemplo gerados ainda — só a configuração:
  - `spec/rails_helper.rb` com `config.include FactoryBot::Syntax::Methods` e `ActiveRecord::Migration.maintain_test_schema!`.
  - `spec/spec_helper.rb` com config padrão do RSpec (`--require spec_helper` em `.rspec`).
  - Pastas vazias (com `.keep` ou primeira spec real quando a etapa de implementação chegar) em `spec/models`, `spec/services`, `spec/requests`, `spec/factories`.
- Convenção a seguir quando os specs forem escritos: **request specs** para os endpoints da API (não controller specs), **specs unitários** para cada service em `app/services`, **model specs** focados em validations/scopes/associations.

---

## 11. Ordem de implementação (mapeada às etapas do SPEC.md)

Este documento descreve a **forma**; a **ordem de construção** já está definida no `SPEC.md`, seção "Plano de implementação". Resumo de como cada etapa se conecta à estrutura aqui descrita:

1. **Fundação** → gerar `backend/` (com os ajustes da seção 4) e `frontend/` (seção 7), criar `Procfile.dev`/`bin/dev` (seção 6), migrations das tabelas GTFS (seção 5).
2. **Confiabilidade + GPS** → `arrival_events`, `Services::ReliabilityScore`, endpoint `Api::V1::LinhasController`/`ParadasController`.
3. **Ocupação** → `occupancy_readings`, `Services::OccupancyScore`, componente `IndicadorOcupacao`.
4. **App do passageiro** → páginas `Busca`, `Linha`, `Parada`, `Rota`; `Services::LeaveTime`, `Services::ConnectionRouter`.
5. **Camada cívica + feedback** → `stop_reports`, `Services::SafetyScore`, `ReportsChannel` (ActionCable), componentes `PromptGeofence`/`BotaoReportar`, páginas `MapaDemanda`/`Ranking`.
6. **Demo** → `seed_demo.rake`, dados sintéticos plausíveis para ônibus e metrô.

Cada etapa deve ser implementada e revisada antes de avançar para a próxima, conforme orientado na seção "Como usar no Claude Code" do `SPEC.md`.