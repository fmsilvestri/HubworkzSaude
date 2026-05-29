import { useState } from "react";
import { useListCotacoes, useCreateCotacao, getListCotacoesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CheckCircle, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  processo_id: z.string().optional(),
  medicamento_id: z.string().optional(),
  fornecedor_tipo: z.string().min(1, "Selecione o tipo"),
  fornecedor_id: z.string().optional(),
  valor: z.string().optional(),
  prazo_entrega: z.string().optional(),
  status: z.string().default("enviada"),
  recomendada: z.boolean().default(false),
});

export default function Cotacao() {
  const [processoId, setProcessoId] = useState("");
  const { data: cotacoes, isLoading } = useListCotacoes({ processo_id: processoId || undefined });
  const createCotacao = useCreateCotacao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const nacional = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fornecedor_tipo: "nacional", status: "enviada", recomendada: false },
  });

  const importadora = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fornecedor_tipo: "importadora", status: "enviada", recomendada: false },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    const valorNum = values.valor ? parseFloat(values.valor) : undefined;
    createCotacao.mutate({ data: { ...values, valor: valorNum } }, {
      onSuccess: () => {
        toast({ title: "Cotação registrada!" });
        queryClient.invalidateQueries({ queryKey: getListCotacoesQueryKey() });
        nacional.reset();
        importadora.reset();
      },
      onError: () => toast({ title: "Erro ao registrar cotação", variant: "destructive" }),
    });
  };

  type CotacaoItem = NonNullable<typeof cotacoes>[number];
  const recomendada = (cotacoes ?? []).reduce<CotacaoItem | undefined>((best, c) => {
    if (!best) return c.recomendada ? c : undefined;
    return c.recomendada ? c : best;
  }, undefined) ?? (cotacoes ?? []).reduce<CotacaoItem | undefined>((best, c) => {
    if (!best) return c;
    return (c.valor ?? Infinity) < (best.valor ?? Infinity) ? c : best;
  }, undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cotação</h1>
        <p className="text-white/50 text-sm mt-1">Compare fornecedores nacional e importadora simultaneamente</p>
      </div>

      <div className="relative">
        <Input data-testid="input-processo-cotacao" value={processoId} onChange={(e) => setProcessoId(e.target.value)} placeholder="ID do processo (opcional)..." className="bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30" />
      </div>

      {/* Side-by-side form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { label: "Distribuidora Nacional", tipo: "nacional", form: nacional, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: "Importadora Internacional", tipo: "importadora", form: importadora, color: "text-purple-400", bg: "bg-purple-500/15" },
        ].map(({ label, tipo, form: f, color, bg }) => (
          <div key={tipo} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
            <div className={cn("inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-xl text-sm font-semibold", bg, color)}>
              <DollarSign className="h-4 w-4" />
              {label}
            </div>
            <Form {...f}>
              <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={f.control} name="fornecedor_id" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">ID do Fornecedor</FormLabel><FormControl><Input data-testid={`input-fornecedor-${tipo}`} {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={f.control} name="valor" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Valor (R$)</FormLabel><FormControl><Input data-testid={`input-valor-${tipo}`} {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={f.control} name="prazo_entrega" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Prazo de Entrega</FormLabel><FormControl><Input data-testid={`input-prazo-${tipo}`} {...field} placeholder="Ex: 15 dias úteis" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={f.control} name="medicamento_id" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">ID do Medicamento</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button data-testid={`button-submit-cotacao-${tipo}`} type="submit" className={cn("w-full text-white", tipo === "nacional" ? "bg-blue-600 hover:bg-blue-600/80" : "bg-purple-600 hover:bg-purple-600/80")} disabled={createCotacao.isPending}>
                  Registrar Cotação
                </Button>
              </form>
            </Form>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {recomendada && (
        <div className="bg-[rgba(63,52,137,0.2)] border border-[#3C3489]/40 rounded-[14px] p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-[#A5FFD6]/15 rounded-xl flex items-center justify-center">
            <Star className="h-6 w-6 text-[#A5FFD6]" />
          </div>
          <div>
            <p className="text-[#A5FFD6] font-semibold text-sm">Recomendação Di IA</p>
            <p className="text-white/70 text-sm mt-0.5">
              Melhor opção: {recomendada.fornecedor_tipo} — R$ {Number(recomendada.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — Prazo: {recomendada.prazo_entrega ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* Cotacoes List */}
      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 bg-white/5 rounded-[14px]" />)}</div>
      ) : (cotacoes ?? []).length > 0 && (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white/60 text-sm font-semibold">Histórico de Cotações</p>
          </div>
          {(cotacoes ?? []).map((c) => (
            <div key={c.id} data-testid={`row-cotacao-${c.id}`} className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-4">
                {c.recomendada && <Star className="h-4 w-4 text-[#A5FFD6]" />}
                <div>
                  <p className="text-white text-sm font-medium capitalize">{c.fornecedor_tipo}</p>
                  <p className="text-white/40 text-xs">{c.prazo_entrega ?? "Prazo não informado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">R$ {Number(c.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <Badge className={c.recomendada ? "bg-[#A5FFD6]/15 text-[#A5FFD6] border-[#A5FFD6]/20" : "bg-white/10 text-white/50 border-white/10"}>
                  {c.recomendada ? "Recomendada" : c.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
