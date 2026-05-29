import { useState } from "react";
import { useListDistribuidoras, useGetDistribuidora, useCreateDistribuidora, getListDistribuidorasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Phone, Mail, Building2, FileText, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cnpj: z.string().optional(),
  responsavel: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  tipo: z.string().optional(),
});

export default function Distribuidoras() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: distribuidoras, isLoading } = useListDistribuidoras();
  const { data: selected } = useGetDistribuidora(selectedId ?? "", { query: { enabled: !!selectedId, queryKey: useGetDistribuidora.bind(null, selectedId ?? "") as any } });
  const createDistribuidora = useCreateDistribuidora();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", cnpj: "", responsavel: "", email: "", telefone: "", tipo: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createDistribuidora.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Distribuidora cadastrada!" });
        queryClient.invalidateQueries({ queryKey: getListDistribuidorasQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
    });
  };

  const statusColor = (status: string | null | undefined) => {
    if (status === "ativo" || status === "qualificada") return "bg-green-500/15 text-green-400 border-green-500/20";
    if (status === "pendente") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
    return "bg-white/10 text-white/50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Distribuidoras</h1>
          <p className="text-white/50 text-sm mt-1">Parceiros e fornecedores nacionais</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button data-testid="button-new-distribuidora" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
              <Plus className="h-4 w-4" /> Nova Distribuidora
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]">
            <SheetHeader className="mb-6"><SheetTitle className="text-white">Cadastrar Distribuidora</SheetTitle></SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Razão Social *</FormLabel><FormControl><Input data-testid="input-nome-distribuidora" {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">CNPJ</FormLabel><FormControl><Input {...field} placeholder="00.000.000/0000-00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="responsavel" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Responsável</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Email</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="telefone" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Telefone</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem><FormLabel className="text-white/70">Tipo</FormLabel><FormControl><Input {...field} placeholder="Nacional / Importadora" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button data-testid="button-submit-distribuidora" type="submit" className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={createDistribuidora.isPending}>
                  {createDistribuidora.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 bg-white/5 rounded-[14px]" />)}
        </div>
      ) : (distribuidoras ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <Truck className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">Nenhuma distribuidora cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(distribuidoras ?? []).map((d) => (
            <div key={d.id} data-testid={`card-distribuidora-${d.id}`} onClick={() => setSelectedId(d.id)} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 hover:border-[#F56E0F]/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 bg-[#F56E0F]/15 rounded-xl flex items-center justify-center">
                  <Truck className="h-5 w-5 text-[#F56E0F]" />
                </div>
                <Badge className={cn("text-xs border", statusColor(d.status))}>{d.status ?? "pendente"}</Badge>
              </div>
              <h3 className="text-white font-semibold">{d.nome}</h3>
              {d.cnpj && <p className="text-white/40 text-xs mt-1">{d.cnpj}</p>}
              <div className="mt-4 space-y-1.5">
                {d.responsavel && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Building2 className="h-3 w-3" /><span>{d.responsavel}</span>
                  </div>
                )}
                {d.email && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Mail className="h-3 w-3" /><span>{d.email}</span>
                  </div>
                )}
                {d.telefone && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Phone className="h-3 w-3" /><span>{d.telefone}</span>
                  </div>
                )}
              </div>
              {d.tipo && <Badge className="mt-3 bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">{d.tipo}</Badge>}
            </div>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[520px] sm:max-w-[520px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">{selected?.nome ?? "Distribuidora"}</SheetTitle>
          </SheetHeader>
          {selected && (
            <Tabs defaultValue="dados">
              <TabsList className="bg-[#0F0F12] border border-white/10 mb-6">
                <TabsTrigger value="dados" className="data-[state=active]:bg-[#F56E0F]/20 data-[state=active]:text-[#F56E0F]">Dados</TabsTrigger>
                <TabsTrigger value="contato" className="data-[state=active]:bg-[#F56E0F]/20 data-[state=active]:text-[#F56E0F]">Contato</TabsTrigger>
                <TabsTrigger value="nf" className="data-[state=active]:bg-[#F56E0F]/20 data-[state=active]:text-[#F56E0F]">NF</TabsTrigger>
                <TabsTrigger value="rastreio" className="data-[state=active]:bg-[#F56E0F]/20 data-[state=active]:text-[#F56E0F]">Rastreio</TabsTrigger>
              </TabsList>
              <TabsContent value="dados">
                <div className="space-y-3 bg-[#0F0F12] rounded-xl p-5">
                  {[
                    { label: "Razão Social", value: selected.nome },
                    { label: "CNPJ", value: selected.cnpj ?? "—" },
                    { label: "Tipo", value: selected.tipo ?? "—" },
                    { label: "Status", value: selected.status ?? "—" },
                    { label: "Cadastrado em", value: new Date(selected.created_at).toLocaleDateString("pt-BR") },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/40 text-sm">{label}</span>
                      <span className="text-white text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="contato">
                <div className="space-y-4 bg-[#0F0F12] rounded-xl p-5">
                  {[
                    { icon: Building2, label: "Responsável", value: selected.responsavel ?? "—" },
                    { icon: Mail, label: "Email", value: selected.email ?? "—" },
                    { icon: Phone, label: "Telefone", value: selected.telefone ?? "—" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center">
                        <Icon className="h-4 w-4 text-white/40" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">{label}</p>
                        <p className="text-white text-sm">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="nf">
                <div className="py-8 text-center">
                  <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Notas fiscais serão exibidas aqui</p>
                </div>
              </TabsContent>
              <TabsContent value="rastreio">
                <div className="py-8 text-center">
                  <MapPin className="h-10 w-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Informações de rastreio serão exibidas aqui</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
