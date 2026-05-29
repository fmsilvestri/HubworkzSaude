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
    // Table may not exist yet — return empty array gracefully until migration is applied
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("cotacoes")) {
        res.json([]);
        return;
      }
      throw error;
    }
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
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("cotacoes")) {
        res.status(503).json({ error: "Tabela cotacoes pendente de migration. Execute o supabase-migration.sql no Supabase Studio." });
        return;
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create cotacao");
    res.status(500).json({ error: "Failed to create cotacao" });
  }
});

export default router;
