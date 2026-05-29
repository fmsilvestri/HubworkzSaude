import { CheckCircle, Circle } from "lucide-react";
import type { PacienteCompleto } from "@/hooks/usePatientData";

interface Props {
  paciente: PacienteCompleto;
}

const FASES = [
  {
    num: 1,
    label: "Solicitação",
    desc: "Seu pedido foi recebido e a documentação está sendo analisada pela equipe.",
  },
  {
    num: 2,
    label: "Cotação",
    desc: "Estamos buscando o melhor fornecedor para o seu medicamento.",
  },
  {
    num: 3,
    label: "Preparando entrega",
    desc: "Seu medicamento está sendo preparado e logo será enviado para você.",
  },
  {
    num: 4,
    label: "Acompanhamento",
    desc: "Seu tratamento está em andamento. A equipe está aqui para te apoiar!",
  },
  {
    num: 5,
    label: "Concluido",
    desc: "Seu ciclo de tratamento foi concluído com sucesso.",
  },
];

const FASE_DESCRICOES: Record<number, string> = {
  1: "Estamos verificando sua documentação. Fique tranquilo — a equipe cuidará de tudo!",
  2: "Estamos pesquisando o melhor fornecedor para garantir a qualidade e agilidade da entrega.",
  3: "Tudo certo! Seu medicamento está sendo preparado e em breve será despachado.",
  4: "Você já está recebendo o tratamento. Continue seguindo as orientações da equipe.",
  5: "Parabéns por completar este ciclo! A equipe está à disposição para o que precisar.",
};

export default function MeuProcesso({ paciente }: Props) {
  const processo = paciente.processo;
  const faseAtual = processo?.fase_atual ?? 1;

  return (
    <div>
      <div className="page-header">
        <h1 className="text-lg font-bold" style={{ color: "#1A1A2E" }}>
          Meu Processo
        </h1>
        {processo?.numero_protocolo && (
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Protocolo #{processo.numero_protocolo}
          </p>
        )}
      </div>

      <div className="px-4 pt-5 pb-4">
        <div className="card-p p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>
            Onde estou no processo?
          </p>
          <div className="flex items-start justify-between">
            {FASES.map((fase, idx) => {
              const done = fase.num < faseAtual;
              const active = fase.num === faseAtual;
              const upcoming = fase.num > faseAtual;
              return (
                <div key={fase.num} className="flex flex-col items-center flex-1 relative">
                  {idx < FASES.length - 1 && (
                    <div
                      className="absolute top-3.5 h-0.5"
                      style={{
                        left: "50%",
                        right: "-50%",
                        background: done ? "#F56E0F" : "#E5E7EB",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center relative z-10 shrink-0 mb-1.5"
                    style={
                      done
                        ? { background: "#F56E0F" }
                        : active
                        ? { background: "#fff", border: "2.5px solid #F56E0F" }
                        : { background: "#fff", border: "2px solid #E5E7EB" }
                    }
                  >
                    {done ? (
                      <CheckCircle size={14} color="#fff" fill="#F56E0F" strokeWidth={0} />
                    ) : active ? (
                      <div className="w-3 h-3 rounded-full" style={{ background: "#F56E0F" }} />
                    ) : (
                      <Circle size={12} style={{ color: "#D1D5DB" }} />
                    )}
                  </div>
                  <span
                    className="text-[9px] font-semibold text-center leading-tight"
                    style={{
                      color: done || active ? "#1A1A2E" : "#D1D5DB",
                      maxWidth: 52,
                    }}
                  >
                    {fase.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="card-p p-4 mb-4"
          style={{ background: "#FFF7ED", borderColor: "#FDBA74" }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: "#92400E" }}>
            O que está acontecendo agora
          </p>
          <p className="text-sm" style={{ color: "#B45309" }}>
            {FASE_DESCRICOES[faseAtual] ?? "Seu processo está em andamento."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {paciente.medicamento && (
            <div className="card-p p-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>
                Seus dados
              </p>
              <div className="flex flex-col gap-2.5">
                <div>
                  <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>Medicamento</p>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                    {paciente.medicamento.nome}
                  </p>
                </div>
                {paciente.convenio && (
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>Convênio</p>
                    <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                      {paciente.convenio}
                    </p>
                  </div>
                )}
                {processo?.created_at && (
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>Início</p>
                    <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                      {new Date(processo.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                {paciente.medicamento.via_administracao && (
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>Como tomar</p>
                    <p className="text-sm" style={{ color: "#374151" }}>
                      {paciente.medicamento.via_administracao}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {processo?.observacoes && (
            <div className="card-p p-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
                Proximos passos
              </p>
              <p className="text-sm" style={{ color: "#374151", lineHeight: 1.6 }}>
                {processo.observacoes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
