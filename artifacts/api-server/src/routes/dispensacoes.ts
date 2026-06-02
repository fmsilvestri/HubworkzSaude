import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/dispensacoes", async (req, res): Promise<void> => {
  try {
    const { paciente_id } = req.query as Record<string, string | undefined>;
    let query = supabase
      .from("dispensacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (paciente_id) query = query.eq("paciente_id", paciente_id);
    const { data, error } = await query;
    if (error) {
      req.log.error({ error }, "Failed to list dispensacoes");
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "dispensacoes list error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/dispensacoes", async (req, res): Promise<void> => {
  try {
    const { paciente_id, medicamento_id, medicamento_nome, data_retirada, lote, validade } = req.body as {
      paciente_id?: string;
      medicamento_id?: string;
      medicamento_nome?: string;
      data_retirada?: string;
      lote?: string;
      validade?: string;
    };
    if (!paciente_id || !medicamento_nome) {
      res.status(400).json({ error: "paciente_id e medicamento_nome são obrigatórios" });
      return;
    }
    const payload: Record<string, unknown> = {
      paciente_id,
      medicamento_nome,
    };
    if (medicamento_id) payload["medicamento_id"] = medicamento_id;
    if (data_retirada) payload["data_retirada"] = data_retirada;
    if (lote) payload["lote"] = lote;
    if (validade) payload["validade"] = validade;

    const { data, error } = await supabase
      .from("dispensacoes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      req.log.error({ error }, "Failed to create dispensacao");
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "dispensacoes create error");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
