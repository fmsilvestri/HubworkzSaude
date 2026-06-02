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
  // ── WRITE TOOLS ──────────────────────────────────────────────────────────────
  {
    name: "criar_paciente",
    description: "Cria um novo paciente no sistema. Use quando o usuário pedir para cadastrar, registrar ou adicionar um paciente.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome completo do paciente (obrigatório)" },
        cpf: { type: "string", description: "CPF do paciente" },
        telefone: { type: "string", description: "Telefone de contato" },
        email: { type: "string", description: "E-mail" },
        convenio: { type: "string", description: "Convênio de saúde" },
        diagnostico: { type: "string", description: "Diagnóstico oncológico" },
        cid: { type: "string", description: "Código CID do diagnóstico" },
        data_nascimento: { type: "string", description: "Data de nascimento (YYYY-MM-DD)" },
      },
      required: ["nome"],
    },
  },
  {
    name: "criar_cotacao",
    description: "Cria uma nova cotação no sistema com status pendente. Use quando o usuário pedir para abrir, criar ou registrar uma cotação de medicamento.",
    input_schema: {
      type: "object",
      properties: {
        nome_paciente: { type: "string", description: "Nome do paciente" },
        paciente_id: { type: "string", description: "UUID do paciente (se conhecido)" },
        medicamento_nome: { type: "string", description: "Nome do medicamento (obrigatório)" },
        convenio: { type: "string", description: "Convênio responsável" },
        quantidade: { type: "number", description: "Quantidade solicitada" },
        observacoes: { type: "string", description: "Observações adicionais" },
      },
      required: ["medicamento_nome"],
    },
  },
  {
    name: "atualizar_processo",
    description: "Atualiza o status ou fase de um processo existente. Use quando o usuário pedir para avançar, atualizar ou mudar o status de um processo.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID do processo (obrigatório)" },
        status: {
          type: "string",
          enum: ["solicitado", "em_andamento", "cotacao", "logistica", "monitoramento", "faturamento", "concluido", "cancelado"],
          description: "Novo status do processo",
        },
        fase: { type: "number", enum: [1, 2, 3, 4], description: "Nova fase (1=Cotação, 2=Logística, 3=Monitoramento, 4=Faturamento)" },
        numero_protocolo: { type: "string", description: "Número de protocolo" },
      },
      required: ["id"],
    },
  },
  {
    name: "atualizar_cotacao",
    description: "Atualiza dados de uma cotação existente (status, valores, convênio). Use quando o usuário pedir para aprovar, recusar ou editar uma cotação.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID da cotação (obrigatório)" },
        status: {
          type: "string",
          enum: ["pendente", "enviada", "aprovada", "recusada"],
          description: "Novo status da cotação",
        },
        valor_aprovado: { type: "number", description: "Valor aprovado em R$" },
        valor_noova: { type: "number", description: "Valor Noova em R$" },
        convenio: { type: "string", description: "Convênio responsável" },
        observacoes: { type: "string", description: "Observações adicionais" },
      },
      required: ["id"],
    },
  },
  {
    name: "registrar_comunicado",
    description: "Registra um comunicado ou observação no histórico de atendimento de um paciente. Use para anotar contatos, observações clínicas ou registros de comunicação.",
    input_schema: {
      type: "object",
      properties: {
        paciente_id: { type: "string", description: "UUID do paciente (obrigatório)" },
        mensagem: { type: "string", description: "Texto do comunicado ou observação (obrigatório)" },
        canal: {
          type: "string",
          enum: ["telefone", "email", "whatsapp", "presencial", "interno"],
          description: "Canal de comunicação (padrão: interno)",
        },
        tipo: {
          type: "string",
          enum: ["d30", "remessa", "mandato", "observacao", "retorno", "agendamento"],
          description: "Tipo de comunicado (padrão: observacao)",
        },
      },
      required: ["paciente_id", "mensagem"],
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
