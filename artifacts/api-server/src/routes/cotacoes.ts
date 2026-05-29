import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/cotacoes", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("cotacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["processo_id"]) query = query.eq("processo_id", String(req.query["processo_id"]));

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list cotacoes");
    res.status(500).json({ error: "Failed to fetch cotacoes" });
  }
});

router.post("/cotacoes", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("cotacoes")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create cotacao");
    res.status(500).json({ error: "Failed to create cotacao" });
  }
});

export default router;
