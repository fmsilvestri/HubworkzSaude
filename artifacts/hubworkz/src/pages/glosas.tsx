import { useState } from "react";
import { useListGlosas, useUpdateGlosa, getListGlosasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({ recurso_texto: z.string().min(10, "Descreva o recurso") });

export default function Glosas() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: glosas, isLoading } = useListGlosas();
  const updateGlosa = useUpdateGlosa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { recurso_texto: "" },
  });

  const selected = (glosas ?? []).find((g) => g.id === selectedId);

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (!selectedId) return;
    updateGlosa.mutate({ id: selectedId, data: { status: "em_recurso", recurso_texto: values.recurso_texto } }, {
      onSuccess: () => {
        toast({ title: "Recurso enviado com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getListGlosasQueryKey() });
        setSelectedId(null);
        form.reset();
      },
      onError: () => toast({ title: "Erro ao enviar recurso", variant: "destructive" }),
    });
  };

  const statusColor = (s: string) => ({
    pendente: "bg-red-500/15 text-red-400 border-red-500/20",
    em_recurso: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    resolvida: "bg-green-500/15 text-green-400 border-green-500/20",
  }[s] ?? "bg-white/10 text-white/50");

  const prazoUrgente = (prazo: string | null | undefined) => {
    if (!prazo) return false;
    const days = Math.ceil((new Date(prazo).getTime() - Date.now()) / 86400000);
    return days <= 7;
  };

  const pendentes = (glosas ?? []).filter((g) => g.status === "pendente");
  const outros = (glosas ?? []).filter((g) => g.status !== "pendente");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Glosas</h1>
          <p className="text-white/50 text-sm mt-1">Contestações e recursos de faturamento</p>
        </div>
        {pendentes.length > 0 && (
          <div className="bg-red-500/15 border border-red-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">{pendentes.length} glosa{pendentes.length !== 1 ? "s" : ""} pendente{pendentes.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 bg-white/5 rounded-[14px]" />)}</div>
      ) : (glosas ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <CheckCircle className="h-10 w-10 text-green-500/40 mx-auto mb-3" />
          <p className="text-white/30">Nenhuma glosa registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pendentes, ...outros].map((g) => (
            <div key={g.id} data-testid={`card-glosa-${g.id}`} className={cn(
              "bg-[#1B1B1E] border rounded-[14px] p-5 hover:border-white/20 transition-colors cursor-pointer",
              g.status === "pendente" && prazoUrgente(g.prazo_recurso) ? "border-red-500/30" : "border-white/10"
            )} onClick={() => setSelectedId(g.id)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    g.status === "pendente" ? "bg-red-500/15" : g.status === "em_recurso" ? "bg-yellow-500/15" : "bg-green-500/15"
                  )}>
                    {g.status === "pendente" ? <AlertTriangle className={cn("h-5 w-5", "text-red-400")} /> :
                     g.status === "em_recurso" ? <Clock className="h-5 w-5 text-yellow-400" /> :
                     <CheckCircle className="h-5 w-5 text-green-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{g.motivo ?? "Glosa sem motivo especificado"}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {g.valor && <span className="text-white/50 text-sm">R$ {Number(g.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
                      {g.prazo_recurso && (
                        <span className={cn("text-xs", prazoUrgente(g.prazo_recurso) ? "text-red-400 font-semibold" : "text-white/40")}>
                          Prazo: {new Date(g.prazo_recurso).toLocaleDateString("pt-BR")}
                          {prazoUrgente(g.prazo_recurso) && " — URGENTE"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className={cn("shrink-0 border text-xs", statusColor(g.status))}>{g.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recurso Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Glosa — Recurso</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-6">
              <div className="bg-[#0F0F12] rounded-xl p-5 space-y-3">
                <div className="flex justify-between"><span className="text-white/40 text-sm">Motivo</span><span className="text-white text-sm text-right max-w-[60%]">{selected.motivo ?? "—"}</span></div>
                {selected.valor && <div className="flex justify-between"><span className="text-white/40 text-sm">Valor</span><span className="text-white font-bold">R$ {Number(selected.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>}
                <div className="flex justify-between"><span className="text-white/40 text-sm">Status</span><Badge className={cn("border text-xs", statusColor(selected.status))}>{selected.status}</Badge></div>
                {selected.prazo_recurso && <div className="flex justify-between"><span className="text-white/40 text-sm">Prazo Recurso</span><span className={cn("text-sm font-medium", prazoUrgente(selected.prazo_recurso) ? "text-red-400" : "text-white")}>{new Date(selected.prazo_recurso).toLocaleDateString("pt-BR")}</span></div>}
              </div>

              {selected.status === "pendente" && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="recurso_texto" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Texto do Recurso</FormLabel>
                        <FormControl>
                          <Textarea data-testid="textarea-recurso" {...field} placeholder="Descreva os motivos do recurso..." className="bg-[#0F0F12] border-white/10 text-white min-h-[140px] resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button data-testid="button-submit-recurso" type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={updateGlosa.isPending}>
                      {updateGlosa.isPending ? "Enviando..." : "Enviar Recurso"}
                    </Button>
                  </form>
                </Form>
              )}

              {selected.recurso_texto && (
                <div className="bg-[#0F0F12] rounded-xl p-5">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Recurso Enviado</p>
                  <p className="text-white/70 text-sm leading-relaxed">{selected.recurso_texto}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
