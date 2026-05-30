import { useState } from "react";
import { useListMonitoramentos } from "@workspace/api-client-react";
import { useTheme } from "@/hooks/useTheme";
import { MONITOR_STATUS } from "@/lib/status-colors";
import { Activity, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_ICONS: Record<string, React.ElementType> = {
  agendado:  Clock,
  realizado: CheckCircle,
  perdido:   XCircle,
};

export default function Monitoramento() {
  const { theme } = useTheme();
  const statusColors = MONITOR_STATUS[theme];

  const now = new Date();
  const [mes, setMes] = useState(format(now, "yyyy-MM"));

  const { data: monitoramentos, isLoading } = useListMonitoramentos({ mes });

  const today = format(now, "yyyy-MM-dd");
  const todayItems = (monitoramentos ?? []).filter((m) => m.data_contato?.startsWith(today));
  const pendentes  = (monitoramentos ?? []).filter((m) => m.status === "agendado");

  function prevMonth() {
    const d = new Date(mes + "-01");
    d.setMonth(d.getMonth() - 1);
    setMes(format(d, "yyyy-MM"));
  }
  function nextMonth() {
    const d = new Date(mes + "-01");
    d.setMonth(d.getMonth() + 1);
    setMes(format(d, "yyyy-MM"));
  }

  const mesLabel = format(new Date(mes + "-15"), "MMMM yyyy", { locale: ptBR });

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold" style={{ color: "var(--t-text-1)" }}>
          Monitoramento D30
        </h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <span style={{ color: "var(--t-text-3)", fontSize: 18, lineHeight: 1 }}>‹</span>
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={15} style={{ color: "var(--t-text-4)" }} />
          <span className="text-sm font-semibold capitalize" style={{ color: "var(--t-text-1)" }}>
            {mesLabel}
          </span>
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <span style={{ color: "var(--t-text-3)", fontSize: 18, lineHeight: 1 }}>›</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card-mobile p-3 text-center">
          <p className="text-xl font-bold" style={{ color: "#F56E0F" }}>
            {(monitoramentos ?? []).length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--t-text-4)" }}>
            Total
          </p>
        </div>
        <div className="card-mobile p-3 text-center">
          <p className="text-xl font-bold" style={{ color: "#A5FFD6" }}>
            {todayItems.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--t-text-4)" }}>
            Hoje
          </p>
        </div>
        <div className="card-mobile p-3 text-center">
          <p className="text-xl font-bold" style={{ color: "#FBBF24" }}>
            {pendentes.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--t-text-4)" }}>
            Pendentes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-mobile h-20 animate-pulse" style={{ opacity: 0.4 }} />
          ))}
        </div>
      ) : !monitoramentos || monitoramentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Activity size={40} style={{ color: "var(--t-empty)" }} />
          <p className="text-sm mt-3" style={{ color: "var(--t-text-5)" }}>
            Nenhum monitoramento em {mesLabel}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--t-text-4)" }}>
            Registros
          </p>
          {monitoramentos.map((m) => {
            const key = m.status ?? "agendado";
            const sc = statusColors[key] ?? statusColors["agendado"]!;
            const Icon = STATUS_ICONS[key] ?? Clock;
            const isToday = m.data_contato?.startsWith(today);
            return (
              <div
                key={m.id}
                className="card-mobile px-4 py-3.5"
                style={isToday ? { borderColor: "#F56E0F55" } : {}}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: sc.bg }}
                  >
                    <Icon size={14} style={{ color: sc.text }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="status-badge" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                      {isToday && (
                        <span
                          className="status-badge"
                          style={
                            theme === "dark"
                              ? { background: "#2A1A0A", color: "#F56E0F" }
                              : { background: "#FFF7ED", color: "#EA580C" }
                          }
                        >
                          Hoje
                        </span>
                      )}
                    </div>
                    {m.observacoes && (
                      <p className="text-sm" style={{ color: "var(--t-text-2)" }}>
                        {m.observacoes}
                      </p>
                    )}
                    {m.data_contato && (
                      <p className="text-[11px] mt-1" style={{ color: "var(--t-text-5)" }}>
                        {new Date(m.data_contato).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
