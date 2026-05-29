import { useState } from "react";
import { useListMonitoramentos } from "@workspace/api-client-react";
import { Activity, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  agendado: { icon: Clock, bg: "#1A1A2A", text: "#A5A5FF", label: "Agendado" },
  realizado: { icon: CheckCircle, bg: "#0F2A1A", text: "#A5FFD6", label: "Realizado" },
  perdido: { icon: XCircle, bg: "#2A0A0A", text: "#F87171", label: "Perdido" },
};

export default function Monitoramento() {
  const now = new Date();
  const [mes, setMes] = useState(format(now, "yyyy-MM"));

  const { data: monitoramentos, isLoading } = useListMonitoramentos({ mes });

  const today = format(now, "yyyy-MM-dd");
  const todayItems = (monitoramentos ?? []).filter(
    (m) => m.data_contato && m.data_contato.startsWith(today)
  );
  const pendentes = (monitoramentos ?? []).filter((m) => m.status === "agendado");

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
        <h1 className="text-lg font-bold" style={{ color: "#F0F0F4" }}>
          Monitoramento D30
        </h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#1B1B1E", border: "1px solid #2A2A2E" }}
        >
          <span style={{ color: "#9999A8", fontSize: 18, lineHeight: 1 }}>‹</span>
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={15} style={{ color: "#6B6B7A" }} />
          <span className="text-sm font-semibold capitalize" style={{ color: "#F0F0F4" }}>
            {mesLabel}
          </span>
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#1B1B1E", border: "1px solid #2A2A2E" }}
        >
          <span style={{ color: "#9999A8", fontSize: 18, lineHeight: 1 }}>›</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card-mobile p-3 text-center">
          <p className="text-xl font-bold" style={{ color: "#F56E0F" }}>
            {(monitoramentos ?? []).length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#6B6B7A" }}>
            Total
          </p>
        </div>
        <div className="card-mobile p-3 text-center">
          <p className="text-xl font-bold" style={{ color: "#A5FFD6" }}>
            {todayItems.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#6B6B7A" }}>
            Hoje
          </p>
        </div>
        <div className="card-mobile p-3 text-center">
          <p className="text-xl font-bold" style={{ color: "#FBBF24" }}>
            {pendentes.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#6B6B7A" }}>
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
          <Activity size={40} style={{ color: "#2A2A2E" }} />
          <p className="text-sm mt-3" style={{ color: "#4A4A52" }}>
            Nenhum monitoramento em {mesLabel}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#6B6B7A" }}>
            Registros
          </p>
          {monitoramentos.map((m) => {
            const sc = (m.status ? STATUS_CONFIG[m.status] : undefined) ?? STATUS_CONFIG["agendado"]!;
            const Icon = sc.icon;
            const isToday = m.data_contato?.startsWith(today);
            return (
              <div
                key={m.id}
                className="card-mobile px-4 py-3.5"
                style={isToday ? { borderColor: "#F56E0F33" } : {}}
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
                      <span
                        className="status-badge"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {sc.label}
                      </span>
                      {isToday && (
                        <span
                          className="status-badge"
                          style={{ background: "#2A1A0A", color: "#F56E0F" }}
                        >
                          Hoje
                        </span>
                      )}
                    </div>
                    {m.observacoes && (
                      <p className="text-sm" style={{ color: "#D0D0D8" }}>
                        {m.observacoes}
                      </p>
                    )}
                    {m.data_contato && (
                      <p className="text-[11px] mt-1" style={{ color: "#4A4A52" }}>
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
