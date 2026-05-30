import { useState } from "react";
import {
  useListFaturas,
  useEditFatura,
  useDeleteFatura,
  getListFaturasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, DollarSign, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  emitida: "bg-green-500/15 text-green-400 border-green-500/20",
  pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  cancelada: "bg-red-500/15 text-red-400 border-red-500/20",
  paga: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const STATUS_OPTIONS = ["emitida", "pendente", "cancelada", "paga"];
const TIPO_OPTIONS = ["produto", "servico"];

const editSchema = z.object({
  numero_nf: z.string().optional(),
  tipo: z.string().min(1, "Selecione o tipo"),
  valor: z.string().optional(),
  status: z.string().min(1, "Selecione o status"),
  data_emissao: z.string().optional(),
  data_vencimento: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

type Fatura = {
  id: string;
  numero_nf?: string | null;
  tipo: string;
  valor?: number | null;
  status: string;
  data_emissao?: string | null;
  data_vencimento?: string | null;
  processo_id?: string | null;
  paciente_id?: string | null;
  convenio_id?: string | null;
  created_at: string;
};

export default function Pedidos() {
  const { data: faturas, isLoading } = useListFaturas();
  const editFatura = useEditFatura();
  const deleteFatura = useDeleteFatura();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editTarget, setEditTarget] = useState<Fatura | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fatura | null>(null);

  const total = (faturas ?? []).reduce((s, f) => s + (Number(f.valor) || 0), 0);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { numero_nf: "", tipo: "produto", valor: "", status: "pendente", data_emissao: "", data_vencimento: "" },
  });

  const openEdit = (f: Fatura) => {
    setEditTarget(f);
    form.reset({
      numero_nf: f.numero_nf ?? "",
      tipo: f.tipo ?? "produto",
      valor: f.valor != null ? String(f.valor) : "",
      status: f.status ?? "pendente",
      data_emissao: f.data_emissao ? new Date(f.data_emissao).toISOString().split("T")[0] : "",
      data_vencimento: f.data_vencimento ? new Date(f.data_vencimento).toISOString().split("T")[0] : "",
    });
  };

  const onEditSubmit = (values: EditForm) => {
    if (!editTarget) return;
    editFatura.mutate(
      {
        id: editTarget.id,
        data: {
          numero_nf: values.numero_nf || undefined,
          tipo: values.tipo,
          valor: values.valor ? parseFloat(values.valor) : undefined,
          status: values.status,
          data_emissao: values.data_emissao || undefined,
          data_vencimento: values.data_vencimento || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Pedido atualizado!" });
          queryClient.invalidateQueries({ queryKey: getListFaturasQueryKey() });
          setEditTarget(null);
        },
        onError: () => toast({ title: "Erro ao atualizar pedido", variant: "destructive" }),
      },
    );
  };

  const onDelete = () => {
    if (!deleteTarget) return;
    deleteFatura.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          toast({ title: "Pedido excluído" });
          queryClient.invalidateQueries({ queryKey: getListFaturasQueryKey() });
          setDeleteTarget(null);
        },
        onError: () => toast({ title: "Erro ao excluir pedido", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos Consolidados</h1>
          <p className="text-white/50 text-sm mt-1">Todas as NFs — distribuidoras e importadora</p>
        </div>
        <div className="bg-[#1B1B1E] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-[#F56E0F]" />
          <div>
            <p className="text-white/40 text-xs">Total Consolidado</p>
            <p className="text-white font-bold">
              R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span>Nota Fiscal</span>
          <span className="w-24 text-center">Tipo</span>
          <span className="w-32 text-right pr-4">Valor</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-32 text-center">Emissão</span>
          <span className="w-20 text-center">Ações</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 bg-white/5" />
            ))}
          </div>
        ) : (faturas ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhum pedido registrado</p>
          </div>
        ) : (
          (faturas ?? []).map((f) => (
            <div
              key={f.id}
              data-testid={`row-pedido-${f.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <div>
                <p className="text-white font-medium text-sm">
                  {f.numero_nf ?? `NF-${f.id.slice(0, 6)}`}
                </p>
                <p className="text-white/30 text-xs">{f.id.slice(0, 12)}...</p>
              </div>

              <div className="w-24 flex justify-center">
                <Badge
                  className={cn(
                    "text-xs border",
                    f.tipo === "produto"
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/20"
                      : "bg-blue-500/15 text-blue-400 border-blue-500/20",
                  )}
                >
                  {f.tipo}
                </Badge>
              </div>

              <span className="w-32 text-right pr-4 text-white font-medium text-sm">
                {f.valor != null
                  ? `R$ ${Number(f.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "—"}
              </span>

              <div className="w-28 flex justify-center">
                <Badge
                  className={cn(
                    "text-xs border",
                    STATUS_COLORS[f.status] ?? "bg-white/10 text-white/50",
                  )}
                >
                  {f.status}
                </Badge>
              </div>

              <span className="w-32 text-center text-white/40 text-xs">
                {f.data_emissao
                  ? new Date(f.data_emissao).toLocaleDateString("pt-BR")
                  : "—"}
              </span>

              <div className="w-20 flex justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                  onClick={() => openEdit(f as Fatura)}
                  data-testid={`button-edit-pedido-${f.id}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => setDeleteTarget(f as Fatura)}
                  data-testid={`button-delete-pedido-${f.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Pedido</DialogTitle>
            <DialogDescription className="text-white/40">
              Altere os dados da nota fiscal e salve.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="numero_nf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Número NF</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-edit-numero-nf"
                          placeholder="NF-0001"
                          className="bg-[#0F0F12] border-white/10 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="bg-[#0F0F12] border-white/10 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          {TIPO_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t} className="text-white capitalize">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10">
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="text-white capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="data_emissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Data de Emissão</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-[#0F0F12] border-white/10 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_vencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Data de Vencimento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-[#0F0F12] border-white/10 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditTarget(null)}
                  className="text-white/60 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save-edit-pedido"
                  className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                  disabled={editFatura.isPending}
                >
                  {editFatura.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Pedido</DialogTitle>
            <DialogDescription className="text-white/40">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 my-2">
            <p className="text-white/80 text-sm">
              Tem certeza que deseja excluir a nota{" "}
              <span className="font-semibold text-white">
                {deleteTarget?.numero_nf ?? `NF-${deleteTarget?.id.slice(0, 6)}`}
              </span>
              ?
            </p>
            {deleteTarget?.valor != null && (
              <p className="text-red-400 text-sm mt-1">
                Valor: R${" "}
                {Number(deleteTarget.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="text-white/60 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              data-testid="button-confirm-delete-pedido"
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-600/80 text-white"
              disabled={deleteFatura.isPending}
            >
              {deleteFatura.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
