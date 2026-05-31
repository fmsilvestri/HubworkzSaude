import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/historico-atendimentos", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("historico_atendimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["paciente_id"]) {
      query = query.eq("paciente_id", String(req.query["paciente_id"]));
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205" || error.message?.toLowerCase().includes("historico_atendimentos")) {
        res.json([]);
        return;
      }
      throw error;
    }
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list historico atendimentos");
    res.status(500).json({ error: "Failed to fetch historico atendimentos" });
  }
});

router.post("/historico-atendimentos", async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    for (const k of ["paciente_id", "tipo", "tipo_label", "mensagem", "canal"]) {
      if (body[k] != null) payload[k] = body[k];
    }

    const { data, error } = await supabase
      .from("historico_atendimentos")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.message?.toLowerCase().includes("historico_atendimentos")) {
        res.status(503).json({
          error: "Tabela historico_atendimentos não existe. Execute o SQL abaixo no Supabase Studio:\n\nCREATE TABLE IF NOT EXISTS historico_atendimentos (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  paciente_id UUID,\n  tipo TEXT,\n  tipo_label TEXT,\n  mensagem TEXT,\n  canal TEXT,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\nALTER TABLE historico_atendimentos ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"public_access\" ON historico_atendimentos FOR ALL USING (true) WITH CHECK (true);",
        });
        return;
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create historico atendimento");
    res.status(500).json({ error: "Failed to create historico atendimento" });
  }
});

export default router;
