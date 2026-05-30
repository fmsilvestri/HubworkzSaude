import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const ALLOWED_FIELDS = ["nome", "cnpj", "responsavel", "email", "telefone", "tipo", "status"];

function pickAllowed(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== "" && body[key] != null) {
      out[key] = body[key];
    }
  }
  return out;
}

router.get("/distribuidoras", async (_req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("distribuidoras")
      .select("*")
      .order("nome", { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch distribuidoras" });
  }
});

router.post("/distribuidoras", async (req, res): Promise<void> => {
  try {
    const payload = pickAllowed(req.body as Record<string, unknown>);
    if (!payload["nome"]) {
      res.status(400).json({ error: "Campo 'nome' é obrigatório" });
      return;
    }
    const { data, error } = await supabase
      .from("distribuidoras")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create distribuidora");
    res.status(500).json({ error: "Failed to create distribuidora" });
  }
});

router.put("/distribuidoras/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pickAllowed(req.body as Record<string, unknown>);
    const { data, error } = await supabase
      .from("distribuidoras")
      .update(payload)
      .eq("id", raw)
      .select()
      .single();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Distribuidora not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update distribuidora");
    res.status(500).json({ error: "Failed to update distribuidora" });
  }
});

router.delete("/distribuidoras/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase
      .from("distribuidoras")
      .delete()
      .eq("id", raw);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete distribuidora");
    res.status(500).json({ error: "Failed to delete distribuidora" });
  }
});

router.get("/distribuidoras/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("distribuidoras")
      .select("*")
      .eq("id", raw)
      .single();
    if (error || !data) { res.status(404).json({ error: "Distribuidora not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get distribuidora");
    res.status(500).json({ error: "Failed to fetch distribuidora" });
  }
});

export default router;
