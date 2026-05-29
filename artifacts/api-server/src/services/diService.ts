import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

// ─── Context types ────────────────────────────────────────────────────────────

export interface GestorCtx {
  totalProcessos: number;
  emCotacao: number;
  emLogistica: number;
  emMonitoramento: number;
  emFaturamento: number;
  totalPacientes: number;
  mandatosPendentes: number;
  d30Semana: number;
  emTransito: number;
  entreguesMes: number;
  faturamento: string;
  glosas: number;
  distribuidoras: number;
}

export interface PacienteCtx {
  nome: string;
  med: {
    nome: string;
    apresentacao: string;
    modo_uso: string;
    conservacao: string;
  };
  dataInicio: string;
  d30Data: string;
}

// ─── Tool result types ────────────────────────────────────────────────────────

export interface ToolCard {
  type: "card";
  title: string;
  data: Record<string, unknown>;
}

// ─── Context builders ─────────────────────────────────────────────────────────

export async function buildGestorCtx(clinica_id: string): Promise<GestorCtx> {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const semanaFim = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    processos,
    pacientes,
    monitoramentos,
    remessasTransito,
    remessasMes,
    faturas,
    glosas,
    distribuidoras,
  ] = await Promise.all([
    supabase.from("processos").select("status", { count: "exact" }),
    supabase.from("pacientes").select("mandato_status", { count: "exact" }),
    supabase
      .from("monitoramentos")
      .select("data_contato")
      .gte("data_contato", now.toISOString())
      .lte("data_contato", semanaFim),
    supabase
      .from("notas_fiscais")
      .select("id", { count: "exact" })
      .eq("status", "transito"),
    supabase
      .from("notas_fiscais")
      .select("id", { count: "exact" })
      .eq("status", "entregue")
      .gte("data_emissao", `${mesAtual}-01`),
    supabase
      .from("notas_fiscais")
      .select("valor_total")
      .gte("data_emissao", `${mesAtual}-01`)
      .eq("status", "emitida"),
    supabase
      .from("glosas")
      .select("id", { count: "exact" })
      .in("status", ["aberta", "em_analise"]),
    supabase.from("distribuidoras").select("id", { count: "exact" }).eq("ativo", true),
  ]);

  const processosData = processos.data ?? [];
  const faturamentoTotal = (faturas.data ?? []).reduce(
    (sum, nf) => sum + Number((nf as { valor_total?: unknown }).valor_total ?? 0),
    0
  );

  const mandatosPendentes = (pacientes.data ?? []).filter(
    (p) => (p as { mandato_status?: string }).mandato_status === "pendente"
  ).length;

  return {
    totalProcessos: processos.count ?? 0,
    emCotacao: processosData.filter((p) => p.status === "cotacao").length,
    emLogistica: processosData.filter((p) => p.status === "logistica").length,
    emMonitoramento: processosData.filter((p) => p.status === "monitoramento").length,
    emFaturamento: processosData.filter((p) => p.status === "faturamento").length,
    totalPacientes: pacientes.count ?? 0,
    mandatosPendentes,
    d30Semana: monitoramentos.data?.length ?? 0,
    emTransito: remessasTransito.count ?? 0,
    entreguesMes: remessasMes.count ?? 0,
    faturamento: faturamentoTotal.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    glosas: glosas.count ?? 0,
    distribuidoras: distribuidoras.count ?? 0,
  };
}

export async function buildPacienteCtx(user_id: string): Promise<PacienteCtx | null> {
  const { data: paciente } = await supabase
    .from("pacientes")
    .select(`
      nome,
      medicamento:medicamentos(nome, concentracao, via_administracao, conservacao),
      processo:processos(created_at),
      monitoramentos(data_contato, status)
    `)
    .eq("user_id", user_id)
    .single();

  if (!paciente) return null;

  const med = (paciente as Record<string, unknown>).medicamento as Record<string, string> | null;
  const processo = (paciente as Record<string, unknown>).processo as Record<string, string> | null;
  const monitoramentos = (paciente as Record<string, unknown>).monitoramentos as Array<{ data_contato?: string; status: string }> | null;

  const agora = new Date();
  const proximoD30 = (monitoramentos ?? [])
    .filter((m) => m.status === "agendado" && m.data_contato)
    .map((m) => new Date(m.data_contato!))
    .filter((d) => d > agora)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const d30Data = proximoD30
    ? proximoD30.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "a agendar";

  const dataInicio = processo?.created_at
    ? new Date(processo.created_at).toLocaleDateString("pt-BR")
    : "a informar";

  return {
    nome: (paciente as Record<string, unknown>).nome as string,
    med: {
      nome: med?.nome ?? "não informado",
      apresentacao: med?.concentracao ?? "não informada",
      modo_uso: med?.via_administracao ?? "consulte o médico",
      conservacao: med?.conservacao ?? "consulte a farmácia",
    },
    dataInicio,
    d30Data,
  };
}

// ─── System prompts ───────────────────────────────────────────────────────────

export function buildSystemPrompt(ctx: GestorCtx, role: string): string {
  return `Você é a Di, inteligência artificial do HubWorkz Saúde.
Acesso completo a todos os dados desta clínica.

PERFIL ATUAL: ${role}

DADOS DO SISTEMA (atualizados em tempo real):
• Processos ativos: ${ctx.totalProcessos}
  - Em cotação: ${ctx.emCotacao}
  - Em logística: ${ctx.emLogistica}
  - Em monitoramento: ${ctx.emMonitoramento}
  - Em faturamento: ${ctx.emFaturamento}
• Pacientes: ${ctx.totalPacientes} | Mandatos pendentes: ${ctx.mandatosPendentes}
• D30 esta semana: ${ctx.d30Semana}
• Remessas em trânsito: ${ctx.emTransito} | Entregues mês: ${ctx.entreguesMes}
• Faturamento mês: R$ ${ctx.faturamento} | Glosas abertas: ${ctx.glosas}
• Distribuidoras ativas: ${ctx.distribuidoras}

CAPACIDADES:
1. Gerar relatórios e cards resumidos de qualquer módulo
2. Identificar alertas críticos e pendências urgentes
3. Recomendar ações prioritárias com base nos dados
4. Criar rascunhos de mensagens WA para D30 e remessas
5. Responder perguntas sobre processos, pacientes, NFs

ESTILO DE RESPOSTA:
• Direto e objetivo — máximo 3 parágrafos para análises
• Use dados reais do contexto sempre que disponíveis
• Para relatórios: retorne JSON no formato { type: 'card', data: {...} }
• Idioma: português brasileiro
• Nunca invente dados — use apenas o contexto fornecido`;
}

export function buildSystemPromptPaciente(ctx: PacienteCtx): string {
  return `Você é a Di, assistente de saúde do HubWorkz Saúde.
Está conversando com o(a) paciente ${ctx.nome}.

DADOS DO TRATAMENTO DESTE PACIENTE:
• Medicamento: ${ctx.med.nome} — ${ctx.med.apresentacao}
• Modo de uso: ${ctx.med.modo_uso}
• Conservação: ${ctx.med.conservacao}
• Início do tratamento: ${ctx.dataInicio}
• Próximo D30: ${ctx.d30Data}

REGRAS OBRIGATÓRIAS:
1. Use linguagem simples, acolhedora e nunca use jargões técnicos
2. Responda APENAS sobre o medicamento e tratamento deste paciente
3. NUNCA mencione outros pacientes, valores financeiros ou dados internos
4. Em caso de sintomas graves, oriente SEMPRE a buscar atendimento presencial
5. Seja encorajador — o paciente está passando por um tratamento oncológico
6. Máximo 3 frases por resposta (linguagem de chat, não de relatório)`;
}

// ─── Tool executor ────────────────────────────────────────────────────────────

type ToolInput = Record<string, unknown>;

export async function executeTool(
  name: string,
  input: ToolInput,
  clinica_id: string
): Promise<{ text: string; card?: ToolCard }> {
  try {
    switch (name) {
      case "get_processos": {
        let query = supabase
          .from("processos")
          .select("id, status, numero_protocolo, created_at, pacientes(nome)")
          .order("created_at", { ascending: false })
          .limit(Number(input.limit ?? 10));
        if (input.status) query = query.eq("status", input.status as string);
        const { data } = await query;
        const card: ToolCard = {
          type: "card",
          title: `Processos${input.status ? ` — ${input.status}` : ""}`,
          data: { processos: data ?? [], total: (data ?? []).length },
        };
        return {
          text: JSON.stringify(card),
          card,
        };
      }

      case "get_alertas": {
        const agora = new Date();
        const em7Dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const [glosas, mandatos, d30] = await Promise.all([
          supabase
            .from("glosas")
            .select("id, valor, prazo_recurso, pacientes(nome)")
            .lte("prazo_recurso", em7Dias)
            .in("status", ["aberta", "em_analise"]),
          supabase
            .from("pacientes")
            .select("id, nome")
            .eq("mandato_status", "pendente"),
          supabase
            .from("monitoramentos")
            .select("id, data_contato, pacientes(nome)")
            .gte("data_contato", agora.toISOString())
            .lte("data_contato", em7Dias)
            .eq("status", "agendado"),
        ]);
        const card: ToolCard = {
          type: "card",
          title: "Alertas Críticos",
          data: {
            glosas_vencendo: glosas.data ?? [],
            mandatos_pendentes: mandatos.data ?? [],
            d30_esta_semana: d30.data ?? [],
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_d30_agenda": {
        const dias = Number(input.dias ?? 30);
        const agora = new Date();
        const fim = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("monitoramentos")
          .select("id, data_contato, status, canal, pacientes(nome, telefone)")
          .gte("data_contato", agora.toISOString())
          .lte("data_contato", fim)
          .order("data_contato");
        const card: ToolCard = {
          type: "card",
          title: `Agenda D30 — próximos ${dias} dias`,
          data: { agenda: data ?? [], total: (data ?? []).length },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_financeiro": {
        const mes = (input.mes as string) ?? new Date().toISOString().slice(0, 7);
        const [nfs, glosas] = await Promise.all([
          supabase
            .from("notas_fiscais")
            .select("valor_total, status")
            .gte("data_emissao", `${mes}-01`),
          supabase
            .from("glosas")
            .select("valor, status")
            .gte("created_at", `${mes}-01`),
        ]);
        const nfsData = nfs.data ?? [];
        const emitido = nfsData.reduce((s, n) => s + Number((n as Record<string, unknown>).valor_total ?? 0), 0);
        const pago = nfsData
          .filter((n) => (n as Record<string, unknown>).status === "paga")
          .reduce((s, n) => s + Number((n as Record<string, unknown>).valor_total ?? 0), 0);
        const totalGlosas = (glosas.data ?? []).reduce(
          (s, g) => s + Number((g as Record<string, unknown>).valor ?? 0),
          0
        );
        const card: ToolCard = {
          type: "card",
          title: `Financeiro — ${mes}`,
          data: {
            emitido: emitido.toFixed(2),
            pago: pago.toFixed(2),
            aguardando: (emitido - pago).toFixed(2),
            glosas: totalGlosas.toFixed(2),
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_remessas": {
        const { data } = await supabase
          .from("notas_fiscais")
          .select("id, numero, status, codigo_rastreio, previsao_entrega, pacientes(nome)")
          .order("created_at", { ascending: false })
          .limit(20);
        const remessas = data ?? [];
        const card: ToolCard = {
          type: "card",
          title: "Status das Remessas",
          data: {
            em_transito: remessas.filter((r) => (r as Record<string, unknown>).status === "transito"),
            entregues: remessas.filter((r) => (r as Record<string, unknown>).status === "entregue"),
            total: remessas.length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "gerar_wa_d30": {
        const { data: p } = await supabase
          .from("pacientes")
          .select("nome, medicamentos(nome)")
          .eq("id", input.paciente_id as string)
          .single();
        if (!p) return { text: "Paciente não encontrado." };
        const nome = (p as Record<string, unknown>).nome as string;
        const med = ((p as Record<string, unknown>).medicamentos as Record<string, string> | null)?.nome ?? "seu medicamento";
        const obs = input.observacoes ? `\n\n${input.observacoes}` : "";
        const mensagem = `Olá, ${nome}! 👋 Aqui é a equipe da clínica HubWorkz Saúde.\n\nEstamos entrando em contato para o acompanhamento do seu tratamento com ${med}. Como você está se sentindo?${obs}\n\nCaso tenha alguma dúvida ou desconforto, não hesite em nos avisar. Estamos aqui para te apoiar! 💙`;
        return { text: mensagem };
      }

      case "gerar_wa_remessa": {
        const { data: p } = await supabase
          .from("pacientes")
          .select("nome, medicamentos(nome)")
          .eq("id", input.paciente_id as string)
          .single();
        if (!p) return { text: "Paciente não encontrado." };
        const nome = (p as Record<string, unknown>).nome as string;
        const med = ((p as Record<string, unknown>).medicamentos as Record<string, string> | null)?.nome ?? "seu medicamento";
        const msgs: Record<string, string> = {
          despachado: `Olá, ${nome}! 📦 Seu ${med} foi despachado e está a caminho. Assim que chegar, fotografe a embalagem e nos envie. Qualquer dúvida, estamos aqui!`,
          transito: `Olá, ${nome}! 🚚 Seu ${med} está em trânsito e chegará em breve. Fique atento às atualizações do rastreio. Qualquer dúvida, é só chamar!`,
          entregue: `Olá, ${nome}! ✅ Confirmamos que seu ${med} foi entregue. Lembre-se de armazená-lo corretamente. Qualquer dúvida sobre como usar ou conservar, estamos à disposição!`,
        };
        return { text: msgs[input.evento as string] ?? "Evento não reconhecido." };
      }

      default:
        return { text: `Ferramenta "${name}" não reconhecida.` };
    }
  } catch (err) {
    logger.error({ err, name, input }, "Di tool execution error");
    return { text: `Erro ao executar ${name}. Tente novamente.` };
  }
}
