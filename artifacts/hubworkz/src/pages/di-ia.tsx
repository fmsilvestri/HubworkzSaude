import { useState, useRef, useEffect } from "react";
import { useSendAiMessage, useGetAiHistory, useClearAiHistory, getGetAiHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, User, Bot, BarChart2, Users, Pill, Package, FileText, AlertTriangle, DollarSign, Truck, Calendar, Activity, Layers, MessageSquare, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Suggestion groups ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Relatorio completo", msg: "Gere um relatório completo de todos os módulos com cards coloridos" },
  { label: "Panorama do sistema", msg: "Me dê um panorama geral do sistema hoje" },
  { label: "Alertas urgentes", msg: "Quais são os alertas críticos no momento?" },
  { label: "Processos ativos", msg: "Mostre os processos ativos por fase com análise" },
  { label: "Cotações pendentes", msg: "Liste as cotações pendentes de aprovação" },
  { label: "Pacientes e mandatos", msg: "Relatório de pacientes com mandatos pendentes" },
  { label: "Acompanhamento D30", msg: "Relatório de monitoramentos D30 agendados e realizados" },
  { label: "Agenda D30 (30 dias)", msg: "Qual a agenda de monitoramentos D30 dos próximos 30 dias?" },
  { label: "Financeiro do mês", msg: "Resumo financeiro do mês atual com análise" },
  { label: "Glosas abertas", msg: "Relatório de glosas abertas com valores e prazos" },
  { label: "Remessas em trânsito", msg: "Status das remessas em trânsito" },
  { label: "Comunicados recentes", msg: "Histórico de comunicados e atendimentos com pacientes" },
  { label: "Medicamentos cadastrados", msg: "Liste os medicamentos oncológicos cadastrados" },
  { label: "Distribuidoras ativas", msg: "Quais distribuidoras parceiras temos?" },
];

// ── Card color palette ─────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; border: string; accent: string; header: string }> = {
  orange:  { bg: "bg-[#F56E0F]/8",          border: "border-[#F56E0F]/30",  accent: "text-[#F56E0F]",   header: "bg-[#F56E0F]/15" },
  mint:    { bg: "bg-[#A5FFD6]/5",           border: "border-[#A5FFD6]/25",  accent: "text-[#A5FFD6]",   header: "bg-[#A5FFD6]/10" },
  blue:    { bg: "bg-blue-500/8",            border: "border-blue-500/30",   accent: "text-blue-400",    header: "bg-blue-500/15" },
  purple:  { bg: "bg-[rgba(63,52,137,0.2)]", border: "border-[#3C3489]/40",  accent: "text-[#A5FFD6]",   header: "bg-[rgba(63,52,137,0.3)]" },
  red:     { bg: "bg-red-500/8",             border: "border-red-500/30",    accent: "text-red-400",     header: "bg-red-500/15" },
  green:   { bg: "bg-emerald-500/8",         border: "border-emerald-500/30",accent: "text-emerald-400", header: "bg-emerald-500/15" },
};

const CARD_ICONS: Record<string, React.ElementType> = {
  orange: Activity,
  mint: Calendar,
  blue: Truck,
  purple: Layers,
  red: AlertTriangle,
  green: DollarSign,
};

// ── Card data renderer ────────────────────────────────────────────────────────

function renderValue(v: unknown, depth = 0): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-white/30 text-xs">—</span>;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return <span className="text-white/85 text-xs font-medium">{String(v)}</span>;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-white/30 text-xs">Nenhum registro</span>;
    return (
      <div className={cn("space-y-1.5", depth > 0 && "ml-2")}>
        {(v as unknown[]).slice(0, 8).map((item, i) => {
          if (typeof item === "object" && item !== null) {
            const row = item as Record<string, unknown>;
            const nome = row["nome"] ?? row["numero_nf"] ?? row["numero"] ?? `#${i + 1}`;
            const status = row["status"] ?? row["nf_status"] ?? row["mandato_status"];
            const extra = row["convenio"] ?? row["valor"] ?? row["data_contato"] ?? row["fase"];
            return (
              <div key={i} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                <span className="text-white/80 text-xs truncate max-w-[55%]">{String(nome)}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {extra != null && <span className="text-white/40 text-xs">{String(extra)}</span>}
                  {status != null && (
                    <span className="text-xs bg-white/10 rounded-md px-1.5 py-0.5 text-white/60">{String(status)}</span>
                  )}
                </div>
              </div>
            );
          }
          return <div key={i} className="text-white/70 text-xs bg-white/5 rounded-lg px-2.5 py-1.5">{String(item)}</div>;
        })}
        {(v as unknown[]).length > 8 && (
          <p className="text-white/30 text-xs text-center">+ {(v as unknown[]).length - 8} registros</p>
        )}
      </div>
    );
  }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return (
      <div className={cn("space-y-1", depth > 0 && "ml-2")}>
        {Object.entries(obj).map(([k, val]) => (
          <div key={k} className="flex items-start gap-2">
            <span className="text-white/40 text-xs min-w-0 capitalize">{k.replace(/_/g, " ")}:</span>
            <span className="flex-1 min-w-0">{renderValue(val, depth + 1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

interface DiCard {
  type: "card";
  title: string;
  color?: string;
  data: Record<string, unknown>;
}

function DiCardRenderer({ card }: { card: DiCard }) {
  const color = card.color ?? "purple";
  const palette = COLOR_MAP[color] ?? COLOR_MAP["purple"]!;
  const Icon = CARD_ICONS[color] ?? Activity;
  const dataEntries = Object.entries(card.data);

  // Separate scalar top-level stats from list/object entries
  const stats = dataEntries.filter(([, v]) => typeof v === "string" || typeof v === "number");
  const lists = dataEntries.filter(([, v]) => typeof v !== "string" && typeof v !== "number");

  return (
    <div className={cn("rounded-2xl border overflow-hidden my-1", palette.bg, palette.border)}>
      {/* Header */}
      <div className={cn("flex items-center gap-2.5 px-4 py-3", palette.header)}>
        <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <Icon className={cn("h-3.5 w-3.5", palette.accent)} />
        </div>
        <h4 className={cn("font-semibold text-sm", palette.accent)}>{card.title}</h4>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Stat pills */}
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stats.map(([k, v]) => (
              <div key={k} className="bg-white/8 border border-white/10 rounded-xl px-3 py-2 min-w-[90px]">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">{k.replace(/_/g, " ")}</p>
                <p className={cn("font-bold text-sm", palette.accent)}>{String(v)}</p>
              </div>
            ))}
          </div>
        )}

        {/* List/object sections */}
        {lists.map(([k, v]) => (
          <div key={k}>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">{k.replace(/_/g, " ")}</p>
            {renderValue(v, 0)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Message parser ────────────────────────────────────────────────────────────

type MessagePart =
  | { kind: "text"; content: string }
  | { kind: "card"; card: DiCard };

function parseMessageParts(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const lines = content.split("\n");
  let textBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{") && trimmed.includes('"type"') && trimmed.includes('"card"')) {
      try {
        const parsed = JSON.parse(trimmed) as DiCard;
        if (parsed.type === "card" && parsed.title && parsed.data) {
          if (textBuffer.length > 0) {
            const t = textBuffer.join("\n").trim();
            if (t) parts.push({ kind: "text", content: t });
            textBuffer = [];
          }
          parts.push({ kind: "card", card: parsed });
          continue;
        }
      } catch {
        // not a valid card JSON — fall through to text
      }
    }
    textBuffer.push(line);
  }

  if (textBuffer.length > 0) {
    const t = textBuffer.join("\n").trim();
    if (t) parts.push({ kind: "text", content: t });
  }

  return parts;
}

// ── Main component ────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cards?: DiCard[];
}

export default function DiIA() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { profile } = useAuth();
  const sendMessage = useSendAiMessage();
  const clearHistory = useClearAiHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const WELCOME_MSG = "Olá, tudo bem? Sou a Di e estou aqui para auxiliar na gestão e soluções para a clínica. Como posso ajudar hoje?";

  const { data: history, isLoading: historyLoading } = useGetAiHistory({
    clinica_id: profile?.clinica_id ?? undefined,
    limit: 30,
  });

  useEffect(() => {
    if (history && messages.length === 0) {
      const loaded = history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content }));
      setMessages([{ role: "assistant", content: WELCOME_MSG }, ...loaded]);
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    const params = profile?.clinica_id ? { clinica_id: profile.clinica_id } : undefined;
    await clearHistory.mutateAsync({ params });
    setMessages([{ role: "assistant", content: WELCOME_MSG }]);
    queryClient.invalidateQueries({ queryKey: getGetAiHistoryQueryKey() });
  };

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sendMessage.isPending) return;
    if (!text) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    sendMessage.mutate(
      { data: { message: msg, clinica_id: profile?.clinica_id } },
      {
        onSuccess: (data) => {
          const cards = (data as unknown as { cards?: DiCard[] }).cards ?? [];
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.response, cards: cards.length > 0 ? cards : undefined },
          ]);
          queryClient.invalidateQueries({ queryKey: getGetAiHistoryQueryKey() });
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
        },
      }
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="hidden xl:flex flex-col w-72 bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-4 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 pb-3 border-b border-white/8">
          <div className="relative">
            <img
              src="/di-avatar.png"
              alt="Di"
              className="h-28 w-28 rounded-2xl object-cover object-top border-2 border-[#A5FFD6]/30 shadow-xl shadow-[#3C3489]/40"
            />
            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-[#A5FFD6] border-2 border-[#1B1B1E] animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-semibold text-sm">Di IA</h2>
            <p className="text-[#A5FFD6] text-[11px] mt-0.5">Assistente Farmaceutica</p>
          </div>
        </div>

        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-semibold">Consultas rapidas</p>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSend(s.msg)}
                disabled={sendMessage.isPending}
                className="w-full text-left text-xs text-white/60 hover:text-[#A5FFD6] hover:bg-[#3C3489]/20 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-[#3C3489]/30 disabled:opacity-40"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Module coverage badge */}
        <div className="mt-auto space-y-2">
          <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Modulos integrados</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { icon: Activity, label: "Processos" },
              { icon: FileText, label: "Cotacoes" },
              { icon: Users, label: "Pacientes" },
              { icon: Pill, label: "Medicamentos" },
              { icon: Package, label: "Mandatos" },
              { icon: Truck, label: "Remessas" },
              { icon: DollarSign, label: "Financeiro" },
              { icon: AlertTriangle, label: "Glosas" },
              { icon: Calendar, label: "D30" },
              { icon: ClipboardList, label: "Monitoramentos" },
              { icon: MessageSquare, label: "Comunicados" },
              { icon: BarChart2, label: "Dashboard" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-md px-1.5 py-1">
                <Icon className="h-2.5 w-2.5 text-[#A5FFD6]" />
                <span className="text-white/40 text-[10px]">{label}</span>
              </div>
            ))}
          </div>
          <div className="bg-[rgba(63,52,137,0.3)] border border-[#3C3489]/40 rounded-xl p-3 mt-2">
            <p className="text-[#A5FFD6] text-xs font-semibold mb-0.5">claude-sonnet-4-6</p>
            <p className="text-white/40 text-xs">Especialista em intermediacao farmaceutica oncologica</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-[rgba(63,52,137,0.15)]">
          <div className="relative shrink-0">
            <img
              src="/di-avatar.png"
              alt="Di"
              className="h-16 w-16 rounded-2xl object-cover object-top border-2 border-[#A5FFD6]/30 shadow-xl shadow-[#3C3489]/50"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#A5FFD6] border-2 border-[#1B1B1E] animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Di IA — Assistente Farmaceutica</h3>
            <p className="text-[#A5FFD6] text-xs mt-0.5">Integrada a todos os modulos · claude-sonnet-4-6</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              disabled={clearHistory.isPending}
              className="text-[#F56E0F]/70 hover:text-[#F56E0F] hover:bg-[#F56E0F]/10 text-xs border border-[#F56E0F]/20 hover:border-[#F56E0F]/40 px-3 h-8"
            >
              {clearHistory.isPending ? "Limpando..." : "Nova conversa"}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 bg-white/5" />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-6">
                <img
                  src="/di-avatar.png"
                  alt="Di"
                  className="h-44 w-44 rounded-3xl object-cover object-top border-2 border-[#A5FFD6]/35 shadow-2xl shadow-[#3C3489]/60"
                />
                <span className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#A5FFD6] border-2 border-[#1B1B1E] animate-pulse" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Ola, tudo bem?</h3>
              <p className="text-white/40 max-w-sm text-sm leading-relaxed mb-6">
                Sou a Di e estou aqui para auxiliar na gestao e solucoes para a clinica. Como posso ajudar hoje?
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.msg)}
                    className="text-xs bg-[#3C3489]/20 border border-[#3C3489]/30 text-[#A5FFD6] px-3 py-1.5 rounded-full hover:bg-[#3C3489]/40 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              if (msg.role === "user") {
                return (
                  <div key={idx} className="flex gap-3 flex-row-reverse">
                    <div className="h-8 w-8 rounded-xl bg-[#F56E0F]/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-[#F56E0F]" />
                    </div>
                    <div className="max-w-[72%] rounded-2xl px-5 py-3 bg-[#F56E0F]/15 border border-[#F56E0F]/20 text-white">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              // Assistant message — prefer msg.cards, fallback to parse from text
              const cards: DiCard[] = msg.cards && msg.cards.length > 0 ? msg.cards : [];
              const textParts = parseMessageParts(msg.content).filter((p) => p.kind === "text");
              return (
                <div key={idx} className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <img
                      src="/di-avatar.png"
                      alt="Di"
                      className="h-10 w-10 rounded-xl object-cover object-top border border-[#A5FFD6]/25 shadow-md shadow-[#3C3489]/30"
                    />
                  </div>
                  <div className="flex-1 max-w-[88%] space-y-3">
                    {/* Cards from tool results */}
                    {cards.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {cards.map((card, ci) => (
                          <DiCardRenderer key={ci} card={card} />
                        ))}
                      </div>
                    )}
                    {/* Text analysis */}
                    {textParts.map((part, pi) => {
                      const cleanText = part.content.trim();
                      if (!cleanText) return null;
                      return (
                        <div key={pi} className="rounded-2xl px-5 py-3 bg-[rgba(63,52,137,0.3)] border border-[#3C3489]/40 text-white/90">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanText}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="shrink-0">
                <img
                  src="/di-avatar.png"
                  alt="Di"
                  className="h-10 w-10 rounded-xl object-cover object-top border border-[#A5FFD6]/25"
                />
              </div>
              <div className="bg-[rgba(63,52,137,0.3)] border border-[#3C3489]/40 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 text-[#A5FFD6] animate-spin" />
                  <span className="text-white/50 text-sm">Di IA esta analisando os dados...</span>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Pergunte sobre qualquer modulo: processos, cotacoes, pacientes, financeiro..."
              className="flex-1 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30 min-h-[48px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              data-testid="button-send-ai"
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMessage.isPending}
              className="bg-[#3C3489] hover:bg-[#3C3489]/80 text-[#A5FFD6] h-12 w-12 p-0 shrink-0 rounded-xl"
            >
              {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-white/20 text-xs mt-2 text-center">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    </div>
  );
}
