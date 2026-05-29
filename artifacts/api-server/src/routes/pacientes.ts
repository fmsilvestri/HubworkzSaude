import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/pacientes", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("pacientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["clinica_id"]) query = query.eq("clinica_id", String(req.query["clinica_id"]));
    if (req.query["search"]) {
      query = query.ilike("nome", `%${String(req.query["search"])}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Failed to list pacientes");
    res.status(500).json({ error: "Failed to fetch pacientes" });
  }
});

router.post("/pacientes", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("pacientes")
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create paciente");
    res.status(500).json({ error: "Failed to create paciente" });
  }
});

router.get("/pacientes/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", raw)
      .single();
    if (error || !data) { res.status(404).json({ error: "Paciente not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get paciente");
    res.status(500).json({ error: "Failed to fetch paciente" });
  }
});

router.patch("/pacientes/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase
      .from("pacientes")
      .update(req.body)
      .eq("id", raw)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Paciente not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update paciente");
    res.status(500).json({ error: "Failed to update paciente" });
  }
});

export default router;
