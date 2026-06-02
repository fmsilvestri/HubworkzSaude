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
import { Search, Users, Plus, FileCheck, Pencil, Trash2, FileText, ExternalLink, Upload, Loader2, History, Download, CheckCircle2, MessageSquare, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
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

  const [sortAZ, setSortAZ] = useState(false);
  const raw = (pacientes as Paciente[] ?? []);
  const list = sortAZ ? [...raw].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) : raw;

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
                      <p className="text-white font-semibold text-sm leading-tight truncate">{p.nome}</p>
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
