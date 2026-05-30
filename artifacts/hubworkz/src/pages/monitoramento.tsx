import { useState } from "react";
import { useListMonitoramentos, useCreateMonitoramento, useListPacientes, getListMonitoramentosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  paciente_id: z.string().optional(),
  processo_id: z.string().optional(),
  data_contato: z.string().min(1, "Data obrigatória"),
  adesao: z.string().min(1, "Selecione adesão"),
  eventos_adversos: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().default("pendente"),
});

export default function Monitoramento() {
  const [open, setOpen] = useState(false);
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const { data: monitoramentos, isLoading } = useListMonitoramentos({ mes });
  const { data: pacientes } = useListPacientes();
  const createMonitoramento = useCreateMonitoramento();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pacienteNome = (id: string | null | undefined) => {
    if (!id) return null;
    return (pacientes ?? []).find((p) => p.id === id)?.nome ?? id;
  };

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { paciente_id: "", processo_id: "", data_contato: new Date().toISOString().split("T")[0], adesao: "", eventos_adversos: "", observacoes: "", status: "realizado" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createMonitoramento.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Monitoramento registrado!" });
        queryClient.invalidateQueries({ queryKey: getListMonitoramentosQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
    });
  };

  const adesaoColor = (adesao: string | null | undefined) => ({
    total: "bg-green-500/15 text-green-400 border-green-500/20",
    parcial: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    nenhuma: "bg-red-500/15 text-red-400 border-red-500/20",
  }[adesao ?? ""] ?? "bg-white/10 text-white/50");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoramento D30</h1>
          <p className="text-white/50 text-sm mt-1">Acompanhamento mensal de pacientes via contato clínico</p>
        </div>
        <div className="flex items-center gap-3">
          <Input data-testid="input-mes-monitoramento" type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="bg-[#1B1B1E] border-white/10 text-white w-44" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button data-testid="button-new-monitoramento" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
                <Plus className="h-4 w-4" /> Registrar
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
              <SheetHeader className="mb-6"><SheetTitle className="text-white">Registrar Monitoramento D30</SheetTitle></SheetHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="data_contato" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Data do Contato *</FormLabel><FormControl><Input data-testid="input-data-contato" {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paciente_id" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Paciente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                            <SelectValue placeholder="Selecione o paciente..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          {(pacientes ?? []).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="adesao" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Adesão ao Tratamento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-adesao" className="bg-[#0F0F12] border-white/10 text-white"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          <SelectItem value="total">Adesão Total</SelectItem>
                          <SelectItem value="parcial">Adesão Parcial</SelectItem>
                          <SelectItem value="nenhuma">Sem Adesão</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="eventos_adversos" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Eventos Adversos</FormLabel><FormControl><Textarea {...field} placeholder="Descreva eventos adversos observados..." className="bg-[#0F0F12] border-white/10 text-white min-h-[80px] resize-none" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="observacoes" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Observações Clínicas</FormLabel><FormControl><Textarea {...field} placeholder="Notas adicionais..." className="bg-[#0F0F12] border-white/10 text-white min-h-[80px] resize-none" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button data-testid="button-submit-monitoramento" type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={createMonitoramento.isPending}>
                    {createMonitoramento.isPending ? "Registrando..." : "Registrar Monitoramento"}
                  </Button>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 bg-white/5 rounded-[14px]" />)}</div>
      ) : (monitoramentos ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <CalendarDays className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">Nenhum monitoramento registrado para {mes}</p>
          <p className="text-white/20 text-sm mt-1">Clique em "Registrar" para adicionar um contato D30</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(monitoramentos ?? []).map((m) => (
            <div key={m.id} data-testid={`card-monitoramento-${m.id}`} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                    m.adesao === "total" ? "bg-green-500/15" : m.adesao === "parcial" ? "bg-yellow-500/15" : "bg-red-500/15"
                  )}>
                    {m.adesao === "total" ? <CheckCircle className="h-5 w-5 text-green-400" /> :
                     m.adesao === "parcial" ? <Clock className="h-5 w-5 text-yellow-400" /> :
                     <AlertTriangle className="h-5 w-5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {pacienteNome(m.paciente_id) ?? "Paciente não identificado"}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {m.data_contato ? new Date(m.data_contato).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }) : "Data não definida"}
                    </p>
                    {m.eventos_adversos && <p className="text-white/50 text-sm mt-1">{m.eventos_adversos}</p>}
                    {m.observacoes && <p className="text-white/40 text-xs mt-0.5">{m.observacoes}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {m.adesao && <Badge className={cn("border text-xs", adesaoColor(m.adesao))}>{m.adesao}</Badge>}
                  {m.status && <Badge className="bg-white/10 text-white/50 border-white/10 text-xs">{m.status}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
