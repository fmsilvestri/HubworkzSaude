import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListPacientes,
  useListMedicamentos,
  type Paciente,
  type Medicamento,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { FileText, Download, ChevronDown, Check, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD = "bg-[#0F0F12] border-white/10 text-white placeholder:text-white/30";

const schema = z.object({
  paciente_nome: z.string().min(2, "Selecione ou informe o paciente"),
  paciente_id: z.string().optional(),
  medicamento_nome: z.string().min(1, "Selecione ou informe o medicamento"),
  medicamento_id: z.string().optional(),
  cid: z.string().optional(),
  valor_unitario: z.string().optional(),
  valor_caixa: z.string().optional(),
  prazo_entrega: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Combobox genérico ──────────────────────────────────────────────────────────
function SearchCombobox({
  items,
  value,
  placeholder,
  onSelect,
}: {
  items: { id: string; label: string; sub?: string }[];
  value: string;
  placeholder: string;
  onSelect: (id: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border px-3 cursor-pointer text-sm",
          FIELD,
          open && "border-[#F56E0F]/60"
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "text-white" : "text-white/30"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-white/40 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-[#1B1B1E] shadow-lg">
          <div className="p-2 border-b border-white/10">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className={cn(FIELD, "h-8 text-sm")}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-4">
                Nenhum resultado
              </p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 text-sm"
                  onClick={() => {
                    onSelect(item.id, item.label);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-[#F56E0F]",
                      value === item.label ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p className="text-white">{item.label}</p>
                    {item.sub && (
                      <p className="text-white/40 text-xs">{item.sub}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {query && filtered.length === 0 && (
            <div
              className="px-3 py-2 cursor-pointer hover:bg-white/5 text-sm border-t border-white/10"
              onClick={() => {
                onSelect("", query);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="text-white/60">Usar </span>
              <span className="text-white font-medium">"{query}"</span>
              <span className="text-white/60"> como texto livre</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PDF generator ──────────────────────────────────────────────────────────────
function gerarPDF(values: FormValues) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 25;
  const usable = W - margin * 2;

  // Cores
  const laranja: [number, number, number] = [109, 40, 217];
  const cinzaEscuro: [number, number, number] = [30, 30, 30];
  const cinzaMedio: [number, number, number] = [80, 80, 80];

  // Cabeçalho com fundo roxo
  doc.setFillColor(...laranja);
  doc.rect(0, 0, W, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("NOOVA ONCOLOGIA", margin, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Florianópolis, SC", margin, 19);

  // Número do orçamento + data no canto direito
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255, 0.9);
  doc.text(`Data: ${dataFormatada}`, W - margin, 13, { align: "right" });

  // Linha separadora
  doc.setDrawColor(...laranja);
  doc.setLineWidth(0.5);
  doc.line(margin, 32, W - margin, 32);

  // Título do documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...cinzaEscuro);
  doc.text("Orçamento", W / 2, 42, { align: "center" });

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...cinzaMedio);
  doc.text("Documento gerado pelo sistema HubWorkz Saúde", W / 2, 48, {
    align: "center",
  });

  let y = 58;

  // Saudação
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...cinzaEscuro);
  doc.text("Prezados,", margin, y);
  y += 8;

  const intro = `Conforme solicitado segue orçamento para o(a) "${values.paciente_nome}", referente ao medicamento:`;
  const introLines = doc.splitTextToSize(intro, usable) as string[];
  doc.text(introLines, margin, y);
  y += introLines.length * 5.5 + 6;

  // CID (se informado)
  if (values.cid) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...cinzaEscuro);
    doc.text(`CID: ${values.cid}`, margin, y);
    y += 8;
  }

  // Caixa de dados do orçamento — só inclui linhas com valor preenchido
  const bullet = "\u2022";
  const linhasCandidatas: { label: string; valor: string }[] = [
    { label: "Medicamento", valor: values.medicamento_nome },
    ...(values.valor_unitario ? [{ label: "Valor Unitário", valor: values.valor_unitario }] : []),
    ...(values.valor_caixa ? [{ label: "Valor 1 caixa", valor: values.valor_caixa }] : []),
    ...(values.prazo_entrega ? [{ label: "Prazo de entrega", valor: values.prazo_entrega }] : []),
  ];

  const boxHeight = 14 + linhasCandidatas.length * 9;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, usable, boxHeight, 2, 2, "FD");

  const innerLeft = margin + 6;
  let iy = y + 10;

  for (const linha of linhasCandidatas) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...cinzaMedio);
    doc.text(`${bullet}  `, innerLeft, iy);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...cinzaEscuro);
    doc.text(`${linha.label}: `, innerLeft + 5, iy);

    const labelWidth = doc.getTextWidth(`${linha.label}: `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...cinzaMedio);
    doc.text(linha.valor, innerLeft + 5 + labelWidth, iy);
    iy += 9;
  }

  y += boxHeight + 4;

  // Observações adicionais (se preenchidas)
  if (values.observacoes) {
    doc.setFillColor(252, 248, 243);
    doc.setDrawColor(...laranja);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, usable, 20, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...laranja);
    doc.text("Observações:", innerLeft, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...cinzaEscuro);
    const obsLines = doc.splitTextToSize(values.observacoes, usable - 12) as string[];
    doc.text(obsLines, innerLeft, y + 13);
    y += 26;
  }

  y += 6;

  // Corpo do texto do orçamento
  const corpo =
    "Orçamento realizado conforme prescrição enviada pelo(a) paciente, para execução/aplicação " +
    "dele será necessário consulta e avaliação do nosso corpo clínico. Caso haja alteração no " +
    "protocolo será necessário novo orçamento.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...cinzaEscuro);
  const corpoLines = doc.splitTextToSize(corpo, usable) as string[];
  doc.text(corpoLines, margin, y);
  y += corpoLines.length * 5.5 + 8;

  doc.text(
    "Desde já agradecemos a atenção e nos colocamos à disposição.",
    margin,
    y
  );
  y += 12;

  // Assinatura
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...cinzaMedio);
  doc.text("Atenciosamente,", margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...laranja);
  doc.text(`Noova Oncologia — Florianópolis, ${dataFormatada}.`, margin, y);

  // Linha de rodapé
  doc.setDrawColor(...laranja);
  doc.setLineWidth(0.4);
  doc.line(margin, 280, W - margin, 280);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...cinzaMedio);
  doc.text(
    "Documento gerado pelo HubWorkz Saúde · Noova Oncologia Florianópolis",
    W / 2,
    285,
    { align: "center" }
  );

  const nomePaciente = values.paciente_nome.replace(/\s+/g, "_");
  doc.save(`orcamento_${nomePaciente}_${hoje.toISOString().slice(0, 10)}.pdf`);
}

// ── WhatsApp text formatter ────────────────────────────────────────────────────
function abrirWhatsApp(values: FormValues) {
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const linhas: string[] = [];
  linhas.push("*Orçamento*");
  linhas.push("_Noova Oncologia — Florianópolis_");
  linhas.push("");
  linhas.push("Prezados,");
  linhas.push("");
  linhas.push(
    `Conforme solicitado segue orçamento para o(a) *${values.paciente_nome}*, referente ao medicamento:`
  );
  linhas.push("");
  if (values.cid) linhas.push(`CID: ${values.cid}`);
  linhas.push(`• *Medicamento:* ${values.medicamento_nome}`);
  if (values.valor_unitario)
    linhas.push(`• *Valor Unitário:* ${values.valor_unitario}`);
  if (values.valor_caixa)
    linhas.push(`• *Valor 1 caixa:* ${values.valor_caixa}`);
  if (values.prazo_entrega)
    linhas.push(`• *Prazo de entrega:* ${values.prazo_entrega}`);
  if (values.observacoes) {
    linhas.push("");
    linhas.push(`_Obs: ${values.observacoes}_`);
  }
  linhas.push("");
  linhas.push(
    "Orçamento realizado conforme prescrição enviada pelo(a) paciente. " +
      "Para execução/aplicação será necessário consulta e avaliação do nosso corpo clínico. " +
      "Caso haja alteração no protocolo será necessário novo orçamento."
  );
  linhas.push("");
  linhas.push("Desde já agradecemos a atenção e nos colocamos à disposição.");
  linhas.push("");
  linhas.push(`Atenciosamente,`);
  linhas.push(`*Noova Oncologia — Florianópolis, ${dataFormatada}.*`);

  const texto = linhas.join("\n");
  window.open(
    `https://wa.me/?text=${encodeURIComponent(texto)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function Orcamentos() {
  const { toast } = useToast();
  const { data: pacientes } = useListPacientes();
  const { data: medicamentos } = useListMedicamentos();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paciente_nome: "",
      medicamento_nome: "",
      cid: "",
      valor_unitario: "",
      valor_caixa: "",
      prazo_entrega: "",
      observacoes: "",
    },
  });

  const pacienteItems = (pacientes ?? []).map((p: Paciente) => ({
    id: p.id,
    label: p.nome,
    sub: p.cpf ?? undefined,
  }));

  const medicamentoItems = (medicamentos ?? []).map((m: Medicamento) => ({
    id: m.id,
    label: m.nome,
    sub: m.principio_ativo ?? m.apresentacao ?? undefined,
  }));

  function onSubmit(values: FormValues) {
    gerarPDF(values);
    toast({
      title: "PDF gerado",
      description: `Orçamento para ${values.paciente_nome} baixado com sucesso.`,
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex items-center justify-center rounded-[9px]"
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #F56E0F 0%, #c4530a 100%)",
              boxShadow: "0 4px 12px rgba(245,110,15,0.4)",
            }}
          >
            <FileText className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-bold text-white">Envio de Orçamentos</h1>
        </div>
        <p className="text-white/50 text-sm ml-[48px]">
          Gere o PDF do orçamento liminar judicial para envio ao paciente
        </p>
      </div>

      {/* Card do formulário */}
      <div className="bg-[#1B1B1E] rounded-xl border border-white/8 p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Paciente + Medicamento */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                Identificação
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paciente_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">
                        Paciente
                      </FormLabel>
                      <FormControl>
                        <SearchCombobox
                          items={pacienteItems}
                          value={field.value}
                          placeholder="Selecionar paciente..."
                          onSelect={(id, label) => {
                            field.onChange(label);
                            form.setValue("paciente_id", id);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medicamento_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">
                        Medicamento
                      </FormLabel>
                      <FormControl>
                        <SearchCombobox
                          items={medicamentoItems}
                          value={field.value}
                          placeholder="Selecionar medicamento..."
                          onSelect={(id, label) => {
                            field.onChange(label);
                            form.setValue("medicamento_id", id);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* CID */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                Diagnóstico
              </p>
              <FormField
                control={form.control}
                name="cid"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel className="text-white/70 text-sm">
                      CID{" "}
                      <span className="text-white/30 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: C34.1"
                        className={FIELD}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valores */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                Valores e Prazo
              </p>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valor_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">
                        Valor Unitário
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="R$ 0,00"
                          className={FIELD}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_caixa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">
                        Valor Caixa
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="R$ 0,00"
                          className={FIELD}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prazo_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">
                        Prazo de Entrega
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: 7 dias úteis"
                          className={FIELD}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                Observações Adicionais
              </p>
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-sm">
                      Observações{" "}
                      <span className="text-white/30 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Informações adicionais a incluir no orçamento..."
                        className={cn(FIELD, "resize-none")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preview do documento */}
            <div className="rounded-lg border border-white/8 bg-[#0F0F12] p-5 text-sm text-white/70 leading-relaxed">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                Previa do documento
              </p>
              <p className="mb-2 text-white/80 font-medium">
                Orçamento
              </p>
              <p className="mb-3">Prezados,</p>
              <p className="mb-3">
                Conforme solicitado segue orçamento para o(a){" "}
                <span className="text-[#F56E0F]">
                  {form.watch("paciente_nome") || "[paciente]"}
                </span>
                , referente ao medicamento:
              </p>
              {form.watch("cid") && (
                <p className="mb-2">
                  <strong>CID:</strong> {form.watch("cid")}
                </p>
              )}
              <ul className="list-disc ml-4 space-y-1 mb-3">
                <li>
                  <strong>Medicamento:</strong>{" "}
                  {form.watch("medicamento_nome") || "[medicamento]"}
                </li>
                {form.watch("valor_unitario") && (
                  <li>
                    <strong>Valor Unitário:</strong>{" "}
                    {form.watch("valor_unitario")}
                  </li>
                )}
                {form.watch("valor_caixa") && (
                  <li>
                    <strong>Valor 1 caixa:</strong>{" "}
                    {form.watch("valor_caixa")}
                  </li>
                )}
                {form.watch("prazo_entrega") && (
                  <li>
                    <strong>Prazo de entrega:</strong>{" "}
                    {form.watch("prazo_entrega")}
                  </li>
                )}
              </ul>
              <p className="text-white/50 text-xs italic">
                Orçamento realizado conforme prescrição enviada pelo(a) paciente,
                para execução/aplicação dele será necessário consulta e avaliação
                do nosso corpo clínico...
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={form.handleSubmit(abrirWhatsApp)}
                className="bg-[#25D366] hover:bg-[#1da851] text-white font-semibold px-6 gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar via WhatsApp
              </Button>
              <Button
                type="submit"
                className="bg-[#F56E0F] hover:bg-[#d4590c] text-white font-semibold px-6 gap-2"
              >
                <Download className="h-4 w-4" />
                Gerar PDF
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
