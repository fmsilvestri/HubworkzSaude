import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const TABLE = "elo_saude_importados";

router.get("/elo-saude", async (req, res): Promise<void> => {
  try {
    let query = supabase.from(TABLE).select("*").order("descricao");
    const { search, conservacao, laboratorio } = req.query as Record<string, string>;
    if (conservacao) query = query.eq("conservacao", conservacao);
    if (laboratorio) query = query.eq("laboratorio", laboratorio);
    if (search) {
      query = query.or(
        `descricao.ilike.%${search}%,principio_ativo.ilike.%${search}%,laboratorio.ilike.%${search}%,codigo_tuss.ilike.%${search}%,ean.ilike.%${search}%`
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("PGRST")) {
      res.status(503).json({ error: "TABLE_NOT_FOUND", message: msg });
      return;
    }
    req.log.error({ err }, "Failed to list elo-saude");
    res.status(500).json({ error: "Failed to fetch elo-saude items" });
  }
});

router.post("/elo-saude/bulk", async (req, res): Promise<void> => {
  try {
    const rows = req.body as Array<Record<string, unknown>>;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "Body deve ser um array não vazio" });
      return;
    }
    const ALLOWED = ["descricao", "principio_ativo", "conservacao", "laboratorio", "codigo_tuss", "ean", "valor_contrato", "marca_lab", "valor"];
    const sanitized = rows.map((row) => {
      const out: Record<string, string> = {};
      for (const k of ALLOWED) {
        out[k] = String(row[k] ?? "").trim();
      }
      if (!out["descricao"]) out["descricao"] = "(sem descrição)";
      if (!out["conservacao"]) out["conservacao"] = "AMBIENTE";
      return out;
    });
    // Supabase allows bulk insert in one request
    const CHUNK = 200;
    let inserted = 0;
    for (let i = 0; i < sanitized.length; i += CHUNK) {
      const chunk = sanitized.slice(i, i + CHUNK);
      const { error } = await supabase.from(TABLE).insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }
    res.status(201).json({ inserted });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk-import elo-saude");
    res.status(500).json({ error: "Falha na importação em massa" });
  }
});

router.post("/elo-saude", async (req, res): Promise<void> => {
  try {
    const { descricao, principio_ativo, conservacao, laboratorio, codigo_tuss, ean, valor_contrato, marca_lab, valor } = req.body as Record<string, string>;
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ descricao, principio_ativo: principio_ativo ?? "", conservacao: conservacao ?? "", laboratorio: laboratorio ?? "", codigo_tuss: codigo_tuss ?? "", ean: ean ?? "", valor_contrato: valor_contrato ?? "", marca_lab: marca_lab ?? "", valor: valor ?? "" })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to create elo-saude item");
    res.status(500).json({ error: "Failed to create item" });
  }
});

router.put("/elo-saude/:id", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const ALLOWED = ["descricao", "principio_ativo", "conservacao", "laboratorio", "codigo_tuss", "ean", "valor_contrato", "marca_lab", "valor"];
    const payload: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    const { data, error } = await supabase.from(TABLE).update(payload).eq("id", id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update elo-saude item");
    res.status(500).json({ error: "Failed to update item" });
  }
});

router.delete("/elo-saude/:id", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete elo-saude item");
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
