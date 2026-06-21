# Tasks — Chat Bot (Confia AI)

> Referência canônica: [`chat_bot.md`](./chat_bot.md). Leia as seções indicadas (por número de linha) antes de iniciar cada task. Em caso de conflito com `architecture.md`, `chat_bot.md` prevalece para o chat.
>
> **Como usar:** pegue **uma task por vez**. Ao terminar, preencha **Feito** e marque **Pronto**.

---

## Legenda

| Campo | Significado |
|-------|-------------|
| **Refs** | Linhas de `chat_bot.md` com o contexto necessário para a task |
| **Pronto** | `☐` pendente · `☑` concluída · `⊘` bloqueada/cancelada |
| **Feito** | Resumo do que foi implementado (arquivos, decisões, pendências) |

**Contexto geral do produto (ler uma vez antes de qualquer task):** `chat_bot.md` L1-41 (seções 0, 1, 2 e 3 — o quê, decisão de modelo, compatibilidade da API xAI e decisões técnicas da feature)

---

## Fase 1 — Backend

### Task 1 — Initializer + `Services::RateLimiter`

**Refs:** `chat_bot.md` L13-19 (modelo e ENV — não hardcodar), L31-41 (tabela de decisões técnicas: key, modelo, Redis), L44-73 (estrutura de pastas: onde ficam os arquivos), L141-165 (implementação completa do RateLimiter)

**Escopo:**
- `backend/config/initializers/grok.rb`: lê `GROK_API_KEY` e `GROK_MODEL` do ENV; falhar cedo e de forma explícita se a key estiver ausente
- `backend/app/services/rate_limiter.rb`: service genérico com `.call(key:, limit:, window_seconds:)` usando INCR + EXPIRE no Redis

**Pronto:** ☑

**Feito:**
- `backend/config/initializers/grok.rb`: constantes `GROK_API_KEY` (via `ENV.fetch(..., nil)`) e `GROK_MODEL` (default `"grok-4.3"`). Em production faz raise; em dev/test loga warning — boot não quebra sem key.
- `backend/app/services/rate_limiter.rb`: padrão `.call` → `new` → `#call`. INCR + EXPIRE no Redis, `expire` só no primeiro INCR da janela para não reiniciar TTL. Retorna `true`/`false`.
- Commits: `e21afa0`, `842e2fd` (fix ENV.fetch).

---

### Task 2 — `Services::ChatContextBuilder`

**Refs:** `chat_bot.md` L44-73 (estrutura de pastas — onde o arquivo fica), L77-107 (responsabilidade, assinatura `.call`, estrutura do método `call` e lista de sub-métodos), L191-284 (system prompt completo — os blocos `{{ corredor_descricao }}`, `{{ linhas }}`, `{{ paradas }}`, `{{ ocupacao }}` são os que este service monta)

**Escopo:**
- `backend/app/services/chat_context_builder.rb`: lê dados do `seed_demo` via models `Line`, `Stop` e services existentes (`ReliabilityScore`, `OccupancyScore`, `SafetyScore`) e serializa em texto para injetar no system prompt
- Implementar os 4 blocos: `corredor_descricao`, `linhas_formatadas`, `paradas_formatadas`, `ocupacao_formatada`
- Cachear resultado em Redis ou memória de processo com TTL de 5 min (dados estáticos; recalcular a cada request é desperdício)

**Pronto:** ☑

**Feito:**
- `backend/app/services/chat_context_builder.rb`: classe top-level (sem namespace), 4 blocos separados por `---`. Memoiza `Line.all` via `@lines`. Cache de 5 min via `Rails.cache`. Scores com rescue para não quebrar sem dados.
- Commits: `5318769`, `bcb7f65` (fix path — movido de `services/services/` para `services/`).

---

### Task 3 — `Services::GrokClient`

**Refs:** `chat_bot.md` L23-28 (endpoint, estrutura do payload, autenticação Bearer), L31-41 (decisão: Net::HTTP ou Faraday, sem SDK), L109-140 (implementação completa: ENDPOINT, TIMEOUT_SECONDS, `initialize(messages:)`, `call`), L340-347 (edge cases: timeout, key ausente, resposta malformada — `choices[0].message.content`)

**Escopo:**
- `backend/app/services/grok_client.rb`: POST para `https://api.x.ai/v1/chat/completions` com `Authorization: Bearer ENV["GROK_API_KEY"]`
- Timeout de leitura e conexão = 15 s; levantar `Services::GrokClient::Error` em timeout ou erro HTTP
- Validar que `choices[0].message.content` existe antes de retornar; nunca deixar vazar payload bruto

**Pronto:** ☑

**Feito:**
- `backend/app/services/grok_client.rb`: `class GrokClient`, `ENDPOINT`, `TIMEOUT_SECONDS = 15`, `class Error < StandardError`. Net::HTTP com SSL. Valida key, trata timeout/não-2xx/content ausente com `GrokClient::Error`. Body inclui `temperature: 0.7` e `max_tokens: 500` além do spec (inofensivo).
- Commit: `3273fa9`.

---

### Task 4 — `Api::V1::ChatController` + rota

**Refs:** `chat_bot.md` L44-73 (estrutura — controller em `api/v1/`, não `api/`), L169-188 (endpoint completo: request/response shape, fluxo dos 5 passos, códigos 200/429/502), L340-347 (edge cases que o controller deve tratar)

**Escopo:**
- `backend/app/controllers/api/v1/chat_controller.rb`: herda de `Api::V1::BaseController`; fluxo: (1) rate limit via `RateLimiter`, (2) system prompt via `ChatContextBuilder`, (3) monta array `[system, *params[:messages]]`, (4) chama `GrokClient`, (5) retorna `{ reply: }` ou 429/502
- Adicionar `post 'chat', to: 'api/v1/chat#create'` (ou `namespace`/`resource`) em `config/routes.rb`

**Pronto:** ☑

**Feito:**
- `backend/app/controllers/api/v1/chat_controller.rb`: herda de `Api::V1::BaseController`. Fluxo dos 5 passos correto. Mensagens 429/502 exatas do spec. Strong params via `msg.permit(:role, :content)`.
- `backend/config/routes.rb`: `post "chat", to: "chat#create"` dentro de `namespace :v1`.
- Commit: `bdedb8d`.

---

## Fase 2 — Frontend

### Task 5 — `useChatStore.ts`

**Refs:** `chat_bot.md` L288-305 (tipos `ChatMessage` e `ChatState`, ações `sendMessage`/`toggleOpen`/`clearConversation`, timeout de cliente 15 s, uso de `lib/api.ts` existente)

**Escopo:**
- `frontend/src/components/Chat/useChatStore.ts`: hook com `useState`/`useReducer` puro — sem Zustand, Redux nem outra lib de estado
- Expor: `messages`, `isOpen`, `isLoading`, `error`, `sendMessage(content)`, `toggleOpen()`, `clearConversation()`
- `sendMessage` → `POST /api/v1/chat` via `lib/api.ts` (já injeta `X-Device-Token`), timeout alinhado ao backend (15 s)

**Pronto:** ☑

**Feito:**
- `frontend/src/components/Chat/useChatStore.ts`: `useState`/`useCallback` puro. `useRef` para acesso síncrono ao histórico em `sendMessage`. AbortController com timeout de 15 s. Error handling 429 com `isRateLimited` (60 s de cooldown). `clearConversation` reseta `messages` e `error`.
- Commits: `b790fa7`, `ca1386a` (fix clearConversation + leaflet.heat).

---

### Task 6 — `ChatMessage.tsx` + `ChatPanel.tsx`

**Refs:** `chat_bot.md` L311-323 (ChatPanel: scroll automático, boas-vindas hardcoded — não enviada à API —, indicador de digitação `...`, botão "Limpar conversa", bolha de erro diferenciada), L324-327 (ChatMessage: user à direita, assistant à esquerda), L330-337 (paleta: fundo `#F1F6F7`/`#FFFFFF`, texto `#12333B`/`#5B7079` — sem nova paleta)

**Escopo:**
- `frontend/src/components/Chat/ChatMessage.tsx`: bolha simples; user alinhado à direita, assistant à esquerda; paleta dos neutros do design system
- `frontend/src/components/Chat/ChatPanel.tsx`: lista de `ChatMessage` com scroll automático para a última mensagem; mensagem de boas-vindas injetada no estado local ao abrir (texto em `chat_bot.md` L315-318); indicador `...` quando `isLoading`; botão "Limpar conversa"; erros como bolha `assistant` com estilo visual diferente

**Pronto:** ☑

**Feito:**
- `frontend/src/components/Chat/ChatMessage.tsx`: bolhas user (direita, bg-teal, texto branco) e assistant (esquerda, bg-[#F1F6F7], texto #12333B). `isError` adiciona borda coral.
- `frontend/src/components/Chat/ChatPanel.tsx`: scroll automático (useRef+useEffect), boas-vindas hardcoded quando `messages.length === 0`, indicador animado com 3 pontos bounce, bolha de erro diferenciada, botão "Limpar conversa" condicional, input desabilitado em loading/rate limit.
- Commit: `661282f`.

---

### Task 7 — `ChatWidget.tsx` + integração em `App.tsx`

**Refs:** `chat_bot.md` L307-309 (FAB: fecha ao clicar fora via `useEffect`/listener, abre `ChatPanel`), L330-337 (cor teal `#12849A`, posição inferior **esquerdo**; `BotaoReportar` fica à direita — não sobrepor)

**Escopo:**
- `frontend/src/components/Chat/ChatWidget.tsx`: FAB circular cor `#12849A`, fixo no canto inferior esquerdo; ao clicar abre/fecha `ChatPanel`; fecha também ao clicar fora do painel (listener de clique no `useEffect`) ou no X interno
- Integrar `<ChatWidget />` uma única vez em `frontend/src/App.tsx` (no layout raiz, para aparecer em todas as telas sem duplicação)

**Pronto:** ☐

**Feito:**
> _(preencher pela IA que executou)_

---

## Fase 3 — Polimento

### Task 8 — Animações, indicador de digitação e posicionamento dos FABs

**Refs:** `chat_bot.md` L307-309 (ChatWidget — animação de entrada do painel), L311-323 (indicador `...` enquanto `isLoading`), L330-337 (posicionamento dos dois FABs para coexistência em `Parada.tsx` e outras telas), L340-347 (UX de rate limit 429: botão desabilitado; countdown opcional)

**Escopo:**
- Animação de entrada/saída do `ChatPanel` (fade ou slide suave)
- Indicador de digitação animado ("...") enquanto `isLoading === true`
- Verificar e ajustar posicionamento em `Parada.tsx` (e outras telas com `BotaoReportar`): coral à direita, teal à esquerda, sem sobreposição
- Rate limit 429: desabilitar o botão de envio enquanto a janela não liberar; countdown simples é opcional mas bem-vindo

**Pronto:** ☑

**Feito:**
- Animação: painel fica no DOM com transição `opacity + translate-y` de 200ms (entra deslizando para cima, sai para baixo).
- Indicador de digitação: 3 pontos com `animate-bounce` e delays escalonados (0/150/300ms) dentro de bolha assistant.
- Rate limit 429: estado `isRateLimited` + `setTimeout` de 60 s para liberar automaticamente; botão de envio desabilitado durante o cooldown.
- Posicionamento FAB: ajustado para `fixed bottom-20 left-4 z-50` (acima da `BottomTabBar` que ocupa ~56px no bottom). `BotaoReportar` permanece em `right-6 bottom-6` nas telas sem nav bar.
- Commits: `c488844` (polimento), `ca1386a` (fix widget posição + leaflet.heat).

---

## Resumo de progresso

| Fase | Tasks | Prontas |
|------|-------|---------|
| 1 — Backend | 1–4 | 4/4 |
| 2 — Frontend | 5–7 | 3/3 |
| 3 — Polimento | 8 | 1/1 |
| **Total** | **8** | **8/8** |
