# Prompt de Plan — Frontend Confia AI

> **Como usar:** copie **todo o bloco abaixo** (de `---` a `---`) e cole no **modo Plan** do Cursor. Repita quantas vezes precisar até o frontend estar completo. Não edite o prompt entre execuções — o estado vem de `frontend-tasks.md` + código.

---

Você está no **modo Plan** do Cursor, planejando o **próximo lote de implementação** do frontend **Confia AI**.

## 1. Leitura obrigatória (nesta ordem)

1. **`frontend.md`** — referência canônica de UX/telas, identidade visual e navegação. Em conflito de nomes de componentes/páginas ou decisões de UI, **`frontend.md` prevalece** sobre `architecture.md`.
2. **`frontend-tasks.md`** — backlog com 17 tasks numeradas, refs por linha, campos **Pronto** (`☐` / `☑` / `⊘`) e **Feito**.
3. **`architecture.md`** — somente quando a task listada ou suas refs apontarem para ele (stack frontend, pastas `frontend/src/`, proxy, libs, device token).
4. **`SPEC.md`** — somente quando a task ou suas refs apontarem para ele (escopo de produto, regras de negócio, casos de borda de UX).
5. **Código existente em `frontend/src/`** — **não confie só nos checkboxes**. Inspecione páginas, componentes, rotas, Tailwind e integrações com API para saber o que já existe de fato.

## 2. Seu objetivo neste Plan

Escolher o **próximo lote** de trabalho (entre **1 e 4 tasks**, nunca mais) e produzir um **plano de implementação executável** para o modo Agent — sem implementar código agora.

O lote deve ser:

- **Coerente** — tasks relacionadas ou sequenciais na mesma fase, quando fizer sentido.
- **Seguro** — escopo que caiba numa sessão de Agent sem estourar contexto nem misturar telas/domínios demais.
- **Respeitoso às dependências** — Fase 1 (tasks 1–3) antes de 4–7; Fase 2 antes da Fase 3; dentro da Fase 3, tasks 8–9 antes de 10–11; componentes transversais (4–7) antes das telas que os consomem; Task 17 (polimento) **por último**, só quando as demais estiverem ☑ ou claramente cobertas.

## 3. Como decidir quantas tasks (1–4)

Use esta heurística — **explique a escolha no plano**:

| Qtd | Quando usar |
|-----|-------------|
| **1** | Task grande ou fundacional (ex.: shell + tab bar, `Busca.tsx` completa, `Rota.tsx` com dois estados). Muitos arquivos, integração com mapa/API, ou decisões visuais que afetam várias telas. |
| **2** | Par natural de componente + tela que o usa, ou duas tasks pequenas **estritamente** dependentes na mesma fase (ex.: `FaixaConfianca` + `IndicadorOcupacao`). |
| **3** | Três tasks pequenas/médias da **mesma fase**, baixo risco, refs sobrepostas, verificação visual simples (ex.: tokens + shell + favoritos). |
| **4** | **Teto absoluto.** Só se forem tasks **pequenas**, fortemente acopladas e na mesma fase (ex.: três componentes transversais + um ajuste fino de tokens). Se houver dúvida, **reduza para 3 ou 2**. |

**Nunca:**

- Misturar fases distantes sem necessidade (ex.: Task 2 + Task 13).
- Agrupar “só para ir rápido” tasks que exigem contextos diferentes (mapa Leaflet + heatmap + formulário de reporte num lote).
- Incluir Task 17 no mesmo lote que features ainda não implementadas — polimento transversal vem **depois** das telas e componentes.
- Implementar itens da seção 6 de `frontend.md` (pagamento, AR, bike, edição de cadastro) — estão **fora de escopo**.

## 4. Verificação de conclusão do frontend

Antes de planejar, calcule o progresso real:

1. Liste todas as tasks com **Pronto ≠ ☑** em `frontend-tasks.md`.
2. Para cada uma, confira no repo se já está implementada (se sim, anote que `frontend-tasks.md` está desatualizado — o Agent deve corrigir isso no fim do lote).
3. Se **todas as 17 tasks** estiverem **☑** (ou ⊘ canceladas com justificativa) **e** o código confirmar o escopo de `frontend.md`:

   **Pare aqui. Não produza plano de implementação.**

   Responda **somente** imitando uma galinha no chat — curto, divertido, em português. Ex.: *"có có có! 🐔 Frontend Confia no ninho — 17/17, nada a planejar!"*

   Nada de seções, listas ou plano nesse caso.

## 5. Formato obrigatório do plano (quando ainda houver trabalho)

Quando existir trabalho pendente, entregue o plano nesta estrutura:

### A. Estado atual (breve)

- Progresso: `X/17` tasks ☑ (por fase, conforme tabela em `frontend-tasks.md`).
- O que já existe no código em `frontend/src/` (bullets objetivos).
- Gaps ou divergências entre `frontend-tasks.md` e o repo.

### B. Lote escolhido

Para **cada task** selecionada:

- **ID e título** (ex.: Task 4 — `FaixaConfianca.tsx`).
- **Refs** — linhas de `frontend.md` (+ `architecture.md` / `SPEC.md` se aplicável); **leia-as antes de codar**.
- **Escopo** — copiar/resumir de `frontend-tasks.md`, sem inflar.
- **Arquivos** — criar/alterar (caminhos concretos em `frontend/src/`, alinhados ao `architecture.md`).
- **Critérios de aceite** — checklist verificável (componente renderiza, cores batem com paleta, navegação funciona, smoke no Vite).
- **Fora de escopo** — o que **não** fazer nesta task (evitar creep).
- **Riscos / dependências** — API ainda não pronta, dados mock, ordem com outras tasks.

Depois, uma subseção:

- **Por que N tasks neste lote?** — 2–4 frases justificando 1, 2, 3 ou 4 (heurística da seção 3).

### C. Ordem de execução

Passos numerados **dentro do lote** (o que fazer primeiro e por quê).

### D. Verificação pós-implementação

Comandos e checagens manuais após o Agent terminar, por task (ex.: `npm run dev`, abrir rota no browser, inspecionar cores hex, tab bar, FAB fora da tab bar).

### E. Atualização de `frontend-tasks.md`

Instruir o Agent a, **ao concluir cada task do lote**:

1. Marcar **Pronto:** `☑`.
2. Preencher **Feito:** com resumo (arquivos tocados, decisões, pendências).
3. Atualizar a **tabela “Resumo de progresso”** no final de `frontend-tasks.md`.

## 6. Regras de qualidade do plano

- **Paleta canônica** — hex e papéis de cor conforme `frontend.md` L24-80 e L62-72; INK no header/tab bar, fundos claros (`paper`/`light`), coral só para segurança/desvio, âmbar só para ocupação.
- **Gramática Moovit-like** — bottom tab bar (4 abas), FAB de reporte **fora** da tab bar, mobile-first; não reinventar navegação fora do doc.
- **Convenções do `architecture.md`:** pastas em `frontend/src/{pages,components,lib}`, proxy para API, device token anônimo quando chamar backend, pt-BR na UI, nomes de código em inglês.
- **Diff mínimo** — só o necessário para as tasks do lote; sem refactors colaterais.
- **Sem inventar escopo** — se API ou dado não existir, sinalize e proponha mock/estado “sem dado” conforme `frontend.md` L267-269.
- **Plano autocontido** — quem executar no Agent não deve precisar reler todo o `frontend.md`; as refs por task são suficientes se listadas.

## 7. O que NÃO fazer neste Plan

- Não escrever código nem criar arquivos.
- Não marcar tasks como ☑ (isso é trabalho do Agent após implementar).
- Não planejar mais de 4 tasks.
- Não replanejar tasks já ☑ salvo divergência grave código ↔ doc (nesse caso, proponha **só** correção da divergência).

---

**Comece agora:** leia os docs, audite `frontend/src/`, decida o lote (1–4 tasks) ou solte a galinha se terminou.
