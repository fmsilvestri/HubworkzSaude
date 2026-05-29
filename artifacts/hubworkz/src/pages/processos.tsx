import { useState } from "react";
import { useListProcessos, useGetProcessoFaseStats, useUpdateProcesso, getListProcessosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, FileText, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  ativo: "bg-green-500/15 text-green-400 border-green-500/20",
  pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  concluido: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  cancelado: "bg-red-500/15 text-red-400 border-red-500/20",
};

const FASES = [
  { n: 1, label: "Solicitação e Cotação" },
  { n: 2, label: "Aquisição e Logística" },
  { n: 3, label: "Farmácia Clínica" },
  { n: 4, label: "Faturamento" },
];

function FaseStepper({ atual }: { atual: number }) {
  return (
    <div className="flex items-center gap-1">
      {FASES.map((f, i) => (
        <div key={f.n} className="flex items-center">
          <div className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
            f.n < atual ? "bg-[#F56E0F] text-white" :
            f.n === atual ? "bg-[#F56E0F]/30 text-[#F56E0F] border border-[#F56E0F]" :
            "bg-white/10 text-white/30"
          )}>
            {f.n < atual ? <CheckCircle2 className="h-3.5 w-3.5" /> : f.n}
          </div>
          {i < FASES.length - 1 && (
            <div className={cn("h-px w-4", f.n < atual ? "bg-[#F56E0F]" : "bg-white/10")} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Processos() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFase, setFilterFase] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const params = {
    ...(filterStatus !== "all" ? { status: filterStatus } : {}),
    ...(filterFase !== "all" ? { fase: filterFase } : {}),
  };

  const { data: processos, isLoading } = useListProcessos(params);
  const { data: faseStats } = useGetProcessoFaseStats();
  const updateProcesso = useUpdateProcesso();
  const queryClient = useQueryClient();

  const filtered = (processos ?? []).filter((p) =>
    search === "" ||
    p.numero_protocolo?.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = (processos ?? []).find((p) => p.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Processos</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie o fluxo completo de 4 fases</p>
        </div>
        <div className="flex gap-3 text-sm">
          {(faseStats ?? []).map((f) => (
            <div key={f.fase} className="bg-[#1B1B1E] border border-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-white font-bold">{f.count}</p>
              <p className="text-white/40 text-xs">{f.fase}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input data-testid="input-search-processos" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por protocolo..." className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger data-testid="select-status-processos" className="w-44 bg-[#1B1B1E] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFase} onValueChange={setFilterFase}>
          <SelectTrigger data-testid="select-fase-processos" className="w-36 bg-[#1B1B1E] border-white/10 text-white">
            <SelectValue placeholder="Fase" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="all">Todas as Fases</SelectItem>
            {FASES.map((f) => <SelectItem key={f.n} value={String(f.n)}>Fase {f.n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span>Processo</span>
          <span className="w-32 text-center">Fase</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-32 text-center">Criado em</span>
          <span className="w-8" />
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 bg-white/5" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhum processo encontrado</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} data-testid={`row-processo-${p.id}`} onClick={() => setSelectedId(p.id)} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
              <div>
                <p className="text-white font-medium text-sm">{p.numero_protocolo ?? `#${p.id.slice(0, 8)}`}</p>
                <p className="text-white/40 text-xs mt-0.5">ID: {p.id.slice(0, 8)}...</p>
              </div>
              <div className="w-32 flex justify-center"><FaseStepper atual={p.fase_atual} /></div>
              <div className="w-28 flex justify-center">
                <Badge className={cn("text-xs border", STATUS_COLORS[p.status] ?? "bg-white/10 text-white/60")}>{p.status}</Badge>
              </div>
              <span className="w-32 text-center text-white/40 text-xs">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
              <ChevronRight className="w-8 h-4 text-white/30" />
            </div>
          ))
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[500px] sm:max-w-[500px]">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white text-lg">{selected.numero_protocolo ?? `Processo ${selected.id.slice(0,8)}`}</SheetTitle>
                <Badge className={cn("w-fit border", STATUS_COLORS[selected.status] ?? "bg-white/10")}>{selected.status}</Badge>
              </SheetHeader>
              <div className="space-y-6">
                {/* Stepper */}
                <div className="bg-[#0F0F12] rounded-xl p-5">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Progresso do Processo</p>
                  <div className="space-y-4">
                    {FASES.map((f) => (
                      <div key={f.n} className="flex items-center gap-4">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                          f.n < selected.fase_atual ? "bg-[#F56E0F] text-white" :
                          f.n === selected.fase_atual ? "bg-[#F56E0F]/20 text-[#F56E0F] border-2 border-[#F56E0F]" :
                          "bg-white/10 text-white/30 border border-white/10"
                        )}>
                          {f.n < selected.fase_atual ? <CheckCircle2 className="h-4 w-4" /> : f.n < selected.fase_atual ? <Circle className="h-4 w-4" /> : f.n}
                        </div>
                        <div className="flex-1">
                          <p className={cn("text-sm font-medium", f.n <= selected.fase_atual ? "text-white" : "text-white/30")}>Fase {f.n}</p>
                          <p className={cn("text-xs", f.n <= selected.fase_atual ? "text-white/50" : "text-white/20")}>{f.label}</p>
                        </div>
                        {f.n === selected.fase_atual && <Badge className="bg-[#F56E0F]/20 text-[#F56E0F] border-[#F56E0F]/30 text-xs">Atual</Badge>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-[#0F0F12] rounded-xl p-5">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Detalhes</p>
                  {[
                    { label: "ID", value: selected.id.slice(0,16) + "..." },
                    { label: "Protocolo", value: selected.numero_protocolo ?? "—" },
                    { label: "Criado em", value: new Date(selected.created_at).toLocaleDateString("pt-BR") },
                    { label: "Observações", value: selected.observacoes ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start">
                      <span className="text-white/40 text-sm">{label}</span>
                      <span className="text-white text-sm text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  {selected.fase_atual < 4 && (
                    <Button data-testid="button-advance-fase" className="flex-1 bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" onClick={() => {
                      updateProcesso.mutate({ id: selected.id, data: { fase_atual: selected.fase_atual + 1 } }, {
                        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProcessosQueryKey() }); setSelectedId(null); }
                      });
                    }}>
                      Avançar para Fase {selected.fase_atual + 1}
                    </Button>
                  )}
                  <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5" onClick={() => setSelectedId(null)}>Fechar</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
