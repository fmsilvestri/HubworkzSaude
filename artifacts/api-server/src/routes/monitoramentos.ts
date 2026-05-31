import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/monitoramentos", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("monitoramentos")
      .select("*")
      .order("data_contato", { ascending: false });

    if (req.query["paciente_id"]) query = query.eq("paciente_id", String(req.query["paciente_id"]));
    if (req.query["mes"]) {
      const mes = String(req.query["mes"]);
      query = query.gte("data_contato", `${mes}-01`).lte("data_contato", `${mes}-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list monitoramentos");
    res.status(500).json({ error: "Failed to fetch monitoramentos" });
  }
});

router.post("/monitoramentos", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("monitoramentos")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create monitoramento");
    res.status(500).json({ error: "Failed to create monitoramento" });
  }
});

router.patch("/monitoramentos/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("monitoramentos")
      .update(req.body)
      .eq("id", raw)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Monitoramento not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update monitoramento");
    res.status(500).json({ error: "Failed to update monitoramento" });
  }
});

router.delete("/monitoramentos/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase.from("monitoramentos").delete().eq("id", raw);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete monitoramento");
    res.status(500).json({ error: "Failed to delete monitoramento" });
  }
});

export default router;
