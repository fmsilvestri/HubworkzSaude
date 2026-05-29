import { useState } from "react";
import { useListMedicamentos, useCreateMedicamento, getListMedicamentosQueryKey } from "@workspace/api-client-react";
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
import { Search, Pill, Plus, Thermometer, BookOpen } from "lucide-react";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  principio_ativo: z.string().optional(),
  apresentacao: z.string().optional(),
  modo_uso: z.string().optional(),
  conservacao: z.string().optional(),
  registro_anvisa: z.string().optional(),
  categoria: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Medicamentos() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: medicamentos, isLoading } = useListMedicamentos({ search: search || undefined });
  const createMedicamento = useCreateMedicamento();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", principio_ativo: "", apresentacao: "", modo_uso: "", conservacao: "", registro_anvisa: "", categoria: "" },
  });

  const onSubmit = (values: FormValues) => {
    createMedicamento.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Medicamento cadastrado!" });
        queryClient.invalidateQueries({ queryKey: getListMedicamentosQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Erro ao cadastrar medicamento", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Medicamentos</h1>
          <p className="text-white/50 text-sm mt-1">Catálogo de medicamentos oncológicos</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button data-testid="button-new-medicamento" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
              <Plus className="h-4 w-4" /> Novo Medicamento
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[500px] sm:max-w-[500px]">
            <SheetHeader className="mb-6"><SheetTitle className="text-white">Cadastrar Medicamento</SheetTitle></SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Nome Comercial *</FormLabel><FormControl><Input data-testid="input-nome-medicamento" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="principio_ativo" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Princípio Ativo</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="apresentacao" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Apresentação</FormLabel><FormControl><Input {...field} placeholder="Ex: 100mg/mL - 10mL" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="modo_uso" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Modo de Uso</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="conservacao" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Conservação</FormLabel><FormControl><Input {...field} placeholder="Ex: Refrigerado 2-8°C" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="registro_anvisa" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Registro ANVISA</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="categoria" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Categoria</FormLabel><FormControl><Input {...field} placeholder="Ex: Oncológico" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button data-testid="button-submit-medicamento" type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={createMedicamento.isPending}>
                  {createMedicamento.isPending ? "Salvando..." : "Cadastrar Medicamento"}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <Input data-testid="input-search-medicamentos" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar medicamento..." className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 bg-white/5 rounded-[14px]" />)}
        </div>
      ) : (medicamentos ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <Pill className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">{search ? "Nenhum medicamento encontrado" : "Catálogo vazio"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(medicamentos ?? []).map((m) => (
            <div key={m.id} data-testid={`card-medicamento-${m.id}`} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 bg-[#F56E0F]/15 rounded-xl flex items-center justify-center">
                  <Pill className="h-5 w-5 text-[#F56E0F]" />
                </div>
                {m.categoria && <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">{m.categoria}</Badge>}
              </div>
              <h3 className="text-white font-semibold text-sm">{m.nome}</h3>
              {m.principio_ativo && <p className="text-white/50 text-xs mt-1">{m.principio_ativo}</p>}
              <div className="mt-4 space-y-2">
                {m.apresentacao && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span>{m.apresentacao}</span>
                  </div>
                )}
                {m.conservacao && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Thermometer className="h-3 w-3 shrink-0" />
                    <span>{m.conservacao}</span>
                  </div>
                )}
                {m.registro_anvisa && (
                  <div className="mt-3">
                    <Badge className={m.registro_anvisa ? "bg-green-500/15 text-green-400 border-green-500/20 text-xs" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs"}>
                      ANVISA: {m.registro_anvisa}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
