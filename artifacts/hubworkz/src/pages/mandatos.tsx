import { useListPacientes } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Upload, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Mandatos() {
  const { data: pacientes, isLoading } = useListPacientes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mandatos</h1>
        <p className="text-white/50 text-sm mt-1">Mandatos de representação por paciente</p>
      </div>

      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs text-white/40 uppercase tracking-wider px-5 py-3 border-b border-white/5">
          <span>Paciente</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-32 text-center">Validade</span>
          <span className="w-28 text-center">Ação</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 bg-white/5" />)}</div>
        ) : (pacientes ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <FileCheck className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/30">Nenhum paciente cadastrado</p>
          </div>
        ) : (
          (pacientes ?? []).map((p) => (
            <div key={p.id} data-testid={`row-mandato-${p.id}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <div>
                <p className="text-white font-medium">{p.nome}</p>
                <p className="text-white/40 text-xs mt-0.5">{p.cpf ?? "CPF não informado"}</p>
              </div>
              <div className="w-28 flex justify-center">
                <Badge className={cn("border text-xs gap-1",
                  p.mandato_ativo
                    ? "bg-green-500/15 text-green-400 border-green-500/20"
                    : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                )}>
                  {p.mandato_ativo ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {p.mandato_ativo ? "Ativo" : "Pendente"}
                </Badge>
              </div>
              <div className="w-32 text-center">
                <span className="text-white/40 text-xs">—</span>
              </div>
              <div className="w-28 flex justify-center">
                <Button data-testid={`button-upload-mandato-${p.id}`} variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5 gap-1.5 text-xs">
                  <Upload className="h-3 w-3" /> Upload PDF
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
