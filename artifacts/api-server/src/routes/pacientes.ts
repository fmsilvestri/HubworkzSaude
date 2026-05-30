import { Router, type IRouter } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const DEFAULT_CLINICA = "00000000-0000-0000-0000-000000000001";

const ALLOWED = [
  "nome", "cpf", "data_nascimento", "email", "telefone",
  "convenio", "numero_carteirinha", "diagnostico", "cid", "endereco", "mandato_ativo",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});

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
        .update({ mandato_pdf_url: publicUrl, mandato_ativo: true })
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
