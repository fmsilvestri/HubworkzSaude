import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { signOut } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { LogOut, TrendingUp, Users, FileText, AlertTriangle, Activity, Bell, Sun, Moon } from "lucide-react";

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="card-mobile p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--t-text-4)" }}>
          {label}
        </span>
        <Icon size={16} style={{ color }} />
      </div>
      <span className="text-2xl font-bold" style={{ color: "var(--t-text-1)" }}>
        {value}
      </span>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity } = useGetDashboardActivity();

  const nome = user?.user_metadata?.["nome"] ?? user?.email?.split("@")[0] ?? "Gestor";

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs" style={{ color: "var(--t-text-4)" }}>
            Bom dia,
          </p>
          <h1 className="text-lg font-bold capitalize" style={{ color: "var(--t-text-1)" }}>
            {nome}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle de tema */}
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          >
            {theme === "dark"
              ? <Sun size={15} style={{ color: "#FBBF24" }} />
              : <Moon size={15} style={{ color: "var(--t-text-4)" }} />
            }
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <Bell size={15} style={{ color: "var(--t-text-4)" }} />
          </button>
          <button
            onClick={() => signOut()}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <LogOut size={15} style={{ color: "var(--t-text-4)" }} />
          </button>
        </div>
      </div>

      {statsLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-mobile h-20 animate-pulse" style={{ opacity: 0.4 }} />
          ))}
        </div>
      ) : stats ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Processos" value={stats.total_processos} color="#F56E0F" icon={FileText} />
            <StatCard label="Pacientes" value={stats.total_pacientes} color="#3C3489" icon={Users} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Faturamento"
              value={formatCurrency(stats.faturamento_total)}
              color="#A5FFD6"
              icon={TrendingUp}
            />
            <StatCard label="Glosas" value={stats.glosas_pendentes} color="#F87171" icon={AlertTriangle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="D30 Hoje" value={stats.d30_hoje} color="#60A5FA" icon={Activity} />
            <StatCard label="Alertas" value={stats.alertas} color="#FBBF24" icon={Bell} />
          </div>

          <div className="mb-2 mt-2">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--t-text-4)" }}>
              Fases dos Processos
            </p>
            <div className="card-mobile p-4 flex flex-col gap-3">
              {Object.entries(stats.processos_por_fase ?? {}).map(([fase, count]) => {
                const pct = stats.total_processos > 0
                  ? Math.round(((count as number) / stats.total_processos) * 100)
                  : 0;
                const colors = ["#F56E0F", "#3C3489", "#A5FFD6", "#60A5FA"];
                const ci = parseInt(fase) - 1;
                const barColor = colors[ci % colors.length];
                return (
                  <div key={fase}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--t-text-3)" }}>
                        Fase {fase}
                      </span>
                      <span className="text-xs font-bold" style={{ color: "var(--t-text-1)" }}>
                        {count as number}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--t-border)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {activity && activity.length > 0 && (
        <div className="mt-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--t-text-4)" }}>
            Atividade Recente
          </p>
          <div className="flex flex-col gap-2">
            {activity.slice(0, 5).map((item) => (
              <div key={item.id} className="card-mobile px-4 py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#F56E0F" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--t-text-2)" }}>
                    {item.descricao}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--t-text-5)" }}>
                    {new Date(item.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
