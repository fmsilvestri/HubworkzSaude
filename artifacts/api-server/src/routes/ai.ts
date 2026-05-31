import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { DI_TOOLS } from "../services/diTools";
import {
  buildGestorCtx,
  buildPacienteCtx,
  buildSystemPrompt,
  buildSystemPromptPaciente,
  executeTool,
  type ToolCard,
} from "../services/diService";

// helper to flatten cards from a tool result
function collectCards(result: { card?: ToolCard; cards?: ToolCard[] }): ToolCard[] {
  if (result.cards && result.cards.length > 0) return result.cards;
  if (result.card) return [result.card];
  return [];
}

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env["AI_INTEGRATIONS_ANTHROPIC_API_KEY"] ?? process.env["ANTHROPIC_API_KEY"] ?? "",
  baseURL: process.env["AI_INTEGRATIONS_ANTHROPIC_BASE_URL"],
});

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

router.post("/ai/chat", async (req, res): Promise<void> => {
  try {
    const { message, context, clinica_id, user_id } = req.body as {
      message: string;
      context?: string;       // 'paciente' | 'gestor' | outros roles
      clinica_id?: string;
      user_id?: string;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const isPaciente = context === "paciente";

    // 1. Histórico: últimas 10 mensagens do usuário/clínica
    let history: MessageParam[] = [];
    if (clinica_id || user_id) {
      let q = supabase
        .from("di_messages")
        .select("role, content")
        .order("created_at", { ascending: false })
        .limit(10);
      if (user_id) q = q.eq("user_id", user_id);
      else if (clinica_id) q = q.eq("clinica_id", clinica_id);
      const { data: hist } = await q;
      history = ((hist ?? []) as Array<{ role: string; content: string }>)
        .reverse()
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    }

    // 2. System prompt + contexto real
    let systemPrompt: string;

    if (isPaciente && user_id) {
      const pacCtx = await buildPacienteCtx(user_id);
      if (pacCtx) {
        systemPrompt = buildSystemPromptPaciente(pacCtx);
      } else {
        systemPrompt = `Você é a Di, assistente de saúde do HubWorkz Saúde. Use linguagem simples e acolhedora. Nunca mencione dados de outros pacientes ou informações internas.`;
      }
    } else if (clinica_id) {
      const gestorCtx = await buildGestorCtx(clinica_id);
      systemPrompt = buildSystemPrompt(gestorCtx, context ?? "gestor");
    } else {
      // fallback sem contexto de clínica
      systemPrompt = `Você é a Di, assistente do HubWorkz Saúde. Responda em português brasileiro de forma objetiva.`;
    }

    // 3. Primeira chamada ao Claude
    const messages: MessageParam[] = [
      ...history,
      { role: "user", content: message },
    ];

    let claudeResp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      tools: isPaciente ? [] : DI_TOOLS,
    });

    // 4. Agentic loop — processar tool calls até stop_reason !== 'tool_use'
    const cards: ToolCard[] = [];
    let iteracoes = 0;
    const MAX_ITER = 8;

    while (claudeResp.stop_reason === "tool_use" && iteracoes < MAX_ITER) {
      iteracoes++;

      // Extrair todos os tool_use blocks
      const toolUseBlocks = claudeResp.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // Executar tools em paralelo
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            clinica_id ?? ""
          );
          collectCards(result).forEach((c) => cards.push(c));
          return { block, result };
        })
      );

      // Construir mensagens para a próxima rodada
      const toolResultMessages: ToolResultBlockParam[] = toolResults.map(({ block, result }) => ({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: result.text,
      }));

      messages.push(
        { role: "assistant", content: claudeResp.content },
        { role: "user", content: toolResultMessages }
      );

      // Próxima chamada
      claudeResp = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: systemPrompt,
        messages,
        tools: DI_TOOLS,
      });
    }

    // 5. Extrair texto final
    const responseText = claudeResp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // 6. Persistir mensagens
    const persistRows = [
      {
        role: "user" as const,
        content: message,
        clinica_id: clinica_id ?? null,
        user_id: user_id ?? null,
      },
      {
        role: "assistant" as const,
        content: responseText,
        clinica_id: clinica_id ?? null,
        user_id: user_id ?? null,
      },
    ];

    supabase
      .from("di_messages")
      .insert(persistRows)
      .then(({ error: err }) => {
        if (err) logger.warn({ err }, "Failed to persist Di IA messages");
      });

    res.json({
      response: responseText,
      cards: cards.length > 0 ? cards : undefined,
      tokens_used:
        (claudeResp.usage?.input_tokens ?? 0) + (claudeResp.usage?.output_tokens ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Di IA chat error");
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// ─── GET /api/ai/history ──────────────────────────────────────────────────────

router.get("/ai/history", async (req, res): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query["limit"]) || 50, 200);
    let query = supabase
      .from("di_messages")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (req.query["user_id"]) {
      query = query.eq("user_id", String(req.query["user_id"]));
    } else if (req.query["clinica_id"]) {
      query = query.eq("clinica_id", String(req.query["clinica_id"]));
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to get AI history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ─── DELETE /api/ai/history ───────────────────────────────────────────────────

router.delete("/ai/history", async (req, res): Promise<void> => {
  try {
    let query = supabase.from("di_messages").delete();

    if (req.query["user_id"]) {
      query = query.eq("user_id", String(req.query["user_id"]));
    } else if (req.query["clinica_id"]) {
      query = query.eq("clinica_id", String(req.query["clinica_id"]));
    } else {
      // safety: require at least one filter
      res.status(400).json({ error: "clinica_id or user_id required" });
      return;
    }

    const { error, count } = await query.select();
    if (error) throw error;
    res.json({ deleted: count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to clear AI history");
    res.status(500).json({ error: "Failed to clear history" });
  }
});

export default router;
