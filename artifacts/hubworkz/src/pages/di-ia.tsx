import { useState, useRef, useEffect } from "react";
import { useSendAiMessage, useGetAiHistory, getGetAiHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Quais processos estão na Fase 3 hoje?",
  "Analise as glosas pendentes com prazo próximo",
  "Resuma os monitoramentos D30 do mês atual",
  "Compare as últimas cotações registradas",
  "Pacientes sem monitoramento no mês",
];

export default function DiIA() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const { profile } = useAuth();
  const sendMessage = useSendAiMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: history, isLoading: historyLoading } = useGetAiHistory({ clinica_id: profile?.clinica_id ?? undefined, limit: 30 });

  useEffect(() => {
    if (history && messages.length === 0) {
      setMessages(history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })));
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    sendMessage.mutate({ data: { message: userMsg, clinica_id: profile?.clinica_id } }, {
      onSuccess: (data) => {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        queryClient.invalidateQueries({ queryKey: getGetAiHistoryQueryKey() });
      },
      onError: () => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
      },
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="hidden xl:flex flex-col w-72 bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-5">
        <div className="flex items-center gap-2">
          <img src="/di-avatar.png" alt="Di" className="h-8 w-8 rounded-full object-cover object-top border border-[#A5FFD6]/30" />
          <h2 className="text-white font-semibold">Di IA</h2>
        </div>
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-semibold">Sugestões rápidas</p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setInput(s)} className="w-full text-left text-sm text-white/60 hover:text-[#A5FFD6] hover:bg-[#3C3489]/20 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-[#3C3489]/30">
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <div className="bg-[rgba(63,52,137,0.3)] border border-[#3C3489]/40 rounded-xl p-4">
            <p className="text-[#A5FFD6] text-xs font-semibold mb-1">claude-sonnet-4-5</p>
            <p className="text-white/40 text-xs">Especialista em intermediação farmacêutica oncológica</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[rgba(63,52,137,0.15)]">
          <div className="relative shrink-0">
            <img
              src="/di-avatar.png"
              alt="Di"
              className="h-10 w-10 rounded-xl object-cover object-top border border-[#A5FFD6]/25 shadow-lg shadow-[#3C3489]/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#A5FFD6] border-2 border-[#1B1B1E] animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Di IA — Assistente Farmacêutico</h3>
            <p className="text-[#A5FFD6] text-xs">Especialista em intermediação oncológica</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {historyLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 bg-white/5" />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-5">
                <img
                  src="/di-avatar.png"
                  alt="Di"
                  className="h-24 w-24 rounded-2xl object-cover object-top border-2 border-[#A5FFD6]/30 shadow-2xl shadow-[#3C3489]/50"
                />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#A5FFD6] border-2 border-[#1B1B1E] animate-pulse" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Olá, sou a Di IA</h3>
              <p className="text-white/40 max-w-sm text-sm leading-relaxed">
                Sua assistente especialista em intermediação farmacêutica oncológica. Posso ajudar com análise de processos, cotações, monitoramento D30 e muito mais.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.slice(0, 3).map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs bg-[#3C3489]/20 border border-[#3C3489]/30 text-[#A5FFD6] px-3 py-1.5 rounded-full hover:bg-[#3C3489]/40 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-[#F56E0F]/20" : "bg-[rgba(63,52,137,0.6)]"
                )}>
                  {msg.role === "user" ? <User className="h-4 w-4 text-[#F56E0F]" /> : <Bot className="h-4 w-4 text-[#A5FFD6]" />}
                </div>
                <div className={cn("max-w-[75%] rounded-2xl px-5 py-3",
                  msg.role === "user"
                    ? "bg-[#F56E0F]/15 border border-[#F56E0F]/20 text-white"
                    : "bg-[rgba(63,52,137,0.3)] border border-[#3C3489]/40 text-white/90"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-[rgba(63,52,137,0.6)] flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#A5FFD6]" />
              </div>
              <div className="bg-[rgba(63,52,137,0.3)] border border-[#3C3489]/40 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 text-[#A5FFD6] animate-spin" />
                  <span className="text-white/50 text-sm">Di IA está pensando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-[#0F0F12]">
          <div className="flex gap-3 items-end">
            <Textarea
              data-testid="textarea-di-ia"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Pergunte à Di IA sobre processos, cotações, pacientes..."
              className="flex-1 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30 min-h-[48px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button data-testid="button-send-ai" onClick={handleSend} disabled={!input.trim() || sendMessage.isPending} className="bg-[#3C3489] hover:bg-[#3C3489]/80 text-[#A5FFD6] h-12 w-12 p-0 shrink-0 rounded-xl">
              {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-white/20 text-xs mt-2 text-center">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    </div>
  );
}
