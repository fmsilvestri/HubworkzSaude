import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const DEFAULT_CLINICA = "00000000-0000-0000-0000-000000000001";

// DB column is "fase" — map fase_atual ↔ fase at the boundary
const ALLOWED_CREATE = [
  "paciente_id", "medicamento_id", "distribuidora_id", "convenio",
  "status", "fase_atual", "numero_protocolo", "observacoes",
];

const ALLOWED_UPDATE = [
  "paciente_id", "medicamento_id", "convenio",
  "status", "fase_atual", "numero_protocolo", "observacoes",
];

/** Pick allowed fields from request body, mapping fase_atual → fase for DB */
function pick(body: Record<string, unknown>, allowed: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of allowed) {
    if (!Object.prototype.hasOwnProperty.call(body, k)) continue;
    const v = body[k];
    if (v === "" || v == null) continue;
    // Map app field name → DB column name
    const dbKey = k === "fase_atual" ? "fase" : k;
    out[dbKey] = v;
  }
  return out;
}

/** Map DB row (has "fase") → API response (has "fase_atual") */
function toResponse(row: Record<string, unknown>) {
  if ("fase" in row) {
    const { fase, ...rest } = row;
    return { ...rest, fase_atual: fase ?? 1 };
  }
  return row;
}

function toResponseList(rows: Record<string, unknown>[] | null) {
  return (rows ?? []).map(toResponse);
}

router.get("/processos", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("processos")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.query["status"]) query = query.eq("status", String(req.query["status"]));
    if (req.query["fase"]) {
      const fase = Number(req.query["fase"]);
      query = query.eq("fase", fase);
    }
    if (req.query["clinica_id"]) query = query.eq("clinica_id", String(req.query["clinica_id"]));

    const { data, error } = await query;
    if (error) throw error;
    res.json(toResponseList(data as Record<string, unknown>[]));
  } catch (err) {
    req.log.error({ err }, "Failed to list processos");
    res.status(500).json({ error: "Failed to fetch processos" });
  }
});

router.post("/processos", async (req, res): Promise<void> => {
  try {
    const payload = pick(req.body as Record<string, unknown>, ALLOWED_CREATE);
    payload["clinica_id"] = DEFAULT_CLINICA;
    if (!payload["fase"]) payload["fase"] = 1;
    if (!payload["status"]) payload["status"] = "pendente";

    const { data, error } = await supabase
      .from("processos")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(toResponse(data as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Failed to create processo");
    res.status(500).json({ error: "Failed to create processo" });
  }
});

router.get("/processos/stats/fases", async (_req, res): Promise<void> => {
  try {
    const { data, error } = await supabase.from("processos").select("fase");
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const p of data ?? []) {
      const row = p as Record<string, unknown>;
      const faseNum = row["fase"] ?? 1;
      const fase = `Fase ${faseNum}`;
      counts[fase] = (counts[fase] ?? 0) + 1;
    }

    const result = Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fase, count]) => ({ fase, count }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to get fase stats" });
  }
});

router.get("/processos/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase.from("processos").select("*").eq("id", id).single();
    if (error || !data) { res.status(404).json({ error: "Processo not found" }); return; }
    res.json(toResponse(data as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Failed to get processo");
    res.status(500).json({ error: "Failed to fetch processo" });
  }
});

router.patch("/processos/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = pick(req.body as Record<string, unknown>, ALLOWED_UPDATE);
    payload["updated_at"] = new Date().toISOString();

    const { data, error } = await supabase
      .from("processos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Processo not found" }); return; }
    res.json(toResponse(data as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Failed to update processo");
    res.status(500).json({ error: "Failed to update processo" });
  }
});

router.delete("/processos/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { error } = await supabase.from("processos").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete processo");
    res.status(500).json({ error: "Failed to delete processo" });
  }
});

export default router;
