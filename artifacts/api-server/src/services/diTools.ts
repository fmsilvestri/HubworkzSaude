import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const DI_TOOLS: Tool[] = [
  {
    name: "get_processos",
    description: "Busca processos ativos com filtro opcional por status. Use para relatórios de pipeline, fases, andamento.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["cotacao", "logistica", "monitoramento", "faturamento", "solicitado", "em_andamento", "concluido"],
          description: "Filtrar por status do processo",
        },
        limit: { type: "number", description: "Máximo de registros (padrão 10)" },
      },
    },
  },
  {
    name: "get_cotacoes",
    description: "Busca cotações com filtro opcional por status. Use para relatórios de cotação, aprovações pendentes, valores.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pendente", "enviada", "aprovada", "recusada"],
          description: "Filtrar por status da cotação",
        },
        limit: { type: "number", description: "Máximo de registros (padrão 10)" },
      },
    },
  },
  {
    name: "get_pacientes",
    description: "Lista pacientes cadastrados com status de mandato e convênio. Use para relatórios de pacientes, mandatos, acompanhamento.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Busca por nome do paciente" },
        limit: { type: "number", description: "Máximo de registros (padrão 15)" },
      },
    },
  },
  {
    name: "get_medicamentos",
    description: "Lista medicamentos do catálogo com detalhes completos: princípio ativo, apresentação, modo de uso, conservação, estoque, validade, valor e classe. Use para relatórios de catálogo, análise de estoque, verificação de medicamentos disponíveis.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Busca por nome ou princípio ativo" },
        limit: { type: "number", description: "Máximo de registros (padrão 15)" },
      },
    },
  },
  {
    name: "get_medicamento_detalhe",
    description: "Busca detalhes completos de um medicamento específico pelo nome ou ID: modo de uso, conservação, lote, validade, estoque atual, valor, registro, orientações de uso. Use quando o usuário perguntar sobre um medicamento específico.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome (parcial ou completo) do medicamento" },
        id: { type: "string", description: "UUID do medicamento (opcional, se conhecido)" },
      },
    },
  },
  {
    name: "get_estoque_baixo",
    description: "Lista medicamentos com estoque abaixo de um limite crítico. Use para alertas de reposição, análise de estoque crítico ou quando o usuário perguntar sobre medicamentos em falta.",
    input_schema: {
      type: "object",
      properties: {
        limite: { type: "number", description: "Quantidade mínima em estoque para considerar crítico (padrão 5 unidades)" },
      },
    },
  },
  {
    name: "get_mandatos",
    description: "Lista mandatos judiciais com status e vencimentos. Use para relatórios de mandatos, cumprimento judicial.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pendente", "ativo", "encerrado"],
          description: "Filtrar por status do mandato",
        },
        limit: { type: "number", description: "Máximo de registros (padrão 10)" },
      },
    },
  },
  {
    name: "get_distribuidoras",
    description: "Lista distribuidoras parceiras ativas. Use para relatórios de fornecedores, distribuidoras.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_glosas",
    description: "Lista glosas detalhadas com valores, prazos e status de recurso. Use para relatórios financeiros de glosas.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["aberta", "em_analise", "resolvida", "perdida"],
          description: "Filtrar por status da glosa",
        },
        limit: { type: "number", description: "Máximo de registros (padrão 10)" },
      },
    },
  },
  {
    name: "get_alertas",
    description: "Retorna alertas críticos: glosas vencendo em 7 dias, mandatos pendentes, D30 próximos. Use para visão de urgências.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_d30_agenda",
    description: "Retorna agenda D30 dos próximos N dias com status de cada paciente. Use para planejar monitoramentos.",
    input_schema: {
      type: "object",
      properties: {
        dias: { type: "number", description: "Janela em dias (padrão 30)" },
      },
    },
  },
  {
    name: "get_monitoramentos",
    description: "Lista registros de monitoramento D30 com paciente, canal, status e data de contato. Use para acompanhamento detalhado de pacientes.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["agendado", "realizado", "nao_realizado", "remarcado"],
          description: "Filtrar por status do monitoramento",
        },
        paciente_id: { type: "string", description: "UUID do paciente para filtrar" },
        limit: { type: "number", description: "Máximo de registros (padrão 15)" },
      },
    },
  },
  {
    name: "get_financeiro",
    description: "Resumo financeiro: emitido, pago, aguardando pagamento e glosas. Use para relatórios de faturamento.",
    input_schema: {
      type: "object",
      properties: {
        mes: { type: "string", description: "Mês no formato YYYY-MM (padrão: mês atual)" },
      },
    },
  },
  {
    name: "get_remessas",
    description: "Status de todas as remessas: em trânsito, entregues. Use para relatórios de logística.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_comunicados",
    description: "Lista histórico de comunicados e atendimentos com pacientes por canal (WhatsApp, telefone, email). Use para relatórios de comunicação e histórico de contatos.",
    input_schema: {
      type: "object",
      properties: {
        paciente_id: { type: "string", description: "UUID do paciente para filtrar comunicados" },
        tipo: {
          type: "string",
          description: "Tipo de comunicado (ex: d30, remessa, mandato)",
        },
        limit: { type: "number", description: "Máximo de registros (padrão 15)" },
      },
    },
  },
  {
    name: "get_dashboard_resumo",
    description: "Resumo completo de todos os módulos em um único card. Use quando o usuário pedir visão geral, resumo do dia, ou panorama do sistema.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "gerar_relatorio_completo",
    description: "Gera um relatório completo com múltiplos cards coloridos cobrindo todos os módulos solicitados. Use quando o usuário pedir um relatório completo, análise geral ou quiser ver todos os dados integrados.",
    input_schema: {
      type: "object",
      properties: {
        modulos: {
          type: "array",
          items: { type: "string" },
          description: "Lista de módulos a incluir. Opções: processos, cotacoes, pacientes, medicamentos, distribuidoras, monitoramentos, financeiro, glosas, remessas, comunicados. Se não informado, inclui todos.",
        },
      },
    },
  },
  {
    name: "gerar_wa_d30",
    description: "Gera mensagem WhatsApp personalizada para monitoramento D30",
    input_schema: {
      type: "object",
      properties: {
        paciente_id: { type: "string", description: "UUID do paciente" },
        observacoes: { type: "string", description: "Observações específicas para personalizar a mensagem" },
      },
      required: ["paciente_id"],
    },
  },
  {
    name: "gerar_wa_remessa",
    description: "Gera mensagem WA para notificação de entrega (despachado/trânsito/entregue)",
    input_schema: {
      type: "object",
      properties: {
        paciente_id: { type: "string", description: "UUID do paciente" },
        evento: {
          type: "string",
          enum: ["despachado", "transito", "entregue"],
          description: "Evento da remessa",
        },
      },
      required: ["paciente_id", "evento"],
    },
  },
];
