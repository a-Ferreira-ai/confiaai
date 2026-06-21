import { useRef, useEffect } from "react";
import { ChatPanel } from "./ChatPanel";
import { useChatStore } from "./useChatStore";

export default function ChatWidget() {
  const store = useChatStore();
  const { isOpen, toggleOpen } = store;
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const insidePanel = panelRef.current?.contains(target);
      const insideFab = fabRef.current?.contains(target);
      if (!insidePanel && !insideFab) {
        toggleOpen();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, toggleOpen]);

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-3">
      {/* Floating panel — kept in DOM for smooth transition */}
      <div
        ref={panelRef}
        className={`w-80 bg-white rounded-2xl shadow-2xl border border-tint flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ height: "420px" }}
        aria-hidden={!isOpen}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-tint bg-teal">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Assistente Confia AI</span>
          </div>
          <button
            type="button"
            onClick={toggleOpen}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Fechar chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Chat content */}
        <ChatPanel {...store} />
      </div>

      {/* FAB */}
      <button
        ref={fabRef}
        type="button"
        onClick={toggleOpen}
        className="w-14 h-14 rounded-full bg-teal text-white shadow-lg hover:shadow-xl hover:brightness-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente"}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
