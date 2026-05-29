import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, Camera, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CHECKLIST = [
  "Temperatura de conservação conferida",
  "Embalagem íntegra sem avarias",
  "Número de lote e validade verificados",
  "Quantidade conforme pedido",
  "Nota fiscal do fornecedor recebida",
  "Certificado de análise (CoA) presente",
  "Documentação alfandegária (se importado)",
  "Lacre de segurança intacto",
];

export default function Recebimento() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [validated, setValidated] = useState(false);

  const toggleCheck = (item: string) => setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  const allChecked = CHECKLIST.every((item) => checked[item]);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Recebimento</h1>
        <p className="text-white/50 text-sm mt-1">Conferência e validação farmacêutica de recebimento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Checklist */}
        <div className="lg:col-span-2 bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[#F56E0F]" />
              <h3 className="text-white font-semibold">Checklist de Conferência</h3>
            </div>
            <span className="text-white/50 text-sm">{checkedCount}/{CHECKLIST.length}</span>
          </div>

          <div className="w-full bg-white/5 rounded-full h-1.5 mb-5">
            <div className="bg-[#F56E0F] h-1.5 rounded-full transition-all" style={{ width: `${(checkedCount / CHECKLIST.length) * 100}%` }} />
          </div>

          <div className="space-y-3">
            {CHECKLIST.map((item) => (
              <label key={item} data-testid={`checkbox-recebimento-${item.slice(0, 20)}`} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={!!checked[item]}
                  onCheckedChange={() => toggleCheck(item)}
                  className="border-white/20 data-[state=checked]:bg-[#F56E0F] data-[state=checked]:border-[#F56E0F]"
                />
                <span className={cn("text-sm transition-colors", checked[item] ? "text-white/40 line-through" : "text-white/80 group-hover:text-white")}>
                  {item}
                </span>
              </label>
            ))}
          </div>

          {allChecked && !validated && (
            <Button data-testid="button-validate-recebimento" onClick={() => setValidated(true)} className="mt-6 w-full bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
              <CheckCircle className="h-4 w-4" /> Validar Recebimento
            </Button>
          )}

          {validated && (
            <div className="mt-6 bg-green-500/15 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold text-sm">Recebimento Validado</p>
                <p className="text-green-400/60 text-xs">Validado em {new Date().toLocaleDateString("pt-BR")} pelo farmacêutico</p>
              </div>
            </div>
          )}
        </div>

        {/* Fotos */}
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Camera className="h-4 w-4 text-[#F56E0F]" />
            <h3 className="text-white font-semibold">Fotos do Paciente</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Embalagem", "Lacre", "Validade", "Nota Fiscal"].map((label) => (
              <div key={label} data-testid={`photo-slot-${label}`} className="aspect-square bg-[#0F0F12] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#F56E0F]/40 transition-colors cursor-pointer group">
                <Camera className="h-6 w-6 text-white/20 group-hover:text-[#F56E0F]/50 transition-colors" />
                <span className="text-white/30 text-xs">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs text-center mt-4">Clique para adicionar foto</p>
        </div>
      </div>
    </div>
  );
}
