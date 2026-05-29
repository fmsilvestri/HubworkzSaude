import { useState, useRef, useEffect } from "react";
import { useSendAiMessage } from "@workspace/api-client-react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import type { PacienteCompleto } from "@/hooks/usePatientData";

const SUGESTOES = [
  "O que é meu medicamento?",
  "Como devo guardar em casa?",
  "Quando recebo o proximo?",
  "O que fazer se sentir algo diferente?",
];

interface Mensagem {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  paciente: PacienteCompleto;
}

export default function DiIA({ paciente }: Props) {
  const nomeFirst = paciente.nome.split(" ")[0] ?? paciente.nome;
  const [input, setInput] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [iniciou, setIniciou] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendAiMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviarMensagem(texto: string) {
    if (!texto.trim() || sendMessage.isPending) return;
    setIniciou(true);
    setInput("");

    setMensagens((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: texto },
    ]);

    const contexto = paciente.medicamento
      ? `Paciente: ${paciente.nome}. Medicamento: ${paciente.medicamento.nome}${paciente.medicamento.concentracao ? ` ${paciente.medicamento.concentracao}` : ""}.`
      : `Paciente: ${paciente.nome}.`;

    try {
      const result = await sendMessage.mutateAsync({
        data: {
          message: texto,
          context: `${contexto} Este é o app do paciente. Responda de forma simples, acolhedora e sem jargões técnicos. Nunca mencione dados de outros pacientes, valores financeiros, distribuidoras ou informações internas da clínica. Em caso de dúvidas médicas urgentes, oriente a buscar atendimento presencial.`,
        },
      });

      setMensagens((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: result.response },
      ]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Desculpe, não consegui responder agora. Tente novamente em instantes.",
        },
      ]);
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", maxWidth: 390, margin: "0 auto", background: "#F8F8FA" }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-12 pb-4 shrink-0"
        style={{ borderBottom: "1px solid #EBEBF0", background: "#fff" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#F0FFF9", border: "1.5px solid #A7F3D0" }}
        >
          <Sparkles size={18} style={{ color: "#059669" }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#065F46" }}>
            Di IA
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Sua assistente de saúde
          </p>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-none px-4 py-4"
        style={{ paddingBottom: 120 }}
      >
        {!iniciou ? (
          <div className="flex flex-col h-full">
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ background: "#F0FFF9", border: "1px solid #A7F3D0" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#D1FAE5" }}
                >
                  <Sparkles size={15} style={{ color: "#059669" }} />
                </div>
                <p className="text-sm" style={{ color: "#065F46", lineHeight: 1.6 }}>
                  Olá, <strong>{nomeFirst}</strong>! Sou a Di, sua assistente.
                  Posso responder dúvidas sobre seu medicamento e tratamento. Como posso ajudar?
                </p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>
              Perguntas frequentes
            </p>
            <div className="flex flex-col gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviarMensagem(s)}
                  className="w-full text-left rounded-xl px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E5E7EB",
                    color: "#374151",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="rounded-2xl p-4 mb-2"
              style={{ background: "#F0FFF9", border: "1px solid #A7F3D0" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#D1FAE5" }}
                >
                  <Sparkles size={13} style={{ color: "#059669" }} />
                </div>
                <p className="text-sm" style={{ color: "#065F46", lineHeight: 1.6 }}>
                  Olá, <strong>{nomeFirst}</strong>! Sou a Di, sua assistente.
                  Posso responder dúvidas sobre seu medicamento e tratamento.
                </p>
              </div>
            </div>

            {mensagens.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="chat-bubble-user">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="flex items-end gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                      style={{ background: "#D1FAE5" }}
                    >
                      <Sparkles size={11} style={{ color: "#059669" }} />
                    </div>
                    <div className="chat-bubble-ai">{m.content}</div>
                  </div>
                </div>
              )
            )}

            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                    style={{ background: "#D1FAE5" }}
                  >
                    <Sparkles size={11} style={{ color: "#059669" }} />
                  </div>
                  <div className="chat-bubble-ai flex items-center gap-1.5" style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#059669", animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#059669", animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#059669", animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div
              className="mt-2 p-3 rounded-xl text-xs"
              style={{ background: "#FEF3C7", color: "#78350F" }}
            >
              Em caso de emergência ou dúvidas médicas graves, procure sempre atendimento presencial com seu médico.
            </div>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 left-1/2"
        style={{
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 390,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(to top, #F8F8FA 80%, transparent)",
          borderTop: "1px solid #EBEBF0",
        }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: "#fff", border: "1.5px solid #E5E7EB" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensagem(input);
              }
            }}
            placeholder="Escreva sua dúvida..."
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none scrollbar-none"
            style={{ color: "#1A1A2E", maxHeight: 96, overflowY: "auto", lineHeight: 1.5, paddingTop: 4, paddingBottom: 4 }}
          />
          <button
            onClick={() => enviarMensagem(input)}
            disabled={!input.trim() || sendMessage.isPending}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5"
            style={{
              background: input.trim() && !sendMessage.isPending ? "#F56E0F" : "#F3F4F6",
              color: input.trim() && !sendMessage.isPending ? "#fff" : "#D1D5DB",
            }}
          >
            {sendMessage.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
