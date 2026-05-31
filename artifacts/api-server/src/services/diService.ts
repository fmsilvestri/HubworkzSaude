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
  cotacoesPendentes: number;
  totalMedicamentos: number;
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
  color?: string;
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
    cotacoes,
    medicamentos,
  ] = await Promise.all([
    supabase.from("processos").select("status", { count: "exact" }),
    supabase.from("pacientes").select("mandato_status", { count: "exact" }),
    supabase.from("monitoramentos").select("data_contato").gte("data_contato", now.toISOString()).lte("data_contato", semanaFim),
    supabase.from("notas_fiscais").select("id", { count: "exact" }).eq("nf_status", "transito"),
    supabase.from("notas_fiscais").select("id", { count: "exact" }).eq("nf_status", "entregue").gte("data_emissao", `${mesAtual}-01`),
    supabase.from("notas_fiscais").select("valor").gte("data_emissao", `${mesAtual}-01`).eq("nf_status", "emitida"),
    supabase.from("glosas").select("id", { count: "exact" }).in("status", ["aberta", "em_analise"]),
    supabase.from("distribuidoras").select("id", { count: "exact" }).eq("ativo", true),
    supabase.from("cotacoes").select("id", { count: "exact" }).eq("status", "pendente"),
    supabase.from("medicamentos").select("id", { count: "exact" }),
  ]);

  const processosData = processos.data ?? [];
  const faturamentoTotal = (faturas.data ?? []).reduce((sum, nf) => {
    const row = nf as Record<string, unknown>;
    return sum + Number(row.valor ?? 0);
  }, 0);

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
    faturamento: faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    glosas: glosas.count ?? 0,
    distribuidoras: distribuidoras.count ?? 0,
    cotacoesPendentes: cotacoes.count ?? 0,
    totalMedicamentos: medicamentos.count ?? 0,
  };
}

export async function buildPacienteCtx(user_id: string): Promise<PacienteCtx | null> {
  const { data: paciente } = await supabase
    .from("pacientes")
    .select(`nome, medicamento:medicamentos(nome, concentracao, apresentacao, via_administracao, modo_uso, conservacao)`)
    .eq("user_id", user_id)
    .single();

  if (!paciente) return null;

  const row = paciente as Record<string, unknown>;
  const pacienteId = row.id as string | undefined;

  const { data: processosArr } = pacienteId
    ? await supabase.from("processos").select("created_at").eq("paciente_id", pacienteId).order("created_at", { ascending: false }).limit(1)
    : { data: null };

  const { data: monitoramentosArr } = pacienteId
    ? await supabase.from("monitoramentos").select("data_contato, status").eq("paciente_id", pacienteId).order("data_contato", { ascending: true })
    : { data: null };

  const med = row.medicamento as Record<string, string> | null;
  const processo = (processosArr ?? [])[0] as Record<string, string> | undefined;
  const agora = new Date();

  const proximoD30 = ((monitoramentosArr ?? []) as Array<Record<string, string>>)
    .filter((m) => (m.status === "agendado" || !m.status) && m.data_contato)
    .map((m) => new Date(m.data_contato))
    .filter((d) => d > agora)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const d30Data = proximoD30
    ? proximoD30.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "a agendar";

  const dataInicio = processo?.created_at
    ? new Date(processo.created_at).toLocaleDateString("pt-BR")
    : "a informar";

  return {
    nome: row.nome as string,
    med: {
      nome: med?.nome ?? "não informado",
      apresentacao: (med?.concentracao ?? med?.apresentacao) ?? "não informada",
      modo_uso: (med?.via_administracao ?? med?.modo_uso) ?? "consulte o médico",
      conservacao: med?.conservacao ?? "consulte a farmácia",
    },
    dataInicio,
    d30Data,
  };
}

// ─── System prompts ───────────────────────────────────────────────────────────

export function buildSystemPrompt(ctx: GestorCtx, role: string): string {
  return `Você é a Di, inteligência artificial especialista do HubWorkz Saúde — sistema SaaS de intermediação farmacêutica oncológica.
Perfil ativo: ${role}

DADOS DO SISTEMA (tempo real):
• Processos: ${ctx.totalProcessos} ativos | Cotação: ${ctx.emCotacao} | Logística: ${ctx.emLogistica} | Monitoramento: ${ctx.emMonitoramento} | Faturamento: ${ctx.emFaturamento}
• Cotações pendentes: ${ctx.cotacoesPendentes}
• Pacientes: ${ctx.totalPacientes} | Mandatos pendentes: ${ctx.mandatosPendentes}
• Medicamentos cadastrados: ${ctx.totalMedicamentos}
• D30 esta semana: ${ctx.d30Semana}
• Remessas em trânsito: ${ctx.emTransito} | Entregues no mês: ${ctx.entreguesMes}
• Faturamento do mês: R$ ${ctx.faturamento} | Glosas abertas: ${ctx.glosas}
• Distribuidoras ativas: ${ctx.distribuidoras}

MÓDULOS QUE VOCÊ CONHECE:
1. Processos — pipeline de importação (4 fases)
2. Cotações — solicitações e aprovações de cotação
3. Pacientes — cadastro, mandatos e D30
4. Medicamentos — catálogo de medicamentos importados
5. Mandatos — ordens judiciais de fornecimento
6. Distribuidoras — parceiros logísticos
7. Glosas — contestações de pagamento
8. Rastreio/Remessas — logística e entregas
9. Faturamento — notas fiscais e recebimentos
10. Monitoramento D30 — acompanhamento terapêutico
11. Comunicação — mensagens e histórico de contatos
12. Dashboard — visão geral do sistema

FERRAMENTAS DISPONÍVEIS:
- get_processos(status?, limit?) — processos por fase
- get_cotacoes(status?, limit?) — cotações e aprovações
- get_pacientes(search?, limit?) — pacientes cadastrados
- get_medicamentos(search?, limit?) — catálogo de medicamentos
- get_mandatos(status?, limit?) — mandatos judiciais
- get_distribuidoras() — distribuidoras parceiras
- get_glosas(status?, limit?) — glosas detalhadas
- get_alertas() — urgências críticas (glosas, D30, mandatos)
- get_d30_agenda(dias?) — agenda de monitoramentos
- get_financeiro(mes?) — resumo financeiro
- get_remessas() — status de entregas
- get_dashboard_resumo() — panorama completo de todos os módulos
- gerar_wa_d30(paciente_id, observacoes?) — mensagem WA para D30
- gerar_wa_remessa(paciente_id, evento) — mensagem WA de entrega

REGRAS DE RESPOSTA:
1. Para relatórios, listas e resumos: USE SEMPRE as ferramentas para buscar dados reais. Nunca invente dados.
2. Retorne os dados das ferramentas no formato JSON: { "type": "card", "title": "...", "color": "orange|mint|blue|purple|red|green", "data": {...} }
3. Você pode retornar MÚLTIPLOS cards seguidos, um por linha, cada um como JSON separado.
4. Para perguntas simples e conversas: responda em texto normal, direto e objetivo.
5. Para mensagens WA geradas: retorne o texto formatado sem JSON.
6. Idioma: sempre português brasileiro.
7. Seja conciso — máximo 3 parágrafos de texto entre cards.`;
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
          .select("id, status, fase, created_at, pacientes(nome)")
          .order("created_at", { ascending: false })
          .limit(Number(input.limit ?? 10));
        if (input.status) query = query.eq("status", input.status as string);
        const { data } = await query;
        const normalized = (data ?? []).map((p) => {
          const row = p as Record<string, unknown>;
          return { ...row, fase_atual: row.fase_atual ?? row.fase ?? 1 };
        });
        const card: ToolCard = {
          type: "card",
          title: `Processos${input.status ? ` — ${String(input.status)}` : ""}`,
          color: "orange",
          data: { processos: normalized, total: normalized.length },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_cotacoes": {
        let query = supabase
          .from("cotacoes")
          .select("id, status, nome_paciente, medicamento_nome, convenio, valor_aprovado, created_at")
          .order("created_at", { ascending: false })
          .limit(Number(input.limit ?? 10));
        if (input.status) query = query.eq("status", input.status as string);
        const { data } = await query;
        const rows = data ?? [];
        const card: ToolCard = {
          type: "card",
          title: `Cotações${input.status ? ` — ${String(input.status)}` : ""}`,
          color: "blue",
          data: {
            cotacoes: rows,
            total: rows.length,
            pendentes: rows.filter((r) => (r as Record<string, unknown>)["status"] === "pendente").length,
            aprovadas: rows.filter((r) => (r as Record<string, unknown>)["status"] === "aprovada").length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_pacientes": {
        let query = supabase
          .from("pacientes")
          .select("id, nome, convenio, mandato_status, diagnostico, created_at")
          .order("created_at", { ascending: false })
          .limit(Number(input.limit ?? 10));
        if (input.search) query = query.ilike("nome", `%${String(input.search)}%`);
        const { data } = await query;
        const rows = data ?? [];
        const card: ToolCard = {
          type: "card",
          title: "Pacientes",
          color: "mint",
          data: {
            pacientes: rows,
            total: rows.length,
            mandatos_pendentes: rows.filter((r) => (r as Record<string, unknown>)["mandato_status"] === "pendente").length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_medicamentos": {
        let query = supabase
          .from("medicamentos")
          .select("id, nome, principio_ativo, concentracao, apresentacao, via_administracao")
          .order("nome")
          .limit(Number(input.limit ?? 10));
        if (input.search) query = query.ilike("nome", `%${String(input.search)}%`);
        const { data } = await query;
        const rows = data ?? [];
        const card: ToolCard = {
          type: "card",
          title: "Medicamentos",
          color: "purple",
          data: { medicamentos: rows, total: rows.length },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_mandatos": {
        let query = supabase
          .from("pacientes")
          .select("id, nome, mandato_status, convenio, created_at")
          .not("mandato_status", "is", null)
          .order("created_at", { ascending: false })
          .limit(Number(input.limit ?? 10));
        if (input.status) query = query.eq("mandato_status", input.status as string);
        const { data } = await query;
        const rows = data ?? [];
        const card: ToolCard = {
          type: "card",
          title: "Mandatos Judiciais",
          color: "red",
          data: {
            mandatos: rows,
            total: rows.length,
            pendentes: rows.filter((r) => (r as Record<string, unknown>)["mandato_status"] === "pendente").length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_distribuidoras": {
        const { data } = await supabase
          .from("distribuidoras")
          .select("id, nome, pais_origem, contato_email, ativo")
          .order("nome");
        const rows = data ?? [];
        const card: ToolCard = {
          type: "card",
          title: "Distribuidoras Parceiras",
          color: "green",
          data: {
            distribuidoras: rows,
            total: rows.length,
            ativas: rows.filter((r) => (r as Record<string, unknown>)["ativo"] === true).length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_glosas": {
        let query = supabase
          .from("glosas")
          .select("id, valor, status, prazo_recurso, pacientes(nome)")
          .order("created_at", { ascending: false })
          .limit(Number(input.limit ?? 10));
        if (input.status) query = query.eq("status", input.status as string);
        const { data } = await query;
        const rows = (data ?? []) as Array<Record<string, unknown>>;
        const totalValor = rows.reduce((s, g) => s + Number(g["valor"] ?? 0), 0);
        const card: ToolCard = {
          type: "card",
          title: "Glosas",
          color: "red",
          data: {
            glosas: rows,
            total: rows.length,
            valor_total: `R$ ${totalValor.toFixed(2)}`,
            abertas: rows.filter((g) => g["status"] === "aberta").length,
            em_analise: rows.filter((g) => g["status"] === "em_analise").length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_alertas": {
        const agora = new Date();
        const em7Dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const [glosas, mandatos, d30] = await Promise.all([
          supabase.from("glosas").select("id, valor, prazo_recurso, pacientes(nome)").lte("prazo_recurso", em7Dias).in("status", ["aberta", "em_analise"]),
          supabase.from("pacientes").select("id, nome").eq("mandato_status", "pendente"),
          supabase.from("monitoramentos").select("id, data_contato, pacientes(nome)").gte("data_contato", agora.toISOString()).lte("data_contato", em7Dias),
        ]);
        const card: ToolCard = {
          type: "card",
          title: "Alertas Criticos",
          color: "red",
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
          title: `Agenda D30 — proximos ${dias} dias`,
          color: "mint",
          data: { agenda: data ?? [], total: (data ?? []).length },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_financeiro": {
        const mes = (input.mes as string) ?? new Date().toISOString().slice(0, 7);
        const [nfs, glosas] = await Promise.all([
          supabase.from("notas_fiscais").select("valor, nf_status").gte("data_emissao", `${mes}-01`),
          supabase.from("glosas").select("valor, status").gte("created_at", `${mes}-01`),
        ]);
        const nfsData = (nfs.data ?? []) as Array<Record<string, unknown>>;
        const emitido = nfsData.reduce((s, n) => s + Number(n["valor"] ?? 0), 0);
        const pago = nfsData.filter((n) => n["nf_status"] === "paga").reduce((s, n) => s + Number(n["valor"] ?? 0), 0);
        const totalGlosas = ((glosas.data ?? []) as Array<Record<string, unknown>>).reduce((s, g) => s + Number(g["valor"] ?? 0), 0);
        const card: ToolCard = {
          type: "card",
          title: `Financeiro — ${mes}`,
          color: "green",
          data: {
            emitido: `R$ ${emitido.toFixed(2)}`,
            pago: `R$ ${pago.toFixed(2)}`,
            aguardando: `R$ ${(emitido - pago).toFixed(2)}`,
            glosas: `R$ ${totalGlosas.toFixed(2)}`,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_remessas": {
        const { data } = await supabase
          .from("notas_fiscais")
          .select("id, numero_nf, nf_status, codigo_rastreio, previsao_entrega, pacientes(nome)")
          .order("created_at", { ascending: false })
          .limit(20);
        const remessas = (data ?? []).map((r) => {
          const row = r as Record<string, unknown>;
          return { ...row, numero: row["numero"] ?? row["numero_nf"], status: row["nf_status"] };
        });
        const card: ToolCard = {
          type: "card",
          title: "Status das Remessas",
          color: "blue",
          data: {
            em_transito: remessas.filter((r) => r["status"] === "transito"),
            entregues: remessas.filter((r) => r["status"] === "entregue"),
            total: remessas.length,
          },
        };
        return { text: JSON.stringify(card), card };
      }

      case "get_dashboard_resumo": {
        const agora = new Date();
        const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
        const semanaFim = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const [proc, pac, cot, fat, glo, mon, rem] = await Promise.all([
          supabase.from("processos").select("status", { count: "exact" }),
          supabase.from("pacientes").select("mandato_status", { count: "exact" }),
          supabase.from("cotacoes").select("status", { count: "exact" }),
          supabase.from("notas_fiscais").select("valor, nf_status").gte("data_emissao", `${mesAtual}-01`),
          supabase.from("glosas").select("id", { count: "exact" }).in("status", ["aberta", "em_analise"]),
          supabase.from("monitoramentos").select("id").gte("data_contato", agora.toISOString()).lte("data_contato", semanaFim),
          supabase.from("notas_fiscais").select("id", { count: "exact" }).eq("nf_status", "transito"),
        ]);
        const fatData = (fat.data ?? []) as Array<Record<string, unknown>>;
        const faturamentoMes = fatData.reduce((s, n) => s + Number(n["valor"] ?? 0), 0);
        const mandatosPend = (pac.data ?? []).filter((p) => (p as { mandato_status?: string }).mandato_status === "pendente").length;
        const cotData = cot.data ?? [];
        const card: ToolCard = {
          type: "card",
          title: "Panorama do Sistema",
          color: "purple",
          data: {
            processos: {
              total: proc.count ?? 0,
              por_status: {
                cotacao: (proc.data ?? []).filter((p) => p.status === "cotacao").length,
                logistica: (proc.data ?? []).filter((p) => p.status === "logistica").length,
                monitoramento: (proc.data ?? []).filter((p) => p.status === "monitoramento").length,
                faturamento: (proc.data ?? []).filter((p) => p.status === "faturamento").length,
              },
            },
            pacientes: {
              total: pac.count ?? 0,
              mandatos_pendentes: mandatosPend,
            },
            cotacoes: {
              total: cot.count ?? 0,
              pendentes: (cotData as Array<Record<string, unknown>>).filter((c) => c["status"] === "pendente").length,
              aprovadas: (cotData as Array<Record<string, unknown>>).filter((c) => c["status"] === "aprovada").length,
            },
            financeiro: {
              faturamento_mes: `R$ ${faturamentoMes.toFixed(2)}`,
              glosas_abertas: glo.count ?? 0,
            },
            logistica: {
              remessas_transito: rem.count ?? 0,
              d30_semana: mon.data?.length ?? 0,
            },
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
        const nome = (p as Record<string, unknown>)["nome"] as string;
        const med = ((p as Record<string, unknown>)["medicamentos"] as Record<string, string> | null)?.["nome"] ?? "seu medicamento";
        const obs = input.observacoes ? `\n\n${String(input.observacoes)}` : "";
        return { text: `Olá, ${nome}! Aqui é a equipe da clínica HubWorkz Saúde.\n\nEstamos entrando em contato para o acompanhamento do seu tratamento com ${med}. Como você está se sentindo?${obs}\n\nCaso tenha alguma dúvida ou desconforto, não hesite em nos avisar. Estamos aqui para te apoiar!` };
      }

      case "gerar_wa_remessa": {
        const { data: p } = await supabase
          .from("pacientes")
          .select("nome, medicamentos(nome)")
          .eq("id", input.paciente_id as string)
          .single();
        if (!p) return { text: "Paciente não encontrado." };
        const nome = (p as Record<string, unknown>)["nome"] as string;
        const med = ((p as Record<string, unknown>)["medicamentos"] as Record<string, string> | null)?.["nome"] ?? "seu medicamento";
        const msgs: Record<string, string> = {
          despachado: `Olá, ${nome}! Seu ${med} foi despachado e está a caminho. Assim que chegar, fotografe a embalagem e nos envie. Qualquer dúvida, estamos aqui!`,
          transito: `Olá, ${nome}! Seu ${med} está em trânsito e chegará em breve. Fique atento às atualizações do rastreio. Qualquer dúvida, é só chamar!`,
          entregue: `Olá, ${nome}! Confirmamos que seu ${med} foi entregue. Lembre-se de armazená-lo corretamente. Qualquer dúvida sobre como usar ou conservar, estamos à disposição!`,
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
