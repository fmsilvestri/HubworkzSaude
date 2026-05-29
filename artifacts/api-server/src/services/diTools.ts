import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const DI_TOOLS: Tool[] = [
  {
    name: "get_processos",
    description: "Busca processos ativos com filtro opcional por status",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["cotacao", "logistica", "monitoramento", "faturamento"],
          description: "Filtrar por fase do processo",
        },
        limit: { type: "number", description: "Máximo de registros (padrão 10)" },
      },
    },
  },
  {
    name: "get_alertas",
    description:
      "Retorna alertas críticos: glosas vencendo, mandatos pendentes, D30 próximos",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_d30_agenda",
    description:
      "Retorna agenda D30 dos próximos N dias com status de cada paciente",
    input_schema: {
      type: "object",
      properties: {
        dias: {
          type: "number",
          description: "Janela em dias (padrão 30)",
        },
      },
    },
  },
  {
    name: "get_financeiro",
    description:
      "Resumo financeiro: emitido, pago, aguardando pagamento e glosas",
    input_schema: {
      type: "object",
      properties: {
        mes: {
          type: "string",
          description: "Mês no formato YYYY-MM (padrão: mês atual)",
        },
      },
    },
  },
  {
    name: "get_remessas",
    description: "Status de todas as remessas: em trânsito, entregues, WA enviados",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "gerar_wa_d30",
    description: "Gera mensagem WhatsApp personalizada para monitoramento D30",
    input_schema: {
      type: "object",
      properties: {
        paciente_id: { type: "string", description: "UUID do paciente" },
        observacoes: {
          type: "string",
          description: "Observações específicas para personalizar a mensagem",
        },
      },
      required: ["paciente_id"],
    },
  },
  {
    name: "gerar_wa_remessa",
    description:
      "Gera mensagem WA para notificação de entrega (despachado/trânsito/entregue)",
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
