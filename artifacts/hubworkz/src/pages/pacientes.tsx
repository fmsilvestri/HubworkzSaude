import { useState } from "react";
import { useListPacientes, useCreatePaciente, getListPacientesQueryKey } from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Plus, FileCheck } from "lucide-react";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().optional(),
  data_nascimento: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  convenio: z.string().optional(),
  numero_carteirinha: z.string().optional(),
  diagnostico: z.string().optional(),
  cid: z.string().optional(),
  clinica_id: z.string().default("default"),
});

type FormValues = z.infer<typeof schema>;

export default function Pacientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: pacientes, isLoading } = useListPacientes({ search: search || undefined });
  const createPaciente = useCreatePaciente();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", cpf: "", email: "", telefone: "", convenio: "", numero_carteirinha: "", diagnostico: "", cid: "", clinica_id: "default" },
  });

  const onSubmit = (values: FormValues) => {
    createPaciente.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Paciente cadastrado com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getListPacientesQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Erro ao cadastrar paciente", variant: "destructive" }),
    });
  };

  const filtered = (pacientes ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pacientes</h1>
          <p className="text-white/50 text-sm mt-1">{filtered.length} pacientes cadastrados</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button data-testid="button-new-paciente" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
              <Plus className="h-4 w-4" /> Novo Paciente
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white">Cadastrar Paciente</SheetTitle>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Dados Pessoais</p>
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Nome Completo *</FormLabel><FormControl><Input data-testid="input-nome-paciente" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="cpf" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">CPF</FormLabel><FormControl><Input data-testid="input-cpf-paciente" {...field} placeholder="000.000.000-00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="data_nascimento" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">Data de Nascimento</FormLabel><FormControl><Input data-testid="input-nascimento-paciente" {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">Email</FormLabel><FormControl><Input data-testid="input-email-paciente" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="telefone" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">Telefone</FormLabel><FormControl><Input data-testid="input-telefone-paciente" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
                {/* Convênio */}
                <div className="space-y-4">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Convênio</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="convenio" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">Convênio</FormLabel><FormControl><Input data-testid="input-convenio-paciente" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="numero_carteirinha" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">N° Carteirinha</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
                {/* Clínico */}
                <div className="space-y-4">
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Dados Clínicos</p>
                  <FormField control={form.control} name="diagnostico" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Diagnóstico</FormLabel><FormControl><Input data-testid="input-diagnostico-paciente" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cid" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">CID</FormLabel><FormControl><Input {...field} placeholder="C00-C99" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button data-testid="button-submit-paciente" type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={createPaciente.isPending}>
                  {createPaciente.isPending ? "Salvando..." : "Cadastrar Paciente"}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <Input data-testid="input-search-pacientes" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente por nome..." className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30" />
      </div>

      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span>Paciente</span>
          <span className="w-40">Convênio</span>
          <span className="w-32 text-center">Diagnóstico</span>
          <span className="w-24 text-center">Mandato</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 bg-white/5" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">{search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} data-testid={`row-paciente-${p.id}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <div>
                <p className="text-white font-medium">{p.nome}</p>
                <p className="text-white/40 text-xs mt-0.5">{p.email ?? p.telefone ?? "—"}</p>
              </div>
              <div className="w-40">
                <p className="text-white/70 text-sm">{p.convenio ?? "—"}</p>
                <p className="text-white/30 text-xs">{p.numero_carteirinha ?? "—"}</p>
              </div>
              <div className="w-32 text-center">
                <p className="text-white/60 text-sm">{p.cid ?? "—"}</p>
              </div>
              <div className="w-24 flex justify-center">
                <Badge className={p.mandato_ativo ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"}>
                  <FileCheck className="h-3 w-3 mr-1" />
                  {p.mandato_ativo ? "Ativo" : "Pendente"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
