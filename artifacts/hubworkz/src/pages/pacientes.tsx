import { useState } from "react";
import {
  useListPacientes,
  useCreatePaciente,
  useUpdatePaciente,
  useDeletePaciente,
  getListPacientesQueryKey,
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
import { Search, Users, Plus, FileCheck, Pencil, Trash2 } from "lucide-react";

const FIELD = "bg-[#0F0F12] border-white/10 text-white placeholder:text-white/30";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().optional(),
  data_nascimento: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  convenio: z.string().optional(),
  numero_carteirinha: z.string().optional(),
  diagnostico: z.string().optional(),
  cid: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Paciente = {
  id: string;
  nome: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  convenio?: string | null;
  numero_carteirinha?: string | null;
  diagnostico?: string | null;
  cid?: string | null;
  mandato_ativo?: boolean | null;
  created_at: string;
};

const DEFAULT: FormValues = {
  nome: "", cpf: "", data_nascimento: "", email: "", telefone: "",
  endereco: "", convenio: "", numero_carteirinha: "", diagnostico: "", cid: "",
};

function PacienteForm({
  onSubmit,
  isPending,
  submitLabel,
}: {
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Dados Pessoais</p>
        <FormField control={control} name="nome" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Nome Completo *</FormLabel><FormControl>
            <Input data-testid="input-nome-paciente" {...field} className={FIELD} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={control} name="cpf" render={({ field }) => (
            <FormItem><FormLabel className="text-white/70">CPF</FormLabel><FormControl>
              <Input data-testid="input-cpf-paciente" {...field} placeholder="000.000.000-00" className={FIELD} />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="data_nascimento" render={({ field }) => (
            <FormItem><FormLabel className="text-white/70">Nascimento</FormLabel><FormControl>
              <Input data-testid="input-nascimento-paciente" {...field} type="date" className={FIELD} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={control} name="email" render={({ field }) => (
            <FormItem><FormLabel className="text-white/70">Email</FormLabel><FormControl>
              <Input data-testid="input-email-paciente" {...field} className={FIELD} />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="telefone" render={({ field }) => (
            <FormItem><FormLabel className="text-white/70">Telefone</FormLabel><FormControl>
              <Input data-testid="input-telefone-paciente" {...field} className={FIELD} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={control} name="endereco" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Endereço</FormLabel><FormControl>
            <Input data-testid="input-endereco-paciente" {...field} placeholder="Rua, número, bairro, cidade — UF" className={FIELD} />
          </FormControl><FormMessage /></FormItem>
        )} />
      </div>

      <div className="space-y-4">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Convênio</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={control} name="convenio" render={({ field }) => (
            <FormItem><FormLabel className="text-white/70">Convênio</FormLabel><FormControl>
              <Input data-testid="input-convenio-paciente" {...field} className={FIELD} />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="numero_carteirinha" render={({ field }) => (
            <FormItem><FormLabel className="text-white/70">N° Carteirinha</FormLabel><FormControl>
              <Input {...field} className={FIELD} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Dados Clínicos</p>
        <FormField control={control} name="diagnostico" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">Diagnóstico</FormLabel><FormControl>
            <Input data-testid="input-diagnostico-paciente" {...field} className={FIELD} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name="cid" render={({ field }) => (
          <FormItem><FormLabel className="text-white/70">CID</FormLabel><FormControl>
            <Input {...field} placeholder="C00-C99" className={FIELD} />
          </FormControl><FormMessage /></FormItem>
        )} />
      </div>

      <Button
        data-testid="button-submit-paciente"
        type="submit"
        className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
        disabled={isPending}
      >
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

export default function Pacientes() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState<Paciente | null>(null);
  const [deleteItem, setDeleteItem] = useState<Paciente | null>(null);

  const { data: pacientes, isLoading } = useListPacientes({ search: search || undefined });
  const createPaciente = useCreatePaciente();
  const updatePaciente = useUpdatePaciente();
  const deletePaciente = useDeletePaciente();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const newForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT });
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListPacientesQueryKey() });
  }

  function openEdit(p: Paciente) {
    setEditItem(p);
    editForm.reset({
      nome: p.nome ?? "",
      cpf: p.cpf ?? "",
      data_nascimento: p.data_nascimento ?? "",
      email: p.email ?? "",
      telefone: p.telefone ?? "",
      endereco: p.endereco ?? "",
      convenio: p.convenio ?? "",
      numero_carteirinha: p.numero_carteirinha ?? "",
      diagnostico: p.diagnostico ?? "",
      cid: p.cid ?? "",
    });
  }

  function handleCreate(values: FormValues) {
    createPaciente.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Paciente cadastrado com sucesso." });
        invalidate();
        setOpenNew(false);
        newForm.reset(DEFAULT);
      },
      onError: () => toast({ title: "Erro ao cadastrar paciente.", variant: "destructive" }),
    });
  }

  function handleUpdate(values: FormValues) {
    if (!editItem) return;
    updatePaciente.mutate({ id: editItem.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Paciente atualizado." });
        invalidate();
        setEditItem(null);
      },
      onError: () => toast({ title: "Erro ao atualizar paciente.", variant: "destructive" }),
    });
  }

  function handleDelete() {
    if (!deleteItem) return;
    deletePaciente.mutate({ id: deleteItem.id }, {
      onSuccess: () => {
        toast({ title: "Paciente excluído." });
        invalidate();
        setDeleteItem(null);
      },
      onError: () => toast({ title: "Erro ao excluir paciente.", variant: "destructive" }),
    });
  }

  const list = (pacientes as Paciente[] ?? []);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pacientes</h1>
          <p className="text-white/50 text-sm mt-1">{list.length} paciente{list.length !== 1 ? "s" : ""} cadastrado{list.length !== 1 ? "s" : ""}</p>
        </div>
        <Sheet open={openNew} onOpenChange={setOpenNew}>
          <SheetTrigger asChild>
            <Button data-testid="button-new-paciente" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
              <Plus className="h-4 w-4" /> Novo Paciente
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white">Cadastrar Paciente</SheetTitle>
            </SheetHeader>
            <Form {...newForm}>
              <PacienteForm onSubmit={handleCreate} isPending={createPaciente.isPending} submitLabel="Cadastrar Paciente" />
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <Input
          data-testid="input-search-pacientes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente por nome..."
          className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Tabela */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span>Paciente</span>
          <span className="w-40">Convênio</span>
          <span className="w-24 text-center">CID</span>
          <span className="w-24 text-center">Mandato</span>
          <span className="w-20 text-center">Ações</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 bg-white/5" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">{search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</p>
          </div>
        ) : (
          list.map((p) => (
            <div
              key={p.id}
              data-testid={`row-paciente-${p.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
            >
              <div>
                <p className="text-white font-medium">{p.nome}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {p.cpf ? `CPF: ${p.cpf}` : (p.email ?? p.telefone ?? "—")}
                </p>
              </div>
              <div className="w-40">
                <p className="text-white/70 text-sm">{p.convenio ?? "—"}</p>
                {p.numero_carteirinha && <p className="text-white/30 text-xs">{p.numero_carteirinha}</p>}
              </div>
              <div className="w-24 text-center">
                <span className="text-white/60 text-sm">{p.cid ?? "—"}</span>
              </div>
              <div className="w-24 flex justify-center">
                <Badge className={p.mandato_ativo
                  ? "bg-green-500/15 text-green-400 border-green-500/20 text-xs"
                  : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs"
                }>
                  <FileCheck className="h-3 w-3 mr-1" />
                  {p.mandato_ativo ? "Ativo" : "Pendente"}
                </Badge>
              </div>
              <div className="w-20 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(p)}
                  className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5 text-white/60" />
                </button>
                <button
                  onClick={() => setDeleteItem(p)}
                  className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sheet de edição */}
      <Sheet open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Paciente</SheetTitle>
          </SheetHeader>
          <Form {...editForm}>
            <PacienteForm onSubmit={handleUpdate} isPending={updatePaciente.isPending} submitLabel="Salvar Alterações" />
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O paciente <span className="text-white font-medium">{deleteItem?.nome}</span> será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletePaciente.isPending}
            >
              {deletePaciente.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
