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

router.patch("/glosas/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("glosas")
      .update(req.body)
      .eq("id", raw)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Glosa not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update glosa");
    res.status(500).json({ error: "Failed to update glosa" });
  }
});

export default router;
