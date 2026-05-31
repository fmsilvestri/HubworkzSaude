import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  useListEloSaude,
  useUpdateEloSaude,
  useDeleteEloSaude,
  useCreateEloSaude,
  getListEloSaudeQueryKey,
  type EloSaudeItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Search,
  Thermometer,
  Wind,
  FlaskConical,
  Pencil,
  Trash2,
  Plus,
  Copy,
  Database,
  PackageSearch,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import seedData from "@/data/elosaude.json";

const SETUP_SQL = `-- Execute no Supabase SQL Editor (uma vez)
CREATE TABLE IF NOT EXISTS elo_saude_importados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  principio_ativo text NOT NULL DEFAULT '',
  conservacao text NOT NULL DEFAULT '',
  laboratorio text NOT NULL DEFAULT '',
  codigo_tuss text NOT NULL DEFAULT '',
  ean text NOT NULL DEFAULT '',
  valor_contrato text NOT NULL DEFAULT '',
  marca_lab text NOT NULL DEFAULT '',
  valor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE elo_saude_importados ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS service_all ON elo_saude_importados
  USING (true) WITH CHECK (true);`;

const CONSERVACAO_STYLE: Record<string, string> = {
  AMBIENTE: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  REFRIGERADO: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  PRECAUCAO: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};
const CONSERVACAO_ICON: Record<string, React.ReactNode> = {
  AMBIENTE: <Wind className="h-3 w-3" />,
  REFRIGERADO: <Thermometer className="h-3 w-3" />,
  PRECAUCAO: <FlaskConical className="h-3 w-3" />,
};
const CONSERVACAO_OPTIONS = ["AMBIENTE", "REFRIGERADO", "PRECAUCAO"];

type FormValues = {
  descricao: string;
  principio_ativo: string;
  conservacao: string;
  laboratorio: string;
  codigo_tuss: string;
  ean: string;
  valor_contrato: string;
  marca_lab: string;
  valor: string;
};

function ItemForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel,
}: {
  defaultValues: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  loading: boolean;
  submitLabel: string;
}) {
  const form = useForm<FormValues>({ defaultValues: { conservacao: "AMBIENTE", ...defaultValues } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="descricao" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Descrição</FormLabel>
            <FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl>
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="principio_ativo" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Princípio Ativo</FormLabel>
              <FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="conservacao" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Conservação</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1B1E] border-white/10">
                  {CONSERVACAO_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="laboratorio" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Laboratório</FormLabel>
              <FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="marca_lab" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Marca / Lab Alternativo</FormLabel>
              <FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white" /></FormControl>
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="codigo_tuss" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Código TUSS</FormLabel>
              <FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white font-mono" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="ean" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">EAN</FormLabel>
              <FormControl><Input {...field} className="bg-[#0F0F12] border-white/10 text-white font-mono" /></FormControl>
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="valor_contrato" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Valor Contrato</FormLabel>
              <FormControl><Input {...field} placeholder="R$ 0,00" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="valor" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Valor (USD / Marca)</FormLabel>
              <FormControl><Input {...field} placeholder="ex: 250 USD" className="bg-[#0F0F12] border-white/10 text-white" /></FormControl>
            </FormItem>
          )} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading} className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white">
            {loading ? "Salvando..." : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function EloSaude() {
  const [search, setSearch] = useState("");
  const [labFiltro, setLabFiltro] = useState("__all__");
  const [conservFiltro, setConservFiltro] = useState("__all__");
  const [editItem, setEditItem] = useState<EloSaudeItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<EloSaudeItem | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const xlsxInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEloSaudeQueryKey() });

  const { data: items, isLoading, error } = useListEloSaude({
    search: search || undefined,
    conservacao: conservFiltro !== "__all__" ? conservFiltro : undefined,
    laboratorio: labFiltro !== "__all__" ? labFiltro : undefined,
  });

  const updateItem = useUpdateEloSaude();
  const deleteItemMutation = useDeleteEloSaude();
  const createItem = useCreateEloSaude();

  const tableNotFound = (error as { message?: string } | null)?.message?.includes("TABLE_NOT_FOUND")
    || (items === undefined && error !== null && String(error).includes("503"));

  const allItems = items ?? [];

  const labs = useMemo(
    () => Array.from(new Set(allItems.map((d) => d.laboratorio ?? "").filter(Boolean))).sort(),
    [allItems],
  );

  const totalRefrigerado = allItems.filter((d) => d.conservacao === "REFRIGERADO").length;
  const totalAmbiente = allItems.filter((d) => d.conservacao === "AMBIENTE").length;
  const comValorUsd = allItems.filter((d) => (d.valor ?? "").includes("USD")).length;

  async function bulkImport(rows: Record<string, string>[]) {
    setSeeding(true);
    try {
      const resp = await fetch("/api/elo-saude/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      const result = await resp.json() as { inserted?: number; error?: string };
      if (!resp.ok) throw new Error(result.error ?? "Erro desconhecido");
      invalidate();
      toast({ title: `${result.inserted ?? rows.length} itens importados com sucesso.` });
    } catch (err) {
      toast({ title: `Erro ao importar: ${err instanceof Error ? err.message : String(err)}`, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  }

  async function handleSeed() {
    const rows = seedData as Record<string, string>[];
    await bulkImport(rows);
  }

  async function handleXlsxUpload(file: File) {
    setSeeding(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "" });
      if (raw.length < 2) throw new Error("Planilha sem dados");
      // Map columns: 0=descricao, 1=principio_ativo, 2=conservacao, 3=laboratorio, 4=codigo_tuss, 5=ean, skip 6, 7=valor_contrato, 8=marca_lab, 9=valor
      const rows = (raw.slice(1) as (string | number)[][])
        .filter((r) => String(r[0] ?? "").trim())
        .map((r) => ({
          descricao: String(r[0] ?? "").trim(),
          principio_ativo: String(r[1] ?? "").trim(),
          conservacao: String(r[2] ?? "AMBIENTE").trim().toUpperCase() || "AMBIENTE",
          laboratorio: String(r[3] ?? "").trim(),
          codigo_tuss: String(r[4] ?? "").trim(),
          ean: String(r[5] ?? "").trim(),
          valor_contrato: String(r[7] ?? "").trim(),
          marca_lab: String(r[8] ?? "").trim(),
          valor: String(r[9] ?? "").trim(),
        }));
      setSeeding(false);
      await bulkImport(rows);
    } catch (err) {
      setSeeding(false);
      toast({ title: `Erro ao ler planilha: ${err instanceof Error ? err.message : String(err)}`, variant: "destructive" });
    }
  }

  function handleEdit(values: FormValues) {
    if (!editItem) return;
    updateItem.mutate(
      { id: editItem.id, data: values },
      {
        onSuccess: () => { toast({ title: "Item atualizado!" }); invalidate(); setEditItem(null); },
        onError: () => toast({ title: "Erro ao atualizar item", variant: "destructive" }),
      },
    );
  }

  function handleDelete() {
    if (!deleteItem) return;
    deleteItemMutation.mutate(
      { id: deleteItem.id },
      {
        onSuccess: () => { toast({ title: "Item excluído." }); invalidate(); setDeleteItem(null); },
        onError: () => toast({ title: "Erro ao excluir item", variant: "destructive" }),
      },
    );
  }

  function handleCreate(values: FormValues) {
    createItem.mutate(
      { data: values },
      {
        onSuccess: () => { toast({ title: "Item cadastrado!" }); invalidate(); setOpenCreate(false); },
        onError: () => toast({ title: "Erro ao cadastrar item", variant: "destructive" }),
      },
    );
  }

  if (tableNotFound) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Elo Saude Importados</h1>
          <p className="text-white/50 text-sm mt-1">Tabela de medicamentos importados — contrato Elo Saude</p>
        </div>
        <div className="bg-[#1B1B1E] border border-yellow-500/20 rounded-[14px] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
              <Database className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Configuração necessária</p>
              <p className="text-white/40 text-xs">A tabela ainda não existe no Supabase. Execute o SQL abaixo no SQL Editor do seu projeto.</p>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl border border-white/5 p-4 relative">
            <pre className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
              {SETUP_SQL}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(SETUP_SQL); toast({ title: "SQL copiado!" }); }}
              className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <a
              href="https://supabase.com/dashboard/project/witvffhvmohpyewzkbgt/sql/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white text-sm px-4 py-2 rounded-xl transition-colors"
            >
              Abrir SQL Editor do Supabase
            </a>
            <button
              onClick={invalidate}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Verificar novamente
            </button>
          </div>
          <div className="border-t border-white/5 pt-4 mt-2">
            <p className="text-white/40 text-xs mb-3">Após criar a tabela, importe os dados:</p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => xlsxInputRef.current?.click()}
                disabled={seeding}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 gap-2 text-sm"
              >
                <Upload className="h-4 w-4" />
                {seeding ? "Importando..." : "Importar XLSX"}
              </Button>
              <Button
                onClick={handleSeed}
                disabled={seeding}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 gap-2 text-sm"
              >
                <PackageSearch className="h-4 w-4" />
                {seeding ? "Importando..." : "Importar 153 itens (planilha salva)"}
              </Button>
            </div>
          </div>
          <input
            ref={xlsxInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleXlsxUpload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Elo Saude Importados</h1>
          <p className="text-white/50 text-sm mt-1">
            Tabela de medicamentos importados — contrato Elo Saude
            {allItems.length > 0 && ` (${allItems.length} itens)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {seeding && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando...
            </div>
          )}
          <Button
            onClick={() => xlsxInputRef.current?.click()}
            disabled={seeding}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5 gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar XLSX
          </Button>
          {allItems.length === 0 && !isLoading && (
            <Button
              onClick={handleSeed}
              disabled={seeding}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 gap-2"
            >
              <PackageSearch className="h-4 w-4" />
              {seeding ? "Importando..." : "Importar 153 itens (planilha salva)"}
            </Button>
          )}
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </div>
        <input
          ref={xlsxInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleXlsxUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Stats */}
      {allItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total de Itens", value: allItems.length, color: "text-white" },
            { label: "Temperatura Ambiente", value: totalAmbiente, color: "text-blue-400" },
            { label: "Refrigerados", value: totalRefrigerado, color: "text-cyan-400" },
            { label: "Com Valor USD", value: comValorUsd, color: "text-[#F56E0F]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            placeholder="Buscar por descrição, princípio ativo, TUSS, EAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={conservFiltro} onValueChange={setConservFiltro}>
          <SelectTrigger className="bg-[#1B1B1E] border-white/10 text-white w-44">
            <SelectValue placeholder="Conservação" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="__all__">Todas conservações</SelectItem>
            {CONSERVACAO_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={labFiltro} onValueChange={setLabFiltro}>
          <SelectTrigger className="bg-[#1B1B1E] border-white/10 text-white w-52">
            <SelectValue placeholder="Laboratório" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-72 overflow-y-auto">
            <SelectItem value="__all__">Todos os laboratórios</SelectItem>
            {labs.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || labFiltro !== "__all__" || conservFiltro !== "__all__") && (
          <span className="text-white/40 text-sm">{allItems.length} resultado{allItems.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_auto_1fr_auto_auto_1fr_1fr_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-4 py-3 border-b border-white/5">
          <span>Descrição</span>
          <span>Princípio Ativo</span>
          <span className="w-28">Conservação</span>
          <span>Laboratório</span>
          <span className="w-28 text-right">Cód. TUSS</span>
          <span className="w-36 text-right">EAN</span>
          <span className="text-right pr-2">Valor Contrato</span>
          <span className="text-right">Valor / Marca</span>
          <span className="w-16" />
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 bg-white/5" />)}
          </div>
        ) : allItems.length === 0 ? (
          <div className="py-16 text-center">
            <PackageSearch className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhum item encontrado</p>
            {!search && labFiltro === "__all__" && conservFiltro === "__all__" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                className="mt-3 text-[#F56E0F] hover:text-[#F56E0F]/80"
              >
                {seeding ? "Importando..." : "Importar dados da planilha"}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {allItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1.5fr_auto_1fr_auto_auto_1fr_1fr_auto] gap-0 items-start px-4 py-3 hover:bg-white/5 transition-colors group"
              >
                <div className="pr-3">
                  <p className="text-white text-sm font-medium leading-snug">{item.descricao}</p>
                </div>
                <div className="pr-3">
                  <p className="text-white/60 text-xs leading-snug">{item.principio_ativo || "—"}</p>
                </div>
                <div className="w-28 pt-0.5">
                  <Badge className={cn("border text-[10px] gap-1 px-1.5 py-0.5", CONSERVACAO_STYLE[item.conservacao ?? ""] ?? "bg-white/10 text-white/40 border-white/10")}>
                    {CONSERVACAO_ICON[item.conservacao ?? ""]}
                    {item.conservacao || "—"}
                  </Badge>
                </div>
                <div className="pr-3">
                  <p className="text-white/60 text-xs">{item.laboratorio || "—"}</p>
                </div>
                <div className="w-28 text-right">
                  <p className="text-white/40 text-xs font-mono">{item.codigo_tuss || "—"}</p>
                </div>
                <div className="w-36 text-right">
                  <p className="text-white/30 text-xs font-mono">{item.ean || "—"}</p>
                </div>
                <div className="pr-2 text-right">
                  <p className="text-[#A5FFD6] text-sm font-semibold">{item.valor_contrato || "—"}</p>
                </div>
                <div className="text-right">
                  {item.valor && item.valor.includes("USD") ? (
                    <div>
                      <p className="text-[#F56E0F] text-xs font-semibold">{item.valor}</p>
                      {item.marca_lab && <p className="text-white/30 text-[10px] mt-0.5 leading-snug">{item.marca_lab}</p>}
                    </div>
                  ) : item.marca_lab ? (
                    <p className="text-white/30 text-[10px] leading-snug">{item.marca_lab}</p>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </div>
                {/* Ações */}
                <div className="w-16 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditItem(item)}
                    className="text-white/40 hover:text-white transition-colors p-1 rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteItem(item)}
                    className="text-red-400/50 hover:text-red-400 transition-colors p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-white/20 text-xs text-center">
        Fonte: planilha ELOSAUDE IMPORTADOS — dados armazenados no banco de dados
      </p>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Item</DialogTitle>
            <DialogDescription className="text-white/40">Atualize os dados do medicamento importado.</DialogDescription>
          </DialogHeader>
          {editItem && (
            <ItemForm
              defaultValues={{
                descricao: editItem.descricao,
                principio_ativo: editItem.principio_ativo ?? "",
                conservacao: editItem.conservacao ?? "AMBIENTE",
                laboratorio: editItem.laboratorio ?? "",
                codigo_tuss: editItem.codigo_tuss ?? "",
                ean: editItem.ean ?? "",
                valor_contrato: editItem.valor_contrato ?? "",
                marca_lab: editItem.marca_lab ?? "",
                valor: editItem.valor ?? "",
              }}
              onSubmit={handleEdit}
              loading={updateItem.isPending}
              submitLabel="Salvar alterações"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Item</DialogTitle>
            <DialogDescription className="text-white/40">Cadastre um medicamento importado Elo Saude.</DialogDescription>
          </DialogHeader>
          <ItemForm
            defaultValues={{ conservacao: "AMBIENTE" }}
            onSubmit={handleCreate}
            loading={createItem.isPending}
            submitLabel="Cadastrar"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => { if (!o) setDeleteItem(null); }}>
        <AlertDialogContent className="bg-[#1B1B1E] border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir item?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              <strong className="text-white">{deleteItem?.descricao}</strong> será removido permanentemente do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
