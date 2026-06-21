import { useState, useCallback, useRef } from "react";
import { getDeviceToken } from "../../lib/deviceToken";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatState = {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
};

const TIMEOUT_MS = 15_000;

export function useChatStore() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isOpen: false,
    isLoading: false,
    error: null,
  });

  // Keep a ref so sendMessage always has access to the latest messages
  // without needing to be in its dependency array.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = state.messages;

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: "user", content };
    const messagesForApi: ChatMessage[] = [...messagesRef.current, userMessage];

    setState((prev) => ({
      ...prev,
      messages: messagesForApi,
      isLoading: true,
      error: null,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const headers = new Headers();
      headers.set("X-Device-Token", getDeviceToken());
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");

      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: messagesForApi }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}`;
        try {
          const body = (await response.json()) as { error?: string; message?: string };
          errorMessage = body.error ?? body.message ?? errorMessage;
        } catch {
          // ignore JSON parse errors — keep generic message
        }
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        return;
      }

      const data = (await response.json()) as { reply: string };
      const assistantMessage: ChatMessage = { role: "assistant", content: data.reply };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      const errorMessage = isTimeout
        ? "A resposta demorou demais. Tente novamente."
        : "Não foi possível enviar a mensagem. Tente novamente.";

      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const toggleOpen = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const clearConversation = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [], error: null }));
  }, []);

  return {
    messages: state.messages,
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    toggleOpen,
    clearConversation,
  };
}
