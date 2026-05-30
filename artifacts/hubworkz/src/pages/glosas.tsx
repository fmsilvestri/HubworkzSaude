import { useState } from "react";
import {
  useListGlosas,
  useUpdateGlosa,
  useEditGlosa,
  useDeleteGlosa,
  getListGlosasQueryKey,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { AlertTriangle, Clock, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const recursoSchema = z.object({
  recurso_texto: z.string().min(10, "Descreva o recurso"),
});

const editSchema = z.object({
  motivo: z.string().min(1, "Motivo é obrigatório"),
  valor: z.string().optional(),
  prazo_recurso: z.string().optional(),
  status: z.string().min(1, "Selecione o status"),
});

type RecursoForm = z.infer<typeof recursoSchema>;
type EditForm = z.infer<typeof editSchema>;

type Glosa = {
  id: string;
  motivo?: string | null;
  valor?: number | null;
  status: string;
  prazo_recurso?: string | null;
  recurso_texto?: string | null;
  fatura_id?: string | null;
  processo_id?: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_recurso", label: "Em Recurso" },
  { value: "resolvida", label: "Resolvida" },
];

export default function Glosas() {
  const [recursoId, setRecursoId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Glosa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Glosa | null>(null);

  const { data: glosas, isLoading } = useListGlosas();
  const updateGlosa = useUpdateGlosa();
  const editGlosa = useEditGlosa();
  const deleteGlosa = useDeleteGlosa();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const recursoForm = useForm<RecursoForm>({
    resolver: zodResolver(recursoSchema),
    defaultValues: { recurso_texto: "" },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { motivo: "", valor: "", prazo_recurso: "", status: "pendente" },
  });

  const selected = (glosas ?? []).find((g) => g.id === recursoId);

  const openEdit = (g: Glosa, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(g);
    editForm.reset({
      motivo: g.motivo ?? "",
      valor: g.valor != null ? String(g.valor) : "",
      prazo_recurso: g.prazo_recurso
        ? new Date(g.prazo_recurso).toISOString().split("T")[0]
        : "",
      status: g.status,
    });
  };

  const openDelete = (g: Glosa, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(g);
  };

  const onRecursoSubmit = (values: RecursoForm) => {
    if (!recursoId) return;
    updateGlosa.mutate(
      { id: recursoId, data: { status: "em_recurso", recurso_texto: values.recurso_texto } },
      {
        onSuccess: () => {
          toast({ title: "Recurso enviado com sucesso!" });
          queryClient.invalidateQueries({ queryKey: getListGlosasQueryKey() });
          setRecursoId(null);
          recursoForm.reset();
        },
        onError: () => toast({ title: "Erro ao enviar recurso", variant: "destructive" }),
      },
    );
  };

  const onEditSubmit = (values: EditForm) => {
    if (!editTarget) return;
    editGlosa.mutate(
      {
        id: editTarget.id,
        data: {
          motivo: values.motivo,
          valor: values.valor ? parseFloat(values.valor) : undefined,
          prazo_recurso: values.prazo_recurso || undefined,
          status: values.status,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Glosa atualizada!" });
          queryClient.invalidateQueries({ queryKey: getListGlosasQueryKey() });
          setEditTarget(null);
        },
        onError: () => toast({ title: "Erro ao atualizar glosa", variant: "destructive" }),
      },
    );
  };

  const onDelete = () => {
    if (!deleteTarget) return;
    deleteGlosa.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          toast({ title: "Glosa excluída" });
          queryClient.invalidateQueries({ queryKey: getListGlosasQueryKey() });
          setDeleteTarget(null);
        },
        onError: () => toast({ title: "Erro ao excluir glosa", variant: "destructive" }),
      },
    );
  };

  const statusColor = (s: string) =>
    ({
      pendente: "bg-red-500/15 text-red-400 border-red-500/20",
      em_recurso: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
      resolvida: "bg-green-500/15 text-green-400 border-green-500/20",
    })[s] ?? "bg-white/10 text-white/50";

  const prazoUrgente = (prazo: string | null | undefined) => {
    if (!prazo) return false;
    return Math.ceil((new Date(prazo).getTime() - Date.now()) / 86400000) <= 7;
  };

  const pendentes = (glosas ?? []).filter((g) => g.status === "pendente");
  const outros = (glosas ?? []).filter((g) => g.status !== "pendente");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Glosas</h1>
          <p className="text-white/50 text-sm mt-1">Contestações e recursos de faturamento</p>
        </div>
        {pendentes.length > 0 && (
          <div className="bg-red-500/15 border border-red-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">
              {pendentes.length} glosa{pendentes.length !== 1 ? "s" : ""} pendente{pendentes.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 bg-white/5 rounded-[14px]" />
          ))}
        </div>
      ) : (glosas ?? []).length === 0 ? (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <CheckCircle className="h-10 w-10 text-green-500/40 mx-auto mb-3" />
          <p className="text-white/30">Nenhuma glosa registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pendentes, ...outros].map((g) => (
            <div
              key={g.id}
              data-testid={`card-glosa-${g.id}`}
              className={cn(
                "bg-[#1B1B1E] border rounded-[14px] p-5 hover:border-white/20 transition-colors cursor-pointer",
                g.status === "pendente" && prazoUrgente(g.prazo_recurso)
                  ? "border-red-500/30"
                  : "border-white/10",
              )}
              onClick={() => setRecursoId(g.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      g.status === "pendente"
                        ? "bg-red-500/15"
                        : g.status === "em_recurso"
                          ? "bg-yellow-500/15"
                          : "bg-green-500/15",
                    )}
                  >
                    {g.status === "pendente" ? (
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    ) : g.status === "em_recurso" ? (
                      <Clock className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {g.motivo ?? "Glosa sem motivo especificado"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {g.valor != null && (
                        <span className="text-white/50 text-sm">
                          R$ {Number(g.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {g.prazo_recurso && (
                        <span
                          className={cn(
                            "text-xs",
                            prazoUrgente(g.prazo_recurso)
                              ? "text-red-400 font-semibold"
                              : "text-white/40",
                          )}
                        >
                          Prazo: {new Date(g.prazo_recurso).toLocaleDateString("pt-BR")}
                          {prazoUrgente(g.prazo_recurso) && " — URGENTE"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={cn("border text-xs", statusColor(g.status))}>
                    {g.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                    onClick={(e) => openEdit(g as Glosa, e)}
                    data-testid={`button-edit-glosa-${g.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                    onClick={(e) => openDelete(g as Glosa, e)}
                    data-testid={`button-delete-glosa-${g.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recurso Sheet ── */}
      <Sheet open={!!recursoId} onOpenChange={(o) => !o && setRecursoId(null)}>
        <SheetContent
          side="right"
          className="bg-[#1B1B1E] border-l border-white/10 text-white w-[480px] sm:max-w-[480px]"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Glosa — Recurso</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-6">
              <div className="bg-[#0F0F12] rounded-xl p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Motivo</span>
                  <span className="text-white text-sm text-right max-w-[60%]">
                    {selected.motivo ?? "—"}
                  </span>
                </div>
                {selected.valor != null && (
                  <div className="flex justify-between">
                    <span className="text-white/40 text-sm">Valor</span>
                    <span className="text-white font-bold">
                      R$ {Number(selected.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/40 text-sm">Status</span>
                  <Badge className={cn("border text-xs", statusColor(selected.status))}>
                    {selected.status}
                  </Badge>
                </div>
                {selected.prazo_recurso && (
                  <div className="flex justify-between">
                    <span className="text-white/40 text-sm">Prazo Recurso</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        prazoUrgente(selected.prazo_recurso) ? "text-red-400" : "text-white",
                      )}
                    >
                      {new Date(selected.prazo_recurso).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>

              {selected.status === "pendente" && (
                <Form {...recursoForm}>
                  <form onSubmit={recursoForm.handleSubmit(onRecursoSubmit)} className="space-y-4">
                    <FormField
                      control={recursoForm.control}
                      name="recurso_texto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70">Texto do Recurso</FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="textarea-recurso"
                              {...field}
                              placeholder="Descreva os motivos do recurso..."
                              className="bg-[#0F0F12] border-white/10 text-white min-h-[140px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      data-testid="button-submit-recurso"
                      type="submit"
                      className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                      disabled={updateGlosa.isPending}
                    >
                      {updateGlosa.isPending ? "Enviando..." : "Enviar Recurso"}
                    </Button>
                  </form>
                </Form>
              )}

              {selected.recurso_texto && (
                <div className="bg-[#0F0F12] rounded-xl p-5">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                    Recurso Enviado
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed">{selected.recurso_texto}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Glosa</DialogTitle>
            <DialogDescription className="text-white/40">
              Altere os dados da glosa e salve.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-2">
              <FormField
                control={editForm.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Motivo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-motivo"
                        placeholder="Motivo da glosa..."
                        className="bg-[#0F0F12] border-white/10 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
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
                <FormField
                  control={editForm.control}
                  name="prazo_recurso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Prazo Recurso</FormLabel>
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

              <FormField
                control={editForm.control}
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
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-white">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  data-testid="button-save-edit-glosa"
                  className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
                  disabled={editGlosa.isPending}
                >
                  {editGlosa.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-[#1B1B1E] border border-white/10 text-white sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Glosa</DialogTitle>
            <DialogDescription className="text-white/40">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 my-2">
            <p className="text-white/80 text-sm">
              Tem certeza que deseja excluir a glosa{" "}
              <span className="font-semibold text-white">
                {deleteTarget?.motivo ?? "sem motivo"}
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
              data-testid="button-confirm-delete-glosa"
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-600/80 text-white"
              disabled={deleteGlosa.isPending}
            >
              {deleteGlosa.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
