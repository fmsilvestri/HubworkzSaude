import { useState } from "react";
import { useListFaturas, useUpdateFatura, getListFaturasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  emitida: "bg-green-500/15 text-green-400 border-green-500/20",
  pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/20",
  paga: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const STATUS_ICONS: Record<string, any> = {
  emitida: CheckCircle,
  pendente: Clock,
  cancelada: AlertCircle,
  paga: CheckCircle,
};

export default function Faturamento() {
  const [filterStatus, setFilterStatus] = useState("all");
  const { data: faturas, isLoading } = useListFaturas({ status: filterStatus !== "all" ? filterStatus : undefined });
  const updateFatura = useUpdateFatura();
  const queryClient = useQueryClient();

  const produto = (faturas ?? []).filter((f) => f.tipo === "produto");
  const servico = (faturas ?? []).filter((f) => f.tipo === "servico");
  const totalProduto = produto.reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const totalServico = servico.reduce((s, f) => s + (Number(f.valor) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Faturamento</h1>
          <p className="text-white/50 text-sm mt-1">Notas fiscais de produto e serviço</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger data-testid="select-status-fatura" className="w-44 bg-[#1B1B1E] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="emitida">Emitida</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="paga">Paga</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-[#F56E0F]/15 rounded-xl flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#F56E0F]" />
            </div>
            <p className="text-white/60 text-sm">NF Produto</p>
          </div>
          <p className="text-white text-2xl font-bold">R$ {totalProduto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-white/40 text-xs mt-1">{produto.length} notas fiscais</p>
        </div>
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-white/60 text-sm">NF Serviço</p>
          </div>
          <p className="text-white text-2xl font-bold">R$ {totalServico.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-white/40 text-xs mt-1">{servico.length} notas fiscais</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span className="w-8">#</span>
          <span>Nota Fiscal</span>
          <span className="w-24 text-center">Tipo</span>
          <span className="w-32 text-right">Valor</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-28 text-center">Vencimento</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 bg-white/5" />)}</div>
        ) : (faturas ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          (faturas ?? []).map((f, idx) => {
            const StatusIcon = STATUS_ICONS[f.status] ?? Clock;
            return (
              <div key={f.id} data-testid={`row-fatura-${f.id}`} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                <span className="w-8 text-white/30 text-xs">{idx + 1}</span>
                <div>
                  <p className="text-white font-medium text-sm">{f.numero_nf ?? `NF-${f.id.slice(0,6)}`}</p>
                  <p className="text-white/40 text-xs">ID: {f.id.slice(0,8)}</p>
                </div>
                <div className="w-24 flex justify-center">
                  <Badge className={cn("text-xs border", f.tipo === "produto" ? "bg-orange-500/15 text-orange-400 border-orange-500/20" : "bg-blue-500/15 text-blue-400 border-blue-500/20")}>
                    {f.tipo}
                  </Badge>
                </div>
                <span className="w-32 text-right text-white font-medium">
                  {f.valor ? `R$ ${Number(f.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </span>
                <div className="w-28 flex justify-center">
                  <Badge className={cn("text-xs border gap-1", STATUS_COLORS[f.status] ?? "bg-white/10 text-white/50")}>
                    <StatusIcon className="h-3 w-3" />
                    {f.status}
                  </Badge>
                </div>
                <span className="w-28 text-center text-white/40 text-xs">
                  {f.data_vencimento ? new Date(f.data_vencimento).toLocaleDateString("pt-BR") : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
