import { useState } from "react";
import { useListPacientes } from "@workspace/api-client-react";
import { Search, User, Phone, ChevronRight } from "lucide-react";

export default function Pacientes() {
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
        <h1 className="text-lg font-bold" style={{ color: "#F0F0F4" }}>
          Pacientes
        </h1>
        <span
          className="status-badge"
          style={{ background: "#1B1B1E", color: "#9999A8", border: "1px solid #2A2A2E" }}
        >
          {(pacientes ?? []).length} registros
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
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Nome ou CPF..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F0F0F4" }}
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
          <User size={40} style={{ color: "#2A2A2E" }} />
          <p className="text-sm mt-3" style={{ color: "#4A4A52" }}>
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
                  style={{ background: "#2A1A0A", color: "#F56E0F" }}
                >
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#F0F0F4" }}>
                    {p.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.convenio && (
                      <span
                        className="status-badge"
                        style={{ background: "#0A1A2A", color: "#60A5FA" }}
                      >
                        {p.convenio}
                      </span>
                    )}
                    {p.diagnostico && (
                      <span className="text-[11px] truncate" style={{ color: "#6B6B7A" }}>
                        {p.diagnostico}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {p.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone size={11} style={{ color: "#4A4A52" }} />
                        <span className="text-[11px]" style={{ color: "#4A4A52" }}>
                          {p.telefone}
                        </span>
                      </div>
                    )}
                    {p.mandato_ativo && (
                      <span
                        className="status-badge"
                        style={{ background: "#0F2A1A", color: "#A5FFD6" }}
                      >
                        Mandato ativo
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "#3A3A42", flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
