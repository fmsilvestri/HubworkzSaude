import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/glosas", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("glosas")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["status"]) query = query.eq("status", String(req.query["status"]));

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list glosas");
    res.status(500).json({ error: "Failed to fetch glosas" });
  }
});

router.post("/glosas", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("glosas")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create glosa");
    res.status(500).json({ error: "Failed to create glosa" });
  }
});

const PATCH_ALLOWED = ["status", "recurso_texto"];
const PUT_ALLOWED = ["motivo", "valor", "prazo_recurso", "status", "recurso_texto", "processo_id", "fatura_id"];

function pick(body: Record<string, unknown>, allowed: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) out[k] = body[k];
  }
  return out;
}

router.patch("/glosas/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pick(req.body as Record<string, unknown>, PATCH_ALLOWED);
    const { data, error } = await supabase
      .from("glosas")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Glosa not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update glosa");
    res.status(500).json({ error: "Failed to update glosa" });
  }
});

router.put("/glosas/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pick(req.body as Record<string, unknown>, PUT_ALLOWED);
    const { data, error } = await supabase
      .from("glosas")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Glosa not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to edit glosa");
    res.status(500).json({ error: "Failed to edit glosa" });
  }
});

router.delete("/glosas/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase.from("glosas").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete glosa");
    res.status(500).json({ error: "Failed to delete glosa" });
  }
});

export default router;
