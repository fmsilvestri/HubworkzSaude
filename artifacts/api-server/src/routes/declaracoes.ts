import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const ALLOWED = ["paciente_id", "paciente_nome", "modalidade", "status", "data", "pdf_url", "clinica_id"];

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== "" && body[k] != null) {
      out[k] = body[k];
    }
  }
  return out;
}

const DEFAULT_CLINICA = "00000000-0000-0000-0000-000000000001";

router.get("/declaracoes", async (req, res): Promise<void> => {
  try {
    let q = supabase.from("declaracoes").select("*").order("created_at", { ascending: false });
    if (req.query["paciente_id"]) q = q.eq("paciente_id", String(req.query["paciente_id"]));
    if (req.query["status"]) q = q.eq("status", String(req.query["status"]));
    const { data, error } = await q;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list declaracoes");
    res.status(500).json({ error: "Failed to fetch declaracoes" });
  }
});

router.post("/declaracoes", async (req, res): Promise<void> => {
  try {
    const payload = pick(req.body as Record<string, unknown>);
    if (!payload["clinica_id"]) payload["clinica_id"] = DEFAULT_CLINICA;
    if (!payload["status"]) payload["status"] = "pendente";
    const { data, error } = await supabase
      .from("declaracoes")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create declaracao");
    res.status(500).json({ error: "Failed to create declaracao" });
  }
});

router.put("/declaracoes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pick(req.body as Record<string, unknown>);
    const { data, error } = await supabase
      .from("declaracoes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update declaracao");
    res.status(500).json({ error: "Failed to update declaracao" });
  }
});

router.delete("/declaracoes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase.from("declaracoes").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete declaracao");
    res.status(500).json({ error: "Failed to delete declaracao" });
  }
});

export default router;
