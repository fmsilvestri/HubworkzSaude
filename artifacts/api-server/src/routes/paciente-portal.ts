import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

/**
 * GET /api/paciente/me
 * Retorna todos os dados do paciente autenticado.
 * Usa service role para contornar RLS e verifica o JWT do header Authorization.
 */
router.get("/paciente/me", async (req, res): Promise<void> => {
  try {
    // Extrair e verificar JWT do header Authorization
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token de autenticação não fornecido." });
      return;
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      res.status(401).json({ error: "Token inválido ou expirado." });
      return;
    }

    // Buscar paciente pelo user_id (service role — bypassa RLS)
    const { data: pacienteRow, error: pacErr } = await supabase
      .from("pacientes")
      .select("id, nome, email, telefone, convenio, diagnostico, data_nasc, medicamento_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pacErr) {
      req.log.error({ err: pacErr }, "Failed to fetch paciente by user_id");
      res.status(500).json({ error: "Erro ao buscar dados do paciente." });
      return;
    }

    if (!pacienteRow) {
      res.status(404).json({ error: "Nenhum cadastro encontrado para este usuário. Entre em contato com a clínica." });
      return;
    }

    const pacienteId = pacienteRow.id as string;
    const medicamentoId = pacienteRow.medicamento_id as string | null;

    // Buscar dados relacionados em paralelo
    const [medRes, processosRes, remessasRes, monitoramentosRes] = await Promise.all([
      medicamentoId
        ? supabase
            .from("medicamentos")
            .select("id, nome, apresentacao, modo_uso, conservacao")
            .eq("id", medicamentoId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      supabase
        .from("processos")
        .select("id, status, fase, numero_judicial, created_at, updated_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("notas_fiscais")
        .select("id, numero_nf, nf_status, data_emissao, codigo_rastreio, previsao_entrega, created_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false }),

      supabase
        .from("monitoramentos")
        .select("id, data_contato, canal, adesao, observacoes, created_at")
        .eq("paciente_id", pacienteId)
        .order("data_contato", { ascending: true }),
    ]);

    // Normalizar medicamento
    const rawMed = medRes.data as Record<string, unknown> | null;
    const medicamento = rawMed
      ? {
          id: rawMed["id"],
          nome: rawMed["nome"],
          concentracao: rawMed["apresentacao"] ?? null,
          via_administracao: rawMed["modo_uso"] ?? null,
          conservacao: rawMed["conservacao"] ?? null,
          forma_farmaceutica: null,
        }
      : null;

    // Normalizar processo
    const rawProcesso = (processosRes.data ?? [])[0] as Record<string, unknown> | undefined;
    const processo = rawProcesso
      ? {
          id: rawProcesso["id"],
          status: rawProcesso["status"] ?? "cotacao",
          fase_atual: rawProcesso["fase"] ?? 1,
          numero_protocolo: rawProcesso["numero_judicial"] ?? null,
          observacoes: rawProcesso["observacoes"] ?? null,
          created_at: rawProcesso["created_at"],
          updated_at: rawProcesso["updated_at"] ?? null,
        }
      : null;

    // Normalizar remessas
    const remessas = (remessasRes.data ?? []).map((r) => ({
      id: (r as Record<string, unknown>)["id"],
      numero: (r as Record<string, unknown>)["numero_nf"] ?? null,
      status: (r as Record<string, unknown>)["nf_status"] ?? null,
      data_emissao: (r as Record<string, unknown>)["data_emissao"] ?? null,
      codigo_rastreio: (r as Record<string, unknown>)["codigo_rastreio"] ?? null,
      previsao_entrega: (r as Record<string, unknown>)["previsao_entrega"] ?? null,
      created_at: (r as Record<string, unknown>)["created_at"],
    }));

    // Normalizar monitoramentos (sem coluna status — derivar de adesao)
    const monitoramentos = (monitoramentosRes.data ?? []).map((m) => {
      const mr = m as Record<string, unknown>;
      const status = mr["adesao"] == null ? "agendado" : "realizado";
      return {
        id: mr["id"],
        status,
        data_contato: mr["data_contato"] ?? null,
        canal: mr["canal"] ?? null,
        observacoes: mr["observacoes"] ?? null,
        created_at: mr["created_at"],
      };
    });

    res.json({
      id: pacienteRow.id,
      nome: pacienteRow.nome,
      email: pacienteRow.email ?? null,
      telefone: pacienteRow.telefone ?? null,
      convenio: pacienteRow.convenio ?? null,
      diagnostico: pacienteRow.diagnostico ?? null,
      data_nascimento: pacienteRow.data_nasc ?? null,
      medicamento,
      processo,
      remessas,
      monitoramentos,
    });
  } catch (err) {
    req.log.error({ err }, "Unexpected error in GET /paciente/me");
    res.status(500).json({ error: "Erro inesperado. Tente novamente." });
  }
});

export default router;
