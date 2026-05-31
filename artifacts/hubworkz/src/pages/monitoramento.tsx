import { useState, useMemo } from "react";
import {
  useListMonitoramentos,
  useCreateMonitoramento,
  useUpdateMonitoramento,
  useListPacientes,
  useListProcessos,
  getListMonitoramentosQueryKey,
  type Monitoramento,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Pencil,
  Trash2,
  Search,
  CalendarPlus,
  Phone,
  MessageSquare,
  UserRound,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADESAO_OPTIONS = [
  { value: "total", label: "Adesão Total" },
  { value: "parcial", label: "Adesão Parcial" },
  { value: "nenhuma", label: "Sem Adesão" },
];

const CANAL_OPTIONS = [
  { value: "telefone", label: "Telefone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "presencial", label: "Presencial" },
  { value: "email", label: "E-mail" },
];

const CANAL_ICON: Record<string, React.ReactNode> = {
  telefone: <Phone className="h-3 w-3" />,
  whatsapp: <MessageSquare className="h-3 w-3" />,
  presencial: <UserRound className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
};

const schema = z.object({
  paciente_id: z.string().optional(),
  processo_id: z.string().optional(),
  data_contato: z.string().min(1, "Data obrigatória"),
  adesao: z.string().min(1, "Selecione adesão"),
  canal: z.string().optional(),
  eventos_adversos: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().default("realizado"),
});

type FormValues = z.infer<typeof schema>;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function adesaoColor(adesao: string | null | undefined) {
  return ({
    total: "bg-green-500/15 text-green-400 border-green-500/20",
    parcial: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    nenhuma: "bg-red-500/15 text-red-400 border-red-500/20",
  } as Record<string, string>)[adesao ?? ""] ?? "bg-white/10 text-white/50 border-white/10";
}

function adesaoIcon(adesao: string | null | undefined) {
  if (adesao === "total") return <CheckCircle className="h-5 w-5 text-green-400" />;
  if (adesao === "parcial") return <Clock className="h-5 w-5 text-yellow-400" />;
  return <AlertTriangle className="h-5 w-5 text-red-400" />;
}

function adesaoBg(adesao: string | null | undefined) {
  if (adesao === "total") return "bg-green-500/15";
  if (adesao === "parcial") return "bg-yellow-500/15";
  return "bg-red-500/15";
}

const EMPTY_DEFAULTS: FormValues = {
  paciente_id: "",
  processo_id: "",
  data_contato: new Date().toISOString().split("T")[0]!,
  adesao: "",
  canal: "",
  eventos_adversos: "",
  observacoes: "",
  status: "realizado",
};

export default function Monitoramento() {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const [adesaoFiltro, setAdesaoFiltro] = useState("__all__");
  const [openSheet, setOpenSheet] = useState(false);
  const [editItem, setEditItem] = useState<Monitoramento | null>(null);
  const [deleteItem, setDeleteItem] = useState<Monitoramento | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: monitoramentos, isLoading } = useListMonitoramentos({ mes });
  const { data: pacientes } = useListPacientes();
  const { data: processos } = useListProcessos();
  const createMonitoramento = useCreateMonitoramento();
  const updateMonitoramento = useUpdateMonitoramento();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListMonitoramentosQueryKey() });

  const pacienteNome = (id: string | null | undefined) =>
    !id ? null : (pacientes ?? []).find((p) => p.id === id)?.nome ?? id;

  const processoLabel = (id: string | null | undefined) => {
    if (!id) return null;
    const p = (processos ?? []).find((pr) => pr.id === id);
    return p ? `Proc. ${p.numero_protocolo ?? p.id.slice(0, 8)}` : null;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  function openCreate(prefill?: Partial<FormValues>) {
    form.reset({ ...EMPTY_DEFAULTS, ...prefill });
    setEditItem(null);
    setOpenSheet(true);
  }

  function openEdit(m: Monitoramento) {
    form.reset({
      paciente_id: m.paciente_id ?? "",
      processo_id: m.processo_id ?? "",
      data_contato: m.data_contato ?? EMPTY_DEFAULTS.data_contato,
      adesao: m.adesao ?? "",
      canal: (m as unknown as Record<string, string>)["canal"] ?? "",
      eventos_adversos: m.eventos_adversos ?? "",
      observacoes: m.observacoes ?? "",
      status: m.status ?? "realizado",
    });
    setEditItem(m);
    setOpenSheet(true);
  }

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      paciente_id: values.paciente_id || undefined,
      processo_id: values.processo_id || undefined,
      canal: values.canal || undefined,
    };

    if (editItem) {
      updateMonitoramento.mutate(
        { id: editItem.id, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Monitoramento atualizado!" });
            invalidate();
            setOpenSheet(false);
          },
          onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
        },
      );
    } else {
      createMonitoramento.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Monitoramento registrado!" });
            invalidate();
            setOpenSheet(false);
            form.reset(EMPTY_DEFAULTS);
          },
          onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
        },
      );
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const resp = await fetch(`/api/monitoramentos/${deleteItem.id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Erro ao excluir");
      toast({ title: "Monitoramento excluído." });
      invalidate();
      setDeleteItem(null);
    } catch {
      toast({ title: "Erro ao excluir monitoramento", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const all = monitoramentos ?? [];

  const filtered = useMemo(() => {
    let result = all;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const nome = pacienteNome(m.paciente_id) ?? "";
        return nome.toLowerCase().includes(q) ||
          (m.eventos_adversos ?? "").toLowerCase().includes(q) ||
          (m.observacoes ?? "").toLowerCase().includes(q);
      });
    }
    if (adesaoFiltro !== "__all__") {
      result = result.filter((m) => m.adesao === adesaoFiltro);
    }
    return result;
  }, [all, search, adesaoFiltro, pacientes]);

  const realizados = all.filter((m) => m.status === "realizado" || m.adesao).length;
  const semAdesao = all.filter((m) => m.adesao === "nenhuma").length;
  const comAdesaoTotal = all.filter((m) => m.adesao === "total").length;
  const taxaAdesao = all.length > 0 ? Math.round((comAdesaoTotal / all.length) * 100) : 0;

  const isPending = createMonitoramento.isPending || updateMonitoramento.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Acompanhamento Pacientes</h1>
          <p className="text-white/50 text-sm mt-1">
            Monitoramento D30 — contato clínico mensal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            data-testid="input-mes-monitoramento"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="bg-[#1B1B1E] border-white/10 text-white w-44"
          />
          <Button
            data-testid="button-new-monitoramento"
            onClick={() => openCreate()}
            className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        </div>
      </div>

      {/* Stats */}
      {all.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Contatos no mês", value: all.length, color: "text-white" },
            { label: "Realizados", value: realizados, color: "text-[#A5FFD6]" },
            { label: "Sem Adesão", value: semAdesao, color: "text-red-400" },
            { label: "Taxa Adesão Total", value: `${taxaAdesao}%`, color: "text-[#F56E0F]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            placeholder="Buscar por paciente, evento adverso ou observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={adesaoFiltro} onValueChange={setAdesaoFiltro}>
          <SelectTrigger className="bg-[#1B1B1E] border-white/10 text-white w-48">
            <SelectValue placeholder="Filtrar adesão" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="__all__">Todas as adesões</SelectItem>
            {ADESAO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || adesaoFiltro !== "__all__") && (
          <span className="text-white/40 text-sm">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 bg-white/5 rounded-[14px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <CalendarDays className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">
            {all.length === 0
              ? `Nenhum monitoramento registrado para ${mes}`
              : "Nenhum resultado para os filtros aplicados"}
          </p>
          {all.length === 0 && (
            <p className="text-white/20 text-sm mt-1">
              Clique em "Registrar" para adicionar um contato D30
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const canal = (m as unknown as Record<string, string>)["canal"];
            return (
              <div
                key={m.id}
                data-testid={`card-monitoramento-${m.id}`}
                className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Ícone + info */}
                  <div className="flex items-start gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", adesaoBg(m.adesao))}>
                      {adesaoIcon(m.adesao)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium">
                        {pacienteNome(m.paciente_id) ?? "Paciente não identificado"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-white/40 text-xs">
                          {m.data_contato
                            ? new Date(m.data_contato + "T12:00:00").toLocaleDateString("pt-BR", {
                                weekday: "long", day: "2-digit", month: "long",
                              })
                            : "Data não definida"}
                        </p>
                        {processoLabel(m.processo_id) && (
                          <span className="text-white/25 text-xs">· {processoLabel(m.processo_id)}</span>
                        )}
                      </div>
                      {m.eventos_adversos && (
                        <p className="text-white/55 text-sm mt-2 leading-snug">
                          <span className="text-white/30 text-xs uppercase tracking-wider mr-1">Eventos:</span>
                          {m.eventos_adversos}
                        </p>
                      )}
                      {m.observacoes && (
                        <p className="text-white/35 text-xs mt-1 leading-snug">{m.observacoes}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges + ações */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {m.adesao && (
                        <Badge className={cn("border text-xs capitalize", adesaoColor(m.adesao))}>
                          {m.adesao}
                        </Badge>
                      )}
                      {canal && (
                        <Badge className="bg-white/5 text-white/40 border-white/10 text-xs gap-1 flex items-center">
                          {CANAL_ICON[canal]}
                          {canal}
                        </Badge>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 mt-1">
                      {m.data_contato && (
                        <button
                          onClick={() =>
                            openCreate({
                              paciente_id: m.paciente_id ?? "",
                              processo_id: m.processo_id ?? "",
                              data_contato: addDays(m.data_contato!, 30),
                            })
                          }
                          title="Agendar próximo D30 (+30 dias)"
                          className="flex items-center gap-1 text-[10px] text-[#A5FFD6]/50 hover:text-[#A5FFD6] border border-[#A5FFD6]/15 hover:border-[#A5FFD6]/30 bg-[#A5FFD6]/5 hover:bg-[#A5FFD6]/10 rounded-lg px-2 py-1 transition-all"
                        >
                          <CalendarPlus className="h-3 w-3" />
                          +D30
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(m)}
                        title="Editar"
                        className="text-[#F56E0F]/60 hover:text-[#F56E0F] hover:bg-[#F56E0F]/10 transition-colors p-1.5 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteItem(m)}
                        title="Excluir"
                        className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors p-1.5 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet — criar / editar */}
      <Sheet open={openSheet} onOpenChange={(o) => { if (!o) { setOpenSheet(false); setEditItem(null); } }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">
              {editItem ? "Editar Monitoramento D30" : "Registrar Monitoramento D30"}
            </SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField control={form.control} name="data_contato" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Data do Contato *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-data-contato" {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="paciente_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Paciente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-60 overflow-y-auto">
                        {(pacientes ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="processo_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Processo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-60 overflow-y-auto">
                        {(processos ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.numero_protocolo ?? p.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="adesao" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Adesão ao Tratamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-adesao" className="bg-[#0F0F12] border-white/10 text-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1B1B1E] border-white/10">
                        {ADESAO_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="canal" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Canal de Contato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1B1B1E] border-white/10">
                        {CANAL_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "realizado"}>
                    <FormControl>
                      <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1B1B1E] border-white/10">
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="eventos_adversos" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Eventos Adversos</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descreva eventos adversos observados..." className="bg-[#0F0F12] border-white/10 text-white min-h-[80px] resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Observações Clínicas</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Notas adicionais, evolução do paciente..." className="bg-[#0F0F12] border-white/10 text-white min-h-[80px] resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                data-testid="button-submit-monitoramento"
                type="submit"
                className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                disabled={isPending}
              >
                {isPending
                  ? (editItem ? "Salvando..." : "Registrando...")
                  : (editItem ? "Salvar Alterações" : "Registrar Monitoramento")}
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir monitoramento?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O registro de contato com{" "}
              <strong className="text-white">{pacienteNome(deleteItem?.paciente_id) ?? "este paciente"}</strong>{" "}
              em{" "}
              {deleteItem?.data_contato
                ? new Date(deleteItem.data_contato + "T12:00:00").toLocaleDateString("pt-BR")
                : "data desconhecida"}{" "}
              será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
