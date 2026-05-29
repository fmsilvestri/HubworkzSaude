import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/faturas", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("notas_fiscais")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["status"]) query = query.eq("status", String(req.query["status"]));
    if (req.query["convenio_id"]) query = query.eq("convenio_id", String(req.query["convenio_id"]));

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list faturas");
    res.status(500).json({ error: "Failed to fetch faturas" });
  }
});

router.post("/faturas", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create fatura");
    res.status(500).json({ error: "Failed to create fatura" });
  }
});

router.get("/faturas/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("id", raw)
      .single();
    if (error || !data) { res.status(404).json({ error: "Fatura not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get fatura");
    res.status(500).json({ error: "Failed to fetch fatura" });
  }
});

router.patch("/faturas/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("notas_fiscais")
      .update(req.body)
      .eq("id", raw)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Fatura not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update fatura");
    res.status(500).json({ error: "Failed to update fatura" });
  }
});

export default router;
