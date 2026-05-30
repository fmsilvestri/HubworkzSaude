import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const CLINICA_ID = "00000000-0000-0000-0000-000000000001";
const ALLOWED_FIELDS = ["nome", "cnpj", "email", "telefone", "endereco", "whatsapp_gestor"];

function pickAllowed(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      out[key] = body[key];
    }
  }
  return out;
}

router.get("/clinica", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("clinicas")
      .select("*")
      .eq("id", CLINICA_ID)
      .maybeSingle();
    if (error) throw error;
    res.json(data ?? { id: CLINICA_ID, nome: "", cnpj: "", email: "" });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch clinica");
    res.status(500).json({ error: "Failed to fetch clinica" });
  }
});

router.put("/clinica", async (req, res): Promise<void> => {
  try {
    const payload = pickAllowed(req.body as Record<string, unknown>);
    if (!payload["nome"]) {
      res.status(400).json({ error: "Campo 'nome' é obrigatório" });
      return;
    }

    const { data: existing } = await supabase
      .from("clinicas")
      .select("id")
      .eq("id", CLINICA_ID)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from("clinicas")
        .update(payload)
        .eq("id", CLINICA_ID)
        .select()
        .single();
    } else {
      result = await supabase
        .from("clinicas")
        .insert({ ...payload, id: CLINICA_ID })
        .select()
        .single();
    }

    if (result.error) throw result.error;
    res.json(result.data);
  } catch (err) {
    req.log.error({ err }, "Failed to save clinica");
    res.status(500).json({ error: "Failed to save clinica" });
  }
});

export default router;
