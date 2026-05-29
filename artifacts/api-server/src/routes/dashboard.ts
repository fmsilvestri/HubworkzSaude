import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  try {
    const [processosRes, pacientesRes, faturasRes, glosasRes, monitoramentosRes] = await Promise.all([
      // Select both 'fase' (existing) and 'fase_atual' (post-migration alias)
      supabase.from("processos").select("*", { count: "exact" }),
      supabase.from("pacientes").select("id", { count: "exact" }),
      // Use nf_status (existing) — after migration, status alias also exists
      supabase.from("notas_fiscais").select("valor,nf_status").eq("nf_status", "emitida"),
      supabase.from("glosas").select("id", { count: "exact" }).in("status", ["aberta","pendente","em_analise"]),
      supabase.from("monitoramentos").select("id", { count: "exact" }).gte(
        "data_contato",
        new Date().toISOString().split("T")[0]
      ),
    ]);

    const processos = processosRes.data ?? [];
    const faseMap: Record<string, number> = {};
    for (const p of processos) {
      const row = p as Record<string, unknown>;
      const faseNum = row.fase_atual ?? row.fase ?? 0;
      const fase = `fase_${faseNum}`;
      faseMap[fase] = (faseMap[fase] ?? 0) + 1;
    }

    const faturamento_total = (faturasRes.data ?? []).reduce(
      (sum, nf) => {
        const row = nf as Record<string, unknown>;
        return sum + (Number(row.valor_total ?? row.valor) || 0);
      },
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
        .select("id, status, fase, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("monitoramentos")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("glosas")
        .select("id, motivo, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const activity = [
      ...(processosRes.data ?? []).map((p) => {
        const row = p as Record<string, unknown>;
        const faseNum = row.fase_atual ?? row.fase ?? 1;
        return {
          id: row.id,
          tipo: "processo",
          descricao: `Processo atualizado para Fase ${faseNum} — ${row.status}`,
          usuario: null,
          created_at: row.created_at,
        };
      }),
      ...(monitoramentosRes.data ?? []).map((m) => {
        const row = m as Record<string, unknown>;
        return {
          id: row.id,
          tipo: "monitoramento",
          descricao: `Monitoramento D30 registrado`,
          usuario: null,
          created_at: row.created_at,
        };
      }),
      ...(glosasRes.data ?? []).map((g) => {
        const row = g as Record<string, unknown>;
        return {
          id: row.id,
          tipo: "glosa",
          descricao: `Glosa: ${row.motivo ?? "sem motivo"} — ${row.status}`,
          usuario: null,
          created_at: row.created_at,
        };
      }),
    ]
      .sort(
        (a, b) =>
          new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()
      )
      .slice(0, 10);

    res.json(activity);
  } catch (err) {
    req.log.error({ err }, "Failed to get activity");
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export default router;
