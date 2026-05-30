import { useState } from "react";
import {
  useListDistribuidoras,
  useCreateDistribuidora,
  useUpdateDistribuidora,
  useDeleteDistribuidora,
  getListDistribuidorasQueryKey,
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
import { Truck, Plus, Phone, Mail, Building2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD = "bg-[#0F0F12] border-white/10 text-white placeholder:text-white/30";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cnpj: z.string().optional(),
  responsavel: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  tipo: z.string().optional(),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Distribuidora = {
  id: string;
  nome: string;
  cnpj?: string | null;
  responsavel?: string | null;
  email?: string | null;
  telefone?: string | null;
  tipo?: string | null;
  status?: string | null;
  created_at: string;
};

const DEFAULT_VALUES: FormValues = {
  nome: "", cnpj: "", responsavel: "", email: "", telefone: "", tipo: "", status: "",
};

function statusColor(status: string | null | undefined) {
  if (status === "ativo" || status === "qualificada") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (status === "pendente") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  if (status === "inativo") return "bg-red-500/15 text-red-400 border-red-500/20";
  return "bg-white/10 text-white/50 border-white/10";
}

function DistribuidoraForm({
  onSubmit,
  isPending,
  submitLabel,
}: {
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { control, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField control={control} name="nome" render={({ field }) => (
        <FormItem><FormLabel className="text-white/70">Razão Social *</FormLabel><FormControl><Input {...field} className={FIELD} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="cnpj" render={({ field }) => (
        <FormItem><FormLabel className="text-white/70">CNPJ</FormLabel><FormControl><Input {...field} placeholder="00.000.000/0000-00" className={FIELD} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={control} name="responsavel" render={({ field }) => (
        <FormItem><FormLabel className="text-white/70">Responsável</FormLabel><FormControl><Input {...field} className={FIELD} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="email" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Email</FormLabel><FormControl><Input {...field} className={FIELD} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="telefone" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Telefone</FormLabel><FormControl><Input {...field} className={FIELD} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={control} name="tipo" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Tipo</FormLabel><FormControl><Input {...field} placeholder="Nacional / Importadora" className={FIELD} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="status" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Status</FormLabel><FormControl><Input {...field} placeholder="ativo / pendente" className={FIELD} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <Button type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={isPending}>
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

export default function Distribuidoras() {
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState<Distribuidora | null>(null);
  const [deleteItem, setDeleteItem] = useState<Distribuidora | null>(null);

  const { data: distribuidoras, isLoading } = useListDistribuidoras();
  const createDistribuidora = useCreateDistribuidora();
  const updateDistribuidora = useUpdateDistribuidora();
  const deleteDistribuidora = useDeleteDistribuidora();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const newForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListDistribuidorasQueryKey() });
  }

  function openEdit(d: Distribuidora) {
    setEditItem(d);
    editForm.reset({
      nome: d.nome ?? "",
      cnpj: d.cnpj ?? "",
      responsavel: d.responsavel ?? "",
      email: d.email ?? "",
      telefone: d.telefone ?? "",
      tipo: d.tipo ?? "",
      status: d.status ?? "",
    });
  }

  function handleCreate(values: FormValues) {
    createDistribuidora.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Distribuidora cadastrada." });
        invalidate();
        setOpenNew(false);
        newForm.reset(DEFAULT_VALUES);
      },
      onError: () => toast({ title: "Erro ao cadastrar distribuidora.", variant: "destructive" }),
    });
  }

  function handleUpdate(values: FormValues) {
    if (!editItem) return;
    updateDistribuidora.mutate({ id: editItem.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Distribuidora atualizada." });
        invalidate();
        setEditItem(null);
      },
      onError: () => toast({ title: "Erro ao atualizar distribuidora.", variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteDistribuidora.mutate({ id: deleteItem.id }, {
      onSuccess: () => {
        toast({ title: "Distribuidora excluída." });
        invalidate();
        setDeleteItem(null);
      },
      onError: () => toast({ title: "Erro ao excluir distribuidora.", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Distribuidoras</h1>
          <p className="text-white/50 text-sm mt-1">Parceiros e fornecedores nacionais</p>
        </div>
        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <SheetTrigger asChild>
            <Button
              data-testid="button-new-distribuidora"
              className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Nova Distribuidora
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white">Cadastrar Distribuidora</SheetTitle>
            </SheetHeader>
            <Form {...newForm}>
              <DistribuidoraForm
                onSubmit={handleCreate}
                isPending={createDistribuidora.isPending}
                submitLabel="Cadastrar Distribuidora"
              />
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 bg-white/5 rounded-[14px]" />)}
        </div>
      ) : (distribuidoras ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <Truck className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">Nenhuma distribuidora cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(distribuidoras as Distribuidora[] ?? []).map((d) => (
            <div
              key={d.id}
              data-testid={`card-distribuidora-${d.id}`}
              className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 bg-[#F56E0F]/15 rounded-xl flex items-center justify-center">
                  <Truck className="h-5 w-5 text-[#F56E0F]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn("text-xs border", statusColor(d.status))}>
                    {d.status ?? "pendente"}
                  </Badge>
                  {/* Ações hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(d)}
                      className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white/60" />
                    </button>
                    <button
                      onClick={() => setDeleteItem(d)}
                      className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>

              <h3 className="text-white font-semibold">{d.nome}</h3>
              {d.cnpj && <p className="text-white/40 text-xs mt-1">{d.cnpj}</p>}

              <div className="mt-3 space-y-1.5">
                {d.responsavel && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Building2 className="h-3 w-3 shrink-0" /><span>{d.responsavel}</span>
                  </div>
                )}
                {d.email && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Mail className="h-3 w-3 shrink-0" /><span>{d.email}</span>
                  </div>
                )}
                {d.telefone && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Phone className="h-3 w-3 shrink-0" /><span>{d.telefone}</span>
                  </div>
                )}
              </div>
              {d.tipo && (
                <Badge className="mt-3 bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">{d.tipo}</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sheet de edição */}
      <Sheet open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Distribuidora</SheetTitle>
          </SheetHeader>
          <Form {...editForm}>
            <DistribuidoraForm
              onSubmit={handleUpdate}
              isPending={updateDistribuidora.isPending}
              submitLabel="Salvar Alterações"
            />
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir distribuidora?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              A distribuidora <span className="text-white font-medium">{deleteItem?.nome}</span> será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteDistribuidora.isPending}
            >
              {deleteDistribuidora.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
