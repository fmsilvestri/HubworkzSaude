import { useAuth } from "@/hooks/useAuth";
import { useListProcessos, useListMonitoramentos } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, Package, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PacientePortal() {
  const { profile } = useAuth();
  const { data: processos, isLoading: processosLoading } = useListProcessos();
  const { data: monitoramentos, isLoading: monitoramentosLoading } = useListMonitoramentos();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-[#F56E0F]/15 rounded-2xl flex items-center justify-center">
          <User className="h-7 w-7 text-[#F56E0F]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{profile?.nome ?? "Paciente"}</h1>
          <p className="text-white/50 text-sm">Portal do Paciente — HubWorkz Saúde</p>
        </div>
      </div>

      {/* Processos */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Package className="h-4 w-4 text-[#F56E0F]" />
          <h3 className="text-white font-semibold">Meus Processos</h3>
        </div>
        {processosLoading ? (
          <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 bg-white/5" />)}</div>
        ) : (processos ?? []).length === 0 ? (
          <p className="text-white/30 text-sm text-center py-6">Nenhum processo registrado</p>
        ) : (
          <div className="space-y-3">
            {(processos ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-[#0F0F12] rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{p.numero_protocolo ?? `Processo ${p.id.slice(0,8)}`}</p>
                  <p className="text-white/40 text-xs mt-0.5">Fase {p.fase_atual} de 4</p>
                </div>
                <Badge className={cn("border text-xs",
                  p.status === "ativo" ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                )}>{p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monitoramentos */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="h-4 w-4 text-[#F56E0F]" />
          <h3 className="text-white font-semibold">Histórico de Contatos D30</h3>
        </div>
        {monitoramentosLoading ? (
          <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 bg-white/5" />)}</div>
        ) : (monitoramentos ?? []).length === 0 ? (
          <p className="text-white/30 text-sm text-center py-6">Nenhum contato registrado</p>
        ) : (
          <div className="space-y-2">
            {(monitoramentos ?? []).slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-[#0F0F12] rounded-xl px-4 py-3">
                <p className="text-white/70 text-sm">{m.data_contato ? new Date(m.data_contato).toLocaleDateString("pt-BR") : "—"}</p>
                <Badge className={cn("border text-xs",
                  m.adesao === "total" ? "bg-green-500/15 text-green-400 border-green-500/20" :
                  m.adesao === "parcial" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" :
                  "bg-white/10 text-white/50 border-white/10"
                )}>{m.adesao ?? "—"}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
