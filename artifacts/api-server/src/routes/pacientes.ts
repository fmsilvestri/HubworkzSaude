import { Router, type IRouter } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const DEFAULT_CLINICA = "00000000-0000-0000-0000-000000000001";

// Map frontend field names → Supabase column names
const FIELD_TO_DB: Record<string, string> = {
  data_nascimento: "data_nasc",
  numero_carteirinha: "nr_carteirinha",
  cid: "cid10",
};

// Map Supabase column names → frontend field names (reverse)
const DB_TO_FIELD: Record<string, string> = {
  data_nasc: "data_nascimento",
  nr_carteirinha: "numero_carteirinha",
  cid10: "cid",
};

const ALLOWED_FRONTEND = [
  "nome", "cpf", "data_nascimento", "email", "telefone",
  "convenio", "numero_carteirinha", "diagnostico", "cid", "endereco",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});

function toDbPayload(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_FRONTEND) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== "" && body[k] != null) {
      const dbKey = FIELD_TO_DB[k] ?? k;
      out[dbKey] = body[k];
    }
  }
  return out;
}

function toFrontend(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const frontKey = DB_TO_FIELD[k] ?? k;
    out[frontKey] = v;
  }
  // normalize mandato_ativo as boolean from mandato_status text field
  if ("mandato_status" in row) {
    out["mandato_ativo"] = row["mandato_status"] === "ativo";
    delete out["mandato_status"];
  }
  return out;
}

router.get("/pacientes", async (req, res): Promise<void> => {
  try {
    let query = supabase
      .from("pacientes")
      .select("*, processos(fase, status, updated_at)")
      .order("created_at", { ascending: false });
    if (req.query["clinica_id"]) query = query.eq("clinica_id", String(req.query["clinica_id"]));
    if (req.query["search"]) query = query.ilike("nome", `%${String(req.query["search"])}%`);
    const { data, error } = await query;
    if (error) throw error;

    const result = (data ?? []).map((p: Record<string, unknown>) => {
      const procs = (p["processos"] as Array<{ fase: number; status: string; updated_at: string }> | null) ?? [];
      const active = procs.filter((pr) => pr.status !== "concluido");
      const best = active.length > 0
        ? active.sort((a, b) => b.fase - a.fase)[0]
        : procs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

      const { processos: _, ...rest } = p;
      return {
        ...toFrontend(rest),
        processo_fase: best ? best.fase : null,
        processo_status: best ? best.status : null,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list pacientes");
    res.status(500).json({ error: "Failed to fetch pacientes" });
  }
});

router.post("/pacientes", async (req, res): Promise<void> => {
  try {
    const payload = toDbPayload(req.body as Record<string, unknown>);
    payload["clinica_id"] = DEFAULT_CLINICA;
    const { data, error } = await supabase
      .from("pacientes")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(toFrontend(data as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Failed to create paciente");
    const msg = (err as { message?: string })?.message ?? "Failed to create paciente";
    res.status(500).json({ error: msg });
  }
});

router.get("/pacientes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).single();
    if (error || !data) { res.status(404).json({ error: "Paciente not found" }); return; }
    res.json(toFrontend(data as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Failed to get paciente");
    res.status(500).json({ error: "Failed to fetch paciente" });
  }
});

router.patch("/pacientes/:id", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const payload = toDbPayload(req.body as Record<string, unknown>);
    const { data, error } = await supabase
      .from("pacientes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: "Paciente not found" }); return; }
    res.json(toFrontend(data as Record<string, unknown>));
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
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23503") {
      res.status(409).json({
        error: "Paciente possui registros vinculados (notas fiscais, processos ou cotações) e não pode ser excluído.",
      });
      return;
    }
    req.log.error({ err }, "Failed to delete paciente");
    res.status(500).json({ error: "Failed to delete paciente" });
  }
});

// ── Documentos (imagens + PDFs) ──────────────────────────────────────────────

const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].includes(file.mimetype);
    cb(null, ok);
  },
});

router.get("/pacientes/:id/documentos", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const { data, error } = await supabase.storage
      .from("pacientes-documentos")
      .list(`${id}/documentos`, { sortBy: { column: "created_at", order: "desc" } });
    if (error) { res.status(500).json({ error: error.message }); return; }
    const files = (data ?? []).map((f) => {
      const { data: urlData } = supabase.storage
        .from("pacientes-documentos")
        .getPublicUrl(`${id}/documentos/${f.name}`);
      return {
        name: f.name,
        url: urlData.publicUrl,
        size: f.metadata?.["size"] as number | undefined,
        mimetype: f.metadata?.["mimetype"] as string | undefined,
        created_at: f.created_at,
      };
    });
    res.json(files);
  } catch (err) {
    req.log.error({ err }, "Failed to list documentos");
    res.status(500).json({ error: "Failed to list documentos" });
  }
});

router.post(
  "/pacientes/:id/documentos/upload",
  uploadDoc.single("file"),
  async (req, res): Promise<void> => {
    try {
      const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
      const file = req.file;
      if (!file) { res.status(400).json({ error: "Nenhum arquivo enviado." }); return; }

      const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const storagePath = `${id}/documentos/${Date.now()}_${safeBase}`;

      const { error: upErr } = await supabase.storage
        .from("pacientes-documentos")
        .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("pacientes-documentos")
        .getPublicUrl(storagePath);

      res.status(201).json({
        name: `${Date.now()}_${safeBase}`,
        url: urlData.publicUrl,
        size: file.size,
        mimetype: file.mimetype,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to upload documento");
      const msg = (err as { message?: string })?.message ?? "Falha ao fazer upload";
      res.status(500).json({ error: msg });
    }
  }
);

router.delete("/pacientes/:id/documentos/:filename", async (req, res): Promise<void> => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
    const filename = Array.isArray(req.params["filename"]) ? req.params["filename"][0] : req.params["filename"];
    const { error } = await supabase.storage
      .from("pacientes-documentos")
      .remove([`${id}/documentos/${filename}`]);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete documento");
    res.status(500).json({ error: "Failed to delete documento" });
  }
});

router.post(
  "/pacientes/:id/mandato-upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    try {
      const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "Nenhum arquivo enviado. Apenas PDF é aceito." });
        return;
      }

      const storagePath = `${id}/mandato.pdf`;

      const { error: upErr } = await supabase.storage
        .from("pacientes")
        .upload(storagePath, file.buffer, { contentType: "application/pdf", upsert: true });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("pacientes")
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
        .from("pacientes")
        .update({ mandato_pdf_url: publicUrl, mandato_status: "ativo" })
        .eq("id", id);

      if (updateErr) throw updateErr;

      res.json({ url: publicUrl });
    } catch (err) {
      req.log.error({ err }, "Failed to upload mandato PDF");
      res.status(500).json({ error: "Falha ao fazer upload do mandato" });
    }
  }
);

export default router;
