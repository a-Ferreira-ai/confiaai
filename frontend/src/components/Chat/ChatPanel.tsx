import { useRef, useEffect, useState, type FormEvent } from "react";
import { ChatMessage } from "./ChatMessage";
import type { useChatStore } from "./useChatStore";

const WELCOME_MESSAGE =
  'Olá! Sou o assistente do Confia AI. 👋\nPosso te ajudar com horários, ocupação e segurança das paradas do corredor de demonstração.\nMe pergunte algo como: "Que horas devo sair pra pegar o ônibus às 8h?" ou "Essa linha vem lotada de manhã?"';

type ChatPanelProps = ReturnType<typeof useChatStore>;

export function ChatPanel({
  messages,
  isLoading,
  isRateLimited,
  error,
  sendMessage,
  clearConversation,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading || isRateLimited) return;
    setInputValue("");
    await sendMessage(text);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted whitespace-pre-line leading-relaxed">
            {WELCOME_MESSAGE}
          </p>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
          </>
        )}

        {error !== null && (
          <ChatMessage role="assistant" content={error} isError={true} />
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F1F6F7] px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Clear conversation */}
      {messages.length > 0 && (
        <div className="px-4 pb-1 flex justify-end">
          <button
            type="button"
            onClick={clearConversation}
            className="text-xs text-muted hover:text-darktxt transition-colors"
          >
            Limpar conversa
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-tint"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Digite sua pergunta…"
          className="flex-1 text-sm bg-light rounded-full px-4 py-2 text-darktxt placeholder:text-muted outline-none focus:ring-2 focus:ring-teal/30"
        />
        <button
          type="submit"
          disabled={isLoading || isRateLimited || inputValue.trim() === ""}
          className="bg-teal text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          aria-label="Enviar mensagem"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
