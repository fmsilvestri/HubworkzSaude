import { Phone, CheckCircle, Clock, Calendar } from "lucide-react";
import type { PacienteCompleto } from "@/hooks/usePatientData";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  paciente: PacienteCompleto;
}

const CANAL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  email: "E-mail",
  presencial: "Presencial",
};

export default function Consultas({ paciente }: Props) {
  const monitoramentos = [...(paciente.monitoramentos ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const realizados = monitoramentos.filter((m) => m.status === "realizado");
  const proximoAgendado = monitoramentos
    .filter((m) => m.status === "agendado" && m.data_contato)
    .map((m) => ({ ...m, date: new Date(m.data_contato!) }))
    .filter((m) => m.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  const proximoData = proximoAgendado?.date ?? addDays(new Date(), 30);

  return (
    <div>
      <div className="page-header">
        <h1 className="text-lg font-bold" style={{ color: "#1A1A2E" }}>
          Meus contatos com a farmacêutica
        </h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        <div
          className="card-p p-4"
          style={{ background: "#F0FFF9", borderColor: "#A7F3D0" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} style={{ color: "#059669" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#059669" }}>
              Proximo contato
            </p>
          </div>
          <p className="text-xl font-bold capitalize" style={{ color: "#065F46" }}>
            {format(proximoData, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-sm mt-1" style={{ color: "#047857" }}>
            A farmacêutica vai ligar ou enviar mensagem para saber como você está se sentindo. Fique tranquilo!
          </p>
        </div>

        <a
          href="https://wa.me/5511999999999?text=Olá! Gostaria de falar com a farmacêutica"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold"
          style={{ background: "#25D366", color: "#fff" }}
        >
          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Falar com a farmacêutica agora
        </a>

        {realizados.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>
              Contatos realizados
            </p>
            <div className="flex flex-col gap-2">
              {realizados.map((m) => (
                <div key={m.id} className="card-p px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#D1FAE5" }}
                    >
                      <CheckCircle size={16} style={{ color: "#059669" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {m.data_contato && (
                          <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                            {new Date(m.data_contato).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        {m.canal && (
                          <span
                            className="pill-badge"
                            style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                          >
                            {CANAL_LABELS[m.canal] ?? m.canal}
                          </span>
                        )}
                      </div>
                      {m.observacoes && (
                        <p className="text-sm" style={{ color: "#6B7280" }}>
                          {m.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {realizados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10">
            <Phone size={36} style={{ color: "#E5E7EB" }} />
            <p className="text-sm mt-3" style={{ color: "#9CA3AF" }}>
              Ainda não há contatos realizados
            </p>
            <p className="text-xs mt-1 text-center" style={{ color: "#D1D5DB" }}>
              O primeiro contato acontecerá em breve!
            </p>
          </div>
        )}

        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
        >
          <div className="flex items-start gap-2">
            <Clock size={15} style={{ color: "#92400E", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: "#78350F" }}>
              Em caso de dúvidas médicas ou emergências, procure sempre atendimento presencial com seu médico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
