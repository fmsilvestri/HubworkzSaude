import { useState, useRef } from "react";
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
import { Search, Users, Plus, FileCheck, Pencil, Trash2, FileText, ExternalLink, Upload, Loader2, History, Download, CheckCircle2, MessageSquare } from "lucide-react";
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
  const [uploadingMandato, setUploadingMandato] = useState(false);
  const [histPaciente, setHistPaciente] = useState<Paciente | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const mandatoPdfRef = useRef<HTMLInputElement>(null);

  async function abrirHistorico(p: Paciente) {
    setHistPaciente(p);
    setHistorico([]);
    setLoadingHist(true);
    try {
      const data = await fetch(`/api/historico-atendimentos?paciente_id=${p.id}`)
        .then((r) => r.ok ? r.json() as Promise<HistoricoItem[]> : []);
      setHistorico(Array.isArray(data) ? data : []);
    } catch {
      setHistorico([]);
    } finally {
      setLoadingHist(false);
    }
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

    // Tabela de histórico
    const rows = historico.map((h) => [
      new Date(h.created_at).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      h.tipo_label,
      h.canal === "whatsapp" ? "WhatsApp" : h.canal === "copiado" ? "Copiado" : h.canal,
      h.mensagem.length > 120 ? h.mensagem.slice(0, 117) + "..." : h.mensagem,
    ]);

    autoTable(doc, {
      startY: 82,
      head: [["Data/Hora", "Tipo de Comunicado", "Canal", "Mensagem"]],
      body: rows.length > 0 ? rows : [["—", "Nenhum comunicado registrado", "—", "—"]],
      headStyles: {
        fillColor: [245, 110, 15],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [60, 60, 60],
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 42 },
        2: { cellWidth: 22 },
        3: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
      styles: { overflow: "linebreak", lineColor: [220, 220, 220], lineWidth: 0.1 },
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
          <span className="w-28 text-center">Ações</span>
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
              <div className="w-28 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => void abrirHistorico(p)}
                  className="h-7 w-7 rounded-lg bg-[#A5FFD6]/10 hover:bg-[#A5FFD6]/20 flex items-center justify-center transition-colors"
                  title="Histórico de atendimento"
                >
                  <History className="h-3.5 w-3.5 text-[#A5FFD6]" />
                </button>
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

          {/* Lista de histórico */}
          <div className="flex-1 overflow-y-auto">
            {loadingHist ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 bg-white/5 rounded-xl" />)}
              </div>
            ) : historico.length === 0 ? (
              <div className="py-20 text-center">
                <MessageSquare className="h-10 w-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">Nenhum comunicado registrado para este paciente</p>
                <p className="text-white/15 text-xs mt-1">Os envios feitos na tela de Comunicacao aparecerao aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map((h, idx) => (
                  <div
                    key={h.id}
                    className="bg-[#0F0F12] rounded-xl border border-white/5 p-4 relative"
                  >
                    {/* Timeline dot */}
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
