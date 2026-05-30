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
    const { nome, principio_ativo, apresentacao, modo_uso, conservacao, registro, classe } = req.body as {
      nome: string;
      principio_ativo?: string;
      apresentacao?: string;
      modo_uso?: string;
      conservacao?: string;
      registro?: string;
      classe?: string;
    };

    const CLINICA_ID = "00000000-0000-0000-0000-000000000001";
    const payload: Record<string, unknown> = { nome, clinica_id: CLINICA_ID };
    if (principio_ativo !== undefined && principio_ativo !== "") payload["principio_ativo"] = principio_ativo;
    if (apresentacao !== undefined && apresentacao !== "") payload["apresentacao"] = apresentacao;
    if (modo_uso !== undefined && modo_uso !== "") payload["modo_uso"] = modo_uso;
    if (conservacao !== undefined && conservacao !== "") payload["conservacao"] = conservacao;
    if (registro !== undefined && registro !== "") payload["registro"] = registro;
    if (classe !== undefined && classe !== "") payload["classe"] = classe;

    const { data, error } = await supabase
      .from("medicamentos")
      .insert(payload)
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
    const id = String(req.params["id"]);
    const { data, error } = await supabase
      .from("medicamentos")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) { res.status(404).json({ error: "Medicamento not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get medicamento");
    res.status(500).json({ error: "Failed to fetch medicamento" });
  }
});

router.put("/medicamentos/:id", async (req, res): Promise<void> => {
  try {
    const id = String(req.params["id"]);
    const { nome, principio_ativo, apresentacao, modo_uso, conservacao, registro, classe } = req.body as {
      nome?: string;
      principio_ativo?: string;
      apresentacao?: string;
      modo_uso?: string;
      conservacao?: string;
      registro?: string;
      classe?: string;
    };

    const payload: Record<string, unknown> = {};
    if (nome !== undefined) payload["nome"] = nome;
    if (principio_ativo !== undefined) payload["principio_ativo"] = principio_ativo || null;
    if (apresentacao !== undefined) payload["apresentacao"] = apresentacao || null;
    if (modo_uso !== undefined) payload["modo_uso"] = modo_uso || null;
    if (conservacao !== undefined) payload["conservacao"] = conservacao || null;
    if (registro !== undefined) payload["registro"] = registro || null;
    if (classe !== undefined) payload["classe"] = classe || null;

    const { data, error } = await supabase
      .from("medicamentos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: "Medicamento not found" }); return; }
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update medicamento");
    res.status(500).json({ error: "Failed to update medicamento" });
  }
});

router.delete("/medicamentos/:id", async (req, res): Promise<void> => {
  try {
    const id = String(req.params["id"]);
    const { error } = await supabase
      .from("medicamentos")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete medicamento");
    res.status(500).json({ error: "Failed to delete medicamento" });
  }
});

export default router;
