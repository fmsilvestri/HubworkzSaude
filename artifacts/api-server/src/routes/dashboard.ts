import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  try {
    const [processosRes, pacientesRes, faturasRes, glosasRes, monitoramentosRes] = await Promise.all([
      supabase.from("processos").select("id, fase_atual, status", { count: "exact" }),
      supabase.from("pacientes").select("id", { count: "exact" }),
      supabase.from("notas_fiscais").select("valor").eq("status", "emitida"),
      supabase.from("glosas").select("id", { count: "exact" }).eq("status", "pendente"),
      supabase.from("monitoramentos").select("id", { count: "exact" }).gte(
        "data_contato",
        new Date().toISOString().split("T")[0]
      ),
    ]);

    const processos = processosRes.data ?? [];
    const faseMap: Record<string, number> = {};
    for (const p of processos) {
      const fase = `fase_${p.fase_atual ?? 0}`;
      faseMap[fase] = (faseMap[fase] ?? 0) + 1;
    }

    const faturamento_total = (faturasRes.data ?? []).reduce(
      (sum, nf) => sum + (Number(nf.valor) || 0),
      0
    );

    res.json({
      total_processos: processosRes.count ?? processos.length,
      processos_por_fase: faseMap,
      total_pacientes: pacientesRes.count ?? 0,
      faturamento_total,
      glosas_pendentes: glosasRes.count ?? 0,
      d30_hoje: monitoramentosRes.count ?? 0,
      alertas: (glosasRes.count ?? 0) + (monitoramentosRes.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  try {
    const [processosRes, monitoramentosRes, glosasRes] = await Promise.all([
      supabase
        .from("processos")
        .select("id, status, fase_atual, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("monitoramentos")
        .select("id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("glosas")
        .select("id, motivo, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const activity = [
      ...(processosRes.data ?? []).map((p) => ({
        id: p.id,
        tipo: "processo",
        descricao: `Processo atualizado para Fase ${p.fase_atual} — ${p.status}`,
        usuario: null,
        created_at: p.created_at,
      })),
      ...(monitoramentosRes.data ?? []).map((m) => ({
        id: m.id,
        tipo: "monitoramento",
        descricao: `Monitoramento D30 registrado — ${m.status ?? "pendente"}`,
        usuario: null,
        created_at: m.created_at,
      })),
      ...(glosasRes.data ?? []).map((g) => ({
        id: g.id,
        tipo: "glosa",
        descricao: `Glosa: ${g.motivo ?? "sem motivo"} — ${g.status}`,
        usuario: null,
        created_at: g.created_at,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);

    res.json(activity);
  } catch (err) {
    req.log.error({ err }, "Failed to get activity");
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export default router;
