import { useState } from "react";
import {
  useListMedicamentos,
  useCreateMedicamento,
  useUpdateMedicamento,
  useDeleteMedicamento,
  getListMedicamentosQueryKey,
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
import { Search, Pill, Plus, Thermometer, BookOpen, Pencil, Trash2, FlaskConical } from "lucide-react";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  principio_ativo: z.string().optional(),
  apresentacao: z.string().optional(),
  modo_uso: z.string().optional(),
  conservacao: z.string().optional(),
  registro: z.string().optional(),
  classe: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Medicamento = {
  id: string;
  nome: string;
  principio_ativo?: string | null;
  apresentacao?: string | null;
  modo_uso?: string | null;
  conservacao?: string | null;
  registro?: string | null;
  classe?: string | null;
  ativo?: boolean | null;
  created_at: string;
};

const FIELD_STYLES = "bg-[#0F0F12] border-white/10 text-white placeholder:text-white/30";

function MedicamentoForm({
  onSubmit,
  isPending,
  submitLabel,
}: {
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const form = useFormContext<FormValues>();
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField control={form.control} name="nome" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Nome Comercial *</FormLabel>
          <FormControl><Input {...field} className={FIELD_STYLES} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="principio_ativo" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Princípio Ativo</FormLabel>
          <FormControl><Input {...field} className={FIELD_STYLES} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="apresentacao" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Apresentação</FormLabel>
          <FormControl><Input {...field} placeholder="Ex: 100mg/mL - 10mL" className={FIELD_STYLES} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="modo_uso" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Modo de Uso</FormLabel>
          <FormControl><Input {...field} className={FIELD_STYLES} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="conservacao" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white/70">Conservação</FormLabel>
          <FormControl><Input {...field} placeholder="Ex: Refrigerado 2-8°C" className={FIELD_STYLES} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="registro" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Registro ANVISA</FormLabel>
            <FormControl><Input {...field} className={FIELD_STYLES} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="classe" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Classe</FormLabel>
            <FormControl><Input {...field} placeholder="Ex: Oncológico" className={FIELD_STYLES} /></FormControl>
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

import { useFormContext } from "react-hook-form";
import { FormProvider } from "react-hook-form";

export default function Medicamentos() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState<Medicamento | null>(null);
  const [deleteItem, setDeleteItem] = useState<Medicamento | null>(null);

  const { data: medicamentos, isLoading } = useListMedicamentos({ search: search || undefined });
  const createMedicamento = useCreateMedicamento();
  const updateMedicamento = useUpdateMedicamento();
  const deleteMedicamento = useDeleteMedicamento();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListMedicamentosQueryKey() });

  const newForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", principio_ativo: "", apresentacao: "", modo_uso: "", conservacao: "", registro: "", classe: "" },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", principio_ativo: "", apresentacao: "", modo_uso: "", conservacao: "", registro: "", classe: "" },
  });

  function openEdit(m: Medicamento) {
    setEditItem(m);
    editForm.reset({
      nome: m.nome,
      principio_ativo: m.principio_ativo ?? "",
      apresentacao: m.apresentacao ?? "",
      modo_uso: m.modo_uso ?? "",
      conservacao: m.conservacao ?? "",
      registro: m.registro ?? "",
      classe: m.classe ?? "",
    });
  }

  function handleCreate(values: FormValues) {
    createMedicamento.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Medicamento cadastrado com sucesso." });
        invalidate();
        setOpenNew(false);
        newForm.reset();
      },
      onError: () => toast({ title: "Erro ao cadastrar medicamento.", variant: "destructive" }),
    });
  }

  function handleUpdate(values: FormValues) {
    if (!editItem) return;
    updateMedicamento.mutate({ id: editItem.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Medicamento atualizado." });
        invalidate();
        setEditItem(null);
      },
      onError: () => toast({ title: "Erro ao atualizar medicamento.", variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteMedicamento.mutate({ id: deleteItem.id }, {
      onSuccess: () => {
        toast({ title: "Medicamento excluído." });
        invalidate();
        setDeleteItem(null);
      },
      onError: () => toast({ title: "Erro ao excluir medicamento.", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Medicamentos</h1>
          <p className="text-white/50 text-sm mt-1">Catálogo de medicamentos oncológicos</p>
        </div>
        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <SheetTrigger asChild>
            <Button
              data-testid="button-new-medicamento"
              className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Novo Medicamento
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[500px] sm:max-w-[500px]">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white">Cadastrar Medicamento</SheetTitle>
            </SheetHeader>
            <FormProvider {...newForm}>
              <MedicamentoForm
                onSubmit={handleCreate}
                isPending={createMedicamento.isPending}
                submitLabel="Cadastrar Medicamento"
              />
            </FormProvider>
          </SheetContent>
        </Sheet>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <Input
          data-testid="input-search-medicamentos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar medicamento..."
          className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 bg-white/5 rounded-[14px]" />
          ))}
        </div>
      ) : (medicamentos ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <Pill className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">{search ? "Nenhum medicamento encontrado" : "Catálogo vazio"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(medicamentos as Medicamento[] ?? []).map((m) => (
            <div
              key={m.id}
              data-testid={`card-medicamento-${m.id}`}
              className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 bg-[#F56E0F]/15 rounded-xl flex items-center justify-center">
                  <Pill className="h-5 w-5 text-[#F56E0F]" />
                </div>
                <div className="flex items-center gap-1.5">
                  {m.classe && (
                    <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">{m.classe}</Badge>
                  )}
                  {/* Ações — visíveis no hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(m)}
                      className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white/60" />
                    </button>
                    <button
                      onClick={() => setDeleteItem(m)}
                      className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>

              <h3 className="text-white font-semibold text-sm">{m.nome}</h3>
              {m.principio_ativo && (
                <p className="text-white/50 text-xs mt-1">{m.principio_ativo}</p>
              )}

              <div className="mt-4 space-y-2">
                {m.apresentacao && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span>{m.apresentacao}</span>
                  </div>
                )}
                {m.modo_uso && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <FlaskConical className="h-3 w-3 shrink-0" />
                    <span>{m.modo_uso}</span>
                  </div>
                )}
                {m.conservacao && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Thermometer className="h-3 w-3 shrink-0" />
                    <span>{m.conservacao}</span>
                  </div>
                )}
                {m.registro && (
                  <div className="mt-3">
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">
                      ANVISA: {m.registro}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet de edição */}
      <Sheet open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[500px] sm:max-w-[500px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Medicamento</SheetTitle>
          </SheetHeader>
          <FormProvider {...editForm}>
            <MedicamentoForm
              onSubmit={handleUpdate}
              isPending={updateMedicamento.isPending}
              submitLabel="Salvar Alterações"
            />
          </FormProvider>
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir medicamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O medicamento <span className="text-white font-medium">{deleteItem?.nome}</span> será removido permanentemente do catálogo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMedicamento.isPending}
            >
              {deleteMedicamento.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
