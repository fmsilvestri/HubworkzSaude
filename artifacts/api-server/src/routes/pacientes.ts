import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const DEFAULT_CLINICA = "00000000-0000-0000-0000-000000000001";

const ALLOWED = [
  "nome", "cpf", "data_nascimento", "email", "telefone",
  "convenio", "numero_carteirinha", "diagnostico", "cid", "endereco", "mandato_ativo",
];

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== "" && body[k] != null) {
      out[k] = body[k];
    }
  }
  return out;
}

router.get("/pacientes", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("pacientes")
      .select("*")
      .order("created_at", { ascending: false });
    if (req.query["clinica_id"]) query = query.eq("clinica_id", String(req.query["clinica_id"]));
    if (req.query["search"]) query = query.ilike("nome", `%${String(req.query["search"])}%`);
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
    const payload = pick(req.body as Record<string, unknown>);
    payload["clinica_id"] = DEFAULT_CLINICA;
    const { data, error } = await supabase
      .from("pacientes")
      .insert(payload)
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
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).single();
    if (error || !data) { res.status(404).json({ error: "Paciente not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get paciente");
    res.status(500).json({ error: "Failed to fetch paciente" });
  }
});

router.patch("/pacientes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pick(req.body as Record<string, unknown>);
    const { data, error } = await supabase
      .from("pacientes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Paciente not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update paciente");
    res.status(500).json({ error: "Failed to update paciente" });
  }
});

router.delete("/pacientes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete paciente");
    res.status(500).json({ error: "Failed to delete paciente" });
  }
});

export default router;
