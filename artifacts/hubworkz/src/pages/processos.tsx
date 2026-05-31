import { useState, useEffect } from "react";
import {
  useListProcessos,
  useGetProcessoFaseStats,
  useCreateProcesso,
  useUpdateProcesso,
  useDeleteProcesso,
  useListPacientes,
  useListMedicamentos,
  getListProcessosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search, FileText, ChevronRight, CheckCircle2, Plus, Pencil, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD = "bg-[#0F0F12] border-white/10 text-white placeholder:text-white/30";

const STATUS_COLORS: Record<string, string> = {
  solicitado:    "bg-purple-500/20 text-purple-300 border-purple-500/40",
  cotacao:       "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  aprovado:      "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  em_andamento:  "bg-blue-500/20 text-blue-300 border-blue-500/40",
  ativo:         "bg-green-500/20 text-green-300 border-green-500/40",
  pendente:      "bg-orange-500/20 text-orange-300 border-orange-500/40",
  concluido:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  cancelado:     "bg-red-500/20 text-red-300 border-red-500/40",
  importado:     "bg-gray-500/20 text-gray-300 border-gray-500/40",
};

const STATUS_ACCENT: Record<string, string> = {
  solicitado:   "bg-purple-500",
  cotacao:      "bg-yellow-500",
  aprovado:     "bg-cyan-500",
  em_andamento: "bg-blue-500",
  ativo:        "bg-green-500",
  pendente:     "bg-orange-500",
  concluido:    "bg-emerald-500",
  cancelado:    "bg-red-500",
  importado:    "bg-gray-500",
};

const STATUS_GLOW: Record<string, string> = {
  solicitado:   "shadow-[0_2px_16px_rgba(168,85,247,0.18)]",
  cotacao:      "shadow-[0_2px_16px_rgba(234,179,8,0.18)]",
  aprovado:     "shadow-[0_2px_16px_rgba(34,211,238,0.18)]",
  em_andamento: "shadow-[0_2px_16px_rgba(59,130,246,0.18)]",
  ativo:        "shadow-[0_2px_16px_rgba(34,197,94,0.18)]",
  pendente:     "shadow-[0_2px_16px_rgba(249,115,22,0.18)]",
  concluido:    "shadow-[0_2px_16px_rgba(52,211,153,0.18)]",
  cancelado:    "shadow-[0_2px_16px_rgba(239,68,68,0.18)]",
  importado:    "shadow-[0_2px_16px_rgba(156,163,175,0.18)]",
};

const FASE_COLORS = [
  { ring: "#F56E0F", glow: "rgba(245,110,15,0.55)", done: "#F56E0F", text: "#fff" },
  { ring: "#3B82F6", glow: "rgba(59,130,246,0.55)", done: "#3B82F6", text: "#fff" },
  { ring: "#A855F7", glow: "rgba(168,85,247,0.55)", done: "#A855F7", text: "#fff" },
  { ring: "#10B981", glow: "rgba(16,185,129,0.55)", done: "#10B981", text: "#fff" },
];

const FASES = [
  { n: 1, label: "Solicitação e Cotação" },
  { n: 2, label: "Aquisição e Logística" },
  { n: 3, label: "Farmácia Clínica" },
  { n: 4, label: "Faturamento" },
];

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: color, boxShadow: `0 2px 10px ${color}66` }}
    >
      {initials || "?"}
    </div>
  );
}

const AVATAR_COLORS = [
  "#F56E0F", "#3B82F6", "#A855F7", "#10B981", "#EC4899", "#14B8A6", "#F59E0B", "#6366F1",
];

function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function FaseStepper({ atual }: { atual: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {FASES.map((f, i) => {
        const fc = FASE_COLORS[i];
        const done = f.n < atual;
        const active = f.n === atual;
        return (
          <div key={f.n} className="flex items-center">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
              style={
                done
                  ? { background: fc.done, boxShadow: `0 0 10px ${fc.glow}`, color: fc.text }
                  : active
                  ? {
                      background: `${fc.done}22`,
                      border: `2px solid ${fc.done}`,
                      boxShadow: `0 0 12px ${fc.glow}, inset 0 0 8px ${fc.done}22`,
                      color: fc.done,
                    }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }
              }
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : f.n}
            </div>
            {i < FASES.length - 1 && (
              <div
                className="h-px w-3"
                style={{
                  background: done
                    ? `linear-gradient(90deg, ${fc.done}, ${FASE_COLORS[i + 1].done}44)`
                    : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────────────────────── form schema */
const schema = z.object({
  paciente_id: z.string().min(1, "Selecione um paciente"),
  medicamento_id: z.string().optional(),
  convenio: z.string().optional(),
  status: z.string().min(1, "Selecione o status").default("solicitado"),
  fase_atual: z.coerce.number().min(1).max(4),
  numero_protocolo: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT: FormValues = {
  paciente_id: "",
  medicamento_id: "",
  convenio: "",
  status: "solicitado",
  fase_atual: 1,
  numero_protocolo: "",
  observacoes: "",
};

/* ───────────────────────────────────────────── types */
type Processo = {
  id: string;
  clinica_id: string;
  paciente_id?: string | null;
  medicamento_id?: string | null;
  convenio?: string | null;
  status: string;
  fase_atual: number;
  numero_protocolo?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

/* ───────────────────────────────────────────── shared form body */
function ProcessoFormFields({
  control,
  setValue,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  watchPacienteId?: string;
}) {
  const { data: pacientes } = useListPacientes();
  const { data: medicamentos } = useListMedicamentos();

  const pacienteList = (pacientes ?? []) as Array<{
    id: string; nome: string; convenio?: string | null;
  }>;
  const medList = (medicamentos ?? []) as Array<{ id: string; nome: string }>;

  return (
    <div className="space-y-5">
      {/* Paciente */}
      <FormField control={control} name="paciente_id" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Paciente *</FormLabel>
          <Select
            value={field.value}
            onValueChange={(val) => {
              field.onChange(val);
              const p = pacienteList.find((x) => x.id === val);
              if (p?.convenio) setValue("convenio", p.convenio);
            }}
          >
            <FormControl>
              <SelectTrigger data-testid="select-paciente-processo" className={FIELD}>
                <SelectValue placeholder="Selecionar paciente..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-56">
              {pacienteList.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/10">
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      {/* Medicamento */}
      <FormField control={control} name="medicamento_id" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Medicamento</FormLabel>
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger data-testid="select-medicamento-processo" className={FIELD}>
                <SelectValue placeholder="Selecionar medicamento..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-56">
              {medList.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-white focus:bg-white/10">
                  {m.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      {/* Convênio */}
      <FormField control={control} name="convenio" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Convênio</FormLabel>
          <FormControl>
            <Input
              data-testid="input-convenio-processo"
              {...field}
              placeholder="Preenchido automaticamente pelo paciente"
              className={FIELD}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Status + Fase */}
      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Status *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className={FIELD}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-[#1B1B1E] border-white/10">
                <SelectItem value="solicitado"   className="text-white focus:bg-white/10">Solicitado</SelectItem>
                <SelectItem value="cotacao"      className="text-white focus:bg-white/10">Em Cotação</SelectItem>
                <SelectItem value="aprovado"     className="text-white focus:bg-white/10">Aprovado</SelectItem>
                <SelectItem value="em_andamento" className="text-white focus:bg-white/10">Em Andamento</SelectItem>
                <SelectItem value="concluido"    className="text-white focus:bg-white/10">Concluído</SelectItem>
                <SelectItem value="cancelado"    className="text-white focus:bg-white/10">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={control} name="fase_atual" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Fase Atual</FormLabel>
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
              <FormControl>
                <SelectTrigger className={FIELD}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-[#1B1B1E] border-white/10">
                {FASES.map((f) => (
                  <SelectItem key={f.n} value={String(f.n)} className="text-white focus:bg-white/10">
                    Fase {f.n} — {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Protocolo */}
      <FormField control={control} name="numero_protocolo" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Número de Protocolo</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Ex: PROC-2026-001" className={FIELD} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Observações */}
      <FormField control={control} name="observacoes" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Observações</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Observações adicionais..."
              className={cn(FIELD, "resize-none min-h-[80px]")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

/* ───────────────────────────────────────────── main page */
export default function Processos() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFase, setFilterFase] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState<Processo | null>(null);
  const [deleteItem, setDeleteItem] = useState<Processo | null>(null);

  const params = {
    ...(filterStatus !== "all" ? { status: filterStatus } : {}),
    ...(filterFase !== "all" ? { fase: filterFase } : {}),
  };

  const { data: processos, isLoading } = useListProcessos(params);
  const { data: faseStats } = useGetProcessoFaseStats();
  const { data: pacientes } = useListPacientes();
  const { data: medicamentos } = useListMedicamentos();

  const createProcesso = useCreateProcesso();
  const updateProcesso = useUpdateProcesso();
  const deleteProcesso = useDeleteProcesso();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const newForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT });
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT });

  const pacienteMap = Object.fromEntries(
    ((pacientes ?? []) as Array<{ id: string; nome: string }>).map((p) => [p.id, p.nome])
  );

  const medMap = Object.fromEntries(
    ((medicamentos ?? []) as Array<{ id: string; nome: string }>).map((m) => [m.id, m.nome])
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListProcessosQueryKey() });
  }

  function openEdit(p: Processo) {
    setEditItem(p);
    editForm.reset({
      paciente_id: p.paciente_id ?? "",
      medicamento_id: p.medicamento_id ?? "",
      convenio: p.convenio ?? "",
      status: p.status,
      fase_atual: p.fase_atual,
      numero_protocolo: p.numero_protocolo ?? "",
      observacoes: p.observacoes ?? "",
    });
  }

  function handleCreate(values: FormValues) {
    createProcesso.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Processo criado com sucesso." });
        invalidate();
        setOpenNew(false);
        newForm.reset(DEFAULT);
      },
      onError: () => toast({ title: "Erro ao criar processo.", variant: "destructive" }),
    });
  }

  function handleUpdate(values: FormValues) {
    if (!editItem) return;
    updateProcesso.mutate({ id: editItem.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Processo atualizado." });
        invalidate();
        setEditItem(null);
      },
      onError: () => toast({ title: "Erro ao atualizar processo.", variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteProcesso.mutate({ id: deleteItem.id }, {
      onSuccess: () => {
        toast({ title: "Processo excluído." });
        invalidate();
        setDeleteItem(null);
      },
      onError: (err) => {
        const msg = (err as { data?: { error?: string } })?.data?.error;
        toast({ title: msg ?? "Erro ao excluir processo.", variant: "destructive" });
      },
    });
  }

  const filtered = ((processos ?? []) as Processo[]).filter((p) =>
    search === "" ||
    p.numero_protocolo?.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = ((processos ?? []) as Processo[]).find((p) => p.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Processos</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie o fluxo completo de 4 fases</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(faseStats ?? []).map((f, i) => {
            const fc = FASE_COLORS[i] ?? FASE_COLORS[0];
            return (
              <div
                key={f.fase}
                className="border rounded-xl px-4 py-2.5 text-center min-w-[68px]"
                style={{
                  background: `linear-gradient(135deg, ${fc.done}18, ${fc.done}08)`,
                  borderColor: `${fc.done}40`,
                  boxShadow: `0 4px 20px ${fc.glow.replace("0.55","0.14")}`,
                }}
              >
                <p className="font-bold text-base" style={{ color: fc.done }}>{f.count}</p>
                <p className="text-white/50 text-xs">{f.fase}</p>
              </div>
            );
          })}
          <Sheet open={openNew} onOpenChange={setOpenNew}>
            <SheetTrigger asChild>
              <Button
                data-testid="button-new-processo"
                className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
              >
                <Plus className="h-4 w-4" /> Novo Processo
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] overflow-y-auto"
            >
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white">Novo Processo</SheetTitle>
              </SheetHeader>
              <Form {...newForm}>
                <form onSubmit={newForm.handleSubmit(handleCreate)} className="space-y-6">
                  <ProcessoFormFields
                    control={newForm.control}
                    setValue={newForm.setValue}
                  />
                  <Button
                    data-testid="button-submit-processo"
                    type="submit"
                    className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                    disabled={createProcesso.isPending}
                  >
                    {createProcesso.isPending ? "Criando..." : "Criar Processo"}
                  </Button>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            data-testid="input-search-processos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo..."
            className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
          />
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
            {FASES.map((f) => (
              <SelectItem key={f.n} value={String(f.n)}>Fase {f.n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de processos */}
      <div className="space-y-2">
        {/* Header da lista */}
        <div className="grid grid-cols-[1fr_180px_160px_170px_130px_90px_80px] text-[11px] text-white/30 uppercase tracking-widest px-5 py-2">
          <span>Processo</span>
          <span>Paciente</span>
          <span>Medicamento</span>
          <span className="text-center">Fase</span>
          <span className="text-center">Status</span>
          <span className="text-center">Criado em</span>
          <span className="text-center">Ações</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[72px] bg-white/5 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-[#1B1B1E] border border-white/5 rounded-2xl">
            <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">
              {search ? "Nenhum processo encontrado" : "Nenhum processo cadastrado"}
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const accentClass = STATUS_ACCENT[p.status] ?? "bg-white/20";
            const glowClass   = STATUS_GLOW[p.status]   ?? "";
            const pacNome     = p.paciente_id ? (pacienteMap[p.paciente_id] ?? null) : null;
            const medNome     = p.medicamento_id ? (medMap[p.medicamento_id] ?? null) : null;
            const avatarColor = pacNome ? nameColor(pacNome) : "#555";

            return (
              <div
                key={p.id}
                data-testid={`row-processo-${p.id}`}
                className={cn(
                  "relative grid grid-cols-[1fr_180px_160px_170px_130px_90px_80px] items-center",
                  "bg-[#1B1B1E] border border-white/8 rounded-2xl px-5 py-4",
                  "hover:-translate-y-px hover:border-white/15 transition-all duration-200 group overflow-hidden",
                  glowClass,
                )}
              >
                {/* Accent bar */}
                <div className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", accentClass)} />

                {/* Processo / protocolo */}
                <div className="cursor-pointer pl-2" onClick={() => setSelectedId(p.id)}>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {p.numero_protocolo ?? `#${p.id.slice(0, 8)}`}
                  </p>
                  <p className="text-white/35 text-xs mt-0.5 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {p.convenio ? p.convenio : `ID: ${p.id.slice(0, 8)}`}
                  </p>
                </div>

                {/* Paciente com avatar */}
                <div className="flex items-center gap-2">
                  {pacNome ? (
                    <>
                      <InitialsAvatar name={pacNome} color={avatarColor} />
                      <span className="text-white/80 text-sm leading-tight truncate max-w-[120px]">{pacNome}</span>
                    </>
                  ) : (
                    <span className="text-white/25 text-sm">—</span>
                  )}
                </div>

                {/* Medicamento como pílula */}
                <div>
                  {medNome ? (
                    <span
                      className="inline-block text-xs px-2.5 py-1 rounded-full font-medium truncate max-w-[148px]"
                      style={{
                        background: "rgba(163,91,255,0.15)",
                        color: "#C084FC",
                        border: "1px solid rgba(163,91,255,0.3)",
                      }}
                    >
                      {medNome}
                    </span>
                  ) : (
                    <span className="text-white/25 text-sm">—</span>
                  )}
                </div>

                {/* Fase stepper */}
                <div className="flex justify-center">
                  <FaseStepper atual={p.fase_atual} />
                </div>

                {/* Status badge */}
                <div className="flex justify-center">
                  <Badge className={cn("text-xs border font-medium", STATUS_COLORS[p.status] ?? "bg-white/10 text-white/60")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5 inline-block", STATUS_ACCENT[p.status] ?? "bg-white/40")} />
                    {p.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Data */}
                <span className="text-center text-white/35 text-xs">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </span>

                {/* Ações */}
                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                    className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/12 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 text-white/50" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteItem(p); }}
                    className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sheet de detalhes (clique na linha) */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent
          side="right"
          className="bg-[#1B1B1E] border-l border-white/10 text-white w-[500px] sm:max-w-[500px]"
        >
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white text-lg">
                  {selected.numero_protocolo ?? `Processo ${selected.id.slice(0, 8)}`}
                </SheetTitle>
                <Badge className={cn("w-fit border", STATUS_COLORS[selected.status] ?? "bg-white/10")}>
                  {selected.status}
                </Badge>
              </SheetHeader>
              <div className="space-y-6">
                <div className="bg-[#0F0F12] rounded-xl p-5">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">
                    Progresso do Processo
                  </p>
                  <div className="space-y-4">
                    {FASES.map((f) => (
                      <div key={f.n} className="flex items-center gap-4">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                          f.n < selected.fase_atual ? "bg-[#F56E0F] text-white" :
                          f.n === selected.fase_atual
                            ? "bg-[#F56E0F]/20 text-[#F56E0F] border-2 border-[#F56E0F]"
                            : "bg-white/10 text-white/30 border border-white/10"
                        )}>
                          {f.n < selected.fase_atual ? <CheckCircle2 className="h-4 w-4" /> : f.n}
                        </div>
                        <div className="flex-1">
                          <p className={cn("text-sm font-medium", f.n <= selected.fase_atual ? "text-white" : "text-white/30")}>
                            Fase {f.n}
                          </p>
                          <p className={cn("text-xs", f.n <= selected.fase_atual ? "text-white/50" : "text-white/20")}>
                            {f.label}
                          </p>
                        </div>
                        {f.n === selected.fase_atual && (
                          <Badge className="bg-[#F56E0F]/20 text-[#F56E0F] border-[#F56E0F]/30 text-xs">
                            Atual
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-[#0F0F12] rounded-xl p-5">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Detalhes</p>
                  {[
                    { label: "Protocolo", value: selected.numero_protocolo ?? "—" },
                    { label: "Paciente", value: selected.paciente_id ? (pacienteMap[selected.paciente_id] ?? selected.paciente_id.slice(0, 8) + "...") : "—" },
                    { label: "Medicamento", value: selected.medicamento_id ? (medMap[selected.medicamento_id] ?? selected.medicamento_id.slice(0, 8) + "...") : "—" },
                    { label: "Convênio", value: selected.convenio ?? "—" },
                    { label: "Criado em", value: new Date(selected.created_at).toLocaleDateString("pt-BR") },
                    { label: "Observações", value: selected.observacoes ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="text-white/40 text-sm shrink-0">{label}</span>
                      <span className="text-white text-sm text-right">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  {selected.fase_atual < 4 && (
                    <Button
                      data-testid="button-advance-fase"
                      className="flex-1 bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                      onClick={() => {
                        updateProcesso.mutate(
                          { id: selected.id, data: { fase_atual: selected.fase_atual + 1 } },
                          {
                            onSuccess: () => {
                              invalidate();
                              setSelectedId(null);
                            },
                          }
                        );
                      }}
                    >
                      Avançar para Fase {selected.fase_atual + 1}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-white/10 text-white/70 hover:bg-white/5"
                    onClick={() => setSelectedId(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de edição */}
      <Sheet open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <SheetContent
          side="right"
          className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Processo</SheetTitle>
          </SheetHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-6">
              <ProcessoFormFields
                control={editForm.control}
                setValue={editForm.setValue}
              />
              <Button
                type="submit"
                className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                disabled={updateProcesso.isPending}
              >
                {updateProcesso.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir processo?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O processo{" "}
              <span className="text-white font-medium">
                {deleteItem?.numero_protocolo ?? `#${deleteItem?.id.slice(0, 8)}`}
              </span>{" "}
              será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteProcesso.isPending}
            >
              {deleteProcesso.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
