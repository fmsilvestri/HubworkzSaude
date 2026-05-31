import { useGetDashboardStats, useGetDashboardActivity, useGetProcessoFaseStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import {
  Activity, Users, DollarSign, AlertTriangle, CalendarDays,
  TrendingUp, Clock, FileText, ArrowRight, Zap, Package,
  BarChart2, ChevronRight,
} from "lucide-react";

// ─── 3D Stat Card ─────────────────────────────────────────────────────────────

function StatCard3D({
  title, value, icon: Icon, gradient, glow, href, loading,
}: {
  title: string; value: string | number; icon: any;
  gradient: string; glow: string; href: string; loading?: boolean;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="group relative text-left w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 focus:outline-none"
      style={{
        background: gradient,
        boxShadow: `0 8px 32px ${glow}, 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />

      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.25)" }} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 bg-white/20 mt-1" />
        ) : (
          <p className="text-white text-3xl font-extrabold leading-none" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {value}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(145deg, #1E1E24 0%, #18181C 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Phase bar colors ──────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<string, { bar: string; badge: string; label: string }> = {
  "Fase 1": { bar: "from-blue-500 to-blue-400", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", label: "Cotacao" },
  "Fase 2": { bar: "from-amber-500 to-yellow-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "Logistica" },
  "Fase 3": { bar: "from-purple-500 to-violet-400", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", label: "Monitoramento" },
  "Fase 4": { bar: "from-emerald-500 to-green-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "Faturamento" },
};

// ─── Activity type dot ────────────────────────────────────────────────────────

const ACTIVITY_COLOR: Record<string, string> = {
  processo: "#3B82F6",
  monitoramento: "#A855F7",
  glosa: "#EF4444",
  cotacao: "#F59E0B",
  faturamento: "#10B981",
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: fases, isLoading: fasesLoading } = useGetProcessoFaseStats();

  const faturamento = stats ? Number(stats.faturamento_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Visao geral do HubWorkz Saude</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
          <div className="h-1.5 w-1.5 rounded-full bg-[#A5FFD6] animate-pulse" />
          Dados em tempo real
        </div>
      </div>

      {/* ── Top 4 KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard3D
          title="Processos"
          value={statsLoading ? "—" : stats?.total_processos ?? 0}
          icon={FileText}
          gradient="linear-gradient(135deg, #F56E0F 0%, #C84F00 100%)"
          glow="rgba(245,110,15,0.35)"
          href="/processos"
          loading={statsLoading}
        />
        <StatCard3D
          title="Pacientes Ativos"
          value={statsLoading ? "—" : stats?.total_pacientes ?? 0}
          icon={Users}
          gradient="linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
          glow="rgba(59,130,246,0.35)"
          href="/pacientes"
          loading={statsLoading}
        />
        <StatCard3D
          title="Faturamento"
          value={statsLoading ? "—" : `R$ ${faturamento}`}
          icon={DollarSign}
          gradient="linear-gradient(135deg, #10B981 0%, #047857 100%)"
          glow="rgba(16,185,129,0.35)"
          href="/faturamento"
          loading={statsLoading}
        />
        <StatCard3D
          title="Alertas Ativos"
          value={statsLoading ? "—" : stats?.alertas ?? 0}
          icon={AlertTriangle}
          gradient="linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)"
          glow="rgba(239,68,68,0.35)"
          href="/glosas"
          loading={statsLoading}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Processos por Fase */}
        <SectionCard>
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#F56E0F]/15">
                  <TrendingUp className="h-4 w-4 text-[#F56E0F]" />
                </div>
                <h3 className="text-white font-semibold text-sm">Processos por Fase</h3>
              </div>
              <button
                onClick={() => navigate("/processos")}
                className="text-[10px] text-[#F56E0F]/60 hover:text-[#F56E0F] flex items-center gap-0.5 transition-colors"
              >
                Ver todos <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {fasesLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-9 bg-white/5 rounded-xl" />)}</div>
            ) : (fases ?? []).length === 0 ? (
              <p className="text-white/25 text-sm text-center py-6">Nenhum processo cadastrado</p>
            ) : (
              <div className="space-y-2.5">
                {(fases ?? []).map((f) => {
                  const cfg = PHASE_CONFIG[f.fase] ?? { bar: "from-white/30 to-white/20", badge: "bg-white/10 text-white/60 border-white/20", label: f.fase };
                  const pct = Math.min(100, (f.count / (stats?.total_processos || 1)) * 100);
                  return (
                    <button
                      key={f.fase}
                      onClick={() => navigate("/processos")}
                      className="w-full group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border shrink-0 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-white font-extrabold text-sm w-5 text-right shrink-0">{f.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Status Crítico */}
        <SectionCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-red-500/15">
                <Zap className="h-4 w-4 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-sm">Status Critico</h3>
            </div>
            <div className="space-y-3">
              {/* D30 */}
              <button
                onClick={() => navigate("/monitoramento")}
                className="group w-full text-left relative overflow-hidden rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(109,40,217,0.1) 100%)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  boxShadow: "0 4px 16px rgba(168,85,247,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300/70 text-xs font-medium uppercase tracking-wider">Monitoramentos D30 Hoje</p>
                    <p className="text-white text-2xl font-extrabold mt-1" style={{ textShadow: "0 2px 8px rgba(168,85,247,0.4)" }}>
                      {statsLoading ? "—" : stats?.d30_hoje ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(168,85,247,0.15)" }}>
                    <CalendarDays className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-purple-300/50 text-[10px] group-hover:text-purple-300/80 transition-colors">
                  Ver monitoramentos <ArrowRight className="h-3 w-3" />
                </div>
              </button>

              {/* Glosas */}
              <button
                onClick={() => navigate("/glosas")}
                className="group w-full text-left relative overflow-hidden rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(185,28,28,0.1) 100%)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  boxShadow: "0 4px 16px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300/70 text-xs font-medium uppercase tracking-wider">Glosas Pendentes</p>
                    <p className="text-white text-2xl font-extrabold mt-1" style={{ textShadow: "0 2px 8px rgba(239,68,68,0.4)" }}>
                      {statsLoading ? "—" : stats?.glosas_pendentes ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.15)" }}>
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-red-300/50 text-[10px] group-hover:text-red-300/80 transition-colors">
                  Ver glosas <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Di IA */}
        <div
          className="rounded-2xl overflow-hidden relative cursor-pointer group transition-all duration-300 hover:scale-[1.01]"
          onClick={() => navigate("/di-ia")}
          style={{
            background: "linear-gradient(145deg, rgba(60,52,137,0.6) 0%, rgba(30,26,80,0.8) 50%, rgba(15,15,18,0.9) 100%)",
            boxShadow: "0 8px 32px rgba(60,52,137,0.3), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(165,255,214,0.1)",
            border: "1px solid rgba(60,52,137,0.5)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl"
            style={{ background: "#A5FFD6", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-15 blur-2xl"
            style={{ background: "#3C3489", transform: "translate(-20%, 20%)" }} />

          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative shrink-0">
                <img src="/di-avatar.png" alt="Di" className="h-12 w-12 rounded-xl object-cover object-top"
                  style={{ border: "2px solid rgba(165,255,214,0.3)", boxShadow: "0 4px 16px rgba(60,52,137,0.6)" }} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#A5FFD6] border-2 border-[#0F0F12] animate-pulse" />
              </div>
              <div>
                <h3 className="text-[#A5FFD6] font-bold text-sm">Di IA</h3>
                <p className="text-white/40 text-[11px]">Assistente Farmaceutica</p>
              </div>
              <Activity className="h-4 w-4 text-[#A5FFD6]/50 ml-auto animate-pulse" />
            </div>

            <p className="text-white/50 text-xs leading-relaxed mb-4">
              Assistente especializada em intermediacao farmaceutica oncologica. Clique para consultar dados de qualquer modulo.
            </p>

            <div className="space-y-1.5">
              {[
                { label: "Analisar processos pendentes", color: "#F56E0F" },
                { label: "Comparar cotacoes", color: "#3B82F6" },
                { label: "Alertas D30 criticos", color: "#A855F7" },
                { label: "Relatorio de glosas", color: "#EF4444" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs text-white/50 group-hover:text-white/70 py-1 px-2 rounded-lg transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                  {s.label}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[#A5FFD6]/60 text-xs group-hover:text-[#A5FFD6] transition-colors">
              <BarChart2 className="h-3.5 w-3.5" />
              Abrir Di IA <ArrowRight className="h-3 w-3 ml-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick access module strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Cotacoes", href: "/cotacoes", gradient: "linear-gradient(135deg,rgba(245,158,11,0.25),rgba(120,53,15,0.15))", border: "rgba(245,158,11,0.3)", icon: Package, text: "#F59E0B" },
          { label: "Mandatos", href: "/mandatos", gradient: "linear-gradient(135deg,rgba(59,130,246,0.25),rgba(29,78,216,0.15))", border: "rgba(59,130,246,0.3)", icon: FileText, text: "#3B82F6" },
          { label: "Remessas", href: "/rastreio", gradient: "linear-gradient(135deg,rgba(16,185,129,0.25),rgba(4,120,87,0.15))", border: "rgba(16,185,129,0.3)", icon: Activity, text: "#10B981" },
          { label: "Glosas", href: "/glosas", gradient: "linear-gradient(135deg,rgba(239,68,68,0.25),rgba(185,28,28,0.15))", border: "rgba(239,68,68,0.3)", icon: AlertTriangle, text: "#EF4444" },
          { label: "Medicamentos", href: "/medicamentos", gradient: "linear-gradient(135deg,rgba(168,85,247,0.25),rgba(109,40,217,0.15))", border: "rgba(168,85,247,0.3)", icon: Zap, text: "#A855F7" },
          { label: "Relatorios", href: "/di-ia", gradient: "linear-gradient(135deg,rgba(165,255,214,0.15),rgba(60,52,137,0.15))", border: "rgba(165,255,214,0.25)", icon: BarChart2, text: "#A5FFD6" },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => navigate(m.href)}
            className="group flex flex-col items-center gap-2 p-3.5 rounded-xl transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
            style={{ background: m.gradient, border: `1px solid ${m.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
          >
            <div className="p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
              <m.icon className="h-4 w-4" style={{ color: m.text }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: m.text }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Atividade Recente ── */}
      <SectionCard>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#F56E0F]/15">
                <Clock className="h-4 w-4 text-[#F56E0F]" />
              </div>
              <h3 className="text-white font-semibold text-sm">Atividade Recente</h3>
            </div>
          </div>
          {activityLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 bg-white/5 rounded-xl" />)}</div>
          ) : (activity ?? []).length === 0 ? (
            <p className="text-white/25 text-sm text-center py-8">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-1">
              {(activity ?? []).map((item) => {
                const dotColor = ACTIVITY_COLOR[item.tipo] ?? "rgba(255,255,255,0.2)";
                const href = item.tipo === "processo" ? "/processos" : item.tipo === "glosa" ? "/glosas" : item.tipo === "monitoramento" ? "/monitoramento" : item.tipo === "cotacao" ? "/cotacoes" : "/faturamento";
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(href)}
                    className="group w-full flex items-center gap-4 py-3 px-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="relative shrink-0">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                    </div>
                    <p className="text-white/60 text-sm flex-1 group-hover:text-white/80 transition-colors leading-snug">{item.descricao}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-white/25 text-xs">
                        {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
