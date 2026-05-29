import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/processos", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("processos")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["status"]) query = query.eq("status", String(req.query["status"]));
    if (req.query["fase"]) query = query.eq("fase_atual", Number(req.query["fase"]));
    if (req.query["clinica_id"]) query = query.eq("clinica_id", String(req.query["clinica_id"]));

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list processos");
    res.status(500).json({ error: "Failed to fetch processos" });
  }
});

router.post("/processos", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("processos")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create processo");
    res.status(500).json({ error: "Failed to create processo" });
  }
});

router.get("/processos/stats/fases", async (_req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("processos")
      .select("fase_atual");
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const p of data ?? []) {
      const fase = `Fase ${p.fase_atual}`;
      counts[fase] = (counts[fase] ?? 0) + 1;
    }

    const result = Object.entries(counts).map(([fase, count]) => ({ fase, count }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to get fase stats" });
  }
});

router.get("/processos/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("id", raw)
      .single();
    if (error || !data) { res.status(404).json({ error: "Processo not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get processo");
    res.status(500).json({ error: "Failed to fetch processo" });
  }
});

router.patch("/processos/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("processos")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", raw)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Processo not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update processo");
    res.status(500).json({ error: "Failed to update processo" });
  }
});

export default router;
