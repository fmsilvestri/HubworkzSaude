import { useState, useEffect, useRef } from "react";
import {
  useListCotacoes,
  useCreateCotacao,
  useUpdateCotacao,
  useDeleteCotacao,
  getListCotacoesQueryKey,
  listCotacoes,
  useListPacientes,
  useListMedicamentos,
  type Paciente,
  type Medicamento,
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
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
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
  Users,
  Check,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Patient combobox ────────────────────────────────────────────────────────
function PacienteCombobox({
  value,
  onChange,
  onSelectPaciente,
  "data-testid": testId,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectPaciente?: (p: Paciente) => void;
  "data-testid"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [fromDb, setFromDb] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: pacientes } = useListPacientes();

  const filtered = (pacientes ?? [])
    .filter((p) => p.nome.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setFromDb(false);
    setOpen(e.target.value.length > 0);
  }

  function handleSelect(p: Paciente) {
    onChange(p.nome);
    setFromDb(true);
    onSelectPaciente?.(p);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInput}
            onFocus={() => { if (value.length > 0 && filtered.length > 0) setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="Nome completo ou buscar na base..."
            data-testid={testId}
            className="bg-[#0F0F12] border-white/10 text-white pr-8"
          />
          {fromDb && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2" title="Paciente selecionado da base de dados">
              <Check className="h-3.5 w-3.5 text-[#A5FFD6]" />
            </span>
          )}
          {!fromDb && value.length === 0 && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Users className="h-3.5 w-3.5 text-white/20" />
            </span>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-1 bg-[#1B1B1E] border border-white/10 shadow-xl w-[var(--radix-popover-trigger-width)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
      >
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <p className="text-white text-sm font-medium truncate">{p.nome}</p>
            {(p.convenio || p.diagnostico) && (
              <p className="text-white/40 text-xs truncate">
                {[p.convenio, p.diagnostico].filter(Boolean).join(" · ")}
              </p>
            )}
          </button>
        ))}
        <div className="border-t border-white/5 mt-1 pt-1 px-3 py-1.5">
          <p className="text-white/25 text-[10px]">
            {filtered.length} paciente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""} · ou continue digitando um novo nome
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Medicamento combobox ─────────────────────────────────────────────────────
function MedicamentoCombobox({
  value,
  onChange,
  onSelectMedicamento,
  "data-testid": testId,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectMedicamento?: (m: Medicamento) => void;
  "data-testid"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [fromDb, setFromDb] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: medicamentos } = useListMedicamentos();

  const filtered = (medicamentos ?? [])
    .filter((m) =>
      m.nome.toLowerCase().includes(value.toLowerCase()) ||
      (m.principio_ativo ?? "").toLowerCase().includes(value.toLowerCase())
    )
    .slice(0, 8);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setFromDb(false);
    setOpen(e.target.value.length > 0);
  }

  function handleSelect(m: Medicamento) {
    onChange(m.nome);
    setFromDb(true);
    onSelectMedicamento?.(m);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInput}
            onFocus={() => { if (value.length > 0 && filtered.length > 0) setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="Nome ou princípio ativo..."
            data-testid={testId}
            className="bg-[#0F0F12] border-white/10 text-white pr-8"
          />
          {fromDb && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2" title="Medicamento selecionado da base de dados">
              <Check className="h-3.5 w-3.5 text-[#A5FFD6]" />
            </span>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-1 bg-[#1B1B1E] border border-white/10 shadow-xl w-[var(--radix-popover-trigger-width)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
      >
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleSelect(m); }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <p className="text-white text-sm font-medium truncate">{m.nome}</p>
            {(m.principio_ativo || m.apresentacao) && (
              <p className="text-white/40 text-xs truncate">
                {[m.principio_ativo, m.apresentacao].filter(Boolean).join(" · ")}
              </p>
            )}
          </button>
        ))}
        <div className="border-t border-white/5 mt-1 pt-1 px-3 py-1.5">
          <p className="text-white/25 text-[10px]">
            {filtered.length} medicamento{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""} · ou continue digitando um novo nome
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  num_caixas: z.string().optional(),
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
  const watchCaixas = form.watch("num_caixas");

  useEffect(() => {
    const usd1 = parseFloat((watchImportado ?? "").replace(",", "."));
    const usd2 = parseFloat((watchFrete ?? "").replace(",", "."));
    const taxa = parseFloat((watchDolar ?? "").replace(",", "."));
    const caixas = parseFloat((watchCaixas ?? "").replace(",", "."));
    const numCaixas = isNaN(caixas) || caixas <= 0 ? 1 : caixas;
    const totalUsd = (isNaN(usd1) ? 0 : usd1) * numCaixas + (isNaN(usd2) ? 0 : usd2);
    if (totalUsd > 0 && !isNaN(taxa) && taxa > 0) {
      form.setValue("total", String((totalUsd * taxa).toFixed(2)));
    } else if (totalUsd > 0 && (isNaN(taxa) || taxa === 0)) {
      form.setValue("total", String(totalUsd.toFixed(2)));
    }
  }, [watchImportado, watchFrete, watchDolar, watchCaixas]);

  // ── Edit form ────────────────────────────────────────────────────────
  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "pendente", tipo: "comp" },
  });

  const watchEditImportado = editForm.watch("valor_importado");
  const watchEditFrete = editForm.watch("frete_imposto");
  const watchEditDolar = editForm.watch("cotacao_dolar");
  const watchEditCaixas = editForm.watch("num_caixas");

  useEffect(() => {
    const usd1 = parseFloat((watchEditImportado ?? "").replace(",", "."));
    const usd2 = parseFloat((watchEditFrete ?? "").replace(",", "."));
    const taxa = parseFloat((watchEditDolar ?? "").replace(",", "."));
    const caixas = parseFloat((watchEditCaixas ?? "").replace(",", "."));
    const numCaixas = isNaN(caixas) || caixas <= 0 ? 1 : caixas;
    const totalUsd = (isNaN(usd1) ? 0 : usd1) * numCaixas + (isNaN(usd2) ? 0 : usd2);
    if (totalUsd > 0 && !isNaN(taxa) && taxa > 0) {
      editForm.setValue("total", String((totalUsd * taxa).toFixed(2)));
    } else if (totalUsd > 0 && (isNaN(taxa) || taxa === 0)) {
      editForm.setValue("total", String(totalUsd.toFixed(2)));
    }
  }, [watchEditImportado, watchEditFrete, watchEditDolar, watchEditCaixas]);

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

  function generatePDF() {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now = new Date();
    const dataGeracao = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Header
    doc.setFillColor(15, 15, 18);
    doc.rect(0, 0, 297, 297, "F");

    doc.setFontSize(18);
    doc.setTextColor(245, 110, 15);
    doc.setFont("helvetica", "bold");
    doc.text("HubWorkz Saude", 14, 18);

    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("Relatorio de Cotacoes", 14, 26);

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Gerado em: ${dataGeracao}`, 14, 32);

    const filtroLabel = statusFiltro ? `  |  Filtro: ${statusFiltro}` : "  |  Todas as cotacoes";
    doc.text(`Total: ${allCotacoes.length} cotacao(s)${filtroLabel}`, 14, 37);

    // Summary boxes
    const boxY = 43;
    const boxes = [
      { label: "Total", value: String(allCotacoes.length), color: [80, 80, 90] as [number, number, number] },
      { label: "Aprovadas", value: String(aprovadas.length), color: [30, 100, 50] as [number, number, number] },
      { label: "Reprovadas", value: String(reprovadas.length), color: [120, 30, 30] as [number, number, number] },
      { label: "Pendentes", value: String(pendentes.length), color: [100, 80, 10] as [number, number, number] },
      { label: "V. Noova Total", value: `R$ ${totalNoova.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: [100, 50, 5] as [number, number, number] },
      { label: "V. Aprovado Total", value: `R$ ${totalAprovado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: [20, 80, 50] as [number, number, number] },
      { label: "Resultado Total", value: `R$ ${totalResultado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: totalResultado >= 0 ? [20, 80, 50] as [number, number, number] : [120, 30, 30] as [number, number, number] },
    ];
    const boxW = (297 - 28 - (boxes.length - 1) * 3) / boxes.length;
    boxes.forEach((b, i) => {
      const x = 14 + i * (boxW + 3);
      doc.setFillColor(...b.color);
      doc.roundedRect(x, boxY, boxW, 14, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.setFont("helvetica", "normal");
      doc.text(b.label, x + 2, boxY + 5);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(b.value, x + 2, boxY + 11);
    });

    // Table
    const rows = list.map((c) => {
      const st = normalizeStatus(c.status);
      const resultado = Number(c.resultado) || 0;
      return [
        c.data_cotacao ? new Date(c.data_cotacao).toLocaleDateString("pt-BR") : "—",
        c.nome_paciente ?? "—",
        c.medicamento_nome ?? "—",
        c.convenio ?? "—",
        c.tipo?.toUpperCase() ?? "—",
        c.valor_noova != null ? `R$ ${Number(c.valor_noova).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—",
        c.valor_aprovado != null ? `R$ ${Number(c.valor_aprovado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—",
        resultado !== 0 ? `R$ ${resultado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—",
        st.charAt(0).toUpperCase() + st.slice(1),
      ];
    });

    autoTable(doc, {
      startY: boxY + 18,
      head: [["Data", "Paciente", "Medicamento", "Convenio", "Tipo", "V. Noova", "V. Aprovado", "Resultado", "Status"]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [220, 220, 220],
        fillColor: [27, 27, 30],
        lineColor: [50, 50, 55],
        lineWidth: 0.2,
        font: "helvetica",
      },
      headStyles: {
        fillColor: [40, 40, 48],
        textColor: [245, 110, 15],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [20, 20, 24] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 55 },
        3: { cellWidth: 30 },
        4: { cellWidth: 12 },
        5: { cellWidth: 28 },
        6: { cellWidth: 28 },
        7: { cellWidth: 28 },
        8: { cellWidth: 22 },
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 8) {
          const val = String(data.cell.raw ?? "").toLowerCase();
          if (val === "aprovado") {
            doc.setTextColor(74, 222, 128);
          } else if (val === "reprovado") {
            doc.setTextColor(248, 113, 113);
          } else if (val === "pendente") {
            doc.setTextColor(250, 204, 21);
          } else {
            doc.setTextColor(150, 150, 150);
          }
          doc.setFontSize(7.5);
          doc.text(
            String(data.cell.raw ?? ""),
            data.cell.x + 2,
            data.cell.y + data.cell.height / 2 + 1,
          );
        }
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.text(`HubWorkz Saude — Relatorio de Cotacoes — ${dataGeracao}`, 14, 205);
      doc.text(`Pagina ${i} de ${pageCount}`, 283, 205, { align: "right" });
    }

    const filename = `cotacoes_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
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
        <div className="flex items-center gap-2">
          <Button
            onClick={generatePDF}
            variant="outline"
            disabled={allCotacoes.length === 0}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
          >
            <Download className="h-4 w-4" />
            Relatório PDF
          </Button>
          <Button
            onClick={() => setOpenDialog(true)}
            data-testid="button-nova-cotacao"
            className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Cotação
          </Button>
        </div>
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

      {/* Charts */}
      {allCotacoes.length > 0 && (() => {
        const pieData = [
          { name: "Aprovadas", value: aprovadas.length, color: "#4ade80" },
          { name: "Reprovadas", value: reprovadas.length, color: "#f87171" },
          { name: "Pendentes", value: pendentes.length, color: "#facc15" },
          { name: "N. Apresentado", value: allCotacoes.filter((c) => normalizeStatus(c.status) === "não apresentado").length, color: "#6b7280" },
        ].filter((d) => d.value > 0);

        const barData = allCotacoes
          .slice(-12)
          .map((c) => ({
            nome: (c.nome_paciente ?? "—").split(" ")[0],
            "V. Noova": Number(c.valor_noova) || 0,
            "V. Aprovado": Number(c.valor_aprovado) || 0,
            "Resultado": Number(c.resultado) || 0,
          }));

        const fmtBRL = (v: number) =>
          `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

        const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
          if (!active || !payload?.length) return null;
          return (
            <div className="bg-[#0F0F12] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
              <p className="text-white/50 mb-2 font-medium">{label}</p>
              {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }} className="mb-0.5">
                  {p.name}: <span className="font-bold">{fmtBRL(p.value)}</span>
                </p>
              ))}
            </div>
          );
        };

        const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
          if (!active || !payload?.length) return null;
          const p = payload[0];
          return (
            <div className="bg-[#0F0F12] border border-white/10 rounded-xl px-4 py-2 text-xs shadow-xl">
              <p style={{ color: p.payload.color }} className="font-bold">{p.name}</p>
              <p className="text-white/60">{p.value} cotação{p.value !== 1 ? "es" : ""}</p>
              <p className="text-white/30">{Math.round((p.value / allCotacoes.length) * 100)}% do total</p>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Donut — status distribution */}
            <div className="lg:col-span-2 bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Distribuição por Status</p>
              <p className="text-white font-semibold text-sm mb-4">Aprovadas x Reprovadas x Pendentes</p>
              <div className="flex items-center gap-4">
                <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2.5 flex-1">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-white/50 text-xs truncate">{d.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-white font-bold text-sm" style={{ color: d.color }}>{d.value}</span>
                        <span className="text-white/25 text-[10px] ml-1">
                          {Math.round((d.value / allCotacoes.length) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Taxa de aprovação */}
                  <div className="mt-2 pt-2.5 border-t border-white/5">
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Taxa de aprovação</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((aprovadas.length / Math.max(allCotacoes.length, 1)) * 100)}%`,
                            background: "linear-gradient(90deg, #4ade80, #22c55e)",
                          }}
                        />
                      </div>
                      <span className="text-green-400 text-xs font-bold">
                        {Math.round((aprovadas.length / Math.max(allCotacoes.length, 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bar chart — values per cotação */}
            <div className="lg:col-span-3 bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Comparativo de Valores</p>
              <p className="text-white font-semibold text-sm mb-4">Valor Noova vs Aprovado por cotação (últimas {barData.length})</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    width={38}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
                    formatter={(value: string) => <span style={{ color: "rgba(255,255,255,0.4)" }}>{value}</span>}
                  />
                  <Bar dataKey="V. Noova" fill="#F56E0F" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="V. Aprovado" fill="#4ade80" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Resultado" fill="#A5FFD6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

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
                        <PacienteCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          data-testid="input-nome-paciente"
                          onSelectPaciente={(p) => {
                            if (p.convenio) form.setValue("convenio", p.convenio);
                          }}
                        />
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
                          <MedicamentoCombobox
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            data-testid="input-medicamento-nome"
                            onSelectMedicamento={(m) => {
                              if (m.principio_ativo) form.setValue("marca_laboratorio", m.principio_ativo);
                            }}
                          />
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
                <div className="grid grid-cols-4 gap-3">
                  <FormField control={form.control} name="num_caixas" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Nº de Caixas</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" step="1" placeholder="1" className="bg-[#0F0F12] border-white/10 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
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
                    <FormItem>
                      <FormLabel className="text-white/70">Nome do Paciente *</FormLabel>
                      <FormControl>
                        <PacienteCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onSelectPaciente={(p) => {
                            if (p.convenio) editForm.setValue("convenio", p.convenio);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="origem_paciente" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Origem</FormLabel><FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="medicamento_nome" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Medicamento *</FormLabel>
                      <FormControl>
                        <MedicamentoCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onSelectMedicamento={(m) => {
                            if (m.principio_ativo) editForm.setValue("marca_laboratorio", m.principio_ativo);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
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
                <div className="grid grid-cols-4 gap-3">
                  <FormField control={editForm.control} name="num_caixas" render={({ field }) => (
                    <FormItem><FormLabel className="text-white/70">Nº de Caixas</FormLabel>
                      <FormControl><Input {...field} type="number" min="1" step="1" placeholder="1" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl><FormMessage />
                    </FormItem>
                  )} />
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
