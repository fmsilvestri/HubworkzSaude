import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBadge, Plus, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_DECLARACOES = [
  { id: "1", paciente: "Paciente A", modalidade: "Registro ANVISA", status: "assinada", data: "2025-03-10" },
  { id: "2", paciente: "Paciente B", modalidade: "Uso Compassivo", status: "pendente", data: "2025-04-01" },
  { id: "3", paciente: "Paciente C", modalidade: "Registro ANVISA", status: "assinada", data: "2025-02-20" },
  { id: "4", paciente: "Paciente D", modalidade: "Uso Compassivo", status: "pendente", data: "2025-05-15" },
];

export default function Declaracoes() {
  const anvisa = MOCK_DECLARACOES.filter((d) => d.modalidade === "Registro ANVISA");
  const compassivo = MOCK_DECLARACOES.filter((d) => d.modalidade === "Uso Compassivo");

  const Section = ({ title, items }: { title: string; items: typeof MOCK_DECLARACOES }) => (
    <div>
      <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-3">{title}</h3>
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        {items.map((d) => (
          <div key={d.id} data-testid={`row-declaracao-${d.id}`} className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
            <div>
              <p className="text-white font-medium text-sm">{d.paciente}</p>
              <p className="text-white/40 text-xs mt-0.5">{d.modalidade} — {new Date(d.data).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={cn("border text-xs gap-1",
                d.status === "assinada"
                  ? "bg-green-500/15 text-green-400 border-green-500/20"
                  : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
              )}>
                {d.status === "assinada" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {d.status}
              </Badge>
              <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5 text-xs">
                Ver PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Declarações de Ciência</h1>
          <p className="text-white/50 text-sm mt-1">Documentos de ciência do paciente por modalidade</p>
        </div>
        <Button data-testid="button-new-declaracao" className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
          <Plus className="h-4 w-4" /> Nova Declaração
        </Button>
      </div>
      <Section title="Medicamento com Registro ANVISA" items={anvisa} />
      <Section title="Uso Compassivo / Importação" items={compassivo} />
    </div>
  );
}
