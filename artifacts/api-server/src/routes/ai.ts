import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"] ?? "",
});

const SYSTEM_PROMPT = `Você é Di IA, a assistente de inteligência artificial do HubWorkz Saúde — um sistema de gestão de intermediação farmacêutica oncológica. 

Você auxilia gestores, farmacêuticos e equipes clínicas com:
- Análise de processos de importação de medicamentos oncológicos
- Orientações sobre fases do processo (Solicitação, Aquisição, Farmácia Clínica, Faturamento)
- Apoio no monitoramento D30 de pacientes
- Análise de cotações e distribuidoras
- Suporte em questões regulatórias (ANVISA, uso compassivo)
- Interpretação de dados e métricas do sistema

Responda sempre em português brasileiro. Seja preciso, clínico e objetivo. Quando não souber algo com certeza, diga claramente.`;

router.post("/ai/chat", async (req, res): Promise<void> => {
  try {
    const { message, clinica_id, context } = req.body as {
      message: string;
      clinica_id?: string;
      context?: string;
    };

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const userContent = context
      ? `[Contexto atual: ${context}]\n\n${message}`
      : message;

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText =
      aiResponse.content[0]?.type === "text"
        ? aiResponse.content[0].text
        : "";

    if (clinica_id) {
      await Promise.all([
        supabase.from("di_messages").insert({
          clinica_id,
          role: "user",
          content: message,
        }),
        supabase.from("di_messages").insert({
          clinica_id,
          role: "assistant",
          content: responseText,
        }),
      ]).catch((err) => {
        logger.warn({ err }, "Failed to persist Di IA messages");
      });
    }

    res.json({
      message,
      response: responseText,
      tokens_used: aiResponse.usage?.input_tokens + aiResponse.usage?.output_tokens ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Di IA chat error");
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

router.get("/ai/history", async (req, res): Promise<void> => {
  try {
    const limit = Number(req.query["limit"]) || 50;
    let query = supabase
      .from("di_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (req.query["clinica_id"]) {
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

export default router;
