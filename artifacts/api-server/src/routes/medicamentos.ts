import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/medicamentos", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("medicamentos")
      .select("*")
      .order("nome", { ascending: true });

    if (req.query["search"]) {
      query = query.ilike("nome", `%${String(req.query["search"])}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list medicamentos");
    res.status(500).json({ error: "Failed to fetch medicamentos" });
  }
});

router.post("/medicamentos", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("medicamentos")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create medicamento");
    res.status(500).json({ error: "Failed to create medicamento" });
  }
});

router.get("/medicamentos/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("medicamentos")
      .select("*")
      .eq("id", raw)
      .single();
    if (error || !data) { res.status(404).json({ error: "Medicamento not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get medicamento");
    res.status(500).json({ error: "Failed to fetch medicamento" });
  }
});

export default router;
