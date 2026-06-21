# Prompt de Plan — Confia MVP

> **Como usar:** copie **todo o bloco abaixo** (de `---` a `---`) e cole no **modo Plan** do Cursor. Repita quantas vezes precisar até o MVP estar completo. Não edite o prompt entre execuções — o estado vem de `tasks.md` + código.

---

Você está no **modo Plan** do Cursor, planejando o **próximo lote de implementação** do MVP **Confia**.

## 1. Leitura obrigatória (nesta ordem)

1. **`architecture.md`** — referência canônica de arquitetura, stack, pastas, convenções e ordem de implementação. Em conflito técnico/estrutural com `SPEC.md`, **`architecture.md` prevalece**.
2. **`tasks.md`** — backlog com 24 tasks numeradas, refs por linha, campos **Pronto** (`☐` / `☑` / `⊘`) e **Feito**.
3. **`SPEC.md`** — somente quando a task listada ou suas refs apontarem para ele (escopo de produto, regras de negócio, fontes GTFS/metrô, UX).
4. **Código existente no repositório** — **não confie só nos checkboxes**. Inspecione arquivos, migrations, rotas, componentes e configs para saber o que já existe de fato.

## 2. Seu objetivo neste Plan

Escolher o **próximo lote** de trabalho (entre **1 e 4 tasks**, nunca mais) e produzir um **plano de implementação executável** para o modo Agent — sem implementar código agora.

O lote deve ser:

- **Coerente** — tasks relacionadas ou sequenciais na mesma fase, quando fizer sentido.
- **Seguro** — escopo que caiba numa sessão de Agent sem estourar contexto nem misturar domínios demais.
- **Respeitoso às dependências** — Fase 1 (tasks 1–6) antes de 7–9; backend de feature antes do frontend correspondente, salvo exceção óbvia (ex.: task 2 cedo no projeto); não pular fundação.

## 3. Como decidir quantas tasks (1–4)

Use esta heurística — **explique a escolha no plano**:

| Qtd | Quando usar |
|-----|-------------|
| **1** | Task grande, arriscada ou fundacional (ex.: scaffold Rails, migrations GTFS, import GTFS). Muitos arquivos novos ou decisões estruturais. |
| **2** | Par natural backend ↔ frontend da mesma feature, ou duas tasks pequenas e **estritamente** dependentes na mesma fase. |
| **3** | Três tasks pequenas/médias da **mesma fase**, baixo risco, refs sobrepostas, verificação simples. |
| **4** | **Teto absoluto.** Só se forem tasks **pequenas**, fortemente acopladas e na mesma fase (ex.: libs frontend + roteamento + um componente fino). Se houver dúvida, **reduza para 3 ou 2**. |

**Nunca:**

- Misturar fases distantes sem necessidade (ex.: Task 4 + Task 20).
- Agrupar “só para ir rápido” tasks que exigem domínios diferentes (API + ActionCable + mapa + seeds num lote).
- Incluir Task 24 (testes) no mesmo lote que features ainda não implementadas — testes vêm **depois** do código que cobrem.

## 4. Verificação de conclusão do MVP

Antes de planejar, calcule o progresso real:

1. Liste todas as tasks com **Pronto ≠ ☑** em `tasks.md`.
2. Para cada uma, confira no repo se já está implementada (se sim, anote que `tasks.md` está desatualizado — o Agent deve corrigir isso no fim do lote).
3. Se **todas as 24 tasks** estiverem **☑** (ou ⊘ canceladas com justificativa) **e** o código confirmar o escopo:

   **Pare aqui. Não produza plano de implementação.**

   Responda **somente** imitando uma galinha no chat — curto, divertido, em português. Ex.: *"có có có! 🐔 MVP Confia no ninho — 24/24, nada a planejar!"*

   Nada de seções, listas ou plano nesse caso.

## 5. Formato obrigatório do plano (quando ainda houver trabalho)

Quando existir trabalho pendente, entregue o plano nesta estrutura:

### A. Estado atual (breve)

- Progresso: `X/24` tasks ☑ (por fase, conforme tabela em `tasks.md`).
- O que já existe no código (bullets objetivos).
- Gaps ou divergências entre `tasks.md` e o repo.

### B. Lote escolhido

Para **cada task** selecionada:

- **ID e título** (ex.: Task 7 — Base da API).
- **Refs** — linhas de `architecture.md` (+ `SPEC.md` se aplicável); **leia-as antes de codar**.
- **Escopo** — copiar/resumir de `tasks.md`, sem inflar.
- **Arquivos** — criar/alterar (caminhos concretos alinhados à árvore do `architecture.md`).
- **Critérios de aceite** — checklist verificável (comandos, endpoints, arquivos presentes).
- **Fora de escopo** — o que **não** fazer nesta task (evitar creep).
- **Riscos / dependências** — o que pode bloquear ou o que já precisa existir.

Depois, uma subseção:

- **Por que N tasks neste lote?** — 2–4 frases justificando 1, 2, 3 ou 4 (heurística da seção 3).

### C. Ordem de execução

Passos numerados **dentro do lote** (o que fazer primeiro e por quê).

### D. Verificação pós-implementação

Comandos e checagens manuais após o Agent terminar, por task (ex.: `bin/dev`, `rails db:migrate`, `rspec`, smoke HTTP, página no Vite).

### E. Atualização de `tasks.md`

Instruir o Agent a, **ao concluir cada task do lote**:

1. Marcar **Pronto:** `☑`.
2. Preencher **Feito:** com resumo (arquivos tocados, decisões, pendências).
3. Atualizar a **tabela “Resumo de progresso”** no final de `tasks.md`.

## 6. Regras de qualidade do plano

- **Convenções do `architecture.md`:** services com `.call`, sem PostGIS (Haversine), Redis+Sidekiq (não Solid Queue/Cache/Cable), `Api::V1::`, device token anônimo, pt-BR, nomes de código em inglês.
- **Diff mínimo** — só o necessário para as tasks do lote; sem refactors colaterais.
- **Sem inventar escopo** — se `SPEC.md` não existir ainda, sinalize o bloqueio e proponha defaults mínimos **ou** reduza o lote.
- **Plano autocontido** — quem executar no Agent não deve precisar reler toda a arquitetura; as refs por task são suficientes se listadas.

## 7. O que NÃO fazer neste Plan

- Não escrever código nem criar arquivos.
- Não marcar tasks como ☑ (isso é trabalho do Agent após implementar).
- Não planejar mais de 4 tasks.
- Não replanejar tasks já ☑ salvo divergência grave código ↔ doc (nesse caso, proponha **só** correção da divergência).

---

**Comece agora:** leia os docs, audite o repo, decida o lote (1–4 tasks) ou solte a galinha se terminou.
