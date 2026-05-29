import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

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
    const { data, error } = await supabase
      .from("distribuidoras")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create distribuidora");
    res.status(500).json({ error: "Failed to create distribuidora" });
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
