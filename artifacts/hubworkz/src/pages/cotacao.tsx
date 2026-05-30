import { useState } from "react";
import {
  useListCotacoes,
  useCreateCotacao,
  getListCotacoesQueryKey,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["pendente", "aprovado", "reprovado", "não apresentado"];
const TIPO_OPTIONS = ["comp", "fa", "outro"];

const STATUS_STYLE: Record<string, string> = {
  aprovado: "bg-green-500/15 text-green-400 border-green-500/20",
  reprovado: "bg-red-500/15 text-red-400 border-red-500/20",
  pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "não apresentado": "bg-white/10 text-white/40 border-white/10",
};

function normalizeStatus(s: string | null | undefined): string {
  if (!s) return "pendente";
  const lower = s.trim().toLowerCase().replace("á", "a");
  if (lower.includes("aprov")) return "aprovado";
  if (lower.includes("reprov")) return "reprovado";
  if (lower.includes("apresent")) return "não apresentado";
  return lower;
}

function fmt(v: number | null | undefined) {
  if (v == null) return "—";
  return `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const schema = z.object({
  data_cotacao: z.string().optional(),
  nome_paciente: z.string().min(1, "Informe o nome do paciente"),
  origem_paciente: z.string().optional(),
  convenio: z.string().optional(),
  medicamento_nome: z.string().min(1, "Informe o medicamento"),
  tipo: z.string().optional(),
  marca_laboratorio: z.string().optional(),
  valor_importado: z.string().optional(),
  frete_imposto: z.string().optional(),
  total: z.string().optional(),
  valor_noova: z.string().optional(),
  valor_brasindice: z.string().optional(),
  valor_enviado_convenio: z.string().optional(),
  data_envio: z.string().optional(),
  status: z.string().default("pendente"),
  valor_aprovado: z.string().optional(),
  imposto: z.string().optional(),
  resultado: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function parseNum(s: string | undefined) {
  if (!s) return undefined;
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? undefined : n;
}

export default function Cotacao() {
  const [statusFiltro, setStatusFiltro] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const { data: cotacoes, isLoading } = useListCotacoes({
    status: statusFiltro || undefined,
  });
  const createCotacao = useCreateCotacao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "pendente", tipo: "comp" },
  });

  const onSubmit = (values: FormValues) => {
    createCotacao.mutate(
      {
        data: {
          data_cotacao: values.data_cotacao || undefined,
          nome_paciente: values.nome_paciente,
          origem_paciente: values.origem_paciente || undefined,
          convenio: values.convenio || undefined,
          medicamento_nome: values.medicamento_nome,
          tipo: values.tipo || undefined,
          marca_laboratorio: values.marca_laboratorio || undefined,
          valor_importado: values.valor_importado || undefined,
          frete_imposto: values.frete_imposto || undefined,
          total: parseNum(values.total),
          valor_noova: parseNum(values.valor_noova),
          valor_brasindice: parseNum(values.valor_brasindice),
          valor_enviado_convenio: parseNum(values.valor_enviado_convenio),
          data_envio: values.data_envio || undefined,
          status: values.status,
          valor_aprovado: parseNum(values.valor_aprovado),
          imposto: parseNum(values.imposto),
          resultado: parseNum(values.resultado),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Cotação registrada!" });
          queryClient.invalidateQueries({ queryKey: getListCotacoesQueryKey() });
          form.reset({ status: "pendente", tipo: "comp" });
          setOpenDialog(false);
        },
        onError: () =>
          toast({ title: "Erro ao registrar cotação", variant: "destructive" }),
      },
    );
  };

  const list = cotacoes ?? [];

  // Stats
  const aprovadas = list.filter((c) => normalizeStatus(c.status) === "aprovado");
  const reprovadas = list.filter((c) => normalizeStatus(c.status) === "reprovado");
  const totalAprovado = aprovadas.reduce((s, c) => s + (Number(c.valor_aprovado) || 0), 0);
  const totalNoova = list.reduce((s, c) => s + (Number(c.valor_noova) || 0), 0);
  const totalResultado = list.reduce((s, c) => s + (Number(c.resultado) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orçamento / Cotação</h1>
          <p className="text-white/50 text-sm mt-1">
            Controle de preços e aprovações por convênio
          </p>
        </div>
        <Button
          onClick={() => setOpenDialog(true)}
          data-testid="button-nova-cotacao"
          className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Cotação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            value: list.length,
            icon: FileText,
            color: "text-white/60",
            bg: "bg-white/5",
          },
          {
            label: "Aprovadas",
            value: aprovadas.length,
            icon: CheckCircle2,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "Reprovadas",
            value: reprovadas.length,
            icon: XCircle,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Pendentes",
            value: list.filter((c) => normalizeStatus(c.status) === "pendente").length,
            icon: Clock,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#1B1B1E] border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
              <p className="text-white/40 text-xs">{label}</p>
              <p className="text-white font-bold text-lg">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Valor Total Noova", value: totalNoova, color: "text-[#F56E0F]" },
          { label: "Valor Total Aprovado", value: totalAprovado, color: "text-green-400" },
          { label: "Resultado Total", value: totalResultado, color: totalResultado >= 0 ? "text-[#A5FFD6]" : "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1B1B1E] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
            <TrendingUp className={cn("h-4 w-4 shrink-0", color)} />
            <div>
              <p className="text-white/40 text-xs">{label}</p>
              <p className={cn("font-bold text-sm", color)}>
                R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFiltro || "__all__"}
          onValueChange={(v) => setStatusFiltro(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-48 bg-[#1B1B1E] border-white/10 text-white">
            <SelectValue placeholder="Todos os status..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="__all__" className="text-white/60">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusFiltro && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFiltro("")} className="text-white/40 hover:text-white">
            Limpar filtro
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto_auto_auto] text-xs text-white/40 uppercase tracking-wider px-4 py-3 border-b border-white/5 gap-2">
          <span>Paciente / Medicamento</span>
          <span>Convênio / Origem</span>
          <span className="w-24 text-right">V. Noova</span>
          <span className="w-24 text-right">V. Brasindice</span>
          <span className="w-28 text-right">V. Enviado</span>
          <span className="w-24 text-right">V. Aprovado</span>
          <span className="w-24 text-right">Resultado</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-6"></span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 bg-white/5" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhuma cotação registrada</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenDialog(true)}
              className="mt-3 text-[#F56E0F] hover:text-[#F56E0F]/80"
            >
              Registrar primeira cotação
            </Button>
          </div>
        ) : (
          list.map((c) => {
            const st = normalizeStatus(c.status);
            const isExpanded = expandedId === c.id;
            const resultado = c.resultado ?? ((c.valor_aprovado ?? 0) - (c.valor_noova ?? 0) - (c.imposto ?? 0));

            return (
              <div key={c.id} data-testid={`row-cotacao-${c.id}`}>
                {/* Main row */}
                <div
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto_auto_auto] items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors gap-2 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {c.nome_paciente ?? "—"}
                    </p>
                    <p className="text-white/40 text-xs truncate">
                      {c.medicamento_nome ?? "—"}
                      {c.tipo ? ` · ${c.tipo}` : ""}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-white/70 text-sm truncate">{c.convenio ?? "—"}</p>
                    <p className="text-white/40 text-xs truncate">{c.origem_paciente ?? "—"}</p>
                  </div>

                  <span className="w-24 text-right text-white text-sm font-medium">
                    {fmt(c.valor_noova)}
                  </span>
                  <span className="w-24 text-right text-white/60 text-sm">
                    {fmt(c.valor_brasindice)}
                  </span>
                  <span className="w-28 text-right text-white/60 text-sm">
                    {fmt(c.valor_enviado_convenio)}
                  </span>
                  <span className="w-24 text-right text-green-400 text-sm font-medium">
                    {fmt(c.valor_aprovado)}
                  </span>
                  <span
                    className={cn(
                      "w-24 text-right text-sm font-medium",
                      resultado > 0 ? "text-[#A5FFD6]" : resultado < 0 ? "text-red-400" : "text-white/40",
                    )}
                  >
                    {resultado !== 0 ? fmt(resultado) : "—"}
                  </span>

                  <div className="w-28 flex justify-center">
                    <Badge className={cn("text-xs border capitalize", STATUS_STYLE[st] ?? STATUS_STYLE.pendente)}>
                      {st}
                    </Badge>
                  </div>

                  <div className="w-6 flex justify-center text-white/30">
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="bg-[#0F0F12] border-b border-white/5 px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {[
                      { label: "Data Cotação", value: c.data_cotacao ? new Date(c.data_cotacao).toLocaleDateString("pt-BR") : "—" },
                      { label: "Data Envio", value: c.data_envio ? new Date(c.data_envio).toLocaleDateString("pt-BR") : "—" },
                      { label: "Marca / Laboratório", value: c.marca_laboratorio || "—" },
                      { label: "Tipo", value: c.tipo?.toUpperCase() || "—" },
                      { label: "Valor Importado", value: c.valor_importado || "—" },
                      { label: "Frete / Imposto", value: c.frete_imposto || "—" },
                      { label: "Total Custo", value: fmt(c.total) },
                      { label: "Imposto", value: fmt(c.imposto) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-white/80 break-words">{value}</p>
                      </div>
                    ))}
                    {c.marca_laboratorio && c.marca_laboratorio.length > 60 && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Detalhes do Produto</p>
                        <p className="text-white/60 text-xs leading-relaxed whitespace-pre-line">{c.marca_laboratorio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Nova Cotação Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Cotação</DialogTitle>
            <DialogDescription className="text-white/40">
              Preencha os dados do orçamento conforme recebido.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">

              {/* Section: Identificação */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Identificação</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="data_cotacao" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Data</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="convenio" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Convênio</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: SC Saúde" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nome_paciente" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Nome do Paciente *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nome-paciente" placeholder="Nome completo" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="origem_paciente" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Origem / Médico</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Dra. Marcele / OncoClin" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section: Medicamento */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Medicamento</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <FormField control={form.control} name="medicamento_nome" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Medicamento *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-medicamento-nome" placeholder="Ex: Verzenios 150mg 60cp" className="bg-[#0F0F12] border-white/10 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="tipo" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Tipo</FormLabel>
                      <Select value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          <SelectItem value="__none__" className="text-white/40">Selecionar...</SelectItem>
                          {TIPO_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t} className="text-white uppercase">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="marca_laboratorio" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Marca / Laboratório</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Lilly / Abbvie" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section: Custo de Importação */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Custo de Importação</p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="valor_importado" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor Importado</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 1250 USD" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="frete_imposto" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Frete / Imposto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 450 USD" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="total" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Total Custo (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section: Preços */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Preços de Venda</p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="valor_noova" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor Noova (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-valor-noova" type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="valor_brasindice" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor Brasindice (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="valor_enviado_convenio" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Enviado ao Convênio (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section: Resultado */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Resultado</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="data_envio" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Data de Envio</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status-cotacao" className="bg-[#0F0F12] border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="valor_aprovado" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor Aprovado (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="imposto" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Imposto (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="col-span-2">
                    <FormField control={form.control} name="resultado" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Resultado (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="Calculado automaticamente (aprovado - noova - imposto)" className="bg-[#0F0F12] border-white/10 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)} className="text-white/60 hover:text-white">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  data-testid="button-submit-cotacao"
                  className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                  disabled={createCotacao.isPending}
                >
                  {createCotacao.isPending ? "Registrando..." : "Registrar Cotação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
