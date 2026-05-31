import { useState, useMemo, useEffect } from "react";
import { useListPacientes, useListMedicamentos, useListProcessos } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Copy, ExternalLink, RefreshCw, Phone, Search, X, ChevronDown,
  Clock, CheckCircle2,
} from "lucide-react";
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
    label: "Acompanhamento Paciente",
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

type HistoricoItem = {
  id: string;
  paciente_id: string;
  tipo: string;
  tipo_label: string;
  mensagem: string;
  canal: string;
  created_at: string;
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

const PALETTE = [
  { bg: "linear-gradient(135deg,#1a4d6b,#0d2b3d)", ring: "#2a8cc4", text: "#6ec6f0", badge: "bg-sky-500/20 text-sky-300" },
  { bg: "linear-gradient(135deg,#1a4d2e,#0d2b18)", ring: "#22c55e", text: "#86efac", badge: "bg-green-500/20 text-green-300" },
  { bg: "linear-gradient(135deg,#4d1a1a,#2b0d0d)", ring: "#ef4444", text: "#fca5a5", badge: "bg-red-500/20 text-red-300" },
  { bg: "linear-gradient(135deg,#3d2b00,#251a00)", ring: "#f59e0b", text: "#fcd34d", badge: "bg-amber-500/20 text-amber-300" },
  { bg: "linear-gradient(135deg,#2b1a4d,#180d2b)", ring: "#a855f7", text: "#d8b4fe", badge: "bg-purple-500/20 text-purple-300" },
  { bg: "linear-gradient(135deg,#4d1a3a,#2b0d20)", ring: "#ec4899", text: "#f9a8d4", badge: "bg-pink-500/20 text-pink-300" },
  { bg: "linear-gradient(135deg,#1a3a4d,#0d1f2b)", ring: "#06b6d4", text: "#67e8f9", badge: "bg-cyan-500/20 text-cyan-300" },
  { bg: "linear-gradient(135deg,#2d2b00,#1a1900)", ring: "#84cc16", text: "#bef264", badge: "bg-lime-500/20 text-lime-300" },
  { bg: "linear-gradient(135deg,#2b1a00,#1a0f00)", ring: "#F56E0F", text: "#fdba74", badge: "bg-orange-500/20 text-orange-300" },
  { bg: "linear-gradient(135deg,#001a2b,#000d1a)", ring: "#3b82f6", text: "#93c5fd", badge: "bg-blue-500/20 text-blue-300" },
];

function paletteFor(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function iniciais(nome: string) {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function canalLabel(canal: string) {
  return canal === "whatsapp" ? "WhatsApp" : canal === "copiado" ? "Copiado" : canal;
}

export default function Comunicacao() {
  const [pacienteId, setPacienteId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [customText, setCustomText] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const { toast } = useToast();

  const { data: pacientes } = useListPacientes();
  const { data: medicamentos } = useListMedicamentos();
  const { data: processos } = useListProcessos();

  const listaPacientes = useMemo(
    () => (pacientes as Paciente[] ?? []),
    [pacientes],
  );

  const pacientesFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return listaPacientes;
    return listaPacientes.filter((p) =>
      p.nome.toLowerCase().includes(q) ||
      (p.convenio ?? "").toLowerCase().includes(q) ||
      (p.diagnostico ?? "").toLowerCase().includes(q),
    );
  }, [listaPacientes, busca]);

  const paciente = useMemo(
    () => listaPacientes.find((p) => p.id === pacienteId),
    [listaPacientes, pacienteId],
  );

  const medicamentoPaciente = useMemo(
    () => (medicamentos as Medicamento[] ?? []).find((m) => m.paciente_id === pacienteId),
    [medicamentos, pacienteId],
  );

  const processoPaciente = useMemo(
    () => (processos as Processo[] ?? []).find((p) => p.paciente_id === pacienteId),
    [processos, pacienteId],
  );

  // Carregar histórico ao selecionar paciente
  useEffect(() => {
    if (!pacienteId) { setHistorico([]); return; }
    setLoadingHistorico(true);
    fetch(`/api/historico-atendimentos?paciente_id=${pacienteId}`)
      .then((r) => r.ok ? r.json() as Promise<HistoricoItem[]> : [])
      .then((data) => setHistorico(Array.isArray(data) ? data : []))
      .catch(() => setHistorico([]))
      .finally(() => setLoadingHistorico(false));
  }, [pacienteId]);

  async function registrarHistorico(canal: "copiado" | "whatsapp") {
    if (!paciente || !templateId || !mensagem) return;
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    try {
      await fetch("/api/historico-atendimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: pacienteId,
          tipo: templateId,
          tipo_label: tpl?.label ?? templateId,
          mensagem,
          canal,
        }),
      });
      // Refresh history
      const updated = await fetch(`/api/historico-atendimentos?paciente_id=${pacienteId}`)
        .then((r) => r.ok ? r.json() as Promise<HistoricoItem[]> : []);
      setHistorico(Array.isArray(updated) ? updated : []);
    } catch {
      // silently ignore — history is secondary to the main action
    }
  }

  function gerar() {
    if (!paciente || !templateId) return;
    const msg = gerarMensagem(templateId, paciente, medicamentoPaciente, processoPaciente, customText);
    setMensagem(msg);
  }

  function copiar() {
    navigator.clipboard.writeText(mensagem).then(async () => {
      toast({ title: "Mensagem copiada para a area de transferencia." });
      await registrarHistorico("copiado");
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
    void registrarHistorico("whatsapp");
    toast({ title: "Comunicado registrado no historico do paciente." });
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
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-3">
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">1. Selecione o Paciente</p>

            {paciente ? (
              (() => {
                const pal = paletteFor(paciente.nome);
                return (
                  <div
                    style={{ background: pal.bg, boxShadow: `0 0 0 1.5px ${pal.ring}, 0 4px 16px ${pal.ring}33` }}
                    className="rounded-xl p-3 flex items-center gap-3"
                  >
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: `${pal.ring}25`, color: pal.text, boxShadow: `0 0 0 1px ${pal.ring}50` }}
                    >
                      {iniciais(paciente.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{paciente.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {paciente.telefone
                          ? <span className="text-white/50 text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{paciente.telefone}</span>
                          : <span className="text-red-400/60 text-xs">Sem telefone</span>
                        }
                        {paciente.convenio && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", pal.badge)}>{paciente.convenio}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => { setPacienteId(""); setMensagem(""); setPickerOpen(false); setBusca(""); }}
                      className="text-white/30 hover:text-white/70 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })()
            ) : (
              <button
                onClick={() => setPickerOpen((o) => !o)}
                className="w-full flex items-center gap-3 bg-[#0F0F12] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-colors"
              >
                <Search className="h-4 w-4 text-white/30 shrink-0" />
                <span className="text-white/30 text-sm flex-1 text-left">Escolha um paciente...</span>
                <ChevronDown className="h-4 w-4 text-white/20 shrink-0" />
              </button>
            )}

            {pickerOpen && !paciente && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                  <Input
                    autoFocus
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, convênio ou diagnóstico..."
                    className="pl-8 h-9 bg-[#0F0F12] border-white/10 text-white text-sm placeholder:text-white/25"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                  {pacientesFiltrados.length === 0 ? (
                    <p className="text-white/25 text-sm text-center py-6">Nenhum paciente encontrado</p>
                  ) : (
                    pacientesFiltrados.map((p) => {
                      const pal = paletteFor(p.nome);
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setPacienteId(p.id); setMensagem(""); setPickerOpen(false); setBusca(""); }}
                          style={{ background: pal.bg, borderColor: `${pal.ring}40` }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border hover:brightness-110 transition-all text-left"
                        >
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: `${pal.ring}22`, color: pal.text }}
                          >
                            {iniciais(p.nome)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium truncate">{p.nome}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {p.telefone
                                ? <span className="text-white/40 text-[10px] flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{p.telefone}</span>
                                : <span className="text-red-400/50 text-[10px]">Sem telefone</span>
                              }
                              {p.convenio && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", pal.badge)}>{p.convenio}</span>}
                            </div>
                          </div>
                          {p.diagnostico && (
                            <span className="text-white/20 text-[10px] shrink-0 max-w-[80px] truncate text-right">{p.diagnostico}</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {paciente?.diagnostico && (
              <p className="text-white/30 text-xs px-1">
                {paciente.diagnostico}{paciente.cid ? ` — CID ${paciente.cid}` : ""}
              </p>
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

        {/* Coluna direita — preview, ações e histórico */}
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

          {/* Histórico de envios do paciente selecionado */}
          {pacienteId && (
            <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Historico de Envios</p>
                {historico.length > 0 && (
                  <span className="text-white/30 text-xs">{historico.length} registro{historico.length !== 1 ? "s" : ""}</span>
                )}
              </div>

              {loadingHistorico ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-14 bg-white/5 rounded-xl" />)}
                </div>
              ) : historico.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock className="h-7 w-7 text-white/15 mx-auto mb-2" />
                  <p className="text-white/25 text-xs">Nenhum comunicado enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {historico.slice(0, 20).map((h) => {
                    const tpl = TEMPLATES.find((t) => t.id === h.tipo);
                    return (
                      <div key={h.id} className="bg-[#0F0F12] rounded-xl border border-white/5 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#A5FFD6] shrink-0" />
                            <span className="text-white/70 text-xs font-medium">{h.tipo_label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className={cn(
                              "text-[10px] border px-1.5 py-0",
                              h.canal === "whatsapp"
                                ? "bg-green-500/15 text-green-400 border-green-500/20"
                                : "bg-blue-500/15 text-blue-400 border-blue-500/20",
                            )}>
                              {canalLabel(h.canal)}
                            </Badge>
                            {tpl && <Badge className={cn("text-[10px] border px-1.5 py-0", tpl.cor)}>{tpl.id === "personalizado" ? "livre" : "auto"}</Badge>}
                          </div>
                        </div>
                        <p className="text-white/25 text-[10px]">
                          {new Date(h.created_at).toLocaleString("pt-BR", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Dica de uso */}
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-4 space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Como funciona</p>
            <ul className="text-white/40 text-xs space-y-1.5">
              <li>1. Selecione o paciente e o modelo desejado</li>
              <li>2. A mensagem e gerada automaticamente com os dados do cadastro</li>
              <li>3. Copie ou abra diretamente no WhatsApp do paciente</li>
              <li>4. Cada envio e registrado automaticamente no historico do paciente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
