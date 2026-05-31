import { useState, useRef, useEffect } from "react";
import { useGetAiHistory, useSendAiMessage } from "@workspace/api-client-react";
import { Send, Loader2 } from "lucide-react";

export default function DiIA() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const WELCOME_MSG = "Olá, tudo bem? Sou a Di e estou aqui para auxiliar na gestão e soluções para a clínica. Como posso ajudar hoje?";

  const { data: history, isLoading: historyLoading, refetch } = useGetAiHistory({ limit: 40 });
  const sendMessage = useSendAiMessage();

  const [localMessages, setLocalMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string }>
  >([]);

  useEffect(() => {
    if (history) {
      const loaded = history.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        created_at: m.created_at,
      }));
      setLocalMessages(
        loaded.length > 0
          ? loaded
          : [{ id: "welcome", role: "assistant", content: WELCOME_MSG, created_at: new Date().toISOString() }]
      );
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || sendMessage.isPending) return;
    setInput("");

    const tempId = `temp-${Date.now()}`;
    setLocalMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: msg, created_at: new Date().toISOString() },
    ]);

    try {
      const result = await sendMessage.mutateAsync({ data: { message: msg } });
      setLocalMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", content: result.response, created_at: new Date().toISOString() },
      ]);
      refetch();
    } catch {
      setLocalMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente.", created_at: new Date().toISOString() },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", maxWidth: 390, margin: "0 auto", background: "var(--t-bg)" }}
    >
      {/* Cabeçalho */}
      <div
        className="flex items-center gap-3 px-4 pt-12 pb-4 shrink-0"
        style={{ borderBottom: "1px solid var(--t-border)", background: "var(--t-bg)" }}
      >
        <div className="relative shrink-0">
          <img
            src="/di-avatar.png"
            alt="Di"
            className="w-11 h-11 rounded-xl object-cover object-top"
            style={{ border: "1.5px solid rgba(165,255,214,0.35)", boxShadow: "0 4px 14px rgba(60,52,137,0.45)" }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: "#A5FFD6", border: "2px solid var(--t-bg)" }}
          />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#A5FFD6" }}>
            Di IA
          </p>
          <p className="text-[11px]" style={{ color: "var(--t-text-5)" }}>
            Assistente farmaceutica oncologica
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4" style={{ paddingBottom: "120px" }}>
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--t-text-5)" }} />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-5">
              <img
                src="/di-avatar.png"
                alt="Di"
                className="w-28 h-28 rounded-3xl object-cover object-top"
                style={{
                  border: "2px solid rgba(165,255,214,0.35)",
                  boxShadow: "0 8px 32px rgba(60,52,137,0.55)",
                }}
              />
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full animate-pulse"
                style={{ background: "#A5FFD6", border: "2px solid var(--t-bg)" }}
              />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#A5FFD6" }}>
              Ola, tudo bem?
            </p>
            <p className="text-xs max-w-[260px]" style={{ color: "var(--t-text-5)" }}>
              Sou a Di e estou aqui para auxiliar na gestao e solucoes para a clinica. Como posso ajudar hoje?
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {localMessages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="chat-bubble-user">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="flex gap-2 items-end">
                    <img
                      src="/di-avatar.png"
                      alt="Di"
                      className="w-7 h-7 rounded-lg object-cover object-top shrink-0 mb-0.5"
                      style={{
                        border: "1px solid rgba(165,255,214,0.25)",
                        boxShadow: "0 2px 8px rgba(60,52,137,0.4)",
                      }}
                    />
                    <div className="chat-bubble-ai">{m.content}</div>
                  </div>
                </div>
              )
            )}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="flex gap-2 items-end">
                  <img
                    src="/di-avatar.png"
                    alt="Di"
                    className="w-7 h-7 rounded-lg object-cover object-top shrink-0 mb-0.5"
                    style={{
                      border: "1px solid rgba(165,255,214,0.25)",
                      boxShadow: "0 2px 8px rgba(60,52,137,0.4)",
                    }}
                  />
                  <div className="chat-bubble-ai flex items-center gap-1.5" style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#A5FFD6", animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#A5FFD6", animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#A5FFD6", animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 390,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(to top, var(--t-bg) 80%, transparent)",
          borderTop: "1px solid var(--t-border)",
        }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre processos, medicamentos..."
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none scrollbar-none"
            style={{ color: "var(--t-text-1)", maxHeight: 96, overflowY: "auto", lineHeight: "1.5", paddingTop: 4, paddingBottom: 4 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5"
            style={{
              background: input.trim() && !sendMessage.isPending ? "#F56E0F" : "var(--t-border)",
              color: input.trim() && !sendMessage.isPending ? "#fff" : "var(--t-text-5)",
            }}
          >
            {sendMessage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
