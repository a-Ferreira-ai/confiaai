# Prompt de Execução — Chat Bot (Confia AI)

> Cole este prompt no Cursor (Plan mode / Composer Agent) e execute. Pode colar quantas vezes quiser até tudo estar pronto.

---

Você é um agente de implementação do projeto **Confia AI**.

## Passo 1 — Leia os documentos de referência

Leia agora, antes de fazer qualquer coisa:

1. `chat_bot.md` — especificação completa da feature de chat (arquitetura, services, controller, frontend, system prompt, edge cases)
2. `chat_bot_tasks.md` — lista de tasks enumeradas com status de progresso

Não pule esta etapa. O contexto técnico necessário para cada task está referenciado por número de linha nesses arquivos.

---

## Passo 2 — Avalie o progresso atual

No arquivo `chat_bot_tasks.md`, identifique:

- Quais tasks têm **Pronto: ☑** (concluídas — pule-as)
- Quais tasks têm **Pronto: ☐** (pendentes — candidatas ao próximo lote)
- Quais tasks têm **Pronto: ⊘** (bloqueadas — pule-as e documente o motivo se souber)

---

## Passo 3 — Selecione o lote de trabalho desta sessão

Escolha **entre 1 e 4 tasks pendentes** usando este critério:

| Tamanho da task | Quantas pegar |
|---|---|
| Tasks grandes e complexas (ex: `GrokClient`, `ChatContextBuilder`, `ChatController`) | **1 por vez** |
| Tasks de tamanho médio e relacionadas (ex: `ChatMessage` + `ChatPanel`) | **2 tasks** |
| Tasks pequenas ou de polimento | **3–4 tasks** |

**Regra de ouro:** prefira qualidade a volume. É melhor entregar 1 task perfeita do que 3 tasks com bugs ou sem aderir ao `chat_bot.md`. Se tiver dúvida, pegue menos.

Antes de implementar, anuncie quais tasks você vai atacar e por quê escolheu esse número.

---

## Passo 4 — Implemente

Para cada task selecionada:

1. Leia as linhas de `chat_bot.md` referenciadas no campo **Refs** da task
2. Implemente todos os arquivos listados no **Escopo** da task
3. Siga rigorosamente as convenções do projeto:
   - Backend Rails: `architecture.md` (convenções gerais) + `chat_bot.md` (específico do chat)
   - Frontend React/TS: mesma stack do restante do `frontend/` — sem libs externas desnecessárias
   - Nunca hardcode `GROK_API_KEY` nem `GROK_MODEL` — use `ENV.fetch`
   - O controller herda de `Api::V1::BaseController`; o endpoint é `POST /api/v1/chat`
4. Não implemente nada fora do **Escopo** descrito na task

---

## Passo 5 — Atualize `chat_bot_tasks.md`

Para cada task concluída nesta sessão:

- Altere `☐` para `☑` no campo **Pronto**
- Preencha o campo **Feito** com:
  - Arquivos criados ou modificados
  - Decisões técnicas tomadas (se houver)
  - Pendências ou limitações, se houver
- Atualize a linha correspondente no **Resumo de progresso** (incrementar o contador "Prontas")

---

## Passo 6 — Verifique se tudo terminou

Após atualizar o arquivo, some as tasks com `☑` no **Resumo de progresso**.

**Se o total for 8/8:**

> 🐔 Bók bók bók! Cluck cluck cluck!
> Todas as 8 tasks do chat bot estão concluídas!
> O widget de chat do Confia AI está pronto para demonstração. 🐔

**Se ainda houver tasks pendentes:**

Informe quais tasks ainda estão abertas (número + título) e diga que o usuário pode colar este prompt novamente para continuar na próxima sessão.
