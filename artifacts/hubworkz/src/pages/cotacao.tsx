import { useState } from "react";
import {
  useListCotacoes,
  useCreateCotacao,
  getListCotacoesQueryKey,
  useListMedicamentos,
  useListDistribuidoras,
  useListProcessos,
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
import { DollarSign, Star, ChevronDown, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  processo_id: z.string().optional(),
  medicamento_id: z.string().optional(),
  fornecedor_tipo: z.string().min(1, "Selecione o tipo"),
  fornecedor_id: z.string().optional(),
  valor: z.string().optional(),
  prazo_entrega: z.string().optional(),
  status: z.string().default("enviada"),
  recomendada: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export default function Cotacao() {
  const [filtroProcessoId, setFiltroProcessoId] = useState("");
  const { data: cotacoes, isLoading } = useListCotacoes({
    processo_id: filtroProcessoId || undefined,
  });
  const { data: medicamentos } = useListMedicamentos();
  const { data: distribuidoras } = useListDistribuidoras();
  const { data: processos } = useListProcessos();
  const createCotacao = useCreateCotacao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const nacional = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fornecedor_tipo: "nacional", status: "enviada", recomendada: false },
  });

  const importadora = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fornecedor_tipo: "importadora", status: "enviada", recomendada: false },
  });

  const selectedMedNacional = medicamentos?.find(
    (m) => m.id === nacional.watch("medicamento_id"),
  );
  const selectedMedImportadora = medicamentos?.find(
    (m) => m.id === importadora.watch("medicamento_id"),
  );

  const onSubmit = (values: FormValues) => {
    const valorNum = values.valor ? parseFloat(values.valor) : undefined;
    createCotacao.mutate(
      { data: { ...values, valor: valorNum } },
      {
        onSuccess: () => {
          toast({ title: "Cotação registrada!" });
          queryClient.invalidateQueries({ queryKey: getListCotacoesQueryKey() });
          nacional.reset({ fornecedor_tipo: "nacional", status: "enviada", recomendada: false });
          importadora.reset({ fornecedor_tipo: "importadora", status: "enviada", recomendada: false });
        },
        onError: () =>
          toast({ title: "Erro ao registrar cotação", variant: "destructive" }),
      },
    );
  };

  type CotacaoItem = NonNullable<typeof cotacoes>[number];
  const recomendada =
    (cotacoes ?? []).reduce<CotacaoItem | undefined>((best, c) => {
      if (!best) return c.recomendada ? c : undefined;
      return c.recomendada ? c : best;
    }, undefined) ??
    (cotacoes ?? []).reduce<CotacaoItem | undefined>((best, c) => {
      if (!best) return c;
      return (c.valor ?? Infinity) < (best.valor ?? Infinity) ? c : best;
    }, undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cotação</h1>
        <p className="text-white/50 text-sm mt-1">
          Compare fornecedores nacional e importadora simultaneamente
        </p>
      </div>

      {/* Filtro por processo */}
      <div>
        <label className="text-white/60 text-sm block mb-1.5">Filtrar por processo</label>
        <Select
          value={filtroProcessoId || "__all__"}
          onValueChange={(v) => setFiltroProcessoId(v === "__all__" ? "" : v)}
        >
          <SelectTrigger
            data-testid="input-processo-cotacao"
            className="bg-[#1B1B1E] border-white/10 text-white"
          >
            <SelectValue placeholder="Todos os processos..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="__all__" className="text-white/60">
              Todos os processos
            </SelectItem>
            {(processos ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-white">
                <span className="font-medium">Processo</span>
                <span className="text-white/40 ml-2 text-xs">
                  Fase {p.fase_atual} — {p.status}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Side-by-side form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {(
          [
            {
              label: "Distribuidora Nacional",
              tipo: "nacional",
              form: nacional,
              color: "text-blue-400",
              bg: "bg-blue-500/15",
              btnClass: "bg-blue-600 hover:bg-blue-600/80",
              selectedMed: selectedMedNacional,
            },
            {
              label: "Importadora Internacional",
              tipo: "importadora",
              form: importadora,
              color: "text-purple-400",
              bg: "bg-purple-500/15",
              btnClass: "bg-purple-600 hover:bg-purple-600/80",
              selectedMed: selectedMedImportadora,
            },
          ] as const
        ).map(({ label, tipo, form: f, color, bg, btnClass, selectedMed }) => (
          <div key={tipo} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
            <div
              className={cn(
                "inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-xl text-sm font-semibold",
                bg,
                color,
              )}
            >
              <DollarSign className="h-4 w-4" />
              {label}
            </div>

            <Form {...f}>
              <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-4">

                {/* Medicamento — select do cadastro */}
                <FormField
                  control={f.control}
                  name="medicamento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Medicamento</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger
                            data-testid={`select-medicamento-${tipo}`}
                            className="bg-[#0F0F12] border-white/10 text-white"
                          >
                            <SelectValue placeholder="Selecionar medicamento..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-56">
                          {(medicamentos ?? []).length === 0 && (
                            <div className="px-3 py-2 text-white/40 text-sm">
                              Nenhum medicamento cadastrado
                            </div>
                          )}
                          {(medicamentos ?? []).map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-white">
                              <div className="flex flex-col">
                                <span className="font-medium">{m.nome}</span>
                                {m.principio_ativo && (
                                  <span className="text-white/40 text-xs">
                                    {m.principio_ativo}
                                    {m.apresentacao ? ` — ${m.apresentacao}` : ""}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview do medicamento selecionado */}
                {selectedMed && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                    <Pill className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium">{selectedMed.nome}</p>
                      {selectedMed.principio_ativo && (
                        <p className="text-white/40 text-[11px]">
                          {selectedMed.principio_ativo}
                          {selectedMed.apresentacao ? ` — ${selectedMed.apresentacao}` : ""}
                          {selectedMed.classe ? ` · ${selectedMed.classe}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fornecedor — select de distribuidoras */}
                <FormField
                  control={f.control}
                  name="fornecedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Fornecedor</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger
                            data-testid={`input-fornecedor-${tipo}`}
                            className="bg-[#0F0F12] border-white/10 text-white"
                          >
                            <SelectValue placeholder="Selecionar fornecedor..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-56">
                          {(distribuidoras ?? []).length === 0 && (
                            <div className="px-3 py-2 text-white/40 text-sm">
                              Nenhuma distribuidora cadastrada
                            </div>
                          )}
                          {(distribuidoras ?? []).map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-white">
                              <span className="font-medium">{d.nome}</span>
                              {d.tipo && (
                                <span className="text-white/40 ml-2 text-xs capitalize">
                                  {d.tipo}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor */}
                <FormField
                  control={f.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid={`input-valor-${tipo}`}
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

                {/* Prazo */}
                <FormField
                  control={f.control}
                  name="prazo_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Prazo de Entrega</FormLabel>
                      <FormControl>
                        <Input
                          data-testid={`input-prazo-${tipo}`}
                          {...field}
                          placeholder="Ex: 15 dias úteis"
                          className="bg-[#0F0F12] border-white/10 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid={`button-submit-cotacao-${tipo}`}
                  type="submit"
                  className={cn("w-full text-white", btnClass)}
                  disabled={createCotacao.isPending}
                >
                  Registrar Cotação
                </Button>
              </form>
            </Form>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {recomendada && (
        <div className="bg-[rgba(63,52,137,0.2)] border border-[#3C3489]/40 rounded-[14px] p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-[#A5FFD6]/15 rounded-xl flex items-center justify-center">
            <Star className="h-6 w-6 text-[#A5FFD6]" />
          </div>
          <div>
            <p className="text-[#A5FFD6] font-semibold text-sm">Recomendação Di IA</p>
            <p className="text-white/70 text-sm mt-0.5">
              Melhor opção:{" "}
              <span className="capitalize">{recomendada.fornecedor_tipo}</span> — R${" "}
              {Number(recomendada.valor ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}{" "}
              — Prazo: {recomendada.prazo_entrega ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* Cotacoes List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 bg-white/5 rounded-[14px]" />
          ))}
        </div>
      ) : (
        (cotacoes ?? []).length > 0 && (
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-white/60 text-sm font-semibold">Histórico de Cotações</p>
            </div>
            {(cotacoes ?? []).map((c) => (
              <div
                key={c.id}
                data-testid={`row-cotacao-${c.id}`}
                className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-4">
                  {c.recomendada && <Star className="h-4 w-4 text-[#A5FFD6]" />}
                  <div>
                    <p className="text-white text-sm font-medium capitalize">
                      {c.fornecedor_tipo}
                    </p>
                    <p className="text-white/40 text-xs">
                      {c.prazo_entrega ?? "Prazo não informado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">
                    R${" "}
                    {Number(c.valor ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <Badge
                    className={
                      c.recomendada
                        ? "bg-[#A5FFD6]/15 text-[#A5FFD6] border-[#A5FFD6]/20"
                        : "bg-white/10 text-white/50 border-white/10"
                    }
                  >
                    {c.recomendada ? "Recomendada" : c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
