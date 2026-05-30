import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Thermometer, Wind, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import eloData from "@/data/elosaude.json";

type Item = {
  descricao: string;
  principio_ativo: string;
  conservacao: string;
  laboratorio: string;
  codigo_tuss: string;
  ean: string;
  valor_contrato: string;
  marca_lab: string;
  valor: string;
};

const data = eloData as Item[];

const CONSERVACAO_STYLE: Record<string, string> = {
  AMBIENTE: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  REFRIGERADO: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  PRECAUCAO: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

const CONSERVACAO_ICON: Record<string, React.ReactNode> = {
  AMBIENTE: <Wind className="h-3 w-3" />,
  REFRIGERADO: <Thermometer className="h-3 w-3" />,
  PRECAUCAO: <FlaskConical className="h-3 w-3" />,
};

const labs = ["__all__", ...Array.from(new Set(data.map((d) => d.laboratorio))).sort()];
const conservacoes = ["__all__", "AMBIENTE", "REFRIGERADO", "PRECAUCAO"];

export default function EloSaude() {
  const [search, setSearch] = useState("");
  const [labFiltro, setLabFiltro] = useState("__all__");
  const [conservFiltro, setConservFiltro] = useState("__all__");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((item) => {
      const matchSearch =
        !q ||
        item.descricao.toLowerCase().includes(q) ||
        item.principio_ativo.toLowerCase().includes(q) ||
        item.laboratorio.toLowerCase().includes(q) ||
        item.codigo_tuss.includes(q) ||
        item.ean.includes(q);
      const matchLab = labFiltro === "__all__" || item.laboratorio === labFiltro;
      const matchConserv = conservFiltro === "__all__" || item.conservacao === conservFiltro;
      return matchSearch && matchLab && matchConserv;
    });
  }, [search, labFiltro, conservFiltro]);

  const totalRefrigerado = data.filter((d) => d.conservacao === "REFRIGERADO").length;
  const totalAmbiente = data.filter((d) => d.conservacao === "AMBIENTE").length;
  const comValorUsd = data.filter((d) => d.valor && d.valor.includes("USD")).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Elo Saude Importados</h1>
          <p className="text-white/50 text-sm mt-1">
            Tabela de medicamentos importados — contrato Elo Saude ({data.length} itens)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Itens", value: data.length, color: "text-white" },
          { label: "Temperatura Ambiente", value: totalAmbiente, color: "text-blue-400" },
          { label: "Refrigerados", value: totalRefrigerado, color: "text-cyan-400" },
          { label: "Com Valor USD", value: comValorUsd, color: "text-[#F56E0F]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            placeholder="Buscar por descrição, princípio ativo, TUSS, EAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <Select value={conservFiltro} onValueChange={setConservFiltro}>
          <SelectTrigger className="bg-[#1B1B1E] border-white/10 text-white w-44">
            <SelectValue placeholder="Conservação" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10">
            <SelectItem value="__all__">Todas conservações</SelectItem>
            {conservacoes.filter((c) => c !== "__all__").map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={labFiltro} onValueChange={setLabFiltro}>
          <SelectTrigger className="bg-[#1B1B1E] border-white/10 text-white w-52">
            <SelectValue placeholder="Laboratório" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B1B1E] border-white/10 max-h-72 overflow-y-auto">
            <SelectItem value="__all__">Todos os laboratórios</SelectItem>
            {labs.filter((l) => l !== "__all__").map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || labFiltro !== "__all__" || conservFiltro !== "__all__") && (
          <span className="text-white/40 text-sm">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1.5fr_auto_1fr_auto_auto_1fr_1fr] gap-0 text-xs text-white/40 uppercase tracking-wider px-4 py-3 border-b border-white/5">
          <span>Descrição</span>
          <span>Princípio Ativo</span>
          <span className="w-28">Conservação</span>
          <span>Laboratório</span>
          <span className="w-28 text-right">Cód. TUSS</span>
          <span className="w-36 text-right">EAN</span>
          <span className="text-right pr-2">Valor Contrato</span>
          <span className="text-right">Valor / Marca</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhum item encontrado para esta busca</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_1.5fr_auto_1fr_auto_auto_1fr_1fr] gap-0 items-start px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="pr-3">
                  <p className="text-white text-sm font-medium leading-snug">{item.descricao}</p>
                </div>

                <div className="pr-3">
                  <p className="text-white/60 text-xs leading-snug">{item.principio_ativo || "—"}</p>
                </div>

                <div className="w-28 pt-0.5">
                  <Badge className={cn("border text-[10px] gap-1 px-1.5 py-0.5", CONSERVACAO_STYLE[item.conservacao] ?? "bg-white/10 text-white/40 border-white/10")}>
                    {CONSERVACAO_ICON[item.conservacao]}
                    {item.conservacao}
                  </Badge>
                </div>

                <div className="pr-3">
                  <p className="text-white/60 text-xs">{item.laboratorio || "—"}</p>
                </div>

                <div className="w-28 text-right">
                  <p className="text-white/40 text-xs font-mono">{item.codigo_tuss || "—"}</p>
                </div>

                <div className="w-36 text-right">
                  <p className="text-white/30 text-xs font-mono">{item.ean || "—"}</p>
                </div>

                <div className="pr-2 text-right">
                  <p className="text-[#A5FFD6] text-sm font-semibold">{item.valor_contrato || "—"}</p>
                </div>

                <div className="text-right">
                  {item.valor && item.valor.includes("USD") ? (
                    <div>
                      <p className="text-[#F56E0F] text-xs font-semibold">{item.valor}</p>
                      {item.marca_lab && <p className="text-white/30 text-[10px] mt-0.5 leading-snug">{item.marca_lab}</p>}
                    </div>
                  ) : item.marca_lab ? (
                    <p className="text-white/30 text-[10px] leading-snug">{item.marca_lab}</p>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-white/20 text-xs text-center">
        Fonte: planilha ELOSAUDE IMPORTADOS — {data.length} itens cadastrados
      </p>
    </div>
  );
}
