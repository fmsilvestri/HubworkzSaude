import { useState, useMemo } from "react";
import { useListPacientes, useListMedicamentos, useListProcessos } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Copy, ExternalLink, RefreshCw, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  label: string;
  descricao: string;
  cor: string;
};

const TEMPLATES: Template[] = [
  {
    id: "andamento",
    label: "Andamento do Tratamento",
    descricao: "Resumo do status do processo e próximos passos",
    cor: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  {
    id: "prazo_medicacao",
    label: "Prazo de Medicacao",
    descricao: "Alerta sobre vencimento ou entrega do medicamento",
    cor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  },
  {
    id: "lembrete_contato",
    label: "Lembrete D30",
    descricao: "Contato mensal de monitoramento clinico",
    cor: "bg-green-500/15 text-green-400 border-green-500/20",
  },
  {
    id: "documentacao",
    label: "Pendencia de Documentacao",
    descricao: "Solicitacao de documentos em aberto",
    cor: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  },
  {
    id: "personalizado",
    label: "Mensagem Personalizada",
    descricao: "Escreva uma mensagem livre",
    cor: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  },
];

type Paciente = {
  id: string;
  nome: string;
  telefone?: string | null;
  diagnostico?: string | null;
  cid?: string | null;
  convenio?: string | null;
};

type Medicamento = {
  id: string;
  nome: string;
  validade?: string | null;
  paciente_id?: string | null;
};

type Processo = {
  id: string;
  paciente_id?: string | null;
  status?: string | null;
  fase?: string | null;
  medicamento?: string | null;
};

function gerarMensagem(
  template: string,
  paciente: Paciente,
  medicamento: Medicamento | undefined,
  processo: Processo | undefined,
  customText: string,
): string {
  const nome = paciente.nome.split(" ")[0];
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  switch (template) {
    case "andamento":
      return [
        `Ola, ${nome}! Tudo bem?`,
        ``,
        `Entramos em contato para informar sobre o andamento do seu tratamento.`,
        ``,
        processo
          ? `📋 *Status atual:* ${processo.status ?? "Em andamento"}${processo.fase ? ` — ${processo.fase}` : ""}`
          : `📋 *Status:* Processo em acompanhamento`,
        medicamento
          ? `💊 *Medicamento:* ${medicamento.nome}`
          : ``,
        paciente.diagnostico
          ? `🏥 *Diagnostico:* ${paciente.diagnostico}${paciente.cid ? ` (CID: ${paciente.cid})` : ""}`
          : ``,
        ``,
        `Nossa equipe esta acompanhando cada etapa. Qualquer duvida, estamos a disposicao!`,
        ``,
        `*HubWorkz Saude* — ${hoje}`,
      ].filter((l) => l !== "").join("\n");

    case "prazo_medicacao":
      return [
        `Ola, ${nome}! Tudo bem?`,
        ``,
        `Gostaríamos de informar sobre o prazo do seu medicamento.`,
        ``,
        medicamento
          ? [
              `💊 *Medicamento:* ${medicamento.nome}`,
              medicamento.validade
                ? `📅 *Validade:* ${new Date(medicamento.validade).toLocaleDateString("pt-BR")}`
                : `📅 *Validade:* Verificar com a equipe`,
            ].join("\n")
          : `💊 *Medicamento:* Confirmar com a equipe`,
        ``,
        `Por favor, entre em contato caso precise de orientacoes sobre reposicao ou renovacao.`,
        ``,
        `*HubWorkz Saude* — ${hoje}`,
      ].filter((l) => l !== "").join("\n");

    case "lembrete_contato":
      return [
        `Ola, ${nome}! Tudo bem?`,
        ``,
        `Este e o seu contato mensal de monitoramento D30 da equipe HubWorkz Saude.`,
        ``,
        `Gostaríamos de saber como voce esta se sentindo com o tratamento:`,
        ``,
        `• Como esta a adesao ao medicamento?`,
        `• Houve algum efeito adverso ou desconforto?`,
        `• Precisou de algum atendimento medico neste periodo?`,
        ``,
        `Sua resposta e muito importante para o acompanhamento do seu tratamento!`,
        ``,
        `*HubWorkz Saude* — ${hoje}`,
      ].join("\n");

    case "documentacao":
      return [
        `Ola, ${nome}! Tudo bem?`,
        ``,
        `Identificamos pendencias de documentacao no seu processo.`,
        ``,
        `Para darmos continuidade ao seu atendimento, precisamos dos seguintes documentos:`,
        ``,
        `📄 Receita medica atualizada`,
        `📄 Laudo ou relatorio medico`,
        `📄 Carteirinha do convenio — ${paciente.convenio ?? "verificar"}`,
        ``,
        `Por favor, envie o quanto antes para nao atrasar o processo.`,
        ``,
        `Qualquer duvida, estamos aqui para ajudar!`,
        ``,
        `*HubWorkz Saude* — ${hoje}`,
      ].join("\n");

    case "personalizado":
      return customText;

    default:
      return "";
  }
}

function formatarTelefone(tel: string | null | undefined): string {
  if (!tel) return "";
  return tel.replace(/\D/g, "");
}

export default function Comunicacao() {
  const [pacienteId, setPacienteId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [customText, setCustomText] = useState("");
  const [mensagem, setMensagem] = useState("");
  const { toast } = useToast();

  const { data: pacientes } = useListPacientes();
  const { data: medicamentos } = useListMedicamentos();
  const { data: processos } = useListProcessos();

  const paciente = useMemo(
    () => (pacientes as Paciente[] ?? []).find((p) => p.id === pacienteId),
    [pacientes, pacienteId],
  );

  const medicamentoPaciente = useMemo(
    () => (medicamentos as Medicamento[] ?? []).find((m) => m.paciente_id === pacienteId),
    [medicamentos, pacienteId],
  );

  const processoPaciente = useMemo(
    () => (processos as Processo[] ?? []).find((p) => p.paciente_id === pacienteId),
    [processos, pacienteId],
  );

  function gerar() {
    if (!paciente || !templateId) return;
    const msg = gerarMensagem(templateId, paciente, medicamentoPaciente, processoPaciente, customText);
    setMensagem(msg);
  }

  function copiar() {
    navigator.clipboard.writeText(mensagem).then(() => {
      toast({ title: "Mensagem copiada para a area de transferencia." });
    });
  }

  function abrirWhatsApp() {
    if (!paciente?.telefone) {
      toast({ title: "Paciente sem telefone cadastrado.", variant: "destructive" });
      return;
    }
    const tel = formatarTelefone(paciente.telefone);
    const url = `https://wa.me/55${tel}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  }

  const templateAtual = TEMPLATES.find((t) => t.id === templateId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Comunicacao com Pacientes</h1>
        <p className="text-white/50 text-sm mt-1">Gere mensagens formatadas e envie diretamente pelo WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna esquerda — seleção */}
        <div className="space-y-5">
          {/* Selecionar paciente */}
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-4">
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">1. Selecione o Paciente</p>
            <Select value={pacienteId} onValueChange={(v) => { setPacienteId(v); setMensagem(""); }}>
              <SelectTrigger className="bg-[#0F0F12] border-white/10 text-white">
                <SelectValue placeholder="Escolha um paciente..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1B1B1E] border-white/10">
                {(pacientes as Paciente[] ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {paciente && (
              <div className="bg-[#0F0F12] rounded-xl border border-white/5 p-4 space-y-1.5 text-sm">
                <p className="text-white font-medium">{paciente.nome}</p>
                {paciente.telefone ? (
                  <p className="text-white/50 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {paciente.telefone}
                  </p>
                ) : (
                  <p className="text-red-400/70 text-xs">Sem telefone cadastrado</p>
                )}
                {paciente.diagnostico && <p className="text-white/40 text-xs">{paciente.diagnostico}{paciente.cid ? ` — CID ${paciente.cid}` : ""}</p>}
                {paciente.convenio && <p className="text-white/40 text-xs">Convenio: {paciente.convenio}</p>}
              </div>
            )}
          </div>

          {/* Selecionar template */}
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-4">
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">2. Selecione o Modelo</p>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTemplateId(t.id); setMensagem(""); }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all",
                    templateId === t.id
                      ? "border-[#F56E0F]/50 bg-[#F56E0F]/10"
                      : "border-white/5 bg-[#0F0F12] hover:border-white/15",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm font-medium">{t.label}</span>
                    <Badge className={cn("border text-xs shrink-0", t.cor)}>{t.id === "personalizado" ? "livre" : "auto"}</Badge>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{t.descricao}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Campo livre para personalizado */}
          {templateId === "personalizado" && (
            <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-3">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Sua mensagem</p>
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Digite a mensagem personalizada aqui..."
                className="bg-[#0F0F12] border-white/10 text-white min-h-[140px] resize-none text-sm"
              />
            </div>
          )}

          <Button
            onClick={gerar}
            disabled={!pacienteId || !templateId || (templateId === "personalizado" && !customText.trim())}
            className="w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Gerar Mensagem
          </Button>
        </div>

        {/* Coluna direita — preview e ações */}
        <div className="space-y-4">
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Preview da Mensagem</p>
              {templateAtual && <Badge className={cn("border text-xs", templateAtual.cor)}>{templateAtual.label}</Badge>}
            </div>

            {mensagem ? (
              <>
                <div className="bg-[#0F0F12] rounded-xl border border-white/5 p-4">
                  <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                    {mensagem}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    variant="outline"
                    onClick={copiar}
                    className="border-white/10 text-white hover:bg-white/5 gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                  <Button
                    onClick={abrirWhatsApp}
                    className="bg-[#25D366] hover:bg-[#1ebe5c] text-white gap-2"
                    disabled={!paciente?.telefone}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir no WhatsApp
                  </Button>
                </div>

                {!paciente?.telefone && (
                  <p className="text-yellow-400/70 text-xs text-center">
                    Cadastre o telefone do paciente para enviar pelo WhatsApp
                  </p>
                )}
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-3">
                <MessageSquare className="h-10 w-10 text-white/10" />
                <p className="text-white/25 text-sm">
                  {pacienteId && templateId
                    ? 'Clique em "Gerar Mensagem" para visualizar'
                    : "Selecione o paciente e o modelo para comecar"}
                </p>
              </div>
            )}
          </div>

          {/* Dica de uso */}
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-4 space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Como funciona</p>
            <ul className="text-white/40 text-xs space-y-1.5">
              <li>1. Selecione o paciente e o modelo desejado</li>
              <li>2. A mensagem e gerada automaticamente com os dados do cadastro</li>
              <li>3. Copie ou abra diretamente no WhatsApp do paciente</li>
              <li>4. Para personalizar, escolha o modelo "Mensagem Personalizada"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
