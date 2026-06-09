import { useState, useRef, useEffect } from "react";
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
import { Search, Users, Plus, FileCheck, Pencil, Trash2, FileText, ExternalLink, Upload, Loader2, History, Download, CheckCircle2, MessageSquare, ArrowUpAZ, ArrowDownAZ, Pill, CalendarDays, Package, FolderOpen, ImageIcon, X, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type HistoricoItem = {
  id: string;
  paciente_id: string;
  tipo: string;
  tipo_label: string;
  mensagem: string;
  canal: string;
  created_at: string;
};

type DispensacaoItem = {
  id: string;
  paciente_id: string;
  medicamento_id?: string | null;
  medicamento_nome: string;
  data_retirada?: string | null;
  lote?: string | null;
  validade?: string | null;
  created_at: string;
};

type MedicamentoOption = {
  id: string;
  nome: string;
  apresentacao?: string | null;
};

type DocumentoItem = {
  name: string;
  url: string;
  size?: number;
  mimetype?: string;
  created_at?: string;
};

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
  mandato_pdf_url?: string | null;
  mandato_ativo?: boolean | null;
  processo_fase?: number | null;
  processo_status?: string | null;
  created_at: string;
};

function getProcessoBadge(fase: number | null | undefined, status: string | null | undefined) {
  if (!fase) return null;
  if (status === "concluido") return { label: "Concluido", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" };
  const map: Record<number, { label: string; bg: string; text: string; border: string }> = {
    1: { label: "Cotacao", bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/25" },
    2: { label: "Logistica", bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25" },
    3: { label: "Monitoramento", bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/25" },
    4: { label: "Faturamento", bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/25" },
  };
  return map[fase] ?? null;
}

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
  const [uploadingMandato, setUploadingMandato] = useState(false);
  const [histPaciente, setHistPaciente] = useState<Paciente | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [histDispList, setHistDispList] = useState<DispensacaoItem[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const mandatoPdfRef = useRef<HTMLInputElement>(null);

  async function abrirHistorico(p: Paciente) {
    setHistPaciente(p);
    setHistorico([]);
    setHistDispList([]);
    setLoadingHist(true);
    try {
      const [histData, dispData] = await Promise.all([
        fetch(`/api/historico-atendimentos?paciente_id=${p.id}`)
          .then((r) => r.ok ? r.json() as Promise<HistoricoItem[]> : []),
        fetch(`/api/dispensacoes?paciente_id=${p.id}`)
          .then((r) => r.ok ? r.json() as Promise<DispensacaoItem[]> : []),
      ]);
      setHistorico(Array.isArray(histData) ? histData : []);
      setHistDispList(Array.isArray(dispData) ? dispData : []);
    } catch {
      setHistorico([]);
      setHistDispList([]);
    } finally {
      setLoadingHist(false);
    }
  }

  function sanitizarPdf(texto: string): string {
    return texto
      // Remove emojis e símbolos Unicode fora do Latin-1 (jsPDF/Helvetica só suporta até U+00FF)
      .replace(/[\u0100-\uFFFF]/g, "")
      // Remove formatação WhatsApp: *negrito*, _italico_
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // Normaliza espaços múltiplos e linhas em branco repetidas
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function gerarPdfHistorico() {
    if (!histPaciente) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const largura = doc.internal.pageSize.getWidth();
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    // Header
    doc.setFillColor(15, 15, 18);
    doc.rect(0, 0, largura, 40, "F");
    doc.setTextColor(245, 110, 15);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("HubWorkz Saude", 14, 15);
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Relatorio de Historico de Atendimento", 14, 22);
    doc.text(`Gerado em: ${hoje}`, 14, 28);

    // Dados do paciente
    doc.setFillColor(27, 27, 30);
    doc.rect(0, 40, largura, 38, "F");
    doc.setTextColor(245, 110, 15);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Paciente", 14, 52);
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const info: [string, string][] = [
      ["Nome", histPaciente.nome],
      ["CPF", histPaciente.cpf ?? "—"],
      ["Convenio", histPaciente.convenio ?? "—"],
      ["Diagnostico", histPaciente.diagnostico ?? "—"],
      ["CID", histPaciente.cid ?? "—"],
      ["Telefone", histPaciente.telefone ?? "—"],
    ];

    let x = 14;
    let y = 59;
    for (const [label, value] of info) {
      doc.setTextColor(150, 150, 150);
      doc.text(`${label}:`, x, y);
      doc.setTextColor(220, 220, 220);
      doc.text(value, x + 28, y);
      x += 65;
      if (x > 150) { x = 14; y += 6; }
    }

    // Tabela de histórico de comunicados
    // 3 colunas: Data/Tipo+Canal / Mensagem (mais espaço para a mensagem)
    const rows = historico.map((h) => {
      const msgLimpa = sanitizarPdf(h.mensagem);
      const canalLabel = h.canal === "whatsapp" ? "WhatsApp" : "Copiado";
      const tipoComCanal = `${sanitizarPdf(h.tipo_label)}\n[${canalLabel}]`;
      // Limita a 5 linhas (~350 chars) para manter o PDF compacto
      const msgFinal = msgLimpa.length > 350 ? msgLimpa.slice(0, 347) + "..." : msgLimpa;
      return [
        new Date(h.created_at).toLocaleString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        tipoComCanal,
        msgFinal,
      ];
    });

    // Título seção comunicados com linha decorativa
    const yComTitle = 79;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 110, 15);
    doc.text("Historico de Comunicados", 14, yComTitle);
    doc.setDrawColor(245, 110, 15);
    doc.setLineWidth(0.4);
    doc.line(14, yComTitle + 2, largura - 14, yComTitle + 2);

    autoTable(doc, {
      startY: yComTitle + 6,
      head: [["Data / Hora", "Tipo e Canal", "Mensagem"]],
      body: rows.length > 0 ? rows : [["—", "—", "Nenhum comunicado registrado"]],
      headStyles: {
        fillColor: [245, 110, 15],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
        fillColor: [255, 255, 255],
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        valign: "top",
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "normal", textColor: [80, 80, 80] },
        1: { cellWidth: 40 },
        2: { cellWidth: "auto", lineColor: [230, 230, 230] },
      },
      margin: { left: 14, right: 14 },
      styles: { overflow: "linebreak", lineColor: [225, 225, 225], lineWidth: 0.15 },
      // Estilo especial para a coluna [canal] dentro do tipo
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          data.cell.styles.fontSize = 8;
        }
        if (data.section === "body" && data.column.index === 2) {
          data.cell.styles.fontSize = 8.5;
          data.cell.styles.textColor = [30, 30, 30];
        }
      },
    });

    // Tabela de dispensações
    const afterCom = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 120, 80);
    doc.text("Dispensacao de Medicamentos", 14, afterCom);
    doc.setDrawColor(30, 120, 80);
    doc.setLineWidth(0.4);
    doc.line(14, afterCom + 2, largura - 14, afterCom + 2);

    const dispRows = histDispList.map((d) => [
      new Date(d.created_at).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      sanitizarPdf(d.medicamento_nome),
      d.data_retirada ? new Date(d.data_retirada + "T12:00:00").toLocaleDateString("pt-BR") : "—",
      d.lote ? sanitizarPdf(d.lote) : "—",
      d.validade ? new Date(d.validade + "T12:00:00").toLocaleDateString("pt-BR") : "—",
    ]);

    autoTable(doc, {
      startY: afterCom + 6,
      head: [["Registrado em", "Medicamento", "Data Retirada", "Lote", "Validade"]],
      body: dispRows.length > 0 ? dispRows : [["—", "Nenhuma dispensacao registrada", "—", "—", "—"]],
      headStyles: {
        fillColor: [30, 120, 80],
        textColor: [220, 255, 235],
        fontStyle: "bold",
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [40, 40, 40],
        fillColor: [255, 255, 255],
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        valign: "middle",
      },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      columnStyles: {
        0: { cellWidth: 32, textColor: [80, 80, 80] },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 28, halign: "center" },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 26, halign: "center" },
      },
      margin: { left: 14, right: 14 },
      styles: { overflow: "linebreak", lineColor: [210, 235, 220], lineWidth: 0.15 },
    });

    // Footer
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `HubWorkz Saude — Relatorio Confidencial — Pagina ${i} de ${pageCount}`,
        largura / 2, 290, { align: "center" },
      );
    }

    const nome = histPaciente.nome.replace(/\s+/g, "_").toLowerCase();
    doc.save(`historico_atendimento_${nome}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

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
      onError: (err) => {
        const apiData = (err as { data?: { error?: string } })?.data;
        const msg = apiData?.error ?? "Erro ao excluir paciente.";
        toast({ title: msg, variant: "destructive" });
      },
    });
  }

  async function handleMandatoUpload(file: File) {
    if (!editItem) return;
    setUploadingMandato(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(`/api/pacientes/${editItem.id}/mandato-upload`, { method: "POST", body: fd });
      const data = await resp.json() as { url?: string; error?: string };
      if (!resp.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      toast({ title: "Mandato anexado com sucesso." });
      setEditItem((prev) => prev ? { ...prev, mandato_pdf_url: data.url ?? null, mandato_ativo: true } : null);
      invalidate();
    } catch {
      toast({ title: "Erro ao fazer upload do mandato.", variant: "destructive" });
    } finally {
      setUploadingMandato(false);
    }
  }

  const [sortAZ, setSortAZ] = useState(false);
  const raw = (pacientes as Paciente[] ?? []);
  const list = sortAZ ? [...raw].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) : raw;

  // ── Alerta: última dispensação por paciente ───────────────────────────────────
  const [ultimaDisp, setUltimaDisp] = useState<Map<string, Date>>(new Map());

  useEffect(() => {
    fetch("/api/dispensacoes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { paciente_id?: string; data_retirada?: string | null; created_at?: string }[]) => {
        const mapa = new Map<string, Date>();
        for (const d of data) {
          if (!d.paciente_id) continue;
          const dataRef = d.data_retirada
            ? new Date(d.data_retirada + "T12:00:00")
            : d.created_at
            ? new Date(d.created_at)
            : null;
          if (!dataRef) continue;
          const atual = mapa.get(d.paciente_id);
          if (!atual || dataRef > atual) mapa.set(d.paciente_id, dataRef);
        }
        setUltimaDisp(mapa);
      })
      .catch(() => {});
  }, []);

  function alerteDispensacao(pacienteId: string): boolean {
    const ultima = ultimaDisp.get(pacienteId);
    if (!ultima) return false;
    const diffDias = (Date.now() - ultima.getTime()) / (1000 * 60 * 60 * 24);
    return diffDias > 20;
  }

  // ── Dispensação de medicamentos ──────────────────────────────────────────────
  const [dispPaciente, setDispPaciente] = useState<Paciente | null>(null);
  const [dispList, setDispList] = useState<DispensacaoItem[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [dispSubmitting, setDispSubmitting] = useState(false);
  const [medicamentosOpts, setMedicamentosOpts] = useState<MedicamentoOption[]>([]);
  const [dispForm, setDispForm] = useState({
    medicamento_id: "",
    medicamento_nome: "",
    data_retirada: "",
    lote: "",
    validade: "",
  });
  const [medSearch, setMedSearch] = useState("");

  useEffect(() => {
    fetch("/api/medicamentos?limit=200")
      .then((r) => r.ok ? r.json() as Promise<MedicamentoOption[]> : [])
      .then((data) => setMedicamentosOpts(Array.isArray(data) ? data : []))
      .catch(() => setMedicamentosOpts([]));
  }, []);

  async function abrirDispensacao(p: Paciente) {
    setDispPaciente(p);
    setDispList([]);
    setDispForm({ medicamento_id: "", medicamento_nome: "", data_retirada: "", lote: "", validade: "" });
    setMedSearch("");
    setLoadingDisp(true);
    try {
      const data = await fetch(`/api/dispensacoes?paciente_id=${p.id}`)
        .then((r) => r.ok ? r.json() as Promise<DispensacaoItem[]> : []);
      setDispList(Array.isArray(data) ? data : []);
    } catch { setDispList([]); }
    finally { setLoadingDisp(false); }
  }

  async function handleDispSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dispPaciente || !dispForm.medicamento_nome) return;
    setDispSubmitting(true);
    try {
      const resp = await fetch("/api/dispensacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: dispPaciente.id,
          medicamento_id: dispForm.medicamento_id || undefined,
          medicamento_nome: dispForm.medicamento_nome,
          data_retirada: dispForm.data_retirada || undefined,
          lote: dispForm.lote || undefined,
          validade: dispForm.validade || undefined,
        }),
      });
      if (resp.ok) {
        const novo = await resp.json() as DispensacaoItem;
        setDispList((prev) => [novo, ...prev]);
        setDispForm({ medicamento_id: "", medicamento_nome: "", data_retirada: "", lote: "", validade: "" });
        setMedSearch("");
        toast({ title: "Dispensacao registrada com sucesso." });
      } else {
        const err = await resp.json() as { error?: string };
        toast({ title: err.error ?? "Erro ao registrar dispensacao.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao registrar dispensacao.", variant: "destructive" });
    } finally {
      setDispSubmitting(false);
    }
  }

  const medFiltrados = medicamentosOpts.filter((m) =>
    !medSearch || m.nome.toLowerCase().includes(medSearch.toLowerCase())
  );

  // ── Edição / exclusão de dispensação ─────────────────────────────────────────
  const [editDispItem, setEditDispItem] = useState<DispensacaoItem | null>(null);
  const [editDispForm, setEditDispForm] = useState({
    medicamento_nome: "",
    data_retirada: "",
    lote: "",
    validade: "",
  });
  const [editDispSearch, setEditDispSearch] = useState("");
  const [savingDisp, setSavingDisp] = useState(false);
  const [deleteDispItem, setDeleteDispItem] = useState<DispensacaoItem | null>(null);
  const [deletingDispItem, setDeletingDispItem] = useState(false);

  function openEditDisp(d: DispensacaoItem) {
    setEditDispItem(d);
    setEditDispForm({
      medicamento_nome: d.medicamento_nome,
      data_retirada: d.data_retirada ?? "",
      lote: d.lote ?? "",
      validade: d.validade ?? "",
    });
    setEditDispSearch("");
  }

  async function handleSaveDisp() {
    if (!editDispItem || !editDispForm.medicamento_nome) return;
    setSavingDisp(true);
    try {
      const resp = await fetch(`/api/dispensacoes/${editDispItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicamento_nome: editDispForm.medicamento_nome,
          data_retirada: editDispForm.data_retirada || undefined,
          lote: editDispForm.lote || undefined,
          validade: editDispForm.validade || undefined,
        }),
      });
      if (resp.ok) {
        const updated = await resp.json() as DispensacaoItem;
        setDispList((prev) => prev.map((d) => d.id === updated.id ? updated : d));
        setEditDispItem(null);
        toast({ title: "Dispensacao atualizada." });
      } else {
        const err = await resp.json() as { error?: string };
        toast({ title: err.error ?? "Erro ao atualizar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao atualizar dispensacao.", variant: "destructive" });
    } finally {
      setSavingDisp(false);
    }
  }

  async function handleDeleteDisp() {
    if (!deleteDispItem) return;
    setDeletingDispItem(true);
    try {
      const resp = await fetch(`/api/dispensacoes/${deleteDispItem.id}`, { method: "DELETE" });
      if (resp.ok) {
        setDispList((prev) => prev.filter((d) => d.id !== deleteDispItem.id));
        toast({ title: "Dispensacao excluída." });
      } else {
        toast({ title: "Erro ao excluir dispensacao.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao excluir dispensacao.", variant: "destructive" });
    } finally {
      setDeletingDispItem(false);
      setDeleteDispItem(null);
    }
  }

  const editDispMedFiltrados = medicamentosOpts.filter((m) =>
    !editDispSearch || m.nome.toLowerCase().includes(editDispSearch.toLowerCase())
  );

  // ── Documentos (imagens + PDFs) ──────────────────────────────────────────────
  const [docPaciente, setDocPaciente] = useState<Paciente | null>(null);
  const [docList, setDocList] = useState<DocumentoItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  async function abrirDocumentos(p: Paciente) {
    setDocPaciente(p);
    setDocList([]);
    setLoadingDocs(true);
    try {
      const data = await fetch(`/api/pacientes/${p.id}/documentos`)
        .then((r) => r.ok ? r.json() as Promise<DocumentoItem[]> : []);
      setDocList(Array.isArray(data) ? data : []);
    } catch { setDocList([]); }
    finally { setLoadingDocs(false); }
  }

  async function handleDocUpload(files: FileList | null) {
    if (!files || files.length === 0 || !docPaciente) return;
    setUploadingDoc(true);
    const uploaded: DocumentoItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const resp = await fetch(`/api/pacientes/${docPaciente.id}/documentos/upload`, {
          method: "POST",
          body: fd,
        });
        if (resp.ok) {
          const doc = await resp.json() as DocumentoItem;
          uploaded.push(doc);
        } else {
          const err = await resp.json() as { error?: string };
          toast({ title: err.error ?? "Erro ao enviar arquivo.", variant: "destructive" });
        }
      } catch {
        toast({ title: "Erro ao enviar arquivo.", variant: "destructive" });
      }
    }
    if (uploaded.length > 0) {
      setDocList((prev) => [...uploaded, ...prev]);
      toast({ title: `${uploaded.length} arquivo${uploaded.length > 1 ? "s enviados" : " enviado"} com sucesso.` });
    }
    setUploadingDoc(false);
    if (docInputRef.current) docInputRef.current.value = "";
  }

  async function handleDocDelete(filename: string) {
    if (!docPaciente) return;
    setDeletingDoc(filename);
    try {
      const resp = await fetch(`/api/pacientes/${docPaciente.id}/documentos/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (resp.ok) {
        setDocList((prev) => prev.filter((d) => d.name !== filename));
        toast({ title: "Documento excluído." });
      } else {
        toast({ title: "Erro ao excluir documento.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao excluir documento.", variant: "destructive" });
    } finally {
      setDeletingDoc(null);
    }
  }

  function formatBytes(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function isImage(mimetype?: string) {
    return mimetype?.startsWith("image/") ?? false;
  }

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

      {/* Busca + Ordenação */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            data-testid="input-search-pacientes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente por nome..."
            className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setSortAZ((v) => !v)}
          className={`gap-2 border-white/10 bg-[#1B1B1E] text-white hover:bg-white/10 shrink-0 ${sortAZ ? "border-[#F56E0F]/40 text-[#F56E0F]" : ""}`}
          title={sortAZ ? "Ordenado A→Z (clique para reverter)" : "Ordenar A→Z"}
        >
          {sortAZ ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
          A→Z
        </Button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-56 bg-white/5 rounded-2xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="h-12 w-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/30">{search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p, idx) => {
            // rotate through accent colors per card
            const accents = [
              { bg: "from-[#F56E0F]/20 to-[#C84F00]/10", border: "border-[#F56E0F]/25", dot: "#F56E0F", avatar: "from-[#F56E0F] to-[#C84F00]" },
              { bg: "from-blue-500/20 to-blue-800/10", border: "border-blue-500/25", dot: "#3B82F6", avatar: "from-blue-500 to-blue-700" },
              { bg: "from-purple-500/20 to-purple-900/10", border: "border-purple-500/25", dot: "#A855F7", avatar: "from-purple-500 to-purple-800" },
              { bg: "from-emerald-500/20 to-emerald-900/10", border: "border-emerald-500/25", dot: "#10B981", avatar: "from-emerald-500 to-emerald-800" },
              { bg: "from-pink-500/20 to-pink-900/10", border: "border-pink-500/25", dot: "#EC4899", avatar: "from-pink-500 to-pink-800" },
              { bg: "from-amber-500/20 to-amber-900/10", border: "border-amber-500/25", dot: "#F59E0B", avatar: "from-amber-500 to-amber-700" },
            ];
            const ac = accents[idx % accents.length];
            const initials = p.nome.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

            return (
              <div
                key={p.id}
                data-testid={`row-paciente-${p.id}`}
                className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 ${ac.border}`}
                style={{
                  background: `linear-gradient(145deg, #1E1E24 0%, #18181C 100%)`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Color top bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${ac.avatar}`} />

                <div className="p-5">
                  {/* Header — avatar + name + mandato badge */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${ac.avatar} flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-lg`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white font-semibold text-sm leading-tight truncate">{p.nome}</p>
                        {alerteDispensacao(p.id) && (
                          <span
                            title="Sem dispensacao registrada nos ultimos 20 dias"
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[9px] font-semibold text-red-400 shrink-0 animate-pulse"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            +20 dias
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 truncate">
                        {p.cpf ? `CPF: ${p.cpf}` : (p.email ?? p.telefone ?? "—")}
                      </p>
                    </div>
                    {(() => {
                      const pb = getProcessoBadge(p.processo_fase, p.processo_status);
                      if (pb) {
                        return (
                          <Badge className={`${pb.bg} ${pb.text} ${pb.border} text-[10px] shrink-0`}>
                            {pb.label}
                          </Badge>
                        );
                      }
                      return (
                        <Badge className={p.mandato_ativo
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] shrink-0"
                          : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px] shrink-0"
                        }>
                          <FileCheck className="h-2.5 w-2.5 mr-1" />
                          {p.mandato_ativo ? "Mandato Ativo" : "Pendente"}
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {/* Convênio */}
                    <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Convenio</p>
                      <p className="text-white/80 text-xs font-medium truncate">{p.convenio ?? "—"}</p>
                      {p.numero_carteirinha && (
                        <p className="text-white/30 text-[10px] truncate">{p.numero_carteirinha}</p>
                      )}
                    </div>

                    {/* Diagnóstico + CID */}
                    <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Diagnostico</p>
                      <p className="text-white/80 text-xs font-medium truncate">{p.diagnostico ?? "—"}</p>
                      {p.cid && (
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                          style={{ background: `${ac.dot}20`, color: ac.dot }}>
                          {p.cid}
                        </span>
                      )}
                    </div>

                    {/* Telefone */}
                    <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Telefone</p>
                      <p className="text-white/80 text-xs font-medium">{p.telefone ?? "—"}</p>
                    </div>

                    {/* Nascimento */}
                    <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Nascimento</p>
                      <p className="text-white/80 text-xs font-medium">
                        {p.data_nascimento
                          ? new Date(p.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Endereço */}
                  {p.endereco && (
                    <div className="rounded-xl px-3 py-2 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Endereco</p>
                      <p className="text-white/60 text-xs leading-snug">{p.endereco}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => void abrirHistorico(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "rgba(165,255,214,0.08)", color: "#A5FFD6", border: "1px solid rgba(165,255,214,0.15)" }}
                      title="Histórico"
                    >
                      <History className="h-3.5 w-3.5" /> Historico
                    </button>
                    <button
                      onClick={() => void abrirDocumentos(p)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-500/20"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}
                      title="Documentos"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => void abrirDispensacao(p)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F56E0F]/20"
                      style={{ background: "rgba(245,110,15,0.08)", border: "1px solid rgba(245,110,15,0.20)" }}
                      title="Dispensacao de Medicamento"
                    >
                      <Pill className="h-3.5 w-3.5 text-[#F56E0F]" />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white/60" />
                    </button>
                    <button
                      onClick={() => setDeleteItem(p)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden PDF input */}
      <input
        ref={mandatoPdfRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMandatoUpload(f); e.target.value = ""; }}
      />

      {/* Sheet de edição */}
      <Sheet open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Paciente</SheetTitle>
          </SheetHeader>
          <Form {...editForm}>
            <PacienteForm onSubmit={handleUpdate} isPending={updatePaciente.isPending} submitLabel="Salvar Alterações" />
          </Form>

          {/* Mandato PDF */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Mandato Judicial / PDF</p>
            {editItem?.mandato_pdf_url ? (
              <div className="flex items-center justify-between bg-[#0F0F12] rounded-xl border border-white/10 px-4 py-3">
                <a
                  href={editItem.mandato_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#F56E0F] hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  <span>Ver mandato</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={() => mandatoPdfRef.current?.click()}
                  disabled={uploadingMandato}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  {uploadingMandato ? <Loader2 className="h-3 w-3 animate-spin" /> : "Substituir"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => mandatoPdfRef.current?.click()}
                disabled={uploadingMandato}
                className="w-full h-24 rounded-xl border border-dashed border-white/20 hover:border-[#F56E0F]/50 flex flex-col items-center justify-center gap-2 transition-colors text-white/40 hover:text-white/60"
              >
                {uploadingMandato ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#F56E0F]" />
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Clique para anexar o mandato em PDF</span>
                  </>
                )}
              </button>
            )}
            {editItem?.mandato_ativo && (
              <p className="text-green-400 text-xs flex items-center gap-1.5">
                <FileCheck className="h-3 w-3" /> Mandato ativo
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet — Histórico de atendimentos */}
      <Sheet open={!!histPaciente} onOpenChange={(o) => { if (!o) { setHistPaciente(null); setHistorico([]); } }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[520px] sm:max-w-[520px] flex flex-col overflow-hidden">
          <SheetHeader className="mb-4 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-white">Historico de Atendimento</SheetTitle>
                {histPaciente && (
                  <p className="text-white/50 text-sm mt-0.5">{histPaciente.nome}</p>
                )}
              </div>
              <Button
                onClick={gerarPdfHistorico}
                disabled={!histPaciente}
                className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2 shrink-0"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </SheetHeader>

          {/* Dados do paciente */}
          {histPaciente && (
            <div className="bg-[#0F0F12] rounded-xl border border-white/5 px-4 py-3 mb-4 shrink-0">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {[
                  ["Convenio", histPaciente.convenio ?? "—"],
                  ["CID", histPaciente.cid ?? "—"],
                  ["Diagnostico", histPaciente.diagnostico ?? "—"],
                  ["Telefone", histPaciente.telefone ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-1.5">
                    <span className="text-white/30">{label}:</span>
                    <span className="text-white/60 truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conteúdo do histórico */}
          <div className="flex-1 overflow-y-auto space-y-6">

            {/* ── Seção: Dispensações de Medicamentos ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4 text-[#F56E0F]" />
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Dispensacao de Medicamentos</p>
                {histDispList.length > 0 && (
                  <span className="ml-auto text-[10px] text-white/30">{histDispList.length} registro{histDispList.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {loadingHist ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-14 bg-white/5 rounded-xl" />)}
                </div>
              ) : histDispList.length === 0 ? (
                <div className="py-6 text-center rounded-xl border border-white/5 bg-[#0F0F12]">
                  <p className="text-white/20 text-xs">Nenhuma dispensacao registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {histDispList.map((d) => (
                    <div key={d.id} className="bg-[#0F0F12] rounded-xl border border-white/5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(245,110,15,0.10)", border: "1px solid rgba(245,110,15,0.18)" }}>
                          <Pill className="h-3.5 w-3.5 text-[#F56E0F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/85 text-sm font-medium truncate">{d.medicamento_nome}</p>
                          <p className="text-white/25 text-[10px]">
                            Registrado em {new Date(d.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                          {d.data_retirada && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15 whitespace-nowrap">
                              Ret: {new Date(d.data_retirada + "T12:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {d.lote && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/45 border border-white/10 font-mono">
                              {d.lote}
                            </span>
                          )}
                          {d.validade && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15 whitespace-nowrap">
                              Val: {new Date(d.validade + "T12:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Divisor ── */}
            <div className="border-t border-white/5" />

            {/* ── Seção: Comunicados ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-[#A5FFD6]" />
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Historico de Comunicados</p>
                {historico.length > 0 && (
                  <span className="ml-auto text-[10px] text-white/30">{historico.length} registro{historico.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {loadingHist ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 bg-white/5 rounded-xl" />)}
                </div>
              ) : historico.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-white/5 bg-[#0F0F12]">
                  <p className="text-white/20 text-xs">Nenhum comunicado registrado</p>
                  <p className="text-white/10 text-[10px] mt-1">Os envios feitos na tela de Comunicacao aparecerao aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map((h, idx) => (
                    <div key={h.id} className="bg-[#0F0F12] rounded-xl border border-white/5 p-4 relative">
                      {idx < historico.length - 1 && (
                        <div className="absolute left-[19px] top-full h-3 w-0.5 bg-white/5" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[#A5FFD6]/15 border border-[#A5FFD6]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#A5FFD6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-white/80 text-sm font-medium">{h.tipo_label}</p>
                            <Badge className={h.canal === "whatsapp"
                              ? "bg-green-500/15 text-green-400 border-green-500/20 text-[10px] px-1.5 py-0 border"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 border"
                            }>
                              {h.canal === "whatsapp" ? "WhatsApp" : "Copiado"}
                            </Badge>
                          </div>
                          <p className="text-white/25 text-[10px] mb-2">
                            {new Date(h.created_at).toLocaleString("pt-BR", {
                              weekday: "short", day: "2-digit", month: "short",
                              year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                          <div className="bg-[#1B1B1E] rounded-lg border border-white/5 p-2.5">
                            <pre className="text-white/40 text-[10px] whitespace-pre-wrap font-sans leading-relaxed max-h-24 overflow-hidden">
                              {h.mensagem}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden file input for doc uploads */}
      <input
        ref={docInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => { void handleDocUpload(e.target.files); }}
      />

      {/* Sheet — Documentos */}
      <Sheet open={!!docPaciente} onOpenChange={(o) => { if (!o) { setDocPaciente(null); setDocList([]); } }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[560px] sm:max-w-[560px] flex flex-col overflow-hidden">
          <SheetHeader className="mb-4 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                  <FolderOpen className="h-[1.1rem] w-[1.1rem] text-blue-400" />
                </div>
                <div>
                  <SheetTitle className="text-white">Documentos</SheetTitle>
                  {docPaciente && <p className="text-white/50 text-sm mt-0.5">{docPaciente.nome}</p>}
                </div>
              </div>
              <Button
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingDoc}
                className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2 shrink-0"
                size="sm"
              >
                {uploadingDoc
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Upload className="h-4 w-4" />
                }
                {uploadingDoc ? "Enviando..." : "Enviar Arquivo"}
              </Button>
            </div>
          </SheetHeader>

          {/* Drop zone */}
          <button
            onClick={() => docInputRef.current?.click()}
            disabled={uploadingDoc}
            className="shrink-0 w-full h-24 rounded-xl border border-dashed border-white/15 hover:border-blue-400/50 flex flex-col items-center justify-center gap-2 transition-colors text-white/30 hover:text-white/50 mb-4"
          >
            {uploadingDoc ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span className="text-xs">Clique ou arraste imagens/PDFs aqui</span>
                <span className="text-[10px] text-white/20">JPG, PNG, WebP, GIF, PDF — max 20 MB por arquivo</span>
              </>
            )}
          </button>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto">
            {loadingDocs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />)}
              </div>
            ) : docList.length === 0 ? (
              <div className="py-12 text-center">
                <FolderOpen className="h-10 w-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">Nenhum documento enviado</p>
                <p className="text-white/15 text-xs mt-1">Envie imagens ou PDFs do paciente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docList.map((doc) => {
                  const img = isImage(doc.mimetype);
                  const displayName = doc.name.replace(/^\d+_/, "").slice(0, 60);
                  return (
                    <div
                      key={doc.name}
                      className="group flex items-center gap-3 bg-[#0F0F12] rounded-xl border border-white/5 p-3 hover:border-white/10 transition-colors"
                    >
                      {/* Thumbnail or icon */}
                      {img ? (
                        <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-white/5">
                          <img
                            src={doc.url}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)" }}>
                          <FileText className="h-5 w-5 text-red-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-medium truncate">{displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-white/30 text-[10px]">
                            {img ? "Imagem" : "PDF"}
                          </span>
                          {doc.size && (
                            <span className="text-white/20 text-[10px]">{formatBytes(doc.size)}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                          title="Visualizar"
                        >
                          <Eye className="h-3.5 w-3.5 text-white/40" />
                        </a>
                        <a
                          href={doc.url}
                          download={displayName}
                          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                          title="Baixar"
                        >
                          <Download className="h-3.5 w-3.5 text-white/40" />
                        </a>
                        <button
                          onClick={() => void handleDocDelete(doc.name)}
                          disabled={deletingDoc === doc.name}
                          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                          title="Excluir"
                        >
                          {deletingDoc === doc.name
                            ? <Loader2 className="h-3.5 w-3.5 text-red-400 animate-spin" />
                            : <X className="h-3.5 w-3.5 text-red-400" />
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet — Dispensação de Medicamentos */}
      <Sheet open={!!dispPaciente} onOpenChange={(o) => { if (!o) setDispPaciente(null); }}>
        <SheetContent side="right" className="bg-[#1B1B1E] border-l border-white/10 text-white w-[540px] sm:max-w-[540px] flex flex-col overflow-hidden">
          <SheetHeader className="mb-4 shrink-0">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,110,15,0.12)", border: "1px solid rgba(245,110,15,0.25)" }}>
                <Pill className="h-4.5 w-4.5 text-[#F56E0F]" style={{ height: "1.125rem", width: "1.125rem" }} />
              </div>
              <div>
                <SheetTitle className="text-white">Dispensacao de Medicamento</SheetTitle>
                {dispPaciente && <p className="text-white/50 text-sm mt-0.5">{dispPaciente.nome}</p>}
              </div>
            </div>
          </SheetHeader>

          {/* Formulário de nova dispensação */}
          <form onSubmit={(e) => void handleDispSubmit(e)} className="space-y-4 shrink-0 pb-4 border-b border-white/10">
            {/* Seletor de medicamento */}
            <div className="space-y-1.5">
              <label className="text-white/70 text-sm font-medium">Medicamento *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                <Input
                  value={medSearch || dispForm.medicamento_nome}
                  onChange={(e) => {
                    setMedSearch(e.target.value);
                    setDispForm((f) => ({ ...f, medicamento_nome: e.target.value, medicamento_id: "" }));
                  }}
                  placeholder="Buscar medicamento..."
                  className={`${FIELD} pl-9`}
                />
              </div>
              {medSearch && medFiltrados.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-[#0F0F12] max-h-44 overflow-y-auto">
                  {medFiltrados.slice(0, 12).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setDispForm((f) => ({ ...f, medicamento_nome: m.nome, medicamento_id: m.id }));
                        setMedSearch("");
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <p className="text-white text-xs font-medium truncate">{m.nome}</p>
                      {m.apresentacao && <p className="text-white/35 text-[10px] truncate">{m.apresentacao}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data de retirada + Lote + Validade */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-white/40" /> Data Retirada
                </label>
                <Input
                  type="date"
                  value={dispForm.data_retirada}
                  onChange={(e) => setDispForm((f) => ({ ...f, data_retirada: e.target.value }))}
                  className={FIELD}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-white/40" /> Lote
                </label>
                <Input
                  value={dispForm.lote}
                  onChange={(e) => setDispForm((f) => ({ ...f, lote: e.target.value }))}
                  placeholder="Ex: L2024-001"
                  className={FIELD}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-white/40" /> Validade
                </label>
                <Input
                  type="date"
                  value={dispForm.validade}
                  onChange={(e) => setDispForm((f) => ({ ...f, validade: e.target.value }))}
                  className={FIELD}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={dispSubmitting || !dispForm.medicamento_nome}
              className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
            >
              {dispSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
              {dispSubmitting ? "Registrando..." : "Registrar Dispensacao"}
            </Button>
          </form>

          {/* Histórico de dispensações */}
          <div className="flex-1 overflow-y-auto pt-4">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Historico de Dispensacoes</p>
            {loadingDisp ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 bg-white/5 rounded-xl" />)}
              </div>
            ) : dispList.length === 0 ? (
              <div className="py-12 text-center">
                <Pill className="h-9 w-9 text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">Nenhuma dispensacao registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dispList.map((d) => {
                  const isEditing = editDispItem?.id === d.id;
                  return (
                    <div key={d.id} className={`rounded-xl border p-4 transition-colors ${isEditing ? "border-[#F56E0F]/30 bg-[#1a1209]" : "border-white/5 bg-[#0F0F12]"}`}>
                      {isEditing ? (
                        /* ── Inline edit form ── */
                        <div className="space-y-3">
                          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Editar Dispensacao</p>

                          {/* Medicamento */}
                          <div className="space-y-1">
                            <label className="text-white/60 text-xs">Medicamento *</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
                              <Input
                                value={editDispSearch || editDispForm.medicamento_nome}
                                onChange={(e) => {
                                  setEditDispSearch(e.target.value);
                                  setEditDispForm((f) => ({ ...f, medicamento_nome: e.target.value }));
                                }}
                                className={`${FIELD} pl-8 h-8 text-xs`}
                                placeholder="Buscar medicamento..."
                              />
                            </div>
                            {editDispSearch && editDispMedFiltrados.length > 0 && (
                              <div className="rounded-lg border border-white/10 bg-[#0F0F12] max-h-36 overflow-y-auto">
                                {editDispMedFiltrados.slice(0, 8).map((m) => (
                                  <button key={m.id} type="button"
                                    onClick={() => { setEditDispForm((f) => ({ ...f, medicamento_nome: m.nome })); setEditDispSearch(""); }}
                                    className="w-full text-left px-3 py-2 hover:bg-white/5 text-xs text-white border-b border-white/5 last:border-0 truncate">
                                    {m.nome}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Data + Lote + Validade */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-white/50 text-[10px]">Data Retirada</label>
                              <Input type="date" value={editDispForm.data_retirada}
                                onChange={(e) => setEditDispForm((f) => ({ ...f, data_retirada: e.target.value }))}
                                className={`${FIELD} h-8 text-xs mt-0.5`} />
                            </div>
                            <div>
                              <label className="text-white/50 text-[10px]">Lote</label>
                              <Input value={editDispForm.lote}
                                onChange={(e) => setEditDispForm((f) => ({ ...f, lote: e.target.value }))}
                                className={`${FIELD} h-8 text-xs mt-0.5`} placeholder="Ex: L001" />
                            </div>
                            <div>
                              <label className="text-white/50 text-[10px]">Validade</label>
                              <Input type="date" value={editDispForm.validade}
                                onChange={(e) => setEditDispForm((f) => ({ ...f, validade: e.target.value }))}
                                className={`${FIELD} h-8 text-xs mt-0.5`} />
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={() => void handleSaveDisp()} disabled={savingDisp || !editDispForm.medicamento_nome}
                              className="flex-1 h-7 text-xs bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-1.5">
                              {savingDisp ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              {savingDisp ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditDispItem(null)}
                              className="h-7 text-xs border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── Read-only card ── */
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(245,110,15,0.10)", border: "1px solid rgba(245,110,15,0.20)" }}>
                            <Pill className="h-4 w-4 text-[#F56E0F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{d.medicamento_nome}</p>
                            <p className="text-white/30 text-[10px] mb-2">
                              {new Date(d.created_at).toLocaleString("pt-BR", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {d.data_retirada && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15">
                                  Retirada: {new Date(d.data_retirada + "T12:00:00").toLocaleDateString("pt-BR")}
                                </span>
                              )}
                              {d.lote && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10 font-mono">
                                  Lote: {d.lote}
                                </span>
                              )}
                              {d.validade && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15">
                                  Val: {new Date(d.validade + "T12:00:00").toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Edit / Delete */}
                          <div className="flex gap-1 shrink-0 ml-1">
                            <button onClick={() => openEditDisp(d)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                              title="Editar">
                              <Pencil className="h-3.5 w-3.5 text-white/40" />
                            </button>
                            <button onClick={() => setDeleteDispItem(d)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
                              title="Excluir">
                              <Trash2 className="h-3.5 w-3.5 text-red-400/60" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmação de exclusão de dispensação */}
      <AlertDialog open={!!deleteDispItem} onOpenChange={(o) => { if (!o) setDeleteDispItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir dispensacao?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              O registro de <span className="text-white font-medium">{deleteDispItem?.medicamento_nome}</span> será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteDisp()}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletingDispItem}
            >
              {deletingDispItem ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
