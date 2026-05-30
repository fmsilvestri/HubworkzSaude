import { Router, type IRouter } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

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
    const { nome, principio_ativo, apresentacao, modo_uso, conservacao, registro, classe, codigo_barras, data_ultima_compra, lote, validade, orientacoes_uso, valor, quantidade_estoque } = req.body as {
      nome: string;
      principio_ativo?: string;
      apresentacao?: string;
      modo_uso?: string;
      conservacao?: string;
      registro?: string;
      classe?: string;
      codigo_barras?: string;
      data_ultima_compra?: string;
      lote?: string;
      validade?: string;
      orientacoes_uso?: string;
      valor?: number;
      quantidade_estoque?: number;
    };

    const CLINICA_ID = "00000000-0000-0000-0000-000000000001";
    const payload: Record<string, unknown> = {
      nome,
      clinica_id: CLINICA_ID,
      principio_ativo: principio_ativo ?? "",
    };
    if (apresentacao !== undefined && apresentacao !== "") payload["apresentacao"] = apresentacao;
    if (modo_uso !== undefined && modo_uso !== "") payload["modo_uso"] = modo_uso;
    if (conservacao !== undefined && conservacao !== "") payload["conservacao"] = conservacao;
    if (registro !== undefined && registro !== "") payload["registro"] = registro;
    if (classe !== undefined && classe !== "") payload["classe"] = classe;
    if (codigo_barras !== undefined && codigo_barras !== "") payload["codigo_barras"] = codigo_barras;
    if (data_ultima_compra !== undefined && data_ultima_compra !== "") payload["data_ultima_compra"] = data_ultima_compra;
    if (lote !== undefined && lote !== "") payload["lote"] = lote;
    if (validade !== undefined && validade !== "") payload["validade"] = validade;
    if (orientacoes_uso !== undefined && orientacoes_uso !== "") payload["orientacoes_uso"] = orientacoes_uso;
    if (valor !== undefined && valor !== null) payload["valor"] = valor;
    if (quantidade_estoque !== undefined && quantidade_estoque !== null) payload["quantidade_estoque"] = quantidade_estoque;

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
    const { nome, principio_ativo, apresentacao, modo_uso, conservacao, registro, classe, codigo_barras, data_ultima_compra, lote, validade, orientacoes_uso, valor, quantidade_estoque } = req.body as {
      nome?: string;
      principio_ativo?: string;
      apresentacao?: string;
      modo_uso?: string;
      conservacao?: string;
      registro?: string;
      classe?: string;
      codigo_barras?: string;
      data_ultima_compra?: string;
      lote?: string;
      validade?: string;
      orientacoes_uso?: string;
      valor?: number;
      quantidade_estoque?: number;
    };

    const payload: Record<string, unknown> = {};
    if (nome !== undefined && nome !== "") payload["nome"] = nome;
    if (principio_ativo !== undefined && principio_ativo !== "") payload["principio_ativo"] = principio_ativo;
    if (apresentacao !== undefined && apresentacao !== "") payload["apresentacao"] = apresentacao;
    if (modo_uso !== undefined && modo_uso !== "") payload["modo_uso"] = modo_uso;
    if (conservacao !== undefined && conservacao !== "") payload["conservacao"] = conservacao;
    if (registro !== undefined && registro !== "") payload["registro"] = registro;
    if (classe !== undefined && classe !== "") payload["classe"] = classe;
    if (codigo_barras !== undefined && codigo_barras !== "") payload["codigo_barras"] = codigo_barras;
    if (data_ultima_compra !== undefined && data_ultima_compra !== "") payload["data_ultima_compra"] = data_ultima_compra;
    if (lote !== undefined && lote !== "") payload["lote"] = lote;
    if (validade !== undefined && validade !== "") payload["validade"] = validade;
    if (orientacoes_uso !== undefined && orientacoes_uso !== "") payload["orientacoes_uso"] = orientacoes_uso;
    if (valor !== undefined && valor !== null) payload["valor"] = valor;
    if (quantidade_estoque !== undefined && quantidade_estoque !== null) payload["quantidade_estoque"] = quantidade_estoque;

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

router.post(
  "/medicamentos/:id/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    try {
      const id = String(req.params["id"]);
      const fileType = String(req.body["type"] ?? "foto"); // "foto" | "pdf"
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const ext = file.mimetype === "application/pdf" ? "pdf" : file.originalname.split(".").pop() ?? "jpg";
      const storagePath = `${id}/${fileType}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("medicamentos")
        .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("medicamentos")
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      const field = fileType === "pdf" ? "pdf_url" : "foto_url";

      const { error: updateErr } = await supabase
        .from("medicamentos")
        .update({ [field]: publicUrl })
        .eq("id", id);
      if (updateErr) throw updateErr;

      res.json({ url: publicUrl });
    } catch (err) {
      req.log.error({ err }, "Failed to upload medicamento file");
      res.status(500).json({ error: "Failed to upload file" });
    }
  }
);

export default router;
