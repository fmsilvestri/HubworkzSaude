import { useState } from "react";
import { useListProcessos } from "@workspace/api-client-react";
import { Search, ChevronRight, Circle } from "lucide-react";

const FASE_LABELS: Record<number, string> = {
  1: "Solicitação",
  2: "Aquisição",
  3: "Farmácia",
  4: "Faturamento",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ativo: { bg: "#0F2A1A", text: "#A5FFD6" },
  pendente: { bg: "#2A1F0A", text: "#FBBF24" },
  concluido: { bg: "#0A1A2A", text: "#60A5FA" },
  cancelado: { bg: "#2A0A0A", text: "#F87171" },
};

export default function Processos() {
  const [search, setSearch] = useState("");
  const [faseFilter, setFaseFilter] = useState<string>("todas");

  const { data: processos, isLoading } = useListProcessos({
    ...(faseFilter !== "todas" ? { fase: faseFilter } : {}),
  });

  const filtered = (processos ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      (p.numero_protocolo?.toLowerCase().includes(q) ?? false) ||
      (p.observacoes?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold" style={{ color: "#F0F0F4" }}>
          Processos
        </h1>
        <span
          className="status-badge"
          style={{ background: "#1B1B1E", color: "#9999A8", border: "1px solid #2A2A2E" }}
        >
          {filtered.length} itens
        </span>
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
        style={{ background: "#1B1B1E", border: "1px solid #2A2A2E" }}
      >
        <Search size={15} style={{ color: "#6B6B7A" }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar processo..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F0F0F4" }}
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
        {["todas", "1", "2", "3", "4"].map((f) => (
          <button
            key={f}
            onClick={() => setFaseFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all"
            style={
              faseFilter === f
                ? { background: "#F56E0F", color: "#fff" }
                : { background: "#1B1B1E", color: "#6B6B7A", border: "1px solid #2A2A2E" }
            }
          >
            {f === "todas" ? "Todas" : `Fase ${f}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-mobile h-20 animate-pulse" style={{ opacity: 0.4 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Circle size={40} style={{ color: "#2A2A2E" }} />
          <p className="text-sm mt-3" style={{ color: "#4A4A52" }}>
            Nenhum processo encontrado
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
            const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS["pendente"];
            return (
              <div key={p.id} className="card-mobile px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="status-badge"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {p.status}
                      </span>
                      <span
                        className="status-badge"
                        style={{ background: "#1B1B2A", color: "#A5A5FF" }}
                      >
                        Fase {p.fase_atual} — {FASE_LABELS[p.fase_atual] ?? ""}
                      </span>
                    </div>
                    {p.numero_protocolo && (
                      <p className="text-sm font-semibold truncate" style={{ color: "#F0F0F4" }}>
                        #{p.numero_protocolo}
                      </p>
                    )}
                    {p.observacoes && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#6B6B7A" }}>
                        {p.observacoes}
                      </p>
                    )}
                    <p className="text-[11px] mt-1.5" style={{ color: "#4A4A52" }}>
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "#3A3A42", flexShrink: 0, marginTop: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
