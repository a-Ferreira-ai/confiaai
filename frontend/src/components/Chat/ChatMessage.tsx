type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

export function ChatMessage({ role, content, isError = false }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-teal text-white rounded-br-sm"
            : `bg-light text-darktxt rounded-bl-sm ${isError ? "border border-coral/50" : ""}`,
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}
