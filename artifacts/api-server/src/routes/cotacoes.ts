import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const ALLOWED_FIELDS = [
  "data_cotacao", "nome_paciente", "origem_paciente", "convenio",
  "medicamento_nome", "tipo", "marca_laboratorio",
  "valor_importado", "frete_imposto", "total",
  "valor_noova", "valor_brasindice", "valor_enviado_convenio",
  "data_envio", "status", "valor_aprovado", "imposto", "resultado",
  "processo_id", "medicamento_id", "fornecedor_tipo", "fornecedor_id",
  "valor", "prazo_entrega", "recomendada",
];

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, k)) out[k] = body[k];
  }
  return out;
}

router.get("/cotacoes", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("cotacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["processo_id"]) query = query.eq("processo_id", String(req.query["processo_id"]));
    if (req.query["status"]) query = query.eq("status", String(req.query["status"]));
    if (req.query["convenio"]) query = query.eq("convenio", String(req.query["convenio"]));

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("cotacoes")) {
        res.json([]);
        return;
      }
      throw error;
    }
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list cotacoes");
    res.status(500).json({ error: "Failed to fetch cotacoes" });
  }
});

router.post("/cotacoes", async (req, res): Promise<void> => {
  try {
    const payload = pick(req.body as Record<string, unknown>);
    const { data, error } = await supabase
      .from("cotacoes")
      .insert(payload)
      .select()
      .single();
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("cotacoes")) {
        res.status(503).json({
          error: "Tabela cotacoes não existe. Execute o SQL em /api/admin/migrate no Supabase Studio.",
        });
        return;
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create cotacao");
    res.status(500).json({ error: "Failed to create cotacao" });
  }
});

const DEFAULT_CLINICA = "00000000-0000-0000-0000-000000000001";

router.put("/cotacoes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pick(req.body as Record<string, unknown>);

    const aprovando = payload["status"] === "aprovada";

    // Fetch current cotação before update (to detect status transition)
    let cotacaoAntes: Record<string, unknown> | null = null;
    if (aprovando) {
      const { data: antes } = await supabase.from("cotacoes").select("*").eq("id", id).single();
      cotacaoAntes = antes as Record<string, unknown> | null;
    }

    const { data, error } = await supabase
      .from("cotacoes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Cotacao not found" }); return; }

    const cotacao = data as Record<string, unknown>;

    // Auto-create processo when status transitions to "aprovada"
    if (aprovando && cotacaoAntes?.["status"] !== "aprovada") {
      // Resolve paciente_id from previously linked processo
      let pacienteId: string | null = null;
      const processoVinculadoId = (cotacao["processo_id"] ?? cotacaoAntes?.["processo_id"]) as string | null;
      if (processoVinculadoId) {
        const { data: proc } = await supabase
          .from("processos")
          .select("paciente_id")
          .eq("id", processoVinculadoId)
          .single();
        if (proc && (proc as Record<string, unknown>)["paciente_id"]) {
          pacienteId = (proc as Record<string, unknown>)["paciente_id"] as string;
        }
      }

      // Build new processo payload
      const processoPayload: Record<string, unknown> = {
        clinica_id: DEFAULT_CLINICA,
        status: "em_andamento",
        fase: 1,
        convenio: cotacao["convenio"] ?? null,
        medicamento_id: cotacao["medicamento_id"] ?? null,
        observacoes: `Processo gerado automaticamente pela aprovação da cotação. Medicamento: ${cotacao["medicamento_nome"] ?? "não informado"}. Valor aprovado: ${cotacao["valor_aprovado"] != null ? `R$ ${Number(cotacao["valor_aprovado"]).toFixed(2)}` : "não informado"}.`,
      };
      if (pacienteId) processoPayload["paciente_id"] = pacienteId;

      const { data: novoProcesso, error: procError } = await supabase
        .from("processos")
        .insert(processoPayload)
        .select()
        .single();

      if (!procError && novoProcesso) {
        const proc = novoProcesso as Record<string, unknown>;
        // Link the cotação to the new processo
        await supabase.from("cotacoes").update({ processo_id: proc["id"] }).eq("id", id);
        res.json({ ...cotacao, processo_id: proc["id"], _processo_criado: proc });
        return;
      } else {
        req.log.error({ err: procError }, "Auto-create processo on cotacao approval failed");
      }
    }

    res.json(cotacao);
  } catch (err) {
    req.log.error({ err }, "Failed to update cotacao");
    res.status(500).json({ error: "Failed to update cotacao" });
  }
});

router.delete("/cotacoes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase.from("cotacoes").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete cotacao");
    res.status(500).json({ error: "Failed to delete cotacao" });
  }
});

export default router;
