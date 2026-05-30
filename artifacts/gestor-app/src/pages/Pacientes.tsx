import { useState } from "react";
import { useListPacientes } from "@workspace/api-client-react";
import { useTheme } from "@/hooks/useTheme";
import { CONVENIO_BADGE, MANDATO_BADGE, AVATAR_COLORS } from "@/lib/status-colors";
import { Search, User, Phone, ChevronRight } from "lucide-react";

export default function Pacientes() {
  const { theme } = useTheme();
  const convenioBadge = CONVENIO_BADGE[theme];
  const mandatoBadge = MANDATO_BADGE[theme];
  const avatarColors = AVATAR_COLORS[theme];

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: pacientes, isLoading } = useListPacientes(
    debouncedSearch ? { search: debouncedSearch } : {}
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold" style={{ color: "var(--t-text-1)" }}>
          Pacientes
        </h1>
        <span
          className="status-badge"
          style={{
            background: "var(--t-surface)",
            color: "var(--t-text-3)",
            border: "1px solid var(--t-border)",
          }}
        >
          {(pacientes ?? []).length} registros
        </span>
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <Search size={15} style={{ color: "var(--t-text-4)" }} />
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Nome ou CPF..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--t-text-1)" }}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-mobile h-20 animate-pulse" style={{ opacity: 0.4 }} />
          ))}
        </div>
      ) : !pacientes || pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <User size={40} style={{ color: "var(--t-empty)" }} />
          <p className="text-sm mt-3" style={{ color: "var(--t-text-5)" }}>
            {debouncedSearch ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pacientes.map((p) => (
            <div key={p.id} className="card-mobile px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: avatarColors.bg, color: avatarColors.text }}
                >
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--t-text-1)" }}>
                    {p.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.convenio && (
                      <span
                        className="status-badge"
                        style={{ background: convenioBadge.bg, color: convenioBadge.text }}
                      >
                        {p.convenio}
                      </span>
                    )}
                    {p.diagnostico && (
                      <span className="text-[11px] truncate" style={{ color: "var(--t-text-4)" }}>
                        {p.diagnostico}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {p.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone size={11} style={{ color: "var(--t-text-5)" }} />
                        <span className="text-[11px]" style={{ color: "var(--t-text-5)" }}>
                          {p.telefone}
                        </span>
                      </div>
                    )}
                    {p.mandato_ativo && (
                      <span
                        className="status-badge"
                        style={{ background: mandatoBadge.bg, color: mandatoBadge.text }}
                      >
                        Mandato ativo
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--t-text-6)", flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
