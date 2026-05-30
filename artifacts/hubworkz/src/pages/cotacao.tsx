import { useState, useEffect } from "react";
import {
  useListCotacoes,
  useCreateCotacao,
  useUpdateCotacao,
  useDeleteCotacao,
  getListCotacoesQueryKey,
  listCotacoes,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Pencil,
  Trash2,
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
  cotacao_dolar: z.string().optional(),
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

type Cotacao = Awaited<ReturnType<typeof listCotacoes>>[number];

function buildPayload(values: FormValues) {
  return {
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
  };
}

export default function Cotacao() {
  const [statusFiltro, setStatusFiltro] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<Cotacao | null>(null);
  const [deleteItem, setDeleteItem] = useState<Cotacao | null>(null);

  const { data: cotacoes, isLoading } = useListCotacoes({
    status: statusFiltro || undefined,
  });
  const createCotacao = useCreateCotacao();
  const updateCotacao = useUpdateCotacao();
  const deleteCotacao = useDeleteCotacao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCotacoesQueryKey() });

  // ── Create form ──────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "pendente", tipo: "comp" },
  });

  const watchImportado = form.watch("valor_importado");
  const watchFrete = form.watch("frete_imposto");
  const watchDolar = form.watch("cotacao_dolar");

  useEffect(() => {
    const usd1 = parseFloat((watchImportado ?? "").replace(",", "."));
    const usd2 = parseFloat((watchFrete ?? "").replace(",", "."));
    const taxa = parseFloat((watchDolar ?? "").replace(",", "."));
    const totalUsd = (isNaN(usd1) ? 0 : usd1) + (isNaN(usd2) ? 0 : usd2);
    if (totalUsd > 0 && !isNaN(taxa) && taxa > 0) {
      form.setValue("total", String((totalUsd * taxa).toFixed(2)));
    } else if (totalUsd > 0 && (isNaN(taxa) || taxa === 0)) {
      form.setValue("total", String(totalUsd.toFixed(2)));
    }
  }, [watchImportado, watchFrete, watchDolar]);

  // ── Edit form ────────────────────────────────────────────────────────
  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "pendente", tipo: "comp" },
  });

  const watchEditImportado = editForm.watch("valor_importado");
  const watchEditFrete = editForm.watch("frete_imposto");
  const watchEditDolar = editForm.watch("cotacao_dolar");

  useEffect(() => {
    const usd1 = parseFloat((watchEditImportado ?? "").replace(",", "."));
    const usd2 = parseFloat((watchEditFrete ?? "").replace(",", "."));
    const taxa = parseFloat((watchEditDolar ?? "").replace(",", "."));
    const totalUsd = (isNaN(usd1) ? 0 : usd1) + (isNaN(usd2) ? 0 : usd2);
    if (totalUsd > 0 && !isNaN(taxa) && taxa > 0) {
      editForm.setValue("total", String((totalUsd * taxa).toFixed(2)));
    } else if (totalUsd > 0 && (isNaN(taxa) || taxa === 0)) {
      editForm.setValue("total", String(totalUsd.toFixed(2)));
    }
  }, [watchEditImportado, watchEditFrete, watchEditDolar]);

  function openEdit(c: Cotacao) {
    editForm.reset({
      data_cotacao: c.data_cotacao ?? "",
      nome_paciente: c.nome_paciente ?? "",
      origem_paciente: c.origem_paciente ?? "",
      convenio: c.convenio ?? "",
      medicamento_nome: c.medicamento_nome ?? "",
      tipo: c.tipo ?? "comp",
      marca_laboratorio: c.marca_laboratorio ?? "",
      valor_importado: c.valor_importado ?? "",
      frete_imposto: c.frete_imposto ?? "",
      total: c.total != null ? String(c.total) : "",
      valor_noova: c.valor_noova != null ? String(c.valor_noova) : "",
      valor_brasindice: c.valor_brasindice != null ? String(c.valor_brasindice) : "",
      valor_enviado_convenio: c.valor_enviado_convenio != null ? String(c.valor_enviado_convenio) : "",
      data_envio: c.data_envio ?? "",
      status: c.status ?? "pendente",
      valor_aprovado: c.valor_aprovado != null ? String(c.valor_aprovado) : "",
      imposto: c.imposto != null ? String(c.imposto) : "",
      resultado: c.resultado != null ? String(c.resultado) : "",
    });
    setEditItem(c);
  }

  function onSubmitEdit(values: FormValues) {
    if (!editItem) return;
    updateCotacao.mutate(
      { id: editItem.id, data: buildPayload(values) },
      {
        onSuccess: () => {
          toast({ title: "Cotação atualizada!" });
          invalidate();
          setEditItem(null);
        },
        onError: () => toast({ title: "Erro ao atualizar cotação", variant: "destructive" }),
      },
    );
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteCotacao.mutate(
      { id: deleteItem.id },
      {
        onSuccess: () => {
          toast({ title: "Cotação excluída." });
          invalidate();
          setDeleteItem(null);
          setExpandedId(null);
        },
        onError: () => toast({ title: "Erro ao excluir cotação", variant: "destructive" }),
      },
    );
  }

  const onSubmit = (values: FormValues) => {
    createCotacao.mutate(
      { data: buildPayload(values) },
      {
        onSuccess: () => {
          toast({ title: "Cotação registrada!" });
          invalidate();
          form.reset({ status: "pendente", tipo: "comp" });
          setOpenDialog(false);
        },
        onError: () =>
          toast({ title: "Erro ao registrar cotação", variant: "destructive" }),
      },
    );
  };

  const allCotacoes = cotacoes ?? [];
  const list = allCotacoes;

  // Stats (computed over all, unfiltered)
  const aprovadas = allCotacoes.filter((c) => normalizeStatus(c.status) === "aprovado");
  const reprovadas = allCotacoes.filter((c) => normalizeStatus(c.status) === "reprovado");
  const pendentes = allCotacoes.filter((c) => normalizeStatus(c.status) === "pendente");
  const totalAprovado = aprovadas.reduce((s, c) => s + (Number(c.valor_aprovado) || 0), 0);
  const totalNoova = allCotacoes.reduce((s, c) => s + (Number(c.valor_noova) || 0), 0);
  const totalResultado = allCotacoes.reduce((s, c) => s + (Number(c.resultado) || 0), 0);

  function toggleFiltro(val: string) {
    setStatusFiltro((prev) => (prev === val ? "" : val));
  }

  const statCards = [
    {
      label: "Total",
      value: allCotacoes.length,
      icon: FileText,
      filtro: "",
      gradient: "linear-gradient(135deg, #2a2a35 0%, #1B1B1E 100%)",
      glow: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.14)",
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "rgba(255,255,255,0.5)",
      valueColor: "#ffffff",
      sublabel: "cotações cadastradas",
    },
    {
      label: "Aprovadas",
      value: aprovadas.length,
      icon: CheckCircle2,
      filtro: "aprovado",
      gradient: "linear-gradient(135deg, #0d2b1a 0%, #112418 100%)",
      glow: "rgba(34,197,94,0.18)",
      border: "rgba(34,197,94,0.25)",
      iconBg: "rgba(34,197,94,0.15)",
      iconColor: "#4ade80",
      valueColor: "#4ade80",
      sublabel: "aprovadas pelo convênio",
    },
    {
      label: "Reprovadas",
      value: reprovadas.length,
      icon: XCircle,
      filtro: "reprovado",
      gradient: "linear-gradient(135deg, #2b0d0d 0%, #241212 100%)",
      glow: "rgba(239,68,68,0.18)",
      border: "rgba(239,68,68,0.25)",
      iconBg: "rgba(239,68,68,0.15)",
      iconColor: "#f87171",
      valueColor: "#f87171",
      sublabel: "não aprovadas",
    },
    {
      label: "Pendentes",
      value: pendentes.length,
      icon: Clock,
      filtro: "pendente",
      gradient: "linear-gradient(135deg, #2b2200 0%, #241e0a 100%)",
      glow: "rgba(234,179,8,0.18)",
      border: "rgba(234,179,8,0.25)",
      iconBg: "rgba(234,179,8,0.15)",
      iconColor: "#facc15",
      valueColor: "#facc15",
      sublabel: "aguardando retorno",
    },
  ];

  const financialCards = [
    {
      label: "Valor Total Noova",
      value: totalNoova,
      filtro: "",
      gradient: "linear-gradient(135deg, #2b1800 0%, #221508 100%)",
      glow: "rgba(245,110,15,0.22)",
      border: "rgba(245,110,15,0.3)",
      valueColor: "#F56E0F",
      sublabel: "soma de todos os valores Noova",
    },
    {
      label: "Valor Total Aprovado",
      value: totalAprovado,
      filtro: "aprovado",
      gradient: "linear-gradient(135deg, #0d2b1a 0%, #112418 100%)",
      glow: "rgba(34,197,94,0.18)",
      border: "rgba(34,197,94,0.28)",
      valueColor: "#4ade80",
      sublabel: "soma dos valores aprovados",
    },
    {
      label: "Resultado Total",
      value: totalResultado,
      filtro: "",
      gradient: totalResultado >= 0
        ? "linear-gradient(135deg, #0a2a1e 0%, #0e2318 100%)"
        : "linear-gradient(135deg, #2b0d0d 0%, #241212 100%)",
      glow: totalResultado >= 0 ? "rgba(165,255,214,0.15)" : "rgba(239,68,68,0.15)",
      border: totalResultado >= 0 ? "rgba(165,255,214,0.25)" : "rgba(239,68,68,0.25)",
      valueColor: totalResultado >= 0 ? "#A5FFD6" : "#f87171",
      sublabel: "lucro líquido total",
    },
  ];

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

      {/* Stats — clickable, 3D */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, filtro, gradient, glow, border, iconBg, iconColor, valueColor, sublabel }) => {
          const isActive = statusFiltro === filtro && (filtro !== "" || statusFiltro === "");
          const isFiltered = filtro === "" ? statusFiltro === "" : statusFiltro === filtro;
          return (
            <button
              key={label}
              onClick={() => toggleFiltro(filtro)}
              style={{
                background: gradient,
                boxShadow: isFiltered
                  ? `0 0 0 1.5px ${border}, 0 4px 24px ${glow}, 0 1px 0 rgba(255,255,255,0.06) inset`
                  : `0 0 0 1px ${border}, 0 2px 12px ${glow}, 0 1px 0 rgba(255,255,255,0.04) inset`,
                transform: isFiltered ? "translateY(-1px)" : "none",
              }}
              className={cn(
                "rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-200 hover:-translate-y-0.5 group w-full",
                isFiltered && "ring-1 ring-white/20"
              )}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: iconBg, boxShadow: `0 0 12px ${glow}` }}
              >
                <Icon className="h-4 w-4" style={{ color: iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-xs mb-0.5">{label}</p>
                <p className="font-bold text-2xl leading-none mb-1" style={{ color: valueColor }}>{value}</p>
                <p className="text-white/25 text-[10px] leading-snug truncate">{sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Financial summary — 3D */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {financialCards.map(({ label, value, filtro, gradient, glow, border, valueColor, sublabel }) => {
          const isFiltered = filtro !== "" && statusFiltro === filtro;
          return (
            <button
              key={label}
              onClick={() => filtro && toggleFiltro(filtro)}
              style={{
                background: gradient,
                boxShadow: isFiltered
                  ? `0 0 0 1.5px ${border}, 0 4px 24px ${glow}, 0 1px 0 rgba(255,255,255,0.05) inset`
                  : `0 0 0 1px ${border}, 0 2px 12px ${glow}, 0 1px 0 rgba(255,255,255,0.03) inset`,
                transform: isFiltered ? "translateY(-1px)" : "none",
                cursor: filtro ? "pointer" : "default",
              }}
              className={cn(
                "rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-all duration-200 w-full",
                filtro && "hover:-translate-y-0.5 group"
              )}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${glow.replace("0.22", "0.3").replace("0.18", "0.25").replace("0.15", "0.2")}`, boxShadow: `0 0 14px ${glow}` }}
              >
                <TrendingUp className="h-4 w-4" style={{ color: valueColor }} />
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">{label}</p>
                <p className="font-bold text-lg leading-none mb-1" style={{ color: valueColor }}>
                  R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-white/25 text-[10px]">{sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter + active indicator */}
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
          <>
            <span className="text-white/30 text-sm">
              Filtrando: <span className="text-white/60 capitalize">{statusFiltro}</span> — {list.length} resultado{list.length !== 1 ? "s" : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setStatusFiltro("")} className="text-white/40 hover:text-white">
              Limpar filtro
            </Button>
          </>
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
                    <div className="col-span-2 md:col-span-4 flex gap-2 pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteItem(c); }}
                        className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Excluir
                      </button>
                    </div>
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
                <div className="mb-3">
                  <FormField control={form.control} name="cotacao_dolar" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 flex items-center gap-2">
                        Cotação do Dólar (R$ / USD)
                        <span className="text-[10px] text-white/30 font-normal normal-case tracking-normal">os valores abaixo serão multiplicados por esta taxa</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="Ex: 5.85"
                          className="bg-[#0F0F12] border-[#F56E0F]/30 text-white max-w-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="valor_importado" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor Importado (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">$</span>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" className="bg-[#0F0F12] border-white/10 text-white pl-7" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="frete_imposto" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Frete / Imposto (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">$</span>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" className="bg-[#0F0F12] border-white/10 text-white pl-7" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="total" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">
                        Total Custo (R$)
                        <span className="ml-2 text-[10px] text-[#A5FFD6]/70 font-normal normal-case tracking-normal">calculado automaticamente</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          readOnly
                          className="bg-[#0F0F12] border-white/10 text-[#A5FFD6] font-semibold cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
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

      {/* Editar Cotação Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Cotação</DialogTitle>
            <DialogDescription className="text-white/40">
              {editItem?.nome_paciente} — {editItem?.medicamento_nome}
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-5 mt-2">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Identificação</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={editForm.control} name="data_cotacao" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Data</FormLabel><FormControl><Input {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="convenio" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Convênio</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="nome_paciente" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Nome do Paciente *</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="origem_paciente" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Origem</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="medicamento_nome" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Medicamento *</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="tipo" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl><SelectTrigger className="bg-[#0F0F12] border-white/10 text-white"><SelectValue placeholder="Tipo..." /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          {TIPO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <div className="col-span-2">
                    <FormField control={editForm.control} name="marca_laboratorio" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">Marca / Laboratório</FormLabel><FormControl><Textarea {...field} className="bg-[#0F0F12] border-white/10 text-white min-h-[60px] resize-none" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Custo de Importação</p>
                <div className="mb-3">
                  <FormField control={editForm.control} name="cotacao_dolar" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70 flex items-center gap-2">Cotação do Dólar (R$ / USD)<span className="text-[10px] text-white/30 font-normal normal-case tracking-normal">multiplica valor + frete</span></FormLabel>
                      <FormControl><Input {...field} type="number" step="0.01" placeholder="Ex: 5.85" className="bg-[#0F0F12] border-[#F56E0F]/30 text-white max-w-[200px]" /></FormControl><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="valor_importado" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Valor Importado (USD)</FormLabel>
                      <FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">$</span><Input {...field} type="number" step="0.01" placeholder="0.00" className="bg-[#0F0F12] border-white/10 text-white pl-7" /></div></FormControl><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="frete_imposto" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Frete / Imposto (USD)</FormLabel>
                      <FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">$</span><Input {...field} type="number" step="0.01" placeholder="0.00" className="bg-[#0F0F12] border-white/10 text-white pl-7" /></div></FormControl><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="total" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Total Custo (R$)<span className="ml-2 text-[10px] text-[#A5FFD6]/70 font-normal normal-case tracking-normal">automático</span></FormLabel>
                      <FormControl><Input {...field} type="number" step="0.01" readOnly className="bg-[#0F0F12] border-white/10 text-[#A5FFD6] font-semibold cursor-default focus-visible:ring-0 focus-visible:ring-offset-0" /></FormControl><FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Preços de Venda</p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="valor_noova" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Valor Noova (R$)</FormLabel><FormControl><Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="valor_brasindice" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Brasíndice (R$)</FormLabel><FormControl><Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="valor_enviado_convenio" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Enviado ao Convênio (R$)</FormLabel><FormControl><Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Resultado</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={editForm.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? "pendente"}>
                        <FormControl><SelectTrigger className="bg-[#0F0F12] border-white/10 text-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="data_envio" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Data Envio</FormLabel><FormControl><Input {...field} type="date" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="valor_aprovado" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Valor Aprovado (R$)</FormLabel><FormControl><Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="imposto" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Imposto (R$)</FormLabel><FormControl><Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="col-span-2">
                    <FormField control={editForm.control} name="resultado" render={({ field }) => (
                      <FormItem><FormLabel className="text-white/70">Resultado (R$)</FormLabel><FormControl><Input {...field} type="number" step="0.01" placeholder="0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditItem(null)} className="text-white/60 hover:text-white">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white" disabled={updateCotacao.isPending}>
                  {updateCotacao.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir cotação?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              A cotação de <span className="text-white font-medium">{deleteItem?.nome_paciente}</span> — {deleteItem?.medicamento_nome} será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteCotacao.isPending}>
              {deleteCotacao.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
