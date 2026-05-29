import { useListFaturas } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  emitida: "bg-green-500/15 text-green-400 border-green-500/20",
  pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/20",
  paga: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function Pedidos() {
  const { data: faturas, isLoading } = useListFaturas();
  const total = (faturas ?? []).reduce((s, f) => s + (Number(f.valor) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos Consolidados</h1>
          <p className="text-white/50 text-sm mt-1">Todas as NFs — distribuidoras e importadora</p>
        </div>
        <div className="bg-[#1B1B1E] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-[#F56E0F]" />
          <div>
            <p className="text-white/40 text-xs">Total Consolidado</p>
            <p className="text-white font-bold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span>Nota Fiscal</span>
          <span className="w-24 text-center">Tipo</span>
          <span className="w-32 text-right pr-4">Valor</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-32 text-center">Emissão</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 bg-white/5" />)}</div>
        ) : (faturas ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhum pedido registrado</p>
          </div>
        ) : (
          (faturas ?? []).map((f) => (
            <div key={f.id} data-testid={`row-pedido-${f.id}`} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <div>
                <p className="text-white font-medium text-sm">{f.numero_nf ?? `NF-${f.id.slice(0,6)}`}</p>
                <p className="text-white/30 text-xs">{f.id.slice(0,12)}...</p>
              </div>
              <div className="w-24 flex justify-center">
                <Badge className={cn("text-xs border", f.tipo === "produto" ? "bg-orange-500/15 text-orange-400 border-orange-500/20" : "bg-blue-500/15 text-blue-400 border-blue-500/20")}>
                  {f.tipo}
                </Badge>
              </div>
              <span className="w-32 text-right pr-4 text-white font-medium text-sm">
                {f.valor ? `R$ ${Number(f.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
              </span>
              <div className="w-28 flex justify-center">
                <Badge className={cn("text-xs border", STATUS_COLORS[f.status] ?? "bg-white/10 text-white/50")}>{f.status}</Badge>
              </div>
              <span className="w-32 text-center text-white/40 text-xs">
                {f.data_emissao ? new Date(f.data_emissao).toLocaleDateString("pt-BR") : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
