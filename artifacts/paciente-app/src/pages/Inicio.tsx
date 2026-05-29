import { Link } from "wouter";
import { Pill, Calendar, Sparkles, MessageCircle, LogOut } from "lucide-react";
import type { PacienteCompleto } from "@/hooks/usePatientData";
import { signOut } from "@/hooks/useAuth";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  paciente: PacienteCompleto;
}

function proximoD30(monitoramentos: PacienteCompleto["monitoramentos"]): Date | null {
  if (!monitoramentos?.length) return addDays(new Date(), 30);
  const agendados = monitoramentos.filter((m) => m.status === "agendado" && m.data_contato);
  if (!agendados.length) return addDays(new Date(), 30);
  const sorted = agendados
    .map((m) => new Date(m.data_contato!))
    .filter((d) => d > new Date())
    .sort((a, b) => a.getTime() - b.getTime());
  return sorted[0] ?? addDays(new Date(), 30);
}

export default function Inicio({ paciente }: Props) {
  const nomeFirst = paciente.nome.split(" ")[0] ?? paciente.nome;
  const proximoContato = proximoD30(paciente.monitoramentos);
  const medicamento = paciente.medicamento;

  const ultimaRemessa = [...(paciente.remessas ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="px-4 pt-14 pb-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Bom dia,</p>
          <h1 className="text-xl font-bold capitalize" style={{ color: "#1A1A2E" }}>
            {nomeFirst}!
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            Como está se sentindo hoje?
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-9 h-9 rounded-full flex items-center justify-center mt-1"
          style={{ background: "#F3F4F6" }}
        >
          <LogOut size={15} style={{ color: "#9CA3AF" }} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {medicamento && (
          <div className="card-p p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#FFF7ED" }}
              >
                <Pill size={16} style={{ color: "#F56E0F" }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                Meu medicamento
              </p>
            </div>
            <p className="text-base font-bold" style={{ color: "#1A1A2E" }}>
              {medicamento.nome}
            </p>
            {medicamento.concentracao && (
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                {medicamento.concentracao}
              </p>
            )}
            {medicamento.conservacao && (
              <div
                className="mt-2 rounded-lg px-3 py-2 text-sm"
                style={{ background: "#F0FFF9", color: "#065F46" }}
              >
                Conservar: {medicamento.conservacao}
              </div>
            )}
          </div>
        )}

        {proximoContato && (
          <div className="card-p p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#F0FFF9" }}
              >
                <Calendar size={16} style={{ color: "#059669" }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                Proximo contato D30
              </p>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#059669" }}>
              {format(proximoContato, "dd 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              A farmacêutica vai entrar em contato para saber como você está. Fique atento ao seu telefone!
            </p>
          </div>
        )}

        <Link href="/di-ia">
          <div
            className="card-p p-4 cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)", borderColor: "#FDBA74" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#F56E0F" }}
                >
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#7C2D12" }}>
                    Tem dúvidas sobre seu tratamento?
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9A3412" }}>
                    A Di está aqui para ajudar
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "#F56E0F", color: "#fff" }}
              >
                Perguntar
              </span>
            </div>
          </div>
        </Link>

        {ultimaRemessa && (
          <div className="card-p p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#EFF6FF" }}
              >
                <MessageCircle size={16} style={{ color: "#3B82F6" }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                Ultima remessa
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                {ultimaRemessa.numero && (
                  <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                    NF {ultimaRemessa.numero}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  {new Date(ultimaRemessa.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {ultimaRemessa.status && (
                <span
                  className="pill-badge"
                  style={
                    ultimaRemessa.status === "entregue"
                      ? { background: "#D1FAE5", color: "#065F46" }
                      : { background: "#FEF3C7", color: "#92400E" }
                  }
                >
                  {ultimaRemessa.status === "entregue" ? "Entregue" : "Em trânsito"}
                </span>
              )}
            </div>
            {ultimaRemessa.previsao_entrega && (
              <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
                Previsão: {new Date(ultimaRemessa.previsao_entrega).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
