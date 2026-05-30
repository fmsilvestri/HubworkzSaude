import { useState } from "react";
import {
  useListDeclaracoes,
  useCreateDeclaracao,
  useUpdateDeclaracao,
  useDeleteDeclaracao,
  useListPacientes,
  getListDeclaracoesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { FileBadge, Plus, CheckCircle, Clock, Pencil, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD = "bg-[#0F0F12] border-white/10 text-white placeholder:text-white/30";

const MODALIDADES = [
  "Registro ANVISA",
  "Uso Compassivo",
  "Importação por Exceção",
  "Protocolo Clínico",
];

const STATUS_OPTS = ["pendente", "assinada", "cancelada"];

const schema = z.object({
  paciente_nome: z.string().min(2, "Paciente obrigatório"),
  paciente_id: z.string().optional(),
  modalidade: z.string().min(1, "Modalidade obrigatória"),
  status: z.string().optional(),
  data: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Declaracao = {
  id: string;
  paciente_id?: string | null;
  paciente_nome?: string | null;
  modalidade?: string | null;
  status?: string | null;
  data?: string | null;
  pdf_url?: string | null;
  created_at: string;
};

const DEFAULT: FormValues = { paciente_nome: "", paciente_id: "", modalidade: "", status: "pendente", data: "" };

function statusStyle(status: string | null | undefined) {
  if (status === "assinada") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (status === "cancelada") return "bg-red-500/15 text-red-400 border-red-500/20";
  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
}

function DeclaracaoForm({
  onSubmit,
  isPending,
  submitLabel,
  pacientes,
}: {
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
  pacientes: Array<{ id: string; nome: string }>;
}) {
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Paciente — select ou texto livre */}
      {pacientes.length > 0 ? (
        <FormField control={control} name="paciente_id" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Paciente *</FormLabel>
            <Select
              onValueChange={(val) => {
                field.onChange(val);
                const p = pacientes.find((p) => p.id === val);
                if (p) setValue("paciente_nome", p.nome);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="Selecionar paciente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-[#1B1B1E] border-white/10 text-white">
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="focus:bg-white/10">{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      ) : (
        <FormField control={control} name="paciente_nome" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Nome do Paciente *</FormLabel>
            <FormControl><Input {...field} className={FIELD} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      )}

      <FormField control={control} name="modalidade" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Modalidade *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className={FIELD}>
                <SelectValue placeholder="Selecionar modalidade" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#1B1B1E] border-white/10 text-white">
              {MODALIDADES.map((m) => (
                <SelectItem key={m} value={m} className="focus:bg-white/10">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="data" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Data</FormLabel>
            <FormControl><Input type="date" {...field} className={FIELD} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="pendente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-[#1B1B1E] border-white/10 text-white">
                {STATUS_OPTS.map((s) => (
                  <SelectItem key={s} value={s} className="focus:bg-white/10 capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      <Button type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={isPending}>
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

export default function Declaracoes() {
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState<Declaracao | null>(null);
  const [deleteItem, setDeleteItem] = useState<Declaracao | null>(null);
  const [filterModalidade, setFilterModalidade] = useState<string>("todas");

  const { data: declaracoes, isLoading } = useListDeclaracoes();
  const { data: pacientesRaw } = useListPacientes();
  const createDeclaracao = useCreateDeclaracao();
  const updateDeclaracao = useUpdateDeclaracao();
  const deleteDeclaracao = useDeleteDeclaracao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pacientes = (pacientesRaw ?? []).map((p) => ({ id: p.id, nome: p.nome }));

  const newForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT });
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListDeclaracoesQueryKey() });
  }

  function openEdit(d: Declaracao) {
    setEditItem(d);
    editForm.reset({
      paciente_nome: d.paciente_nome ?? "",
      paciente_id: d.paciente_id ?? "",
      modalidade: d.modalidade ?? "",
      status: d.status ?? "pendente",
      data: d.data ?? "",
    });
  }

  function handleCreate(values: FormValues) {
    createDeclaracao.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Declaração criada." });
        invalidate();
        setOpenNew(false);
        newForm.reset(DEFAULT);
      },
      onError: () => toast({ title: "Erro ao criar declaração.", variant: "destructive" }),
    });
  }

  function handleUpdate(values: FormValues) {
    if (!editItem) return;
    updateDeclaracao.mutate({ id: editItem.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Declaração atualizada." });
        invalidate();
        setEditItem(null);
      },
      onError: () => toast({ title: "Erro ao atualizar declaração.", variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteDeclaracao.mutate({ id: deleteItem.id }, {
      onSuccess: () => {
        toast({ title: "Declaração excluída." });
        invalidate();
        setDeleteItem(null);
      },
      onError: () => toast({ title: "Erro ao excluir declaração.", variant: "destructive" }),
    });
  }

  const all = (declaracoes as Declaracao[] ?? []);
  const filtered = filterModalidade === "todas" ? all : all.filter((d) => d.modalidade === filterModalidade);

  const anvisa = filtered.filter((d) => d.modalidade === "Registro ANVISA");
  const outros = filtered.filter((d) => d.modalidade !== "Registro ANVISA");

  function DeclaracaoRow({ d }: { d: Declaracao }) {
    return (
      <div
        key={d.id}
        data-testid={`row-declaracao-${d.id}`}
        className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{d.paciente_nome ?? "—"}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {d.modalidade ?? "—"}
            {d.data ? ` — ${new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("border text-xs gap-1", statusStyle(d.status))}>
            {d.status === "assinada" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {d.status ?? "pendente"}
          </Badge>
          {d.pdf_url && (
            <a
              href={d.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
              title="Ver PDF"
            >
              <FileText className="h-3.5 w-3.5 text-white/50" />
            </a>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEdit(d)}
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5 text-white/60" />
            </button>
            <button
              onClick={() => setDeleteItem(d)}
              className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function Section({ title, items }: { title: string; items: Declaracao[] }) {
    return (
      <div>
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">{title}</h3>
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-white/30 text-sm">Nenhuma declaração nesta categoria</p>
            </div>
          ) : items.map((d) => <DeclaracaoRow key={d.id} d={d} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Declarações de Ciência</h1>
          <p className="text-white/50 text-sm mt-1">Documentos de ciência do paciente por modalidade</p>
        </div>
        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <SheetTrigger asChild>
            <Button
              data-testid="button-new-declaracao"
              className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Nova Declaração
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white">Nova Declaração de Ciência</SheetTitle>
            </SheetHeader>
            <Form {...newForm}>
              <DeclaracaoForm
                onSubmit={handleCreate}
                isPending={createDeclaracao.isPending}
                submitLabel="Criar Declaração"
                pacientes={pacientes}
              />
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filtro por modalidade */}
      <div className="flex items-center gap-2 flex-wrap">
        {["todas", ...MODALIDADES].map((m) => (
          <button
            key={m}
            onClick={() => setFilterModalidade(m)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filterModalidade === m
                ? "bg-[#F56E0F] text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
            )}
          >
            {m === "todas" ? "Todas" : m}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 bg-white/5 rounded-[14px]" />
          <Skeleton className="h-44 bg-white/5 rounded-[14px]" />
        </div>
      ) : all.length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <FileBadge className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">Nenhuma declaração cadastrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(filterModalidade === "todas" || filterModalidade === "Registro ANVISA") && (
            <Section title="Medicamento com Registro ANVISA" items={anvisa} />
          )}
          {(filterModalidade === "todas" || filterModalidade !== "Registro ANVISA") && outros.length > 0 && (
            <Section title="Outras Modalidades" items={outros} />
          )}
          {filterModalidade !== "todas" && filtered.length === 0 && (
            <Section title={filterModalidade} items={[]} />
          )}
        </div>
      )}

      {/* Sheet de edição */}
      <Sheet open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Declaração</SheetTitle>
          </SheetHeader>
          <Form {...editForm}>
            <DeclaracaoForm
              onSubmit={handleUpdate}
              isPending={updateDeclaracao.isPending}
              submitLabel="Salvar Alterações"
              pacientes={pacientes}
            />
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir declaração?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              A declaração de <span className="text-white font-medium">{deleteItem?.paciente_nome}</span> ({deleteItem?.modalidade}) será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteDeclaracao.isPending}
            >
              {deleteDeclaracao.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
