import { Package, Truck, CheckCircle, ExternalLink } from "lucide-react";
import type { PacienteCompleto } from "@/hooks/usePatientData";

interface Props {
  paciente: PacienteCompleto;
}

const PASSOS_RECEBIMENTO = [
  { num: 1, icon: "📦", titulo: "Verifique a embalagem", desc: "Confira se está lacrada e sem avarias." },
  { num: 2, icon: "💊", titulo: "Confirme o medicamento", desc: "Leia o nome e a dosagem na caixa." },
  { num: 3, icon: "🌡️", titulo: "Temperatura", desc: "O produto estava na temperatura adequada durante o transporte?" },
  { num: 4, icon: "📷", titulo: "Tire as fotos", desc: "Fotografe a embalagem e o produto." },
  { num: 5, icon: "📤", titulo: "Envie para a clinica", desc: "Mande as fotos para a farmacêutica via WhatsApp." },
];

export default function MinhasRemessas({ paciente }: Props) {
  const remessas = [...(paciente.remessas ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="text-lg font-bold" style={{ color: "#1A1A2E" }}>
          Minhas Remessas
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
          {remessas.length} {remessas.length === 1 ? "entrega" : "entregas"} no total
        </p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {remessas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={40} style={{ color: "#E5E7EB" }} />
            <p className="text-sm mt-3" style={{ color: "#9CA3AF" }}>
              Nenhuma remessa ainda
            </p>
          </div>
        ) : (
          remessas.map((r) => {
            const entregue = r.status === "entregue";
            return (
              <div key={r.id} className="card-p p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: entregue ? "#D1FAE5" : "#DBEAFE" }}
                  >
                    {entregue ? (
                      <CheckCircle size={18} style={{ color: "#059669" }} />
                    ) : (
                      <Truck size={18} style={{ color: "#3B82F6" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                        {r.numero ? `NF ${r.numero}` : "Remessa"}
                      </p>
                      <span
                        className="pill-badge shrink-0"
                        style={
                          entregue
                            ? { background: "#D1FAE5", color: "#065F46" }
                            : { background: "#DBEAFE", color: "#1D4ED8" }
                        }
                      >
                        {entregue ? "Entregue" : "Em trânsito"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {r.codigo_rastreio && (
                  <div
                    className="rounded-xl px-3 py-2.5 mb-3"
                    style={{ background: "#F8F8FA", border: "1px solid #E5E7EB" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium mb-0.5" style={{ color: "#9CA3AF" }}>
                          Codigo de rastreio
                        </p>
                        <p className="text-sm font-bold font-mono" style={{ color: "#1A1A2E" }}>
                          {r.codigo_rastreio}
                        </p>
                        {r.previsao_entrega && (
                          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                            Previsão: {new Date(r.previsao_entrega).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <a
                        href={`https://www.correios.com.br/rastreamento#${r.codigo_rastreio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                        style={{ background: "#EFF6FF", color: "#2563EB" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                        Rastrear
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="card-p p-4 mt-2">
          <p className="text-sm font-bold mb-3" style={{ color: "#1A1A2E" }}>
            Como receber seu medicamento
          </p>
          <div className="flex flex-col gap-3">
            {PASSOS_RECEBIMENTO.map((passo) => (
              <div key={passo.num} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: "#FFF7ED" }}
                >
                  {passo.icon}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-semibold" style={{ color: "#1A1A2E" }}>
                    {passo.num}. {passo.titulo}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                    {passo.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-4">
          <a
            href="https://wa.me/5511999999999?text=Olá, tenho dúvidas sobre minha remessa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold"
            style={{ background: "#25D366", color: "#fff" }}
          >
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar com a clinica
          </a>
        </div>
      </div>
    </div>
  );
}
