import { useGetDashboardStats, useGetDashboardActivity, useGetProcessoFaseStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Users, DollarSign, AlertTriangle, CalendarDays, TrendingUp, Clock, FileText } from "lucide-react";

function StatCard({ title, value, icon: Icon, color, loading }: {
  title: string; value: string | number; icon: any; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6 flex items-center gap-5">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-white/50 text-sm font-medium">{title}</p>
        {loading ? (
          <Skeleton className="h-7 w-20 mt-1 bg-white/10" />
        ) : (
          <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: fases, isLoading: fasesLoading } = useGetProcessoFaseStats();

  const faseColors: Record<string, string> = {
    "Fase 1": "bg-blue-500/20 text-blue-400",
    "Fase 2": "bg-yellow-500/20 text-yellow-400",
    "Fase 3": "bg-purple-500/20 text-purple-400",
    "Fase 4": "bg-green-500/20 text-green-400",
  };

  const activityTypeIcon: Record<string, string> = {
    processo: "bg-blue-500/20",
    monitoramento: "bg-purple-500/20",
    glosa: "bg-red-500/20",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">Visão geral do sistema HubWorkz Saúde</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total de Processos" value={stats?.total_processos ?? 0} icon={FileText} color="bg-[#F56E0F]/15 text-[#F56E0F]" loading={statsLoading} />
        <StatCard title="Pacientes Ativos" value={stats?.total_pacientes ?? 0} icon={Users} color="bg-blue-500/15 text-blue-400" loading={statsLoading} />
        <StatCard title="Faturamento Total" value={stats ? `R$ ${Number(stats.faturamento_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"} icon={DollarSign} color="bg-green-500/15 text-green-400" loading={statsLoading} />
        <StatCard title="Alertas Ativos" value={stats?.alertas ?? 0} icon={AlertTriangle} color="bg-red-500/15 text-red-400" loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processos por Fase */}
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-[#F56E0F]" />
            <h3 className="text-white font-semibold">Processos por Fase</h3>
          </div>
          {fasesLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8 bg-white/10" />)}</div>
          ) : (
            <div className="space-y-3">
              {(fases ?? []).length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">Nenhum processo cadastrado</p>
              ) : (
                (fases ?? []).map((f) => (
                  <div key={f.fase} className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${faseColors[f.fase] ?? "bg-white/10 text-white/70"}`}>{f.fase}</span>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5">
                        <div className="bg-[#F56E0F] h-1.5 rounded-full" style={{ width: `${Math.min(100, (f.count / (stats?.total_processos || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-white font-bold text-sm w-6 text-right">{f.count}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* D30 e Glosas */}
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-[#F56E0F]" />
            <h3 className="text-white font-semibold">Status Crítico</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div>
                <p className="text-white/50 text-xs">Monitoramentos D30 Hoje</p>
                <p className="text-white text-xl font-bold">{statsLoading ? "—" : stats?.d30_hoje ?? 0}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-purple-400" />
            </div>
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div>
                <p className="text-white/50 text-xs">Glosas Pendentes</p>
                <p className="text-white text-xl font-bold">{statsLoading ? "—" : stats?.glosas_pendentes ?? 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Di IA Card */}
        <div className="bg-[rgba(63,52,137,0.25)] border border-[#3C3489]/50 rounded-[14px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#A5FFD6]" />
            <h3 className="text-[#A5FFD6] font-semibold">Di IA — Assistente</h3>
          </div>
          <p className="text-white/60 text-sm mb-5 leading-relaxed">
            Sua assistente de inteligência artificial para análise de processos oncológicos, cotações e monitoramento clínico.
          </p>
          <div className="space-y-2">
            {["Analisar processos pendentes", "Comparar cotações", "Alertas D30 críticos", "Relatório de glosas"].map((s) => (
              <a key={s} href="/di-ia" className="flex items-center gap-2 text-sm text-white/70 hover:text-[#A5FFD6] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#3C3489]/30 cursor-pointer group">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A5FFD6] group-hover:scale-125 transition-transform" />
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="h-4 w-4 text-[#F56E0F]" />
          <h3 className="text-white font-semibold">Atividade Recente</h3>
        </div>
        {activityLoading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 bg-white/10" />)}</div>
        ) : (
          <div className="space-y-2">
            {(activity ?? []).length === 0 ? (
              <p className="text-white/30 text-sm text-center py-6">Nenhuma atividade registrada</p>
            ) : (
              (activity ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/5 transition-colors">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${activityTypeIcon[item.tipo] ?? "bg-white/20"} border border-white/20`} />
                  <p className="text-white/70 text-sm flex-1">{item.descricao}</p>
                  <span className="text-white/30 text-xs shrink-0">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
